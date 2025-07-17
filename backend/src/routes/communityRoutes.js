// src/routes/communityRoutes.js

import express from 'express';
import {
    getAllCommunities,
    getCommunityById,
    createCommunity,
    getMembershipStatus,
    joinCommunity,
    leaveCommunity,
    getCommunityMembers,
    getCommunityDetails
} from '../controllers/communityController.js';

import { checkJwtMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllCommunities);
router.get('/:communityId', getCommunityById);
router.post('/', checkJwtMiddleware, createCommunity);
router.get('/:communityId/membership', checkJwtMiddleware, getMembershipStatus);
router.post('/:communityId/join', checkJwtMiddleware, joinCommunity);
router.delete('/:communityId/leave', checkJwtMiddleware, leaveCommunity);
router.get('/:communityId/members', getCommunityMembers);
router.get('/:communityId/details', checkJwtMiddleware, getCommunityDetails);

export default router;
