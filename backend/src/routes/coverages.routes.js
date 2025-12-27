import express from 'express';
import {
  getAllCoverages,
  getCoverageById,
  createCoverage,
  updateCoverage,
  deleteCoverage
} from '../controllers/coverages.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllCoverages);
router.get('/:id', getCoverageById);
router.post('/', createCoverage);
router.put('/:id', updateCoverage);
router.delete('/:id', deleteCoverage);

export default router;

