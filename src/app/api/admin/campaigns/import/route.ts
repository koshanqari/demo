import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { parseCsv } from "@/lib/csv";

export const runtime = "nodejs";
export const maxDuration = 30;

const HEADER_MAP: Record<string, string> = {
  name: "name",
  campaign: "name",
  campaign_name: "name",
  template: "template_name",
  template_name: "template_name",
  sent_at: "sent_at",
  sent: "sent_at",
  date: "sent_at",
  audience: "audience_size",
  audience_size: "audience_size",
  delivered: "delivered",
  read: "read_count",
  read_count: "read_count",
  reads: "read_count",
  opens: "read_count",
  clicked: "clicked",
  clicks: "clicked",
  replied: "replied",
  replies: "replied",
  failed: "failed",
  failures: "failed",
};

function toInt(v: string) {
  const n = Number(v.replace(/[, ]/g, ""));
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

export async function POST(req: NextRequest) {
  try {
    let csv: string;
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file" }, { status: 400 });
      }
      csv = await file.text();
    } else {
      const body = await req.json().catch(() => ({}));
      csv = String(body.csv ?? "");
    }

    if (!csv.trim()) return NextResponse.json({ error: "Empty CSV" }, { status: 400 });

    const rows = parseCsv(csv);
    if (rows.length < 2) {
      return NextResponse.json(
        { error: "CSV needs a header row and at least one data row" },
        { status: 400 },
      );
    }

    const header = rows[0].map((h) => h.trim().toLowerCase());
    const fieldIdx: Record<string, number> = {};
    header.forEach((h, i) => {
      const mapped = HEADER_MAP[h];
      if (mapped) fieldIdx[mapped] = i;
    });
    if (fieldIdx.name === undefined) {
      return NextResponse.json(
        { error: "CSV must include a 'name' (or 'campaign') column" },
        { status: 400 },
      );
    }

    const errors: { row: number; reason: string }[] = [];
    const inserts: Record<string, unknown>[] = [];

    for (let r = 1; r < rows.length; r++) {
      const cols = rows[r];
      if (cols.every((c) => !c.trim())) continue;
      const name = (cols[fieldIdx.name] ?? "").trim();
      if (!name) {
        errors.push({ row: r + 1, reason: "missing name" });
        continue;
      }
      const sentRaw = fieldIdx.sent_at !== undefined ? cols[fieldIdx.sent_at] : "";
      const sent = sentRaw ? new Date(sentRaw) : new Date();
      if (Number.isNaN(sent.getTime())) {
        errors.push({ row: r + 1, reason: `invalid sent_at "${sentRaw}"` });
        continue;
      }
      inserts.push({
        name: name.slice(0, 200),
        template_name:
          fieldIdx.template_name !== undefined && cols[fieldIdx.template_name]
            ? cols[fieldIdx.template_name].trim().slice(0, 200)
            : null,
        sent_at: sent.toISOString(),
        audience_size:
          fieldIdx.audience_size !== undefined ? toInt(cols[fieldIdx.audience_size]) : 0,
        delivered: fieldIdx.delivered !== undefined ? toInt(cols[fieldIdx.delivered]) : 0,
        read_count: fieldIdx.read_count !== undefined ? toInt(cols[fieldIdx.read_count]) : 0,
        clicked: fieldIdx.clicked !== undefined ? toInt(cols[fieldIdx.clicked]) : 0,
        replied: fieldIdx.replied !== undefined ? toInt(cols[fieldIdx.replied]) : 0,
        failed: fieldIdx.failed !== undefined ? toInt(cols[fieldIdx.failed]) : 0,
        source: "csv" as const,
      });
    }

    if (!inserts.length) {
      return NextResponse.json(
        { error: "No valid rows", errors, headers_detected: Object.keys(fieldIdx) },
        { status: 400 },
      );
    }

    const sb = createServiceClient();
    const { error } = await sb.from("campaigns").insert(inserts);
    if (error) throw error;

    return NextResponse.json({
      inserted: inserts.length,
      skipped: errors.length,
      errors,
      headers_detected: Object.keys(fieldIdx),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[csv import]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
