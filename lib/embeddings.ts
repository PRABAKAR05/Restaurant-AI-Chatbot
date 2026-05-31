import { pipeline, env } from '@xenova/transformers';

// Skip local model caching issues and optional configs
env.allowLocalModels = false;

let embeddingPipeline: any = null;

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    if (!embeddingPipeline) {
      // Use the standard, fast all-MiniLM-L6-v2 model which has 384 dimensions
      embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }

    const output = await embeddingPipeline(text.replace(/\n/g, ' ').trim(), {
      pooling: 'mean',
      normalize: true,
    });

    return Array.from(output.data);
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error(
      `Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
