import { GoogleGenAI } from "@google/genai";
import { createServiceClient } from "@/lib/supabase/server";

export const EMBED_DIM = 768;

export interface LlmConfig {
  api_key: string;
  chat_model: string;
  embed_model: string;
  source: "db" | "env" | "mixed";
}

export const CHAT_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
] as const;

export const EMBED_MODELS = ["gemini-embedding-001", "text-embedding-004"] as const;

function envConfig() {
  return {
    api_key: process.env.GEMINI_API_KEY ?? "",
    chat_model: process.env.GEMINI_CHAT_MODEL ?? "gemini-2.5-flash-lite",
    embed_model: process.env.GEMINI_EMBED_MODEL ?? "gemini-embedding-001",
  };
}

let _cache: { config: LlmConfig; expires: number } | null = null;
const CACHE_TTL_MS = 30_000;

export async function getLlmConfig(): Promise<LlmConfig> {
  if (_cache && _cache.expires > Date.now()) return _cache.config;
  const env = envConfig();
  let source: LlmConfig["source"] = "env";
  let stored: Partial<LlmConfig> = {};

  try {
    const sb = createServiceClient();
    const { data } = await sb
      .from("app_settings")
      .select("value")
      .eq("key", "llm")
      .maybeSingle();
    if (data?.value && typeof data.value === "object") {
      stored = data.value as Partial<LlmConfig>;
      if (Object.keys(stored).length) source = "mixed";
      if (
        stored.api_key &&
        stored.chat_model &&
        stored.embed_model
      ) {
        source = "db";
      }
    }
  } catch {
    // db unreachable — fall back to env silently
  }

  const config: LlmConfig = {
    api_key: stored.api_key || env.api_key,
    chat_model: stored.chat_model || env.chat_model,
    embed_model: stored.embed_model || env.embed_model,
    source,
  };
  _cache = { config, expires: Date.now() + CACHE_TTL_MS };
  return config;
}

export function bustLlmCache() {
  _cache = null;
}

function client(apiKey: string) {
  return new GoogleGenAI({ apiKey });
}

export async function embed(texts: string[]): Promise<number[][]> {
  const cfg = await getLlmConfig();
  if (!cfg.api_key) throw new Error("No Gemini API key configured");
  const res = await client(cfg.api_key).models.embedContent({
    model: cfg.embed_model,
    contents: texts,
    config: { outputDimensionality: EMBED_DIM },
  });
  return (res.embeddings ?? []).map((e) => e.values ?? []);
}

export async function generate(prompt: string, system?: string): Promise<string> {
  const cfg = await getLlmConfig();
  if (!cfg.api_key) throw new Error("No Gemini API key configured");
  const res = await client(cfg.api_key).models.generateContent({
    model: cfg.chat_model,
    contents: prompt,
    config: system ? { systemInstruction: system } : undefined,
  });
  return res.text ?? "";
}
