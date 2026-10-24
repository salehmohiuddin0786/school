import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'school_jwt_secret_key_2026_dct_production_grade';
const COOKIE_NAME = 'sms_auth_token';

export async function verifyPassword(plainPassword, passwordHash) {
  if (!plainPassword || !passwordHash) return false;
  // PHP password_hash default prefix is $2y$, convert to $2a$ for universal bcryptjs compatibility
  const normalizedHash = passwordHash.startsWith('$2y$')
    ? passwordHash.replace(/^\$2y\$/, '$2a$')
    : passwordHash;

  try {
    return await bcrypt.compare(plainPassword, normalizedHash);
  } catch (err) {
    console.error('Password verify error:', err);
    return false;
  }
}

export async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

export function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch (err) {
    return null;
  }
}

export const AUTH_COOKIE = COOKIE_NAME;
