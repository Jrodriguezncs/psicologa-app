# 🚀 Guía de Deployment

Esta guía te ayudará a desplegar la aplicación fullstack en **Railway** (backend) y **Vercel** (frontend).

## 📋 Prerrequisitos

- Cuenta en [Railway](https://railway.app)
- Cuenta en [Vercel](https://vercel.com)
- Cuenta en [GitHub](https://github.com)
- Repositorio Git configurado

## 🔧 Paso 1: Preparar el Repositorio

1. **Sube tu código a GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/jrodriguezncs/psicologa-app.git
git push -u origin main
```

## 🗄️ Paso 2: Desplegar Base de Datos PostgreSQL en Railway

1. Ve a [Railway Dashboard](https://railway.app/dashboard)
2. Clic en **"New Project"**
3. Selecciona **"Provision PostgreSQL"**
4. Una vez creada, ve a la pestaña **"Variables"**
5. Copia la variable `DATABASE_URL` (la necesitarás después)

## 🖥️ Paso 3: Desplegar Backend en Railway

1. En Railway Dashboard, clic en **"+ New"** → **"GitHub Repo"**
2. Selecciona tu repositorio
3. Railway detectará automáticamente el backend
4. Si no, ve a **Settings** → **Root Directory** y pon: `backend`
5. Ve a **Variables** y agrega:

```env
DATABASE_URL=<la URL de PostgreSQL que copiaste>
JWT_SECRET=<genera un secreto seguro, ej: openssl rand -hex 32>
JWT_REFRESH_SECRET=<otro secreto diferente>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

# WhatsApp (opcional)
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=<tu_account_sid>
TWILIO_AUTH_TOKEN=<tu_auth_token>
TWILIO_WHATSAPP_NUMBER=<tu_numero>

# O si usas Meta
# WHATSAPP_PROVIDER=meta
# META_ACCESS_TOKEN=<tu_token>
# META_PHONE_NUMBER_ID=<tu_phone_id>

GOOGLE_MAPS_URL=<url_de_tu_consultorio>
```

6. En **Settings** → **Build Command**: `npm install && npm run prisma:generate`
7. En **Settings** → **Start Command**: `npm run prisma:migrate deploy && npm start`
8. Railway generará una URL para tu backend (ej: `https://tu-backend.up.railway.app`)

### Configurar Prisma Migrations

1. En Railway, ve a tu servicio backend
2. Abre la **Console** (terminal)
3. Ejecuta:
```bash
npx prisma migrate deploy
```

## 🎨 Paso 4: Desplegar Frontend en Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Clic en **"Add New Project"**
3. Importa tu repositorio de GitHub
4. Configura:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. Agrega **Environment Variables**:
```env
VITE_API_URL=https://tu-backend.up.railway.app
```
   ⚠️ **Nota**: Reemplaza `https://tu-backend.up.railway.app` con la URL real que Railway te proporcione después de desplegar el backend.

6. Clic en **Deploy**
7. Vercel te dará una URL (ej: `https://tu-app.vercel.app`)

## 🔄 Paso 5: Configurar Proxy en Frontend (Opcional)

Si prefieres usar proxy en lugar de variable de entorno:

1. Actualiza `frontend/vite.config.js`:
```js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'https://tu-backend.up.railway.app',
        changeOrigin: true
      }
    }
  }
});
```

2. Actualiza `frontend/src/services/api.js`:
```js
const API_URL = import.meta.env.VITE_API_URL || '/api';
```

## 📧 Paso 6: Configurar WhatsApp (Opcional)

### Opción A: Twilio

1. Crea cuenta en [Twilio](https://www.twilio.com)
2. Obtén Account SID y Auth Token
3. Configura WhatsApp Sandbox o WhatsApp Business API
4. Agrega las variables en Railway

### Opción B: Meta WhatsApp Business API

1. Crea una Meta App en [Meta for Developers](https://developers.facebook.com)
2. Configura WhatsApp Business API
3. Obtén Access Token y Phone Number ID
4. Agrega las variables en Railway

## ⏰ Paso 7: Configurar Cron Job para Recordatorios

Railway no tiene cron jobs nativos. Opciones:

### Opción A: Usar Railway Cron Service
1. Crea un nuevo servicio en Railway
2. Configura como cron job que ejecute cada 5 minutos:
```bash
curl -X POST https://tu-backend.up.railway.app/api/whatsapp/reminders/process -H "Authorization: Bearer <tu_token>"
```

### Opción B: Usar servicio externo (Cron-job.org)
1. Registrate en [cron-job.org](https://cron-job.org)
2. Crea un job que llame al endpoint cada 5 minutos
3. Agrega header de autenticación

### Opción C: Implementar en el código (para producción)
Crea `backend/src/cron.js`:
```js
import cron from 'node-cron';
import { processReminders } from './jobs/reminders.job.js';

// Ejecutar cada 5 minutos
cron.schedule('*/5 * * * *', async () => {
  console.log('Running reminder job...');
  await processReminders();
});
```

Y en `backend/src/server.js`:
```js
if (process.env.NODE_ENV === 'production') {
  import('./cron.js');
}
```

## 🔒 Paso 8: Configurar CORS

Actualiza `backend/src/server.js`:
```js
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://tu-app.vercel.app'
  ],
  credentials: true
}));
```

## ✅ Paso 9: Verificar Deployment

1. **Backend Health Check:**
```bash
curl https://tu-backend.up.railway.app/health
```

2. **Frontend:**
   - Visita la URL de Vercel
   - Intenta hacer login
   - Verifica que las peticiones funcionen

## 🐛 Troubleshooting

### Error: "Cannot connect to database"
- Verifica que `DATABASE_URL` esté correctamente configurada
- Asegúrate de ejecutar `prisma migrate deploy`

### Error: "CORS policy"
- Verifica que las URLs estén en la configuración de CORS
- Verifica que `VITE_API_URL` esté configurada

### Error: "Prisma Client not generated"
- Añade `npm run prisma:generate` al build command
- Verifica que Prisma esté en dependencies

### Frontend no carga datos
- Verifica la consola del navegador
- Verifica que `VITE_API_URL` esté configurada
- Verifica que el backend esté accesible

## 📊 Monitoreo

### Railway
- Ve a **Metrics** para ver CPU, memoria, requests
- Revisa **Logs** para errores

### Vercel
- Ve a **Analytics** para ver métricas
- Revisa **Logs** para errores

## 🔄 Actualizaciones

Para actualizar:

1. Haz cambios en tu código local
2. Commit y push a GitHub:
```bash
git add .
git commit -m "Update"
git push
```

3. Railway y Vercel detectarán los cambios y redeployarán automáticamente

## 📝 Notas Adicionales

- **Base de datos**: Railway PostgreSQL tiene un plan gratuito con límites
- **Backend**: Railway da $5 gratis al mes
- **Frontend**: Vercel tiene un generoso plan gratuito
- **Dominios personalizados**: Puedes agregar tu dominio en ambos servicios

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs en Railway/Vercel
2. Verifica las variables de entorno
3. Verifica que todos los servicios estén corriendo
4. Consulta la documentación de [Railway](https://docs.railway.app) y [Vercel](https://vercel.com/docs)

