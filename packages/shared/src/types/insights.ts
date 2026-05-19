/**
 * ═══════════════════════════════════════════
 * B2B Data Broker — Shared Insight Types
 * ═══════════════════════════════════════════
 * Tipos para o sistema de insights e alertas.
 */

/** Categoria do insight gerado pelo Agente Analista */
export type InsightCategory =
  | 'RISK_ALERT'
  | 'OPPORTUNITY'
  | 'TREND'
  | 'COMPETITIVE_MOVE'
  | 'REGULATORY_CHANGE';

/** Nível de severidade do insight */
export type InsightSeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/** Tier de assinatura do usuário */
export type SubscriptionTierType = 'FREE' | 'PRO' | 'ENTERPRISE';

/** Insight completo como exibido no frontend */
export interface InsightDTO {
  id: string;
  type: InsightCategory;
  severity: InsightSeverityLevel;
  title: string;
  summary: string;
  analysis: string;
  recommendation?: string;
  confidence: number; // 0.0 - 1.0
  isRead: boolean;
  isArchived: boolean;
  createdAt: string;
  expiresAt?: string;
  tags: string[];
  sources: InsightSourceDTO[];
}

/** Fonte de dados que alimentou um insight */
export interface InsightSourceDTO {
  id: string;
  sourceType: string;
  sourceUrl: string;
  title?: string;
  collectedAt: string;
}

/** Filtros para busca de insights */
export interface InsightFilters {
  types?: InsightCategory[];
  severities?: InsightSeverityLevel[];
  tags?: string[];
  isRead?: boolean;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/** Resposta paginada de insights */
export interface PaginatedInsights {
  items: InsightDTO[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/** Estatísticas do dashboard */
export interface DashboardStats {
  totalInsights: number;
  unreadInsights: number;
  criticalAlerts: number;
  opportunitiesDetected: number;
  trendsTracked: number;
  dataSourcesActive: number;
  lastAgentRunAt?: string;
}

/** Score preditivo de oportunidade */
export interface OpportunityScore {
  insightId: string;
  score: number; // 0-100
  signals: ScoreSignal[];
  calculatedAt: string;
}

export interface ScoreSignal {
  name: string;
  weight: number;
  value: number;
  description: string;
}
