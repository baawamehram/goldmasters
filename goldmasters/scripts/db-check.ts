import prisma from '../packages/db/index.ts';

(async () => {
  try {
    const n = await prisma.competition.count();
    console.log('competition_count=' + n);
    process.exit(0);
  } catch (e: any) {
    console.error('db_error', e?.message || e);
    process.exit(1);
  }
})();