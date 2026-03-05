-- Run this in the Supabase SQL Editor to create the profiles table.

create table if not exists profiles (
  id uuid references auth.users primary key,
  display_name text,
  updated_at timestamptz default now()
);

-- Optional: enable RLS and allow users to read/update their own row
-- alter table profiles enable row level security;
-- create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
-- create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
-- create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
