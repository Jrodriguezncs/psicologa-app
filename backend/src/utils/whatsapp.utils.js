import whatsappService from '../services/whatsapp.service.js';
import logger from '../utils/logger.js';

/**
 * Envía un mensaje por WhatsApp usando el servicio configurado
 * @param {string} phoneNumber - Número de teléfono del destinatario
 * @param {string} message - Mensaje a enviar
 * @returns {Promise<Object>} Resultado del envío
 */
export const sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    const result = await whatsappService.sendMessage(phoneNumber, message);
    
    if (result.simulated) {
      logger.warn('WhatsApp message simulated (service not configured)', { phoneNumber });
    }
    
    return {
      success: result.success,
      messageId: result.messageId || `msg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      phoneNumber,
      status: result.status || 'sent',
      provider: result.provider || 'none',
      simulated: result.simulated || false
    };
  } catch (error) {
    logger.error('Error in sendWhatsAppMessage', { 
      phoneNumber, 
      error: error.message 
    });
    throw error;
  }
};

/**
 * Genera template de mensaje para recordatorio 24h antes
 * @param {Object} appointment - Objeto del turno
 * @returns {string} Mensaje formateado
 */
export const get24hReminderTemplate = (appointment) => {
  const { patient, date } = appointment;
  const dateStr = new Date(date).toLocaleString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `Hola ${patient.firstName}! 👋

Te recordamos que tenés un turno mañana:

📅 ${dateStr}

Por favor confirmá tu asistencia respondiendo a este mensaje.

Saludos! 😊`;
};

/**
 * Genera template de mensaje para recordatorio 1h antes
 * @param {Object} appointment - Objeto del turno
 * @returns {string} Mensaje formateado
 */
export const get1hReminderTemplate = (appointment) => {
  if (!appointment || !appointment.patient) {
    throw new Error('Appointment data incomplete');
  }
  const { patient, date } = appointment;
  const dateStr = new Date(date).toLocaleString('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return `Hola ${patient.firstName}! 

Tu turno es en 1 hora (${dateStr}).

Te esperamos! 😊`;
};

/**
 * Genera template de mensaje para recordatorio 50min antes con link a Google Maps
 * @param {Object} appointment - Objeto del turno
 * @param {string} mapsUrl - URL de Google Maps (dirección del consultorio)
 * @returns {string} Mensaje formateado
 */
export const get50mReminderTemplate = (appointment, mapsUrl = process.env.GOOGLE_MAPS_URL || 'https://goo.gl/maps/example') => {
  if (!appointment || !appointment.patient) {
    throw new Error('Appointment data incomplete');
  }
  const { patient, date } = appointment;
  const dateStr = new Date(date).toLocaleString('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return `Hola ${patient.firstName}! 

Tu turno es en 50 minutos (${dateStr}).

📍 Ubicación del consultorio:
${mapsUrl}

¡Nos vemos pronto! 😊`;
};

/**
 * Simula el envío de recordatorio
 * @param {Object} appointment - Turno
 * @param {string} reminderType - Tipo de recordatorio ('24h', '1h', '50m')
 * @param {string} mapsUrl - URL de Google Maps (opcional)
 * @returns {Promise<Object>} Resultado del envío
 */
export const sendReminder = async (appointment, reminderType, mapsUrl = null) => {
  let message = '';
  
  switch (reminderType) {
    case '24h':
      message = get24hReminderTemplate(appointment);
      break;
    case '1h':
      message = get1hReminderTemplate(appointment);
      break;
    case '50m':
      message = get50mReminderTemplate(appointment, mapsUrl);
      break;
    default:
      throw new Error('Tipo de recordatorio inválido');
  }

  return await sendWhatsAppMessage(appointment.patient.phone, message);
};

