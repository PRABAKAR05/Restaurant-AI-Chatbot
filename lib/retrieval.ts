import { supabaseAdmin } from './supabase';
import { generateEmbedding } from './embeddings';

export interface RetrievedChunk {
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export async function retrieveRelevantChunks(
  query: string,
  topK: number = 5
): Promise<RetrievedChunk[]> {
  try {
    const queryEmbedding = await generateEmbedding(query);

    const { data, error } = await supabaseAdmin.rpc('match_menu_items', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: topK,
    });

    if (error) {
      console.error('Error retrieving chunks:', error);
      throw new Error(`Supabase RPC error: ${error.message}`);
    }

    return (data || []).map((item: { content: string; metadata: Record<string, unknown>; similarity: number }) => ({
      content: item.content,
      metadata: item.metadata,
      similarity: item.similarity,
    }));
  } catch (error) {
    console.error('Error in retrieveRelevantChunks:', error);
    throw error;
  }
}
