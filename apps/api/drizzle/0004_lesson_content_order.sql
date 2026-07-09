-- Dodaje kolonu za redosled blokova sadržaja unutar lekcije.
-- Vrednost je jsonb niz tipova: ['video', 'text', 'exercises'] u željenom redosledu.
-- Ako je null, frontend koristi default redosled (video → text → exercises).
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS content_order jsonb;
