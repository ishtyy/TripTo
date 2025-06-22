-- leaveCommunity.sql
-- $1 = community_id, $2 = user_id
DELETE FROM community_membership
WHERE community_id = $1
  AND user_id      = $2
RETURNING user_id, community_id;
