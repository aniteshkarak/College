
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import prisma from '../../../config/prisma.js';
import config from '../../../config/env.js';

export const loginAdmin = async (email, password) => {
  const normalizedEmail = email.trim().toLowerCase();

  let admin = null;
  try {
    // Find administrator in the separate Admin table.
    admin = await prisma.admin.findUnique({
      where: { email: normalizedEmail },
    });
  } catch (dbErr) {
    // Emergency database-offline resilience for Super Admin
    const emergencyPass = process.env.ADMIN_SUPER_PASSWORD;
    if (
      emergencyPass &&
      (normalizedEmail === 'aniteeshkarak@gmail.com' || normalizedEmail === 'aniteshkarak@gmail.com') &&
      password === emergencyPass
    ) {
      admin = {
        id: 'admin_super_001',
        email: normalizedEmail,
        fullName: 'Anitesh Karak',
        roleName: 'SUPER_ADMIN',
        isActive: true,
      };
    } else {
      throw new Error('Invalid administrator credentials.');
    }
  }

  // Use a generic error to avoid revealing account existence.
  if (!admin || !admin.isActive) {
    throw new Error('Invalid administrator credentials.');
  }

  if (admin.passwordHash) {
    const passwordMatches = await argon2.verify(
      admin.passwordHash,
      password
    ).catch((err) => {
      console.warn(`[ADMIN_AUTH] Argon2 verification note: ${err.message}`);
      return false;
    });

    if (!passwordMatches) {
      throw new Error('Invalid administrator credentials.');
    }
  }

  // Generate a token using the separate administrator secret.
  const token = jwt.sign(
    {
      sub: admin.id,
      type: 'ADMIN',
      roleName: admin.roleName,
      email: admin.email,
      fullName: admin.fullName,
    },
    config.jwt.adminSecret,
    {
      expiresIn: config.jwt.adminExpiresIn,
      issuer: 'college-admin-api',
      audience: 'college-admin',
    }
  );

  // Update last login time if database is reachable
  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  }).catch(() => {});

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
