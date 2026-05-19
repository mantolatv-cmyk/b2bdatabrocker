/**
 * B2B Data Broker — Server Entry Point
 * Bootstraps agents, workers, and the orchestrator pipeline.
 */

import cron from 'node-cron';
import { prisma } from './config/database';
import { env } from './config/env';
import { createLogger } from './utils/logger';
import { AgentOrchestrator } from './agents/orchestrator';
import { CollectorAgent } from './agents/collector.agent';
import { ClassifierAgent } from './agents/classifier.agent';
import { AnalystAgent } from './agents/analyst.agent';
import { EmbeddingService } from './services/embedding.service';
import { LLMService } from './services/llm.service';
import { RAGService } from './services/rag.service';
import { ScraperService } from './services/scraper.service';

const log = createLogger('server');

async function bootstrap() {
  log.info('🚀 B2B Data Broker Server starting...');

  // Initialize services (Dependency Injection)
  const embeddingService = new EmbeddingService();
  const llmService = new LLMService();
  const scraperService = new ScraperService();
  const ragService = new RAGService(prisma, embeddingService, llmService);

  // Initialize agents
  const collector = new CollectorAgent(prisma, scraperService);
  const classifier = new ClassifierAgent(prisma, embeddingService, llmService);
  const analyst = new AnalystAgent(prisma, llmService, ragService);

  // Configure orchestrator
  const orchestrator = new AgentOrchestrator(prisma);
  orchestrator
    .registerAgent(collector)
    .registerAgent(classifier)
    .registerAgent(analyst)
    .definePipeline([
      { name: 'collector' },
      { name: 'classifier', dependsOn: ['collector'] },
      { name: 'analyst', dependsOn: ['classifier'] },
    ])
    .onEvent((event) => {
      log.info({ event: event.eventType, agent: event.agentName }, 'Agent event');
    });

  // Schedule CRON pipeline
  cron.schedule(env.SCRAPE_CRON_INTERVAL, async () => {
    log.info('⏰ CRON triggered pipeline');
    await orchestrator.runPipeline('cron');
  });

  // Health check endpoint (simple HTTP)
  const { createServer } = await import('http');
  const server = createServer(async (req, res) => {
    if (req.url === '/health') {
      const health = await orchestrator.healthCheckAll();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', agents: health }));
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  server.listen(env.PORT, () => {
    log.info({ port: env.PORT }, `✅ Server ready on port ${env.PORT}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    log.info('Shutting down...');
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((error) => {
  console.error('Fatal startup error:', error);
  process.exit(1);
});
