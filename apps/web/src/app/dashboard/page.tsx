"use client";

/**
 * B2B Data Broker — Dashboard Overview Page (Foco Preditivo de Risco & Lucro)
 * Shows financial stats grid + Predictive InsightCard feed with mock data.
 * Enhanced with filters, neon ambient glows, details drawer with predictive matrix,
 * custom interactive SVG Risk/Return projection chart, real-time AI Agent Center,
 * simulated operations logs, and interactive Quick Actions.
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import InsightCard from "@/components/insights/InsightCard";
import { ALL_INSUMOS, INSUMOS_COUNT, getCategoryLabel, CATEGORIES, getInsumoById } from "@/lib/insumos";

// Stats are loaded dynamically from /api/dashboard/stats
interface StatItem {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: string;
}

const STATS_FALLBACK: StatItem[] = [
  { label: "Economia Projetada", value: "Calculando...", change: "Aguardando dados", positive: true, icon: "🎯" },
  { label: "Risco de Custo Alto", value: "Calculando...", change: "Aguardando dados", positive: false, icon: "🛡️" },
  { label: "Precisão dos Alertas", value: "94.0%", change: "Base histórica", positive: true, icon: "📈" },
  { label: "Insumos Rastreados", value: `${INSUMOS_COUNT} Insumos`, change: "Ativos", positive: true, icon: "📦" },
];

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

// No mock insights — data is loaded exclusively from /api/scan (Prisma DB)


const MATERIALS = [
  { value: "ALL", label: "🌍 Todos os Produtos" },
  ...ALL_INSUMOS.map(i => ({
    value: i.id,
    label: `${i.emoji} ${i.name}`,
  })),
];

function generateChartData(insumos: typeof ALL_INSUMOS) {
  const dayLabels = ["Sem. 1", "Sem. 2", "Sem. 3", "Sem. 4", "Sem. 5", "Sem. 6", "Sem. 7"];
  const monthLabels = ["Mês 1", "Mês 2", "Mês 3", "Mês 4"];

  function generateSeries(basePrice: number, points: number, labels: string[], seed: number) {
    let price = basePrice;
    return labels.map((label, i) => {
      const variation = 1 + Math.sin(seed * (i + 1) * 1.7) * 0.06 + Math.cos(seed * (i + 1) * 0.9) * 0.03;
      price = Math.round(basePrice * variation * 100) / 100;
      const status = variation > 1.04 ? "high" : variation < 0.97 ? "buy" : "stable";
      return { day: label, price, status };
    });
  }

  const allAvg = insumos.reduce((s, i) => s + i.basePrice, 0) / insumos.length;

  const result7D: Record<string, Array<{ day: string; price: number; status: string }>> = {
    ALL: generateSeries(allAvg / 100, 7, dayLabels, 999),
  };
  const result30D: Record<string, Array<{ day: string; price: number; status: string }>> = {
    ALL: generateSeries(allAvg / 100, 4, monthLabels, 999),
  };

  for (const insumo of insumos) {
    const bp = insumo.basePrice / 100;
    const seed = insumo.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
    result7D[insumo.id] = generateSeries(bp, 7, dayLabels, seed);
    result30D[insumo.id] = generateSeries(bp, 4, monthLabels, seed);
  }

  return { "7D": result7D, "30D": result30D };
}

const MATERIAL_CHART_DATA = generateChartData(ALL_INSUMOS);

const SEVERITIES = [
  { value: "ALL", label: "Severidades" },
  { value: "CRITICAL", label: "Crítico" },
  { value: "HIGH", label: "Alto" },
  { value: "MEDIUM", label: "Médio" },
  { value: "LOW", label: "Baixo" },
];

const TYPES = [
  { value: "ALL", label: "Todos os Tipos" },
  { value: "RISK_ALERT", label: "🛡️ Risco de Custo Alto" },
  { value: "OPPORTUNITY", label: "🎯 Economia / Oportunidade" },
  { value: "TREND", label: "📈 Tendência de Preço" },
  { value: "COMPETITIVE_MOVE", label: "⚔️ Movimentação Local" },
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
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<InsightItem | null>(null);
  const [liveStats, setLiveStats] = useState<StatItem[]>(STATS_FALLBACK);
  const [statsLoading, setStatsLoading] = useState(true);
  const [macroContext, setMacroContext] = useState<any>(null);
  
  // Filtering States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSeverity, setActiveSeverity] = useState("ALL");
  const [activeType, setActiveType] = useState("ALL");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("ALL");
  const [productSearch, setProductSearch] = useState("");

  // Chart States
  const [chartPeriod, setChartPeriod] = useState<"7D" | "30D">("7D");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Toast State
  const [toast, setToast] = useState<string | null>(null);

  // WhatsApp Alerts States
  const [phoneNum, setPhoneNum] = useState("(11) 99999-9999");
  const [isSimulatingPhone, setIsSimulatingPhone] = useState(false);
  const [whatsappNotificationText, setWhatsappNotificationText] = useState("");

  // Load WhatsApp settings from localStorage if available
  useEffect(() => {
    try {
      const storedAlerts = localStorage.getItem("atlas_settings_alerts");
      if (storedAlerts) {
        const parsed = JSON.parse(storedAlerts);
        if (parsed.phone) setPhoneNum(parsed.phone);
      }
    } catch (e) {
      console.warn("Could not read settings phone from localStorage:", e);
    }
  }, []);

  // Load real stats from API on mount
  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then(res => res.json())
      .then(data => {
        if (data.stats) {
          setLiveStats(data.stats);
          setMacroContext(data.macroContext);
        }
      })
      .catch(err => console.warn("Could not load real stats:", err))
      .finally(() => setStatsLoading(false));
  }, []);

  // Load persisted InsightCard records from Prisma on mount (no mocks)
  useEffect(() => {
    fetch("/api/scan")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load insights");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setInsights(data);
        }
      })
      .catch((err) => {
        console.warn("Could not load persisted insights from Prisma:", err);
      })
      .finally(() => setInsightsLoading(false));
  }, []);

  const deleteInsight = async (id: string) => {
    try {
      setInsights((prev) => prev.filter((i) => i.id !== id));
      if (selectedInsight?.id === id) setSelectedInsight(null);
      const res = await fetch("/api/scan", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        throw new Error("Failed to delete insight");
      }
    } catch (err) {
      console.error(err);
      // Optional: re-fetch if failed, or show toast
    }
  };

  // Real Price Chart State
  const [liveChartData, setLiveChartData] = useState<Array<{ day: string; price: number; status: string }> | null>(null);

  // WhatsApp dispatch states
  const [sendingWa, setSendingWa] = useState(false);
  const [waStatus, setWaStatus] = useState<{ type: "success" | "error" | "link"; text: string; url?: string } | null>(null);

  // Load real prices from API when material or period changes
  useEffect(() => {
    async function fetchRealPrices() {
      if (selectedMaterial === "ALL") {
        setLiveChartData(null);
        return;
      }
      try {
        const res = await fetch(`/api/prices?material=${selectedMaterial}&period=${chartPeriod}`);
        if (res.ok) {
          const json = await res.json();
          if (json.history) {
            const mapped = json.history.map((h: any) => ({
              day: h.date,
              price: h.price,
              status: json.trend
            }));
            setLiveChartData(mapped);
          }
        }
      } catch (err) {
        console.warn("Error fetching real prices, using local mock data fallback:", err);
      }
    }
    fetchRealPrices();
  }, [selectedMaterial, chartPeriod]);

  // Clean WhatsApp status when active insight changes
  useEffect(() => {
    setWaStatus(null);
  }, [selectedInsight]);

  // Agent Operations State
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [agentStatus, setAgentStatus] = useState({
    climatico: "idle",
    logistico: "idle",
    fiscal: "idle",
    analista: "idle"
  });

  const [agentLogs, setAgentLogs] = useState<Array<{ id: number; time: string; agent: string; text: string }>>([
    { id: 1, time: "18:40:12", agent: "Agente Climático", text: "Monitorando pluviometria nas bacias leiteiras de MG/GO." },
    { id: 2, time: "18:41:05", agent: "Agente Fiscal", text: "Alíquotas de ICMS estáveis na cesta básica nacional." },
    { id: 3, time: "18:42:30", agent: "Agente Analista", text: "RAG carregado com sucesso: pronto para análises correlacionadas." },
  ]);

  // Insumo target for IA Center scan
  const [scanInsumoId, setScanInsumoId] = useState<string>("ALL");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const markAsRead = async (id: string) => {
    setInsights((prev) =>
      prev.map((ins) => (ins.id === id ? { ...ins, isRead: true } : ins))
    );
    if (selectedInsight && selectedInsight.id === id) {
      setSelectedInsight((prev) => (prev ? { ...prev, isRead: true } : null));
    }
    try {
      await fetch("/api/scan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isRead: true })
      });
    } catch (_) {}
  };

  const archiveInsight = (id: string) => {
    setInsights((prev) => prev.filter((ins) => ins.id !== id));
    setSelectedInsight(null);
  };

  const handleRealWhatsAppDispatch = async () => {
    if (!selectedInsight || !phoneNum) return;
    setSendingWa(true);
    setWaStatus(null);

    // Save phone settings to localStorage
    try {
      localStorage.setItem("atlas_settings_alerts", JSON.stringify({ phone: phoneNum }));
    } catch (_) {}

    try {
      const res = await fetch("/api/notifications/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneNum,
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
            text: "API de WhatsApp não configurada nas variáveis do servidor. Clique abaixo para enviar via WhatsApp Web gratuitamente!",
            url: result.redirectUrl
          });
        } else {
          setWaStatus({
            type: "success",
            text: "Notificação disparada via API com sucesso!"
          });
        }
      } else {
        setWaStatus({ type: "error", text: "Erro ao comunicar com a rota de WhatsApp." });
      }
    } catch (e) {
      setWaStatus({ type: "error", text: "Erro de conexão ao disparar notificação." });
    } finally {
      setSendingWa(false);
    }
  };

  const handleTestAlert = () => {
    let msg = "";
    const insumo = selectedMaterial === "ALL" ? ALL_INSUMOS[0] : getInsumoById(selectedMaterial);
    if (insumo) {
      const alertType = Math.random() > 0.4 ? "ALERTA" : "OPORTUNIDADE";
      const pct = Math.floor(Math.random() * 10) + 4;
      const days = Math.floor(Math.random() * 20) + 5;
      if (alertType === "ALERTA") {
        msg = `${insumo.emoji} *ATLAS ALERTA:* ${insumo.name} — Condições de mercado (clima, câmbio, demanda) indicam alta de aproximadamente ${pct}% nos próximos ${days} dias. Antecipe compras para garantir margem.`;
      } else {
        msg = `${insumo.emoji} *ATLAS OPORTUNIDADE:* ${insumo.name} — Janela de mercado favorável com potencial de economia de ${pct}% nos próximos ${days} dias. Aproveite para fechar contratos.`;
      }
    }
    setWhatsappNotificationText(msg);
    setIsSimulatingPhone(true);
  };

  const startManualScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);
    setAgentStatus({ climatico: "running", logistico: "idle", fiscal: "idle", analista: "idle" });

    const now = new Date();
    const timeStr = now.toLocaleTimeString("pt-BR");
    const targetName = scanInsumoId !== "ALL"
      ? `${getInsumoById(scanInsumoId)?.emoji ?? ""} ${getInsumoById(scanInsumoId)?.name ?? scanInsumoId}`
      : "todos os insumos";
    const newLogs = [
      { id: Date.now(), time: timeStr, agent: "Agente Analista", text: `Iniciando varredura preditiva sob demanda — alvo: ${targetName}...` }
    ];
    setAgentLogs(newLogs);

    // Call DeepSeek API in parallel
    let apiResult: InsightItem | null = null;
    let fetchFinished = false;
    let fetchError: Error | null = null;

    fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ insumoId: scanInsumoId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("API responded with error");
        return res.json();
      })
      .then((data) => {
        apiResult = data;
        fetchFinished = true;
      })
      .catch((err) => {
        console.warn("Failed to fetch DeepSeek API, using fallback:", err);
        fetchError = err;
        fetchFinished = true;
      });

    let progress = 0;
    const interval = setInterval(() => {
      const currentTime = new Date().toLocaleTimeString("pt-BR");

      if (!fetchFinished) {
        // Slow down progress accumulation as it approaches 95%
        if (progress < 95) {
          progress += 5;
          setScanProgress(progress);
        }

        // Trigger log messages based on progress phases
        if (progress === 20) {
          setAgentLogs(prev => {
            if (prev.some(l => l.text.includes("Varrendo relatórios"))) return prev;
            return [
              ...prev,
              { id: Date.now() + 1, time: currentTime, agent: "Agente Climático", text: "Varrendo relatórios CONAB, CEPEA e boletins meteorológicos do INPE..." }
            ];
          });
        } else if (progress === 45) {
          setAgentStatus({ climatico: "idle", logistico: "running", fiscal: "idle", analista: "idle" });
          setAgentLogs(prev => {
            if (prev.some(l => l.text.includes("Coleta agro concluída"))) return prev;
            return [
              ...prev,
              { id: Date.now() + 2, time: currentTime, agent: "Agente Climático", text: "Coleta agro concluída: Risco de estiagem severa mapeado para o Sul." },
              { id: Date.now() + 3, time: currentTime, agent: "Agente Logístico", text: "Verificando tabelas ANTT de frete rodoviário e repasses de diesel..." }
            ];
          });
        } else if (progress === 70) {
          setAgentStatus({ climatico: "idle", logistico: "idle", fiscal: "running", analista: "idle" });
          setAgentLogs(prev => {
            if (prev.some(l => l.text.includes("Logística mapeada"))) return prev;
            return [
              ...prev,
              { id: Date.now() + 4, time: currentTime, agent: "Agente Logístico", text: "Logística mapeada: Frete médio rodoviário com tendência de alta de 4%." },
              { id: Date.now() + 5, time: currentTime, agent: "Agente Fiscal", text: "Buscando nos Diários Oficiais estaduais por decretos de ICMS e Substituição Tributária..." }
            ];
          });
        } else if (progress === 90) {
          setAgentStatus({ climatico: "idle", logistico: "idle", fiscal: "idle", analista: "running" });
          setAgentLogs(prev => {
            if (prev.some(l => l.text.includes("Varredura fiscal concluída"))) return prev;
            return [
              ...prev,
              { id: Date.now() + 6, time: currentTime, agent: "Agente Fiscal", text: "Varredura fiscal concluída: Decretos de ST mapeados sob derivados lácteos." },
              { id: Date.now() + 7, time: currentTime, agent: "Agente Analista", text: "Cruzando variáveis fiscais, logísticas e climáticas na base vetorial RAG..." }
            ];
          });
        }
      } else {
        // API has returned! Finish progress bar and update state.
        clearInterval(interval);
        setAgentStatus({ climatico: "idle", logistico: "idle", fiscal: "idle", analista: "idle" } as any);
        setIsScanning(false);
        setScanProgress(100);

        if (!apiResult) {
          setAgentLogs(prev => [
            ...prev,
            { id: Date.now() + 10, time: currentTime, agent: "Agente Analista", text: `⚠️ Falha na Varredura: ${fetchError?.message || "Erro desconhecido."}` }
          ]);
          showToast("Erro na varredura preditiva!");
        } else {
          const meta = apiResult.metadata;
          if (meta) {
            setAgentLogs(prev => {
              const list = [...prev];
              if (meta.newsHeadline) {
                list.push({
                  id: Date.now() + 20,
                  time: currentTime,
                  agent: "Agente Climático",
                  text: `Sinal Real no Feed: "${meta.newsHeadline.slice(0, 80)}..."`
                });
              }
              if (meta.usd || meta.selic) {
                list.push({
                  id: Date.now() + 21,
                  time: currentTime,
                  agent: "Agente Logístico",
                  text: `Dados Reais Extraídos — Câmbio Dólar: ${meta.usd || "N/A"} | Selic: ${meta.selic || "N/A"}`
                });
              }
              return list;
            });
          }

          setInsights(prev => [apiResult as InsightItem, ...prev]);
          setSelectedInsight(apiResult);
          
          setAgentLogs(prev => [
            ...prev,
            { id: Date.now() + 8, time: currentTime, agent: "Agente Analista", text: `PREVISÃO ENVIADA AO DASHBOARD: ${apiResult!.title.slice(0, 32)}... (${apiResult!.financialImpact})` }
          ]);
          showToast("Varredura real concluída via DeepSeek!");
        }
      }
    }, 180);
  };

  const filteredInsights = insights.filter((ins) => {
    const matchesSearch =
      ins.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ins.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ins.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSeverity = activeSeverity === "ALL" || ins.severity === activeSeverity;
    const matchesType = activeType === "ALL" || ins.type === activeType;

    const matchesMaterial = selectedMaterial === "ALL" || ins.tags.some(t => {
      const tag = t.toLowerCase();
      const insumo = getInsumoById(selectedMaterial);
      if (insumo) {
        return tag === insumo.id || insumo.keywords.some(k => tag.includes(k)) || tag === insumo.category;
      }
      return tag.includes(selectedMaterial.replace(/_/g, ""));
    });

    return matchesSearch && matchesSeverity && matchesType && matchesMaterial;
  });

  // Calculate SVG Graph metrics (Projections for Selected Material)
  const activeData = liveChartData || MATERIAL_CHART_DATA[chartPeriod][selectedMaterial] || MATERIAL_CHART_DATA[chartPeriod]["ALL"];
  const prices = activeData.map((d: any) => d.price);
  const minPrice = Math.min(...prices) * 0.98;
  const maxPrice = Math.max(...prices) * 1.02;
  const priceRange = maxPrice - minPrice || 1;

  const paddingLeft = 55;
  const paddingRight = 20;
  const chartWidth = 500 - paddingLeft - paddingRight;
  const chartHeight = 190;
  const paddingTop = 20;

  // Smooth curve helper (Catmull-Rom → cubic bezier)
  function catmullRomToBezier(pts: { x: number; y: number }[]): string {
    if (pts.length < 2) return "";
    let path = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      path += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x},${p2.y}`;
    }
    return path;
  }

  // Compute price line points as {x, y} for smooth interpolation
  const pricePoints = activeData.map((d: any, i: number) => {
    const x = paddingLeft + (i / (activeData.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((d.price - minPrice) / priceRange) * chartHeight;
    return { x, y };
  });
  const smoothPath = pricePoints.length > 1 ? catmullRomToBezier(pricePoints) : "";
  const fillPath = pricePoints.length > 1
    ? `${smoothPath} L ${pricePoints[pricePoints.length - 1].x},${paddingTop + chartHeight} L ${pricePoints[0].x},${paddingTop + chartHeight} Z`
    : "";
  // Calculate change % from previous point for tooltip
  const getChangePct = (idx: number): number | null => {
    if (idx <= 0) return null;
    const prev = activeData[idx - 1].price;
    const curr = activeData[idx].price;
    return ((curr - prev) / prev) * 100;
  };

  // Determine overall trend theme (risk = up = red, opportunity = down = green, stable = neutral)
  const firstPrice = activeData[0]?.price || 0;
  const lastPrice = activeData[activeData.length - 1]?.price || 0;
  const overallDiffPct = firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
  
  let trendTheme = "stable";
  if (overallDiffPct > 2.5) trendTheme = "risk";
  else if (overallDiffPct < -2.5) trendTheme = "opportunity";

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8 relative">
      {/* ── Toast Alert ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 glass px-5 py-3 rounded-xl border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.2)] text-xs text-white font-medium flex items-center gap-3"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Background Neon Blur Spheres ── */}
      <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none glow-blur-sphere" />
      <div className="absolute bottom-[200px] left-[-200px] w-[500px] h-[500px] bg-violet-500/8 rounded-full blur-3xl pointer-events-none glow-blur-sphere" />

      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-violet-400 bg-clip-text text-transparent font-display">
            Terminal de Inteligência
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Rastreamento de preços de insumos e alertas inteligentes para proteger a sua margem de lucro
          </p>
        </div>
        <div className="text-xs text-zinc-500 font-mono glass px-3 py-1.5 rounded-lg flex items-center gap-2 select-none border-white/[0.04]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Previsões Ativas (IA)
        </div>
      </motion.div>

      {/* ── Stats Grid ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {liveStats.map((stat) => (
          <div
            key={stat.label}
            className="glass rounded-xl p-5 space-y-3 group hover:bg-white/[0.04] transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                {stat.label}
              </span>
              <span className="text-base text-zinc-400 group-hover:text-white transition-colors">
                {statsLoading ? (
                  <span className="w-3 h-3 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin inline-block" />
                ) : stat.icon}
              </span>
            </div>
            <div className="flex items-end gap-2">
              <span className={`text-2xl font-extrabold tracking-tight font-mono ${
                stat.label === "Risco de Custo Alto" ? "text-red-400" :
                stat.label === "Economia Projetada" ? "text-emerald-400" : "text-white"
              }`}>
                {stat.value}
              </span>
              <span className={`text-xs font-mono mb-1 font-bold ${stat.positive ? "text-emerald-400" : "text-red-400"}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── Two-Column Main Content Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 z-10 relative">
        
        {/* COLUNA PRINCIPAL (Esquerda - 65% aprox) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* ── Trend Chart Box (Projections) ── */}
          <motion.div variants={itemVariants} className="glass rounded-xl p-6 border-white/[0.04] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">Projeção e Alertas de Preços</h3>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">
                  {selectedMaterial !== "ALL"
                    ? `${getInsumoById(selectedMaterial)?.emoji ?? ""} ${getInsumoById(selectedMaterial)?.name ?? ""} — Tendências e melhor momento para comprar`
                    : "Tendências futuras e melhor momento para comprar"
                  }
                </p>
              </div>
              <div className="flex bg-white/[0.02] border border-white/[0.04] rounded-lg p-0.5 text-[10px] self-start sm:self-auto">
                <button
                  onClick={() => setChartPeriod("7D")}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    chartPeriod === "7D" ? "bg-white/[0.06] text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Próximas Semanas
                </button>
                <button
                  onClick={() => setChartPeriod("30D")}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    chartPeriod === "30D" ? "bg-white/[0.06] text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Próximos Meses
                </button>
              </div>
            </div>

            {/* Material search + dropdown */}
            <div className="relative border-b border-white/[0.03] pb-3 select-none">
              <div className="flex items-center gap-2 bg-white/[0.015] border border-white/[0.04] focus-within:border-cyan-500/30 rounded-xl px-3.5 py-2 transition-colors duration-300">
                <span className="text-zinc-500 text-sm select-none">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar insumo por nome ou categoria..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm text-white placeholder:text-zinc-600"
                />
                {selectedMaterial !== "ALL" && (
                  <button
                    onClick={() => { setSelectedMaterial("ALL"); setProductSearch(""); }}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
              {productSearch && (
                <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto bg-zinc-900 border border-white/[0.06] rounded-xl shadow-2xl">
                  <button
                    onClick={() => { setSelectedMaterial("ALL"); setProductSearch(""); }}
                    className={`w-full text-left px-3.5 py-2 text-xs transition-colors ${
                      selectedMaterial === "ALL" ? "bg-cyan-500/10 text-cyan-300" : "text-zinc-400 hover:text-white hover:bg-white/[0.02]"
                    }`}
                  >
                    🌍 Todos os Produtos
                  </button>
                  {ALL_INSUMOS
                    .filter(i =>
                      i.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                      i.keywords.some(k => k.includes(productSearch.toLowerCase())) ||
                      i.category.includes(productSearch.toLowerCase())
                    )
                    .slice(0, 30)
                    .map(i => (
                      <button
                        key={i.id}
                        onClick={() => { setSelectedMaterial(i.id); setProductSearch(""); }}
                        className={`w-full text-left px-3.5 py-2 text-xs transition-colors ${
                          selectedMaterial === i.id ? "bg-cyan-500/10 text-cyan-300" : "text-zinc-400 hover:text-white hover:bg-white/[0.02]"
                        }`}
                      >
                        {i.emoji} {i.name}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* SVG Chart Container */}
            <div className="relative w-full h-[240px] select-none">
              <svg className="w-full h-full" viewBox="0 0 500 240" preserveAspectRatio="none">
                <defs>
                  {/* Stable (Neutral) Gradients */}
                  <linearGradient id="chart-fill-stable" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                    <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="line-stroke-stable" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="50%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>

                  {/* Risk (Up/Red) Gradients */}
                  <linearGradient id="chart-fill-risk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                    <stop offset="50%" stopColor="#f97316" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="line-stroke-risk" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="50%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>

                  {/* Opportunity (Down/Green) Gradients */}
                  <linearGradient id="chart-fill-opp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="50%" stopColor="#059669" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="line-stroke-opp" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>

                  <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="line-glow-intense" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Background Opportunity / Risk Highlight Zones */}
                {activeData.map((d: any, i: number) => {
                  const x = paddingLeft + (i / (activeData.length - 1)) * chartWidth;
                  const zoneWidth = chartWidth / (activeData.length - 1);
                  if (d.status === "high") {
                    return (
                      <rect key={`zone-${i}`} x={x - zoneWidth / 2} y={paddingTop} width={zoneWidth} height={chartHeight} fill="url(#chart-fill-risk)" opacity="0.15" />
                    );
                  }
                  if (d.status === "buy") {
                    return (
                      <rect key={`zone-${i}`} x={x - zoneWidth / 2} y={paddingTop} width={zoneWidth} height={chartHeight} fill="url(#chart-fill-opp)" opacity="0.15" />
                    );
                  }
                  return null;
                })}

                {/* Horizontal Gridlines & Price Labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((val) => {
                  const y = paddingTop + val * chartHeight;
                  const priceVal = maxPrice - val * priceRange;
                  return (
                    <g key={val}>
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2={paddingLeft + chartWidth}
                        y2={y}
                        stroke="rgba(255, 255, 255, 0.05)"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={paddingLeft - 8}
                        y={y + 3}
                        textAnchor="end"
                        fill="#a1a1aa"
                        className="text-[9px] font-sans tracking-wide font-medium"
                      >
                        R$ {priceVal.toFixed(2)}
                      </text>
                    </g>
                  );
                })}

                {/* Price Gradient Area — animated opacity */}
                <motion.path
                  d={fillPath}
                  fill={`url(#chart-fill-${trendTheme})`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />

                {/* Price Line Glow (behind) */}
                <motion.path
                  d={smoothPath}
                  stroke={`url(#line-stroke-${trendTheme})`}
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  filter="url(#line-glow)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.35 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                  style={{ pointerEvents: "none" }}
                />

                {/* Price Line — animated draw */}
                <motion.path
                  key={`line-${selectedMaterial}-${chartPeriod}`}
                  d={smoothPath}
                  stroke={`url(#line-stroke-${trendTheme})`}
                  strokeWidth="3.5"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                />

                {/* Status Dot Markers with Staggered Entrance */}
                {activeData.map((d: any, i: number) => {
                  const x = paddingLeft + (i / (activeData.length - 1)) * chartWidth;
                  const y = paddingTop + chartHeight - ((d.price - minPrice) / priceRange) * chartHeight;
                  
                  let dotColor = "fill-cyan-400 stroke-cyan-500/20";
                  if (d.status === "buy") dotColor = "fill-emerald-400 stroke-emerald-500/30";
                  if (d.status === "high") dotColor = "fill-red-400 stroke-red-500/30";

                  return (
                    <motion.circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="4"
                      className={`${dotColor} stroke-[3px]`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.8 + i * 0.08, duration: 0.35, ease: "backOut" }}
                    />
                  );
                })}

                {/* Vertical Guideline & Hover Point */}
                {hoveredIndex !== null && (
                  <>
                    <motion.line
                      x1={paddingLeft + (hoveredIndex / (activeData.length - 1)) * chartWidth}
                      y1={paddingTop}
                      x2={paddingLeft + (hoveredIndex / (activeData.length - 1)) * chartWidth}
                      y2={paddingTop + chartHeight}
                      stroke="rgba(255, 255, 255, 0.12)"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    />
                    <motion.circle
                      cx={paddingLeft + (hoveredIndex / (activeData.length - 1)) * chartWidth}
                      cy={paddingTop + chartHeight - ((activeData[hoveredIndex].price - minPrice) / priceRange) * chartHeight}
                      r="7"
                      fill="#ffffff"
                      stroke={trendTheme === "risk" ? "#ef4444" : trendTheme === "opportunity" ? "#10b981" : "#8b5cf6"}
                      strokeWidth="2.5"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    />
                    {/* Hover dot pulse ring */}
                    <motion.circle
                      cx={paddingLeft + (hoveredIndex / (activeData.length - 1)) * chartWidth}
                      cy={paddingTop + chartHeight - ((activeData[hoveredIndex].price - minPrice) / priceRange) * chartHeight}
                      r="12"
                      fill="none"
                      stroke={trendTheme === "risk" ? "#ef4444" : trendTheme === "opportunity" ? "#10b981" : "#8b5cf6"}
                      strokeWidth="0.8"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="pointer-events-none"
                    />
                  </>
                )}

                {/* Invisible Hover Zones */}
                {activeData.map((d: any, i: number) => {
                  const x = paddingLeft + (i / (activeData.length - 1)) * chartWidth;
                  return (
                    <rect
                      key={i}
                      x={x - 20}
                      y={paddingTop}
                      width={40}
                      height={chartHeight}
                      fill="transparent"
                      className="cursor-pointer outline-none"
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  );
                })}
              </svg>

              {/* X Axis Labels */}
              <div className="absolute bottom-[-16px] left-[55px] right-[20px] flex justify-between text-[9px] text-zinc-400 font-sans tracking-wide font-medium">
                {activeData.map((d: any, i: number) => (
                  <span key={i} className="text-center w-10">{d.day}</span>
                ))}
              </div>

              {/* Absolute React Tooltip with AnimatePresence */}
              <AnimatePresence>
                {hoveredIndex !== null && (
                  <motion.div
                    key={hoveredIndex}
                    initial={{ opacity: 0, y: 6, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.9 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    style={{
                      left: `calc(${paddingLeft}px + ${(hoveredIndex / (activeData.length - 1)) * 100}% - ${(hoveredIndex / (activeData.length - 1)) * (paddingLeft + paddingRight)}px)`,
                      top: "-42px"
                    }}
                    className="absolute z-20 pointer-events-none glass px-3 py-2.5 rounded-lg text-[9px] -translate-x-1/2 flex flex-col gap-1.5 border border-cyan-500/15 shadow-xl text-left select-none min-w-[130px]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-white text-[10px]">{activeData[hoveredIndex].day}</span>
                      {(() => {
                        const pct = getChangePct(hoveredIndex);
                        if (pct === null) return null;
                        const isUp = pct > 0;
                        return (
                          <span className={`text-[8px] font-bold font-mono ${isUp ? "text-red-400" : "text-emerald-400"}`}>
                            {isUp ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
                          </span>
                        );
                      })()}
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      Preço: <strong className="text-white font-mono text-[10px]">R$ {activeData[hoveredIndex].price.toFixed(2)}</strong>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {activeData[hoveredIndex].status === "buy" ? (
                        <span className="text-[8px] bg-emerald-500/20 text-emerald-300 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">💡 Compra Recomendada</span>
                      ) : activeData[hoveredIndex].status === "high" ? (
                        <span className="text-[8px] bg-red-500/20 text-red-300 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">🚨 Período de Alta</span>
                      ) : (
                        <span className="text-[8px] bg-zinc-500/20 text-zinc-300 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">✓ Preço Estável</span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Chart Legend */}
            <div className="flex items-center justify-center gap-5 pt-3 text-[10px] text-zinc-500 font-medium select-none border-t border-white/[0.03]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>💡 Melhor Período para Comprar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span>🚨 Alerta de Alta</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Preço Normal / Estável</span>
              </div>
            </div>
          </motion.div>



          {/* ── Filters & Search Bar ── */}
          <motion.div variants={itemVariants} className="glass rounded-xl p-4 flex flex-col lg:flex-row gap-4 border-white/[0.04] z-10 relative">
            <div className="flex-1 flex items-center gap-3 bg-white/[0.015] border border-white/[0.04] focus-within:border-cyan-500/30 rounded-xl px-3.5 py-2.5 transition-colors duration-300">
              <span className="text-zinc-500 text-sm select-none">🔍</span>
              <input
                type="text"
                placeholder="Buscar por palavra-chave ou tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-white placeholder:text-zinc-600"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-zinc-500 hover:text-white transition-colors"
                >
                  Limpar
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Severity filter dropdown */}
              <div className="relative">
                <select
                  value={activeSeverity}
                  onChange={(e) => setActiveSeverity(e.target.value)}
                  className="appearance-none bg-white/[0.015] border border-white/[0.04] text-zinc-400 hover:text-white rounded-xl px-4 py-2.5 pr-8 text-xs font-semibold outline-none cursor-pointer transition-colors duration-300"
                >
                  {SEVERITIES.map((s) => (
                    <option key={s.value} value={s.value} className="bg-zinc-950 text-zinc-400">
                      {s.label}
                    </option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-zinc-500">▼</span>
              </div>

              {/* Type filter dropdown */}
              <div className="relative">
                <select
                  value={activeType}
                  onChange={(e) => setActiveType(e.target.value)}
                  className="appearance-none bg-white/[0.015] border border-white/[0.04] text-zinc-400 hover:text-white rounded-xl px-4 py-2.5 pr-8 text-xs font-semibold outline-none cursor-pointer transition-colors duration-300"
                >
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value} className="bg-zinc-950 text-zinc-400">
                      {t.label}
                    </option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-zinc-500">▼</span>
              </div>
            </div>
          </motion.div>

          {/* ── Insight Feed ── */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white tracking-wide">Feed de Previsões</h2>
              <span className="text-xs text-zinc-500 font-mono glass px-2 py-1 rounded-md border-white/[0.04]">
                {insightsLoading ? "Carregando..." : `${filteredInsights.length} de ${insights.length} análises`}
              </span>
            </div>
            
            {insightsLoading ? (
              <div className="glass rounded-xl p-12 flex flex-col items-center gap-4 border-white/[0.04]">
                <span className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                <p className="text-zinc-500 text-sm">Buscando insights do banco de dados...</p>
              </div>
            ) : filteredInsights.length > 0 ? (
              <div className="grid gap-4">
                {filteredInsights.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    {...insight}
                    onClick={() => {
                      setSelectedInsight(insight);
                      if (!insight.isRead) markAsRead(insight.id);
                    }}
                    onDelete={deleteInsight}
                  />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-xl p-12 text-center border-white/[0.04] space-y-4"
              >
                <p className="text-4xl">🧠</p>
                <p className="text-white font-bold text-sm">Nenhum insight no banco ainda</p>
                <p className="text-zinc-500 text-xs leading-relaxed">
                  O Terminal ainda não processou dados reais. Execute uma varredura preditiva
                  para que o Agente Analista colete notícias, processe os dados e gere os primeiros cards de inteligência.
                </p>
                <button
                  onClick={startManualScan}
                  className="mt-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold text-xs rounded-xl shadow-[0_4px_20px_rgba(6,182,212,0.15)] hover:opacity-90 transition-all"
                >
                  ⚡ Executar Primeira Varredura Agora
                </button>
              </motion.div>
            )}
          </motion.div>

        </div>

        {/* COLUNA LATERAL (Direita - 35% aprox) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* ── AI Agent Operations Center ── */}
          <motion.div variants={itemVariants} className="glass rounded-xl p-6 border-white/[0.04] space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">Centro de Operações de IA</h3>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Status e controle preditivo</p>
              </div>
              <span className="text-xs">🤖</span>
            </div>

            {/* Target Insumo Selector */}
            <div className="space-y-1.5">
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Alvo da Varredura</span>
              <div className="relative">
                <select
                  value={scanInsumoId}
                  onChange={(e) => setScanInsumoId(e.target.value)}
                  className="appearance-none w-full bg-white/[0.02] border border-white/[0.04] text-zinc-300 hover:text-white rounded-xl px-3 py-2 pr-8 text-xs font-semibold outline-none cursor-pointer transition-colors duration-300"
                >
                  <option value="ALL" className="bg-zinc-950 text-zinc-400">🌍 Todos os Insumos</option>
                  {ALL_INSUMOS.map(i => (
                    <option key={i.id} value={i.id} className="bg-zinc-950 text-zinc-400">
                      {i.emoji} {i.name}
                    </option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-zinc-500">▼</span>
              </div>
            </div>

            {/* Circular gauges status list */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: "Agente Climático", desc: "Varredura CONAB/CEPEA", status: agentStatus.climatico },
                { name: "Agente Logístico", desc: "Diesel & Tarifas", status: agentStatus.logistico },
                { name: "Agente Fiscal", desc: "ICMS & Subs. Tributária", status: agentStatus.fiscal },
                { name: "Agente Analista", desc: "Consolidação RAG", status: agentStatus.analista },
              ].map((agent) => (
                <div key={agent.name} className="bg-white/[0.01] border border-white/[0.03] p-3 rounded-xl flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-300 font-bold">{agent.name}</span>
                    <span className={`w-2 h-2 rounded-full relative flex ${
                      agent.status === "running" ? "bg-emerald-400" : "bg-zinc-600"
                    }`}>
                      {agent.status === "running" && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      )}
                    </span>
                  </div>
                  <span className="text-[9px] text-zinc-500">{agent.desc}</span>
                  <span className="text-[9px] font-mono uppercase tracking-wider font-semibold text-zinc-400">
                    {agent.status === "running" ? "Processando" : "Aguardo"}
                  </span>
                </div>
              ))}
            </div>

            {/* Simulated Live Terminal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                <span>agent_predictive_engine.log</span>
                <span className="text-[7px] bg-white/[0.04] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">LIVE</span>
              </div>
              <div className="bg-black/35 border border-white/[0.04] p-4 rounded-xl font-mono text-[9px] text-zinc-400 h-[170px] overflow-y-auto space-y-2.5 flex flex-col scrollbar-thin">
                {[...agentLogs].reverse().map((log) => (
                  <div key={log.id} className="leading-relaxed">
                    <span className="text-zinc-600">[{log.time}]</span>{" "}
                    <span className={`font-bold ${
                      log.agent === "Agente Climático" ? "text-cyan-400" :
                      log.agent === "Agente Logístico" ? "text-amber-400" :
                      log.agent === "Agente Fiscal" ? "text-violet-400" :
                      log.agent === "Agente Analista" ? "text-emerald-400" : "text-zinc-500"
                    }`}>
                      {log.agent}
                    </span>{" "}
                    <span className="text-zinc-300">{log.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Manual Scan Action */}
            <div className="space-y-3">
              <button
                onClick={startManualScan}
                disabled={isScanning}
                className={`w-full py-3 rounded-xl font-bold text-xs select-none transition-all duration-300 ${
                  isScanning
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 cursor-not-allowed"
                    : "bg-gradient-to-r from-cyan-500 to-violet-500 text-white hover:opacity-90 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                }`}
              >
                {isScanning ? "Projetando Cenários..." : "Disparar Varredura Preditiva"}
              </button>

              {/* Progress bar */}
              {isScanning && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                    <span>Cálculo Monte Carlo</span>
                    <span>{scanProgress}%</span>
                  </div>
                  <div className="w-full bg-white/[0.04] h-1.5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${scanProgress}%` }}
                      transition={{ duration: 0.15 }}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>



        </div>

      </div>

      {/* ── Dynamic Slide-over Details Drawer ── */}
      <AnimatePresence>
        {selectedInsight && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedInsight(null)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            {/* Drawer Body */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 260 }}
              className="fixed top-0 right-0 h-screen w-full sm:w-[500px] md:w-[600px] z-50 glass-strong border-l border-white/[0.08] shadow-[0_0_50px_rgba(0,0,0,0.85)] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/[0.06] flex items-center justify-between select-none">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  <div>
                    <h2 className="text-base font-bold text-white">Análise Preditiva</h2>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">
                      ID: {selectedInsight.id}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedInsight(null)}
                  className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-colors duration-200 outline-none"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scrollbar-thin">
                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/[0.03] border border-white/[0.06] text-zinc-300">
                    {selectedInsight.type === "RISK_ALERT" ? "Previsão de Risco" : "Oportunidade de Economia"}
                  </span>
                  
                  {/* Severity Pill */}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    selectedInsight.severity === "CRITICAL" ? "bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]" :
                    selectedInsight.severity === "HIGH" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                    selectedInsight.severity === "MEDIUM" ? "bg-violet-500/10 text-violet-400 border border-violet-500/20" :
                    "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  } border`}>
                    {selectedInsight.severity}
                  </span>
                  
                  <span className="text-[10px] font-mono text-zinc-500 ml-auto font-medium">
                    Assertividade: {Math.round(selectedInsight.confidence * 100)}%
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-xl font-bold text-white leading-snug">
                  {selectedInsight.title}
                </h1>

                {/* Predictive Metrics Box */}
                {(selectedInsight.probability !== undefined || selectedInsight.timeframe || selectedInsight.financialImpact) && (
                  <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] select-none text-xs font-semibold">
                    {selectedInsight.probability !== undefined && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Chance de Ocorrência</span>
                        <span className="font-extrabold text-cyan-400 font-mono text-sm">{Math.round(selectedInsight.probability * 100)}%</span>
                      </div>
                    )}
                    {selectedInsight.timeframe && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Prazo para Agir</span>
                        <span className="font-extrabold text-violet-400 font-mono text-sm">{selectedInsight.timeframe}</span>
                      </div>
                    )}
                    {selectedInsight.financialImpact && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Economia / Custo</span>
                        <span className={`font-extrabold font-mono text-sm ${selectedInsight.financialImpact.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}>
                          {selectedInsight.financialImpact}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Summary */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Resumo Preditivo</h3>
                  <p className="text-sm text-zinc-300 leading-relaxed bg-white/[0.01] p-4 rounded-xl border border-white/[0.03]">
                    {selectedInsight.summary}
                  </p>
                </div>

                {/* Recommendation */}
                {selectedInsight.recommendation && (
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">Recomendação Estratégica</h3>
                    <div className="p-4 rounded-xl bg-emerald-500/[0.01] border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.01)]">
                      <p className="text-sm text-emerald-300/90 leading-relaxed font-medium">
                        {selectedInsight.recommendation}
                      </p>
                    </div>
                  </div>
                )}

                {/* In-depth Analysis */}
                {selectedInsight.analysis && (
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Análise de Impacto</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      {selectedInsight.analysis}
                    </p>
                  </div>
                )}

                {/* Sources list */}
                {selectedInsight.sources && (
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Indicadores de Coleta</h3>
                    <div className="grid gap-2">
                      {selectedInsight.sources.map((src, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.015] border border-white/[0.03]">
                          <span className="text-xs select-none">📡</span>
                          <span className="text-xs text-zinc-400 font-medium">{src}</span>
                          <span className="text-[9px] text-zinc-600 font-mono ml-auto">Validado</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 📊 Real-Time Support Data (Metadata) */}
                {selectedInsight.metadata && (
                  <div className="space-y-3 pt-2 border-t border-white/[0.04]">
                    <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      Dados Reais do Motor (Suporte à Decisão)
                    </h3>
                    
                    <div className="bg-cyan-500/[0.02] border border-cyan-500/10 rounded-2xl p-4.5 space-y-4">
                      {/* Macro Indicators Grid */}
                      <div className="grid grid-cols-2 gap-3 text-left">
                        {selectedInsight.metadata.usd && (
                          <div className="bg-black/20 p-2.5 rounded-xl border border-white/[0.03] space-y-0.5">
                            <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Dólar (USD)</span>
                            <div className="text-[11px] font-extrabold text-white font-mono leading-tight">{selectedInsight.metadata.usd}</div>
                          </div>
                        )}
                        {selectedInsight.metadata.selic && (
                          <div className="bg-black/20 p-2.5 rounded-xl border border-white/[0.03] space-y-0.5">
                            <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Taxa Selic</span>
                            <div className="text-[11px] font-extrabold text-white font-mono leading-tight">{selectedInsight.metadata.selic}</div>
                          </div>
                        )}
                        {selectedInsight.metadata.ipca && (
                          <div className="bg-black/20 p-2.5 rounded-xl border border-white/[0.03] space-y-0.5">
                            <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Inflação IPCA</span>
                            <div className="text-[11px] font-extrabold text-white font-mono leading-tight">{selectedInsight.metadata.ipca}</div>
                          </div>
                        )}
                        {selectedInsight.metadata.igpm && (
                          <div className="bg-black/20 p-2.5 rounded-xl border border-white/[0.03] space-y-0.5">
                            <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider font-mono">IGP-M (Aluguel/Frete)</span>
                            <div className="text-[11px] font-extrabold text-white font-mono leading-tight">{selectedInsight.metadata.igpm}</div>
                          </div>
                        )}
                      </div>

                      {/* Captured Real News Alert Card */}
                      {selectedInsight.metadata.newsHeadline && (
                        <div className="bg-black/40 border border-white/[0.04] p-3 rounded-xl space-y-2 text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-xs select-none">📰</span>
                            <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest font-mono">Notícia Capturada Hoje</span>
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                            {selectedInsight.metadata.newsHeadline}
                          </p>
                          {selectedInsight.metadata.newsUrl && (
                            <a
                              href={selectedInsight.metadata.newsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors mt-1 select-none"
                            >
                              Ver Notícia Original no Feed ↗
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Real-time WhatsApp Dispatch Widget */}
                {selectedInsight && (
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
                        value={phoneNum}
                        onChange={e => setPhoneNum(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-white/[0.08] hover:border-white/[0.12] focus:border-cyan-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none transition-colors"
                      />
                      <button
                        onClick={handleRealWhatsAppDispatch}
                        disabled={sendingWa || !phoneNum}
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
                )}
              </div>

              {/* Actions Footer */}
              <div className="p-6 border-t border-white/[0.06] bg-zinc-950/60 flex items-center justify-between gap-3 select-none">
                <button
                  onClick={() => archiveInsight(selectedInsight.id)}
                  className="px-4 py-2.5 rounded-xl border border-white/[0.05] hover:bg-white/[0.04] text-xs font-semibold text-zinc-400 hover:text-white transition-colors duration-200"
                >
                  Arquivar
                </button>
                <div className="flex gap-2">
                  <Link
                    href="/dashboard/chat"
                    className="px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-xs font-bold text-white hover:opacity-90 transition-opacity duration-200"
                  >
                    Abrir Simulação RAG
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── WhatsApp Phone Simulator Overlay ── */}
      <AnimatePresence>
        {isSimulatingPhone && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSimulatingPhone(false)}
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md"
            />

            {/* Smartphone Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="fixed inset-y-0 right-0 sm:right-10 md:right-24 my-auto h-[600px] w-full max-w-[340px] z-50 flex flex-col items-center justify-center"
            >
              {/* Outer Shell of Phone */}
              <div className="relative w-[320px] h-[580px] bg-zinc-950 rounded-[48px] p-3 border-4 border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden ring-1 ring-white/10">
                {/* Phone Notch/Camera */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-5 bg-black rounded-full z-30 flex items-center justify-between px-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-800" />
                  <div className="w-12 h-1 bg-zinc-900 rounded-full" />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-900" />
                </div>

                {/* Inner Screen */}
                <div className="w-full h-full rounded-[38px] bg-[#0b141a] overflow-hidden flex flex-col relative border border-zinc-800">
                  {/* Status Bar */}
                  <div className="w-full h-11 bg-[#0b141a] pt-6 px-6 flex justify-between items-center text-[10px] text-white font-semibold select-none z-20">
                    <span>19:30</span>
                    <div className="flex items-center gap-1.5">
                      <span>📶</span>
                      <span>🔋</span>
                    </div>
                  </div>

                  {/* WhatsApp App Bar */}
                  <div className="bg-[#075e54] px-4 py-3 flex items-center gap-3 text-white select-none z-20 border-b border-[#054c44] shadow-md">
                    <button
                      onClick={() => setIsSimulatingPhone(false)}
                      className="text-sm font-bold text-teal-200 hover:text-white"
                    >
                      ←
                    </button>
                    {/* Profile Icon */}
                    <div className="w-9 h-9 rounded-full bg-teal-800 flex items-center justify-center text-sm font-extrabold shadow-inner border border-teal-600/40 relative">
                      🤖
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#075e54]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold leading-tight text-white">Atlas Intelligence</h4>
                      <span className="text-[8px] text-teal-200 font-semibold tracking-wider uppercase">Online (Copiloto)</span>
                    </div>
                  </div>

                  {/* Chat Wallpaper & Message Box */}
                  <div 
                    className="flex-1 p-4 overflow-y-auto space-y-4 relative flex flex-col justify-end pb-8 bg-[#0b141a]"
                    style={{
                      backgroundImage: "radial-gradient(circle at 10px 10px, rgba(255,255,255,0.01) 1px, transparent 0)",
                      backgroundSize: "20px 20px"
                    }}
                  >
                    {/* Decorative date separator */}
                    <div className="mx-auto bg-[#182229] border border-white/[0.04] px-3 py-1 rounded-lg text-[8px] text-zinc-400 font-bold uppercase select-none tracking-widest shadow-sm self-center">
                      Hoje
                    </div>

                    {/* WhatsApp Message Bubble */}
                    <motion.div
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.15, type: "spring" }}
                      className="max-w-[85%] bg-[#002d24] border border-emerald-900/40 text-emerald-50 p-3 rounded-2xl rounded-tl-none self-start shadow-[0_2px_8px_rgba(0,0,0,0.3)] relative text-left"
                    >
                      <p className="text-[10.5px] leading-relaxed font-normal whitespace-pre-wrap">
                        {whatsappNotificationText.split("**").map((part, index) => {
                          if (index % 2 === 1) {
                            return <strong key={index} className="text-white font-bold">{part}</strong>;
                          }
                          return part;
                        })}
                      </p>
                      
                      {/* Read status / Time */}
                      <div className="flex items-center justify-end gap-1 mt-1 text-[8px] text-emerald-300 font-medium">
                        <span>19:30</span>
                        <span className="text-[10px] text-sky-400 leading-none">✓✓</span>
                      </div>
                    </motion.div>
                  </div>

                  {/* Interactive Close Panel */}
                  <div className="p-3 bg-[#101d25] border-t border-white/[0.05] flex items-center justify-between select-none">
                    <span className="text-[9px] text-zinc-500 font-medium font-mono">Simulando em: {phoneNum}</span>
                    <button
                      onClick={() => setIsSimulatingPhone(false)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors shadow-lg"
                    >
                      Fechar Canal
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
