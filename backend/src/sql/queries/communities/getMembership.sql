-- getMembership.sql
-- $1 = community_id, $2 = user_id
SELECT
  user_id,
  community_id,
  role,
  joined_at
FROM community_membership
WHERE community_id = $1
  AND user_id      = $2;
