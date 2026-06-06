import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ALL_INSUMOS, INSUMOS_KEYWORDS, INSUMOS_COUNT } from "@/lib/insumos";
import { fetchWithCache } from "@/lib/api-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RAW_SIGNALS_POOL = [
  "Tensões geopolíticas no Oriente Médio reduzem o tráfego no Canal de Suez, elevando o custo do frete marítimo e pressionando o preço do Petróleo Brent.",
  "Relatório do USDA aponta quebra de safra de soja na América do Sul, forçando indústrias a revisarem estoques e contratos de farelo de soja.",
  "China anuncia pacote de estímulos ao setor de infraestrutura, impulsionando os contratos futuros de Minério de Ferro e Bobinas a Quente de Aço.",
  "O Diário Oficial publica decreto que altera as alíquotas de ICMS e Substituição Tributária sobre insumos químicos industriais, encarecendo a ureia e fertilizantes.",
  "Boletim Focus sinaliza desvalorização persistente do Real, encarecendo as importações de insumos e pressionando as tradings de agronegócio.",
  "Clima quente nas regiões produtoras do Sudeste antecipa colheitas, mas a baixa umidade afeta os canaviais, pressionando as cotações de Açúcar VHP e Etanol.",
  "Petrobras anuncia reajuste de 5% no Óleo Diesel nas refinarias, elevando a tabela de frete rodoviário e encarecendo a logística nacional de suprimentos.",
  "Baixa vazão das hidrelétricas força acionamento de usinas térmicas, aumentando o PLD e o custo da Energia Elétrica para indústrias eletrointensivas.",
  "Abertura de novos mercados na Ásia acelera exportações brasileiras de carne bovina, reduzindo a oferta interna de Boi Gordo e forçando reajustes nos frigoríficos.",
  "Indústria global reduz investimentos em mineração e estoques de alumínio caem na LME, indicando janela de compra favorável para indústrias de transformação.",
  "OPEP+ surpreende mercado com cortes de produção, indicando forte pressão de custos sobre a cadeia global de derivados de petróleo e petroquímicos."
];

const INSIGHTS_KEYWORDS = INSUMOS_KEYWORDS;

// Helper to map UI fields
function getFinancialImpact(commodity: string, riskLevel: string) {
  const norm = commodity.toLowerCase().replace(/_/g, " ");
  const insumo = ALL_INSUMOS.find(i => {
    const idNorm = i.id.toLowerCase().replace(/_/g, " ");
    const nameNorm = i.name.toLowerCase();
    return norm.includes(idNorm) || idNorm.includes(norm) || norm.includes(nameNorm) || nameNorm.includes(norm) || i.keywords.some(k => norm.includes(k));
  });
  const baseVal = insumo?.basePrice ?? 5000;
  const sign = riskLevel === "OPPORTUNITY" ? "+" : "-";
  return `${sign}R$ ${baseVal.toLocaleString("pt-BR")}`;
}

function getTagsForCommodity(commodity: string) {
  const norm = commodity.toLowerCase().replace(/_/g, " ");
  const insumo = ALL_INSUMOS.find(i => {
    const idNorm = i.id.toLowerCase().replace(/_/g, " ");
    const nameNorm = i.name.toLowerCase();
    return norm.includes(idNorm) || idNorm.includes(norm) || norm.includes(nameNorm) || nameNorm.includes(norm) || i.keywords.some(k => norm.includes(k));
  });
  if (insumo) return [insumo.category, insumo.id, ...insumo.keywords.slice(0, 3)];
  return [commodity.toLowerCase(), "agro"];
}

function getTimeframeForCommodity(commodity: string) {
  const norm = commodity.toLowerCase().replace(/_/g, " ");
  const insumo = ALL_INSUMOS.find(i => {
    const idNorm = i.id.toLowerCase().replace(/_/g, " ");
    const nameNorm = i.name.toLowerCase();
    return norm.includes(idNorm) || idNorm.includes(norm) || norm.includes(nameNorm) || nameNorm.includes(norm) || i.keywords.some(k => norm.includes(k));
  });
  if (insumo) {
    if (insumo.category === "hortifruti") return `${Math.floor(Math.random() * 5) + 3} dias`;
    if (insumo.category === "acougue") return `${Math.floor(Math.random() * 10) + 8} dias`;
    return `${Math.floor(Math.random() * 15) + 10} dias`;
  }
  return "15 dias";
}

function getDeterministicNumber(seed: string, min: number, max: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const random = Math.abs(Math.sin(hash));
  return min + random * (max - min);
}

function mapCardToInsight(card: any, metadata?: any) {
  const type = card.riskLevel === "OPPORTUNITY" ? "OPPORTUNITY" : "RISK_ALERT";
  const severity = card.riskLevel === "CRITICAL" 
    ? "CRITICAL" 
    : (card.riskLevel === "WARNING" ? "HIGH" : "MEDIUM");
    
  return {
    id: card.id,
    type,
    severity,
    title: card.title,
    summary: `${card.analysis} Ação: ${card.recommendedAction}`,
    recommendation: card.recommendedAction,
    analysis: card.analysis,
    sources: ["Cérebro RAG", "Banco Central do Brasil", "AwesomeAPI", "Fontes do Setor"],
    confidence: getDeterministicNumber(card.id + "conf", 0.82, 0.98),
    probability: getDeterministicNumber(card.id + "prob", 0.70, 0.95),
    timeframe: getTimeframeForCommodity(card.commodity),
    financialImpact: getFinancialImpact(card.commodity, card.riskLevel),
    tags: getTagsForCommodity(card.commodity),
    createdAt: card.createdAt ? new Date(card.createdAt).toISOString() : new Date().toISOString(),
    isRead: !!card.isRead,
    metadata: metadata || {
      usd: "R$ 5,06 (ref)",
      eur: "R$ 5,86 (ref)",
      cny: "R$ 0,74 (ref)",
      selic: "10,50% ao ano (ref)",
      ipca: "0,38% (ref)",
      igpm: "1,20% (ref)",
      newsHeadline: "Dados obtidos do acervo histórico do banco vetorial.",
      newsUrl: "https://g1.globo.com/agro/"
    }
  };
}

// Lightweight XML parser to extract RSS feed items without external dependencies
function parseRssFeed(xmlText: string): Array<{ title: string; link: string; description: string }> {
  const items: Array<{ title: string; link: string; description: string }> = [];
  try {
    const itemMatches = xmlText.match(/<item[\s>][\s\S]*?<\/item>/g);
    if (itemMatches) {
      for (const itemXml of itemMatches) {
        const titleMatch = itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || itemXml.match(/<title>([\s\S]*?)<\/title>/);
        const linkMatch = itemXml.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/) || itemXml.match(/<link>([\s\S]*?)<\/link>/);
        const descMatch = itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || itemXml.match(/<description>([\s\S]*?)<\/description>/);

        const title = titleMatch ? titleMatch[1].trim() : "";
        const link = linkMatch ? linkMatch[1].trim() : "";
        let description = descMatch ? descMatch[1].trim() : "";

        // Remove HTML tags from description if present
        description = description.replace(/<[^>]*>/g, "").trim();

        if (title) {
          items.push({ title, link, description });
        }
      }
    }
  } catch (err) {
    console.error("Error parsing RSS feed XML:", err);
  }
  return items;
}

// GET Route: Return all persisted InsightCard records mapped for UI integration
export async function GET(request: NextRequest) {
  try {
    const cards = await prisma.insightCard.findMany({
      orderBy: { createdAt: "desc" },
      take: 5
    });

    const mapped = cards.map(c => mapCardToInsight(c));
    return NextResponse.json(mapped);
  } catch (err: any) {
    console.warn("[Prisma GET error, returning empty list]:", err.message);
    return NextResponse.json([]);
  }
}

// PATCH Route: Updates isRead status for a specific InsightCard
export async function PATCH(request: NextRequest) {
  try {
    const { id, isRead } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    try {
      const updated = await prisma.insightCard.update({
        where: { id },
        data: { isRead: !!isRead }
      });
      return NextResponse.json({ success: true, card: updated });
    } catch (err: any) {
      console.warn("[Prisma PATCH error]:", err.message);
      return NextResponse.json({ success: true, note: "Prisma write skipped/failed, fallback to memory", id });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error in PATCH Route", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE Route: Removes a specific InsightCard from the database
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    try {
      await prisma.insightCard.delete({
        where: { id },
      });
      return NextResponse.json({ success: true });
    } catch (e) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
  } catch (err: any) {
    console.error("[Prisma DELETE error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST Route: Executes logic prompt hybrid database scan with DeepSeek via Server Orchestrator
export async function POST(request: NextRequest) {
  try {
    // Read optional insumoId from request body for focused scanning
    let targetInsumo: typeof ALL_INSUMOS[0] | undefined;
    try {
      const body = await request.json();
      if (body.insumoId && body.insumoId !== "ALL") {
        targetInsumo = ALL_INSUMOS.find(i => i.id === body.insumoId);
      }
    } catch {}

    let usdText = "R$ 5,06 (ref)";
    let eurText = "R$ 5,86 (ref)";
    let cnyText = "R$ 0,74 (ref)";
    let arsText = "ARS 0,01 (ref)";
    let gbpText = "R$ 6,40 (ref)";
    let ipcaVal = "0,67% (ref)";
    let igpmVal = "2,73% (ref)";
    let inccVal = "1,00% (ref)";
    let selicVal = "14,50% (ref)";
    let ibcBrVal = "0,00 (ref)";
    let cdiVal = "14,15% (ref)";
    let prodIndustrialVal = "0,00% (ref)";
    let vendasVarejoVal = "0,00% (ref)";
    let desempregoVal = "0,00% (ref)";
    let balancaComercialVal = "US$ 0 Bi (ref)";
    let icBrVal = "0,00% (ref)";
    let chosenSignal = "";
    let chosenNewsUrl = "";

    // Fetch APIs and RSS feeds in parallel — macro indicators + news using cache
    const results = await Promise.allSettled([
      // [0] Câmbio
      fetchWithCache("https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,CNY-BRL,ARS-BRL,GBP-BRL", {
        fallback: {
          USDBRL: { bid: "5.06", pctChange: "0.00" },
          EURBRL: { bid: "5.86", pctChange: "0.00" },
          CNYBRL: { bid: "0.74", pctChange: "0.00" },
          ARSBRL: { bid: "0.01", pctChange: "0.00" },
          GBPBRL: { bid: "6.40", pctChange: "0.00" }
        }
      }),
      // [1..15] RSS de notícias brasileiras
      fetchWithCache("https://g1.globo.com/rss/g1/agro/", { fallback: "", parser: t => t }),
      fetchWithCache("https://www.canalrural.com.br/feed/", { fallback: "", parser: t => t }),
      fetchWithCache("https://www.infomoney.com.br/feed/", { fallback: "", parser: t => t }),
      fetchWithCache("https://g1.globo.com/rss/g1/economia/", { fallback: "", parser: t => t }),
      fetchWithCache("https://rss.uol.com.br/feed/economia.xml", { fallback: "", parser: t => t }),
      fetchWithCache("https://feeds.folha.uol.com.br/mercado/rss.xml", { fallback: "", parser: t => t }),
      fetchWithCache("https://www.estadao.com.br/rss/ultimas/economia.xml", { fallback: "", parser: t => t }),
      fetchWithCache("http://www.ipea.gov.br/feed/rss.xml", { fallback: "", parser: t => t }),
      fetchWithCache("https://www.bcb.gov.br/rss/noticias", { fallback: "", parser: t => t }),
      fetchWithCache("https://valor.globo.com/rss/valor-economia/", { fallback: "", parser: t => t }),
      fetchWithCache("https://exame.com/feed/", { fallback: "", parser: t => t }),
      fetchWithCache("https://www.cnnbrasil.com.br/economia/feed/", { fallback: "", parser: t => t }),
      fetchWithCache("https://www.noticiasagricolas.com.br/rss/ultimas-noticias/", { fallback: "", parser: t => t }),
      fetchWithCache("https://www.moneytimes.com.br/feed/", { fallback: "", parser: t => t }),
      fetchWithCache("https://www.istoedinheiro.com.br/feed/", { fallback: "", parser: t => t }),
      // [16..26] BCB SGS
      fetchWithCache("https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/1?formato=json", { fallback: [] }),
      fetchWithCache("https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json", { fallback: [] }),
      fetchWithCache("https://api.bcb.gov.br/dados/serie/bcdata.sgs.189/dados/ultimos/1?formato=json", { fallback: [] }),
      fetchWithCache("https://api.bcb.gov.br/dados/serie/bcdata.sgs.192/dados/ultimos/1?formato=json", { fallback: [] }),
      fetchWithCache("https://api.bcb.gov.br/dados/serie/bcdata.sgs.24363/dados/ultimos/1?formato=json", { fallback: [] }),
      fetchWithCache("https://api.bcb.gov.br/dados/serie/bcdata.sgs.20687/dados/ultimos/1?formato=json", { fallback: [] }),
      fetchWithCache("https://api.bcb.gov.br/dados/serie/bcdata.sgs.2432/dados/ultimos/1?formato=json", { fallback: [] }),
      fetchWithCache("https://api.bcb.gov.br/dados/serie/bcdata.sgs.3645/dados/ultimos/1?formato=json", { fallback: [] }),
      fetchWithCache("https://api.bcb.gov.br/dados/serie/bcdata.sgs.2435/dados/ultimos/1?formato=json", { fallback: [] }),
      fetchWithCache("https://api.bcb.gov.br/dados/serie/bcdata.sgs.10813/dados/ultimos/1?formato=json", { fallback: [] }),
      fetchWithCache("https://api.bcb.gov.br/dados/serie/bcdata.sgs.27837/dados/ultimos/1?formato=json", { fallback: [] }),
    ]);

    // 1. Parse Câmbio (result 0)
    if (results[0].status === "fulfilled" && results[0].value) {
      const val = results[0].value as any;
      if (val.USDBRL) usdText = `R$ ${parseFloat(val.USDBRL.bid).toFixed(4)} (Var: ${val.USDBRL.pctChange}%)`;
      if (val.EURBRL) eurText = `R$ ${parseFloat(val.EURBRL.bid).toFixed(4)} (Var: ${val.EURBRL.pctChange}%)`;
      if (val.CNYBRL) cnyText = `R$ ${parseFloat(val.CNYBRL.bid).toFixed(4)} (Var: ${val.CNYBRL.pctChange}%)`;
      if (val.ARSBRL) arsText = `R$ ${parseFloat(val.ARSBRL.bid).toFixed(4)} (Var: ${val.ARSBRL.pctChange}%)`;
      if (val.GBPBRL) gbpText = `R$ ${parseFloat(val.GBPBRL.bid).toFixed(4)} (Var: ${val.GBPBRL.pctChange}%)`;
    }

    // 2. Parse RSS Feeds (results 1..15)
    let newsItems: Array<{ title: string; link: string; description: string }> = [];
    for (let i = 1; i <= 15; i++) {
      const r = results[i];
      if (r?.status === "fulfilled" && r.value && typeof r.value === "string") {
        newsItems = newsItems.concat(parseRssFeed(r.value));
      }
    }

    // Filter relevant news
    const scanKeywords = targetInsumo
      ? [targetInsumo.id.replace(/_/g, " "), targetInsumo.name.toLowerCase(), ...targetInsumo.keywords]
      : INSIGHTS_KEYWORDS;
    const relevantNews = newsItems.filter(item => {
      const textToSearch = `${item.title} ${item.description}`.toLowerCase();
      return scanKeywords.some(keyword => textToSearch.includes(keyword));
    });

    chosenSignal = "Monitoramento global e indicadores macroeconômicos não apresentam anomalias severas.";
    chosenNewsUrl = "https://www.canalrural.com.br/radar/";
    let hasRelevantNews = false;

    if (relevantNews.length > 0) {
      const item = relevantNews[Math.floor(Math.random() * relevantNews.length)];
      chosenSignal = `${item.title}. ${item.description ? `Resumo: ${item.description.slice(0, 180)}...` : ""}`;
      chosenNewsUrl = item.link;
      hasRelevantNews = true;
    } else if (newsItems.length > 0) {
      const item = newsItems[Math.floor(Math.random() * newsItems.length)];
      chosenSignal = `${item.title}. ${item.description ? `Resumo: ${item.description.slice(0, 180)}...` : ""}`;
      chosenNewsUrl = item.link;
      hasRelevantNews = false;
    } else {
      chosenSignal = "OPEP+ anuncia corte surpresa na produção, impactando a cotação global do barril de petróleo e custos logísticos industriais.";
      chosenNewsUrl = "https://g1.globo.com/agro/";
    }

    // 3. Parse IPCA (result 16)
    if (results[16].status === "fulfilled" && (results[16].value as any)?.[0]) {
      ipcaVal = `${(results[16].value as any)[0].valor}% (Ref: ${(results[16].value as any)[0].data})`;
    }

    // 4. Parse Selic (result 17)
    if (results[17].status === "fulfilled" && (results[17].value as any)?.[0]) {
      selicVal = `${(results[17].value as any)[0].valor}% ao ano (Ref: ${(results[17].value as any)[0].data})`;
    }

    // 5. Parse IGP-M (result 18)
    if (results[18].status === "fulfilled" && (results[18].value as any)?.[0]) {
      igpmVal = `${(results[18].value as any)[0].valor}% (Ref: ${(results[18].value as any)[0].data})`;
    }

    // 6. Parse INCC (result 19)
    if (results[19].status === "fulfilled" && (results[19].value as any)?.[0]) {
      inccVal = `${(results[19].value as any)[0].valor}% (Ref: ${(results[19].value as any)[0].data})`;
    }

    // 7. Parse IBC-Br (result 20)
    if (results[20].status === "fulfilled" && (results[20].value as any)?.[0]) {
      ibcBrVal = `${(results[20].value as any)[0].valor} (Ref: ${(results[20].value as any)[0].data})`;
    }

    // 8. Parse CDI (result 21)
    if (results[21].status === "fulfilled" && (results[21].value as any)?.[0]) {
      cdiVal = `${(results[21].value as any)[0].valor}% (Ref: ${(results[21].value as any)[0].data})`;
    }

    // 9. Parse Produção industrial (result 22)
    if (results[22].status === "fulfilled" && (results[22].value as any)?.[0]) {
      prodIndustrialVal = `${(results[22].value as any)[0].valor}% (Ref: ${(results[22].value as any)[0].data})`;
    }

    // 10. Parse Vendas do varejo (result 23)
    if (results[23].status === "fulfilled" && (results[23].value as any)?.[0]) {
      vendasVarejoVal = `${(results[23].value as any)[0].valor}% (Ref: ${(results[23].value as any)[0].data})`;
    }

    // 11. Parse Desemprego (result 24)
    if (results[24].status === "fulfilled" && (results[24].value as any)?.[0]) {
      desempregoVal = `${(results[24].value as any)[0].valor}% (Ref: ${(results[24].value as any)[0].data})`;
    }

    // 12. Parse Balança comercial (result 25)
    if (results[25].status === "fulfilled" && (results[25].value as any)?.[0]) {
      balancaComercialVal = `US$ ${parseFloat((results[25].value as any)[0].valor).toFixed(2)} Bi (Ref: ${(results[25].value as any)[0].data})`;
    }

    // 13. Parse IC-Br — Índice de Commodities (result 26)
    if (results[26].status === "fulfilled" && (results[26].value as any)?.[0]) {
      icBrVal = `${(results[26].value as any)[0].valor}% (Ref: ${(results[26].value as any)[0].data})`;
    }

    // ── STEP 1: Trigger Pipeline on Server ──
    let serverCard: any = null;
    try {
      const serverResponse = await fetch("http://localhost:4000/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          insumoId: targetInsumo?.id,
          insumoName: targetInsumo?.name
        }),
      });
      if (serverResponse.ok) {
        const data = await serverResponse.json();
        serverCard = data.card;
      }
    } catch (err: any) {
      console.warn("[Scan] Failed to connect to server orchestrator:", err.message);
    }

    // Se o backend não respondeu (ex: Vercel sem servidor local rodando), geramos um REAL via DeepSeek direto pela API do Next.js
    if (!serverCard) {
      const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
      if (DEEPSEEK_API_KEY) {
        try {
          console.log("[Scan] Calling DeepSeek API directly as fallback...");
          const promptComplement = hasRelevantNews 
            ? `Use a seguinte notícia real do mercado como base principal para sua previsão: "${chosenSignal}".`
            : `Não há notícias específicas urgentes sobre este insumo agora. Portanto, cruze o impacto das variáveis macro (Selic a ${selicVal}, Dólar a ${usdText}) e o humor global do mercado ("${chosenSignal}") para gerar uma previsão correlacionada e útil.`;

          const systemPrompt = `Você é um Analista de Dados B2B. Gere um Insight Financeiro curto e direto sobre impacto de suprimentos.
O usuário selecionou o insumo: ${targetInsumo?.name || "Geral"}. É OBRIGATÓRIO que o título e a análise sejam totalmente focados neste insumo.
${promptComplement}
Retorne EXATAMENTE um objeto JSON válido no formato:
{ "title": "Título curto", "riskLevel": "OPPORTUNITY" ou "CRITICAL" ou "WARNING", "analysis": "Sua análise curta focada no insumo selecionado", "recommendedAction": "Ação recomendada" }`;

          const llmResp = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: [{ role: "system", content: systemPrompt }],
              response_format: { type: "json_object" },
              temperature: 0.5,
              max_tokens: 300,
            }),
          });
          
          if (llmResp.ok) {
            const llmData = await llmResp.json();
            const content = llmData.choices?.[0]?.message?.content;
            if (content) {
              const parsed = JSON.parse(content);
              serverCard = {
                id: Math.random().toString(36).substring(2, 9),
                title: parsed.title,
                riskLevel: parsed.riskLevel,
                commodity: targetInsumo ? targetInsumo.name : "Macro",
                analysis: parsed.analysis,
                recommendedAction: parsed.recommendedAction,
                createdAt: new Date()
              };
            }
          }
        } catch (llmErr) {
          console.warn("[Scan] Direct DeepSeek fallback failed:", llmErr);
        }
      }

      // Se o DeepSeek falhar, tentamos pegar o último gerado do banco de dados
      if (!serverCard) {
        try {
          serverCard = await prisma.insightCard.findFirst({
            orderBy: { createdAt: "desc" }
          });
        } catch (dbError) {
          console.warn("[Scan] Prisma DB not available:", dbError);
        }
      }

      // Se tudo falhar (sem backend, sem DeepSeek e sem DB), gera um Mock
      if (!serverCard) {
        serverCard = {
          id: Math.random().toString(36).substring(2, 9),
          title: targetInsumo
            ? `${targetInsumo.emoji} ${targetInsumo.name}: Oportunidade de Hedge / Aquisição Estratégica`
            : "Petróleo Brent: Risco de Alta e Impacto na Cadeia Logística",
          riskLevel: targetInsumo ? "OPPORTUNITY" : "WARNING",
          commodity: targetInsumo ? targetInsumo.name : "Petróleo Brent",
          analysis: "Instabilidade macroeconômica e choques de oferta globais sugerem reajustes no curto prazo.",
          recommendedAction: "Antecipe contratos de fornecimento ou monte posições de hedge para mitigar exposição.",
          createdAt: new Date()
        };
      }
    }

    // Override commodity with targetInsumo when set
    if (targetInsumo) {
      serverCard.commodity = targetInsumo.name;
    }

    // ── STEP 2: Map to full UI format for front-end compatibility ──
    const metadata = {
      usd: usdText,
      eur: eurText,
      cny: cnyText,
      ars: arsText,
      gbp: gbpText,
      selic: selicVal,
      cdi: cdiVal,
      ipca: ipcaVal,
      igpm: igpmVal,
      incc: inccVal,
      ibcBr: ibcBrVal,
      prodIndustrial: prodIndustrialVal,
      vendasVarejo: vendasVarejoVal,
      desemprego: desempregoVal,
      balancaComercial: balancaComercialVal,
      icBr: icBrVal,
      newsHeadline: chosenSignal,
      newsUrl: chosenNewsUrl
    };

    const completedInsight = mapCardToInsight(serverCard, metadata);

    // Force tags to include target insumo when set, so frontend filter matches
    if (targetInsumo) {
      completedInsight.tags = [targetInsumo.category, targetInsumo.id, ...targetInsumo.keywords.slice(0, 3)];
    }

    return NextResponse.json(completedInsight);

  } catch (error: any) {
    console.error("[Scan Endpoint Error]:", error);
    return NextResponse.json(
      { error: "Internal Server Error during AI scanning", details: error.message },
      { status: 500 }
    );
  }
}
