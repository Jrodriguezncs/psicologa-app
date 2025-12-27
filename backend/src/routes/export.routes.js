import express from 'express';
import {
  exportAccountStatementExcel,
  exportAccountStatementPDF,
  exportSessionsExcel
} from '../controllers/export.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission, PERMISSIONS } from '../utils/permissions.utils.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Verificar permisos de exportación
router.get('/*', requirePermission(PERMISSIONS.EXPORT_DATA));

router.get('/account-statement/excel', exportAccountStatementExcel);
router.get('/account-statement/pdf', exportAccountStatementPDF);
router.get('/sessions/excel', exportSessionsExcel);

export default router;

