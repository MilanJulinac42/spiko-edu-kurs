-- Dodaje audio_url polja za:
--  1. exercises — audio uz pitanje ("Slušaj i odgovori" vežbe)
--  2. lessons — audio kao samostalan blok u lekciji (dijalog/slušanje)
-- Inline audio u TipTap tekstu se čuva unutar HTML body-ja (lessons.content.body),
-- pa nije potrebna posebna kolona.
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS audio_url text;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS audio_url text;
