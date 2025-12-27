import express from 'express';
import { login, register, getProfile, refreshToken, logout } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Registro (solo para crear el primer usuario)
router.post('/register', register);

// Login
router.post('/login', login);

// Refrescar access token
router.post('/refresh', refreshToken);

// Cerrar sesión
router.post('/logout', logout);

// Obtener perfil del usuario autenticado
router.get('/profile', authenticate, getProfile);

export default router;

