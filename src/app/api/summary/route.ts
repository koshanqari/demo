import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  aggregateKpis,
  buildPerformance,
  buildTrend,
  type Campaign,
} from "@/lib/analytics";
import { generate } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 30;

type Tone = "executive" | "detailed" | "casual";

const TONE_GUIDE: Record<Tone, string> = {
  executive:
    "Boardroom voice. 3-4 short sentences. Lead with the headline number. End with a single clear recommendation. No fluff.",
  detailed:
    "Analytical voice. 5-7 sentences. Cover delivery, read, click and reply rates with comparisons. Call out best & worst campaigns by name. Include one specific recommendation.",
  casual:
    "Friendly Slack message. 3-5 sentences. Plain language, no jargon, a touch of warmth. End with one suggestion as a question.",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const tone = (body.tone as Tone) ?? "executive";
    const days = Math.max(1, Math.min(365, Number(body.days ?? 60)));

    if (!["executive", "detailed", "casual"].includes(tone)) {
      return NextResponse.json({ error: "invalid tone" }, { status: 400 });
    }

    const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
    const sb = createServiceClient();
    const { data, error } = await sb
      .from("campaigns")
      .select(
        "id, name, template_name, sent_at, audience_size, delivered, read_count, clicked, replied, failed, source",
      )
      .gte("sent_at", since)
      .order("sent_at", { ascending: false });
    if (error) throw error;

    const rows = (data ?? []) as Campaign[];
    if (!rows.length) {
      return NextResponse.json({
        summary:
          "No campaigns in the selected window. Seed demo data from the admin panel to see this come alive.",
        tone,
      });
    }

    const kpis = aggregateKpis(rows);
    const trend = buildTrend(rows);
    const perf = buildPerformance(rows);

    const best = [...perf].sort((a, b) => b.readRate - a.readRate)[0];
    const worst = [...perf].sort((a, b) => a.readRate - b.readRate)[0];
    const mostClicked = [...perf].sort((a, b) => b.ctr - a.ctr)[0];

    const context = {
      window_days: days,
      totals: {
        campaigns: kpis.campaigns,
        audience: kpis.audience,
        delivered: kpis.delivered,
        read: kpis.read,
        clicked: kpis.clicked,
        replied: kpis.replied,
        failed: kpis.failed,
      },
      rates_pct: {
        delivery: kpis.deliveryRate,
        read: kpis.readRate,
        ctr: kpis.ctr,
        reply: kpis.replyRate,
        failure: kpis.failureRate,
      },
      best_campaign: best && {
        name: best.name,
        read_rate_pct: best.readRate,
      },
      worst_campaign: worst && {
        name: worst.name,
        read_rate_pct: worst.readRate,
      },
      highest_ctr: mostClicked && {
        name: mostClicked.name,
        ctr_pct: mostClicked.ctr,
      },
      trend_first_last: {
        from: trend[0]?.date,
        to: trend.at(-1)?.date,
        delivered_first: trend[0]?.delivered,
        delivered_last: trend.at(-1)?.delivered,
      },
    };

    const system = `You write WhatsApp campaign performance summaries for a B2B SaaS client (Concentrix style).
Tone: ${TONE_GUIDE[tone]}
Rules:
- Use ONLY the numbers in the data block. Never invent metrics.
- Always reference percentages with the % symbol.
- Refer to specific campaign names where helpful.
- Output plain prose only (no headings, no bullet points unless 'detailed').`;

    const prompt = `Summarize the campaign performance for the last ${days} days using this data:

${JSON.stringify(context, null, 2)}`;

    const summary = await generate(prompt, system);
    return NextResponse.json({ summary, tone, kpis });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[summary]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
