import twilio from 'twilio';
import axios from 'axios';
import logger from '../utils/logger.js';

/**
 * Servicio de WhatsApp Business
 * Soporta integración con Twilio y Meta (WhatsApp Business API)
 */
class WhatsAppService {
  constructor() {
    this.provider = process.env.WHATSAPP_PROVIDER || 'twilio'; // 'twilio' o 'meta'
    this.initialized = false;
    this.client = null;
    
    this.init();
  }

  async init() {
    try {
      if (this.provider === 'twilio') {
        await this.initTwilio();
      } else if (this.provider === 'meta') {
        await this.initMeta();
      }
      this.initialized = true;
      logger.info('WhatsApp service initialized', { provider: this.provider });
    } catch (error) {
      logger.error('Error initializing WhatsApp service', { error: error.message });
      // No lanzar error para permitir que la app funcione sin WhatsApp
    }
  }

  async initTwilio() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!accountSid || !authToken || !whatsappNumber) {
      throw new Error('Twilio credentials not configured');
    }

    this.client = twilio(accountSid, authToken);
    this.config = {
      from: `whatsapp:${whatsappNumber}`
    };
  }

  async initMeta() {
    this.config = {
      accessToken: process.env.META_ACCESS_TOKEN,
      phoneNumberId: process.env.META_PHONE_NUMBER_ID,
      businessAccountId: process.env.META_BUSINESS_ACCOUNT_ID,
      apiVersion: process.env.META_API_VERSION || 'v18.0'
    };

    if (!this.config.accessToken || !this.config.phoneNumberId) {
      throw new Error('Meta WhatsApp credentials not configured');
    }
  }

  /**
   * Envía un mensaje usando Twilio
   */
  async sendWithTwilio(to, message) {
    try {
      const result = await this.client.messages.create({
        from: this.config.from,
        to: `whatsapp:${this.normalizePhoneNumber(to)}`,
        body: message
      });

      logger.info('WhatsApp message sent via Twilio', {
        to,
        messageId: result.sid,
        status: result.status
      });

      return {
        success: true,
        messageId: result.sid,
        status: result.status,
        provider: 'twilio'
      };
    } catch (error) {
      logger.error('Error sending WhatsApp via Twilio', {
        to,
        error: error.message,
        code: error.code
      });
      throw error;
    }
  }

  /**
   * Envía un mensaje usando Meta API
   */
  async sendWithMeta(to, message) {
    try {
      const url = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`;
      
      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          to: this.normalizePhoneNumber(to),
          type: 'text',
          text: {
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('WhatsApp message sent via Meta', {
        to,
        messageId: response.data.messages[0].id,
        status: 'sent'
      });

      return {
        success: true,
        messageId: response.data.messages[0].id,
        status: 'sent',
        provider: 'meta'
      };
    } catch (error) {
      logger.error('Error sending WhatsApp via Meta', {
        to,
        error: error.response?.data || error.message,
        status: error.response?.status
      });
      throw error;
    }
  }

  /**
   * Normaliza número de teléfono al formato internacional
   */
  normalizePhoneNumber(phone) {
    // Remover caracteres no numéricos excepto +
    let normalized = phone.replace(/[^\d+]/g, '');
    
    // Si no tiene código de país, asumir Argentina (+54)
    if (!normalized.startsWith('+')) {
      normalized = normalized.replace(/^0/, ''); // Quitar 0 inicial
      normalized = `+54${normalized}`;
    }
    
    return normalized;
  }

  /**
   * Envía un mensaje de WhatsApp
   * @param {string} to - Número de teléfono destino
   * @param {string} message - Mensaje a enviar
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendMessage(to, message) {
    if (!this.initialized) {
      logger.warn('WhatsApp service not initialized, message not sent', { to });
      return {
        success: false,
        error: 'WhatsApp service not configured',
        simulated: true
      };
    }

    try {
      if (this.provider === 'twilio') {
        return await this.sendWithTwilio(to, message);
      } else if (this.provider === 'meta') {
        return await this.sendWithMeta(to, message);
      }
    } catch (error) {
      // En caso de error, registrar y retornar información útil
      logger.error('Failed to send WhatsApp message', {
        to,
        provider: this.provider,
        error: error.message
      });
      
      throw {
        message: 'Error al enviar mensaje de WhatsApp',
        provider: this.provider,
        originalError: error.message
      };
    }
  }

  /**
   * Verifica el estado del servicio
   */
  async healthCheck() {
    return {
      initialized: this.initialized,
      provider: this.provider,
      configured: this.config ? Object.keys(this.config).length > 0 : false
    };
  }
}

// Singleton instance
const whatsappService = new WhatsAppService();

export default whatsappService;

