import { PrismaClient, CardStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.card.deleteMany();

  const cards = [
    { title: 'Design database schema', status: CardStatus.TODO, position: 1 },
    { title: 'Set up CI/CD pipeline', status: CardStatus.TODO, position: 2 },
    { title: 'Write API documentation', status: CardStatus.TODO, position: 3 },
    { title: 'Implement authentication', status: CardStatus.IN_PROGRESS, position: 1 },
    { title: 'Build drag-and-drop board', status: CardStatus.IN_PROGRESS, position: 2 },
    { title: 'Project kickoff meeting', status: CardStatus.DONE, position: 1 },
    { title: 'Provision PostgreSQL instance', status: CardStatus.DONE, position: 2 },
  ];

  for (const card of cards) {
    await prisma.card.create({ data: card });
  }

  console.log(`Seeded ${cards.length} cards.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
