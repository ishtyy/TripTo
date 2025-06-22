-- getMembers.sql
-- $1 = community_id
SELECT
  cm.user_id,
  cm.role,
  cm.joined_at,
  u.username,
  u.profile_picture_url
FROM community_membership cm
JOIN user_profile u ON cm.user_id = u.user_id
WHERE cm.community_id = $1
ORDER BY cm.joined_at ASC;
