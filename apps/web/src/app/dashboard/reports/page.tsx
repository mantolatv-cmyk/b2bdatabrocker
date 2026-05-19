"use client";

import { motion } from "framer-motion";

export default function ReportsPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relatórios Executivos</h1>
        <p className="text-sm text-zinc-500 mt-1">Relatórios automatizados em PDF com insights do período</p>
      </div>
      <div className="glass rounded-xl p-12 text-center">
        <p className="text-zinc-500 text-sm">Geração de relatórios PDF premium — em desenvolvimento</p>
      </div>
    </motion.div>
  );
}
