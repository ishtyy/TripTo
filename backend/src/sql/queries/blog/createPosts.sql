-- createPost.sql
-- $1 = author_id, $2 = location_id, $3 = title, $4 = content
INSERT INTO blogpost (author_id, location_id, title, content, created_at, last_updated_at)
VALUES ($1, $2, $3, $4, NOW(), NOW())
RETURNING
  post_id,
  author_id,
  location_id,
  title,
  content,
  created_at,
  last_updated_at,
  upvote_count,
  downvote_count;
