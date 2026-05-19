/**
 * ═══════════════════════════════════════════
 * B2B Data Broker — Shared Agent Types
 * ═══════════════════════════════════════════
 * Tipos e interfaces para o sistema de agentes autônomos.
 */

/** Status possíveis de um agente durante execução */
export type AgentStatusType = 'idle' | 'running' | 'success' | 'failed';

/** Nomes dos agentes registrados no sistema */
export type AgentName =
  | 'collector'
  | 'classifier'
  | 'analyst'
  | 'competitor-monitor'
  | 'report-generator'
  | 'proactive-assistant';

/** Resultado padronizado de execução de um agente */
export interface AgentResult<T = unknown> {
  success: boolean;
  agentName: AgentName;
  data?: T;
  itemsProcessed: number;
  errors: AgentError[];
  durationMs: number;
  metadata?: Record<string, unknown>;
}

/** Erro estruturado de agente */
export interface AgentError {
  code: string;
  message: string;
  retryable: boolean;
  context?: Record<string, unknown>;
}

/** Configuração de um job de agente no BullMQ */
export interface AgentJobPayload {
  agentName: AgentName;
  triggeredBy: 'cron' | 'manual' | 'pipeline';
  priority: 'low' | 'normal' | 'high' | 'critical';
  params?: Record<string, unknown>;
  parentRunId?: string;
}

/** Evento emitido entre agentes no pipeline */
export interface AgentPipelineEvent {
  fromAgent: AgentName;
  toAgent: AgentName;
  eventType: 'data_ready' | 'processing_complete' | 'error';
  payload: Record<string, unknown>;
  timestamp: Date;
}

/** Interface que todo agente deve implementar */
export interface IAgent {
  readonly name: AgentName;
  execute(payload: AgentJobPayload): Promise<AgentResult>;
  healthCheck(): Promise<boolean>;
}

/** Status em tempo real de um agente para o frontend */
export interface AgentLiveStatus {
  name: AgentName;
  displayName: string;
  status: AgentStatusType;
  lastRunAt?: string;
  currentTask?: string;
  itemsProcessed: number;
  progress?: number; // 0-100
}
