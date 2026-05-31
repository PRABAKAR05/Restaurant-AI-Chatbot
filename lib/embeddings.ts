import OpenAI from 'openai';

let openai: OpenAI | null = null;

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    if (!openai) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is missing.');
      }
      openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.replace(/\n/g, ' ').trim(),
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error(
      `Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
