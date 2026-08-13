-- Row Level Security policies.
--
-- These were originally created directly in Supabase's SQL Editor while
-- setting up auth, and were not captured as a migration at the time.
-- This file records the exact policy set confirmed live on the database
-- (via Supabase's Policies dashboard) so it's reproducible from the repo
-- going forward, rather than only existing in Supabase's UI.
--
-- games: shared metadata cache, readable by anyone signed in, writable
-- only through server-side app code (no insert/update/delete policy here
-- is intentional).
alter table games enable row level security;

create policy "Anyone can view games"
on games for select
using (true);


-- user_games: a user's personal library entries.
alter table user_games enable row level security;

create policy "Users can view their own game entries"
on user_games for select
using (auth.uid() = user_id);

create policy "Users can insert their own game entries"
on user_games for insert
with check (auth.uid() = user_id);

create policy "Users can update their own game entries"
on user_games for update
using (auth.uid() = user_id);

create policy "Users can delete their own game entries"
on user_games for delete
using (auth.uid() = user_id);


-- lists: a user's custom lists.
alter table lists enable row level security;

create policy "Users can view their own lists"
on lists for select
using (auth.uid() = user_id);

create policy "Users can insert their own lists"
on lists for insert
with check (auth.uid() = user_id);

create policy "Users can update their own lists"
on lists for update
using (auth.uid() = user_id);

create policy "Users can delete their own lists"
on lists for delete
using (auth.uid() = user_id);


-- list_games: entries within a list. list_games has no user_id column
-- of its own, so ownership is checked through the parent list via a
-- subquery.
alter table list_games enable row level security;

create policy "Users can view games in their own lists"
on list_games for select
using (
  exists (
    select 1 from lists
    where lists.id = list_games.list_id
    and lists.user_id = auth.uid()
  )
);

create policy "Users can insert games into their own lists"
on list_games for insert
with check (
  exists (
    select 1 from lists
    where lists.id = list_games.list_id
    and lists.user_id = auth.uid()
  )
);

create policy "Users can update games in their own lists"
on list_games for update
using (
  exists (
    select 1 from lists
    where lists.id = list_games.list_id
    and lists.user_id = auth.uid()
  )
);

create policy "Users can delete games from their own lists"
on list_games for delete
using (
  exists (
    select 1 from lists
    where lists.id = list_games.list_id
    and lists.user_id = auth.uid()
  )
);


-- recommendations: cached AI recommendations, one row per user.
-- This table had RLS enabled but no policies at all, which meant no
-- data could be read or written through Supabase's Data API. Added
-- here to match the same per-user pattern as everything else.
alter table recommendations enable row level security;

create policy "Users can view their own recommendations"
on recommendations for select
using (auth.uid() = user_id);

create policy "Users can insert their own recommendations"
on recommendations for insert
with check (auth.uid() = user_id);

create policy "Users can update their own recommendations"
on recommendations for update
using (auth.uid() = user_id);

create policy "Users can delete their own recommendations"
on recommendations for delete
using (auth.uid() = user_id);