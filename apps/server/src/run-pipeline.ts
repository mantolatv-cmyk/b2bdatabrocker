import { prisma } from './config/database';
import { AgentOrchestrator } from './agents/orchestrator';
import { CollectorAgent } from './agents/collector.agent';
import { ClassifierAgent } from './agents/classifier.agent';
import { AnalystAgent } from './agents/analyst.agent';
import { EmbeddingService } from './services/embedding.service';
import { LLMService } from './services/llm.service';
import { RAGService } from './services/rag.service';
import { ScraperService } from './services/scraper.service';

async function run() {
  console.log("🤖 Iniciando o Pipeline de Agentes para popular o Banco de Dados (Neon)...");

  const embeddingService = new EmbeddingService();
  const llmService = new LLMService();
  const scraperService = new ScraperService();
  const ragService = new RAGService(prisma, embeddingService, llmService);

  const collector = new CollectorAgent(prisma, scraperService);
  const classifier = new ClassifierAgent(prisma, embeddingService, llmService);
  const analyst = new AnalystAgent(prisma, llmService, ragService);

  const orchestrator = new AgentOrchestrator(prisma);
  orchestrator
    .registerAgent(collector)
    .registerAgent(classifier)
    .registerAgent(analyst)
    .definePipeline([
      { name: 'collector' },
      { name: 'classifier', dependsOn: ['collector'] },
      { name: 'analyst', dependsOn: ['classifier'] },
    ]);

  await orchestrator.runPipeline('manual');

  console.log("✅ Pipeline finalizado! Banco de dados populado com as últimas notícias.");
  process.exit(0);
}

run().catch((e) => {
  console.error("Erro no pipeline:", e);
  process.exit(1);
});
