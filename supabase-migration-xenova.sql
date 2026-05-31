-- ============================================
-- Spice Garden Restaurant AI Chatbot
-- LOCAL EMBEDDINGS (XENOVA 384-d) UPDATE
-- ============================================
-- Run this in the Supabase SQL Editor to reset the table and 
-- update the dimension size for the free local model.

-- Step 1: Enable pgvector extension (just in case)
create extension if not exists vector;

-- Step 2: Drop the old table and function because the vector dimension changed
drop function if exists match_menu_items;
drop table if exists menu_items;

-- Step 3: Create menu_items table with 384 dimensions
create table menu_items (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  embedding vector(384),
  metadata jsonb default '{}',
  created_at timestamp with time zone default now()
);

-- Step 4: Create index for fast similarity search
create index if not exists menu_items_embedding_idx
on menu_items
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Step 5: Create RPC function for similarity search
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
