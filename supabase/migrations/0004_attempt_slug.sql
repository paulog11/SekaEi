-- Add slug column to attempts for short, shareable URLs
alter table attempts add column if not exists slug text unique;

-- Backfill existing rows with a slug derived from the UUID
-- (existing rows only — new rows will have server-generated nanoid slugs)
update attempts set slug = substring(replace(id::text, '-', ''), 1, 12) where slug is null;

-- Make non-nullable after backfill
alter table attempts alter column slug set not null;

create index if not exists attempts_slug on attempts (slug);
