-- Streak query grupisše po (user_id, last_viewed_at::date). Bez indeksa,
-- Postgres mora full scan na lesson_progress za svaki poziv.
create index if not exists lesson_progress_user_last_viewed_idx
  on public.lesson_progress (user_id, last_viewed_at desc nulls last);

-- Filter po userId + sortiranje po lastViewedAt — koristi se na više mesta
create index if not exists lesson_progress_user_completed_idx
  on public.lesson_progress (user_id, completed);

-- Komentari po lekciji često se filtriraju zajedno sa status
create index if not exists comments_lesson_visible_idx
  on public.comments (lesson_id, status)
  where status = 'visible';

-- Vežbe po lekciji često
create index if not exists exercises_lesson_position_idx
  on public.exercises (lesson_id, position)
  where status = 'published';

-- AI konverzacije po useru (sidebar lista)
create index if not exists ai_conversations_user_created_idx
  on public.ai_conversations (user_id, created_at desc);
