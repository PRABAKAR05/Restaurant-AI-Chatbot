import { NextRequest, NextResponse } from 'next/server';
import { parsePDFToChunks } from '@/lib/pdf-parser';
import { generateEmbedding } from '@/lib/embeddings';
import { getSupabaseAdmin } from '@/lib/supabase';
import pLimit from 'p-limit';

export const maxDuration = 60;

const MAX_FILE_SIZE_MB = 10;
const CONCURRENCY_LIMIT = 5;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const password = formData.get('password') as string | null;

    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Invalid admin password' },
        { status: 401 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const chunks = await parsePDFToChunks(buffer);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'No text content found in the PDF' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error: deleteError } = await supabaseAdmin
      .from('menu_items')
      .delete()
      .eq('metadata->>source', file.name);

    if (deleteError) {
      console.error('Error clearing existing data for file:', deleteError);
      return NextResponse.json(
        { error: 'Failed to clear existing data before re-indexing.' },
        { status: 500 }
      );
    }

    const limit = pLimit(CONCURRENCY_LIMIT);
    const failedChunks: number[] = [];

    const promises = chunks.map((chunk, i) =>
      limit(async () => {
        try {
          const embedding = await generateEmbedding(chunk);

          const { error } = await supabaseAdmin.from('menu_items').insert({
            content: chunk,
            embedding,
            metadata: {
              source: file.name,
              chunk_index: i,
              total_chunks: chunks.length,
            },
          });

          if (error) {
            console.error(`Error inserting chunk ${i}:`, error);
            failedChunks.push(i);
            return false;
          }

          return true;
        } catch (err) {
          console.error(`Error processing chunk ${i}:`, err);
          failedChunks.push(i);
          return false;
        }
      })
    );

    const results = await Promise.all(promises);
    const indexedCount = results.filter(Boolean).length;
    const failedCount = chunks.length - indexedCount;

    if (failedCount > 0 && indexedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'All chunks failed to index. Please try again.',
          chunksIndexed: 0,
          totalChunks: chunks.length,
          fileName: file.name,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      chunksIndexed: indexedCount,
      totalChunks: chunks.length,
      fileName: file.name,
      ...(failedCount > 0 && {
        warning: `${failedCount} of ${chunks.length} chunks failed to index and were skipped.`,
      }),
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}