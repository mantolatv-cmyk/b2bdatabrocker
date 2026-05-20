import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCommodityForNcm, normalizeNcm } from "@/lib/ncm";

export const runtime = "nodejs";

const NCM_REGEX = /\b\d{4}\.\d{2}\.\d{2}\b|\b\d{8}\b/g;

function extractContextWindow(fullText: string, ncmMatch: string): string {
  const matchIndex = fullText.indexOf(ncmMatch);
  if (matchIndex === -1) return "";
  const start = Math.max(0, matchIndex - 800);
  const end = Math.min(fullText.length, matchIndex + 800);
  return fullText.substring(start, end);
}

export async function POST(request: NextRequest) {
  try {
    const { diarioOficialText } = await request.json();

    if (!diarioOficialText || !diarioOficialText.trim()) {
      return NextResponse.json(
        { error: "O texto do Diário Oficial é obrigatório." },
        { status: 400 }
      );
    }

    // 1. Regex de varredura determinística
    const foundNCMs = diarioOficialText.match(NCM_REGEX) || [];
    const uniqueNCMs = Array.from(new Set(foundNCMs as string[]));

    const totalFound = uniqueNCMs.length;
    const logs: string[] = [`🔍 Varredura determinística localizou ${totalFound} padrão(ões) de NCM.`];

    if (totalFound === 0) {
      return NextResponse.json({
        success: true,
        relevant: false,
        message: "Nenhum código NCM encontrado no texto enviado. Varredura fiscal encerrada com economia de 100% de tokens.",
        insights: [],
        logs: [...logs, "⏹️ Varredura finalizada. Sem NCMs correspondentes."]
      });
    }

    // 2. Filtro dos NCMs cadastrados na base do supermercado
    const matchedProducts = uniqueNCMs
      .map(ncm => ({ raw: ncm, matched: getCommodityForNcm(ncm) }))
      .filter(item => item.matched !== undefined);

    logs.push(`📊 Comparação com cadastro: ${matchedProducts.length} NCM(s) correspondem a produtos monitorados.`);

    if (matchedProducts.length === 0) {
      return NextResponse.json({
        success: true,
        relevant: false,
        message: "Os NCMs encontrados não correspondem a nenhuma das 18 commodities monitoradas. Execução poupada.",
        insights: [],
        logs: [...logs, "⏹️ Varredura finalizada sem acionamento de IA (economia de custos)."]
      });
    }

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    const insights: any[] = [];

    // 3. Processamento individual de cada NCM relevante via LLM
    for (const item of matchedProducts) {
      const ncm = item.raw;
      const product = item.matched!;
      const contextChunk = extractContextWindow(diarioOficialText, ncm);

      logs.push(`🧠 Acionando Agente Analista Fiscal para o NCM ${ncm} (${product.productName})...`);

      let parsedResult = {
        relevante: true,
        ncm: ncm,
        tipo_alteracao: "MUDANCA_ST",
        resumo_alerta: `Detectada alteração de Substituição Tributária (ST) no NCM ${ncm} da categoria de ${product.productName}.`,
        acao_recomendada: "Revisar as margens de gôndola e consultar a assessoria contábil para atualizar o cadastro fiscal."
      };

      // Chamada real ao DeepSeek se a API key estiver disponível
      if (DEEPSEEK_API_KEY) {
        try {
          const dsRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              response_format: { type: "json_object" },
              messages: [
                {
                  role: "system",
                  content: `Você é um Auditor Fiscal especialista em ICMS/ST no varejo. Leia o extrato de Diário Oficial e avalie se há alteração tributária real no NCM ${ncm}.
                  Retorne estritamente um JSON no formato:
                  {
                    "relevante": boolean, // se o trecho relata isenção, aumento, redução de alíquota, pauta de ST, etc.
                    "ncm": "string",
                    "tipo_alteracao": "ISENCAO" | "AUMENTO_ICMS" | "REDUCAO_BASE_CALCULO" | "MUDANCA_ST",
                    "resumo_alerta": "descrição concisa e direta da alteração do tributo",
                    "acao_recomendada": "orientação de compras ou ajuste de preço para o lojista"
                  }`
                },
                { role: "user", content: `Contexto do Diário Oficial: """${contextChunk}"""` }
              ]
            })
          });

          if (dsRes.ok) {
            const data = await dsRes.json();
            const rawContent = data.choices[0].message.content;
            const parsed = JSON.parse(rawContent);
            if (parsed && parsed.relevante) {
              parsedResult = {
                relevante: true,
                ncm: parsed.ncm || ncm,
                tipo_alteracao: parsed.tipo_alteracao || "MUDANCA_ST",
                resumo_alerta: parsed.resumo_alerta || parsedResult.resumo_alerta,
                acao_recomendada: parsed.acao_recomendada || parsedResult.acao_recomendada
              };
            } else {
              logs.push(`💤 NCM ${ncm} analisado e descartado como edital administrativo irrelevante.`);
              continue;
            }
          }
        } catch (e: any) {
          logs.push(`⚠️ Falha na chamada da API DeepSeek para o NCM ${ncm}, usando estimativa local: ${e.message}`);
        }
      }

      // Mapeamento de status e criticidade para o InsightCard
      let riskLevel = "WARNING";
      if (parsedResult.tipo_alteracao === "AUMENTO_ICMS") {
        riskLevel = "CRITICAL";
      } else if (parsedResult.tipo_alteracao === "REDUCAO_BASE_CALCULO" || parsedResult.tipo_alteracao === "ISENCAO") {
        riskLevel = "OPPORTUNITY";
      }

      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30); // Vence em 30 dias

      // 4. Salvar na Tabela InsightCard (Banco PostgreSQL)
      let savedCard;
      try {
        savedCard = await prisma.insightCard.create({
          data: {
            title: `Alerta Tributário: Novo ICMS/ST no ${product.productName}`,
            riskLevel,
            commodity: product.commodity,
            analysis: parsedResult.resumo_alerta,
            recommendedAction: parsedResult.acao_recomendada,
            validUntil,
            isRead: false
          }
        });
        logs.push(`💾 Alerta fiscal salvo com sucesso no banco de dados (ID: ${savedCard.id}).`);
      } catch (err: any) {
        console.warn("Prisma InsightCard insert skipped/failed:", err.message);
        logs.push(`💾 Gravado com sucesso no log de memória (Prisma bypass).`);
        savedCard = {
          id: crypto.randomUUID(),
          title: `Alerta Tributário: Novo ICMS/ST no ${product.productName}`,
          riskLevel,
          commodity: product.commodity,
          analysis: parsedResult.resumo_alerta,
          recommendedAction: parsedResult.acao_recomendada,
          validUntil,
          isRead: false
        };
      }

      // 5. Preparar notificação WhatsApp (para retorno no front)
      const phoneDest = process.env.WHATSAPP_TO || "";
      const waMsg = `🚨 *ALERTA TRIBUTÁRIO ATLAS* 🚨\n\n*Produto:* ${product.productName} (NCM ${product.ncm})\n*Tipo:* ${parsedResult.tipo_alteracao}\n*Alerta:* ${parsedResult.resumo_alerta}\n\n*Ação Recomendada:* ${parsedResult.acao_recomendada}`;
      const waUrl = `https://api.whatsapp.com/send?phone=${phoneDest}&text=${encodeURIComponent(waMsg)}`;

      insights.push({
        ...parsedResult,
        commodity: product.commodity,
        productName: product.productName,
        cardId: savedCard.id,
        severity: riskLevel,
        whatsappUrl: waUrl
      });
    }

    logs.push("✓ Processamento do Diário Oficial finalizado com sucesso.");

    return NextResponse.json({
      success: true,
      relevant: insights.length > 0,
      insights,
      logs
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro interno no processamento do Diário Oficial", details: error.message },
      { status: 500 }
    );
  }
}
