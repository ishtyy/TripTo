import express from 'express';
// ✅ FIX: The import names now correctly match the functions exported from your controller.
import { register, login, loginAdmin } from '../controllers/authController.js';

// Assuming you have this middleware defined elsewhere. If not, you can remove it.
const authRateLimiter = (req, res, next) => next(); 

const router = express.Router();
// ✅ FIX: The route now correctly uses 'register' and 'login'.
router.post('/register', authRateLimiter, register);
router.post('/login', login);
router.post('/admin/login', loginAdmin);

export default router;