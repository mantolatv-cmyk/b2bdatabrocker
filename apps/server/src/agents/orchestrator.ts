/**
 * ═══════════════════════════════════════════
 * B2B Data Broker — Agent Orchestrator
 * ═══════════════════════════════════════════
 * Central orchestrator that manages the AI agent pipeline:
 * Collector → Classifier → Analyst
 *
 * Patterns applied:
 * - Strategy Pattern: agents are interchangeable via IAgent interface
 * - Event-driven: agents communicate via typed events
 * - Circuit Breaker: via LLM service integration
 * - Dependency Injection: all dependencies injected via constructor
 */

import { PrismaClient } from '@prisma/client';
import type { AgentName, AgentResult, AgentJobPayload } from '@b2b/shared';
import type { IAgent, AgentEvent, AgentEventListener } from './types';
import { createLogger } from '../utils/logger';
import { AgentError } from '../utils/errors';

const log = createLogger('orchestrator');

/** Pipeline stage definition */
interface PipelineStage {
  agent: IAgent;
  /** Agents that must complete before this one runs */
  dependsOn: AgentName[];
}

export class AgentOrchestrator {
  private readonly agents: Map<AgentName, IAgent> = new Map();
  private readonly pipeline: PipelineStage[] = [];
  private readonly listeners: AgentEventListener[] = [];
  private isRunning = false;

  constructor(private readonly prisma: PrismaClient) {}

  // ═══════════════════════════════════════
  // REGISTRATION
  // ═══════════════════════════════════════

  /**
   * Register an agent in the orchestrator.
   * Agents must be registered before building the pipeline.
   */
  registerAgent(agent: IAgent): this {
    this.agents.set(agent.name, agent);
    log.info({ agent: agent.name }, 'Agent registered');
    return this;
  }

  /**
   * Define the execution pipeline with dependency ordering.
   * Example: Collector → Classifier → Analyst
   */
  definePipeline(stages: Array<{ name: AgentName; dependsOn?: AgentName[] }>): this {
    this.pipeline.length = 0;

    for (const stage of stages) {
      const agent = this.agents.get(stage.name);
      if (!agent) {
        throw new AgentError({
          message: `Agent "${stage.name}" not registered`,
          agentName: stage.name,
        });
      }
      this.pipeline.push({
        agent,
        dependsOn: stage.dependsOn ?? [],
      });
    }

    log.info(
      { pipeline: stages.map((s) => s.name) },
      'Pipeline defined'
    );
    return this;
  }

  /**
   * Subscribe to agent lifecycle events.
   */
  onEvent(listener: AgentEventListener): this {
    this.listeners.push(listener);
    return this;
  }

  // ═══════════════════════════════════════
  // EXECUTION
  // ═══════════════════════════════════════

  /**
   * Execute the full pipeline sequentially.
   * Each stage runs after its dependencies complete.
   */
  async runPipeline(
    trigger: 'cron' | 'manual' = 'cron',
    params?: Record<string, unknown>
  ): Promise<Map<AgentName, AgentResult>> {
    if (this.isRunning) {
      log.warn('Pipeline already running, skipping');
      return new Map();
    }

    this.isRunning = true;
    const results = new Map<AgentName, AgentResult>();
    const pipelineStart = Date.now();

    log.info({ trigger, stages: this.pipeline.length, params }, '🚀 Pipeline started');

    try {
      for (const stage of this.pipeline) {
        // Check that dependencies succeeded
        const depsOk = stage.dependsOn.every((dep) => {
          const depResult = results.get(dep);
          return depResult?.success === true;
        });

        if (!depsOk) {
          const failedDeps = stage.dependsOn.filter(
            (dep) => !results.get(dep)?.success
          );
          log.warn(
            { agent: stage.agent.name, failedDeps },
            'Skipping agent due to failed dependencies'
          );

          results.set(stage.agent.name, {
            success: false,
            agentName: stage.agent.name,
            itemsProcessed: 0,
            errors: [{
              code: 'DEPENDENCY_FAILED',
              message: `Dependencies failed: ${failedDeps.join(', ')}`,
              retryable: false,
            }],
            durationMs: 0,
          });
          continue;
        }

        // Execute agent
        const result = await this.executeAgent(stage.agent, trigger, params);
        results.set(stage.agent.name, result);
      }
    } finally {
      this.isRunning = false;
      const totalMs = Date.now() - pipelineStart;
      log.info(
        {
          totalMs,
          results: Object.fromEntries(
            [...results.entries()].map(([k, v]) => [k, v.success])
          ),
        },
        '🏁 Pipeline completed'
      );
    }

    return results;
  }

  /**
   * Execute a single agent with logging and DB tracking.
   */
  async executeAgent(
    agent: IAgent,
    trigger: 'cron' | 'manual' | 'pipeline' = 'pipeline',
    params?: Record<string, unknown>
  ): Promise<AgentResult> {
    const startTime = Date.now();

    // Create DB run record
    const run = await this.prisma.agentRun.create({
      data: {
        agentName: agent.name,
        status: 'RUNNING',
        metadata: { trigger, params } as any,
      },
    });

    this.emit({
      agentName: agent.name,
      eventType: 'started',
      data: { runId: run.id },
      timestamp: new Date(),
    });

    try {
      const payload: AgentJobPayload = {
        agentName: agent.name,
        triggeredBy: trigger,
        priority: 'normal',
        params,
      };

      const result = await agent.execute(payload);
      const durationMs = Date.now() - startTime;

      // Update DB record
      await this.prisma.agentRun.update({
        where: { id: run.id },
        data: {
          status: result.success ? 'SUCCESS' : 'FAILED',
          completedAt: new Date(),
          itemsProcessed: result.itemsProcessed,
          errorMessage: result.errors.length > 0
            ? result.errors.map((e) => e.message).join('; ')
            : null,
        },
      });

      this.emit({
        agentName: agent.name,
        eventType: result.success ? 'completed' : 'failed',
        data: { runId: run.id, itemsProcessed: result.itemsProcessed, durationMs },
        timestamp: new Date(),
      });

      log.info(
        {
          agent: agent.name,
          success: result.success,
          items: result.itemsProcessed,
          durationMs,
        },
        `Agent ${result.success ? '✅' : '❌'} ${agent.name}`
      );

      return { ...result, durationMs };
    } catch (error) {
      const durationMs = Date.now() - startTime;

      await this.prisma.agentRun.update({
        where: { id: run.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: (error as Error).message,
        },
      });

      this.emit({
        agentName: agent.name,
        eventType: 'failed',
        data: { error: (error as Error).message },
        timestamp: new Date(),
      });

      log.error({ agent: agent.name, error }, 'Agent execution crashed');

      return {
        success: false,
        agentName: agent.name,
        itemsProcessed: 0,
        errors: [{
          code: 'EXECUTION_CRASH',
          message: (error as Error).message,
          retryable: true,
        }],
        durationMs,
      };
    }
  }

  /**
   * Run health checks on all registered agents.
   */
  async healthCheckAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [name, agent] of this.agents) {
      try {
        results[name] = await agent.healthCheck();
      } catch {
        results[name] = false;
      }
    }

    return results;
  }

  /** Emit event to all listeners */
  private emit(event: AgentEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        log.error({ error }, 'Event listener error');
      }
    });
  }
}
