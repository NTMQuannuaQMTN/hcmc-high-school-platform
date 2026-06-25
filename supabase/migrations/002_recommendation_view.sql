-- Materialized view joining latest cutoff per program for fast recommendation queries
create or replace view public.program_latest_cutoff as
select
  p.id            as program_id,
  p.school_id,
  p.name          as program_name,
  p.type          as program_type,
  s.name          as school_name,
  s.type          as school_type,
  s.address,
  s.district,
  s.latitude,
  s.longitude,
  s.website,
  c.year          as latest_year,
  c.cutoff_score  as latest_cutoff
from public.programs p
join public.schools s on s.id = p.school_id
join public.cutoffs c on c.program_id = p.id
where c.year = (
  select max(c2.year)
  from public.cutoffs c2
  where c2.program_id = p.id
);
