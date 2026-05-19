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

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

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

    if (!embeddingResponse.ok) {
      const err = await embeddingResponse.text();
      console.error("[RAG] Embedding error:", err);
      return NextResponse.json(
        { error: "Failed to generate embedding" },
        { status: 502 }
      );
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding: number[] = embeddingData.data?.[0]?.embedding;

    // ── Step 2: Vector Search (pgvector) ──
    // NOTE: In production, use Prisma client here.
    // This is a simplified version that works without DB connection for demo.
    let contextText = "";
    let sourcesUsed: string[] = [];

    try {
      // Dynamic import to avoid build errors when DB isn't available
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();

      const embeddingStr = `[${queryEmbedding.join(",")}]`;

      const results = (await prisma.$queryRawUnsafe(
        `SELECT vk.content, vk.summary,
                1 - (vk.embedding <=> $1::vector) as similarity,
                rd.source_url
         FROM vector_knowledge vk
         JOIN raw_data rd ON rd.id = vk.raw_data_id
         WHERE 1 - (vk.embedding <=> $1::vector) >= 0.7
         ORDER BY vk.embedding <=> $1::vector
         LIMIT 5`,
        embeddingStr
      )) as Array<{ content: string; summary: string | null; similarity: number; source_url: string | null }>;

      contextText = results
        .map((r, i) => `[Fonte ${i + 1}] (Relevância: ${(Number(r.similarity) * 100).toFixed(0)}%)\n${r.summary ?? r.content.slice(0, 1000)}`)
        .join("\n\n---\n\n");

      sourcesUsed = results
        .filter((r) => r.source_url)
        .map((r) => r.source_url!);

      await prisma.$disconnect();
    } catch (dbError) {
      console.warn("[RAG] DB not available, using LLM without context:", dbError);
      contextText = "Nenhum dado disponível na base de conhecimento no momento.";
    }

    // ── Step 3: Build RAG Prompt ──
    const systemPrompt = `Você é o Atlas, analista de inteligência competitiva B2B do Terminal de Inteligência.
Responda em português brasileiro. Seja direto, objetivo e acionável.
Base suas respostas no contexto fornecido. Se não houver dados suficientes, diga claramente.
Use markdown para formatar. Destaque riscos em **negrito** e oportunidades em *itálico*.`;

    const userContent = contextText
      ? `CONTEXTO DA BASE:\n${contextText}\n\nPERGUNTA: ${message}`
      : message;

    // ── Step 4: Stream LLM Response ──
    const completionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_COMPLETION_MODEL ?? "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.7,
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
