/**
 * Tokens de sesión firmados con expiración.
 * Formato: sess.{userId}.{exp}.{signature}
 * - No se confía en el cliente para el rol; el backend siempre carga user desde BD.
 */

const crypto = require('crypto');

const PREFIX = 'sess.';
const DEFAULT_EXPIRY_DAYS = 7;
const SEP = '.';

function getSecret() {
  const secret = process.env.TOKEN_SECRET;
  if (process.env.NODE_ENV === 'production' && (!secret || secret.length < 16)) {
    throw new Error('TOKEN_SECRET debe estar definido y tener al menos 16 caracteres en producción');
  }
  return secret || 'dev-secret-cambiar-en-produccion';
}

/**
 * Firma un payload para evitar falsificación.
 */
function signPayload(payload) {
  return crypto
    .createHmac('sha256', getSecret())
    .update(payload)
    .digest('hex')
    .slice(0, 32);
}

/**
 * Genera un token de sesión firmado con expiración.
 * @param {number} userId - ID del usuario
 * @param {number} [expiryDays] - Días hasta expiración (default 7)
 * @returns {string} Token en formato sess.userId.exp.signature
 */
function createToken(userId, expiryDays = DEFAULT_EXPIRY_DAYS) {
  const exp = Math.floor(Date.now() / 1000) + expiryDays * 24 * 60 * 60;
  const payload = `${userId}${SEP}${exp}`;
  const sig = signPayload(payload);
  return `${PREFIX}${userId}${SEP}${exp}${SEP}${sig}`;
}

/**
 * Verifica y parsea un token de sesión. Devuelve { userId, exp } o null si es inválido/expirado.
 * @param {string} token - Token recibido en Authorization
 * @returns {{ userId: number, exp: number } | null}
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const trimmed = token.trim();
  if (!trimmed.startsWith(PREFIX)) return null;

  const parts = trimmed.slice(PREFIX.length).split(SEP);
  if (parts.length !== 3) return null;

  const [userIdStr, expStr, sig] = parts;
  const userId = parseInt(userIdStr, 10);
  const exp = parseInt(expStr, 10);

  if (!Number.isFinite(userId) || userId <= 0 || !Number.isFinite(exp)) return null;
  const payload = `${userId}${SEP}${exp}`;
  const expectedSig = signPayload(payload);
  if (sig !== expectedSig) return null;
  if (exp < Math.floor(Date.now() / 1000)) return null; // Expirado

  return { userId, exp };
}

/**
 * Parsea Authorization header y devuelve el token (sin "Bearer ").
 */
function tokenFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7).trim();
}

/**
 * Token legacy (sin firma ni expiración): token-{userId}-{timestamp}
 * Solo para compatibilidad con sesiones ya emitidas.
 */
function parseLegacyToken(token) {
  if (!token || !token.startsWith('token-')) return null;
  const parts = token.split('-');
  const userId = parseInt(parts[1], 10);
  return !isNaN(userId) && userId > 0 ? userId : null;
}

/**
 * Obtiene userId desde el header Authorization.
 * Prueba primero el token firmado (sess.); si no, el legacy (token-).
 */
function resolveUserIdFromHeader(authHeader) {
  const raw = tokenFromHeader(authHeader);
  if (!raw) return null;
  const verified = verifyToken(raw);
  if (verified) return verified.userId;
  return parseLegacyToken(raw);
}

module.exports = {
  createToken,
  verifyToken,
  tokenFromHeader,
  parseLegacyToken,
  resolveUserIdFromHeader,
  PREFIX,
};
