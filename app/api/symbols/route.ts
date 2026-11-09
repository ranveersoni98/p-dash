import { NextResponse } from "next/server"

import { getSymbols } from "@/lib/api"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = (searchParams.get("q") ?? "").trim()
  const requestedLimit = Number(searchParams.get("limit") ?? 8)
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(20, Math.max(1, Math.floor(requestedLimit)))
    : 8

  if (!query) {
    return NextResponse.json({ symbols: [] })
  }

  try {
    const page = await getSymbols({ q: query, page_size: limit })
    return NextResponse.json({
      symbols: page.items.map((symbol) => ({
        symbol: symbol.symbol,
        name: symbol.name,
        source: symbol.source,
      })),
    })
  } catch (error) {
    return NextResponse.json(
      {
        symbols: [],
        error:
          error instanceof Error
            ? error.message
            : "Symbol search is unavailable.",
      },
      { status: 503 }
    )
  }
}
