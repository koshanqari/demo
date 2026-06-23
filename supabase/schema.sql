-- Concentrix Bot — Supabase schema
-- Run this in the Supabase SQL editor on a fresh project.

create extension if not exists vector;

-- =========================================================
-- Task 1: PDF chatbot (documents + chunks + chat_logs)
-- =========================================================
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  filename text not null,
  storage_path text not null,
  page_count int not null default 0,
  chunk_count int not null default 0,
  embed_model text not null,
  status text not null default 'ready',
  created_at timestamptz not null default now()
);

create table if not exists chunks (
  id bigserial primary key,
  document_id uuid not null references documents(id) on delete cascade,
  chunk_index int not null,
  page int not null,
  content text not null,
  embedding vector(768),
  created_at timestamptz not null default now()
);

create index if not exists chunks_doc_idx on chunks(document_id);
create index if not exists chunks_embedding_idx
  on chunks using hnsw (embedding vector_cosine_ops);

create table if not exists chat_logs (
  id bigserial primary key,
  document_id uuid references documents(id) on delete set null,
  question text not null,
  answer text not null,
  citations jsonb not null default '[]'::jsonb,
  model text not null,
  latency_ms int not null default 0,
  created_at timestamptz not null default now()
);

-- pgvector similarity search RPC
create or replace function match_chunks(
  query_embedding vector(768),
  match_count int default 5,
  filter_document_id uuid default null
)
returns table (
  id bigint,
  document_id uuid,
  chunk_index int,
  page int,
  content text,
  similarity float
)
language sql stable
as $$
  select c.id, c.document_id, c.chunk_index, c.page, c.content,
         1 - (c.embedding <=> query_embedding) as similarity
  from chunks c
  where (filter_document_id is null or c.document_id = filter_document_id)
  order by c.embedding <=> query_embedding
  limit match_count
$$;

-- =========================================================
-- Task 2: WhatsApp campaigns
-- =========================================================
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  template_name text,
  sent_at timestamptz not null default now(),
  audience_size int not null default 0,
  delivered int not null default 0,
  read_count int not null default 0,
  clicked int not null default 0,
  replied int not null default 0,
  failed int not null default 0,
  source text not null default 'manual' check (source in ('manual','csv','webhook')),
  created_at timestamptz not null default now()
);

create index if not exists campaigns_sent_at_idx on campaigns(sent_at desc);

-- =========================================================
-- Settings (model + RAG params + webhook key)
-- =========================================================
create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into app_settings (key, value) values
  ('rag', '{"chunk_size":900,"chunk_overlap":150,"top_k":5}'::jsonb),
  ('llm', '{"chat_model":"gemini-2.5-flash","embed_model":"gemini-embedding-001"}'::jsonb),
  ('webhook', '{"api_key":"change-me-in-admin"}'::jsonb)
on conflict (key) do nothing;

-- =========================================================
-- Storage bucket for raw PDFs
-- =========================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- =========================================================
-- RLS: keep it permissive for the demo (single-tenant)
-- =========================================================
alter table documents enable row level security;
alter table chunks enable row level security;
alter table chat_logs enable row level security;
alter table campaigns enable row level security;
alter table app_settings enable row level security;

do $$ begin
  create policy "public read" on documents for select using (true);
  create policy "public read" on chunks for select using (true);
  create policy "public read" on chat_logs for select using (true);
  create policy "public read" on campaigns for select using (true);
  create policy "public read" on app_settings for select using (true);
exception when duplicate_object then null; end $$;
