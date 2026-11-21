import argon2 from 'argon2';
import dotenv from 'dotenv';
import prisma from '../src/config/prisma.js';

dotenv.config();

async function seedAdmins() {
  const superPassword = process.env.ADMIN_SUPER_PASSWORD || 'SuperAdminSecurePass2026!';
  const platformPassword = process.env.ADMIN_REVIEWER_PASSWORD || 'AdminRootPassword2026!';
  const userPasswordHash = await argon2.hash(superPassword);
  const platformAdminHash = await argon2.hash(platformPassword);

  // 1. Super Admin with double-e email: aniteeshkarak@gmail.com
  const admin1 = await prisma.admin.upsert({
    where: { email: 'aniteeshkarak@gmail.com' },
    update: {
      passwordHash: userPasswordHash,
      fullName: 'Anitesh Karak',
      roleName: 'SUPER_ADMIN',
      isActive: true,
    },
    create: {
      email: 'aniteeshkarak@gmail.com',
      passwordHash: userPasswordHash,
      fullName: 'Anitesh Karak',
      roleName: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  // 2. Super Admin with single-e email: aniteshkarak@gmail.com
  const admin2 = await prisma.admin.upsert({
    where: { email: 'aniteshkarak@gmail.com' },
    update: {
      passwordHash: userPasswordHash,
      fullName: 'Anitesh Karak',
      roleName: 'SUPER_ADMIN',
      isActive: true,
    },
    create: {
      email: 'aniteshkarak@gmail.com',
      passwordHash: userPasswordHash,
      fullName: 'Anitesh Karak',
      roleName: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  // 3. Platform Admin Reviewer: admin@college.internal
  const admin3 = await prisma.admin.upsert({
    where: { email: 'admin@college.internal' },
    update: {
      passwordHash: platformAdminHash,
      fullName: 'Collégé Lead Reviewer',
      roleName: 'ADMIN',
      isActive: true,
    },
    create: {
      email: 'admin@college.internal',
      passwordHash: platformAdminHash,
      fullName: 'Collégé Lead Reviewer',
      roleName: 'ADMIN',
      isActive: true,
    },
  });

  console.log('Admins seeded successfully in PostgreSQL:');
  console.log('1.', admin1.email, admin1.fullName, admin1.roleName);
  console.log('2.', admin2.email, admin2.fullName, admin2.roleName);
  console.log('3.', admin3.email, admin3.fullName, admin3.roleName);
}

seedAdmins().catch(console.error).finally(() => prisma.$disconnect());
