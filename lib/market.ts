import { getPriceHistory } from "@/lib/api"

export type BasketSeriesPoint = {
  date: string
  value: number
}

/**
 * Builds an equal-weight performance series for the current holdings using
 * daily closes. Each symbol is normalised to its first close in the window,
 * then averaged across symbols that have a bar for that date.
 */
export async function getBasketSeries(
  symbols: string[],
  days = 90
): Promise<BasketSeriesPoint[]> {
  const unique = [...new Set(symbols)].filter(Boolean)
  if (!unique.length) return []

  const results = await Promise.allSettled(
    unique.map((symbol) => getPriceHistory(symbol, days))
  )

  const byDate = new Map<string, { sum: number; count: number }>()

  for (const result of results) {
    if (result.status !== "fulfilled") continue
    const bars = [...result.value.bars].sort((a, b) =>
      a.date.localeCompare(b.date)
    )
    if (bars.length < 2) continue
    const first = bars[0]?.close_cents
    if (!first) continue

    for (const bar of bars) {
      const relative = ((bar.close_cents - first) / first) * 100
      const current = byDate.get(bar.date) ?? { sum: 0, count: 0 }
      current.sum += relative
      current.count += 1
      byDate.set(bar.date, current)
    }
  }

  const minimumCoverage = Math.min(3, unique.length)

  return [...byDate.entries()]
    .filter(([, value]) => value.count >= minimumCoverage)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({
      date,
      value: value.sum / value.count,
    }))
}
