-- Schools
create table public.schools (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        text not null default 'PUBLIC' check (type = 'PUBLIC'),
  address     text not null,
  district    text not null,
  latitude    double precision,
  longitude   double precision,
  website     text,
  description text,
  created_at  timestamptz not null default now()
);

-- Programs
create table public.programs (
  id        uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name      text not null,
  type      text not null check (type in ('SPECIALIZED', 'INTEGRATED', 'NORMAL')),
  created_at timestamptz not null default now()
);

-- Cutoffs
create table public.cutoffs (
  id           uuid primary key default gen_random_uuid(),
  program_id   uuid not null references public.programs(id) on delete cascade,
  year         integer not null,
  cutoff_score numeric(4,2) not null,
  created_at   timestamptz not null default now(),
  unique(program_id, year)
);

-- Reviews
create table public.reviews (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references public.schools(id) on delete cascade,
  source     text,
  content    text not null,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_programs_school_id on public.programs(school_id);
create index idx_cutoffs_program_id on public.cutoffs(program_id);
create index idx_reviews_school_id  on public.reviews(school_id);

-- RLS
alter table public.schools  enable row level security;
alter table public.programs enable row level security;
alter table public.cutoffs  enable row level security;
alter table public.reviews  enable row level security;

-- Public read access
create policy "public read schools"  on public.schools  for select using (true);
create policy "public read programs" on public.programs for select using (true);
create policy "public read cutoffs"  on public.cutoffs  for select using (true);
create policy "public read reviews"  on public.reviews  for select using (true);

-- Service-role write access (used by admin API routes with service key)
create policy "service write schools"  on public.schools  for all using (auth.role() = 'service_role');
create policy "service write programs" on public.programs for all using (auth.role() = 'service_role');
create policy "service write cutoffs"  on public.cutoffs  for all using (auth.role() = 'service_role');
create policy "service write reviews"  on public.reviews  for all using (auth.role() = 'service_role');
