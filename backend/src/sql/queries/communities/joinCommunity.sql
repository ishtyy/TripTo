-- joinCommunity.sql
-- $1 = community_id, $2 = user_id
INSERT INTO community_membership (community_id, user_id, joined_at, role)
VALUES ($1, $2, NOW(), 'member')
RETURNING user_id, community_id, role, joined_at;
