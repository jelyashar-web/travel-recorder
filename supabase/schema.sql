-- Enable RLS
alter table recordings enable row level security;
alter table shared_recordings enable row level security;
alter table user_profiles enable row level security;

-- Recordings: Users can only see their own recordings
create policy "Users can view own recordings"
  on recordings for select
  using (auth.uid() = user_id);

create policy "Users can insert own recordings"
  on recordings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own recordings"
  on recordings for update
  using (auth.uid() = user_id);

create policy "Users can delete own recordings"
  on recordings for delete
  using (auth.uid() = user_id);

-- Shared recordings: Anyone with token can view
create policy "Public can view shared recordings"
  on shared_recordings for select
  using (is_public = true or expires_at > now());

-- Storage policies
create policy "Users can upload to own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'recordings' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view own files"
  on storage.objects for select
  using (
    bucket_id = 'recordings' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Functions
create or replace function increment_view_count(token text)
returns void as $$
begin
  update shared_recordings
  set views = views + 1
  where share_token = token;
end;
$$ language plpgsql security definer;

-- Trigger: Auto-update recording count on user profile
create or replace function update_recording_count()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update user_profiles
    set total_recordings = total_recordings + 1
    where id = new.user_id;
  elsif (tg_op = 'DELETE') then
    update user_profiles
    set total_recordings = total_recordings - 1
    where id = old.user_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger recording_count_trigger
  after insert or delete on recordings
  for each row execute function update_recording_count();

-- Analytics view
create view recording_analytics as
select
  user_id,
  date_trunc('day', created_at) as date,
  count(*) as recording_count,
  sum(duration) as total_duration,
  sum(size) as total_size
from recordings
group by user_id, date_trunc('day', created_at);
