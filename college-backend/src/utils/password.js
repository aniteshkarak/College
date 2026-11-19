import argon2 from 'argon2';

/**
 * Hash password using Argon2id with OWASP recommended parameters
 */
export const hashPassword = async (password) => {
  if (!password || typeof password !== 'string') {
    throw new Error('Valid password string required for hashing');
  }

  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4
  });
};

/**
 * Verify password against stored Argon2 hash
 */
export const verifyPassword = async (hash, plainPassword) => {
  if (!hash || !plainPassword) return false;
  try {
    return await argon2.verify(hash, plainPassword);
  } catch (err) {
    return false;
  }
};
