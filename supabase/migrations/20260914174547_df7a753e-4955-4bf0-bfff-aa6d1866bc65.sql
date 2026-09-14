create type public.project_ward as enum ('Gwagwalada Center', 'Paiko', 'Ibwa', 'Zuba', 'Kutunku');
create type public.project_entity_badge as enum ('GEM Grassroots', 'Area Council Municipal', 'Joint Initiative');
create type public.project_status as enum ('Planning', 'In Progress', 'Completed');

create table public.projects (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    ward public.project_ward not null,
    entity_badge public.project_entity_badge not null,
    status public.project_status not null default 'Planning',
    budget_approved numeric(14,2) not null default 0,
    budget_spent numeric(14,2) not null default 0,
    contractor_name text,
    contractor_contact text,
    start_date date,
    target_completion_date date,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;

alter table public.projects enable row level security;

create policy "Projects are publicly readable"
    on public.projects
    for select
    to anon, authenticated
    using (true);

create policy "Only admins and moderators can manage projects"
    on public.projects
    for all
    to authenticated
    using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'))
    with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

create trigger update_projects_updated_at
    before update on public.projects
    for each row
    execute function public.update_updated_at_column();

create table public.project_milestones (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references public.projects(id) on delete cascade,
    title text not null,
    description text,
    target_date date,
    completed_at timestamp with time zone,
    created_at timestamp with time zone not null default now()
);

grant select on public.project_milestones to anon, authenticated;
grant insert, update, delete on public.project_milestones to authenticated;
grant all on public.project_milestones to service_role;

alter table public.project_milestones enable row level security;

create policy "Milestones are publicly readable"
    on public.project_milestones
    for select
    to anon, authenticated
    using (true);

create policy "Only admins and moderators can manage milestones"
    on public.project_milestones
    for all
    to authenticated
    using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'))
    with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

create table public.project_photos (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references public.projects(id) on delete cascade,
    uploaded_by uuid not null references auth.users(id) on delete cascade,
    photo_url text not null,
    caption text,
    submitted_at timestamp with time zone not null default now(),
    verified boolean not null default false
);

grant select on public.project_photos to anon, authenticated;
grant insert on public.project_photos to authenticated;
grant update, delete on public.project_photos to authenticated;
grant all on public.project_photos to service_role;

alter table public.project_photos enable row level security;

create policy "Project photos are publicly readable"
    on public.project_photos
    for select
    to anon, authenticated
    using (true);

create policy "Authenticated users can submit project photos"
    on public.project_photos
    for insert
    to authenticated
    with check (auth.uid() = uploaded_by);

create policy "Users can delete their own project photos"
    on public.project_photos
    for delete
    to authenticated
    using (auth.uid() = uploaded_by);

create policy "Only admins and moderators can verify or edit project photos"
    on public.project_photos
    for update
    to authenticated
    using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'))
    with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

-- Storage policies for project-photos bucket
-- Public read for verified photos; authenticated read for all photos they submitted
create policy "Anyone can view verified project photos"
    on storage.objects
    for select
    to anon, authenticated
    using (bucket_id = 'project-photos' and (storage.foldername(name))[1] = 'verified');

create policy "Authenticated users can upload project photos"
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'project-photos');

create policy "Users can delete their own project photos"
    on storage.objects
    for delete
    to authenticated
    using (bucket_id = 'project-photos' and auth.uid()::text = (storage.foldername(name))[1]);
