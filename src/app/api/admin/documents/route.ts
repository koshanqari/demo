import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("documents")
    .select(
      "id, title, filename, storage_path, page_count, chunk_count, embed_model, status, created_at",
    )
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ documents: data ?? [] });
}
