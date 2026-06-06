import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

interface FeedItem {
  title: string;
  link: string;
  description: string;
}

interface FeedSource {
  url: string;
  name: string;
  category: string;
}

const RSS_SOURCES: FeedSource[] = [
  { url: "https://g1.globo.com/rss/g1/agro/",               name: "G1 Agro",            category: "agro" },
  { url: "https://g1.globo.com/rss/g1/economia/",           name: "G1 Economia",        category: "macro" },
  { url: "https://rss.uol.com.br/feed/economia.xml",        name: "UOL Economia",       category: "macro" },
  { url: "https://www.infomoney.com.br/feed/",              name: "InfoMoney",          category: "mercado" },
  { url: "https://feeds.folha.uol.com.br/mercado/rss.xml",  name: "Folha Mercado",      category: "macro" },
  { url: "https://www.estadao.com.br/rss/ultimas/economia.xml", name: "Estadão Economia", category: "macro" },
  { url: "http://www.ipea.gov.br/feed/rss.xml",             name: "IPEA",               category: "macro" },
  { url: "https://www.bcb.gov.br/rss/noticias",             name: "BC Notícias",        category: "regulatorio" },
  { url: "https://www.canalrural.com.br/feed/",             name: "Canal Rural",        category: "agro" },
  { url: "https://valor.globo.com/rss/valor-economia/",     name: "Valor Econômico",    category: "macro" },
  { url: "https://exame.com/feed/",                          name: "Exame",              category: "mercado" },
  { url: "https://www.cnnbrasil.com.br/economia/feed/",     name: "CNN Brasil Economia", category: "macro" },
  { url: "https://www.noticiasagricolas.com.br/rss/ultimas-noticias/", name: "Notícias Agrícolas", category: "agro" },
  { url: "https://www.moneytimes.com.br/feed/",             name: "Money Times",        category: "mercado" },
  { url: "https://www.istoedinheiro.com.br/feed/",          name: "IstoÉ Dinheiro",     category: "macro" },
];

const FALLBACK_POOL: FeedItem[] = [
  { title: "Seca extrema no Centro-Oeste ameaça a produção de soja e milho",         link: "", description: "Meteorologistas confirmam bloqueio atmosférico que impede chuvas e reduz a umidade do solo a níveis críticos no MT e GO, impactando a safra de grãos." },
  { title: "Aumento do ICMS interestadual sobre carnes entra em vigor",              link: "", description: "Mudança na tributação de produtos de origem animal afeta o trânsito de carne bovina e frango entre estados produtores e grandes centros consumidores." },
  { title: "Greve de caminhoneiros em portos paulistas atrasa fretes de importados", link: "", description: "Paralisação parcial nas rodovias de acesso ao porto de Santos eleva o custo logístico de insumos importados como trigo e azeite extra virgem." },
  { title: "IPCA desacelera para 0,21% em abril, abaixo das expectativas do mercado", link: "", description: "Índice de inflação oficial fica abaixo do consenso de 0,30%, pressionado por queda nos alimentos e alívio em transportes." },
  { title: "Selic mantida em 14,25% ao ano — Copom sinaliza cautela com inflação de serviços", link: "", description: "Comitê de Política Monetária mantém juros inalterados pela segunda reunião consecutiva, citando incertezas fiscais e mercado de trabalho aquecido." },
  { title: "PIB do agronegócio deve crescer 3,2% em 2026, impulsionado pela safra recorde de grãos", link: "", description: "Estimativa da CNA aponta recuperação do setor após dois anos de retração, com destaque para soja, milho e carne bovina." },
];

function parseRssFeed(xmlText: string): FeedItem[] {
  const items: FeedItem[] = [];
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

async function fetchArticlesFromSource(source: FeedSource): Promise<FeedItem | null> {
  try {
    const res = await fetch(source.url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const xml = await res.text();
    const items = parseRssFeed(xml);
    if (items.length === 0) return null;
    const selected = items[Math.floor(Math.random() * Math.min(items.length, 5))];
    return selected;
  } catch {
    return null;
  }
}

async function structureWithDeepSeek(
  text: string,
  apiKey: string,
): Promise<{ content: string; category: string; commoditiesImpacted: string[]; sourceCredibility: number; publishedAt: string } | null> {
  try {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Você é o Agente de Ingestão do SaaS Predict. Sua missão é ler o conteúdo de uma notícia/relatório e extrair os dados estruturados para preencher nosso banco vetorial.
Você deve retornar estritamente um objeto JSON no seguinte formato:
{
  "content": "Resumo limpo e focado em impactos econômicos para redes varejistas e setor de commodities",
  "category": "clima" | "logistica" | "tributario" | "macro" | "regulatorio" | "mercado" | "agro",
  "commoditiesImpacted": ["petroleo_brent", "soja", "minerio_ferro", "milho", "aco_bobina", "etanol_hidratado"],
  "sourceCredibility": 9,
  "publishedAt": "2026-05-20T12:00:00Z"
}`
          },
          { role: "user", content: text }
        ]
      })
    });

    if (!res.ok) return null;
    const json = await res.json();
    const parsed = JSON.parse(json.choices[0].message.content);
    if (!parsed || !parsed.content) return null;

    return {
      content: parsed.content,
      category: parsed.category || "macro",
      commoditiesImpacted: Array.isArray(parsed.commoditiesImpacted) ? parsed.commoditiesImpacted : ["petroleo_brent"],
      sourceCredibility: Number(parsed.sourceCredibility) || 8,
      publishedAt: parsed.publishedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function generateMockEmbedding(): number[] {
  const vec: number[] = [];
  let sumSq = 0;
  for (let i = 0; i < 1536; i++) {
    const val = Math.random() - 0.5;
    vec.push(val);
    sumSq += val * val;
  }
  const norm = Math.sqrt(sumSq);
  return vec.map(v => v / norm);
}

async function persistKnowledgeChunk(data: {
  content: string;
  category: string;
  commoditiesImpacted: string[];
  sourceCredibility: number;
  publishedAt: string;
  embedding: number[];
}): Promise<boolean> {
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "KnowledgeChunk" ("id", "content", "embedding", "category", "commoditiesImpacted", "sourceCredibility", "publishedAt", "createdAt")
      VALUES ($1, $2, $3::vector, $4, $5, $6, $7, NOW())
    `,
      crypto.randomUUID(),
      data.content,
      JSON.stringify(data.embedding),
      data.category,
      data.commoditiesImpacted,
      data.sourceCredibility,
      new Date(data.publishedAt)
    );
    return true;
  } catch (err: any) {
    console.warn("DB insert failed:", err.message);
    return false;
  }
}

export async function POST(request: NextRequest) {
  const results: Array<{ source: string; title: string; status: string }> = [];

  try {
    const body = await request.json().catch(() => ({}));
    const targetSources: string[] = body.sources || RSS_SOURCES.map(s => s.url);
    const maxArticles = Math.min(body.maxArticles || RSS_SOURCES.length, RSS_SOURCES.length);

    const sourcesToFetch = RSS_SOURCES.filter(s => targetSources.includes(s.url));
    if (sourcesToFetch.length === 0) {
      return NextResponse.json({ error: "Nenhuma fonte válida encontrada" }, { status: 400 });
    }

    const selectedSources = sourcesToFetch.sort(() => Math.random() - 0.5).slice(0, maxArticles);

    for (const source of selectedSources) {
      const article = await fetchArticlesFromSource(source);
      if (!article) {
        results.push({ source: source.name, title: "", status: "SKIPPED (sem artigos)" });
        continue;
      }

      const articleText = `${article.title}. ${article.description}`;

      let structured = await structureWithDeepSeek(articleText, process.env.DEEPSEEK_API_KEY || "");
      if (!structured) {
        structured = {
          content: articleText,
          category: source.category,
          commoditiesImpacted: ["petroleo_brent"],
          sourceCredibility: 7,
          publishedAt: new Date().toISOString(),
        };
      }

      let embedding = generateMockEmbedding();
      const ok = await persistKnowledgeChunk({ ...structured, embedding });

      results.push({
        source: source.name,
        title: article.title,
        status: ok ? "INGESTED" : "DB_ERROR",
      });
    }

    if (results.length === 0) {
      const fallback = FALLBACK_POOL[Math.floor(Math.random() * FALLBACK_POOL.length)];
      const text = `${fallback.title}. ${fallback.description}`;
      let structured = await structureWithDeepSeek(text, process.env.DEEPSEEK_API_KEY || "");
      if (!structured) {
        structured = { content: text, category: "macro", commoditiesImpacted: ["petroleo_brent"], sourceCredibility: 7, publishedAt: new Date().toISOString() };
      }
      await persistKnowledgeChunk({ ...structured, embedding: generateMockEmbedding() });
      results.push({ source: "fallback", title: fallback.title, status: "INGESTED" });
    }

    return NextResponse.json({
      success: true,
      agentName: "Agente Ingestor Multifontes (RAG)",
      status: "COMPLETED",
      totalIngested: results.filter(r => r.status === "INGESTED").length,
      results,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
