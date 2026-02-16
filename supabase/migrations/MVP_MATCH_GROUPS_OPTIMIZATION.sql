-- MVP Match Groups Optimization
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- Adds indexes for faster queries and a view for single-query groups + creator profiles
--
-- After running this migration:
-- 1. Run backfill for existing groups: npm run backfill-group-coords

-- 1. Indexes for match-groups query (status, is_public filter + distance columns)
CREATE INDEX IF NOT EXISTS idx_groups_status_is_public
  ON public.groups (status, is_public)
  WHERE status = 'active' AND is_public = true;

CREATE INDEX IF NOT EXISTS idx_groups_destination_coords
  ON public.groups (destination_lat, destination_lon)
  WHERE destination_lat IS NOT NULL AND destination_lon IS NOT NULL;

-- 2. Composite index for the main filter (status + is_public + average_age for age filter)
CREATE INDEX IF NOT EXISTS idx_groups_matchable
  ON public.groups (status, is_public, average_age)
  WHERE status = 'active' AND is_public = true;

-- 3. View: groups joined with creator profiles (single query for match-groups)
-- Replaces: 1 groups query + 1 profiles query
CREATE OR REPLACE VIEW public.matchable_groups_with_creator AS
SELECT
  g.id,
  g.name,
  g.destination,
  g.budget,
  g.start_date,
  g.end_date,
  g.creator_id,
  g.non_smokers,
  g.non_drinkers,
  g.dominant_languages,
  g.top_interests,
  g.average_age,
  g.members_count,
  g.cover_image,
  g.description,
  g.destination_lat,
  g.destination_lon,
  p.name AS creator_name,
  p.username AS creator_username,
  p.profile_photo AS creator_profile_photo,
  p.nationality AS creator_nationality
FROM public.groups g
LEFT JOIN public.profiles p ON g.creator_id = p.user_id;

-- Grant read access (Supabase uses service role for API, but ensure view is accessible)
GRANT SELECT ON public.matchable_groups_with_creator TO authenticated;
GRANT SELECT ON public.matchable_groups_with_creator TO service_role;

-- -----------------------------------------------------------------------------
-- Solo matching indexes
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_matches_destination_user
  ON public.matches (destination_id)
  WHERE destination_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_match_skips_solo_destination
  ON public.match_skips (user_id, destination_id, match_type)
  WHERE match_type = 'solo';

CREATE INDEX IF NOT EXISTS idx_match_interests_destination
  ON public.match_interests (from_user_id, destination_id, status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_user_flags_reporter_user
  ON public.user_flags (reporter_id, user_id);
