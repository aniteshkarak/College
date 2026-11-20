import argon2 from 'argon2';
import dotenv from 'dotenv';
import prisma from '../src/config/prisma.js';

dotenv.config();

async function seedAdmins() {
  const hash1 = await argon2.hash('SuperAdminSecurePass2026!');
  const hash2 = await argon2.hash('AdminRootPassword2026!');

  // Upsert Super Admin Anitesh
  const admin1 = await prisma.admin.upsert({
    where: { email: 'aniteshkarak@gmail.com' },
    update: {
      passwordHash: hash1,
      fullName: 'Anitesh Karak',
      roleName: 'SUPER_ADMIN',
      isActive: true,
    },
    create: {
      email: 'aniteshkarak@gmail.com',
      passwordHash: hash1,
      fullName: 'Anitesh Karak',
      roleName: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  // Upsert Standard Admin
  const admin2 = await prisma.admin.upsert({
    where: { email: 'admin@college.internal' },
    update: {
      passwordHash: hash2,
      fullName: 'Collégé Lead Reviewer',
      roleName: 'ADMIN',
      isActive: true,
    },
    create: {
      email: 'admin@college.internal',
      passwordHash: hash2,
      fullName: 'Collégé Lead Reviewer',
      roleName: 'ADMIN',
      isActive: true,
    },
  });

  console.log('Admins seeded successfully in PostgreSQL:');
  console.log('1.', admin1.email, admin1.fullName, admin1.roleName);
  console.log('2.', admin2.email, admin2.fullName, admin2.roleName);
}

seedAdmins().catch(console.error).finally(() => prisma.$disconnect());
