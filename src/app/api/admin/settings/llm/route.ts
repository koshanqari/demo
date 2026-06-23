import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  bustLlmCache,
  CHAT_MODELS,
  EMBED_MODELS,
  getLlmConfig,
} from "@/lib/gemini";

export const runtime = "nodejs";

function mask(key: string) {
  if (!key) return "";
  if (key.length <= 10) return "•".repeat(key.length);
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

export async function GET() {
  const cfg = await getLlmConfig();
  const sb = createServiceClient();
  const { data } = await sb
    .from("app_settings")
    .select("value, updated_at")
    .eq("key", "llm")
    .maybeSingle();

  const stored = (data?.value ?? {}) as Partial<{
    api_key: string;
    chat_model: string;
    embed_model: string;
  }>;

  return NextResponse.json({
    active: {
      api_key_masked: mask(cfg.api_key),
      chat_model: cfg.chat_model,
      embed_model: cfg.embed_model,
      source: cfg.source,
    },
    has_db_key: Boolean(stored.api_key),
    has_db_chat_model: Boolean(stored.chat_model),
    has_db_embed_model: Boolean(stored.embed_model),
    updated_at: data?.updated_at ?? null,
    options: { chat_models: CHAT_MODELS, embed_models: EMBED_MODELS },
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const sb = createServiceClient();

  const { data: existing } = await sb
    .from("app_settings")
    .select("value")
    .eq("key", "llm")
    .maybeSingle();
  const current = (existing?.value ?? {}) as Record<string, unknown>;

  const next: Record<string, unknown> = { ...current };

  if (typeof body.api_key === "string") {
    const k = body.api_key.trim();
    if (k) next.api_key = k;
    else delete next.api_key;
  }
  if (typeof body.chat_model === "string") {
    if ((CHAT_MODELS as readonly string[]).includes(body.chat_model)) {
      next.chat_model = body.chat_model;
    } else {
      return NextResponse.json(
        { error: `unknown chat_model "${body.chat_model}"` },
        { status: 400 },
      );
    }
  }
  if (typeof body.embed_model === "string") {
    if ((EMBED_MODELS as readonly string[]).includes(body.embed_model)) {
      next.embed_model = body.embed_model;
    } else {
      return NextResponse.json(
        { error: `unknown embed_model "${body.embed_model}"` },
        { status: 400 },
      );
    }
  }

  const { error } = await sb.from("app_settings").upsert({
    key: "llm",
    value: next,
    updated_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  bustLlmCache();
  const cfg = await getLlmConfig();
  return NextResponse.json({
    ok: true,
    active: {
      api_key_masked: mask(cfg.api_key),
      chat_model: cfg.chat_model,
      embed_model: cfg.embed_model,
      source: cfg.source,
    },
  });
}

export async function DELETE() {
  const sb = createServiceClient();
  const { error } = await sb
    .from("app_settings")
    .upsert({ key: "llm", value: {}, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  bustLlmCache();
  const cfg = await getLlmConfig();
  return NextResponse.json({
    ok: true,
    active: {
      api_key_masked: mask(cfg.api_key),
      chat_model: cfg.chat_model,
      embed_model: cfg.embed_model,
      source: cfg.source,
    },
  });
}
