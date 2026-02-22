import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDb, getUserById } from './db.js';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'ipm-dev-secret-change-in-production';
const COOKIE_NAME = 'ipm_token';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

export function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function createToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload.sub;
  } catch {
    return null;
  }
}

export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

export function getTokenFromRequest(req) {
  return req.cookies?.[COOKIE_NAME] || null;
}

/** Middleware: sets req.user if valid token, else req.user = null */
export function authMiddleware(req, res, next) {
  const token = getTokenFromRequest(req);
  const userId = token ? verifyToken(token) : null;
  if (!userId) {
    req.user = null;
    return next();
  }
  const db = getDb();
  const user = getUserById(db, userId);
  req.user = user || null;
  next();
}
