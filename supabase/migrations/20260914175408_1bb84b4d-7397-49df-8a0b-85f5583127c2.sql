create schema if not exists private;

grant usage on schema private to authenticated, service_role;

-- Recreate helpers in private schema

create or replace function private.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = private, public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

grant execute on function private.has_role(uuid, public.app_role) to authenticated, service_role;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = private, public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'username')
  );
  return new;
end;
$$;

grant execute on function private.handle_new_user() to service_role;

create or replace function private.update_post_comments_count()
returns trigger
language plpgsql
security definer
set search_path = private, public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comments_count = comments_count + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.posts set comments_count = comments_count - 1 where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

grant execute on function private.update_post_comments_count() to service_role;

create or replace function private.update_post_likes_count()
returns trigger
language plpgsql
security definer
set search_path = private, public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set likes_count = likes_count + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.posts set likes_count = likes_count - 1 where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

grant execute on function private.update_post_likes_count() to service_role;

-- Update RLS policies to reference private.has_role

alter policy "Only admins can manage leadership profiles" on public.leadership
  using (private.has_role(auth.uid(), 'admin'))
  with check (private.has_role(auth.uid(), 'admin'));

alter policy "Admins and moderators can moderate any listing" on public.marketplace_listings
  using (private.has_role(auth.uid(), 'admin') or private.has_role(auth.uid(), 'moderator'))
  with check (private.has_role(auth.uid(), 'admin') or private.has_role(auth.uid(), 'moderator'));

alter policy "Verified traders can create listings" on public.marketplace_listings
  with check (
    seller_id = auth.uid()
    and private.has_role(auth.uid(), 'verified_trader')
  );

alter policy "Only admins and moderators can manage milestones" on public.project_milestones
  using (private.has_role(auth.uid(), 'admin') or private.has_role(auth.uid(), 'moderator'))
  with check (private.has_role(auth.uid(), 'admin') or private.has_role(auth.uid(), 'moderator'));

alter policy "Only admins and moderators can verify or edit project photos" on public.project_photos
  using (private.has_role(auth.uid(), 'admin') or private.has_role(auth.uid(), 'moderator'))
  with check (private.has_role(auth.uid(), 'admin') or private.has_role(auth.uid(), 'moderator'));

alter policy "Only admins and moderators can manage projects" on public.projects
  using (private.has_role(auth.uid(), 'admin') or private.has_role(auth.uid(), 'moderator'))
  with check (private.has_role(auth.uid(), 'admin') or private.has_role(auth.uid(), 'moderator'));

alter policy "Only admins can manage revenue logs" on public.revenue_logs
  using (private.has_role(auth.uid(), 'admin'))
  with check (private.has_role(auth.uid(), 'admin'));

alter policy "Only admins and moderators can review all service requests" on public.service_requests
  using (private.has_role(auth.uid(), 'admin') or private.has_role(auth.uid(), 'moderator'))
  with check (private.has_role(auth.uid(), 'admin') or private.has_role(auth.uid(), 'moderator'));

alter policy "Only admins can manage transparency documents" on public.transparency_documents
  using (private.has_role(auth.uid(), 'admin'))
  with check (private.has_role(auth.uid(), 'admin'));

alter policy "Admins can manage roles" on public.user_roles
  using (private.has_role(auth.uid(), 'admin'))
  with check (private.has_role(auth.uid(), 'admin'));

-- Update storage policies

alter policy "Admins and moderators can delete any marketplace image" on storage.objects
  using (
    bucket_id = 'marketplace-images'
    and (private.has_role(auth.uid(), 'admin') or private.has_role(auth.uid(), 'moderator'))
  );

alter policy "Admins can upload leadership photos" on storage.objects
  with check (bucket_id = 'leadership-photos' and private.has_role(auth.uid(), 'admin'));

alter policy "Admins can delete leadership photos" on storage.objects
  using (bucket_id = 'leadership-photos' and private.has_role(auth.uid(), 'admin'));

alter policy "Only admins can delete transparency documents" on storage.objects
  using (bucket_id = 'transparency-docs' and private.has_role(auth.uid(), 'admin'));

-- Update triggers to point to private functions

drop trigger if exists update_comments_count on public.comments;
create trigger update_comments_count
  after insert or delete on public.comments
  for each row
  execute function private.update_post_comments_count();

drop trigger if exists update_likes_count on public.post_likes;
create trigger update_likes_count
  after insert or delete on public.post_likes
  for each row
  execute function private.update_post_likes_count();

-- Drop and recreate auth.users trigger against private helper

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function private.handle_new_user();

-- Drop public versions now that nothing references them

drop function if exists public.has_role(uuid, public.app_role);
drop function if exists public.handle_new_user();
drop function if exists public.update_post_comments_count();
drop function if exists public.update_post_likes_count();

-- Tighten execute grants
revoke execute on function private.has_role(uuid, public.app_role) from anon;
revoke execute on function private.handle_new_user() from public, anon, authenticated;
revoke execute on function private.update_post_comments_count() from public, anon, authenticated;
revoke execute on function private.update_post_likes_count() from public, anon, authenticated;
