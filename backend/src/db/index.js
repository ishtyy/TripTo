// backend/src/db/index.js
const path = require('path');
const pgp  = require('pg-promise')({
  // you can add any initialization options here
});
const cn = {
  connectionString: process.env.DATABASE_URL,
  // or host, port, database, user, password...
};
const db = pgp(cn);

// helper to load .sql files:
function loadQuery(file) {
  return new pgp.QueryFile(path.join(__dirname, '..', 'sql', file), { minify: true });
}

// Auth
const sql = {
  auth: {
    register: loadQuery('queries/auth/register.sql'),
    login:    loadQuery('queries/auth/login.sql'),
  },
  users: {
    getProfile:         loadQuery('queries/users/getUserProfile.sql'),
    getUserCommunities: loadQuery('queries/users/getUserCommunities.sql'),
  },
  communities: {
    getAll:         loadQuery('queries/communities/getAllCommunities.sql'),
    getById:        loadQuery('queries/communities/getCommunityById.sql'),
    create:         loadQuery('queries/communities/createCommunity.sql'),
    getMembership:  loadQuery('queries/communities/getMembership.sql'),
    join:           loadQuery('queries/communities/joinCommunity.sql'),
    leave:          loadQuery('queries/communities/leaveCommunity.sql'),
    getMembers:     loadQuery('queries/communities/getMembers.sql'),
  },
  community_posts: {
    getByCommunity: loadQuery('queries/community_posts/getPostsByCommunity.sql'),
    create:         loadQuery('queries/community_posts/createCommunityPost.sql'),
  },
  blog: {
    getPosts: loadQuery('queries/blog/getPosts.sql'),
    create:   loadQuery('queries/blog/createPost.sql'),
  },
  locations: {
    findOrCreate: loadQuery('queries/locations/findOrCreateLocation.sql'),
  }
};

module.exports = { db, sql };
