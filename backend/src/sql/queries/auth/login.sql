-- login.sql
-- $1 = email
SELECT
  user_id,
  username,
  email,
  password,
  profile_picture_url,
  bio,
  created_at
FROM user_profile
WHERE email = $1;
