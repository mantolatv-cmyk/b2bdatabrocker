import { NextRequest, NextResponse } from "next/server";
import { ALL_INSUMOS, getInsumoById } from "@/lib/insumos";

export const runtime = "nodejs";

interface PriceHistoryItem {
  date: string;
  price: number;
}

function getProductInfo(materialId: string): { base: number; usdSensitivity: number } {
  const insumo = getInsumoById(materialId);
  if (!insumo) {
    return { base: 10.00, usdSensitivity: 0.10 };
  }
  const basePrice = insumo.basePrice / 100;
  const categorySensitivity: Record<string, number> = {
    mercearia: 0.18, laticinios: 0.12, acougue: 0.28,
    bebidas: 0.10, limpeza: 0.10, higiene: 0.06,
    hortifruti: 0.35, congelados: 0.15, utilidades: 0.08,
  };
  const usdSensitivity = categorySensitivity[insumo.category] ?? 0.15;
  return { base: basePrice, usdSensitivity };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const material = searchParams.get("material") || "arroz";
    const period = searchParams.get("period") || "30D"; // "7D" or "30D"

    const limit = period === "7D" ? 7 : 30;

    // Fetch USD-BRL rates for the last 30 days to build real fluctuations
    let usdHistory: any[] = [];
    try {
      const res = await fetch("https://economia.awesomeapi.com.br/json/daily/USD-BRL/30");
      if (res.ok) {
        usdHistory = await res.json();
      }
    } catch (e) {
      console.warn("Could not fetch real currency rates for prices API, using fallback:", e);
    }

    const prodInfo = getProductInfo(material.toLowerCase());
    const basePrice = prodInfo.base;
    const sensitivity = prodInfo.usdSensitivity;

    const data: PriceHistoryItem[] = [];
    const now = new Date();

    // Map USD rates or use mathematical fallback
    for (let i = limit - 1; i >= 0; i--) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() - i);

      const dayStr = targetDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

      let rateChangeFactor = 1.0;
      if (usdHistory && usdHistory.length > 0) {
        // Map historical usd index
        const idx = Math.min(i, usdHistory.length - 1);
        const dayData = usdHistory[idx];
        if (dayData && dayData.bid) {
          const bidVal = parseFloat(dayData.bid);
          // Standard reference price R$ 5.00 for dollar
          const baseUsd = 5.00;
          rateChangeFactor = 1.0 + ((bidVal - baseUsd) / baseUsd) * sensitivity;
        }
      } else {
        // Mathematical fallback with pseudo-random walk
        const seed = Math.sin(targetDate.getTime()) * 0.05;
        rateChangeFactor = 1.0 + seed;
      }

      // Add a small daily micro-fluctuation noise (0.5% max)
      const dailyNoise = (Math.sin(targetDate.getDate() * 7) * 0.005);
      const calculatedPrice = parseFloat((basePrice * rateChangeFactor * (1.0 + dailyNoise)).toFixed(2));

      data.push({
        date: dayStr,
        price: calculatedPrice
      });
    }

    // Determine current trend based on the last two values
    let trend = "stable";
    if (data.length >= 2) {
      const last = data[data.length - 1].price;
      const prev = data[data.length - 2].price;
      if (last > prev * 1.002) trend = "high";
      else if (last < prev * 0.998) trend = "low";
    }

    return NextResponse.json({
      material,
      period,
      currentPrice: data[data.length - 1].price,
      trend,
      history: data
    });

  } catch (error: any) {
    console.error("[Prices API error]:", error);
    return NextResponse.json(
      { error: "Internal Server Error in Prices API", details: error.message },
      { status: 500 }
    );
  }
}
