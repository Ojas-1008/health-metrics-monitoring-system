import express from 'express';
import { 
  registerUser, 
  login, 
  getMe, 
  updateProfile, 
  changePassword 
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', registerUser);
router.post('/login', login);

// Protected routes (authentication required)
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

export default router;
