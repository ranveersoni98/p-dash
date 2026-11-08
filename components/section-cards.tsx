import {
  BriefcaseBusinessIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react"

import { StatCard } from "@/components/stat-card"
import type { DashboardSummary } from "@/lib/api"
import {
  formatBps,
  formatCents,
  formatSignedCents,
  pnlTone,
} from "@/lib/format"

export function SectionCards({ summary }: { summary: DashboardSummary }) {
  const { money } = summary.stats
  const { portfolio, engine } = summary
  const { circuit } = engine

  const profit = money.profit_cents ?? 0
  const profitBps =
    money.initial_cents > 0 ? (profit / money.initial_cents) * 10_000 : 0
  const deployedBps =
    portfolio.total_value_cents > 0
      ? (portfolio.equity_cents / portfolio.total_value_cents) * 10_000
      : 0
  const profitTone = money.profit_cents === null
    ? "neutral"
    : profit >= 0
      ? "positive"
      : "negative"
  const dayTone = circuit.day_pnl_cents >= 0 ? "positive" : "negative"

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <StatCard
        label="Portfolio value"
        value={formatCents(money.total_cents)}
        change={
          money.profit_cents === null
            ? "Valuation pending"
            : formatBps(profitBps, { sign: true })
        }
        changeIcon={
          money.profit_cents === null ? undefined : profit >= 0 ? (
            <TrendingUpIcon />
          ) : (
            <TrendingDownIcon />
          )
        }
        tone={profitTone}
        footer={`Cash ${formatCents(portfolio.cash_cents)}`}
        footerIcon={<WalletIcon className="size-4" />}
        subfooter={`Equity ${formatCents(portfolio.equity_cents)}`}
      />
      <StatCard
        label="Day P&L"
        value={formatSignedCents(circuit.day_pnl_cents)}
        valueClassName={pnlTone(circuit.day_pnl_cents)}
        change={formatBps(circuit.day_pnl_bps, { sign: true })}
        changeIcon={
          circuit.day_pnl_cents >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />
        }
        tone={dayTone}
        footer={`Peak ${formatCents(circuit.peak_total_cents)}`}
        subfooter={`Drawdown ${formatBps(circuit.drawdown_from_peak_bps)} · ${circuit.detail}`}
      />
      <StatCard
        label="Buying power"
        value={formatCents(portfolio.cash_cents)}
        change={`${formatBps(deployedBps)}`}
        changeIcon={<BriefcaseBusinessIcon />}
        tone="primary"
        footer={`Invested ${formatCents(portfolio.total_cost_basis_cents)}`}
        subfooter={`${summary.stats.trades.total} fills · ${summary.stats.shares.held.toFixed(2)} shares held`}
      />
      <StatCard
        label="Open positions"
        value={`${summary.stats.positions.current} / ${engine.max_positions_bull}`}
        change={engine.market_open ? "Market open" : "Market closed"}
        tone={engine.market_open ? "positive" : "neutral"}
        footer={`${engine.universe.toUpperCase()} universe`}
        footerIcon={
          engine.circuit.blocked ? (
            <span className="size-2 rounded-full bg-rose-500" />
          ) : (
            <span className="size-2 rounded-full bg-emerald-500" />
          )
        }
        subfooter={`${engine.tick_count} ticks · ${engine.tick_interval_seconds}s interval`}
      />
    </div>
  )
}
