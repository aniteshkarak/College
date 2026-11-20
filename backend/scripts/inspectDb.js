import prisma from '../src/config/prisma.js';

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        verificationStatus: true,
        accountStatus: true,
      },
    });
    const admins = await prisma.admin.findMany({
      select: { id: true, email: true, fullName: true, role: true },
    });
    const pendingApps = await prisma.pendingRegistration.findMany({
      select: { applicationId: true, email: true, fullName: true, status: true },
    });
    const collegesCount = await prisma.college.count();
    const matchesCount = await prisma.match.count();
    const messagesCount = await prisma.message.count();
    const announcementsCount = await prisma.campusAnnouncement.count();

    console.log(JSON.stringify({
      users,
      admins,
      pendingApps,
      collegesCount,
      matchesCount,
      messagesCount,
      announcementsCount,
    }, null, 2));
  } catch (err) {
    console.error('Error inspecting DB:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
