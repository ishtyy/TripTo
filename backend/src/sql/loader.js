// src/sql/loader.js
const path = require('path');
const { QueryFile } = require('pg-promise');
function load(file) {
  return new QueryFile(path.join(__dirname, 'queries', file), { minify: true });
}
module.exports = {
  // auth
  register: load('auth/register.sql'),
  login:    load('auth/login.sql'),
  // users
  getUserProfile:    load('users/getUserProfile.sql'),
  getUserCommunities:load('users/getUserCommunities.sql'),
  // communities
  getAllCommunities: load('communities/getAllCommunities.sql'),
  getCommunityById:  load('communities/getCommunityById.sql'),
  createCommunity:   load('communities/createCommunity.sql'),
  getMembership:     load('communities/getMembership.sql'),
  joinCommunity:     load('communities/joinCommunity.sql'),
  leaveCommunity:    load('communities/leaveCommunity.sql'),
  getMembers:        load('communities/getMembers.sql'),
  // community posts
  getPostsByCommunity: load('community_posts/getPostsByCommunity.sql'),
  createCommunityPost: load('community_posts/createCommunityPost.sql'),
  // blog posts
  getPosts:    load('blog/getPosts.sql'),
  createPost:  load('blog/createPost.sql'),
  // locations
  findOrCreateLocation: load('locations/findOrCreateLocation.sql'),
  // flights: we’ll still call Amadeus SDK here
};
