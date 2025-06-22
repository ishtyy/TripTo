-- $1 = author_id, $2 = location_id, $3 = title, $4 = content
INSERT INTO blogpost (post_id, author_id, location_id, title, content, created_at, last_updated_at, upvote_count, downvote_count)
VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW(), 0, 0)
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
