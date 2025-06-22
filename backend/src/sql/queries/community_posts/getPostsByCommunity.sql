-- getPostsByCommunity.sql
-- $1 = community_id
SELECT
  post_id,
  community_id,
  user_id,
  title,
  content,
  created_at,
  upvote_count,
  downvote_count
FROM community_post
WHERE community_id = $1
ORDER BY created_at DESC;
