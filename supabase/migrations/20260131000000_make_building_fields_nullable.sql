-- Make building fields nullable so scraper can insert with just the code
-- User will manually fill in name, coordinates via Supabase Studio

ALTER TABLE "public"."buildings"
  ALTER COLUMN "name" DROP NOT NULL,
  ALTER COLUMN "latitude" DROP NOT NULL,
  ALTER COLUMN "longitude" DROP NOT NULL;
