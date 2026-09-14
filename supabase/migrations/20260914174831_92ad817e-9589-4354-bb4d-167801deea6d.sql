create type public.document_type as enum ('Financial Summary', 'Balance Sheet', 'Audit Report', 'Press Release', 'Governance Guideline');

create table public.revenue_logs (
    id uuid primary key default gen_random_uuid(),
    ward public.project_ward,
    amount numeric(14,2) not null,
    source text not null,
    linked_project_id uuid references public.projects(id) on delete set null,
    recorded_at timestamp with time zone not null default now(),
    notes text
);

grant select on public.revenue_logs to anon, authenticated;
grant insert, update, delete on public.revenue_logs to authenticated;
grant all on public.revenue_logs to service_role;

alter table public.revenue_logs enable row level security;

create policy "Revenue logs are publicly readable"
    on public.revenue_logs
    for select
    to anon, authenticated
    using (true);

create policy "Only admins can manage revenue logs"
    on public.revenue_logs
    for all
    to authenticated
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));

create table public.transparency_documents (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    document_type public.document_type not null,
    file_url text not null,
    published_at timestamp with time zone not null default now()
);

grant select on public.transparency_documents to anon, authenticated;
grant insert, update, delete on public.transparency_documents to authenticated;
grant all on public.transparency_documents to service_role;

alter table public.transparency_documents enable row level security;

create policy "Transparency documents are publicly readable"
    on public.transparency_documents
    for select
    to anon, authenticated
    using (true);

create policy "Only admins can manage transparency documents"
    on public.transparency_documents
    for all
    to authenticated
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));

-- Storage policies for transparency-docs bucket
create policy "Authenticated users can upload transparency documents"
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'transparency-docs');

create policy "Anyone can view transparency documents"
    on storage.objects
    for select
    to anon, authenticated
    using (bucket_id = 'transparency-docs');

create policy "Only admins can delete transparency documents"
    on storage.objects
    for delete
    to authenticated
    using (bucket_id = 'transparency-docs' and public.has_role(auth.uid(), 'admin'));
