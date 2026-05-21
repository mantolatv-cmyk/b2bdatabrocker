import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearFeed() {
  console.log('Limpando base de dados de previsões antigas...');
  
  // Limpa InsightCard (usado no frontend)
  const deletedCards = await prisma.insightCard.deleteMany({});
  console.log(`Limpou ${deletedCards.count} InsightCards antigos.`);
  
  // Limpa Insight (tabela backend principal)
  const deletedInsights = await prisma.insight.deleteMany({});
  console.log(`Limpou ${deletedInsights.count} Insights antigos.`);
  
  console.log('Feed limpo com sucesso!');
  await prisma.$disconnect();
}

clearFeed().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
