  alter table public.reviews
    add column reviewer_role text check (reviewer_role in ('student', 'parent', 'other'));
