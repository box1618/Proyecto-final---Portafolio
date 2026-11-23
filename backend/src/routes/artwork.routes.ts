import { Router } from 'express';
import { listArtworks } from '../controllers/artwork.controller';

const router = Router();

router.get('/', listArtworks);

export default router;
