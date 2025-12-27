import express from 'express';
import {
  getAllFees,
  getFeeById,
  createFee,
  updateFee,
  deleteFee,
  getGlobalFee
} from '../controllers/fees.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllFees);
router.get('/global', getGlobalFee);
router.get('/:id', getFeeById);
router.post('/', createFee);
router.put('/:id', updateFee);
router.delete('/:id', deleteFee);

export default router;

