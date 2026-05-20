"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import InsightCard from "@/components/insights/InsightCard";

interface InsightItem {
  id: string;
  type: "RISK_ALERT" | "OPPORTUNITY" | "TREND" | "COMPETITIVE_MOVE" | "REGULATORY_CHANGE";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  summary: string;
  recommendation?: string;
  analysis?: string;
  sources?: string[];
  confidence: number;
  probability?: number;
  timeframe?: string;
  financialImpact?: string;
  tags: string[];
  createdAt: string;
  isRead?: boolean;
  metadata?: {
    usd?: string;
    eur?: string;
    cny?: string;
    selic?: string;
    ipca?: string;
    igpm?: string;
    newsHeadline?: string;
    newsUrl?: string;
  };
}

const MATERIALS = [
  { value: "ALL", label: "🌍 Todos os Produtos" },
  { value: "arroz", label: "🌾 Arroz Tipo 1" },
  { value: "feijao", label: "🫘 Feijão Carioca" },
  { value: "oleo", label: "🌻 Óleo de Soja" },
  { value: "leite", label: "🥛 Leite UHT" },
  { value: "cafe", label: "☕ Café Almofada" },
  { value: "carne", label: "🥩 Alcatra Bovina" },
  { value: "azeite", label: "🫒 Azeite de Oliva" },
  { value: "trigo", label: "🍞 Pão de Forma" },
  { value: "acucar", label: "🍬 Açúcar Refinado" },
  { value: "queijo", label: "🧀 Queijo Muçarela" },
  { value: "cerveja", label: "🍺 Cerveja Lata" },
  { value: "diesel", label: "🚚 Óleo Diesel" },
  { value: "frango", label: "🍗 Frango Inteiro" },
  { value: "sabao", label: "🫧 Sabão em Pó" },
  { value: "margarina", label: "🧈 Margarina" },
  { value: "macarrao", label: "🍝 Macarrão Espaguete" },
  { value: "cremedental", label: "🪥 Creme Dental" },
  { value: "papelhigienico", label: "🧻 Papel Higiênico" }
];

export default function InsightsPage() {
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<InsightItem | null>(null);
  
  // Filters
  const [search, setSearch] = useState("");
  const [materialFilter, setMaterialFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL", "UNREAD", "READ"

  // WhatsApp states
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [sendingWa, setSendingWa] = useState(false);
  const [waStatus, setWaStatus] = useState<{ type: "success" | "error" | "link"; text: string; url?: string } | null>(null);

  useEffect(() => {
    // Load default saved phone from settings if available
    if (typeof window !== "undefined") {
      const savedPhone = localStorage.getItem("atlas_whatsapp_phone") || "";
      setWhatsappPhone(savedPhone);
    }
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/scan");
      if (res.ok) {
        const data = await res.json();
        setInsights(data);
      }
    } catch (e) {
      console.error("Failed to load insights:", e);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string, isRead: boolean) => {
    // Update local state first
    setInsights(prev => prev.map(ins => ins.id === id ? { ...ins, isRead } : ins));
    if (selectedInsight && selectedInsight.id === id) {
      setSelectedInsight(prev => prev ? { ...prev, isRead } : null);
    }

    try {
      await fetch("/api/scan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isRead })
      });
    } catch (e) {
      console.warn("Failed to persist isRead on database, falls back to memory:", e);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!selectedInsight || !whatsappPhone) return;
    setSendingWa(true);
    setWaStatus(null);

    // Save phone to localStorage
    localStorage.setItem("atlas_whatsapp_phone", whatsappPhone);

    try {
      const res = await fetch("/api/notifications/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: whatsappPhone,
          message: selectedInsight.analysis || selectedInsight.summary,
          title: selectedInsight.title,
          recommendedAction: selectedInsight.recommendation
        })
      });

      if (res.ok) {
        const result = await res.json();
        if (result.provider === "link_fallback" && result.redirectUrl) {
          setWaStatus({
            type: "link",
            text: "API de WhatsApp não configurada nas variáveis do servidor. Clique no botão abaixo para disparar via WhatsApp Web gratuitamente!",
            url: result.redirectUrl
          });
        } else {
          setWaStatus({
            type: "success",
            text: "Mensagem disparada com sucesso pelo servidor através da API integrada!"
          });
        }
      } else {
        setWaStatus({
          type: "error",
          text: "Falha na comunicação com o servidor de envio."
        });
      }
    } catch (e) {
      setWaStatus({
        type: "error",
        text: "Erro de conexão ao disparar WhatsApp."
      });
    } finally {
      setSendingWa(false);
    }
  };

  const filtered = insights.filter(ins => {
    // Search filter
    const matchesSearch = 
      ins.title.toLowerCase().includes(search.toLowerCase()) || 
      ins.summary.toLowerCase().includes(search.toLowerCase());

    // Material filter
    const matchesMaterial = materialFilter === "ALL" || ins.tags.some(t => t.toLowerCase() === materialFilter.toLowerCase());

    // Severity filter
    const matchesSeverity = severityFilter === "ALL" || ins.severity === severityFilter;

    // Status filter
    const matchesStatus = 
      statusFilter === "ALL" || 
      (statusFilter === "UNREAD" && !ins.isRead) || 
      (statusFilter === "READ" && ins.isRead);

    return matchesSearch && matchesMaterial && matchesSeverity && matchesStatus;
  });

  return (
    <div className="relative min-h-[calc(100vh-100px)] space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Feed de Insights Preditivos</h1>
        <p className="text-sm text-zinc-500 mt-1">Histórico completo de análises macroeconômicas e de mercado salvas no banco de dados.</p>
      </div>

      {/* Filter panel */}
      <div className="glass rounded-2xl p-5 border border-white/[0.05] space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
            <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-medium">Buscar nas análises</label>
            <input
              type="text"
              placeholder="Digite termos como 'arroz', 'seca', 'diesel'..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.12] focus:border-cyan-500/50 rounded-xl px-4 py-2 text-sm text-white placeholder-zinc-500 outline-none transition-colors"
            />
          </div>

          {/* Commodity filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-medium">Mercadoria</label>
            <select
              value={materialFilter}
              onChange={e => setMaterialFilter(e.target.value)}
              className="bg-zinc-950 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-sm text-white outline-none transition-colors"
            >
              {MATERIALS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Severity filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-medium">Gravidade</label>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="bg-zinc-950 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-sm text-white outline-none transition-colors"
            >
              <option value="ALL">💥 Todas as Gravidades</option>
              <option value="CRITICAL">🔴 Crítico</option>
              <option value="HIGH">🟡 Alto</option>
              <option value="MEDIUM">🟣 Médio</option>
              <option value="LOW">🔵 Baixo</option>
            </select>
          </div>
        </div>

        {/* Extra filtering flags */}
        <div className="flex gap-2 pt-2 border-t border-white/[0.03]">
          {["ALL", "UNREAD", "READ"].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                statusFilter === st 
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" 
                  : "bg-white/[0.02] border-white/[0.05] hover:border-white/[0.12] text-zinc-400"
              }`}
            >
              {st === "ALL" && "Todos os status"}
              {st === "UNREAD" && "📬 Não Lidos"}
              {st === "READ" && "✔️ Lidos"}
            </button>
          ))}
        </div>
      </div>

      {/* Insights Grid */}
      {loading ? (
        <div className="glass rounded-xl p-12 text-center border border-white/[0.05]">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 text-sm">Carregando feed histórico de insights...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
          {filtered.map(insight => (
            <InsightCard
              key={insight.id}
              {...insight}
              onClick={() => {
                setSelectedInsight(insight);
                if (!insight.isRead) markAsRead(insight.id, true);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="glass rounded-xl p-16 text-center border border-white/[0.05] space-y-4">
          <span className="text-4xl block">📂</span>
          <h3 className="text-lg font-bold text-white">Nenhuma previsão encontrada</h3>
          <p className="text-zinc-500 text-sm max-w-md mx-auto">
            {search || materialFilter !== "ALL" || severityFilter !== "ALL" || statusFilter !== "ALL"
              ? "Experimente redefinir os filtros ou buscar por outro termo para localizar os registros."
              : "Execute sua primeira Varredura Preditiva no painel de controle principal para alimentar o banco de dados."}
          </p>
          {(search || materialFilter !== "ALL" || severityFilter !== "ALL" || statusFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setMaterialFilter("ALL");
                setSeverityFilter("ALL");
                setStatusFilter("ALL");
              }}
              className="px-4 py-2 bg-white/[0.05] border border-white/[0.08] hover:border-white/[0.15] text-white text-xs font-semibold rounded-xl transition-all"
            >
              Limpar Todos os Filtros
            </button>
          )}
        </div>
      )}

      {/* Drawer Overlay & Content */}
      <AnimatePresence>
        {selectedInsight && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedInsight(null);
                setWaStatus(null);
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Sidebar Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-xl bg-zinc-950/95 border-l border-white/[0.08] shadow-2xl backdrop-blur-2xl z-50 overflow-y-auto"
            >
              <div className="p-6 sm:p-8 space-y-6">
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.05]">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Código da Análise</span>
                    <span className="text-xs text-zinc-400 font-mono">ID: {selectedInsight.id}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedInsight(null);
                      setWaStatus(null);
                    }}
                    className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] text-zinc-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Severity Badge */}
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                    selectedInsight.severity === "CRITICAL" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                    selectedInsight.severity === "HIGH" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                    selectedInsight.severity === "MEDIUM" ? "bg-violet-500/10 text-violet-400 border border-violet-500/20" :
                    "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  }`}>
                    ⚠️ {selectedInsight.severity === "CRITICAL" ? "Crítico" : selectedInsight.severity === "HIGH" ? "Alto" : selectedInsight.severity === "MEDIUM" ? "Médio" : "Baixo"}
                  </span>
                  <span className="text-zinc-500 text-xs font-mono">
                    Precisão Calculada: {Math.round(selectedInsight.confidence * 100)}%
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
                  {selectedInsight.title}
                </h2>

                {/* Stats Table */}
                <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-white/[0.01] border border-white/[0.04]">
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase font-mono block">Ocorrência</span>
                    <span className="text-sm font-bold text-cyan-400 font-mono">92%</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase font-mono block">Janela para Ação</span>
                    <span className="text-sm font-bold text-violet-400 font-mono">{selectedInsight.timeframe || "15 dias"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase font-mono block">Impacto de Caixa</span>
                    <span className={`text-sm font-bold font-mono ${selectedInsight.financialImpact?.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}>
                      {selectedInsight.financialImpact || "-R$ 5.800"}
                    </span>
                  </div>
                </div>

                {/* Detailed Analysis */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Resumo do Diagnóstico</h4>
                  <p className="text-sm text-zinc-300 leading-relaxed bg-white/[0.01] p-4 rounded-xl border border-white/[0.03]">
                    {selectedInsight.analysis || selectedInsight.summary}
                  </p>
                </div>

                {/* Recommendation */}
                {selectedInsight.recommendation && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">Recomendação de Compras</h4>
                    <div className="p-4 rounded-xl bg-emerald-950/10 border border-emerald-500/20 text-emerald-300/90 text-sm leading-relaxed font-medium">
                      💡 {selectedInsight.recommendation}
                    </div>
                  </div>
                )}

                {/* WhatsApp Notification Box */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    <span>🟢</span> Notificar Comprador via WhatsApp
                  </h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Envie as informações desta previsão com a recomendação de compra estruturada diretamente para o telefone do comprador responsável.
                  </p>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Telefone ex: 5511999998888"
                      value={whatsappPhone}
                      onChange={e => setWhatsappPhone(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-white/[0.08] hover:border-white/[0.12] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none transition-colors"
                    />
                    <button
                      onClick={handleSendWhatsApp}
                      disabled={sendingWa || !whatsappPhone}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                    >
                      {sendingWa ? "Enviando..." : "Disparar WhatsApp"}
                    </button>
                  </div>

                  {waStatus && (
                    <div className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-2 ${
                      waStatus.type === "success" ? "bg-emerald-950/15 border-emerald-500/30 text-emerald-400" :
                      waStatus.type === "error" ? "bg-red-950/15 border-red-500/30 text-red-400" :
                      "bg-amber-950/15 border-amber-500/30 text-amber-300"
                    }`}>
                      <p>{waStatus.text}</p>
                      {waStatus.url && (
                        <a
                          href={waStatus.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] uppercase rounded-lg transition-all"
                        >
                          🚀 Abrir Link do WhatsApp
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Read/Unread actions */}
                <div className="flex justify-between items-center pt-4 border-t border-white/[0.05]">
                  <button
                    onClick={() => markAsRead(selectedInsight.id, !selectedInsight.isRead)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      selectedInsight.isRead
                        ? "bg-white/[0.02] border-white/[0.08] text-zinc-400 hover:text-white"
                        : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                    }`}
                  >
                    {selectedInsight.isRead ? "Marcar como não lido 📬" : "Marcar como lido ✔️"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
