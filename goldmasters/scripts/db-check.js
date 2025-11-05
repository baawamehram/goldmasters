const { PrismaClient } = require('../packages/db/prisma/generated/client');

(async () => {
  try {
    const prisma = new PrismaClient();
    const n = await prisma.competition.count();
    console.log('competition_count=' + n);
    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    console.error('db_error', e && e.message ? e.message : e);
    process.exit(1);
  }
})();