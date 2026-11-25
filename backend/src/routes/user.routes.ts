//archivo de rutas de usuario, define las rutas para el registro y el inicio de sesion de usuario

import { Router, type RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { registerUser, loginUser, getMyProfile, getPublicProfile, updateMyProfile } from '../controllers/user.controller';
import { updateMyAvatar, updateMyBanner } from '../controllers/profileAvatar.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false
});
const profileImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
      callback(new Error('La imagen debe estar en formato JPG, PNG, WebP o GIF.'));
      return;
    }
    callback(null, true);
  }
});

function handleProfileImageUpload(fieldName: 'avatar' | 'banner'): RequestHandler {
  return (req, res, next) => {
    profileImageUpload.single(fieldName)(req, res, (error: unknown) => {
      if (!error) {
        next();
        return;
      }
      const message = error instanceof Error ? error.message : 'No se pudo procesar la imagen.';
      res.status(400).json({ error: message });
    });
  };
}

router.post('/register', authRateLimit, registerUser);
router.post('/login', authRateLimit, loginUser);
router.get('/me', requireAuth, getMyProfile);
router.patch('/me', requireAuth, updateMyProfile);
router.post('/me/avatar', requireAuth, requireRole('client', 'artist', 'admin'), handleProfileImageUpload('avatar'), updateMyAvatar);
router.post('/me/banner', requireAuth, requireRole('artist', 'admin'), handleProfileImageUpload('banner'), updateMyBanner);
router.get('/:id', getPublicProfile);

export default router;