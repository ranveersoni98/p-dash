"use client"

import { Bar, BarChart, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { TopTradedSymbol } from "@/lib/api"
import { formatCents, shortSymbol } from "@/lib/format"

const chartConfig = {
  volume_cents: {
    label: "Volume",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function VolumeChart({ symbols }: { symbols: TopTradedSymbol[] }) {
  const data = [...symbols]
    .sort((a, b) => b.volume_cents - a.volume_cents)
    .slice(0, 8)
    .map((symbol) => ({
      symbol: shortSymbol(symbol.symbol),
      volume_cents: symbol.volume_cents,
      trades: symbol.trades,
    }))

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Traded volume</CardTitle>
        <CardDescription>Notional by symbol across all fills.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length ? (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[260px] w-full"
            initialDimension={{ width: 760, height: 260 }}
          >
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 4, right: 12, top: 4, bottom: 4 }}
            >
              <XAxis type="number" dataKey="volume_cents" hide />
              <YAxis
                type="category"
                dataKey="symbol"
                width={86}
                tickLine={false}
                axisLine={false}
                className="text-xs"
              />
              <ChartTooltip
                cursor={{ fill: "var(--muted)" }}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, _name, item) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">
                          {item.payload?.trades ?? 0} trades
                        </span>
                        <span className="font-mono font-medium tabular-nums">
                          {formatCents(Number(value))}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar
                dataKey="volume_cents"
                fill="var(--color-volume_cents)"
                radius={[0, 4, 4, 0]}
                barSize={16}
                isAnimationActive={false}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            No trade volume yet.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
