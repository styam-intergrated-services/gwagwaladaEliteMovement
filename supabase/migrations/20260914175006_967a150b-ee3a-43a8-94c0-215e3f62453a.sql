create type public.service_request_type as enum ('Resident Assistance', 'Volunteer Onboarding', 'Grievance Report');
create type public.service_request_status as enum ('Submitted', 'In Review', 'Resolved');

create table public.leadership (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    role_title text not null,
    photo_url text,
    bio text,
    display_order integer not null default 0
);

grant select on public.leadership to anon, authenticated;
grant insert, update, delete on public.leadership to authenticated;
grant all on public.leadership to service_role;

alter table public.leadership enable row level security;

create policy "Leadership profiles are publicly readable"
    on public.leadership
    for select
    to anon, authenticated
    using (true);

create policy "Only admins can manage leadership profiles"
    on public.leadership
    for all
    to authenticated
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));

create table public.service_requests (
    id uuid primary key default gen_random_uuid(),
    requester_id uuid references auth.users(id) on delete set null,
    request_type public.service_request_type not null,
    ward public.project_ward,
    description text not null,
    contact_info text,
    is_anonymous boolean not null default false,
    status public.service_request_status not null default 'Submitted',
    submitted_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

grant select, insert on public.service_requests to anon, authenticated;
grant update, delete on public.service_requests to authenticated;
grant all on public.service_requests to service_role;

alter table public.service_requests enable row level security;

create policy "Users can view their own service requests"
    on public.service_requests
    for select
    to authenticated
    using (auth.uid() = requester_id);

create policy "Anonymous users can submit service requests"
    on public.service_requests
    for insert
    to anon
    with check (
        is_anonymous = true
        and requester_id is null
        and (contact_info is null or length(contact_info) = 0)
    );

create policy "Authenticated users can submit their own service requests"
    on public.service_requests
    for insert
    to authenticated
    with check (
        (not is_anonymous and auth.uid() = requester_id)
        or (is_anonymous and requester_id is null)
    );

create policy "Only admins and moderators can review all service requests"
    on public.service_requests
    for all
    to authenticated
    using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'))
    with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

create trigger update_service_requests_updated_at
    before update on public.service_requests
    for each row
    execute function public.update_updated_at_column();

-- Storage policies for leadership-photos bucket
create policy "Anyone can view leadership photos"
    on storage.objects
    for select
    to anon, authenticated
    using (bucket_id = 'leadership-photos');

create policy "Admins can upload leadership photos"
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'leadership-photos' and public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete leadership photos"
    on storage.objects
    for delete
    to authenticated
    using (bucket_id = 'leadership-photos' and public.has_role(auth.uid(), 'admin'));
