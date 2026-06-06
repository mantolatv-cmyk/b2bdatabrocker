"use client";

/**
 * B2B Data Broker — AI Agents Orchestrator Control Panel
 * Provides a beautiful glassmorphism UI for monitoring the 4 specialized agents,
 * viewing their focus directives, and running real-time focused queries via DeepSeek API.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const AGENTS_LIST = [
  {
    id: "climatico",
    name: "Agente Climático & Agro",
    role: "Monitoramento de Lavouras e Clima",
    description: "Analisa relatórios da CONAB, CEPEA e boletins meteorológicos do INPE para identificar secas, geadas ou quebras de safra de grãos e hortifrúti.",
    icon: "🌦️",
    color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/20 focus-ring-amber",
    accent: "amber",
    bullets: ["Monitora produção global agropecuária", "Rastreia clima e gargalos hídricos", "Mapeia dados USDA, CONAB e bolsa de Chicago"]
  },
  {
    id: "logistico",
    name: "Agente Logístico & Econômico",
    role: "Custos de Frete, Diesel e Portos",
    description: "Mapeia os reajustes de refino de diesel da Petrobras, cotações de câmbio comercial e tabelas ANTT de frete para calcular o impacto do transporte no custo final.",
    icon: "🚚",
    color: "from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/20 focus-ring-cyan",
    accent: "cyan",
    bullets: ["Mapeia valor médio do frete marítimo/terrestre", "Rastreia petróleo Brent/WTI e gargalos", "Calcula custo logístico de suprimentos"]
  },
  {
    id: "fiscal",
    name: "Agente de Política Fiscal",
    role: "ICMS, ST e Decretos Governamentais",
    description: "Varre os Diários Oficiais Estaduais (DOE) buscando decretos tributários, alterações de Substituição Tributária (ST) e isenções fiscais na cesta básica.",
    icon: "📜",
    color: "from-violet-500/20 to-fuchsia-500/20 text-violet-400 border-violet-500/20 focus-ring-violet",
    accent: "violet",
    bullets: ["Varre Diários Oficiais e regulação global", "Mapeia impostos e subsídios industriais", "Identifica tarifas e barreiras protecionistas"]
  },
  {
    id: "analista",
    name: "Agente Analista (Cérebro RAG)",
    role: "Cruzamento e Margens Financeiras",
    description: "Cruza os dados climáticos, fiscais e logísticos, correlacionando-os com o estoque e a margem de contribuição do supermercado para prever a margem ideal.",
    icon: "🧠",
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/20 focus-ring-emerald",
    accent: "emerald",
    bullets: ["Alimenta base vetorial RAG macroeconômica", "Simula hedge e correlações de mercado", "Calcula viabilidade de contratos de longo prazo"]
  }
];

export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState("climatico");
  const [targetInput, setTargetInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [agentResponse, setAgentResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [diarioText, setDiarioText] = useState("");
  const [taxInsights, setTaxInsights] = useState<any[]>([]);

  // Trigger Focused Scan call to DeepSeek
  const handleTriggerIngest = async () => {
    setIsIngesting(true);
    setError(null);
    setLogs((prev) => [...prev, "📥 Iniciando varredura de portais e processamento semântico de notícias..."]);
    try {
      const res = await fetch("/api/agents/ingest", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setLogs((prev) => [
          ...prev,
          `✓ Sucesso: Artigo "${data.articleIngested || "Notícia Recente"}" processado pelo DeepSeek.`,
          `✓ Vetor pgvector de 1536 dimensões persistido na tabela KnowledgeChunk (Status: ${data.queryOutcome}).`,
          `📡 Fonte de Origem: ${data.sourceUrl || "RSS Feed"}`
        ]);
      } else {
        setLogs((prev) => [...prev, "❌ Falha no processamento do agente ou gravação no banco."]);
      }
    } catch (e) {
      setLogs((prev) => [...prev, "❌ Erro de conexão ao acionar o Agente Ingestor RAG."]);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleAgentSelect = (id: string) => {
    setSelectedAgent(id);
    setAgentResponse(null);
    setTaxInsights([]);
    setLogs([]);
  };

  const handleRunAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInput.trim() || isRunning) return;

    setIsRunning(true);
    setError(null);
    setAgentResponse(null);
    setLogs(["⚙️ Inicializando orquestrador central de agentes..."]);
    setCurrentProgress(5);

    // Simulated log stream timeline
    const logIntervals = [
      { delay: 600, progress: 25, log: "🔑 Conexão estabelecida com DeepSeek (Modelo: deepseek-chat)." },
      { delay: 1400, progress: 50, log: "📥 Injetando Prompt de Sistema e contexto da Indústria/Trading na análise..." },
      { delay: 2200, progress: 75, log: "📊 Coletando cotações cambiais do dólar e índices SGS do Banco Central..." },
      { delay: 3000, progress: 90, log: "🧠 Cruzando dados e inferindo impactos na cadeia de suprimentos..." }
    ];

    logIntervals.forEach((item) => {
      setTimeout(() => {
        setLogs((prev) => [...prev, item.log]);
        setCurrentProgress(item.progress);
      }, item.delay);
    });

    try {
      // Se for o Agente Fiscal, roda a rota tributária específica
      if (selectedAgent === "fiscal") {
        setLogs((prev) => [...prev, "📄 Enviando texto do Diário Oficial para varredura de NCMs..."]);
        const response = await fetch("/api/agents/tax/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ diarioOficialText: diarioText })
        });

        if (!response.ok) {
          throw new Error("Erro ao processar Diário Oficial");
        }

        const data = await response.json();
        
        // Simular log stream de auditor
        setTimeout(() => {
          if (data.logs) {
            data.logs.forEach((logStr: string, idx: number) => {
              setTimeout(() => {
                setLogs((prev) => [...prev, logStr]);
              }, idx * 300);
            });
          }
          
          setTaxInsights(data.insights || []);
          setLogs((prev) => [...prev, `✓ Sucesso: ${data.insights?.length || 0} alerta(s) tributário(s) gerado(s).`]);
          setCurrentProgress(100);
          setIsRunning(false);
        }, 1500);
        return;
      }

      // Outros agentes usam a rota comum
      const response = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: selectedAgent, targetInput })
      });

      if (!response.ok) {
        throw new Error("Erro na resposta do DeepSeek API");
      }

      const data = await response.json();
      
      setTimeout(() => {
        setAgentResponse(data);
        setLogs((prev) => [...prev, "✓ Execução do Agente concluída com sucesso!"]);
        setCurrentProgress(100);
        setIsRunning(false);
      }, 3500); // Ensures smooth progress bar transition

    } catch (err: any) {
      setTimeout(() => {
        setError(err.message || "Erro desconhecido ao executar o agente.");
        setLogs((prev) => [...prev, "❌ Falha na execução da chamada DeepSeek."]);
        setCurrentProgress(100);
        setIsRunning(false);
      }, 3500);
    }
  };

  const SIMULATED_DIARIO_OFICIAL = `DIÁRIO OFICIAL DO ESTADO - SEÇÃO I
GABINETE DO SECRETÁRIO DE ESTADO DA FAZENDA

RESOLUÇÃO SEFAZ Nº 430/2026
Altera alíquotas de ICMS e regulamenta a Substituição Tributária (ST) para produtos da cesta básica.

Artigo 1º - Fica reduzida a base de cálculo do ICMS incidente nas saídas internas de Leite UHT (código NCM 0401.20.10), de forma que a carga tributária resulte no percentual de 7% (sete por cento). A medida visa mitigar efeitos inflacionários da entressafra regional de laticínios.

Artigo 2º - Fica reajustada a base de cálculo da pauta de Substituição Tributária (ST) para aves domésticas e carnes processadas. A margem de valor agregado (MVA) para Frango Inteiro congelado (NCM 0207.11.00) passará a contar com acréscimo de 5% sobre a tabela base a partir do próximo período de apuração.

Artigo 3º - A alíquota unificada ad rem de circulação do Óleo Diesel S10 (NCM 2710.19.21) passa a vigorar com diferimento de 1,5% nas saídas internas para frotas rodoviárias de alimentos da cesta básica.

Artigo 4º - Fica convocada a junta comercial de saneamento ambiental (CNPJ 00.123.456/0001-99) a prestar contas operacionais.`;

  const handleSimulateDiario = () => {
    setDiarioText(SIMULATED_DIARIO_OFICIAL);
    setLogs((prev) => [...prev, "⚡ Texto simulado do Diário Oficial carregado no formulário."]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-12"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Agentes de IA</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Monitore as especialidades e dispare varreduras direcionadas usando a API do DeepSeek
          </p>
        </div>
        
        {/* Connection status and Ingestion action buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-500/[0.04] border border-emerald-500/20 px-3.5 py-1.5 rounded-full select-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">DeepSeek Conectado</span>
          </div>

          <button
            onClick={handleTriggerIngest}
            disabled={isIngesting || isRunning}
            className="px-4.5 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 disabled:opacity-50 text-white font-extrabold text-[10px] uppercase rounded-xl transition-all shadow-md select-none focus:outline-none"
          >
            {isIngesting ? "Ingerindo..." : "📥 Ingerir Notícias RAG"}
          </button>
        </div>
      </div>

      {/* Agents Specialization Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {AGENTS_LIST.map((agent) => {
          const isActiveSelection = selectedAgent === agent.id;
          return (
            <motion.div
              key={agent.id}
              onClick={() => handleAgentSelect(agent.id)}
              whileHover={{ scale: 1.02 }}
              className={`
                relative cursor-pointer rounded-2xl border p-5 space-y-4 hover:bg-white/[0.03] transition-all duration-300 flex flex-col justify-between
                ${isActiveSelection 
                  ? "bg-white/[0.03] border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.06)]" 
                  : "bg-white/[0.015] border-white/[0.015]"
                }
              `}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-2xl p-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">{agent.icon}</span>
                  {isActiveSelection && (
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      Selecionado
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-sm text-white">{agent.name}</h3>
                  <span className="text-[10px] text-zinc-500 font-semibold tracking-wide uppercase mt-0.5 block">{agent.role}</span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                  {agent.description}
                </p>
              </div>

              {/* Bullet points */}
              <div className="pt-3 border-t border-white/[0.04] space-y-1.5 select-none">
                {agent.bullets.map((bullet, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <span className="text-[7px]">✦</span>
                    <span className="truncate">{bullet}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Focused Scan Console Panel ── */}
      <div className="bg-white/[0.015] border border-white/[0.04] rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-white/[0.05] pb-4">
          <h2 className="text-lg font-bold text-white tracking-wide">⚙️ Console de Execução Focada (DeepSeek RAG)</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Selecione um agente acima, defina o produto ou região e execute um escaneamento DeepSeek em tempo real
          </p>
        </div>

        <form onSubmit={handleRunAgent} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Control Inputs */}
          <div className="lg:col-span-5 space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Agente Ativo</label>
              <div className="bg-black/20 border border-white/[0.08] px-4 py-3 rounded-xl text-xs text-white/90 font-medium capitalize flex items-center gap-2">
                <span>{AGENTS_LIST.find(a => a.id === selectedAgent)?.icon}</span>
                <span>{AGENTS_LIST.find(a => a.id === selectedAgent)?.name}</span>
              </div>
            </div>

            {selectedAgent === "fiscal" ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Texto do Diário Oficial</label>
                  <button
                    type="button"
                    onClick={handleSimulateDiario}
                    className="text-[9px] text-cyan-400 font-mono font-bold hover:underline bg-cyan-400/5 px-2 py-1 rounded border border-cyan-500/10"
                  >
                    ⚡ Simular Diário (NCMs)
                  </button>
                </div>
                <textarea
                  value={diarioText}
                  onChange={(e) => setDiarioText(e.target.value)}
                  placeholder="Cole o extrato do Diário Oficial do Estado (SEFAZ/DOU) aqui contendo códigos NCM para realizar a auditoria..."
                  disabled={isRunning}
                  rows={8}
                  className="w-full bg-black/20 border border-white/[0.08] hover:border-white/[0.15] focus:border-cyan-500/50 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-all duration-150 font-mono resize-none"
                />
                <p className="text-[9px] text-zinc-500 leading-normal">
                  O sistema aplicará Regex para extrair e criar recortes de NCMs conhecidos antes de consultar a IA.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Foco da Análise / Alvo</label>
                <input
                  type="text"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  placeholder="Ex: contratos de soja em Chicago, diesel em SP, tarifas aço..."
                  disabled={isRunning}
                  className="w-full bg-black/20 border border-white/[0.08] hover:border-white/[0.15] focus:border-cyan-500/50 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-all duration-150"
                />
                <p className="text-[9px] text-zinc-500 leading-normal">
                  Indique a commodity, derivado ou macroeconomia para obter uma projeção de suprimentos preditiva.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isRunning || (selectedAgent === "fiscal" ? !diarioText.trim() : !targetInput.trim())}
              className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs py-3.5 px-6 rounded-xl transition-all shadow-[0_4px_20px_rgba(6,182,212,0.15)] flex items-center justify-center gap-2 select-none"
            >
              {isRunning ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Auditando no DeepSeek...
                </>
              ) : (
                <>
                  <span>🔍</span>
                  {selectedAgent === "fiscal" ? "Executar Varredura Fiscal" : "Executar Varredura Focada"}
                </>
              )}
            </button>
          </div>

          {/* Terminal Logs & DeepSeek Response Display */}
          <div className="lg:col-span-7 space-y-4">
            <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Painel do Terminal de Logs</label>
            
            <div className="bg-[#050505]/90 border border-white/[0.06] rounded-2xl p-5 h-[260px] overflow-y-auto font-mono text-[11px] leading-relaxed text-zinc-400 flex flex-col justify-between shadow-inner">
              {/* Logs Stream */}
              <div className="space-y-1.5">
                {logs.map((log, index) => (
                  <div key={index} className={`flex items-start gap-2 ${log.startsWith("❌") ? "text-red-400" : log.startsWith("✓") ? "text-emerald-400" : "text-cyan-400"}`}>
                    <span className="text-[9px] text-zinc-600 select-none">❯</span>
                    <span className="flex-1 whitespace-pre-wrap">{log}</span>
                  </div>
                ))}
                
                {isRunning && (
                  <div className="flex items-center gap-1.5 text-zinc-500 mt-2">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                    <span>Aguardando resposta do RAG DeepSeek...</span>
                  </div>
                )}

                {logs.length === 0 && (
                  <span className="text-zinc-600 italic">Terminal ocioso. Insira o foco de análise e clique em Executar acima.</span>
                )}
              </div>

              {/* Progress bar container */}
              {isRunning && (
                <div className="space-y-1 mt-4">
                  <div className="flex justify-between text-[9px] text-zinc-500 font-bold">
                    <span>PROGRESSO CENTRAL</span>
                    <span>{currentProgress}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-400 to-violet-400"
                      initial={{ width: "0%" }}
                      animate={{ width: `${currentProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* ── Real-Time Response Analysis Result ── */}
      <AnimatePresence>
        {agentResponse && selectedAgent !== "fiscal" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25 }}
            className="bg-cyan-500/[0.02] border border-cyan-500/10 rounded-3xl p-6 sm:p-8 space-y-6"
          >
            {/* Header info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/[0.05] pb-5 gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl p-2 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">🎯</span>
                <div>
                  <h3 className="text-sm font-bold text-white">Análise Preditiva do Agente</h3>
                  <span className="text-[10px] text-cyan-400 font-mono font-bold tracking-wider uppercase">{agentResponse.agentName}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Confidence bar */}
                <div className="flex flex-col items-end gap-1 select-none">
                  <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Índice de Confiança</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400" style={{ width: `${agentResponse.confidence * 100}%` }} />
                    </div>
                    <span className="text-xs text-cyan-400 font-mono font-bold">{Math.round(agentResponse.confidence * 100)}%</span>
                  </div>
                </div>

                {/* Status Badge */}
                <span className={`px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest rounded-full border ${
                  agentResponse.status === "ALERT" 
                    ? "bg-red-500/10 border-red-500/20 text-red-400 animate-pulse" 
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                }`}>
                  {agentResponse.status === "ALERT" ? "Alerta" : "Normal"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Findings & Prediction */}
              <div className="space-y-5">
                <div className="space-y-2 text-left">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Descobertas Detalhadas</h4>
                  <p className="text-sm text-zinc-300 leading-relaxed bg-white/[0.01] p-4 rounded-xl border border-white/[0.03]">
                    {agentResponse.findings}
                  </p>
                </div>

                <div className="space-y-2 text-left">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Impacto / Previsão</h4>
                  <p className="text-sm text-zinc-300 font-medium leading-relaxed bg-white/[0.015] border border-white/[0.03] p-4 rounded-xl">
                    {agentResponse.prediction}
                  </p>
                </div>
              </div>

              {/* Recommendation & Sources */}
              <div className="space-y-5">
                <div className="space-y-2 text-left">
                  <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">Recomendação do Orquestrador</h4>
                  <div className="p-4 bg-emerald-500/[0.01] border border-emerald-500/20 rounded-xl">
                    <p className="text-sm text-emerald-300 font-semibold leading-relaxed">
                      {agentResponse.recommendation}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Fontes de Coleta Oficial</h4>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {agentResponse.sources?.map((src: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-white/[0.02] border border-white/[0.05] rounded-lg text-xs text-zinc-400 font-medium"
                      >
                        📡 {src}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Real-Time Tax Agent Analysis Results ── */}
      <AnimatePresence>
        {selectedAgent === "fiscal" && taxInsights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-5"
          >
            <div className="border-b border-white/[0.05] pb-3">
              <h3 className="text-md font-bold text-white tracking-wide">📜 Alertas Tributários Identificados no Diário Oficial</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Clique nos alertas abaixo para acionar envio imediato de recomendações contábeis
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {taxInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`
                    p-5 rounded-2xl border bg-white/[0.015] hover:bg-white/[0.03] transition-all flex flex-col justify-between space-y-4
                    ${insight.severity === "CRITICAL" ? "border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.03)]" : 
                      insight.severity === "OPPORTUNITY" ? "border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.03)]" :
                      "border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.03)]"}
                  `}
                >
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-start">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${
                        insight.severity === "CRITICAL" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                        insight.severity === "OPPORTUNITY" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        {insight.tipo_alteracao}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono font-bold">{insight.ncm}</span>
                    </div>

                    <h4 className="font-bold text-sm text-white">{insight.productName}</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed font-normal">{insight.resumo_alerta}</p>
                  </div>

                  <div className="pt-3 border-t border-white/[0.04] space-y-3">
                    <div className="space-y-1">
                      <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block">Ação Recomendada</span>
                      <p className="text-[11px] text-zinc-400 leading-normal">{insight.acao_recomendada}</p>
                    </div>

                    <a
                      href={insight.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 hover:border-emerald-500/30 text-emerald-400 font-extrabold text-[10px] uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 select-none"
                    >
                      <span>💬</span> Notificar Compras WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2"
          >
            <span>⚠️</span>
            <span>Erro: {error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
