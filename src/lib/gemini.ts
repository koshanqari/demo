import { GoogleGenAI } from "@google/genai";

export const GEMINI_CHAT_MODEL = process.env.GEMINI_CHAT_MODEL ?? "gemini-2.5-flash";
export const GEMINI_EMBED_MODEL = process.env.GEMINI_EMBED_MODEL ?? "gemini-embedding-001";
export const EMBED_DIM = 768;

let _client: GoogleGenAI | null = null;
export function gemini() {
  if (!_client) {
    _client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }
  return _client;
}

export async function embed(texts: string[]): Promise<number[][]> {
  const ai = gemini();
  const res = await ai.models.embedContent({
    model: GEMINI_EMBED_MODEL,
    contents: texts,
    config: { outputDimensionality: EMBED_DIM },
  });
  return (res.embeddings ?? []).map((e) => e.values ?? []);
}

export async function generate(prompt: string, system?: string): Promise<string> {
  const ai = gemini();
  const res = await ai.models.generateContent({
    model: GEMINI_CHAT_MODEL,
    contents: prompt,
    config: system ? { systemInstruction: system } : undefined,
  });
  return res.text ?? "";
}
