"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { formatPercent, pnlTone } from "@/lib/format"
import { cn } from "cn"

export type BasketPoint = {
  date: string
  value: number
}

const chartConfig = {
  basket: {
    label: "Basket",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function BasketChart({
  series,
  symbols,
}: {
  series: BasketPoint[]
  symbols: number
}) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState<string | null>(null)
  const activeRange = timeRange ?? (isMobile ? "30d" : "90d")
  const gradientId = React.useId().replace(/:/g, "")

  const filtered = React.useMemo(() => {
    if (!series.length) return []
    const reference = series[series.length - 1]?.date
    if (!reference) return series
    const days = activeRange === "7d" ? 7 : activeRange === "30d" ? 30 : 90
    const start = new Date(reference)
    start.setDate(start.getDate() - days)
    const window = series.filter((point) => new Date(point.date) >= start)
    const base = window[0]?.value ?? 0
    const baseFactor = 1 + base / 100

    return window.map((point) => ({
      date: point.date,
      value:
        baseFactor === 0
          ? 0
          : ((1 + point.value / 100) / baseFactor - 1) * 100,
    }))
  }, [series, activeRange])

  const windowReturn = filtered[filtered.length - 1]?.value ?? 0
  const rangeLabel =
    activeRange === "7d" ? "7D" : activeRange === "30d" ? "30D" : "90D"

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Portfolio basket</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Equal-weight trend across {symbols} holdings
          </span>
          <span className="@[540px]/card:hidden">
            {symbols} holdings · {rangeLabel}
          </span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            multiple={false}
            value={[activeRange]}
            onValueChange={(value) => {
              setTimeRange(value[0] ?? "90d")
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={activeRange}
            onValueChange={(value) => {
              if (value !== null) setTimeRange(value)
            }}
          >
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a time range"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {filtered.length > 1 ? (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
            initialDimension={{ width: 900, height: 250 }}
          >
            <AreaChart data={filtered} accessibilityLayer>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-basket)"
                    stopOpacity={0.55}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-basket)"
                    stopOpacity={0.04}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 4" />
              <YAxis
                width={52}
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                tickFormatter={(value) =>
                  `${Number(value) > 0 ? "+" : ""}${Number(value).toFixed(1)}%`
                }
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    }
                    formatter={(value) => (
                      <span className="font-mono font-medium tabular-nums">
                        {Number(value) >= 0 ? "+" : ""}
                        {Number(value).toFixed(2)}%
                      </span>
                    )}
                  />
                }
              />
              <Area
                dataKey="value"
                type="natural"
                fill={`url(#${gradientId})`}
                stroke="var(--color-basket)"
                strokeWidth={2}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[250px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Market history is still warming up.
          </div>
        )}
        <div className="flex items-center justify-between gap-4 px-2 pt-3 pb-1 text-xs text-muted-foreground">
          <span>Current holdings, equal-weighted from daily closes.</span>
          <span
            className={cn(
              "font-mono font-medium tabular-nums",
              pnlTone(windowReturn)
            )}
          >
            {formatPercent(windowReturn, { sign: true })} · {rangeLabel}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
