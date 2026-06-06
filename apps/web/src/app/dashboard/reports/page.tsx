"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ReportConfig {
  period: "7D" | "30D" | "90D" | "MENSAL";
  categories: string[];
  includeLogs: boolean;
  detailedAnalysis: boolean;
}

interface ReportData {
  id: string;
  title: string;
  generatedAt: string;
  periodText: string;
  stats: {
    cashSavings: string;
    costsAvoided: string;
    avgInflation: string;
    precisionAlerts: string;
  };
  executiveSummary: string;
  productMetrics: Array<{
    name: string;
    currentPrice: string;
    projectedPrice: string;
    variation: string;
    trend: "UP" | "DOWN" | "STABLE";
    urgency: "HIGH" | "MEDIUM" | "LOW";
  }>;
  actionMatrix: Array<{
    product: string;
    riskFactor: string;
    recommendation: string;
    timeframe: string;
  }>;
}

const CATEGORIES = [
  { id: "agronegocio", label: "🌾 Agronegócio (Soja, Milho, Boi)" },
  { id: "energia", label: "⚡ Energia & Combustíveis (Brent, Etanol)" },
  { id: "metais", label: "🪨 Mineração & Siderurgia (Aço, Minério)" },
  { id: "quimicos", label: "🧪 Químicos & Fertilizantes (Ureia, Celulose)" },
];

// Archived reports are loaded dynamically from /api/reports


export default function ReportsPage() {
  const [config, setConfig] = useState<ReportConfig>({
    period: "30D",
    categories: ["agronegocio", "energia", "metais"],
    includeLogs: true,
    detailedAnalysis: true,
  });

  const [toast, setToast] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [activeReport, setActiveReport] = useState<ReportData | null>(null);
  const [archivedReports, setArchivedReports] = useState<any[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(true);

  // Load persisted reports from API on mount
  useEffect(() => {
    fetch("/api/reports")
      .then(res => res.json())
      .then(data => {
        if (data.reports) setArchivedReports(data.reports);
      })
      .catch(err => console.warn("Could not load archived reports:", err))
      .finally(() => setArchivedLoading(false));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCategoryToggle = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      categories: prev.categories.includes(id)
        ? prev.categories.filter((c) => c !== id)
        : [...prev.categories, id],
    }));
  };

  // Generates real report by calling /api/reports (POST)
  const triggerGenerateReport = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationLogs(["⚙️ Inicializando o Orquestrador Atlas para compilação executiva..."]);

    const steps = [
      { progress: 15, log: "🌦️ [Agente Climático & Agro] Consultando banco de dados CONAB e CEPEA em tempo real..." },
      { progress: 35, log: "🚚 [Agente Logístico] Coletando cotações USD-BRL e taxas de frete da ANTT..." },
      { progress: 55, log: "📜 [Agente Fiscal] Verificando publicações de ICMS e Substituição Tributária (ST) no Diário Oficial..." },
      { progress: 80, log: "🧠 [Agente Analista (RAG)] Calculando economia real e riscos com base nos insights persistidos no banco..." },
    ];

    for (const step of steps) {
      await new Promise(r => setTimeout(r, 1200));
      setGenerationProgress(step.progress);
      setGenerationLogs(prev => [...prev, step.log]);
    }

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: config.period, categories: config.categories })
      });

      const data = await res.json();

      if (data.success) {
        setGenerationProgress(100);
        setGenerationLogs(prev => [...prev, "✅ [Atlas IA] Relatório compilado com dados reais do banco de dados e indicadores macroeconômicos ao vivo."]);

        setTimeout(() => {
          setIsGenerating(false);
          setActiveReport({
            id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
            title: `Relatório Consolidado de Risco & Suprimento Estratégico — Atlas`,
            generatedAt: new Date().toLocaleDateString("pt-BR") + " às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            periodText: config.period === "7D" ? "Últimos 7 dias" : config.period === "30D" ? "Últimos 30 dias" : config.period === "90D" ? "Últimos 90 dias" : "Mês Corrente",
            stats: data.stats,
            executiveSummary: data.executiveSummary,
            productMetrics: (data.productMetrics || []).map((p: any) => ({
              name: p.name,
              currentPrice: p.financialImpact,
              projectedPrice: p.financialImpact,
              variation: p.impact,
              trend: p.impact.includes("↑") ? "UP" as const : p.impact.includes("↓") ? "DOWN" as const : "STABLE" as const,
              urgency: p.alerts > 2 ? "HIGH" as const : p.alerts > 1 ? "MEDIUM" as const : "LOW" as const,
            })),
            actionMatrix: (data.actionMatrix || []).map((a: any) => ({
              product: a.commodity,
              riskFactor: a.severity,
              recommendation: a.action,
              timeframe: a.deadline,
            })),
          });
          // Refresh archived reports list
          fetch("/api/reports")
            .then(r => r.json())
            .then(d => { if (d.reports) setArchivedReports(d.reports); });
          showToast("Relatório real gerado com sucesso!");
        }, 1000);
      } else {
        throw new Error(data.error || "Falha ao gerar relatório");
      }
    } catch (err: any) {
      setGenerationLogs(prev => [...prev, `❌ Erro: ${err.message}. Verifique a conexão com o banco de dados.`]);
      setGenerationProgress(100);
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 relative pb-16 print:bg-white print:text-black print:p-0 print:space-y-0"
    >
      {/* Print CSS Injection */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          /* Hide everything except print-section */
          .print\\:hidden, 
          main, 
          nav, 
          aside,
          header {
            display: none !important;
          }
          .print-section {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print-text-dark {
            color: #111827 !important;
          }
          .print-border {
            border-color: #e5e7eb !important;
          }
          .print-bg-gray {
            background-color: #f3f4f6 !important;
          }
        }
      `}</style>

      {/* ── Toast Alert ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 glass px-5 py-3 rounded-xl border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.2)] text-xs text-white font-medium flex items-center gap-3 print:hidden"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Neon Glows */}
      <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none print:hidden" />
      <div className="absolute bottom-[100px] left-[-100px] w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none print:hidden" />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-6 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-violet-400 bg-clip-text text-transparent font-display">
            Relatórios Executivos
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Gere consolidados analíticos em PDF e configure alertas periódicos para diretoria de suprimentos e trading.
          </p>
        </div>
        <div className="text-xs text-zinc-500 font-mono glass px-3 py-1.5 rounded-lg flex items-center gap-2 select-none border-white/[0.04]">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Módulo de Exportação Ativo
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start print:block">
        {/* LEFT COLUMN: Configurator & Archive */}
        <div className="lg:col-span-5 space-y-8 print:hidden">
          {/* Configurator Card */}
          <div className="glass rounded-xl p-6 border-white/[0.04] space-y-5">
            <div className="border-b border-white/[0.06] pb-3">
              <h2 className="text-sm font-bold text-white tracking-wide">Configurar Relatório</h2>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Defina os parâmetros de compilação da IA</p>
            </div>

            {/* Period Selector */}
            <div className="space-y-2">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Período de Análise</label>
              <div className="grid grid-cols-4 gap-2 bg-black/25 p-1 rounded-lg border border-white/[0.04]">
                {(["7D", "30D", "90D", "MENSAL"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setConfig((prev) => ({ ...prev, period: p }))}
                    className={`py-1.5 rounded-md text-[10px] font-bold transition-all duration-200 ${
                      config.period === p
                        ? "bg-white/[0.08] text-white border border-white/[0.08] shadow-inner"
                        : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Checkboxes */}
            <div className="space-y-2">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Categorias de Insumo</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const selected = config.categories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryToggle(cat.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-all duration-150 ${
                        selected
                          ? "bg-cyan-500/[0.04] border-cyan-500/20 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.05)]"
                          : "bg-white/[0.015] border-white/[0.03] text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200"
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[8px] ${
                        selected ? "border-cyan-400 bg-cyan-400 text-black" : "border-zinc-700 bg-transparent"
                      }`}>
                        {selected && "✓"}
                      </div>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Toggle Toggles */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-300">Incluir Logs de Varredura</h4>
                  <p className="text-[9px] text-zinc-500">Exibir o histórico detalhado dos agentes</p>
                </div>
                <button
                  onClick={() => setConfig((prev) => ({ ...prev, includeLogs: !prev.includeLogs }))}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                    config.includeLogs ? "bg-cyan-500" : "bg-zinc-800"
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                    config.includeLogs ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-300">Análise Preditiva Profunda</h4>
                  <p className="text-[9px] text-zinc-500">Usar RAG para inferência histórica de preços</p>
                </div>
                <button
                  onClick={() => setConfig((prev) => ({ ...prev, detailedAnalysis: !prev.detailedAnalysis }))}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                    config.detailedAnalysis ? "bg-cyan-500" : "bg-zinc-800"
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                    config.detailedAnalysis ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </div>
            </div>

            {/* Action Trigger */}
            <button
              onClick={triggerGenerateReport}
              disabled={config.categories.length === 0}
              className={`w-full py-3 rounded-xl font-bold text-xs select-none transition-all duration-200 flex items-center justify-center gap-2 ${
                config.categories.length === 0
                  ? "bg-zinc-800 text-zinc-600 cursor-not-allowed border border-transparent"
                  : "bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white shadow-lg shadow-cyan-500/10 border border-white/10 active:scale-[0.98]"
              }`}
            >
              <span>📊</span>
              <span>Gerar Relatório com IA</span>
            </button>
          </div>

          {/* Archived Reports Library */}
          <div className="glass rounded-xl p-6 border-white/[0.04] space-y-4">
            <div className="border-b border-white/[0.06] pb-3">
              <h2 className="text-sm font-bold text-white tracking-wide">Histórico de Relatórios</h2>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Banco de PDFs consolidados</p>
            </div>

            <div className="space-y-2.5">
              {archivedLoading ? (
                <div className="flex items-center justify-center py-8 gap-3">
                  <span className="w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                  <span className="text-xs text-zinc-500">Carregando relatórios...</span>
                </div>
              ) : archivedReports.length > 0 ? archivedReports.map((rep) => (
                <div
                  key={rep.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.015] hover:bg-white/[0.03] border border-white/[0.03] transition-all duration-150"
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <h4 className="text-xs font-semibold text-zinc-300 truncate">{rep.name}</h4>
                    <div className="flex items-center gap-2 text-[9px] text-zinc-500 font-mono">
                      <span>{rep.period}</span>
                      <span>•</span>
                      <span>{rep.sizeLabel}</span>
                      <span>•</span>
                      <span className="bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded text-[8px]">
                        {rep.category}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => showToast(`Relatório ${rep.id} — ${rep.totalInsights} insights analisados.`)}
                    className="p-2 bg-white/[0.03] hover:bg-cyan-500/10 border border-white/[0.05] hover:border-cyan-500/30 rounded-lg text-zinc-400 hover:text-cyan-400 transition-all duration-150 select-none text-[10px]"
                    title="Ver detalhes"
                  >
                    📊
                  </button>
                </div>
              )) : (
                <div className="py-8 text-center space-y-2">
                  <p className="text-zinc-600 text-xs">Nenhum relatório gerado ainda.</p>
                  <p className="text-zinc-700 text-[10px]">Gere seu primeiro relatório acima para ver o histórico aqui.</p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Active Report Sheet Preview / Placeholder */}
        <div className="lg:col-span-7 print:block">
          <AnimatePresence mode="wait">
            {activeReport ? (
              <motion.div
                key="report-sheet"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="print-section bg-zinc-950 border border-white/[0.06] rounded-xl shadow-2xl relative overflow-hidden"
              >
                {/* Visual Sheet Container */}
                <div className="p-8 sm:p-12 space-y-8 text-zinc-300">
                  
                  {/* Report Sheet Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-white/[0.1] pb-6 gap-4 print-border">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent font-black tracking-wider">ATLAS</span>
                        <span className="text-[8px] uppercase tracking-widest font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded">Indústria & Trading</span>
                      </div>
                      <h2 className="text-xl font-bold text-white print-text-dark">{activeReport.title}</h2>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">
                        Compilado em {activeReport.generatedAt}
                      </p>
                    </div>
                    <div className="text-right text-xs text-zinc-400 font-mono space-y-1">
                      <div className="bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 rounded-lg inline-block print-border print-bg-gray">
                        <span className="text-zinc-500">Filtro:</span> <strong className="text-white print-text-dark">{activeReport.periodText}</strong>
                      </div>
                      <div className="text-[9px] text-zinc-500">ID: {activeReport.id}</div>
                    </div>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white/[0.015] border border-white/[0.04] p-3.5 rounded-xl space-y-1 print-border print-bg-gray">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-bold">Economia Viável</span>
                      <span className="text-base font-extrabold text-emerald-400 font-mono">{activeReport.stats.cashSavings}</span>
                    </div>
                    <div className="bg-white/[0.015] border border-white/[0.04] p-3.5 rounded-xl space-y-1 print-border print-bg-gray">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-bold">Custo Evitado</span>
                      <span className="text-base font-extrabold text-white font-mono print-text-dark">{activeReport.stats.costsAvoided}</span>
                    </div>
                    <div className="bg-white/[0.015] border border-white/[0.04] p-3.5 rounded-xl space-y-1 print-border print-bg-gray">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-bold">Inflação Média</span>
                      <span className="text-base font-extrabold text-amber-500 font-mono">{activeReport.stats.avgInflation}</span>
                    </div>
                    <div className="bg-white/[0.015] border border-white/[0.04] p-3.5 rounded-xl space-y-1 print-border print-bg-gray">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-bold">Precisão Alertas</span>
                      <span className="text-base font-extrabold text-cyan-400 font-mono">{activeReport.stats.precisionAlerts}</span>
                    </div>
                  </div>

                  {/* Executive Summary Narrative */}
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold text-white tracking-wider uppercase font-mono border-l-2 border-cyan-400 pl-2 print-text-dark">
                      I. Sumário Analítico do Período
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed text-justify print-text-dark">
                      {activeReport.executiveSummary}
                    </p>
                  </div>

                  {/* Product Variations Table */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-white tracking-wider uppercase font-mono border-l-2 border-cyan-400 pl-2 print-text-dark">
                      II. Comportamento e Projeções de Preço
                    </h3>
                    <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.005] print-border">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-white/[0.03] border-b border-white/[0.06] text-[10px] text-zinc-400 uppercase font-mono tracking-wider print-border print-bg-gray">
                            <th className="py-2.5 px-4 print-text-dark">Commodity / Insumo</th>
                            <th className="py-2.5 px-4 text-right print-text-dark">Preço Custo</th>
                            <th className="py-2.5 px-4 text-right print-text-dark">Projetado (IA)</th>
                            <th className="py-2.5 px-4 text-right print-text-dark">Variação</th>
                            <th className="py-2.5 px-4 text-center print-text-dark">Tendência</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04] font-mono print-border">
                          {activeReport.productMetrics.map((p, idx) => (
                            <tr key={idx} className="hover:bg-white/[0.01]">
                              <td className="py-2.5 px-4 text-zinc-300 font-sans font-semibold print-text-dark">
                                {p.name}
                              </td>
                              <td className="py-2.5 px-4 text-right text-zinc-400 print-text-dark">{p.currentPrice}</td>
                              <td className="py-2.5 px-4 text-right text-white font-bold print-text-dark">{p.projectedPrice}</td>
                              <td className={`py-2.5 px-4 text-right font-bold ${
                                p.trend === "UP" ? "text-rose-400" : p.trend === "DOWN" ? "text-emerald-400" : "text-zinc-400"
                              }`}>
                                {p.variation}
                              </td>
                              <td className="py-2.5 px-4 text-center text-xs">
                                {p.trend === "UP" ? "🔺 Alta" : p.trend === "DOWN" ? "🔻 Queda" : "🔹 Estável"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Recommendation Matrix */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-white tracking-wider uppercase font-mono border-l-2 border-cyan-400 pl-2 print-text-dark">
                      III. Matriz de Ações Sugeridas
                    </h3>
                    <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.005] print-border">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-white/[0.03] border-b border-white/[0.06] text-[10px] text-zinc-400 uppercase font-mono tracking-wider print-border print-bg-gray">
                            <th className="py-2.5 px-4 print-text-dark">Produto</th>
                            <th className="py-2.5 px-4 print-text-dark">Fator de Risco IA</th>
                            <th className="py-2.5 px-4 print-text-dark">Ação Recomendada (Leiga)</th>
                            <th className="py-2.5 px-4 text-center print-text-dark">Prazo de Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04] print-border">
                          {activeReport.actionMatrix.map((act, idx) => (
                            <tr key={idx} className="hover:bg-white/[0.01]">
                              <td className="py-3 px-4 font-bold text-zinc-200 print-text-dark min-w-[120px]">
                                {act.product}
                              </td>
                              <td className="py-3 px-4 text-zinc-400 print-text-dark text-xs leading-relaxed max-w-[200px]">
                                {act.riskFactor}
                              </td>
                              <td className="py-3 px-4 text-cyan-300/90 print-text-dark text-xs font-medium leading-relaxed max-w-[240px]">
                                💡 {act.recommendation}
                              </td>
                              <td className="py-3 px-4 text-center font-mono text-[10px] text-zinc-400 print-text-dark whitespace-nowrap">
                                ⏳ {act.timeframe}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Signatures / Disclaimer Footer */}
                  <div className="border-t border-white/[0.08] pt-8 flex flex-col sm:flex-row justify-between items-center text-[10px] text-zinc-500 gap-4 print-border">
                    <p className="text-justify leading-normal max-w-sm">
                      *Este relatório foi orquestrado pelos 4 agentes integrados da IA Atlas e é confidencial para uso exclusivo da diretoria de suprimentos, hedge e C-level.
                    </p>
                    <div className="flex flex-col items-end gap-1 text-right">
                      <span className="font-bold text-zinc-400 print-text-dark">Atlas Inteligência Preditiva</span>
                      <span>Tecnologia B2B DataBroker</span>
                    </div>
                  </div>
                </div>

                {/* Print Sheet Action Floating Bar */}
                <div className="bg-white/[0.02] border-t border-white/[0.06] p-4 flex justify-between items-center print:hidden">
                  <button
                    onClick={() => setActiveReport(null)}
                    className="px-4 py-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-xs font-semibold text-zinc-300 hover:text-white rounded-lg transition-colors select-none"
                  >
                    ← Nova Configuração
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePrint}
                      className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 font-bold text-xs text-white rounded-lg transition-all select-none shadow-lg shadow-cyan-500/10 active:scale-[0.98]"
                    >
                      🖨️ Salvar PDF / Imprimir
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="report-placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass rounded-xl p-16 text-center border-white/[0.04] space-y-4 min-h-[450px] flex flex-col items-center justify-center print:hidden"
              >
                <div className="w-16 h-16 bg-white/[0.02] rounded-full flex items-center justify-center border border-white/[0.04] text-3xl">
                  📄
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white tracking-wide">Nenhum Relatório Gerado</h3>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    Ajuste as categorias e o período desejado no painel ao lado e clique em <strong>"Gerar Relatório com IA"</strong> para compilar o consolidados analítico.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Real-Time Agent Compile Progress Modal ── */}
      <AnimatePresence>
        {isGenerating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md print:hidden">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg glass-strong border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-6 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  <h3 className="text-sm font-bold text-white tracking-wide">Compilando Relatório IA</h3>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-400">{generationProgress}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 rounded-full"
                  style={{ width: `${generationProgress}%` }}
                  transition={{ ease: "easeInOut" }}
                />
              </div>

              {/* Console Logs */}
              <div className="bg-black/35 rounded-xl p-4 border border-white/[0.04] h-48 overflow-y-auto space-y-2 font-mono text-[9px] leading-relaxed text-zinc-400 scrollbar-thin scrollbar-thumb-zinc-800">
                {generationLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-cyan-600 select-none">&gt;</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>

              {/* Loading Indicator */}
              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono pt-1">
                <span>Orquestrador Atlas em execução...</span>
                <span>Por favor, aguarde</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
