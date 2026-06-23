import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { embed, generate, GEMINI_CHAT_MODEL } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 30;

interface Match {
  id: number;
  document_id: string;
  chunk_index: number;
  page: number;
  content: string;
  similarity: number;
}

export async function POST(req: NextRequest) {
  const started = Date.now();
  try {
    const { question, documentId, topK = 5 } = await req.json();
    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "question required" }, { status: 400 });
    }

    const [qVec] = await embed([question]);
    const sb = createServiceClient();

    const { data: matches, error } = await sb.rpc("match_chunks", {
      query_embedding: qVec,
      match_count: topK,
      filter_document_id: documentId ?? null,
    });
    if (error) throw error;

    const hits = (matches ?? []) as Match[];

    if (!hits.length) {
      return NextResponse.json({
        answer:
          "I couldn't find anything relevant in the uploaded documents. Try uploading a PDF first.",
        citations: [],
        sources: [],
      });
    }

    const context = hits
      .map(
        (h, i) =>
          `[${i + 1}] (page ${h.page})\n${h.content}`,
      )
      .join("\n\n---\n\n");

    const system = `You are a concise assistant that answers questions strictly using the provided source passages.
Rules:
- Use ONLY the information in the passages. If the answer is not present, say so plainly.
- Cite sources inline using [n] markers that correspond to the passage numbers.
- Prefer short, direct answers. Use markdown bullets when listing.
- Never fabricate page numbers or facts.`;

    const prompt = `Question: ${question}

Source passages:
${context}

Answer with inline [n] citations:`;

    const answer = await generate(prompt, system);

    // Fetch document titles for sources panel
    const docIds = [...new Set(hits.map((h) => h.document_id))];
    const { data: docs } = await sb
      .from("documents")
      .select("id, title, filename, storage_path")
      .in("id", docIds);
    const docMap = new Map(docs?.map((d) => [d.id, d]) ?? []);

    const citations = hits.map((h, i) => ({
      marker: i + 1,
      page: h.page,
      similarity: Number(h.similarity.toFixed(3)),
      document_id: h.document_id,
      title: docMap.get(h.document_id)?.title ?? "Document",
      snippet: h.content.slice(0, 240),
    }));

    const latency = Date.now() - started;

    // Log async — don't block the response
    sb.from("chat_logs")
      .insert({
        document_id: documentId ?? null,
        question,
        answer,
        citations,
        model: GEMINI_CHAT_MODEL,
        latency_ms: latency,
      })
      .then(({ error }) => {
        if (error) console.error("[chat_logs]", error.message);
      });

    return NextResponse.json({
      answer,
      citations,
      latency_ms: latency,
      model: GEMINI_CHAT_MODEL,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[chat]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
