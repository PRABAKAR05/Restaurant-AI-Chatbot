import { HfInference } from '@huggingface/inference';

let hf: HfInference | null = null;

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    if (!hf) {
      if (!process.env.HUGGINGFACE_API_KEY) {
        throw new Error('HUGGINGFACE_API_KEY environment variable is missing.');
      }
      hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    }

    const response = await hf.featureExtraction({
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      inputs: text.replace(/\n/g, ' ').trim(),
    });

    // The output is typically a 1D array of numbers for this model
    return Array.from(response as number[]);
  } catch (error) {
    console.error('Error generating embedding with Hugging Face:', error);
    throw new Error(
      `Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
