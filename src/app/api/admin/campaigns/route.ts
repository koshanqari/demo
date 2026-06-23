import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const COLUMNS =
  "id, name, template_name, sent_at, audience_size, delivered, read_count, clicked, replied, failed, source, created_at";

interface CampaignPayload {
  name?: unknown;
  template_name?: unknown;
  sent_at?: unknown;
  audience_size?: unknown;
  delivered?: unknown;
  read_count?: unknown;
  clicked?: unknown;
  replied?: unknown;
  failed?: unknown;
  source?: unknown;
}

function coerce(body: CampaignPayload) {
  const toInt = (v: unknown, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.round(n)) : fallback;
  };
  return {
    name: String(body.name ?? "").trim().slice(0, 200),
    template_name: body.template_name
      ? String(body.template_name).trim().slice(0, 200)
      : null,
    sent_at: body.sent_at ? new Date(String(body.sent_at)).toISOString() : new Date().toISOString(),
    audience_size: toInt(body.audience_size),
    delivered: toInt(body.delivered),
    read_count: toInt(body.read_count),
    clicked: toInt(body.clicked),
    replied: toInt(body.replied),
    failed: toInt(body.failed),
    source: ["manual", "csv", "webhook"].includes(String(body.source))
      ? String(body.source)
      : "manual",
  };
}

export async function GET() {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("campaigns")
    .select(COLUMNS)
    .order("sent_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const row = coerce(body);
  if (!row.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const sb = createServiceClient();
  const { data, error } = await sb.from("campaigns").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data });
}
