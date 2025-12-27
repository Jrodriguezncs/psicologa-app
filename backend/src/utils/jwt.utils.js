import jwt from 'jsonwebtoken';

/**
 * Genera un access token JWT para el usuario
 * @param {Object} user - Objeto con id, email y role
 * @returns {string} Access token JWT
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      type: 'access'
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m' // Access tokens cortos
    }
  );
};

/**
 * Genera un refresh token JWT
 * @param {Object} user - Objeto con id, email y role
 * @returns {string} Refresh token JWT
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    }
  );
};

/**
 * Verifica y decodifica un access token JWT
 * @param {string} token - Token a verificar
 * @returns {Object} Payload del token
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Verifica y decodifica un refresh token JWT
 * @param {string} token - Refresh token a verificar
 * @returns {Object} Payload del token
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh'
  );
};

// Compatibilidad hacia atrás
export const generateToken = generateAccessToken;
export const verifyToken = verifyAccessToken;

