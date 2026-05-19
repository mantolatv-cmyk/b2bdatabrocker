"use client";

import { motion } from "framer-motion";

const MOCK_AGENTS = [
  { name: "Coletor", status: "idle" as const, lastRun: "há 28 min", items: 142, icon: "📡" },
  { name: "Classificador", status: "running" as const, lastRun: "agora", items: 89, icon: "🧠" },
  { name: "Analista", status: "idle" as const, lastRun: "há 45 min", items: 12, icon: "🔬" },
  { name: "Monitor Concorrentes", status: "idle" as const, lastRun: "há 2h", items: 5, icon: "⚔️" },
  { name: "Gerador Relatórios", status: "idle" as const, lastRun: "há 24h", items: 1, icon: "📋" },
  { name: "Assistente Proativo", status: "idle" as const, lastRun: "há 1h", items: 3, icon: "🤖" },
];

const statusConfig = {
  idle: { label: "Inativo", color: "bg-zinc-500", text: "text-zinc-400" },
  running: { label: "Executando", color: "bg-emerald-400 animate-pulse", text: "text-emerald-400" },
  failed: { label: "Falhou", color: "bg-red-400", text: "text-red-400" },
};

export default function AgentsPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agentes de IA</h1>
        <p className="text-sm text-zinc-500 mt-1">Monitore o status e a atividade dos agentes autônomos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_AGENTS.map((agent) => {
          const s = statusConfig[agent.status];
          return (
            <motion.div
              key={agent.name}
              whileHover={{ scale: 1.01 }}
              className="glass rounded-xl p-5 space-y-4 hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{agent.icon}</span>
                  <span className="font-medium text-sm">{agent.name}</span>
                </div>
                <div className={`flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider ${s.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${s.color}`} />
                  {s.label}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Última exec: {agent.lastRun}</span>
                <span className="font-mono">{agent.items} itens</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
