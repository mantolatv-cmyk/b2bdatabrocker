/**
 * ═══════════════════════════════════════════
 * B2B Data Broker — Agent Types & Interfaces
 * ═══════════════════════════════════════════
 * Contracts that all agents must implement.
 */

import type { AgentName, AgentResult, AgentJobPayload } from '@b2b/shared';

/** Interface for all agents in the pipeline */
export interface IAgent {
  readonly name: AgentName;

  /**
   * Execute the agent's main task.
   * Must be idempotent and handle its own retries.
   */
  execute(payload: AgentJobPayload): Promise<AgentResult>;

  /**
   * Quick health check — returns true if the agent is operational.
   */
  healthCheck(): Promise<boolean>;
}

/** Configuration for agent execution */
export interface AgentConfig {
  /** Maximum execution time in ms (default: 5 min) */
  timeoutMs?: number;
  /** Maximum number of retries for the entire job */
  maxRetries?: number;
  /** Batch size for processing items */
  batchSize?: number;
}

/** Event emitted when an agent completes a stage */
export interface AgentEvent {
  agentName: AgentName;
  eventType: 'started' | 'progress' | 'completed' | 'failed';
  data?: Record<string, unknown>;
  timestamp: Date;
}

/** Callback for agent event listeners */
export type AgentEventListener = (event: AgentEvent) => void;
