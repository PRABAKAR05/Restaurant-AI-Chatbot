import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { retrieveRelevantChunks } from '@/lib/retrieval';

export const maxDuration = 30;

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

type MessagePart = { type: string; text?: string };

type RawMessage = {
  role: 'user' | 'assistant' | 'system';
  content?: string | MessagePart[];
  text?: string;
  parts?: MessagePart[];
};

const extractText = (m: RawMessage): string => {
  if (typeof m.content === 'string') return m.content;
  if (Array.isArray(m.content))
    return m.content
      .filter((p) => p.type === 'text')
      .map((p) => p.text ?? '')
      .join('');
  if (typeof m.text === 'string') return m.text;
  if (Array.isArray(m.parts))
    return m.parts
      .filter((p) => p.type === 'text')
      .map((p) => p.text ?? '')
      .join('');
  return '';
};

export async function POST(request: Request) {
  try {
    const { messages } = await request.json() as { messages: RawMessage[] };
    console.log("INCOMING MESSAGES:", JSON.stringify(messages, null, 2));

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === 'user');

    if (!lastUserMessage) {
      return new Response(
        JSON.stringify({ error: 'No user message found' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let menuContext = '';
    try {
      const userMessageText = extractText(lastUserMessage);
      const relevantChunks = await retrieveRelevantChunks(userMessageText, 20);
      menuContext = relevantChunks.map((chunk) => chunk.content).join('\n\n');
    } catch (retrievalError) {
      console.error('Retrieval error:', retrievalError);
      menuContext = 'Menu data is currently unavailable.';
    }

    const systemPrompt = `You are a helpful and friendly restaurant assistant for "Spice Garden" — a premium Indian restaurant.

CRITICAL INSTRUCTION: You must answer customer questions based ONLY on the exact menu information provided inside the <menu_data> tags below.
DO NOT invent, guess, or hallucinate any menu items, prices, ingredients, or categories.
If the <menu_data> does not contain the answer or the items requested (for example, if they ask for "spicy beverages" and there are none in the <menu_data>), you MUST reply EXACTLY with: "I don't have that information in our menu. Please ask our staff directly or call us for more details."

Do not list numbers or items that you generated yourself. If a dish is not in the <menu_data>, it DOES NOT EXIST.

Be friendly, concise, and helpful. Use a warm, welcoming tone.
Always mention prices in ₹ where available.
Format your responses nicely with bullet points or numbered lists when listing multiple items.

<menu_data>
${menuContext}
</menu_data>`;

    const coreMessages = messages.map((m) => ({
      role: m.role,
      content: extractText(m),
    }));

    const result = streamText({
  model: groq('llama-3.1-8b-instant'),
  system: systemPrompt,
  messages: coreMessages,
});

// Debug log
result.text.then((text) => {
  console.log('AI RESPONSE TEXT:', text);
});

return result.toUIMessageStreamResponse(); // ✅ changed from toTextStreamResponse()
} catch (error) {
  console.error('Chat API error:', error);
  return new Response(
    JSON.stringify({
      error:
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred',
    }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
}