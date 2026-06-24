import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { extractPdfPages } from "@/lib/pdf";
import { chunkText } from "@/lib/chunk";
import { embed, getLlmConfig } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" } as const;

function err(message: string, status = 500, extra: Record<string, unknown> = {}) {
  return NextResponse.json(
    { error: message, ...extra },
    { status, headers: NO_STORE },
  );
}

function ok<T>(body: T) {
  return NextResponse.json(body, { headers: NO_STORE });
}

interface ApiErrorShape {
  status?: number;
  message?: string;
  error?: { code?: number; message?: string; status?: string };
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return err("No file", 400);
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return err("PDF only", 400);
    }

    const title = (form.get("title") as string) || file.name.replace(/\.pdf$/i, "");
    const buf = Buffer.from(await file.arrayBuffer());

    const pages = await extractPdfPages(buf);
    if (!pages.length || pages.every((p) => !p.text)) {
      return err("PDF has no extractable text (scanned image?)", 400);
    }

    const chunks = chunkText(pages);
    if (!chunks.length) {
      return err("Could not chunk PDF", 400);
    }

    // Batch embed (Gemini supports batching; cap batch size)
    const BATCH = 50;
    const vectors: number[][] = [];
    for (let i = 0; i < chunks.length; i += BATCH) {
      const batch = chunks.slice(i, i + BATCH).map((c) => c.text);
      const vs = await embed(batch);
      vectors.push(...vs);
    }

    const sb = createServiceClient();

    // Upload raw PDF to storage
    const storagePath = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: upErr } = await sb.storage
      .from("documents")
      .upload(storagePath, buf, { contentType: "application/pdf", upsert: false });
    if (upErr) throw upErr;

    // Insert document row
    const { data: doc, error: docErr } = await sb
      .from("documents")
      .insert({
        title,
        filename: file.name,
        storage_path: storagePath,
        page_count: pages.length,
        chunk_count: chunks.length,
        embed_model: (await getLlmConfig()).embed_model,
        status: "ready",
      })
      .select()
      .single();
    if (docErr) throw docErr;

    // Insert chunks
    const rows = chunks.map((c, i) => ({
      document_id: doc.id,
      chunk_index: c.index,
      page: c.page,
      content: c.text,
      embedding: vectors[i],
    }));

    // Insert in batches to keep payload small
    const INS = 200;
    for (let i = 0; i < rows.length; i += INS) {
      const { error } = await sb.from("chunks").insert(rows.slice(i, i + INS));
      if (error) throw error;
    }

    return ok({
      id: doc.id,
      title: doc.title,
      pages: pages.length,
      chunks: chunks.length,
    });
  } catch (e) {
    console.error("[upload]", e);
    // Detect Gemini rate-limit and translate to a friendly 429
    const raw = e instanceof Error ? e.message : String(e);
    const ge = e as ApiErrorShape;
    const code = ge?.error?.code ?? ge?.status;
    if (code === 429 || /RESOURCE_EXHAUSTED|rate-limit|quota/i.test(raw)) {
      const retry = /retry in ([\d.]+)s/i.exec(raw)?.[1];
      const wait = retry ? Math.ceil(Number(retry)) : 60;
      return err(
        `Gemini embedding quota hit (free tier allows ~100 requests / minute). Try again in ${wait}s, or paste a different API key in Admin → System.`,
        429,
        { retry_after_seconds: wait },
      );
    }
    return err(raw || "Upload failed", 500);
  }
}
