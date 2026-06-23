import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const TARGETS = new Set(["campaigns", "documents", "chat_logs", "all"]);

async function purgeStorage(sb: ReturnType<typeof createServiceClient>) {
  const { data: objs } = await sb.storage.from("documents").list("", { limit: 1000 });
  if (objs && objs.length) {
    await sb.storage.from("documents").remove(objs.map((o) => o.name));
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const target = String(body.target ?? "");
  if (!TARGETS.has(target)) {
    return NextResponse.json(
      { error: "target must be one of: campaigns, documents, chat_logs, all" },
      { status: 400 },
    );
  }

  const sb = createServiceClient();
  const cleared: Record<string, number> = {};

  async function wipe(table: string) {
    const { count } = await sb
      .from(table)
      .select("*", { count: "exact", head: true });
    const { error } = await sb.from(table).delete().gte("created_at", "1970-01-01");
    if (error) throw error;
    cleared[table] = count ?? 0;
  }

  try {
    if (target === "campaigns" || target === "all") await wipe("campaigns");
    if (target === "chat_logs" || target === "all") await wipe("chat_logs");
    if (target === "documents" || target === "all") {
      // chunks cascade via FK; explicitly clear storage too
      await wipe("documents");
      await purgeStorage(sb);
      cleared.storage_purged = 1;
    }

    return NextResponse.json({ ok: true, target, cleared });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "reset failed" },
      { status: 500 },
    );
  }
}
