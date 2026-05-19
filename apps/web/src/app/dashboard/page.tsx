"use client";

/**
 * B2B Data Broker — Dashboard Overview Page
 * Shows stats grid + InsightCard feed with mock data.
 */

import { motion } from "framer-motion";
import InsightCard from "@/components/insights/InsightCard";

// ── Mock Stats ──
const STATS = [
  { label: "Insights Ativos", value: "47", change: "+12", positive: true, icon: "◈" },
  { label: "Alertas Críticos", value: "3", change: "+1", positive: false, icon: "🛡️" },
  { label: "Oportunidades", value: "8", change: "+3", positive: true, icon: "🎯" },
  { label: "Fontes Monitoradas", value: "24", change: "0", positive: true, icon: "📡" },
];

// ── Mock Insights ──
const MOCK_INSIGHTS = [
  {
    id: "1",
    type: "RISK_ALERT" as const,
    severity: "CRITICAL" as const,
    title: "Novo marco regulatório pode impactar operações de fintechs no Brasil",
    summary: "O Banco Central publicou consulta pública sobre novas regras para instituições de pagamento que podem afetar diretamente empresas do segmento, com prazo de adequação de 180 dias.",
    recommendation: "Agendar reunião com departamento jurídico para avaliar impacto regulatório e iniciar plano de adequação preventivo.",
    confidence: 0.92,
    tags: ["fintech", "regulação", "bacen"],
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    isRead: false,
  },
  {
    id: "2",
    type: "OPPORTUNITY" as const,
    severity: "HIGH" as const,
    title: "Concorrente XYZ anuncia saída do mercado nordestino — gap estratégico",
    summary: "A empresa XYZ Corp comunicou ao mercado a descontinuidade de operações em 5 estados do Nordeste, abrindo espaço para players regionais e nacionais expandirem sua atuação.",
    recommendation: "Avaliar viabilidade de expansão para os estados afetados, priorizando Bahia e Pernambuco que concentram 60% da receita do concorrente.",
    confidence: 0.87,
    tags: ["concorrência", "expansão", "nordeste"],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    isRead: false,
  },
  {
    id: "3",
    type: "TREND" as const,
    severity: "MEDIUM" as const,
    title: "Adoção de IA generativa no setor industrial cresce 340% no trimestre",
    summary: "Dados de mercado indicam que a adoção de ferramentas de IA generativa no setor industrial brasileiro acelerou significativamente, com destaque para automação de processos e manutenção preditiva.",
    confidence: 0.78,
    tags: ["IA", "indústria 4.0", "tendência"],
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    isRead: true,
  },
  {
    id: "4",
    type: "COMPETITIVE_MOVE" as const,
    severity: "LOW" as const,
    title: "Startup brasileira capta R$50M para plataforma de supply chain",
    summary: "A LogiTech Solutions fechou rodada Series B com investidores internacionais para expandir plataforma de otimização logística, visando mercado latinoamericano.",
    confidence: 0.65,
    tags: ["startup", "logística", "funding"],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isRead: true,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function DashboardPage() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      {/* ── Header ── */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold tracking-tight">Terminal de Inteligência</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Visão geral dos insights e métricas em tempo real
        </p>
      </motion.div>

      {/* ── Stats Grid ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="glass rounded-xl p-5 space-y-3 group hover:bg-white/[0.05] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                {stat.label}
              </span>
              <span className="text-base">{stat.icon}</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold tracking-tight font-mono">{stat.value}</span>
              <span className={`text-xs font-mono mb-1 ${stat.positive ? "text-emerald-400" : "text-red-400"}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── Agent Status Bar ── */}
      <motion.div variants={itemVariants} className="glass rounded-xl p-4">
        <div className="flex items-center gap-6 text-xs">
          <span className="text-zinc-500 uppercase tracking-wider font-medium">Status dos Agentes</span>
          <div className="flex items-center gap-4">
            {[
              { name: "Coletor", status: "idle", color: "bg-zinc-500" },
              { name: "Classificador", status: "running", color: "bg-emerald-400 animate-pulse" },
              { name: "Analista", status: "idle", color: "bg-zinc-500" },
            ].map((agent) => (
              <div key={agent.name} className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${agent.color}`} />
                <span className="text-zinc-400">{agent.name}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Insight Feed ── */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Feed de Insights</h2>
          <span className="text-xs text-zinc-500 font-mono">
            {MOCK_INSIGHTS.length} insights ativos
          </span>
        </div>
        <div className="grid gap-4">
          {MOCK_INSIGHTS.map((insight) => (
            <InsightCard
              key={insight.id}
              {...insight}
              onClick={(id) => console.log("Insight clicked:", id)}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
