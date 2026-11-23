//archivo de rutas de usuario, define las rutas para el registro y el inicio de sesion de usuario

import { Router } from 'express';
import { registerUser, loginUser, getMyProfile, getPublicProfile, updateMyProfile } from '../controllers/user.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', requireAuth, getMyProfile);
router.patch('/me', requireAuth, requireRole('artist', 'admin'), updateMyProfile);
router.get('/:id', getPublicProfile);

export default router;