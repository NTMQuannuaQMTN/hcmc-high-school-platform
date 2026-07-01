-- address is optional for schools outside HCM proper (KV2/KV3) where we may not have exact addresses
alter table public.schools
  alter column address drop not null,
  alter column district drop not null;
