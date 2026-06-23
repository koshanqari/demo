import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const TEMPLATES = [
  { name: "Diwali Sale 2025", template: "festive_offer_v3", tone: "promo" },
  { name: "Welcome Onboarding", template: "welcome_v2", tone: "transactional" },
  { name: "Cart Abandonment Reminder", template: "cart_v4", tone: "promo" },
  { name: "Order Shipped", template: "order_shipped_v1", tone: "transactional" },
  { name: "Loyalty Tier Upgrade", template: "loyalty_v1", tone: "promo" },
  { name: "Feedback Survey — Q3", template: "feedback_v2", tone: "engagement" },
  { name: "New Product Drop", template: "launch_v2", tone: "promo" },
  { name: "Flash Sale 12hr", template: "flash_v1", tone: "promo" },
  { name: "Renewal Reminder", template: "renewal_v3", tone: "transactional" },
  { name: "Re-engagement", template: "winback_v2", tone: "engagement" },
  { name: "Service Appointment", template: "service_v1", tone: "transactional" },
  { name: "Referral Bonus", template: "referral_v1", tone: "promo" },
  { name: "Policy Update Notice", template: "policy_v2", tone: "transactional" },
  { name: "Black Friday Teaser", template: "teaser_v1", tone: "promo" },
  { name: "Customer Story Drip", template: "story_v1", tone: "engagement" },
  { name: "App Update Available", template: "update_v1", tone: "transactional" },
  { name: "Cross-sell Bundle", template: "bundle_v1", tone: "promo" },
  { name: "Birthday Coupon", template: "birthday_v2", tone: "promo" },
  { name: "Webinar Invite", template: "webinar_v1", tone: "engagement" },
  { name: "Year-end Recap", template: "recap_v1", tone: "engagement" },
];

const BENCHMARKS = {
  promo: { delivery: 0.94, read: 0.78, ctr: 0.18, reply: 0.04, failure: 0.04 },
  transactional: { delivery: 0.98, read: 0.88, ctr: 0.32, reply: 0.06, failure: 0.015 },
  engagement: { delivery: 0.96, read: 0.7, ctr: 0.12, reply: 0.09, failure: 0.025 },
};

function jitter(base: number, spread = 0.12) {
  const j = (Math.random() - 0.5) * spread;
  return Math.max(0.01, Math.min(0.999, base + j));
}

function randAudience() {
  // Lognormal-ish: most 5k–80k, a few outliers
  const r = Math.random();
  if (r < 0.7) return 5_000 + Math.floor(Math.random() * 25_000);
  if (r < 0.95) return 30_000 + Math.floor(Math.random() * 50_000);
  return 100_000 + Math.floor(Math.random() * 150_000);
}

export async function POST(req: NextRequest) {
  const sb = createServiceClient();
  const body = await req.json().catch(() => ({}));
  const reset = !!body.reset;
  const count = Math.max(5, Math.min(60, Number(body.count ?? 20)));

  if (reset) {
    const { error } = await sb
      .from("campaigns")
      .delete()
      .gte("created_at", "1970-01-01");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const tmpl = TEMPLATES[i % TEMPLATES.length];
    const bench = BENCHMARKS[tmpl.tone as keyof typeof BENCHMARKS];
    const audience = randAudience();
    const deliveryRate = jitter(bench.delivery, 0.06);
    const failureRate = jitter(bench.failure, 0.02);
    const readRate = jitter(bench.read, 0.15);
    const ctr = jitter(bench.ctr, 0.1);
    const replyRate = jitter(bench.reply, 0.05);

    const delivered = Math.round(audience * deliveryRate);
    const failed = Math.round(audience * failureRate);
    const read = Math.round(delivered * readRate);
    const clicked = Math.round(read * ctr);
    const replied = Math.round(delivered * replyRate);

    const daysAgo = Math.floor(Math.random() * 60);
    const sent_at = new Date(now - daysAgo * 24 * 3600 * 1000).toISOString();

    rows.push({
      name: `${tmpl.name} — ${sent_at.slice(0, 10)}`,
      template_name: tmpl.template,
      sent_at,
      audience_size: audience,
      delivered,
      read_count: read,
      clicked,
      replied,
      failed,
      source: "manual" as const,
    });
  }

  const { error } = await sb.from("campaigns").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ inserted: rows.length, reset });
}
