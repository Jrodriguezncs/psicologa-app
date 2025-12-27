import express from 'express';
import {
  getDashboardStats,
  getUpcomingAppointments,
  getPendingTransactions
} from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/upcoming-appointments', getUpcomingAppointments);
router.get('/pending-transactions', getPendingTransactions);

export default router;

