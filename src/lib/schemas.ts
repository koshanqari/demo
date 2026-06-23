export interface SchemaColumn {
  col: string;
  type: string;
  desc: string;
}

export interface TableSchema {
  title: string;
  description: string;
  columns: SchemaColumn[];
  ddl: string;
  footer?: string;
}

export const CAMPAIGNS_SCHEMA: TableSchema = {
  title: "campaigns",
  description: "How WhatsApp campaign data is stored in Supabase Postgres.",
  columns: [
    { col: "id", type: "uuid", desc: "Primary key, auto-generated" },
    { col: "name", type: "text", desc: "Human-readable campaign label" },
    { col: "template_name", type: "text · nullable", desc: "Approved WhatsApp template ID" },
    { col: "sent_at", type: "timestamptz", desc: "When the campaign was dispatched" },
    { col: "audience_size", type: "int", desc: "Targeted recipients" },
    { col: "delivered", type: "int", desc: "Successfully delivered messages" },
    { col: "read_count", type: "int", desc: "Recipients who opened (blue ticks)" },
    { col: "clicked", type: "int", desc: "Link / CTA clicks" },
    { col: "replied", type: "int", desc: "Customer replies received" },
    { col: "failed", type: "int", desc: "Delivery failures" },
    {
      col: "source",
      type: "enum('manual','csv','webhook')",
      desc: "How the row entered the system",
    },
    { col: "created_at", type: "timestamptz", desc: "Row insertion time, auto" },
  ],
  ddl: `create table campaigns (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  template_name text,
  sent_at       timestamptz not null default now(),
  audience_size int  not null default 0,
  delivered     int  not null default 0,
  read_count    int  not null default 0,
  clicked       int  not null default 0,
  replied       int  not null default 0,
  failed        int  not null default 0,
  source        text not null default 'manual'
                check (source in ('manual','csv','webhook')),
  created_at    timestamptz not null default now()
);`,
  footer:
    "In production, rows arrive via the WhatsApp Business API (Meta, Gupshup, Wati, etc.). " +
    "For this demo, you ingest via manual form, CSV upload, or a seed action.",
};

export const DOCUMENTS_SCHEMA: TableSchema = {
  title: "documents + chunks",
  description: "How indexed PDFs are stored. Chunks hold the pgvector embeddings.",
  columns: [
    { col: "documents.id", type: "uuid", desc: "Primary key" },
    { col: "documents.title", type: "text", desc: "Display title (defaults to filename)" },
    { col: "documents.filename", type: "text", desc: "Original PDF filename" },
    {
      col: "documents.storage_path",
      type: "text",
      desc: "Path inside the 'documents' Supabase Storage bucket",
    },
    { col: "documents.page_count", type: "int", desc: "Number of pages parsed" },
    { col: "documents.chunk_count", type: "int", desc: "Number of chunks indexed" },
    {
      col: "documents.embed_model",
      type: "text",
      desc: "Embedding model name (e.g. gemini-embedding-001)",
    },
    {
      col: "documents.status",
      type: "text",
      desc: "ready · indexing · failed (room for re-index flow)",
    },
    { col: "documents.created_at", type: "timestamptz", desc: "Upload time" },
    {
      col: "chunks.id",
      type: "bigserial",
      desc: "Chunk row id (sequence)",
    },
    {
      col: "chunks.document_id",
      type: "uuid · fk",
      desc: "Cascade-deleted with parent document",
    },
    { col: "chunks.chunk_index", type: "int", desc: "Order within the document" },
    { col: "chunks.page", type: "int", desc: "Origin page (for citations)" },
    { col: "chunks.content", type: "text", desc: "The chunk text" },
    {
      col: "chunks.embedding",
      type: "vector(768)",
      desc: "pgvector column with HNSW cosine index",
    },
  ],
  ddl: `create extension if not exists vector;

create table documents (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  filename     text not null,
  storage_path text not null,
  page_count   int  not null default 0,
  chunk_count  int  not null default 0,
  embed_model  text not null,
  status       text not null default 'ready',
  created_at   timestamptz not null default now()
);

create table chunks (
  id           bigserial primary key,
  document_id  uuid not null
               references documents(id) on delete cascade,
  chunk_index  int  not null,
  page         int  not null,
  content      text not null,
  embedding    vector(768),
  created_at   timestamptz not null default now()
);

create index chunks_embedding_idx
  on chunks using hnsw (embedding vector_cosine_ops);`,
  footer:
    "Vector search uses the match_chunks(query_embedding, k, doc_id?) RPC — cosine distance on the HNSW index.",
};

export const CHAT_LOGS_SCHEMA: TableSchema = {
  title: "chat_logs",
  description:
    "Every question/answer pair from the chatbot, with citations and timing for retrieval QA.",
  columns: [
    { col: "id", type: "bigserial", desc: "Primary key" },
    {
      col: "document_id",
      type: "uuid · nullable",
      desc: "Filter applied at chat time, null = all documents",
    },
    { col: "question", type: "text", desc: "User's question" },
    { col: "answer", type: "text", desc: "Model's answer (markdown allowed)" },
    {
      col: "citations",
      type: "jsonb",
      desc: "Array of {marker, page, title, similarity, snippet}",
    },
    { col: "model", type: "text", desc: "Chat model used (e.g. gemini-2.5-flash)" },
    { col: "latency_ms", type: "int", desc: "End-to-end response latency" },
    { col: "created_at", type: "timestamptz", desc: "Log time, auto" },
  ],
  ddl: `create table chat_logs (
  id          bigserial primary key,
  document_id uuid references documents(id) on delete set null,
  question    text not null,
  answer      text not null,
  citations   jsonb not null default '[]'::jsonb,
  model       text not null,
  latency_ms  int  not null default 0,
  created_at  timestamptz not null default now()
);`,
  footer:
    "Useful for evaluating retrieval quality — sort by latency, group by document, inspect citations.",
};
