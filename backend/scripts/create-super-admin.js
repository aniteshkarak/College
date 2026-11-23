
import 'dotenv/config';
import argon2 from 'argon2';
import prisma from '../src/config/prisma.js';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });

try {
  console.log('\n=== Collage Story Super Admin Setup ===\n');

  const email = (await rl.question('Super Admin email: '))
    .trim()
    .toLowerCase();

  const fullName = (await rl.question('Super Admin full name: '))
    .trim();

  if (!email || !fullName) {
    throw new Error('Email and full name are required.');
  }

  const existing = await prisma.admin.findUnique({
    where: { email },
  });

  if (existing) {
    throw new Error('An administrator with this email already exists.');
  }

  const existingSuperAdmin = await prisma.admin.count({
    where: { roleName: 'SUPER_ADMIN' },
  });

  if (existingSuperAdmin > 0) {
    throw new Error(
      'A Super Admin already exists. Bootstrap creation is disabled.'
    );
  }

  if (!process.env.BOOTSTRAP_ADMIN_PASSWORD) {
    throw new Error('Bootstrap password was not provided.');
  }

  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (password.length < 14) {
    throw new Error('Password must contain at least 14 characters.');
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  const admin = await prisma.admin.create({
    data: {
      email,
      fullName,
      passwordHash,
      roleName: 'SUPER_ADMIN',
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      roleName: true,
      isActive: true,
    },
  });

  console.log('\nSuper Admin created successfully:');
  console.log(admin);
} catch (error) {
  console.error('\nSetup failed:', error.message);
  process.exitCode = 1;
} finally {
  rl.close();
  await prisma.$disconnect();
}
