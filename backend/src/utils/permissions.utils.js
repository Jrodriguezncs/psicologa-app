/**
 * Sistema de permisos granulares para el backend
 * Define qué acciones puede realizar cada rol
 */

export const PERMISSIONS = {
  // Pacientes
  PATIENTS_VIEW: 'patients:view',
  PATIENTS_CREATE: 'patients:create',
  PATIENTS_UPDATE: 'patients:update',
  PATIENTS_DELETE: 'patients:delete',
  
  // Turnos
  APPOINTMENTS_VIEW: 'appointments:view',
  APPOINTMENTS_CREATE: 'appointments:create',
  APPOINTMENTS_UPDATE: 'appointments:update',
  APPOINTMENTS_DELETE: 'appointments:delete',
  APPOINTMENTS_CHANGE_STATUS: 'appointments:change_status',
  
  // Facturación
  BILLING_VIEW: 'billing:view',
  BILLING_CREATE: 'billing:create',
  BILLING_UPDATE: 'billing:update',
  BILLING_DELETE: 'billing:delete',
  BILLING_EXPORT: 'billing:export',
  
  // Notas clínicas
  CLINICAL_NOTES_VIEW: 'clinical_notes:view',
  CLINICAL_NOTES_CREATE: 'clinical_notes:create',
  CLINICAL_NOTES_UPDATE: 'clinical_notes:update',
  CLINICAL_NOTES_DELETE: 'clinical_notes:delete',
  
  // Configuración
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_UPDATE: 'settings:update',
  
  // WhatsApp
  WHATSAPP_SEND: 'whatsapp:send',
  
  // Exportaciones
  EXPORT_DATA: 'export:data',
};

// Definir permisos por rol
const ROLE_PERMISSIONS = {
  PSYCHOLOGIST: [
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.PATIENTS_CREATE,
    PERMISSIONS.PATIENTS_UPDATE,
    PERMISSIONS.PATIENTS_DELETE,
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_CREATE,
    PERMISSIONS.APPOINTMENTS_UPDATE,
    PERMISSIONS.APPOINTMENTS_DELETE,
    PERMISSIONS.APPOINTMENTS_CHANGE_STATUS,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.BILLING_CREATE,
    PERMISSIONS.BILLING_UPDATE,
    PERMISSIONS.BILLING_DELETE,
    PERMISSIONS.BILLING_EXPORT,
    PERMISSIONS.CLINICAL_NOTES_VIEW,
    PERMISSIONS.CLINICAL_NOTES_CREATE,
    PERMISSIONS.CLINICAL_NOTES_UPDATE,
    PERMISSIONS.CLINICAL_NOTES_DELETE,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.WHATSAPP_SEND,
    PERMISSIONS.EXPORT_DATA,
  ],
  SECRETARY: [
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.PATIENTS_CREATE,
    PERMISSIONS.PATIENTS_UPDATE,
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_CREATE,
    PERMISSIONS.APPOINTMENTS_UPDATE,
    PERMISSIONS.APPOINTMENTS_CHANGE_STATUS,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.BILLING_CREATE,
    PERMISSIONS.BILLING_UPDATE,
    PERMISSIONS.BILLING_EXPORT,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.WHATSAPP_SEND,
    PERMISSIONS.EXPORT_DATA,
    // NO tiene acceso a:
    // - PATIENTS_DELETE
    // - APPOINTMENTS_DELETE
    // - BILLING_DELETE
    // - CLINICAL_NOTES (ninguno)
    // - SETTINGS_UPDATE
  ],
};

/**
 * Obtiene los permisos de un rol
 * @param {string} role - Rol del usuario
 * @returns {string[]} Array de permisos
 */
export const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Verifica si un usuario tiene un permiso específico
 * @param {string} role - Rol del usuario
 * @param {string} permission - Permiso a verificar
 * @returns {boolean}
 */
export const hasPermission = (role, permission) => {
  const permissions = getRolePermissions(role);
  return permissions.includes(permission);
};

/**
 * Middleware para verificar permisos específicos
 * @param {...string} requiredPermissions - Permisos requeridos
 */
export const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const userPermissions = getRolePermissions(req.user.role);
    const hasAllPermissions = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return res.status(403).json({
        message: 'No tienes permisos para realizar esta acción',
        required: requiredPermissions,
        role: req.user.role
      });
    }

    next();
  };
};

