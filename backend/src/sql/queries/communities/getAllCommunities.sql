-- getAllCommunities.sql
SELECT
  community_id,
  community_name,
  description,
  created_at,
  location_id
FROM community
ORDER BY created_at DESC;
