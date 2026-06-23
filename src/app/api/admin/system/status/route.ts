import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { embed, GEMINI_CHAT_MODEL, GEMINI_EMBED_MODEL } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 30;

interface CheckResult {
  ok: boolean;
  error?: string;
  ms: number;
}

interface DbCheck extends CheckResult {
  counts: Record<string, number>;
  total: number;
}

interface GeminiCheck extends CheckResult {
  chat_model: string;
  embed_model: string;
}

interface StorageCheck extends CheckResult {
  bucket_exists: boolean;
  object_count: number | null;
}

async function checkDb(): Promise<DbCheck> {
  const t0 = Date.now();
  try {
    const sb = createServiceClient();
    const tables = ["documents", "chunks", "chat_logs", "campaigns"];
    const counts: Record<string, number> = {};
    for (const t of tables) {
      const { count, error } = await sb
        .from(t)
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      counts[t] = count ?? 0;
    }
    return {
      ok: true,
      ms: Date.now() - t0,
      counts,
      total: Object.values(counts).reduce((a, b) => a + b, 0),
    };
  } catch (e) {
    return {
      ok: false,
      ms: Date.now() - t0,
      error: e instanceof Error ? e.message : "unknown",
      counts: {},
      total: 0,
    };
  }
}

async function checkGemini(): Promise<GeminiCheck> {
  const t0 = Date.now();
  try {
    const [vec] = await embed(["ping"]);
    if (!vec?.length) throw new Error("empty embedding");
    return {
      ok: true,
      ms: Date.now() - t0,
      chat_model: GEMINI_CHAT_MODEL,
      embed_model: GEMINI_EMBED_MODEL,
    };
  } catch (e) {
    return {
      ok: false,
      ms: Date.now() - t0,
      error: e instanceof Error ? e.message : "unknown",
      chat_model: GEMINI_CHAT_MODEL,
      embed_model: GEMINI_EMBED_MODEL,
    };
  }
}

async function checkStorage(): Promise<StorageCheck> {
  const t0 = Date.now();
  try {
    const sb = createServiceClient();
    const { data: buckets, error } = await sb.storage.listBuckets();
    if (error) throw error;
    const found = buckets?.find((b) => b.name === "documents");
    if (!found) {
      return {
        ok: false,
        ms: Date.now() - t0,
        bucket_exists: false,
        object_count: null,
        error: "documents bucket missing",
      };
    }
    const { data: objs } = await sb.storage.from("documents").list("", {
      limit: 1000,
    });
    return {
      ok: true,
      ms: Date.now() - t0,
      bucket_exists: true,
      object_count: objs?.length ?? 0,
    };
  } catch (e) {
    return {
      ok: false,
      ms: Date.now() - t0,
      error: e instanceof Error ? e.message : "unknown",
      bucket_exists: false,
      object_count: null,
    };
  }
}

export async function GET() {
  const [db, gemini, storage] = await Promise.all([
    checkDb(),
    checkGemini(),
    checkStorage(),
  ]);
  return NextResponse.json({
    checked_at: new Date().toISOString(),
    db,
    gemini,
    storage,
    all_ok: db.ok && gemini.ok && storage.ok,
  });
}
