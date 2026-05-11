create table if not exists public.lawjob_postings (
  id bigint primary key,
  data jsonb not null,
  deleted boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists lawjob_postings_deleted_idx
  on public.lawjob_postings (deleted);

create index if not exists lawjob_postings_updated_at_idx
  on public.lawjob_postings (updated_at desc);

alter table public.lawjob_postings enable row level security;

drop policy if exists "lawjob_postings_no_public_access" on public.lawjob_postings;
create policy "lawjob_postings_no_public_access"
  on public.lawjob_postings
  for all
  using (false)
  with check (false);
