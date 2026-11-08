import { Suspense } from "react"

import { BasketChart } from "@/components/basket-chart"
import { BudgetCard } from "@/components/budget-card"
import { EngineStatusCard } from "@/components/engine-status-card"
import { LedgerActivityCard } from "@/components/ledger-activity-card"
import { MarketPulseCard } from "@/components/market-pulse-card"
import { NewTradeButton } from "@/components/new-trade-button"
import { SectionCards } from "@/components/section-cards"
import { TopSymbolsCard } from "@/components/top-symbols-card"
import { TradesTable } from "@/components/trades-table"
import { Skeleton } from "@/components/ui/skeleton"
import { getDashboard, getLedger, getMovers } from "@/lib/api"
import { getBasketSeries } from "@/lib/market"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Overview",
}

async function BasketSection({ symbols }: { symbols: string[] }) {
  const series = await getBasketSeries(symbols)
  return <BasketChart series={series} symbols={symbols.length} />
}

function BasketFallback() {
  return <Skeleton className="h-[400px] rounded-xl" />
}

export default async function Page() {
  const [summary, movers, ledger] = await Promise.all([
    getDashboard(),
    getMovers(4).catch(() => null),
    getLedger({ page_size: 8 }).catch(() => null),
  ])
  const symbols = summary.portfolio.positions.map((position) => position.symbol)

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards summary={summary} />

        <div className="px-4 lg:px-6">
          <Suspense fallback={<BasketFallback />}>
            <BasketSection symbols={symbols} />
          </Suspense>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 px-4 lg:px-6 @4xl/main:grid-cols-2">
          <MarketPulseCard movers={movers} />
          <LedgerActivityCard
            entries={ledger?.items ?? null}
            cashCents={summary.portfolio.cash_cents}
          />
        </div>

        <TradesTable
          trades={summary.recent_trades}
          showViewAll
          headerActions={<NewTradeButton />}
        />

        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
          <BudgetCard
            budget={summary.portfolio.active_budget ?? summary.engine.budget ?? null}
          />
          <EngineStatusCard engine={summary.engine} />
          <TopSymbolsCard symbols={summary.stats.top_symbols} />
        </div>
      </div>
    </div>
  )
}
