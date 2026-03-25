-- Run this in Supabase SQL Editor to set up the database

-- Enable pgvector extension
create extension if not exists vector;

-- Documents table
create table documents (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  file_type text,
  created_at timestamptz default now()
);

-- Chunks with embeddings
create table chunks (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references documents(id) on delete cascade,
  content text not null,
  chunk_index int not null,
  embedding vector(768),
  metadata jsonb default '{}'
);

-- Similarity search function
create or replace function match_chunks(
  query_embedding vector(768),
  match_threshold float default 0.7,
  match_count int default 10
) returns table (
  id uuid,
  document_id uuid,
  content text,
  similarity float
) language sql stable as $$
  select
    chunks.id,
    chunks.document_id,
    chunks.content,
    1 - (chunks.embedding <=> query_embedding) as similarity
  from chunks
  where 1 - (chunks.embedding <=> query_embedding) > match_threshold
  order by chunks.embedding <=> query_embedding
  limit match_count;
$$;

-- Index for fast similarity search
create index on chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
