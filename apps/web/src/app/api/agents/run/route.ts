import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const AGENT_SYSTEM_PROMPTS = {
  climatico: `Você é o Agente Climático & Agro do Terminal de Inteligência de Redes de Supermercados (Atlas Intelligence).
Sua única responsabilidade é analisar clima, chuvas, seca, geadas, safras, CONAB e boletins CEPEA para prever o custo de entrada e o abastecimento de produtos agrícolas do supermercado.
Foque estritamente em clima e produção agrícola. Forneça uma análise precisa e em linguagem leiga e direta para o Diretor de Compras do supermercado.`,

  logistico: `Você é o Agente Logístico & Econômico do Terminal de Inteligência de Redes de Supermercados (Atlas Intelligence).
Sua responsabilidade é rastrear custos logísticos, preços do óleo diesel da Petrobras, reajustes de frete rodoviário da ANTT, pedágios, custos portuários e cotações de câmbio (Dólar/Euro) para projetar impactos no frete final dos produtos.
Foque estritamente em logística, combustíveis e câmbio. Forneça uma análise prática, leiga e direta para o Diretor de Compras do supermercado.`,

  fiscal: `Você é o Agente de Política Fiscal do Terminal de Inteligência de Redes de Supermercados (Atlas Intelligence).
Sua responsabilidade é monitorar Diários Oficiais Estaduais e Federais, buscando alterações tributárias, decretos de ICMS, regimes de Substituição Tributária (ST) e isenções fiscais na cesta básica nacional.
Foque estritamente em tributos, ICMS, Substituição Tributária e legislação fiscal de alimentos. Forneça uma análise clara, leiga e direta para o Diretor de Compras do supermercado.`,

  analista: `Você é o Agente Analista (Cérebro RAG) do Terminal de Inteligência de Redes de Supermercados (Atlas Intelligence).
Sua responsabilidade é correlacionar variáveis de múltiplos agentes (clima, logística, tributos e inflação) com o estoque e as margens do supermercado para traçar janelas ideais de reabastecimento.
Foque em correlação cruzada, risco financeiro de custo e oportunidades de compras em lote. Forneça uma análise leiga, focada em fluxo de caixa e margens.`
};

export async function POST(request: NextRequest) {
  try {
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "DeepSeek API key not configured" },
        { status: 500 }
      );
    }

    const { agentId, targetInput } = await request.json();

    if (!agentId || !targetInput) {
      return NextResponse.json(
        { error: "Missing agentId or targetInput parameter" },
        { status: 400 }
      );
    }

    const systemPrompt = AGENT_SYSTEM_PROMPTS[agentId as keyof typeof AGENT_SYSTEM_PROMPTS];
    if (!systemPrompt) {
      return NextResponse.json(
        { error: "Invalid agentId" },
        { status: 400 }
      );
    }

    // Call AwesomeAPI to get live currency rates for context
    let usdRate = "R$ 5,06";
    try {
      const curRes = await fetch("https://economia.awesomeapi.com.br/last/USD-BRL").then(r => r.json());
      if (curRes?.USDBRL) {
        usdRate = `R$ ${parseFloat(curRes.USDBRL.bid).toFixed(2)}`;
      }
    } catch (_) {}

    const userPrompt = `Foco da Análise do Agente: "${targetInput}"
Contexto Macroeconômico Atual: Dólar Comercial em ${usdRate}.

Realize a análise focada na sua especialidade. Você deve retornar um objeto JSON contendo exatamente os seguintes campos:
1. "agentName": O seu nome correspondente.
2. "status": "COMPLETED" ou "ALERT".
3. "findings": Um parágrafo resumindo as descobertas específicas de forma clara, direta e leiga para o Diretor de Compras.
4. "prediction": A previsão exata e simplificada de preço do produto ou impacto operacional.
5. "recommendation": A recomendação estratégica de compras ou ação de curto prazo.
6. "confidence": Um número decimal entre 0.50 e 0.99.
7. "sources": Uma lista de 2 a 3 fontes reais que fundamentam sua análise.

A resposta deve ser APENAS o JSON puro, sem marcações ou comentários adicionais.`;

    const deepseekResponse = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      }),
    });

    if (!deepseekResponse.ok) {
      const err = await deepseekResponse.text();
      console.error("[DeepSeek Agent Error]:", err);
      return NextResponse.json(
        { error: "DeepSeek API error" },
        { status: 502 }
      );
    }

    const responseData = await deepseekResponse.json();
    const content = responseData.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "No content returned from DeepSeek API" },
        { status: 502 }
      );
    }

    const parsedResponse = JSON.parse(content.trim());
    return NextResponse.json(parsedResponse);

  } catch (error: any) {
    console.error("[Agent Execution Route Error]:", error);
    return NextResponse.json(
      { error: "Internal Server Error during agent run", details: error.message },
      { status: 500 }
    );
  }
}
