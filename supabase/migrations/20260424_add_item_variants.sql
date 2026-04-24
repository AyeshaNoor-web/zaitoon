-- Migration: Add item_variants table for per-item options (e.g. Chicken, Beef, Mutton)
-- Run this in your Supabase SQL editor or via the CLI

create table if not exists public.item_variants (
    id            uuid primary key default gen_random_uuid(),
    menu_item_id  uuid not null references public.menu_items(id) on delete cascade,
    label         text not null,
    price         numeric(10, 2) not null default 0,
    display_order integer not null default 0,
    created_at    timestamptz not null default now()
);

-- Index for fast lookups by menu item
create index if not exists item_variants_menu_item_id_idx
    on public.item_variants (menu_item_id, display_order);

-- Enable RLS (match your existing menu_items policy style)
alter table public.item_variants enable row level security;

-- Public read access (same as menu_items)
create policy "Public can read item_variants"
    on public.item_variants for select
    using (true);

-- Admin write access — adjust to match your existing admin auth pattern
create policy "Authenticated can manage item_variants"
    on public.item_variants for all
    using (auth.role() = 'authenticated');
