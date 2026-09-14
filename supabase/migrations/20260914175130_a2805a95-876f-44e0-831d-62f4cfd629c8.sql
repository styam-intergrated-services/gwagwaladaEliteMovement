create type public.marketplace_category as enum ('Goods', 'Services', 'Food', 'Fashion', 'Electronics', 'Home & Garden', 'Beauty & Health', 'Other');

create table public.marketplace_listings (
    id uuid primary key default gen_random_uuid(),
    seller_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    description text not null,
    category public.marketplace_category not null,
    price numeric(12,2) not null,
    is_negotiable boolean not null default false,
    whatsapp_number text,
    images text[] not null default '{}',
    is_active boolean not null default true,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

grant select on public.marketplace_listings to anon, authenticated;
grant insert, update, delete on public.marketplace_listings to authenticated;
grant all on public.marketplace_listings to service_role;

alter table public.marketplace_listings enable row level security;

create policy "Marketplace listings are publicly readable"
    on public.marketplace_listings
    for select
    to anon, authenticated
    using (is_active = true);

create policy "Verified traders can create listings"
    on public.marketplace_listings
    for insert
    to authenticated
    with check (
        seller_id = auth.uid()
        and public.has_role(auth.uid(), 'verified_trader')
    );

create policy "Sellers can update their own listings"
    on public.marketplace_listings
    for update
    to authenticated
    using (seller_id = auth.uid())
    with check (seller_id = auth.uid());

create policy "Sellers can delete their own listings"
    on public.marketplace_listings
    for delete
    to authenticated
    using (seller_id = auth.uid());

create policy "Admins and moderators can moderate any listing"
    on public.marketplace_listings
    for all
    to authenticated
    using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'))
    with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

create trigger update_marketplace_listings_updated_at
    before update on public.marketplace_listings
    for each row
    execute function public.update_updated_at_column();

-- Storage policies for marketplace-images bucket
create policy "Anyone can view marketplace images"
    on storage.objects
    for select
    to anon, authenticated
    using (bucket_id = 'marketplace-images');

create policy "Authenticated users can upload marketplace images"
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'marketplace-images');

create policy "Sellers can delete their own marketplace images"
    on storage.objects
    for delete
    to authenticated
    using (
        bucket_id = 'marketplace-images'
        and exists (
            select 1 from public.marketplace_listings
            where seller_id = auth.uid()
              and images @> array[storage.objects.name]
        )
    );

create policy "Admins and moderators can delete any marketplace image"
    on storage.objects
    for delete
    to authenticated
    using (
        bucket_id = 'marketplace-images'
        and (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'))
    );
