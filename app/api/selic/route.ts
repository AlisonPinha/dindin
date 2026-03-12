import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

let cachedRate: { value: number; timestamp: number } | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function GET() {
  try {
    // Check cache
    if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_DURATION) {
      return NextResponse.json({ rate: cachedRate.value, cached: true });
    }

    // Fetch from BCB API
    const response = await fetch(
      "https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json",
      { next: { revalidate: 86400 } } // Next.js cache for 24h
    );

    if (!response.ok) {
      throw new Error(`BCB API error: ${response.status}`);
    }

    const data = await response.json();
    const annualRate = parseFloat(data[0]?.valor || "0");

    // Convert annual rate to monthly: (1 + annual/100)^(1/12) - 1
    const monthlyRate = (Math.pow(1 + annualRate / 100, 1 / 12) - 1) * 100;

    cachedRate = { value: monthlyRate, timestamp: Date.now() };

    return NextResponse.json({
      rate: monthlyRate,
      annualRate,
      cached: false,
      source: "BCB",
    });
  } catch (error) {
    logger.error("Failed to fetch Selic rate", error, { action: "fetch", resource: "selic" });

    // Fallback rate (Selic ~13.25% a.a. = ~1.04% a.m.)
    const fallbackMonthly = (Math.pow(1 + 13.25 / 100, 1 / 12) - 1) * 100;

    return NextResponse.json({
      rate: fallbackMonthly,
      annualRate: 13.25,
      cached: false,
      source: "fallback",
    });
  }
}
