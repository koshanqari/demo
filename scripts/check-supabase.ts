import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Tiny .env.local loader — avoids adding dotenv as a dep.
function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const [, k, v] = m;
      if (!process.env[k]) process.env[k] = v.replace(/^['"]|['"]$/g, "");
    }
  } catch {
    /* no file — ok */
  }
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

function mask(v?: string) {
  if (!v) return "(missing)";
  return v.slice(0, 6) + "…" + v.slice(-4) + ` (len ${v.length})`;
}

console.log("URL    :", url ?? "(missing)");
console.log("ANON   :", mask(anon));
console.log("SERVICE:", mask(service));

if (!url || !anon || !service) {
  console.error("\n✗ Missing env vars. Fill in .env.local and re-run.");
  process.exit(1);
}

const tables = ["documents", "chunks", "chat_logs", "campaigns", "app_settings"];
let failed = false;

async function check(label: string, key: string) {
  console.log(`\n— ${label} —`);
  const sb = createClient(url!, key);
  for (const t of tables) {
    const { error, count } = await sb
      .from(t)
      .select("*", { count: "exact", head: true });
    if (error) {
      console.log(`  ✗ ${t.padEnd(14)} ${error.message}`);
      failed = true;
    } else {
      console.log(`  ✓ ${t.padEnd(14)} ${count ?? 0} rows`);
    }
  }
}

async function main() {
  await check("anon key", anon!);
  await check("service role key", service!);

  console.log("\n— match_chunks RPC —");
  const sb = createClient(url!, service!);
  const { error: rpcErr } = await sb.rpc("match_chunks", {
    query_embedding: new Array(768).fill(0),
    match_count: 1,
  });
  if (rpcErr) {
    console.log("  ✗", rpcErr.message);
    failed = true;
  } else {
    console.log("  ✓ callable");
  }

  console.log("\n— storage bucket 'documents' —");
  const { data, error: bktErr } = await sb.storage.listBuckets();
  if (bktErr) {
    console.log("  ✗", bktErr.message);
    failed = true;
  } else {
    const found = data?.find((b) => b.name === "documents");
    if (found) console.log("  ✓ exists (public:", found.public, ")");
    else {
      console.log("  ✗ bucket missing — re-run schema.sql");
      failed = true;
    }
  }

  console.log(failed ? "\n✗ some checks failed" : "\n✓ all good — Supabase is ready");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
