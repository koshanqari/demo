import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const NUMERIC_FIELDS = [
  "audience_size",
  "delivered",
  "read_count",
  "clicked",
  "replied",
  "failed",
] as const;

const SOURCES = new Set(["manual", "csv", "webhook"]);

function buildPatch(body: Record<string, unknown>) {
  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string") patch.name = body.name.trim().slice(0, 200);
  if ("template_name" in body) {
    patch.template_name = body.template_name
      ? String(body.template_name).trim().slice(0, 200)
      : null;
  }
  if (body.sent_at) patch.sent_at = new Date(String(body.sent_at)).toISOString();
  for (const k of NUMERIC_FIELDS) {
    if (k in body) {
      const n = Number(body[k]);
      patch[k] = Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
    }
  }
  if (typeof body.source === "string" && SOURCES.has(body.source)) {
    patch.source = body.source;
  }
  return patch;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const patch = buildPatch(body);
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "no valid fields" }, { status: 400 });
  }
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("campaigns")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = createServiceClient();
  const { error } = await sb.from("campaigns").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
