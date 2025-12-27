import { PrismaClient } from '@prisma/client';
import {
  sendReminder,
  get24hReminderTemplate,
  get1hReminderTemplate,
  get50mReminderTemplate
} from '../utils/whatsapp.utils.js';
import { subHours, subMinutes, addHours, addMinutes } from 'date-fns';
import logger from '../utils/logger.js';
import whatsappService from '../services/whatsapp.service.js';

const prisma = new PrismaClient();

/**
 * Job para procesar recordatorios automáticos
 * Debe ejecutarse cada 5-10 minutos mediante un cron job
 */
export const processReminders = async () => {
  try {
    const now = new Date();
    const mapsUrl = process.env.GOOGLE_MAPS_URL || '';

    logger.info('Starting reminder job', { timestamp: now.toISOString() });

    // Obtener turnos confirmados que necesitan recordatorios
    const appointments = await prisma.appointment.findMany({
      where: {
        status: 'CONFIRMED',
        date: {
          gte: now,
          lte: addHours(now, 25) // Próximas 25 horas
        }
      },
      include: {
        patient: true
      }
    });

    const results = [];

    for (const appointment of appointments) {
      const appointmentDate = new Date(appointment.date);
      
      // Recordatorio 24h antes
      if (!appointment.reminder24hSent) {
        const reminderTime24h = subHours(appointmentDate, 24);
        const windowStart24h = subHours(reminderTime24h, 1);
        const windowEnd24h = addHours(reminderTime24h, 1);

        if (now >= windowStart24h && now <= windowEnd24h) {
          try {
            const message = get24hReminderTemplate(appointment);
            await whatsappService.sendMessage(appointment.patient.phone, message);
            
            await prisma.appointment.update({
              where: { id: appointment.id },
              data: { reminder24hSent: true }
            });

            results.push({ appointmentId: appointment.id, type: '24h', status: 'sent' });
            logger.info('24h reminder sent', { appointmentId: appointment.id });
          } catch (error) {
            logger.error('Error sending 24h reminder', {
              appointmentId: appointment.id,
              error: error.message
            });
            results.push({ appointmentId: appointment.id, type: '24h', status: 'error' });
          }
        }
      }

      // Recordatorio 1h antes
      if (!appointment.reminder1hSent) {
        const reminderTime1h = subHours(appointmentDate, 1);
        const windowStart1h = subMinutes(reminderTime1h, 10);
        const windowEnd1h = addMinutes(reminderTime1h, 10);

        if (now >= windowStart1h && now <= windowEnd1h) {
          try {
            const message = get1hReminderTemplate(appointment);
            await whatsappService.sendMessage(appointment.patient.phone, message);
            
            await prisma.appointment.update({
              where: { id: appointment.id },
              data: { reminder1hSent: true }
            });

            results.push({ appointmentId: appointment.id, type: '1h', status: 'sent' });
            logger.info('1h reminder sent', { appointmentId: appointment.id });
          } catch (error) {
            logger.error('Error sending 1h reminder', {
              appointmentId: appointment.id,
              error: error.message
            });
            results.push({ appointmentId: appointment.id, type: '1h', status: 'error' });
          }
        }
      }

      // Recordatorio 50min antes
      if (!appointment.reminder50mSent) {
        const reminderTime50m = subMinutes(appointmentDate, 50);
        const windowStart50m = subMinutes(reminderTime50m, 5);
        const windowEnd50m = addMinutes(reminderTime50m, 5);

        if (now >= windowStart50m && now <= windowEnd50m) {
          try {
            const message = get50mReminderTemplate(appointment, mapsUrl);
            await whatsappService.sendMessage(appointment.patient.phone, message);
            
            await prisma.appointment.update({
              where: { id: appointment.id },
              data: { reminder50mSent: true }
            });

            results.push({ appointmentId: appointment.id, type: '50m', status: 'sent' });
            logger.info('50m reminder sent', { appointmentId: appointment.id });
          } catch (error) {
            logger.error('Error sending 50m reminder', {
              appointmentId: appointment.id,
              error: error.message
            });
            results.push({ appointmentId: appointment.id, type: '50m', status: 'error' });
          }
        }
      }
    }

    logger.info('Reminder job completed', {
      totalProcessed: appointments.length,
      remindersSent: results.filter(r => r.status === 'sent').length,
      errors: results.filter(r => r.status === 'error').length
    });

    return results;
  } catch (error) {
    logger.error('Error in reminder job', { error: error.message, stack: error.stack });
    throw error;
  }
};

