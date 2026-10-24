import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export function signAccessToken(payload) {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRES_IN,
  });
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, config.JWT_ACCESS_SECRET);
  } catch (err) {
    return null;
  }
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: `${config.JWT_REFRESH_EXPIRES_IN_DAYS}d`,
  });
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, config.JWT_REFRESH_SECRET);
  } catch (err) {
    return null;
  }
}
