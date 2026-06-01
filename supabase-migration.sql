-- ============================================
-- Spice Garden Restaurant AI Chatbot
-- Supabase Database Migration Script
-- ============================================
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard)
-- Navigate to: SQL Editor → New Query → Paste & Run

-- Step 1: Enable pgvector extension
create extension if not exists vector;

-- Step 2: Create menu_items table
create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  embedding vector(384),
  metadata jsonb default '{}',
  created_at timestamp with time zone default now()
);

-- Step 3: Create index for fast similarity search
-- Note: IVFFlat requires at least some data to be present.
-- If you get an error about "too few rows", insert some data first,
-- then run this index creation command separately.
create index if not exists menu_items_embedding_idx
on menu_items
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Step 4: Create RPC function for similarity search
create or replace function match_menu_items(
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    id,
    content,
    metadata,
    1 - (menu_items.embedding <=> query_embedding) as similarity
  from menu_items
  where 1 - (menu_items.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;

-- ============================================
-- Verification: Run these to check setup
-- ============================================
-- select * from pg_extension where extname = 'vector';
-- select count(*) from menu_items;
-- select * from match_menu_items(
--   (select embedding from menu_items limit 1),
--   0.5,
--   3
-- );
