import { PrismaClient } from '@prisma/client';
import {
  sendWhatsAppMessage,
  sendReminder as sendWhatsAppReminder,
  get24hReminderTemplate,
  get1hReminderTemplate,
  get50mReminderTemplate
} from '../utils/whatsapp.utils.js';
import { addHours, addMinutes, isBefore, subHours, subMinutes } from 'date-fns';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Enviar mensaje personalizado
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        message: 'phoneNumber y message son requeridos'
      });
    }

    const result = await sendWhatsAppMessage(phoneNumber, message);

    res.json({
      message: 'Mensaje enviado exitosamente',
      result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Enviar recordatorio para un turno específico
 */
export const sendReminder = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { reminderType, mapsUrl } = req.body;

    if (!reminderType || !['24h', '1h', '50m'].includes(reminderType)) {
      return res.status(400).json({
        message: 'reminderType debe ser: 24h, 1h o 50m'
      });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true
      }
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }

    const result = await sendWhatsAppReminder(appointment, reminderType, mapsUrl);

    // Actualizar flags de recordatorio enviado
    const updateData = {};
    if (reminderType === '24h') updateData.reminder24hSent = true;
    if (reminderType === '1h') updateData.reminder1hSent = true;
    if (reminderType === '50m') updateData.reminder50mSent = true;

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData
    });

    res.json({
      message: 'Recordatorio enviado exitosamente',
      result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Procesar y enviar recordatorios automáticos para turnos próximos
 * Esta función debe ejecutarse periódicamente (ej: cada 5 minutos) mediante un cron job
 */
export const sendAppointmentReminders = async (req, res, next) => {
  try {
    const now = new Date();
    const { mapsUrl } = req.body;

    // Obtener turnos confirmados en las próximas 24 horas
    const appointments24h = await prisma.appointment.findMany({
      where: {
        status: 'CONFIRMED',
        date: {
          gte: now,
          lte: addHours(now, 24)
        },
        reminder24hSent: false
      },
      include: {
        patient: true
      }
    });

    // Obtener turnos en la próxima hora
    const appointments1h = await prisma.appointment.findMany({
      where: {
        status: 'CONFIRMED',
        date: {
          gte: now,
          lte: addHours(now, 1)
        },
        reminder1hSent: false
      },
      include: {
        patient: true
      }
    });

    // Obtener turnos en los próximos 50 minutos
    const appointments50m = await prisma.appointment.findMany({
      where: {
        status: 'CONFIRMED',
        date: {
          gte: now,
          lte: addMinutes(now, 50)
        },
        reminder50mSent: false
      },
      include: {
        patient: true
      }
    });

    const results = [];

    // Enviar recordatorios de 24h (ventana: 24h ± 1h)
    for (const appointment of appointments24h) {
      const appointmentDate = new Date(appointment.date);
      const reminderTime = subHours(appointmentDate, 24);
      const reminderWindowStart = subHours(reminderTime, 1); // 1 hora antes de la ventana
      const reminderWindowEnd = addHours(reminderTime, 1); // 1 hora después de la ventana

      // Solo enviar si estamos dentro de la ventana de tiempo
      if (now < reminderWindowStart || now > reminderWindowEnd) {
        continue;
      }

      try {
        logger.info('Sending 24h reminder', { appointmentId: appointment.id });
        await sendWhatsAppReminder(appointment, '24h', mapsUrlFinal);
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { reminder24hSent: true }
        });
        results.push({ appointmentId: appointment.id, type: '24h', status: 'sent' });
      } catch (error) {
        logger.error('Error sending 24h reminder', {
          appointmentId: appointment.id,
          error: error.message
        });
        results.push({ appointmentId: appointment.id, type: '24h', status: 'error', error: error.message });
      }
    }

    // Enviar recordatorios de 1h (ventana: 1h ± 10min)
    for (const appointment of appointments1h) {
      const appointmentDate = new Date(appointment.date);
      const reminderTime = subHours(appointmentDate, 1);
      const reminderWindowStart = subMinutes(reminderTime, 10);
      const reminderWindowEnd = addMinutes(reminderTime, 10);

      if (now < reminderWindowStart || now > reminderWindowEnd) {
        continue;
      }

      try {
        logger.info('Sending 1h reminder', { appointmentId: appointment.id });
        await sendWhatsAppReminder(appointment, '1h', mapsUrlFinal);
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { reminder1hSent: true }
        });
        results.push({ appointmentId: appointment.id, type: '1h', status: 'sent' });
      } catch (error) {
        logger.error('Error sending 1h reminder', {
          appointmentId: appointment.id,
          error: error.message
        });
        results.push({ appointmentId: appointment.id, type: '1h', status: 'error', error: error.message });
      }
    }

    // Enviar recordatorios de 50m (ventana: 50m ± 5min)
    for (const appointment of appointments50m) {
      const appointmentDate = new Date(appointment.date);
      const reminderTime = subMinutes(appointmentDate, 50);
      const reminderWindowStart = subMinutes(reminderTime, 5);
      const reminderWindowEnd = addMinutes(reminderTime, 5);

      if (now < reminderWindowStart || now > reminderWindowEnd) {
        continue;
      }

      try {
        logger.info('Sending 50m reminder', { appointmentId: appointment.id });
        await sendWhatsAppReminder(appointment, '50m', mapsUrlFinal);
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { reminder50mSent: true }
        });
        results.push({ appointmentId: appointment.id, type: '50m', status: 'sent' });
      } catch (error) {
        logger.error('Error sending 50m reminder', {
          appointmentId: appointment.id,
          error: error.message
        });
        results.push({ appointmentId: appointment.id, type: '50m', status: 'error', error: error.message });
      }
    }

    logger.info('Reminders processing completed', {
      total: results.length,
      sent: results.filter(r => r.status === 'sent').length,
      errors: results.filter(r => r.status === 'error').length
    });

    res.json({
      message: 'Procesamiento de recordatorios completado',
      results,
      summary: {
        total: results.length,
        sent: results.filter(r => r.status === 'sent').length,
        errors: results.filter(r => r.status === 'error').length
      }
    });
  } catch (error) {
    next(error);
  }
};

