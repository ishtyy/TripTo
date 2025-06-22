-- getUserProfile.sql
-- $1 = user_id
SELECT
  user_id,
  username,
  email,
  profile_picture_url,
  bio,
  created_at
FROM user_profile
WHERE user_id = $1;
