"use client";

import { motion } from "framer-motion";

export default function InsightsPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Insights</h1>
        <p className="text-sm text-zinc-500 mt-1">Explore todos os insights gerados pela inteligência artificial</p>
      </div>
      <div className="glass rounded-xl p-12 text-center">
        <p className="text-zinc-500 text-sm">Feed completo de insights com filtros avançados — em desenvolvimento</p>
      </div>
    </motion.div>
  );
}
