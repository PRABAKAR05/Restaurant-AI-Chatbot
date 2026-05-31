import { NextRequest, NextResponse } from 'next/server';
import { parsePDFToChunks } from '@/lib/pdf-parser';
import { generateEmbedding } from '@/lib/embeddings';
import { supabaseAdmin } from '@/lib/supabase';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const password = formData.get('password') as string | null;

    // Verify admin password
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

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF into chunks
    const chunks = await parsePDFToChunks(buffer);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'No text content found in the PDF' },
        { status: 400 }
      );
    }

    // Generate embeddings and upsert into Supabase concurrently
    let indexedCount = 0;

    const promises = chunks.map(async (chunk, i) => {
      try {
        const embedding = await generateEmbedding(chunk);

        const { error } = await supabaseAdmin.from('menu_items').insert({
          content: chunk,
          embedding: embedding,
          metadata: {
            source: file.name,
            chunk_index: i,
            total_chunks: chunks.length,
          },
        });

        if (error) {
          console.error(`Error inserting chunk ${i}:`, error);
          return false;
        }

        return true;
      } catch (embeddingError) {
        console.error(`Error processing chunk ${i}:`, embeddingError);
        return false;
      }
    });

    const results = await Promise.all(promises);
    indexedCount = results.filter((success) => success).length;

    return NextResponse.json({
      success: true,
      chunksIndexed: indexedCount,
      totalChunks: chunks.length,
      fileName: file.name,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
