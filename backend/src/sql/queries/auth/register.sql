-- register.sql
-- $1 = email, $2 = password_hash, $3 = username
INSERT INTO user_profile (email, password, username, created_at)
VALUES ($1, $2, $3, NOW())
RETURNING
  user_id,
  username,
  email,
  profile_picture_url,
  bio,
  created_at;
