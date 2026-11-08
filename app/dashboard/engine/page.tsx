import Link from "next/link"
import {
  ActivityIcon,
  ArrowUpRightIcon,
  CheckCircle2Icon,
  Clock3Icon,
  CpuIcon,
  DatabaseIcon,
  GaugeIcon,
  RadarIcon,
  ServerCogIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TimerResetIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"

import { StatCard } from "@/components/stat-card"
import { TickButton } from "@/components/tick-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  getConfig,
  getEngineStatus,
  getHealth,
  getPortfolio,
  getResearchStatus,
  getStats,
  type TradingSignal,
} from "@/lib/api"
import {
  formatBps,
  formatCents,
  formatDate,
  formatDateTime,
  formatDuration,
  formatPercent,
  formatQuantity,
  formatTime,
  humanizeEnum,
  pnlTone,
  shortSymbol,
} from "@/lib/format"
import { cn } from "cn"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Engine",
}

function ConfigRow({
  label,
  value,
  hint,
}: {
  label: string
  value: React.ReactNode
  hint?: string
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <div className="min-w-0">
        <div className="text-muted-foreground">{label}</div>
        {hint ? (
          <div className="text-[11px] text-muted-foreground/80">{hint}</div>
        ) : null}
      </div>
      <div className="shrink-0 text-right font-mono text-xs font-medium tabular-nums">
        {value}
      </div>
    </div>
  )
}

function ConfigCard({
  title,
  description,
  icon,
  children,
}: {
  title: string
  description: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  )
}

function CircuitMeter({
  label,
  value,
  max,
  display,
  detail,
}: {
  label: string
  value: number
  max: number
  display: React.ReactNode
  detail: React.ReactNode
}) {
  const unbounded = max <= 0
  const used = unbounded ? 0 : Math.min(100, Math.max(0, (value / max) * 100))
  const tone =
    used >= 100 ? "bg-rose-500" : used >= 66 ? "bg-amber-500" : "bg-primary"

  return (
    <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-xs font-medium tabular-nums">
          {display}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", tone)}
          style={{ width: `${unbounded ? 0 : Math.max(2, used)}%` }}
        />
      </div>
      <div className="text-[11px] text-muted-foreground">{detail}</div>
    </div>
  )
}

function SignalRow({ signal }: { signal: TradingSignal }) {
  return (
    <Link
      href={`/dashboard/market?symbol=${encodeURIComponent(signal.symbol)}`}
      className="flex items-center justify-between gap-3 rounded-lg border p-2.5 text-sm transition-colors hover:bg-muted/50"
    >
      <span className="flex min-w-0 items-center gap-2">
        <Badge
          variant="outline"
          className={cn(
            "w-12 justify-center uppercase",
            signal.action === "buy"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-400"
              : signal.action === "sell"
                ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:border-rose-400/30 dark:text-rose-400"
                : "text-muted-foreground"
          )}
        >
          {signal.action}
        </Badge>
        <span className="min-w-0">
          <span className="block truncate font-medium">
            {shortSymbol(signal.symbol)}
          </span>
          <span className="block truncate text-[11px] text-muted-foreground">
            {signal.signal_quality} · {formatBps(signal.confidence_bps)}{" "}
            confidence
          </span>
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block font-mono text-xs tabular-nums">
          {formatQuantity(signal.suggested_quantity)}
        </span>
        <span className="block text-[11px] text-muted-foreground">
          {formatCents(signal.price_cents)}
        </span>
      </span>
    </Link>
  )
}

export default async function EnginePage() {
  const [engine, config, health, research, portfolio, stats] =
    await Promise.all([
      getEngineStatus(),
      getConfig(),
      getHealth(),
      getResearchStatus(),
      getPortfolio(),
      getStats(),
    ])

  const { circuit } = engine
  const budget = portfolio.active_budget ?? engine.budget ?? null
  const lastTick = engine.last_tick
  const signals = lastTick?.signals ?? []
  const entriesLimit = circuit.max_entries_per_day
  const dayLoss = Math.max(0, -circuit.day_pnl_bps)
  const drawdown = Math.abs(circuit.drawdown_from_peak_bps)
  const slotsUsed = engine.positions_open
  const slotPercent =
    engine.max_positions_bull > 0
      ? Math.min(100, (slotsUsed / engine.max_positions_bull) * 100)
      : 0

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
          <StatCard
            label="Engine"
            value={engine.engine_enabled ? "Running" : "Paused"}
            change={`${engine.tick_interval_seconds}s tick`}
            changeIcon={<CpuIcon />}
            tone={engine.engine_enabled ? "positive" : "neutral"}
            footer={`${engine.tick_count} ticks since start`}
            subfooter={`${formatDuration(engine.uptime_secs)} uptime`}
          />
          <StatCard
            label="Last tick"
            value={lastTick ? formatTime(engine.last_tick_at) : "—"}
            change={
              lastTick?.market_open
                ? `${lastTick.trades_executed} executed`
                : "Market closed"
            }
            changeIcon={<TimerResetIcon />}
            tone={lastTick?.market_open ? "positive" : "neutral"}
            footer={
              lastTick
                ? `${formatDate(engine.last_tick_at)} · ${lastTick.analyzed} analyzed`
                : "No tick summary recorded"
            }
            subfooter={lastTick?.market_note ?? "Waiting for the first tick"}
          />
          <StatCard
            label="Circuit guard"
            value={circuit.blocked ? "Blocked" : "Clear"}
            valueClassName={circuit.blocked ? pnlTone(-1) : undefined}
            change={formatBps(circuit.day_pnl_bps, { sign: true })}
            changeIcon={
              circuit.day_pnl_bps >= 0 ? (
                <TrendingUpIcon />
              ) : (
                <TrendingDownIcon />
              )
            }
            tone={circuit.blocked ? "negative" : "positive"}
            footer={circuit.detail}
            subfooter={`${circuit.entries_today} entries today${
              entriesLimit > 0 ? ` · limit ${entriesLimit}` : ""
            }`}
          />
          <StatCard
            label="Position slots"
            value={`${slotsUsed} / ${engine.max_positions_bull}`}
            change={`${engine.max_positions_bear} bear max`}
            changeIcon={<RadarIcon />}
            tone={slotPercent >= 100 ? "warning" : "primary"}
            footer={`${engine.universe.toUpperCase()} universe`}
            subfooter={
              budget
                ? `${formatCents(budget.current_value_cents)} budget value`
                : "No active budget"
            }
          />
        </div>

        <div className="grid grid-cols-1 items-start gap-4 px-4 lg:px-6 @4xl/main:grid-cols-3">
          <Card className="@4xl/main:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {circuit.blocked ? (
                  <ShieldAlertIcon className="size-4 text-rose-500" />
                ) : (
                  <ShieldCheckIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                )}
                Circuit guard
              </CardTitle>
              <CardDescription>
                Hard risk limits applied to every entry and exit.
              </CardDescription>
              <CardAction>
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1",
                    circuit.blocked
                      ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:border-rose-400/30 dark:text-rose-400"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-400"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      circuit.blocked ? "bg-rose-500" : "bg-emerald-500"
                    )}
                  />
                  {circuit.blocked ? "Blocked" : "Within limits"}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 @xl/main:grid-cols-2">
                <CircuitMeter
                  label="Daily loss"
                  value={dayLoss}
                  max={circuit.max_daily_loss_bps}
                  display={`${formatBps(dayLoss)} / ${formatBps(circuit.max_daily_loss_bps)}`}
                  detail={`Day P&L ${formatCents(circuit.day_pnl_cents, { sign: true })} from ${formatCents(circuit.day_start_total_cents)} start.`}
                />
                <CircuitMeter
                  label="Drawdown from peak"
                  value={drawdown}
                  max={circuit.max_drawdown_bps}
                  display={`${formatBps(drawdown)} / ${formatBps(circuit.max_drawdown_bps)}`}
                  detail={`Peak ${formatCents(circuit.peak_total_cents)} vs current ${formatCents(circuit.total_value_cents)}.`}
                />
                <CircuitMeter
                  label="Entries today"
                  value={circuit.entries_today}
                  max={entriesLimit}
                  display={
                    entriesLimit > 0
                      ? `${circuit.entries_today} / ${entriesLimit}`
                      : `${circuit.entries_today} / unlimited`
                  }
                  detail={
                    entriesLimit > 0
                      ? "Entries reset at the start of the next session."
                      : "No daily entry cap is configured."
                  }
                />
                <div className="flex flex-col justify-between gap-3 rounded-lg border bg-muted/20 p-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">Halt window</span>
                    <span className="font-mono text-xs font-medium tabular-nums">
                      {circuit.halted_until
                        ? formatDateTime(circuit.halted_until)
                        : "None"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">Reason</span>
                    <span className="font-mono text-xs font-medium">
                      {humanizeEnum(circuit.reason)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">Cooldown</span>
                    <span className="font-mono text-xs font-medium tabular-nums">
                      {formatDuration(config.cooldown_secs)}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "flex items-start gap-2 rounded-lg border p-3 text-xs",
                  circuit.blocked
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400"
                    : "bg-muted/30 text-muted-foreground"
                )}
              >
                <ActivityIcon className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  {circuit.detail}. Guard values update on every engine tick and
                  are evaluated before any order is placed.
                </span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="px-0 text-muted-foreground"
                nativeButton={false}
                render={<Link href="/dashboard/budget" />}
              >
                Budget and target
                <ArrowUpRightIcon data-icon="inline-end" />
              </Button>
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                Peak drawdown {formatBps(drawdown)}
              </span>
            </CardFooter>
          </Card>

          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ServerCogIcon className="size-4 text-muted-foreground" />
                  Engine health
                </CardTitle>
                <CardDescription>Process and cache status.</CardDescription>
                <CardAction>
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1",
                      health.status === "ok"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-400"
                        : "text-muted-foreground"
                    )}
                  >
                    <CheckCircle2Icon />
                    {health.status}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-mono text-xs tabular-nums">
                    v{health.version}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <DatabaseIcon className="size-3" />
                    Redis cache
                  </span>
                  <span className="font-mono text-xs capitalize">
                    {health.redis_cache}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Started</span>
                  <span className="text-right font-mono text-[11px]">
                    {formatDateTime(health.started_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Server time</span>
                  <span className="text-right font-mono text-[11px]">
                    {formatDateTime(health.server_time)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Uptime</span>
                  <span className="font-mono text-xs tabular-nums">
                    {formatDuration(health.uptime_secs)}
                  </span>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                  {health.message}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-0 text-muted-foreground"
                  nativeButton={false}
                  render={<Link href="/dashboard/settings" />}
                >
                  Connection settings
                  <ArrowUpRightIcon data-icon="inline-end" />
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock3Icon className="size-4 text-muted-foreground" />
                  Market hours
                </CardTitle>
                <CardDescription>{engine.market_session}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Session</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      engine.market_open
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-400"
                        : "text-muted-foreground"
                    )}
                  >
                    {engine.market_open ? "Open" : "Closed"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Hours only</span>
                  <span className="font-mono text-xs">
                    {engine.market_hours_only ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Market</span>
                  <span className="font-mono text-xs capitalize">
                    {engine.market} · {engine.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Candidates</span>
                  <span className="font-mono text-xs tabular-nums">
                    {engine.candidates_per_tick} / tick
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 px-4 lg:px-6 @4xl/main:grid-cols-3">
          <Card className="@4xl/main:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GaugeIcon className="size-4 text-muted-foreground" />
                Last tick
              </CardTitle>
              <CardDescription>
                {lastTick ? lastTick.market_note : "No tick summary yet."}
              </CardDescription>
              <CardAction>
                <TickButton />
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">
              {lastTick ? (
                <>
                  <div className="grid grid-cols-2 gap-2 @xl/main:grid-cols-3">
                    {[
                      ["Analyzed", lastTick.analyzed],
                      ["Executed", lastTick.trades_executed],
                      ["Holds", lastTick.holds],
                      ["Buy signals", lastTick.buys_signaled],
                      ["Sell signals", lastTick.sells_signaled],
                      ["Blocked", lastTick.circuit_entries_blocked ?? 0],
                    ].map(([label, value]) => (
                      <div
                        key={String(label)}
                        className="rounded-lg border bg-muted/30 p-3"
                      >
                        <div className="text-[11px] text-muted-foreground">
                          {label}
                        </div>
                        <div className="mt-0.5 font-mono text-lg font-medium tabular-nums">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {signals.length ? (
                    <div className="space-y-2">
                      <div className="text-[11px] tracking-wide text-muted-foreground uppercase">
                        Signals emitted
                      </div>
                      {signals.slice(0, 4).map((signal) => (
                        <SignalRow key={signal.symbol} signal={signal} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-8 text-center text-sm text-muted-foreground">
                      <RadarIcon className="size-8 text-muted-foreground/40" />
                      <span className="font-medium text-foreground">
                        No signals from the last tick
                      </span>
                      <span>
                        {lastTick.market_open
                          ? "The engine analyzed candidates but none cleared the entry threshold."
                          : "The engine skips signal generation when the NSE session is closed."}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-[11px] text-muted-foreground">
                    <span>
                      Last run {formatDateTime(engine.last_tick_at)} · every{" "}
                      {engine.tick_interval_seconds}s
                    </span>
                    {lastTick.circuit_reason ? (
                      <Badge variant="outline" className="text-[10px]">
                        Circuit: {humanizeEnum(lastTick.circuit_reason)}
                      </Badge>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  The engine has not completed a tick yet.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SparklesIcon className="size-4 text-muted-foreground" />
                  Research loop
                </CardTitle>
                <CardDescription>
                  Fundamentals and macro prefetch.
                </CardDescription>
                <CardAction>
                  <Badge
                    variant="outline"
                    className={cn(
                      research.running
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-400"
                        : "text-muted-foreground"
                    )}
                  >
                    {research.running ? "Running" : "Paused"}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Last cycle</span>
                  <span className="text-right font-mono text-[11px]">
                    {formatDateTime(research.last_cycle_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Prefetched</span>
                  <span className="font-mono text-xs tabular-nums">
                    {research.symbols_prefetched} symbols
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Macro cache</span>
                  <span className="font-mono text-xs">
                    {research.macro_cached ? "Warm" : "Empty"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Interval</span>
                  <span className="font-mono text-xs tabular-nums">
                    {formatDuration(config.economics_research_interval_seconds)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Batch size</span>
                  <span className="font-mono text-xs tabular-nums">
                    {config.economics_prefetch_batch_size}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DatabaseIcon className="size-4 text-muted-foreground" />
                  Account snapshot
                </CardTitle>
                <CardDescription>Live values behind the guard.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Total value</span>
                  <span className="font-mono text-xs tabular-nums">
                    {formatCents(portfolio.total_value_cents)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Cash</span>
                  <span className="font-mono text-xs tabular-nums">
                    {formatCents(portfolio.cash_cents)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Equity</span>
                  <span className="font-mono text-xs tabular-nums">
                    {formatCents(portfolio.equity_cents)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Positions</span>
                  <span className="font-mono text-xs tabular-nums">
                    {portfolio.positions.length}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Trades</span>
                  <span className="font-mono text-xs tabular-nums">
                    {stats.trades.total}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Budget</span>
                  <span className="truncate text-right font-mono text-[11px]">
                    {budget?.name ?? "None"}
                  </span>
                </div>
                {budget ? (
                  <div className="space-y-1.5 border-t pt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Target progress
                      </span>
                      <span className="font-mono tabular-nums">
                        {formatPercent(budget.progress_to_target_bps / 100)}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${Math.min(100, Math.max(0, budget.progress_to_target_bps / 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 px-4 pb-2 lg:px-6 @4xl/main:grid-cols-2">
          <ConfigCard
            title="Position sizing"
            description="How the engine sizes new entries."
            icon={<RadarIcon className="size-4 text-muted-foreground" />}
          >
            <ConfigRow
              label="Starting capital"
              value={formatCents(config.starting_cash_cents)}
            />
            <ConfigRow
              label="Target multiple"
              value={`${(config.target_multiplier_bps / 10_000).toFixed(1)}×`}
            />
            <ConfigRow
              label="Trade size"
              value={formatPercent(config.trade_size_bps / 100)}
            />
            <ConfigRow
              label="Max position"
              value={formatPercent(config.max_position_bps / 100)}
            />
            <ConfigRow
              label="Max sector"
              value={formatPercent(config.max_sector_bps / 100)}
            />
            <ConfigRow
              label="Min cash"
              value={formatPercent(config.min_cash_bps / 100)}
            />
            <ConfigRow
              label="Max entries / tick"
              value={config.max_entries_per_tick}
            />
            <ConfigRow
              label="Max trade notional"
              value={
                config.max_trade_notional_cents > 0
                  ? formatCents(config.max_trade_notional_cents)
                  : "Uncapped"
              }
            />
            <ConfigRow
              label="Min entry price"
              value={formatCents(config.min_entry_price_cents)}
            />
            <ConfigRow
              label="Max quote age"
              value={`${config.max_quote_age_secs}s`}
            />
            <ConfigRow
              label="Position slots"
              value={`${config.max_positions_bull} bull / ${config.max_positions_bear} bear`}
            />
          </ConfigCard>

          <ConfigCard
            title="Risk guardrails"
            description="Limits that can halt the engine."
            icon={<ShieldAlertIcon className="size-4 text-muted-foreground" />}
          >
            <ConfigRow
              label="Max daily loss"
              value={formatBps(config.max_daily_loss_bps)}
            />
            <ConfigRow
              label="Max drawdown"
              value={formatBps(config.max_drawdown_bps)}
            />
            <ConfigRow
              label="Max entries / day"
              value={
                config.max_entries_per_day > 0
                  ? config.max_entries_per_day
                  : "Unlimited"
              }
            />
            <ConfigRow
              label="Cooldown"
              value={formatDuration(config.cooldown_secs)}
            />
            <ConfigRow
              label="Risk per trade"
              value={formatBps(config.risk_per_trade_bps)}
            />
            <ConfigRow
              label="Stop loss"
              value={formatPercent(config.stop_loss_pct * 100)}
            />
            <ConfigRow
              label="ATR stop"
              value={`${config.atr_stop_multiplier.toFixed(1)}× ATR`}
            />
            <ConfigRow
              label="Max stop"
              value={formatPercent(config.max_stop_pct * 100)}
            />
            <ConfigRow
              label="Time stop"
              value={`${config.time_stop_days} days`}
            />
            <ConfigRow
              label="Take profit"
              value={formatPercent(config.take_profit_pct * 100)}
            />
            <ConfigRow
              label="Trailing stop"
              value={`${formatPercent(config.trailing_stop_activation_pct * 100)} / ${formatPercent(config.trailing_stop_loss_pct * 100)}`}
              hint="Activation / loss"
            />
            <ConfigRow
              label="Scale in"
              value={
                config.scale_in_enabled
                  ? `${formatPercent(config.scale_in_threshold_pct * 100)} +${formatPercent(config.scale_in_add_pct * 100)}`
                  : "Disabled"
              }
              hint="Threshold / add"
            />
          </ConfigCard>

          <ConfigCard
            title="Execution"
            description="Signal thresholds and fill assumptions."
            icon={<ActivityIcon className="size-4 text-muted-foreground" />}
          >
            <ConfigRow
              label="Entry threshold"
              value={formatBps(config.entry_threshold_bps)}
            />
            <ConfigRow
              label="Exit threshold"
              value={formatBps(config.exit_threshold_bps)}
            />
            <ConfigRow
              label="Slippage"
              value={formatBps(config.slippage_bps)}
            />
            <ConfigRow
              label="Trading cost"
              value={formatBps(config.trading_cost_bps)}
            />
            <ConfigRow
              label="Universe refresh"
              value={`${config.engine_symbol_refresh_hours}h`}
            />
            <ConfigRow
              label="Candidates / tick"
              value={config.engine_candidates_per_tick}
            />
            <ConfigRow
              label="Tick interval"
              value={`${config.engine_tick_interval_seconds}s`}
            />
            <ConfigRow
              label="Market hours only"
              value={config.market_hours_only ? "Yes" : "No"}
            />
          </ConfigCard>

          <ConfigCard
            title="Research & infrastructure"
            description="Bias, filters and runtime services."
            icon={<ServerCogIcon className="size-4 text-muted-foreground" />}
          >
            <ConfigRow
              label="Research"
              value={config.economics_research_enabled ? "Enabled" : "Disabled"}
            />
            <ConfigRow
              label="Research interval"
              value={formatDuration(config.economics_research_interval_seconds)}
            />
            <ConfigRow
              label="Tech bias"
              value={formatBps(config.tech_score_bias_bps)}
            />
            <ConfigRow
              label="Indian bias"
              value={formatBps(config.indian_bias_bps)}
            />
            <ConfigRow
              label="High ROI override"
              value={formatBps(config.high_roi_override_bps)}
            />
            <ConfigRow
              label="Universe min price"
              value={formatCents(config.universe_min_price_cents)}
            />
            <ConfigRow
              label="Min turnover"
              value={formatCents(config.universe_min_turnover_cents, {
                compact: true,
              })}
            />
            <ConfigRow
              label="Redis / admin auth"
              value={`${config.redis_cache_enabled ? "On" : "Off"} / ${
                config.admin_auth_enabled ? "On" : "Off"
              }`}
            />
          </ConfigCard>
        </div>
      </div>
    </div>
  )
}
