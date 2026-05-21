import { prisma } from './config/database';

async function main() {
  const runs = await prisma.agentRun.findMany({
    orderBy: { startedAt: 'desc' },
    take: 5
  });
  console.log('Latest AgentRuns:', JSON.stringify(runs, null, 2));

  const cards = await prisma.insightCard.findMany();
  console.log(`Total InsightCards in DB: ${cards.length}`);

  const insights = await prisma.insight.findMany({
    include: { tags: true }
  });
  console.log(`Total Insights in DB: ${insights.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
