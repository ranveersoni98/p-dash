"use client"

import * as React from "react"
import { Cell, Pie, PieChart } from "recharts"

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
import type { PositionDetail } from "@/lib/api"
import { formatCents, formatPercent, shortSymbol } from "@/lib/format"

const colors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "oklch(0.55 0.06 160)",
  "oklch(0.62 0.04 160)",
]

const chartConfig = {
  value: {
    label: "Value",
  },
} satisfies ChartConfig

type AllocationSlice = {
  name: string
  value: number
  color: string
  symbol?: string
}

export function AllocationChart({
  positions,
  cashCents,
}: {
  positions: PositionDetail[]
  cashCents: number
}) {
  const data = React.useMemo(() => {
    const holdings = positions
      .filter((position) => (position.market_value_cents ?? 0) > 0)
      .sort(
        (a, b) => (b.market_value_cents ?? 0) - (a.market_value_cents ?? 0)
      )

    const top = holdings.slice(0, 6)
    const rest = holdings.slice(6)
    const otherValue = rest.reduce(
      (sum, position) => sum + (position.market_value_cents ?? 0),
      0
    )

    const slices: AllocationSlice[] = top.map((position, index) => ({
      name: shortSymbol(position.symbol),
      symbol: position.symbol,
      value: position.market_value_cents ?? 0,
      color: colors[index % colors.length] ?? "var(--chart-1)",
    }))

    if (otherValue > 0) {
      slices.push({
        name: `Other (${rest.length})`,
        value: otherValue,
        color: colors[6] ?? "var(--chart-5)",
      })
    }

    if (cashCents > 0) {
      slices.push({
        name: "Cash",
        value: cashCents,
        color: "var(--muted-foreground)",
      })
    }

    return slices
  }, [positions, cashCents])

  const total = data.reduce((sum, slice) => sum + slice.value, 0)

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Allocation</CardTitle>
        <CardDescription>
          <span className="hidden @[420px]/card:block">
            Live market value plus uninvested cash
          </span>
          <span className="@[420px]/card:hidden">Market value + cash</span>
        </CardDescription>
        <div className="col-start-2 row-span-2 row-start-1 justify-self-end text-right">
          <div className="text-xs text-muted-foreground">Book</div>
          <div className="font-mono text-sm font-medium tabular-nums">
            {formatCents(total, { compact: true })}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2 @[520px]/card:grid-cols-[220px_1fr] @[520px]/card:items-center">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-[220px] w-full"
          initialDimension={{ width: 220, height: 220 }}
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  nameKey="name"
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-3">
                      <span className="text-muted-foreground">{name}</span>
                      <span className="font-mono font-medium tabular-nums">
                        {formatCents(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={88}
              paddingAngle={2}
              strokeWidth={0}
              isAnimationActive={false}
            >
              {data.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="grid gap-2">
          {data.map((slice) => (
            <div
              key={slice.name}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="truncate">{slice.name}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2 text-xs">
                <span className="font-mono text-muted-foreground tabular-nums">
                  {formatPercent(total > 0 ? (slice.value / total) * 100 : 0)}
                </span>
                <span className="w-16 text-right font-mono tabular-nums">
                  {formatCents(slice.value, { compact: true })}
                </span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
