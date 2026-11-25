import { Router } from 'express';
import multer from 'multer';
import {
  createService,
  getPublicService,
  listManageableServices,
  listPublicServices,
  updateService
} from '../controllers/serviceListing.controller';
import { uploadServiceImages } from '../controllers/serviceImage.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      callback(new Error('Solo se permiten archivos de imagen.'));
      return;
    }
    callback(null, true);
  }
});
const manageServices = [requireAuth, requireRole('artist', 'admin')];

router.get('/', listPublicServices);
router.get('/manage', ...manageServices, listManageableServices);
router.post('/', ...manageServices, createService);
router.put('/:id', ...manageServices, updateService);
router.post('/images', ...manageServices, (req, res, next) => {
  imageUpload.array('images', 6)(req, res, (error) => {
    if (!error) {
      next();
      return;
    }
    const message = error instanceof Error ? error.message : 'No se pudo procesar la imagen.';
    res.status(400).json({ error: message });
  });
}, uploadServiceImages);
router.get('/:slug', getPublicService);

export default router;
