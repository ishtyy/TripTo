-- createCommunity.sql
-- $1 = community_name, $2 = description, $3 = location_id, $4 = creator_user_id
WITH new_comm AS (
  INSERT INTO community (community_name, description, location_id, created_at)
  VALUES ($1, $2, $3, NOW())
  RETURNING community_id, community_name, description, location_id, created_at
)
INSERT INTO community_membership (community_id, user_id, joined_at, role)
SELECT community_id, $4, NOW(), 'admin'
  FROM new_comm;

-- to return the newly created community row:
SELECT * FROM community WHERE community_id = (SELECT community_id FROM new_comm);
