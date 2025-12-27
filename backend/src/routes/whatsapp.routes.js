import express from 'express';
import {
  sendMessage,
  sendReminder,
  sendAppointmentReminders
} from '../controllers/whatsapp.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/send', sendMessage);
router.post('/reminder/:appointmentId', sendReminder);
router.post('/reminders/process', sendAppointmentReminders);

export default router;

