import {
  ArrowLeftRightIcon,
  ReceiptTextIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"

import { NewTradeButton } from "@/components/new-trade-button"
import { StatCard } from "@/components/stat-card"
import { TradesTable } from "@/components/trades-table"
import { VolumeChart } from "@/components/volume-chart"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getStats, getTrades } from "@/lib/api"
import {
  formatCents,
  formatPercent,
  humanizeEnum,
} from "@/lib/format"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Trades",
}

export default async function TradesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const openTrade = params.trade === "1"

  const [stats, tradePage] = await Promise.all([
    getStats(),
    getTrades({ page_size: 200 }),
  ])

  const trades = tradePage.items
  const fees = trades.reduce((sum, trade) => sum + trade.fee_cents, 0)
  const realized = trades.reduce(
    (sum, trade) => sum + (trade.realized_pnl_cents ?? 0),
    0
  )
  const totalVolume =
    stats.trades.buy_volume_cents + stats.trades.sell_volume_cents
  const averageTrade =
    stats.trades.total > 0 ? totalVolume / stats.trades.total : 0
  const buyShare =
    totalVolume > 0 ? (stats.trades.buy_volume_cents / totalVolume) * 100 : 0

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
          <StatCard
            label="Total fills"
            value={stats.trades.total}
            change={`${stats.trades.buys} buys / ${stats.trades.sells} sells`}
            changeIcon={<ArrowLeftRightIcon />}
            tone="primary"
            footer={`Average fill ${formatCents(averageTrade)}`}
            subfooter={`${formatPercent(buyShare)} of volume on the buy side`}
          />
          <StatCard
            label="Buy volume"
            value={formatCents(stats.trades.buy_volume_cents, { compact: true })}
            change={`${stats.trades.buys} orders`}
            changeIcon={<TrendingUpIcon />}
            tone="positive"
            footer={formatCents(stats.trades.buy_volume_cents)}
            subfooter="Gross notional deployed"
          />
          <StatCard
            label="Sell volume"
            value={formatCents(stats.trades.sell_volume_cents, { compact: true })}
            change={`${stats.trades.sells} orders`}
            changeIcon={<TrendingDownIcon />}
            tone="neutral"
            footer={formatCents(stats.trades.sell_volume_cents)}
            subfooter={
              stats.trades.sells > 0
                ? "Gross notional exited"
                : "No sell fills recorded yet"
            }
          />
          <StatCard
            label="Execution costs"
            value={formatCents(fees)}
            change={`${truncateCount(trades.length, tradePage.total)} fills`}
            changeIcon={<ReceiptTextIcon />}
            tone="neutral"
            footer={`Realized P&L ${formatCents(realized, { sign: true })}`}
            subfooter={`Fees on the ${trades.length} most recent fills`}
          />
        </div>

        <div className="grid grid-cols-1 items-start gap-4 px-4 lg:px-6 @4xl/main:grid-cols-3">
          <div className="@4xl/main:col-span-2">
            <VolumeChart symbols={stats.top_symbols} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Execution mix</CardTitle>
              <CardDescription>
                How capital moved through the paper account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Buy volume</span>
                  <span className="font-mono font-medium tabular-nums">
                    {formatPercent(buyShare)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, Math.max(0, buyShare))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Buy {formatCents(stats.trades.buy_volume_cents)}
                  </span>
                  <span>
                    Sell {formatCents(stats.trades.sell_volume_cents)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">
                    Shares bought
                  </div>
                  <div className="mt-1 font-mono text-lg font-medium tabular-nums">
                    {stats.shares.bought.toFixed(2)}
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">Shares held</div>
                  <div className="mt-1 font-mono text-lg font-medium tabular-nums">
                    {stats.shares.held.toFixed(2)}
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">
                    First fill
                  </div>
                  <div className="mt-1 text-sm font-medium">
                    {stats.timestamps.first
                      ? humanizeEnum(
                          new Date(stats.timestamps.first).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short" }
                          )
                        )
                      : "—"}
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">Last fill</div>
                  <div className="mt-1 text-sm font-medium">
                    {stats.timestamps.last
                      ? humanizeEnum(
                          new Date(stats.timestamps.last).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short" }
                          )
                        )
                      : "—"}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                Source: {trades[0]?.source ?? "—"}. Every fill includes the
                engine&apos;s configured slippage and trading cost.
              </div>
            </CardContent>
          </Card>
        </div>

        <TradesTable
          trades={trades}
          headerActions={<NewTradeButton defaultOpen={openTrade} />}
        />
      </div>
    </div>
  )
}

function truncateCount(count: number, total: number) {
  return count < total ? `${count} of ${total}` : `${total}`
}
