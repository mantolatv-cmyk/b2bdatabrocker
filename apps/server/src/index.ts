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

  // Health check and pipeline endpoints (simple HTTP)
  const { createServer } = await import('http');
  const server = createServer(async (req, res) => {
    // Basic CORS support
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'GET' && req.url === '/health') {
      const health = await orchestrator.healthCheckAll();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', agents: health }));
    } else if (req.method === 'POST' && req.url === '/pipeline/run') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', async () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          const insumoId = parsed.insumoId;
          const insumoName = parsed.insumoName;
          const params = insumoId && insumoId !== 'ALL' ? { insumoId, insumoName } : undefined;

          log.info({ insumoId }, 'Manual pipeline execution requested via API');
          const results = await orchestrator.runPipeline('manual', params);

          // Find the newest InsightCard created
          const latestCard = await prisma.insightCard.findFirst({
            orderBy: { createdAt: 'desc' },
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            results: Object.fromEntries([...results.entries()].map(([k, v]) => [k, v.success])),
            card: latestCard
          }));
        } catch (err) {
          log.error({ err }, 'Error running manual pipeline');
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: (err as Error).message }));
        }
      });
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
