"use client";

import { motion } from "framer-motion";

export default function SettingsPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-zinc-500 mt-1">Gerencie sua conta, alertas e fontes de dados</p>
      </div>
      <div className="glass rounded-xl p-12 text-center">
        <p className="text-zinc-500 text-sm">Painel de configurações — em desenvolvimento</p>
      </div>
    </motion.div>
  );
}
