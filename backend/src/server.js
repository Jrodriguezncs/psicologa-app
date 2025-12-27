import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Importar rutas
import authRoutes from './routes/auth.routes.js';
import patientRoutes from './routes/patients.routes.js';
import appointmentRoutes from './routes/appointments.routes.js';
import billingRoutes from './routes/billing.routes.js';
import coverageRoutes from './routes/coverages.routes.js';
import feeRoutes from './routes/fees.routes.js';
import clinicalNoteRoutes from './routes/clinicalNotes.routes.js';
import whatsappRoutes from './routes/whatsapp.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import exportRoutes from './routes/export.routes.js';
import logger from './utils/logger.js';

// Configuración
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/coverages', coverageRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/clinical-notes', clinicalNoteRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export', exportRoutes);

// Manejo de errores
app.use((err, req, res, next) => {
  logger.error('Error en request', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`🚀 Servidor corriendo en http://localhost:${PORT}`, {
    port: PORT,
    env: process.env.NODE_ENV
  });
});

// Manejo de cierre
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

