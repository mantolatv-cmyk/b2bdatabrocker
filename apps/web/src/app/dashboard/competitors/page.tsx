"use client";

import { motion } from "framer-motion";

export default function CompetitorsPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Radar de Concorrentes</h1>
        <p className="text-sm text-zinc-500 mt-1">Monitore movimentações de concorrentes em tempo real</p>
      </div>
      <div className="glass rounded-xl p-12 text-center">
        <p className="text-zinc-500 text-sm">Grafo de rede interativo com React Flow — em desenvolvimento</p>
      </div>
    </motion.div>
  );
}
