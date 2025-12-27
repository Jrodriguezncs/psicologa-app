import express from 'express';
import {
  getAllClinicalNotes,
  getClinicalNoteById,
  createClinicalNote,
  updateClinicalNote,
  deleteClinicalNote,
  getPatientClinicalNotes
} from '../controllers/clinicalNotes.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission, PERMISSIONS } from '../utils/permissions.utils.js';

const router = express.Router();

// Todas las rutas requieren autenticación y permisos específicos
router.use(authenticate);
router.use(requirePermission(PERMISSIONS.CLINICAL_NOTES_VIEW));

router.get('/', getAllClinicalNotes);
router.get('/patient/:patientId', getPatientClinicalNotes);
router.get('/:id', getClinicalNoteById);
router.post('/', createClinicalNote);
router.put('/:id', updateClinicalNote);
router.delete('/:id', deleteClinicalNote);

export default router;

