-- ── Player XP ─────────────────────────────────────────────────────────────────
create table if not exists player_xp (
  player_id   uuid references auth.users(id) on delete cascade primary key,
  total_xp    int not null default 0,
  level       int not null default 1,
  updated_at  timestamptz default now()
);

alter table player_xp enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='player_xp' and policyname='player_owns_xp') then
    create policy "player_owns_xp" on player_xp using (player_id = auth.uid());
  end if;
end $$;

-- ── Player streaks ────────────────────────────────────────────────────────────
create table if not exists player_streaks (
  player_id        uuid references auth.users(id) on delete cascade primary key,
  current_streak   int not null default 0,
  longest_streak   int not null default 0,
  last_drill_date  date,
  updated_at       timestamptz default now()
);

alter table player_streaks enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='player_streaks' and policyname='player_owns_streaks') then
    create policy "player_owns_streaks" on player_streaks using (player_id = auth.uid());
  end if;
end $$;

-- ── Achievement definitions ───────────────────────────────────────────────────
create table if not exists achievement_definitions (
  id          text primary key,
  name        text not null,
  description text not null,
  icon        text not null,
  xp_reward   int not null default 0
);

insert into achievement_definitions values
  ('first_play',     'First Rep',          'Complete your first drill',                        '🏈', 50),
  ('hot_streak_3',   'Hot Streak',          '3-day practice streak',                           '🔥', 75),
  ('hot_streak_7',   'Weekly Grinder',      '7-day practice streak',                           '💪', 150),
  ('hot_streak_30',  'Iron Man',            '30-day practice streak',                          '🏋️', 500),
  ('perfect_route',  'Perfect Route',       'Execute phase with near-perfect Fréchet score',   '⭐', 100),
  ('near_perfect',   'Precision Player',    'Execute phase 90%+ score 5 times',               '🎯', 150),
  ('speed_read',     'Speed Read',          'Complete Game Ready in under 5 seconds',          '⚡', 75),
  ('film_room_10',   'Film Room',           'Study 10 different plays',                        '📽️', 100),
  ('film_room_50',   'Film Buff',           'Study 50 different plays',                        '🎬', 250),
  ('full_playbook',  'Playbook Complete',   'Complete 25 drills',                              '📚', 200),
  ('comeback',       'Comeback Kid',        'Score 90%+ after previously scoring under 50%',   '↑', 100),
  ('hat_trick',      'Hat Trick',           'Complete 3 drills in one day',                    '🎩', 75),
  ('century',        'Century',             'Complete 100 total drills',                       '💯', 300),
  ('level_5',        'All-American',        'Reach level 5',                                   '🏆', 200),
  ('level_7',        'Hall of Famer',       'Reach level 7',                                   '👑', 500)
on conflict (id) do nothing;

-- ── Player achievements ───────────────────────────────────────────────────────
create table if not exists player_achievements (
  id              uuid default gen_random_uuid() primary key,
  player_id       uuid references auth.users(id) on delete cascade not null,
  achievement_id  text references achievement_definitions(id) not null,
  earned_at       timestamptz default now(),
  unique (player_id, achievement_id)
);

alter table player_achievements enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='player_achievements' and policyname='player_owns_achievements') then
    create policy "player_owns_achievements" on player_achievements using (player_id = auth.uid());
  end if;
end $$;

-- Allow coaches to read team members' XP/streaks for the leaderboard
do $$ begin
  if not exists (select 1 from pg_policies where tablename='player_xp' and policyname='coach_reads_team_xp') then
    create policy "coach_reads_team_xp" on player_xp
      for select using (
        player_id in (
          select tm.player_id from team_memberships tm
          join teams t on t.id = tm.team_id
          where t.coach_id = auth.uid()
        )
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='player_streaks' and policyname='coach_reads_team_streaks') then
    create policy "coach_reads_team_streaks" on player_streaks
      for select using (
        player_id in (
          select tm.player_id from team_memberships tm
          join teams t on t.id = tm.team_id
          where t.coach_id = auth.uid()
        )
      );
  end if;
end $$;

-- Allow teammates to read each other's XP/streaks for leaderboard
do $$ begin
  if not exists (select 1 from pg_policies where tablename='player_xp' and policyname='teammate_reads_xp') then
    create policy "teammate_reads_xp" on player_xp
      for select using (
        player_id in (
          select tm2.player_id from team_memberships tm1
          join team_memberships tm2 on tm2.team_id = tm1.team_id
          where tm1.player_id = auth.uid() and tm1.status = 'active'
        )
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='player_streaks' and policyname='teammate_reads_streaks') then
    create policy "teammate_reads_streaks" on player_streaks
      for select using (
        player_id in (
          select tm2.player_id from team_memberships tm1
          join team_memberships tm2 on tm2.team_id = tm1.team_id
          where tm1.player_id = auth.uid() and tm1.status = 'active'
        )
      );
  end if;
end $$;
