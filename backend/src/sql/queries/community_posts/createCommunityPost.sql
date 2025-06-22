-- createCommunityPost.sql
-- $1 = community_id, $2 = user_id, $3 = title, $4 = content
INSERT INTO community_post (community_id, user_id, title, content, created_at)
VALUES ($1, $2, $3, $4, NOW())
RETURNING
  post_id,
  community_id,
  user_id,
  title,
  content,
  created_at,
  upvote_count,
  downvote_count;
