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
import type { MarketQuote, PriceHistoryResponse } from "@/lib/api"
import {
  formatBps,
  formatCents,
  formatDateTime,
  formatPercent,
  pnlTone,
  shortSymbol,
} from "@/lib/format"
import { cn } from "cn"

const chartConfig = {
  close: {
    label: "Close",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function PriceChart({
  symbol,
  name,
  quote,
  history,
}: {
  symbol: string
  name?: string | null
  quote?: MarketQuote | null
  history: PriceHistoryResponse | null
}) {
  const [timeRange, setTimeRange] = React.useState<string | null>(null)
  const gradientId = React.useId().replace(/:/g, "")
  const bars = React.useMemo(() => history?.bars ?? [], [history])
  const activeRange = timeRange ?? "90d"

  const filtered = React.useMemo(() => {
    if (!bars.length) return []
    if (activeRange === "all") return bars
    const days = activeRange === "30d" ? 30 : 90
    const reference = bars[bars.length - 1]?.date
    if (!reference) return bars
    const start = new Date(reference)
    start.setDate(start.getDate() - days)
    return bars.filter((bar) => new Date(bar.date) >= start)
  }, [bars, activeRange])

  const first = filtered[0]
  const last = filtered[filtered.length - 1]
  const change =
    first && last && first.close_cents > 0
      ? ((last.close_cents - first.close_cents) / first.close_cents) * 100
      : 0
  const rangeLabel =
    activeRange === "30d" ? "30D" : activeRange === "all" ? "MAX" : "90D"
  const rangeLow = filtered.length
    ? Math.min(...filtered.map((bar) => bar.close_cents))
    : null
  const rangeHigh = filtered.length
    ? Math.max(...filtered.map((bar) => bar.close_cents))
    : null

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-baseline gap-x-2">
          <span>{shortSymbol(symbol)}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {name ?? symbol}
          </span>
        </CardTitle>
        <CardDescription>
          NSE · Daily closes{quote ? ` · ${quote.provider}` : ""}
        </CardDescription>
        <CardAction>
          <ToggleGroup
            multiple={false}
            value={[activeRange]}
            onValueChange={(value) => setTimeRange(value[0] ?? "90d")}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-3! @[640px]/card:flex"
          >
            <ToggleGroupItem value="30d">30D</ToggleGroupItem>
            <ToggleGroupItem value="90d">90D</ToggleGroupItem>
            <ToggleGroupItem value="all">Max</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={activeRange}
            onValueChange={(value) => {
              if (value !== null) setTimeRange(value)
            }}
          >
            <SelectTrigger
              className="flex w-24 @[640px]/card:hidden"
              size="sm"
              aria-label="Select a time range"
            >
              <SelectValue placeholder="90D" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="30d">30D</SelectItem>
              <SelectItem value="90d">90D</SelectItem>
              <SelectItem value="all">Max</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-2 sm:px-6 sm:pt-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3 px-2">
          <div>
            <div className="font-mono text-3xl font-semibold tracking-tight tabular-nums">
              {quote ? formatCents(quote.price_cents) : "—"}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span
                className={cn(
                  "font-mono font-medium tabular-nums",
                  pnlTone(quote?.day_change_bps)
                )}
              >
                {formatBps(quote?.day_change_bps, { sign: true })} today
              </span>
              <span>
                {formatPercent(change, { sign: true })} over {rangeLabel}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-1 text-right text-xs">
            <span className="text-muted-foreground">{rangeLabel} range</span>
            <span className="font-mono tabular-nums">
              {formatCents(rangeLow)} – {formatCents(rangeHigh)}
            </span>
            <span className="text-muted-foreground">Sessions</span>
            <span className="font-mono tabular-nums">
              {filtered.length || bars.length}
            </span>
            <span className="text-muted-foreground">Observed</span>
            <span className="font-mono tabular-nums">
              {formatDateTime(quote?.observed_at)}
            </span>
          </div>
        </div>

        {filtered.length > 1 ? (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[280px] w-full"
            initialDimension={{ width: 760, height: 280 }}
          >
            <AreaChart data={filtered} accessibilityLayer>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-close)"
                    stopOpacity={0.45}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-close)"
                    stopOpacity={0.02}
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
              <YAxis
                hide
                domain={["dataMin - 1000", "dataMax + 1000"]}
                tickFormatter={(value) => formatCents(Number(value))}
              />
              {first ? (
                <ReferenceLine
                  y={first.close_cents}
                  stroke="var(--border)"
                  strokeDasharray="4 4"
                />
              ) : null}
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
                        {formatCents(Number(value))}
                      </span>
                    )}
                  />
                }
              />
              <Area
                dataKey="close_cents"
                type="natural"
                fill={`url(#${gradientId})`}
                stroke="var(--color-close)"
                strokeWidth={2}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Price history is still warming up for {shortSymbol(symbol)}.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
