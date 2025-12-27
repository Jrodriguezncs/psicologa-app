# 👩‍⚕️ Sistema de Gestión para Psicóloga

Sistema integral de gestión para consultorio psicológico desarrollado con stack moderno fullstack. Permite gestionar pacientes, turnos, honorarios, facturación, notas clínicas y comunicaciones automatizadas por WhatsApp.

## 🛠️ Stack Tecnológico

- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express
- **Base de Datos**: PostgreSQL
- **ORM**: Prisma
- **Autenticación**: JWT
- **WhatsApp API**: Simulada (preparada para integración real)

## 📁 Estructura del Proyecto

```
ProcessAPP/
├── backend/                 # API REST en Node.js
│   ├── src/
│   │   ├── controllers/    # Lógica de negocio
│   │   ├── routes/         # Rutas API
│   │   ├── middleware/     # Middlewares (auth, etc.)
│   │   ├── utils/          # Utilidades (JWT, WhatsApp)
│   │   └── server.js       # Servidor principal
│   ├── prisma/
│   │   └── schema.prisma   # Esquema de base de datos
│   └── package.json
│
├── frontend/               # Aplicación React
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/          # Páginas/vistas
│   │   ├── services/       # Servicios API
│   │   ├── context/        # Context API (Auth)
│   │   └── App.jsx         # Componente raíz
│   └── package.json
│
└── README.md
```

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ instalado
- PostgreSQL 14+ instalado y corriendo
- npm o yarn

### 1. Configurar Base de Datos

1. Crear una base de datos PostgreSQL:
```bash
createdb psicologa_db
```

2. Configurar variables de entorno en `backend/.env`:
```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/psicologa_db?schema=public"
JWT_SECRET="tu_secret_jwt_muy_seguro_aqui"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
```

### 2. Instalar Dependencias del Backend

```bash
cd backend
npm install
```

### 3. Configurar Prisma y Base de Datos

```bash
# Generar cliente de Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# (Opcional) Abrir Prisma Studio para ver datos
npm run prisma:studio
```

### 4. Iniciar Backend

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3001`

### 5. Instalar Dependencias del Frontend

En otra terminal:

```bash
cd frontend
npm install
```

### 6. Iniciar Frontend

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📚 Características Principales

### 👥 Gestión de Pacientes
- CRUD completo de pacientes
- Gestión de coberturas (Obra Social, Prepaga, Particular)
- Honorarios personalizados por paciente
- Historial de turnos y transacciones
- Datos de contacto y emergencia

### 📅 Agenda y Turnos
- Vista diaria y semanal de turnos
- Estados: Reservado, Confirmado, Completado, Cancelado, Ausente
- Gestión de duración de sesiones
- Recordatorios automáticos (simulados)

### 💰 Facturación y Cuentas Corrientes
- Registro de facturas y pagos
- Cálculo automático de honorarios según cobertura
- Saldo pendiente por paciente
- Historial de transacciones
- Tipos: Factura, Pago, Ajuste

### 📝 Notas Clínicas
- Registro privado de notas (solo psicóloga)
- Asociación con turnos
- Búsqueda por paciente

### ⚙️ Configuración
- Honorarios globales
- Honorarios por cobertura
- Gestión de coberturas (crear, editar, eliminar)

### 📱 WhatsApp Business (Simulado)
- Servicio preparado para integración real
- Templates de mensajes para:
  - Recordatorio 24h antes
  - Recordatorio 1h antes
  - Recordatorio 50min antes con link a Google Maps
- Función para procesar recordatorios automáticos

## 🔐 Autenticación y Roles

### Roles

- **PSYCHOLOGIST**: Acceso completo a todas las funcionalidades
- **SECRETARY**: Acceso parcial, sin acceso a notas clínicas

### Primer Usuario

Para crear el primer usuario, usar el endpoint de registro:

```bash
POST /api/auth/register
{
  "email": "psicologa@example.com",
  "password": "password123",
  "name": "Dra. Psicóloga",
  "role": "PSYCHOLOGIST"
}
```

**Nota**: En producción, se debe restringir el registro solo para administradores.

## 📡 Endpoints API Principales

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario (solo primer usuario)
- `GET /api/auth/profile` - Obtener perfil del usuario

### Pacientes
- `GET /api/patients` - Listar pacientes
- `GET /api/patients/:id` - Obtener paciente
- `POST /api/patients` - Crear paciente
- `PUT /api/patients/:id` - Actualizar paciente
- `DELETE /api/patients/:id` - Eliminar paciente

### Turnos
- `GET /api/appointments` - Listar turnos
- `GET /api/appointments/range` - Turnos por rango de fechas
- `POST /api/appointments` - Crear turno
- `PATCH /api/appointments/:id/status` - Actualizar estado

### Facturación
- `GET /api/billing` - Listar transacciones
- `POST /api/billing` - Crear transacción (factura/pago)
- `GET /api/billing/patient/:patientId/balance` - Saldo del paciente

### Coberturas
- `GET /api/coverages` - Listar coberturas
- `POST /api/coverages` - Crear cobertura

### Honorarios
- `GET /api/fees` - Listar honorarios
- `GET /api/fees/global` - Honorario global
- `POST /api/fees` - Crear honorario

### Notas Clínicas (solo PSYCHOLOGIST)
- `GET /api/clinical-notes` - Listar notas
- `POST /api/clinical-notes` - Crear nota

### WhatsApp (Simulado)
- `POST /api/whatsapp/send` - Enviar mensaje
- `POST /api/whatsapp/reminder/:appointmentId` - Enviar recordatorio
- `POST /api/whatsapp/reminders/process` - Procesar recordatorios automáticos

### Dashboard
- `GET /api/dashboard/stats` - Estadísticas generales
- `GET /api/dashboard/upcoming-appointments` - Próximos turnos
- `GET /api/dashboard/pending-transactions` - Transacciones pendientes

## 📊 Modelo de Datos

### Entidades Principales

- **User**: Usuarios del sistema (Psicóloga, Secretaria)
- **Patient**: Pacientes con datos personales y cobertura
- **Coverage**: Coberturas médicas (Obra Social, Prepaga, Particular)
- **Fee**: Honorarios (globales o por cobertura)
- **CustomFee**: Honorarios personalizados por paciente
- **Appointment**: Turnos con estados y recordatorios
- **ClinicalNote**: Notas clínicas privadas
- **Transaction**: Transacciones financieras (Facturas, Pagos, Ajustes)

## 🎨 Características del Frontend

- Diseño responsive (mobile-friendly)
- Navegación intuitiva con sidebar
- Dashboard con estadísticas en tiempo real
- Formularios validados
- Tablas con búsqueda y filtros
- Vista de agenda semanal y diaria

## 🔄 Integración WhatsApp Business (Futuro)

El servicio está preparado para integrarse con la API oficial de WhatsApp Business. Actualmente está simulado. Para integrar:

1. Obtener credenciales de WhatsApp Business API
2. Actualizar `backend/src/utils/whatsapp.utils.js` con la llamada real
3. Configurar webhooks si es necesario
4. Actualizar variables de entorno

## 📝 Scripts Disponibles

### Backend
```bash
npm run dev          # Iniciar en modo desarrollo
npm start            # Iniciar en producción
npm run prisma:generate    # Generar cliente Prisma
npm run prisma:migrate     # Ejecutar migraciones
npm run prisma:studio      # Abrir Prisma Studio
```

### Frontend
```bash
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Compilar para producción
npm run preview      # Previsualizar build de producción
```

## 🔒 Seguridad

- Autenticación JWT con tokens expirables
- Contraseñas hasheadas con bcrypt
- Middleware de autorización por roles
- Validación de datos en endpoints
- Sanitización de inputs

## 🚧 Próximas Mejoras

- [ ] Formularios completos de creación/edición en frontend
- [ ] Exportación de reportes (PDF, Excel)
- [ ] Calendario visual interactivo
- [ ] Notificaciones en tiempo real
- [ ] Integración real con WhatsApp Business API
- [ ] Modo offline con sincronización
- [ ] Tests unitarios y de integración

## 📄 Licencia

## 🔐 Seguridad

### Permisos Granulares
- Sistema de permisos específicos por acción (ver, crear, actualizar, eliminar)
- Control de acceso diferenciado por rol
- Middleware de autenticación y autorización robusto

### Refresh Tokens
- Access tokens de corta duración (15 minutos por defecto)
- Refresh tokens de larga duración (7 días)
- Tokens almacenados en base de datos para invalidación
- Endpoints `/api/auth/refresh` y `/api/auth/logout`

## 📱 WhatsApp Business Integration

### Proveedores Soportados
- **Twilio**: Configuración completa con WhatsApp Sandbox/API
- **Meta WhatsApp Business API**: Integración con Graph API

### Recordatorios Automáticos
- Recordatorio 24 horas antes del turno
- Recordatorio 1 hora antes del turno
- Recordatorio 50 minutos antes con link a Google Maps
- Sistema de ventanas de tiempo para evitar duplicados
- Job programado para procesar recordatorios automáticamente

## 📊 Exportación de Datos

### Formatos Soportados
- **Excel (.xlsx)**: Cuentas corrientes y sesiones
- **PDF**: Cuentas corrientes con formato profesional

### Filtros Disponibles
- Por paciente
- Por rango de fechas
- Por tipo de cobertura
- Por estado de pago
- Totales y subtotales automáticos

### Endpoints
- `GET /api/export/account-statement/excel`
- `GET /api/export/account-statement/pdf`
- `GET /api/export/sessions/excel`

## 🧪 Testing

### Backend
```bash
cd backend
npm test              # Ejecutar todos los tests
npm run test:watch    # Modo watch
npm run test:coverage # Con cobertura
```

### Tests Implementados
- ✅ Autenticación (login, registro, refresh tokens)
- ✅ CRUD de pacientes
- ✅ Gestión de turnos y estados

## 🚀 Deployment

### Quick Start
1. **Backend (Railway)**: Ver [DEPLOYMENT.md](./DEPLOYMENT.md)
2. **Frontend (Vercel)**: Ver [DEPLOYMENT.md](./DEPLOYMENT.md)
3. **Base de Datos**: PostgreSQL en Railway

Consulta [DEPLOYMENT.md](./DEPLOYMENT.md) para instrucciones detalladas.

---

Este proyecto es privado y está destinado para uso interno del consultorio.

**Nota**: Este sistema está diseñado específicamente para la gestión de un consultorio psicológico. Todas las funcionalidades están pensadas para optimizar el trabajo diario de la psicóloga y su secretaria.

