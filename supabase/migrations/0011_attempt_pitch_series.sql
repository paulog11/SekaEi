-- Persisted pitch contour data per attempt for review on the attempt detail page.
-- Shape: { student: PitchSeries, native: PitchSeries | null }
-- Nullable: past attempts (and attempts where extraction failed) have no chart on review.
alter table attempts add column if not exists pitch_series jsonb;
