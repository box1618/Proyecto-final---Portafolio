import { Router } from 'express';
import {
  createCommission,
  getCommissions,
  updateCommissionStatus
} from '../controllers/commission.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', requireAuth, getCommissions);
router.post('/', requireAuth, requireRole('client'), createCommission);
router.patch('/:id/status', requireAuth, requireRole('artist', 'admin'), updateCommissionStatus);

export default router;
