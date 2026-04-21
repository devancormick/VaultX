alter table plan_limits
  add column if not exists max_teams int,
  add column if not exists max_playbooks int,
  add column if not exists max_players_per_team int;

update plan_limits set max_teams=1,    max_playbooks=3,    max_players_per_team=10   where plan='free';
update plan_limits set max_teams=5,    max_playbooks=25,   max_players_per_team=50   where plan='pro';
update plan_limits set max_teams=9999, max_playbooks=9999, max_players_per_team=9999 where plan='enterprise';
