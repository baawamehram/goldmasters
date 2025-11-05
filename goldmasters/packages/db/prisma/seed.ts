import { PrismaClient } from './generated/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@wishmasters.com' },
    update: {},
    create: {
      email: 'admin@wishmasters.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create Sample Competition
  const competitionPassword = await bcrypt.hash('competition123', 10);
  
  const competition = await prisma.competition.create({
    data: {
      title: 'Cricket World Cup - Spot the Ball #1',
      description: 'Test your cricket knowledge! Spot where the ball should be in this iconic cricket moment.',
      imageUrl: 'https://example.com/cricket-scene.jpg',
      totalTickets: 2000,
      availableTickets: 2000,
      markersPerTicket: 3,
      pricePerTicket: 500,
      password: competitionPassword,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      createdById: admin.id,
    },
  });

  console.log('✅ Sample competition created:', competition.title);

  // Create Sample Tickets
  const tickets = [];
  for (let i = 1; i <= competition.totalTickets; i++) {
    tickets.push({
      competitionId: competition.id,
      ticketNumber: i,
      markersAllowed: competition.markersPerTicket,
      status: 'AVAILABLE' as const,
    });
  }

  await prisma.ticket.createMany({
    data: tickets,
  });

  console.log(`✅ Created ${tickets.length} tickets`);

  // Create Audit Log
  await prisma.auditLog.create({
    data: {
      entity: 'Competition',
      entityId: competition.id,
      action: 'CREATE',
      newValue: {
        title: competition.title,
        status: competition.status,
      },
      performedById: admin.id,
      competitionId: competition.id,
    },
  });

  console.log('✅ Audit log created');
  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Admin: ${admin.email} / admin123`);
  console.log(`- Competition: ${competition.title}`);
  console.log(`- Tickets: ${tickets.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
