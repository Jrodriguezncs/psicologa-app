import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.utils.js';
// UUID no necesario, Prisma genera IDs automáticamente

const prisma = new PrismaClient();

// Helper para limpiar tokens expirados
const cleanupExpiredTokens = async () => {
  await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  });
};

/**
 * Registro de usuario
 * Nota: En producción, esto debería estar restringido solo para el primer admin
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;

    // Validaciones básicas
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, contraseña y nombre son requeridos' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'SECRETARY'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    // Generar tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Guardar refresh token en BD
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt
      }
    });

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user,
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login de usuario
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Limpiar tokens expirados del usuario
    await cleanupExpiredTokens();

    // Generar tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Guardar refresh token en BD
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt
      }
    });

    res.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener perfil del usuario autenticado
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

/**
 * Refrescar access token usando refresh token
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Refresh token requerido' });
    }

    // Verificar token en BD
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!storedToken) {
      return res.status(401).json({ message: 'Refresh token inválido' });
    }

    // Verificar si está expirado
    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      return res.status(401).json({ message: 'Refresh token expirado' });
    }

    // Verificar firma JWT
    try {
      verifyRefreshToken(token);
    } catch (error) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      return res.status(401).json({ message: 'Refresh token inválido' });
    }

    // Generar nuevo access token
    const accessToken = generateAccessToken(storedToken.user);

    res.json({
      accessToken,
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        name: storedToken.user.name,
        role: storedToken.user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cerrar sesión (invalidar refresh token)
 */
export const logout = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (token) {
      await prisma.refreshToken.deleteMany({
        where: { token }
      });
    }

    res.json({ message: 'Sesión cerrada exitosamente' });
  } catch (error) {
    next(error);
  }
};

