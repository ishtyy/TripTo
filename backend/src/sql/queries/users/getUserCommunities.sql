-- getUserCommunities.sql
-- $1 = user_id
SELECT
  c.community_id,
  c.community_name,
  c.description,
  c.created_at,
  cm.role             AS user_role_in_community,
  cm.joined_at        AS joined_community_at,
  l.location_id,
  l.location_name,
  l.country
FROM community_membership cm
JOIN community c       ON cm.community_id = c.community_id
JOIN location l        ON c.location_id    = l.location_id
WHERE cm.user_id = $1
ORDER BY cm.joined_at DESC;
