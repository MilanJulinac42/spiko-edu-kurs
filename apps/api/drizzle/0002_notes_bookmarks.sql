-- Personal notes per lesson (jedan red po user+lesson)
create table if not exists public.lesson_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  body text not null default '',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

-- Reči/fraze koje student bookmarkuje iz lekcije
create table if not exists public.vocabulary_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete set null,
  word text not null,
  translation text,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists vocab_bookmarks_user_lesson_idx
  on public.vocabulary_bookmarks(user_id, lesson_id);

alter table public.lesson_notes enable row level security;
alter table public.vocabulary_bookmarks enable row level security;
