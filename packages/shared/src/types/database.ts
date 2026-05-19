/**
 * ═══════════════════════════════════════════
 * B2B Data Broker — Shared Database Types
 * ═══════════════════════════════════════════
 * Tipos para comunicação com o banco de dados.
 */

/** Tipos de fonte de dados brutos */
export type DataSourceCategory = 'RSS' | 'API' | 'WEB_SCRAPE' | 'SOCIAL_MEDIA' | 'GOVERNMENT';

/** Mensagem do chatbot RAG */
export interface ChatMessageDTO {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: ChatMessageMetadata;
  createdAt: string;
}

/** Metadados de uma mensagem do chatbot */
export interface ChatMessageMetadata {
  sourcesUsed?: string[];
  tokensUsed?: number;
  modelUsed?: string;
  confidenceScore?: number;
  retrievalTimeMs?: number;
}

/** Sessão de chat */
export interface ChatSessionDTO {
  id: string;
  title?: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
}

/** Request para o endpoint de chat RAG */
export interface ChatRequest {
  sessionId?: string;
  message: string;
  context?: {
    insightIds?: string[];
    competitorIds?: string[];
  };
}

/** Concorrente monitorado */
export interface CompetitorDTO {
  id: string;
  name: string;
  domain?: string;
  cnpj?: string;
  sector?: string;
  trackingActive: boolean;
  lastSnapshotAt?: string;
  changeCount: number;
}

/** Relatório executivo gerado */
export interface ReportDTO {
  id: string;
  title: string;
  period: string;
  type: 'weekly' | 'monthly' | 'custom';
  pdfUrl?: string;
  generatedAt: string;
  insightCount: number;
  summary?: string;
}
