type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';
const GEMINI_API_URL =
  process.env.GEMINI_API_URL ||
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_MAX_RETRIES = 3;

export function hasAIProvider(): boolean {
  return Boolean(OPENAI_API_KEY || GEMINI_API_KEY);
}

export async function generateText(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
  if (OPENAI_API_KEY) {
    return generateWithOpenAI(messages, options);
  }

  if (GEMINI_API_KEY) {
    return generateWithGemini(messages, options);
  }

  throw new Error('No hay proveedor de IA configurado. Define OPENAI_API_KEY o GEMINI_API_KEY.');
}

async function generateWithOpenAI(messages: ChatMessage[], options: ChatOptions): Promise<string> {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      temperature: options.temperature ?? 0.8,
      max_tokens: options.maxTokens ?? 300,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message ?? `HTTP ${response.status}`;
    throw new Error(`OpenAI ${response.status}: ${message}`);
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('OpenAI no devolvió texto en choices[0].message.content');
  }

  return text;
}

async function generateWithGemini(messages: ChatMessage[], options: ChatOptions): Promise<string> {
  const systemMessages = messages.filter((message) => message.role === 'system');
  const nonSystemMessages = messages.filter((message) => message.role !== 'system');

  const contents = nonSystemMessages.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }));

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.8,
      maxOutputTokens: options.maxTokens ?? 300,
    },
  };

  if (systemMessages.length > 0) {
    body.systemInstruction = {
      parts: [{ text: systemMessages.map((message) => message.content).join('\n\n') }],
    };
  }

  let response: Response | null = null;
  let data: any = null;

  for (let attempt = 0; attempt <= GEMINI_MAX_RETRIES; attempt += 1) {
    response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    data = await response.json();
    if (response.ok) break;

    if (response.status !== 429 || attempt === GEMINI_MAX_RETRIES) {
      const message = data?.error?.message ?? `HTTP ${response.status}`;
      throw new Error(`Gemini ${response.status}: ${message}`);
    }

    await sleep(1500 * (attempt + 1));
  }

  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('Gemini no devolvió texto en candidates[0].content.parts');
  }

  return text;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
