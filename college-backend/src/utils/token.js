import jwt from 'jsonwebtoken';
import { env } from '../config/environment.js';

export const signAccessToken = (payload) => {
  return jwt.sign(payload, env.JWT.SECRET, {
    expiresIn: env.JWT.ACCESS_EXPIRES_IN
  });
};

export const signRefreshToken = (payload) => {
  return jwt.sign(payload, env.JWT.SECRET, {
    expiresIn: env.JWT.REFRESH_EXPIRES_IN
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.JWT.SECRET);
  } catch (err) {
    return null;
  }
};
