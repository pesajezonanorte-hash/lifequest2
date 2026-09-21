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

// Groq — OpenAI-compatible, very generous free tier (14,400 req/day)
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';
const GEMINI_API_URL =
  process.env.GEMINI_API_URL ||
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_MAX_RETRIES = 3;

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-lite-preview:free';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export function hasAIProvider(): boolean {
  return Boolean(GROQ_API_KEY || GEMINI_API_KEY || OPENROUTER_API_KEY || OPENAI_API_KEY);
}

export async function generateText(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
  const errors: string[] = [];

  // 1. Prioritize GROQ (100% Free: 14,400 requests/day)
  if (GROQ_API_KEY) {
    try {
      return await generateWithOpenAICompat(messages, options, GROQ_API_URL, GROQ_API_KEY, GROQ_MODEL);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[AI_GROQ_FALLBACK]', msg);
      errors.push(`Groq: ${msg}`);
    }
  }

  // 2. Fallback to Gemini API Studio (100% Free: 1,500 requests/day)
  if (GEMINI_API_KEY) {
    try {
      return await generateWithGemini(messages, options);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[AI_GEMINI_FALLBACK]', msg);
      errors.push(`Gemini: ${msg}`);
    }
  }

  // 3. Fallback to OpenRouter (Free models)
  if (OPENROUTER_API_KEY) {
    try {
      return await generateWithOpenAICompat(messages, options, OPENROUTER_API_URL, OPENROUTER_API_KEY, OPENROUTER_MODEL);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[AI_OPENROUTER_FALLBACK]', msg);
      errors.push(`OpenRouter: ${msg}`);
    }
  }

  // 4. Fallback to OpenAI
  if (OPENAI_API_KEY) {
    try {
      return await generateWithOpenAICompat(messages, options, OPENAI_API_URL, OPENAI_API_KEY, OPENAI_MODEL);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[AI_OPENAI_FALLBACK]', msg);
      errors.push(`OpenAI: ${msg}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Fallaron los proveedores de IA configurados: ${errors.join(' | ')}`);
  }

  throw new Error('No hay ningún proveedor de IA configurado. Por favor define GROQ_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY o OPENAI_API_KEY en Vercel.');
}

async function generateWithOpenAICompat(
  messages: ChatMessage[],
  options: ChatOptions,
  apiUrl: string,
  apiKey: string,
  model: string
): Promise<string> {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.8,
      max_tokens: options.maxTokens ?? 300,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message ?? `HTTP ${response.status}`;
    throw new Error(`AI ${response.status}: ${message}`);
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('El proveedor de IA no devolvió texto');
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
