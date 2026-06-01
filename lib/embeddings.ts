/**
 * Embeddings module — dual mode:
 *  - LOCAL (no HUGGINGFACE_API_KEY):  uses @xenova/transformers running on-device (no internet needed)
 *  - VERCEL (HUGGINGFACE_API_KEY set): calls HuggingFace Inference REST API (fast, no model download)
 *
 * Both produce 384-dimensional vectors using all-MiniLM-L6-v2.
 */

// ─── Vercel / Cloud path ──────────────────────────────────────────────────────
async function generateEmbeddingViaAPI(text: string): Promise<number[]> {
  const apiKey = process.env.HUGGINGFACE_API_KEY!;
  const response = await fetch(
    'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text.replace(/\n/g, ' ').trim() }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`HuggingFace API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  return Array.from(data as number[]);
}

// ─── Local path (Xenova – runs on device, no internet required) ───────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let localPipeline: any = null;

async function generateEmbeddingLocally(text: string): Promise<number[]> {
  if (!localPipeline) {
    // Hide from Next.js bundler so Vercel doesn't try to package this 100MB library
    const moduleName = '@xenova/transformers';
    const { pipeline, env } = await import(/* webpackIgnore: true */ moduleName);
    env.allowLocalModels = false; // always fetch from HF Hub on first run, cached after
    localPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
  }

  const output = await localPipeline(text.replace(/\n/g, ' ').trim(), {
    pooling: 'mean',
    normalize: true,
  });

  return Array.from(output.data as number[]);
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    if (process.env.HUGGINGFACE_API_KEY) {
      // Running on Vercel or any host with the key set → use fast cloud API
      return await generateEmbeddingViaAPI(text);
    } else {
      // Running locally without the key → use on-device model (downloads once, ~25 MB)
      return await generateEmbeddingLocally(text);
    }
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error(
      `Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
