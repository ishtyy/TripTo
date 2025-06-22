// backend/src/app.js
require('dotenv').config();      // ← must come first!

const path = require('path');
const express = require('express');
const cors    = require('cors');
const pgp     = require('pg-promise')();

// your DB + SQL loader
const cn = { connectionString: process.env.DATABASE_URL };
const db = pgp(cn);
function loadQuery(file) {
  return new pgp.QueryFile(path.join(__dirname, '..', 'sql', file), { minify: true });
}
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

const app = express();

// allow your React dev server (or any) to talk to this API
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// example “blog” endpoints—repeat for auth, communities, etc.

// right after you `app.use(express.json());`
app.get('/api/debug/posts', async (_req, res) => {
  try {
    // this uses pg-promise directly to run a raw SQL string
    const rows = await db.any('SELECT * FROM blogpost LIMIT 5;');
    res.json({ sample: rows });
  } catch (err) {
    console.error('Debug /api/debug/posts error:', err);
    res.status(500).json({ error: 'Unable to fetch debug posts' });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const { title, content, location_id } = req.body;
    const newPost = await db.one(sql.blog.create, { title, content, location_id });
    res.status(201).json({ post: newPost });
  } catch (err) {
    console.log('Create Post Error:', err);
    console.error('Create Post Error:', err);
    res.status(500).json({ error: 'Could not create post' });
  }
});

// … mount the rest of your endpoints here in the same fashion …

// catch-all error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// finally, start listening:
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend listening on port ${PORT}`);
});
