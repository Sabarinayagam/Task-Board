import { Router } from 'express';
import { cardController } from '../controllers/cardController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get('/cards', asyncHandler(cardController.list));
router.post('/cards', asyncHandler(cardController.create));
router.put('/cards/:id', asyncHandler(cardController.rename));
router.patch('/cards/:id/status', asyncHandler(cardController.updateStatus));
router.patch('/cards/reorder', asyncHandler(cardController.reorder));
router.delete('/cards/:id', asyncHandler(cardController.remove));

export default router;
