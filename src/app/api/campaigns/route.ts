import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  aggregateKpis,
  buildPerformance,
  buildTrend,
  type Campaign,
} from "@/lib/analytics";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const days = Math.max(1, Math.min(365, Number(sp.get("days") ?? 60)));
  const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();

  const sb = createServiceClient();
  const { data, error } = await sb
    .from("campaigns")
    .select(
      "id, name, template_name, sent_at, audience_size, delivered, read_count, clicked, replied, failed, source",
    )
    .gte("sent_at", since)
    .order("sent_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as Campaign[];
  return NextResponse.json({
    days,
    campaigns: rows,
    kpis: aggregateKpis(rows),
    trend: buildTrend(rows),
    performance: buildPerformance(rows),
  });
}
