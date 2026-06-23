import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sb = createServiceClient();

  const { data: doc } = await sb
    .from("documents")
    .select("storage_path")
    .eq("id", id)
    .single();

  // chunks cascade via FK; just remove the row + storage object.
  const { error } = await sb.from("documents").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (doc?.storage_path) {
    await sb.storage.from("documents").remove([doc.storage_path]);
  }

  return NextResponse.json({ ok: true });
}
