/**
 * B2B Data Broker — Database Seed
 * Populates development database with sample data.
 */

import { PrismaClient, SubscriptionTier, DataSourceType, InsightType, InsightSeverity } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@atlas.app' },
    update: {},
    create: {
      email: 'demo@atlas.app',
      name: 'Demo Executive',
      passwordHash: '$2a$12$placeholder_hash',
      tier: SubscriptionTier.PRO,
    },
  });
  console.log(`  ✅ User: ${user.email}`);

  // Create sample raw data
  const rawData = await prisma.rawData.createMany({
    data: [
      {
        sourceType: DataSourceType.RSS,
        sourceUrl: 'https://example.com/article-1',
        title: 'Banco Central anuncia novas regras para fintechs',
        content: 'O Banco Central do Brasil publicou hoje consulta pública sobre novas regras...',
      },
      {
        sourceType: DataSourceType.WEB_SCRAPE,
        sourceUrl: 'https://example.com/article-2',
        title: 'Startup brasileira capta R$50M em rodada Series B',
        content: 'A LogiTech Solutions anunciou hoje o fechamento de rodada Series B...',
      },
    ],
  });
  console.log(`  ✅ Raw data: ${rawData.count} items`);

  // Create sample insights
  const insights = [
    {
      userId: user.id,
      type: InsightType.RISK_ALERT,
      severity: InsightSeverity.CRITICAL,
      title: 'Novo marco regulatório pode impactar fintechs',
      summary: 'O BC publicou consulta pública sobre novas regras para instituições de pagamento.',
      analysis: 'Análise detalhada do impacto regulatório no setor.',
      recommendation: 'Agendar reunião com departamento jurídico.',
      confidence: 0.92,
    },
    {
      userId: user.id,
      type: InsightType.OPPORTUNITY,
      severity: InsightSeverity.HIGH,
      title: 'Gap estratégico no mercado nordestino',
      summary: 'Concorrente XYZ anuncia saída do mercado nordestino.',
      analysis: 'Oportunidade de expansão para 5 estados.',
      recommendation: 'Priorizar Bahia e Pernambuco para expansão.',
      confidence: 0.87,
    },
  ];

  for (const insight of insights) {
    await prisma.insight.create({ data: insight });
  }
  console.log(`  ✅ Insights: ${insights.length} items`);

  // Create alert preference
  await prisma.alertPreference.create({
    data: {
      userId: user.id,
      keywords: ['fintech', 'regulação', 'concorrência'],
      sectors: ['tecnologia', 'financeiro'],
      minSeverity: InsightSeverity.MEDIUM,
      emailEnabled: true,
    },
  });
  console.log('  ✅ Alert preferences created');

  console.log('\n✨ Seed completed!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
