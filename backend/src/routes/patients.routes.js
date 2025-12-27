import express from 'express';
import {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientAppointments,
  getPatientTransactions
} from '../controllers/patients.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission, PERMISSIONS } from '../utils/permissions.utils.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Obtener todos los pacientes
router.get('/', requirePermission(PERMISSIONS.PATIENTS_VIEW), getAllPatients);

// Obtener paciente por ID
router.get('/:id', requirePermission(PERMISSIONS.PATIENTS_VIEW), getPatientById);

// Obtener turnos de un paciente
router.get('/:id/appointments', requirePermission(PERMISSIONS.PATIENTS_VIEW), getPatientAppointments);

// Obtener transacciones de un paciente
router.get('/:id/transactions', requirePermission(PERMISSIONS.PATIENTS_VIEW), getPatientAppointments);

// Crear paciente
router.post('/', requirePermission(PERMISSIONS.PATIENTS_CREATE), createPatient);

// Actualizar paciente
router.put('/:id', requirePermission(PERMISSIONS.PATIENTS_UPDATE), updatePatient);

// Eliminar paciente (solo psicóloga)
router.delete('/:id', requirePermission(PERMISSIONS.PATIENTS_DELETE), deletePatient);

export default router;

