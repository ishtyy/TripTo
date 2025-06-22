-- getPosts.sql
-- optional filtering: pass NULL to ignore
-- $1 = community_id_filter, $2 = user_id_filter
SELECT
  post_id,
  title,
  content,
  created_at,
  author_id,
  upvote_count,
  downvote_count
FROM blogpost
WHERE ( $1::uuid IS NULL OR location_id = $1 )
  AND ( $2::uuid IS NULL OR author_id   = $2 )
ORDER BY created_at DESC;
