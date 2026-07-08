alter table public.reviews
  add column rating     smallint check (rating between 1 and 5),
  add column author_name text;

-- Allow anonymous public inserts (user-submitted reviews)
create policy "public insert reviews" on public.reviews
  for insert with check (true);
