import Link from "next/link"
import {
  ArrowUpRightIcon,
  BriefcaseBusinessIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react"

import { AllocationChart } from "@/components/allocation-chart"
import { NewTradeButton } from "@/components/new-trade-button"
import { PositionsTable } from "@/components/positions-table"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getPositions } from "@/lib/api"
import {
  formatBps,
  formatCents,
  formatDateTime,
  pnlTone,
  shortSymbol,
} from "@/lib/format"
import { cn } from "cn"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Portfolio",
}

export default async function PortfolioPage() {
  const book = await getPositions()
  const positions = book.positions

  const pnlBps =
    book.total_cost_basis_cents > 0
      ? (book.total_unrealized_pnl_cents / book.total_cost_basis_cents) * 10_000
      : 0
  const investedBps =
    book.total_value_cents > 0
      ? (book.equity_cents / book.total_value_cents) * 10_000
      : 0
  const winners = positions.filter(
    (position) => (position.unrealized_pnl_cents ?? 0) > 0
  ).length
  const losers = positions.filter(
    (position) => (position.unrealized_pnl_cents ?? 0) < 0
  ).length
  const averagePosition =
    positions.length > 0 ? book.equity_cents / positions.length : 0

  const ranked = [...positions]
    .filter(
      (position) =>
        position.unrealized_pnl_bps !== null &&
        position.unrealized_pnl_bps !== undefined
    )
    .sort((a, b) => (b.unrealized_pnl_bps ?? 0) - (a.unrealized_pnl_bps ?? 0))
  const best = ranked[0]
  const worst = ranked[ranked.length - 1]

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
          <StatCard
            label="Book value"
            value={formatCents(book.total_value_cents)}
            change={`${positions.length} open`}
            changeIcon={<BriefcaseBusinessIcon />}
            tone="primary"
            footer={`Equity ${formatCents(book.equity_cents)}`}
            subfooter={`Cash ${formatCents(book.cash_cents)}`}
          />
          <StatCard
            label="Unrealized P&L"
            value={formatCents(book.total_unrealized_pnl_cents, { sign: true })}
            valueClassName={pnlTone(book.total_unrealized_pnl_cents)}
            change={formatBps(pnlBps, { sign: true })}
            changeIcon={
              book.total_unrealized_pnl_cents >= 0 ? (
                <TrendingUpIcon />
              ) : (
                <TrendingDownIcon />
              )
            }
            tone={
              book.total_unrealized_pnl_cents >= 0 ? "positive" : "negative"
            }
            footer={`Cost basis ${formatCents(book.total_cost_basis_cents)}`}
            subfooter={
              book.total_cost_basis_cents > 0
                ? `${winners} winners · ${losers} losers`
                : "No invested capital yet"
            }
          />
          <StatCard
            label="Cash available"
            value={formatCents(book.cash_cents)}
            change={formatBps(investedBps)}
            changeIcon={<WalletIcon />}
            tone="primary"
            footer={`Deployed across ${positions.length} positions`}
            subfooter={`Average position ${formatCents(averagePosition)}`}
          />
          <StatCard
            label="Open holdings"
            value={positions.length}
            change={`${winners} up / ${losers} down`}
            tone="neutral"
            footer={`Updated ${formatDateTime(book.generated_at)}`}
            subfooter={`${formatCents(book.equity_cents, { compact: true })} at market`}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @4xl/main:grid-cols-2">
          <AllocationChart positions={positions} cashCents={book.cash_cents} />

          <Card>
            <CardHeader>
              <CardTitle>Book health</CardTitle>
              <CardDescription>
                Exposure, cost basis and the portfolio&apos;s best and worst
                positions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">
                    Market value
                  </div>
                  <div className="mt-1 font-mono text-lg font-medium tabular-nums">
                    {formatCents(book.equity_cents)}
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">
                    Cost basis
                  </div>
                  <div className="mt-1 font-mono text-lg font-medium tabular-nums">
                    {formatCents(book.total_cost_basis_cents)}
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">
                    Unrealized P&L
                  </div>
                  <div
                    className={cn(
                      "mt-1 font-mono text-lg font-medium tabular-nums",
                      pnlTone(book.total_unrealized_pnl_cents)
                    )}
                  >
                    {formatCents(book.total_unrealized_pnl_cents, {
                      sign: true,
                    })}
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">Invested</div>
                  <div className="mt-1 font-mono text-lg font-medium tabular-nums">
                    {formatBps(investedBps)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Best performer</span>
                  <span>Unrealized return</span>
                </div>
                {best ? (
                  <Link
                    href={`/dashboard/market?symbol=${encodeURIComponent(best.symbol)}`}
                    className="flex items-center justify-between gap-2 rounded-lg border p-2 text-sm transition-colors hover:bg-muted/50"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <TrendingUpIcon className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span className="truncate font-medium">
                        {shortSymbol(best.symbol)}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-xs text-emerald-600 tabular-nums dark:text-emerald-400">
                      {formatBps(best.unrealized_pnl_bps, { sign: true })}
                    </span>
                  </Link>
                ) : null}
                {worst && worst.symbol !== best?.symbol ? (
                  <Link
                    href={`/dashboard/market?symbol=${encodeURIComponent(worst.symbol)}`}
                    className="flex items-center justify-between gap-2 rounded-lg border p-2 text-sm transition-colors hover:bg-muted/50"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <TrendingDownIcon className="size-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                      <span className="truncate font-medium">
                        {shortSymbol(worst.symbol)}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-xs text-rose-600 tabular-nums dark:text-rose-400">
                      {formatBps(worst.unrealized_pnl_bps, { sign: true })}
                    </span>
                  </Link>
                ) : null}
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="px-0 text-muted-foreground"
                nativeButton={false}
                render={<Link href="/dashboard/trades" />}
              >
                Review fills
              </Button>
              <ArrowUpRightIcon className="size-4 text-muted-foreground" />
            </CardFooter>
          </Card>
        </div>

        <PositionsTable
          positions={positions}
          headerActions={<NewTradeButton />}
        />
      </div>
    </div>
  )
}
