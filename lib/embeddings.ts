/**
 * Embeddings module — dual mode:
 *  - LOCAL (no HUGGINGFACE_API_KEY): uses @xenova/transformers locally
 *  - VERCEL (HUGGINGFACE_API_KEY set): uses Hugging Face Inference API
 *
 * Both produce 384-dimensional vectors using all-MiniLM-L6-v2.
 */

// ─────────────────────────────────────────────────────────────
// Vercel / Cloud path (Hugging Face API)
// ─────────────────────────────────────────────────────────────
async function generateEmbeddingViaAPI(
  text: string
): Promise<number[]> {
  const apiKey = process.env.HUGGINGFACE_API_KEY!;

  const response = await fetch(
    'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text.replace(/\n/g, ' ').trim(),
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();

    throw new Error(
      `HuggingFace API error (${response.status}): ${err}`
    );
  }

  const data = await response.json();

  // Hugging Face may return:
  // [0.1, 0.2, 0.3]
  // OR
  // [[0.1, 0.2, 0.3]]

  const embedding = Array.isArray(data[0])
    ? data[0]
    : data;

  return embedding.map(Number);
}

// ─────────────────────────────────────────────────────────────
// Local path (Xenova transformers)
// ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let localPipeline: any = null;

async function generateEmbeddingLocally(
  text: string
): Promise<number[]> {
  if (!localPipeline) {
    // Prevent Next.js bundling huge model in Vercel
    const moduleName = '@xenova/transformers';

    const { pipeline, env } = await import(
      /* webpackIgnore: true */ moduleName
    );

    env.allowLocalModels = false;

    localPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
  }

  const output = await localPipeline(
    text.replace(/\n/g, ' ').trim(),
    {
      pooling: 'mean',
      normalize: true,
    }
  );

  return Array.from(output.data as number[]);
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────
export async function generateEmbedding(
  text: string
): Promise<number[]> {
  try {
    if (process.env.HUGGINGFACE_API_KEY) {
      // Vercel / cloud mode
      return await generateEmbeddingViaAPI(text);
    }

    // Local mode
    return await generateEmbeddingLocally(text);
  } catch (error) {
    console.error('Error generating embedding:', error);

    throw new Error(
      `Failed to generate embedding: ${
        error instanceof Error
          ? error.message
          : 'Unknown error'
      }`
    );
  }
}