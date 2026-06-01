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

async function generateEmbeddingViaOpenAI(
  text: string
): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY for OpenAI embeddings fallback.');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.replace(/\n/g, ' ').trim(),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI embeddings error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const embedding = data?.data?.[0]?.embedding;

  if (!Array.isArray(embedding)) {
    throw new Error('OpenAI embeddings response was invalid.');
  }

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
    // Completely hide from Vercel's bundler by splitting the string so AST analyzers fail to find it
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const getTransformers = new Function(
      "return import('@" + "xen" + "ova/trans" + "formers')"
    );
    const { pipeline, env } = await getTransformers();

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
const isProductionRuntime =
  process.env.NODE_ENV === 'production' ||
  process.env.VERCEL === '1' ||
  typeof process.env.VERCEL_ENV !== 'undefined';

export async function generateEmbedding(
  text: string
): Promise<number[]> {
  try {
    if (process.env.HUGGINGFACE_API_KEY) {
      // Vercel / cloud mode with Hugging Face
      return await generateEmbeddingViaAPI(text);
    }

    if (process.env.OPENAI_API_KEY) {
      // Fallback for cloud deployments that use OpenAI embeddings
      return await generateEmbeddingViaOpenAI(text);
    }

    if (isProductionRuntime) {
      throw new Error(
        'No cloud embedding provider configured. Set HUGGINGFACE_API_KEY or OPENAI_API_KEY in Vercel, or run locally with a key.'
      );
    }

    // Local development mode
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