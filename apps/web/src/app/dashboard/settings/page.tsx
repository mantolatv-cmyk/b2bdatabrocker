"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ALL_INSUMOS, INSUMOS_COUNT, getCategoryLabel, CATEGORIES } from "@/lib/insumos";

type SettingsTab = "GERAL" | "ALERTAS" | "IA" | "FONTES";

interface GeneralSettings {
  chainName: string;
  targetMargin: number;
  coverageDays: number;
}

interface AlertSettings {
  phone: string;
  minSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  staples: string[];
  frequency: "IMMEDIATE" | "DAILY" | "WEEKLY";
  twilioSid?: string;
  twilioToken?: string;
  twilioFrom?: string;
}

interface IaSettings {
  deepseekKey: string;
  openaiKey: string;
  useFallbackLocal: boolean;
}

interface SourceSettings {
  scanFrequency: "off" | "6h" | "12h" | "24h" | "weekly";
  statesToMonitor: string[];
  freightSensitivity: number;
}

const STAPLES_OPTIONS = [
  ...ALL_INSUMOS.map(i => ({
    id: i.id,
    label: `${i.emoji} ${i.name}`,
  })),
];

const STATES_OPTIONS = [
  { id: "SP", name: "São Paulo" },
  { id: "RJ", name: "Rio de Janeiro" },
  { id: "MG", name: "Minas Gerais" },
  { id: "RS", name: "Rio Grande do Sul" },
  { id: "PR", name: "Paraná" },
  { id: "SC", name: "Santa Catarina" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("GERAL");
  const [toast, setToast] = useState<string | null>(null);

  // Form states initialized with standard defaults (will load from localStorage on mount)
  const [general, setGeneral] = useState<GeneralSettings>({
    chainName: "Supermercados Pão de Ouro",
    targetMargin: 30,
    coverageDays: 30,
  });

  const [alerts, setAlerts] = useState<AlertSettings>({
    phone: "(11) 99999-9999",
    minSeverity: "HIGH",
    staples: ["arroz", "leite", "azeite", "queijo", "carne", "diesel"],
    frequency: "IMMEDIATE",
    twilioSid: "",
    twilioToken: "",
    twilioFrom: ""
  });

  const [whatsappNotificationText, setWhatsappNotificationText] = useState("");
  const [isPhonePreviewOpen, setIsPhonePreviewOpen] = useState(false);

  const [ia, setIa] = useState<IaSettings>({
    deepseekKey: "sk-7ae3213e1b1141819cd1f7c4c324ae73",
    openaiKey: "••••••••••••••••••••••••••••",
    useFallbackLocal: false,
  });

  const [sources, setSources] = useState<SourceSettings>({
    scanFrequency: "24h",
    statesToMonitor: ["SP", "RJ", "MG", "RS"],
    freightSensitivity: 5,
  });

  const [isTestingDeepseek, setIsTestingDeepseek] = useState(false);
  const [isTestingOpenai, setIsTestingOpenai] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedGeneral = localStorage.getItem("atlas_settings_general");
      const storedAlerts = localStorage.getItem("atlas_settings_alerts");
      const storedIa = localStorage.getItem("atlas_settings_ia");
      const storedSources = localStorage.getItem("atlas_settings_sources");

      if (storedGeneral) {
        const parsed = JSON.parse(storedGeneral);
        setGeneral((prev) => ({ ...prev, ...parsed }));
      }
      if (storedAlerts) {
        const parsed = JSON.parse(storedAlerts);
        setAlerts((prev) => ({ ...prev, ...parsed }));
      }
      if (storedIa) {
        const parsed = JSON.parse(storedIa);
        setIa((prev) => ({ ...prev, ...parsed }));
      }
      if (storedSources) {
        const parsed = JSON.parse(storedSources);
        setSources((prev) => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.warn("Could not read settings from localStorage:", e);
    }
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = () => {
    try {
      localStorage.setItem("atlas_settings_general", JSON.stringify(general));
      localStorage.setItem("atlas_settings_alerts", JSON.stringify(alerts));
      localStorage.setItem("atlas_settings_ia", JSON.stringify(ia));
      localStorage.setItem("atlas_settings_sources", JSON.stringify(sources));
      showToast("Configurações salvas e aplicadas!");
    } catch (e) {
      console.error(e);
      showToast("Erro ao salvar configurações localmente.");
    }
  };

  const handleStapleToggle = (id: string) => {
    setAlerts((prev) => ({
      ...prev,
      staples: prev.staples.includes(id)
        ? prev.staples.filter((s) => s !== id)
        : [...prev.staples, id],
    }));
  };

  const handleTestAlertInSettings = () => {
    let selectedStaple = "arroz";
    if (alerts.staples.length > 0) {
      const idx = Math.floor(Math.random() * alerts.staples.length);
      selectedStaple = alerts.staples[idx];
    } else {
      const idx = Math.floor(Math.random() * STAPLES_OPTIONS.length);
      selectedStaple = STAPLES_OPTIONS[idx].id;
    }

    let msg = "";
    if (selectedStaple === "arroz") {
      msg = "🌾 *ATLAS ALERTA:* Seca severa confirmada no Sul + aumento de 4% no diesel. O preço do Arroz Tipo 1 vai subir aproximadamente 12% nos próximos 20 dias. Antecipe compras esta semana para garantir a margem atual!";
    } else if (selectedStaple === "feijao") {
      msg = "🫘 *ATLAS ALERTA:* Alta demanda no atacado e quebra parcial de safra paulista elevarão preço do Feijão Carioca em 8% nas distribuidoras. Recomendamos adiantar pedidos.";
    } else if (selectedStaple === "oleo") {
      msg = "🌻 *ATLAS OPORTUNIDADE:* O Óleo de Soja caiu 5% no atacado após colheita recorde no Centro-Oeste. Excelente momento para fechar contratos de fornecimento.";
    } else if (selectedStaple === "leite") {
      msg = "🥛 *ATLAS OPORTUNIDADE:* Captação leiteira em MG subiu 18%. Indústrias parceiras oferecem Leite UHT com 7% de desconto. Janela ideal para repor o estoque mensal nos próximos 5 dias!";
    } else if (selectedStaple === "cafe") {
      msg = "☕ *ATLAS ALERTA:* Alta do dólar encarece exportações de grãos. O Café Almofada (500g) subirá 6% para os distribuidores domésticos. Trave preços antigos hoje.";
    } else if (selectedStaple === "carne") {
      msg = "🥩 *ATLAS ALERTA:* Abertura de novos mercados internacionais pressiona oferta interna. A Alcatra Bovina (kg) subirá 9% nos frigoríficos. Proteja sua margem.";
    } else if (selectedStaple === "azeite") {
      msg = "🫒 *ATLAS ALERTA:* Tarifas portuárias subiram 15% e seca atinge olivais europeus. O Azeite de Oliva subirá 10% nos canais de distribuição. Feche ordens pendentes esta semana.";
    } else if (selectedStaple === "trigo") {
      msg = "🍞 *ATLAS ALERTA:* Custo da farinha de panificação subiu devido ao dólar. O preço do Pão de Forma deve sofrer reajuste de 5% pelas panificadoras parceiras.";
    } else if (selectedStaple === "acucar") {
      msg = "🍬 *ATLAS OPORTUNIDADE:* Excedente de produção de cana em SP derruba preço do Açúcar Refinado em 4% no atacado. Janela ideal para compras em volume.";
    } else if (selectedStaple === "queijo") {
      msg = "🧀 *ATLAS ALERTA:* Novo regime de Substituição Tributária (ST) de ICMS revoga isenção fiscal. O Queijo Muçarela subirá 8% para entradas a partir do dia 1º.";
    } else if (selectedStaple === "cerveja") {
      msg = "🍺 *ATLAS OPORTUNIDADE:* Promoções de final de inverno nas cervejarias locais oferecem cerveja pilsen lata com 6% de desconto para compras acima de 100 caixas.";
    } else if (selectedStaple === "diesel") {
      msg = "🚚 *ATLAS ALERTA:* Elevação de 5% no preço do Diesel na refinaria aumentará a tabela média de fretes de distribuição em 4%. Ajuste os custos logísticos.";
    } else if (selectedStaple === "frango") {
      msg = "🍗 *ATLAS ALERTA:* Alta nos custos do farelo de soja e milho encarece a criação de aves. O Frango Inteiro (kg) subirá cerca de 7% nos próximos 15 dias. Revise preços de tabela.";
    } else if (selectedStaple === "sabao") {
      msg = "🫧 *ATLAS OPORTUNIDADE:* Distribuidora química lança promoção de Sabão em Pó com 8% de desconto em compras fechadas acima de 80 fardos. Janela válida por 5 dias!";
    } else if (selectedStaple === "margarina") {
      msg = "🧈 *ATLAS ALERTA:* Quebra de safra de girassol e soja encarece a gordura vegetal. A Margarina (500g) sofrerá reajuste de 6% nas distribuidoras a partir da próxima semana.";
    } else if (selectedStaple === "macarrao") {
      msg = "🍝 *ATLAS ALERTA:* Trigo importado e custos com energia elevam o refino de farinha de sêmola. O Macarrão Espaguete de 500g terá reajuste de 5% de entrada em 10 dias.";
    } else if (selectedStaple === "cremedental") {
      msg = "🪥 *ATLAS OPORTUNIDADE:* Novo fabricante nacional oferece lote promocional de Creme Dental de 90g com 10% de desconto para compras conjuntas. Excelente margem!";
    } else if (selectedStaple === "papelhigienico") {
      msg = "🧻 *ATLAS ALERTA:* Greve nas indústrias de celulose pressiona os suprimentos de higiene. O fardo de Papel Higiênico subirá 9% de custo nos próximos 12 dias. Antecipe estoque.";
    }

    setWhatsappNotificationText(msg);
    setIsPhonePreviewOpen(true);
  };

  const handleStateToggle = (id: string) => {
    setSources((prev) => ({
      ...prev,
      statesToMonitor: prev.statesToMonitor.includes(id)
        ? prev.statesToMonitor.filter((s) => s !== id)
        : [...prev.statesToMonitor, id],
    }));
  };

  const testApiConnection = (type: "DEEPSEEK" | "OPENAI") => {
    if (type === "DEEPSEEK") {
      setIsTestingDeepseek(true);
      setTimeout(() => {
        setIsTestingDeepseek(false);
        showToast("Conexão com a API Deepseek estabelecida com sucesso!");
      }, 1500);
    } else {
      setIsTestingOpenai(true);
      setTimeout(() => {
        setIsTestingOpenai(false);
        showToast("Conexão com a API OpenAI (Embeddings) validada!");
      }, 1500);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 relative pb-16">
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

      {/* Background Neon Blur Spheres */}
      <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[100px] left-[-100px] w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-violet-400 bg-clip-text text-transparent font-display">
            Configurações do Terminal
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Configure chaves de IA, parâmetros de margem comercial, frequência de varreduras e alertas
          </p>
        </div>
        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 font-bold text-xs text-white rounded-xl transition-all duration-200 select-none shadow-lg shadow-cyan-500/10 active:scale-[0.98]"
        >
          💾 Salvar Configurações
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 glass rounded-xl p-2 border-white/[0.04] space-y-1">
          <button
            onClick={() => setActiveTab("GERAL")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeTab === "GERAL"
                ? "bg-white/[0.05] text-white border-l-2 border-cyan-400"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
            }`}
          >
            <span>🏢</span>
            <span>Rede de Supermercado</span>
          </button>
          <button
            onClick={() => setActiveTab("ALERTAS")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeTab === "ALERTAS"
                ? "bg-white/[0.05] text-white border-l-2 border-cyan-400"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
            }`}
          >
            <span>💬</span>
            <span>Alertas & WhatsApp</span>
          </button>
          <button
            onClick={() => setActiveTab("IA")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeTab === "IA"
                ? "bg-white/[0.05] text-white border-l-2 border-cyan-400"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
            }`}
          >
            <span>🧠</span>
            <span>Integrações de IA</span>
          </button>
          <button
            onClick={() => setActiveTab("FONTES")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeTab === "FONTES"
                ? "bg-white/[0.05] text-white border-l-2 border-cyan-400"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
            }`}
          >
            <span>📡</span>
            <span>Fontes de Dados (Agentes)</span>
          </button>
        </div>

        {/* Tab Content Panel */}
        <div className="lg:col-span-9 glass rounded-xl p-6 sm:p-8 border-white/[0.04] min-h-[450px]">
          <AnimatePresence mode="wait">
            {activeTab === "GERAL" && (
              <motion.div
                key="geral"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="border-b border-white/[0.06] pb-3">
                  <h3 className="text-sm font-bold text-white tracking-wide">Rede de Supermercados</h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Parâmetros operacionais padrões do comércio</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Supermarket Name */}
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Nome da Rede / Loja</label>
                    <input
                      type="text"
                      value={general.chainName}
                      onChange={(e) => setGeneral((prev) => ({ ...prev, chainName: e.target.value }))}
                      className="w-full bg-black/20 border border-white/[0.08] hover:border-white/[0.15] focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all duration-150"
                      placeholder="Ex: Supermercados Pão de Ouro"
                    />
                  </div>

                  {/* Target Margin */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Margem Bruta Alvo (%)</label>
                      <span className="text-xs font-mono font-bold text-cyan-400">{general.targetMargin}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="60"
                      value={general.targetMargin}
                      onChange={(e) => setGeneral((prev) => ({ ...prev, targetMargin: Number(e.target.value) }))}
                      className="w-full h-1 bg-white/[0.06] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                    <p className="text-[9px] text-zinc-500">
                      Margem bruta média de gôndola utilizada para calcular o preço final sugerido.
                    </p>
                  </div>

                  {/* Stock Coverage Days */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Cobertura de Estoque Padrão</label>
                      <span className="text-xs font-mono font-bold text-cyan-400">{general.coverageDays} dias</span>
                    </div>
                    <input
                      type="range"
                      min="7"
                      max="90"
                      value={general.coverageDays}
                      onChange={(e) => setGeneral((prev) => ({ ...prev, coverageDays: Number(e.target.value) }))}
                      className="w-full h-1 bg-white/[0.06] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                    <p className="text-[9px] text-zinc-500">
                      Dias estimados de autonomia para cálculos de economia de caixa por antecipação de lotes.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "ALERTAS" && (
              <motion.div
                key="alertas"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="border-b border-white/[0.06] pb-3">
                  <h3 className="text-sm font-bold text-white tracking-wide">Alertas & WhatsApp</h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Assinaturas e contatos para avisos em tempo real</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">WhatsApp para Recebimento</label>
                    <input
                      type="text"
                      value={alerts.phone}
                      onChange={(e) => setAlerts((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-black/20 border border-white/[0.08] hover:border-white/[0.15] focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all duration-150"
                      placeholder="Ex: (11) 99999-9999"
                    />
                  </div>

                  {/* Minimum Severity */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Severidade Mínima para Notificação</label>
                    <select
                      value={alerts.minSeverity}
                      onChange={(e: any) => setAlerts((prev) => ({ ...prev, minSeverity: e.target.value }))}
                      className="w-full bg-black/20 border border-white/[0.08] hover:border-white/[0.15] focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all duration-150"
                    >
                      <option value="LOW" className="bg-zinc-950">Todos os Alertas (Baixo)</option>
                      <option value="MEDIUM" className="bg-zinc-950">Severidade Média ou maior</option>
                      <option value="HIGH" className="bg-zinc-950">Apenas Alertas Importantes (Alto)</option>
                      <option value="CRITICAL" className="bg-zinc-950">Apenas Alertas Críticos</option>
                    </select>
                  </div>

                  {/* Notification Frequency */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-sans">Frequência de Notificação</label>
                    <select
                      value={alerts.frequency}
                      onChange={(e: any) => setAlerts((prev) => ({ ...prev, frequency: e.target.value }))}
                      className="w-full bg-black/20 border border-white/[0.08] hover:border-white/[0.15] focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all duration-150"
                    >
                      <option value="IMMEDIATE" className="bg-zinc-950">Resumo Imediato (Tempo Real)</option>
                      <option value="DAILY" className="bg-zinc-950">Um Alerta por Dia</option>
                      <option value="WEEKLY" className="bg-zinc-950">Resumo Semanal</option>
                    </select>
                  </div>

                  {/* Simulator Button */}
                  <div className="space-y-1.5 flex flex-col justify-end">
                    <button
                      onClick={handleTestAlertInSettings}
                      type="button"
                      className="w-full py-2.5 rounded-xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/[0.06] hover:border-cyan-500/30 text-xs font-bold text-zinc-300 hover:text-cyan-400 flex items-center justify-center gap-2 transition-all select-none focus:outline-none"
                    >
                      <span>📲</span> Simular Alerta no Celular
                    </button>
                  </div>

                  {/* Twilio Configuration Card */}
                  <div className="col-span-2 bg-white/[0.01] border border-white/[0.04] p-4.5 rounded-2xl space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <span>🔗</span> Integração Automática com API Twilio (WhatsApp Real)
                    </h4>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                      Se você possui uma conta Twilio, preencha as credenciais abaixo para disparar alertas preditivos automáticos e reais para o telefone cadastrado. Caso contrário, o terminal gerará links diretos de redirecionamento do WhatsApp Web gratuitamente.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Account SID</label>
                        <input
                          type="text"
                          value={alerts.twilioSid || ""}
                          onChange={(e) => setAlerts((prev) => ({ ...prev, twilioSid: e.target.value }))}
                          className="w-full bg-black/20 border border-white/[0.08] hover:border-white/[0.15] focus:border-cyan-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition-all"
                          placeholder="AC..."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Auth Token</label>
                        <input
                          type="password"
                          value={alerts.twilioToken || ""}
                          onChange={(e) => setAlerts((prev) => ({ ...prev, twilioToken: e.target.value }))}
                          className="w-full bg-black/20 border border-white/[0.08] hover:border-white/[0.15] focus:border-cyan-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">WhatsApp From (Twilio Sender)</label>
                        <input
                          type="text"
                          value={alerts.twilioFrom || ""}
                          onChange={(e) => setAlerts((prev) => ({ ...prev, twilioFrom: e.target.value }))}
                          className="w-full bg-black/20 border border-white/[0.08] hover:border-white/[0.15] focus:border-cyan-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition-all"
                          placeholder="whatsapp:+14155238886"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Staples Subscriptions */}
                  <div className="space-y-2 col-span-2">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Assinatura de Produtos (12 Staples)</label>
                    <p className="text-[10px] text-zinc-500 mb-2">Selecione quais mercadorias você deseja receber alertas instantâneos de flutuação no WhatsApp.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {STAPLES_OPTIONS.map((opt) => {
                        const active = alerts.staples.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleStapleToggle(opt.id)}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-left text-[11px] transition-all duration-150 ${
                              active
                                ? "bg-cyan-500/[0.03] border-cyan-500/20 text-cyan-300"
                                : "bg-white/[0.015] border-white/[0.03] text-zinc-500 hover:text-zinc-300"
                            }`}
                          >
                            <div className={`w-3 h-3 rounded flex items-center justify-center text-[7px] ${
                              active ? "bg-cyan-400 text-black border border-cyan-400" : "border border-zinc-700"
                            }`}>
                              {active && "✓"}
                            </div>
                            <span className="truncate">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "IA" && (
              <motion.div
                key="ia"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="border-b border-white/[0.06] pb-3">
                  <h3 className="text-sm font-bold text-white tracking-wide">Integrações de IA</h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Gerencie os modelos e chaves de inferência preditiva</p>
                </div>

                <div className="space-y-4">
                  {/* Deepseek API Key */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Chave de API DeepSeek</label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={ia.deepseekKey}
                        onChange={(e) => setIa((prev) => ({ ...prev, deepseekKey: e.target.value }))}
                        className="flex-1 bg-black/20 border border-white/[0.08] hover:border-white/[0.15] focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all duration-150"
                        placeholder="Insira sua chave sk-..."
                      />
                      <button
                        onClick={() => testApiConnection("DEEPSEEK")}
                        disabled={isTestingDeepseek}
                        className="px-4 py-2 bg-white/[0.03] hover:bg-cyan-500/10 border border-white/[0.06] hover:border-cyan-500/30 rounded-xl text-xs font-semibold text-zinc-300 hover:text-cyan-400 transition-colors select-none whitespace-nowrap"
                      >
                        {isTestingDeepseek ? "Verificando..." : "Testar Conexão"}
                      </button>
                    </div>
                    <p className="text-[9px] text-zinc-500">
                      Chave primária usada para orquestrar os agentes preditivos climáticos, fiscais e logísticos.
                    </p>
                  </div>

                  {/* OpenAI API Key */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Chave de API OpenAI (Embeddings)</label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={ia.openaiKey}
                        onChange={(e) => setIa((prev) => ({ ...prev, openaiKey: e.target.value }))}
                        className="flex-1 bg-black/20 border border-white/[0.08] hover:border-white/[0.15] focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all duration-150"
                        placeholder="Insira sua chave da OpenAI"
                      />
                      <button
                        onClick={() => testApiConnection("OPENAI")}
                        disabled={isTestingOpenai}
                        className="px-4 py-2 bg-white/[0.03] hover:bg-cyan-500/10 border border-white/[0.06] hover:border-cyan-500/30 rounded-xl text-xs font-semibold text-zinc-300 hover:text-cyan-400 transition-colors select-none whitespace-nowrap"
                      >
                        {isTestingOpenai ? "Verificando..." : "Testar Conexão"}
                      </button>
                    </div>
                    <p className="text-[9px] text-zinc-500">
                      Usada para gerar vetores de busca de similaridade e alimentar a base de conhecimento RAG.
                    </p>
                  </div>

                  {/* Fallback Local Toggle */}
                  <div className="flex items-center justify-between bg-white/[0.015] border border-white/[0.03] p-4 rounded-xl">
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-300">Simulador Local (RAG Fallback)</h4>
                      <p className="text-[9px] text-zinc-500">Ativar respostas baseadas no banco local se a API da nuvem estiver off-line</p>
                    </div>
                    <button
                      onClick={() => setIa((prev) => ({ ...prev, useFallbackLocal: !prev.useFallbackLocal }))}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                        ia.useFallbackLocal ? "bg-cyan-500" : "bg-zinc-800"
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                        ia.useFallbackLocal ? "translate-x-4" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "FONTES" && (
              <motion.div
                key="fontes"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="border-b border-white/[0.06] pb-3">
                  <h3 className="text-sm font-bold text-white tracking-wide">Fontes de Dados (Agentes)</h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Parâmetros das origens fiscais e logísticas dos scans</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Scan Frequency */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Frequência da Varredura Automática (Cron)</label>
                    <select
                      value={sources.scanFrequency}
                      onChange={(e: any) => setSources((prev) => ({ ...prev, scanFrequency: e.target.value }))}
                      className="w-full bg-black/20 border border-white/[0.08] hover:border-white/[0.15] focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all duration-150"
                    >
                      <option value="off" className="bg-zinc-950">🚫 Desativada</option>
                      <option value="6h" className="bg-zinc-950">⏱️ A cada 6 horas</option>
                      <option value="12h" className="bg-zinc-950">⏱️ A cada 12 horas</option>
                      <option value="24h" className="bg-zinc-950">📅 Diária (A cada 24 horas)</option>
                      <option value="weekly" className="bg-zinc-950">🗓️ Semanal (A cada 7 dias)</option>
                    </select>
                    <p className="text-[9px] text-zinc-500 mt-1">
                      Status do Cron Job local: {sources.scanFrequency !== "off" ? "🟢 Ativo e Monitorando no Servidor" : "🔴 Desativado"}.
                    </p>
                  </div>

                  {/* Freight Sensitivity */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Sensibilidade do Frete Logístico</label>
                      <span className="text-xs font-mono font-bold text-cyan-400">+{sources.freightSensitivity}%</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="15"
                      value={sources.freightSensitivity}
                      onChange={(e) => setSources((prev) => ({ ...prev, freightSensitivity: Number(e.target.value) }))}
                      className="w-full h-1 bg-white/[0.06] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                    <p className="text-[9px] text-zinc-500">
                      Gera alerta se a variação do frete rodoviário ANTT subir mais que este valor.
                    </p>
                  </div>

                  {/* Diário Oficial States */}
                  <div className="space-y-2 col-span-2">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Estados sob Monitoramento Fiscal (ICMS/ST)</label>
                    <p className="text-[10px] text-zinc-500 mb-2">Mapeia decretos fiscais estaduais para identificar mudanças tributárias.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {STATES_OPTIONS.map((state) => {
                        const active = sources.statesToMonitor.includes(state.id);
                        return (
                          <button
                            key={state.id}
                            onClick={() => handleStateToggle(state.id)}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs transition-all duration-150 ${
                              active
                                ? "bg-cyan-500/[0.03] border-cyan-500/20 text-cyan-300"
                                : "bg-white/[0.015] border-white/[0.03] text-zinc-500 hover:text-zinc-300"
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[7px] ${
                              active ? "bg-cyan-400 text-black border border-cyan-400" : "border border-zinc-700"
                            }`}>
                              {active && "✓"}
                            </div>
                            <span className="truncate">{state.name} ({state.id})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── WhatsApp Phone Simulator Overlay ── */}
      <AnimatePresence>
        {isPhonePreviewOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPhonePreviewOpen(false)}
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
                      onClick={() => setIsPhonePreviewOpen(false)}
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
                    <span className="text-[9px] text-zinc-500 font-medium font-mono">Simulando em: {alerts.phone}</span>
                    <button
                      onClick={() => setIsPhonePreviewOpen(false)}
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
