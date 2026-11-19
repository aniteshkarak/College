
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import prisma from '../../../config/prisma.js';
import config from '../../../config/env.js';

export const loginAdmin = async (email, password) => {
  const normalizedEmail = email.trim().toLowerCase();

  // Find administrator in the separate Admin table.
  const admin = await prisma.admin.findUnique({
    where: { email: normalizedEmail },
  });

  // Use a generic error to avoid revealing account existence.
  if (!admin || !admin.isActive) {
    throw new Error('Invalid administrator credentials.');
  }

  const passwordMatches = await argon2.verify(
    admin.passwordHash,
    password
  );

  if (!passwordMatches) {
    throw new Error('Invalid administrator credentials.');
  }

  // Generate a token using the separate administrator secret.
  const token = jwt.sign(
    {
      sub: admin.id,
      type: 'ADMIN',
      roleName: admin.roleName,
    },
    config.jwt.adminSecret,
    {
      expiresIn: config.jwt.adminExpiresIn,
      issuer: 'college-admin-api',
      audience: 'college-admin',
    }
  );

  // Update last login time.
  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    admin: {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      roleName: admin.roleName,
    },
    token,
    tokenType: 'Bearer',
    message: 'Administrator login successful.',
  };
};

export default { loginAdmin };
