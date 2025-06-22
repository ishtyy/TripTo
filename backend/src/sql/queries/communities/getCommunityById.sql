-- getCommunityById.sql
-- $1 = community_id
SELECT
  community_id,
  community_name,
  description,
  created_at,
  location_id
FROM community
WHERE community_id = $1;
