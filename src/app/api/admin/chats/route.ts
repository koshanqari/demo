import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const documentId = sp.get("document_id");
  const limit = Math.max(1, Math.min(500, Number(sp.get("limit") ?? 200)));

  const sb = createServiceClient();
  let query = sb
    .from("chat_logs")
    .select("id, document_id, question, answer, citations, model, latency_ms, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (documentId && documentId !== "all") {
    if (documentId === "none") query = query.is("document_id", null);
    else query = query.eq("document_id", documentId);
  }

  const { data: logs, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Resolve document titles for any non-null document_id
  const docIds = [...new Set((logs ?? []).map((l) => l.document_id).filter(Boolean))];
  let docMap: Record<string, { title: string; filename: string }> = {};
  if (docIds.length) {
    const { data: docs } = await sb
      .from("documents")
      .select("id, title, filename")
      .in("id", docIds);
    docMap = Object.fromEntries(
      (docs ?? []).map((d) => [
        d.id,
        { title: d.title as string, filename: d.filename as string },
      ]),
    );
  }

  return NextResponse.json({
    logs: (logs ?? []).map((l) => ({
      ...l,
      document: l.document_id ? docMap[l.document_id] ?? null : null,
    })),
  });
}
