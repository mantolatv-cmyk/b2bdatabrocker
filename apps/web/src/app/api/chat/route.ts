/**
 * B2B Data Broker — RAG Chat Streaming Endpoint
 *
 * POST /api/chat
 * Body: { message: string, sessionId?: string }
 * Response: Server-Sent Events stream
 *
 * Pipeline:
 * 1. Generate embedding from user question
 * 2. Vector similarity search in PostgreSQL (pgvector)
 * 3. Build prompt with retrieved context
 * 4. Stream LLM response to client
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId } = body as { message?: string; sessionId?: string };

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!DEEPSEEK_API_KEY && !OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Nenhuma chave de API (DeepSeek ou OpenAI) configurada" },
        { status: 500 }
      );
    }

    let contextText = "Nenhum dado disponível na base de conhecimento no momento.";
    let sourcesUsed: string[] = [];

    // Só roda geração de embeddings se a chave da OpenAI estiver presente
    if (OPENAI_API_KEY) {
      try {
        // ── Step 1: Generate Embedding ──
        const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
            input: message,
          }),
        });

        if (embeddingResponse.ok) {
          const embeddingData = await embeddingResponse.json();
          const queryEmbedding: number[] = embeddingData.data?.[0]?.embedding;

          // ── Step 2: Vector Search (pgvector) ──
          try {
            const embeddingStr = `[${queryEmbedding.join(",")}]`;

            const results = (await prisma.$queryRawUnsafe(
              `SELECT vk.content, vk.summary,
                      1 - (vk.embedding <=> $1::vector) as similarity,
                      rd."sourceUrl" as source_url
               FROM vector_knowledge vk
               JOIN raw_data rd ON rd.id = vk."rawDataId"
               WHERE 1 - (vk.embedding <=> $1::vector) >= 0.7
               ORDER BY vk.embedding <=> $1::vector
               LIMIT 5`,
              embeddingStr
            )) as Array<{ content: string; summary: string | null; similarity: number; source_url: string | null }>;

            if (results.length > 0) {
              contextText = results
                .map((r, i) => `[Fonte ${i + 1}] (Relevância: ${(Number(r.similarity) * 100).toFixed(0)}%)\n${r.summary ?? r.content.slice(0, 1000)}`)
                .join("\n\n---\n\n");

              sourcesUsed = results
                .filter((r) => r.source_url)
                .map((r) => r.source_url!);
            }
          } catch (dbError) {
            console.warn("[RAG] DB not available, using LLM without context:", dbError);
          }
        }
      } catch (embError) {
        console.warn("[RAG] Embedding failed:", embError);
      }
    }

    // ── Step 3: Build RAG Prompt ──
    const systemPrompt = `Você é o Atlas, o assistente avançado de inteligência artificial do Terminal para Redes de Supermercados.
    Sua inteligência é impulsionada por 4 agentes virtuais especialistas (Agente Climático/Agro, Agente Logístico, Agente Fiscal e Agente Analista RAG) que cruzam dados de clima, fretes/combustíveis e impostos (como alíquotas de ICMS e Substituição Tributária - ST) para antecipar oscilações de preços nas gôndolas e projetar cenários ideais de abastecimento.
    Sua missão é ajudar diretores e gerentes de compras a prever riscos de alta e oportunidades de descontos para mais de 150 produtos e insumos de supermercado, incluindo mercearia, laticínios, carnes, bebidas, limpeza, higiene, hortifrúti, congelados e muito mais.
    Responda em português brasileiro. Seja extremamente amigável, direto, focado em estratégia de compras e pé no chão. Dê conselhos práticos e simples de entender, explicando de forma clara as correlações econômicas por trás dos aumentos e quedas.
    Destaque alertas de alta de custos em **negrito** e oportunidades de economia ou compras preventivas em *itálico*. Use tabelas ou marcadores markdown para facilitar a visualização de prazos e impactos de caixa.`;

    const userContent = contextText && contextText !== "Nenhum dado disponível na base de conhecimento no momento."
      ? `CONTEXTO DA BASE:\n${contextText}\n\nPERGUNTA DO ANALISTA: ${message}`
      : message;

    // ── Step 4: Stream LLM Response ──
    const useDeepSeek = !!DEEPSEEK_API_KEY;
    const apiUrl = useDeepSeek
      ? "https://api.deepseek.com/chat/completions"
      : "https://api.openai.com/v1/chat/completions";

    const apiToken = useDeepSeek ? DEEPSEEK_API_KEY : OPENAI_API_KEY;
    const apiModel = useDeepSeek ? "deepseek-chat" : (process.env.OPENAI_COMPLETION_MODEL ?? "gpt-4o");

    const completionResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        model: apiModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.5,
        max_tokens: 2048,
        stream: true,
      }),
    });

    if (!completionResponse.ok || !completionResponse.body) {
      const err = await completionResponse.text();
      console.error("[RAG] Completion error:", err);
      return NextResponse.json(
        { error: "Failed to generate response" },
        { status: 502 }
      );
    }

    // Transform OpenAI SSE stream into our response stream
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = completionResponse.body!.getReader();

        // Send sources metadata first
        if (sourcesUsed.length > 0) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "sources", sources: sourcesUsed })}\n\n`)
          );
        }

        try {
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data: ")) continue;

              const data = trimmed.slice(6);
              if (data === "[DONE]") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                break;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: "text", content })}\n\n`)
                  );
                }
              } catch {
                // Skip malformed chunks
              }
            }
          }
        } catch (error) {
          console.error("[RAG] Stream error:", error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[RAG] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
