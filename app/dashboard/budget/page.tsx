import Link from "next/link"
import {
  CalendarClockIcon,
  InfoIcon,
  TargetIcon,
  TimerIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react"

import { NewBudgetForm } from "@/components/new-budget-form"
import { StatCard } from "@/components/stat-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  getActiveBudget,
  getConfig,
  getEngineStatus,
  getPortfolio,
} from "@/lib/api"
import {
  formatBps,
  formatCents,
  formatDate,
  formatDaysRemaining,
  formatDuration,
  formatPercent,
  humanizeEnum,
  pnlTone,
} from "@/lib/format"
import { cn } from "cn"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Budget",
}

function BudgetMeta({
  label,
  value,
  hint,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-base font-medium tabular-nums">
        {value}
      </div>
      {hint ? (
        <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  )
}

export default async function BudgetPage() {
  const [activeBudget, engine, portfolio, config] = await Promise.all([
    getActiveBudget(),
    getEngineStatus(),
    getPortfolio(),
    getConfig(),
  ])

  const budget = activeBudget ?? engine.budget ?? null
  const progress = budget
    ? Math.min(100, Math.max(0, budget.progress_to_target_bps / 100))
    : 0

  const now = new Date(engine.server_time).getTime()
  const startedAt = budget ? new Date(budget.started_at).getTime() : now
  const endsAt = budget ? new Date(budget.ends_at).getTime() : now
  const timeElapsed =
    budget && endsAt > startedAt
      ? Math.min(
          100,
          Math.max(0, ((now - startedAt) / (endsAt - startedAt)) * 100)
        )
      : 0
  const remainingSecs = budget ? Math.max(0, (endsAt - now) / 1000) : 0
  const requiredReturnBps =
    budget && budget.current_value_cents > 0
      ? ((budget.target_cash_cents - budget.current_value_cents) /
          budget.current_value_cents) *
        10_000
      : 0

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
          <StatCard
            label="Starting capital"
            value={budget ? formatCents(budget.initial_cash_cents) : "—"}
            change={budget ? humanizeEnum(budget.period) : "No budget"}
            tone="primary"
            footer={
              budget
                ? `Started ${formatDate(budget.started_at)}`
                : "Create a budget to begin"
            }
            subfooter={
              budget
                ? `Ends ${formatDate(budget.ends_at)}`
                : "Budgets set the trading window"
            }
          />
          <StatCard
            label="Current value"
            value={budget ? formatCents(budget.current_value_cents) : "—"}
            valueClassName={
              budget ? pnlTone(budget.profit_loss_cents) : undefined
            }
            change={
              budget ? formatBps(progress * 100, { sign: false }) : undefined
            }
            changeIcon={
              budget && budget.profit_loss_cents < 0 ? (
                <TrendingDownIcon />
              ) : (
                <TrendingUpIcon />
              )
            }
            tone={
              budget
                ? budget.profit_loss_cents >= 0
                  ? "positive"
                  : "negative"
                : "neutral"
            }
            footer={
              budget
                ? `P&L ${formatCents(budget.profit_loss_cents, { sign: true })}`
                : "No active budget"
            }
            subfooter={
              budget
                ? `${formatPercent(progress)} of target reached`
                : "Start one from the form below"
            }
          />
          <StatCard
            label="Target"
            value={budget ? formatCents(budget.target_cash_cents) : "—"}
            change={
              budget
                ? `${(config.target_multiplier_bps / 10_000).toFixed(1)}× capital`
                : undefined
            }
            changeIcon={<TargetIcon />}
            tone="warning"
            footer={
              budget
                ? `Need ${formatCents(
                    Math.max(
                      0,
                      budget.target_cash_cents - budget.current_value_cents
                    )
                  )} more`
                : "Target multiple from engine config"
            }
            subfooter={
              budget
                ? `${formatBps(requiredReturnBps, { sign: true })} to target`
                : "Set by the API configuration"
            }
          />
          <StatCard
            label="Time remaining"
            value={budget ? formatDaysRemaining(budget.ends_at) : "—"}
            change={budget ? formatPercent(timeElapsed) : undefined}
            changeIcon={<TimerIcon />}
            tone={timeElapsed > 80 ? "warning" : "neutral"}
            footer={
              budget
                ? `${formatDuration(remainingSecs)} left in window`
                : "No window running"
            }
            subfooter={
              budget
                ? `Window started ${formatDate(budget.started_at)}`
                : "Periods can be day, week or month"
            }
          />
        </div>

        <div className="grid grid-cols-1 items-start gap-4 px-4 lg:px-6 @4xl/main:grid-cols-3">
          <Card className="@4xl/main:col-span-2">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                {budget?.name ?? "No active budget"}
                {budget ? (
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {humanizeEnum(budget.period)}
                  </Badge>
                ) : null}
              </CardTitle>
              <CardDescription>
                {budget
                  ? `Target ${formatCents(budget.target_cash_cents)} from ${formatCents(budget.initial_cash_cents)} initial capital.`
                  : "Start a new budget to set a target and trading window."}
              </CardDescription>
              <div className="col-start-2 row-span-2 row-start-1 justify-self-end">
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href="/dashboard/engine" />}
                >
                  Engine
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 @xl/main:grid-cols-[auto_1fr] @xl/main:items-center">
              <div className="flex items-center justify-center">
                <div
                  className="relative flex size-44 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(var(--primary) ${progress}%, var(--muted) 0)`,
                  }}
                >
                  <div className="flex size-36 flex-col items-center justify-center rounded-full bg-card text-center shadow-sm">
                    <span className="font-mono text-3xl font-semibold tabular-nums">
                      {formatPercent(progress, { decimals: 1 })}
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      to target
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <BudgetMeta
                    label="Initial capital"
                    value={
                      budget ? formatCents(budget.initial_cash_cents) : "—"
                    }
                  />
                  <BudgetMeta
                    label="Current value"
                    value={
                      budget ? formatCents(budget.current_value_cents) : "—"
                    }
                    hint={
                      budget
                        ? formatCents(budget.profit_loss_cents, { sign: true })
                        : undefined
                    }
                  />
                  <BudgetMeta
                    label="Target cash"
                    value={budget ? formatCents(budget.target_cash_cents) : "—"}
                    hint={
                      budget
                        ? `${formatBps(requiredReturnBps, { sign: true })} remaining`
                        : undefined
                    }
                  />
                  <BudgetMeta
                    label="Account value"
                    value={formatCents(portfolio.total_value_cents)}
                    hint={`${formatCents(portfolio.cash_cents)} cash`}
                  />
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Target progress
                      </span>
                      <span className="font-mono font-medium tabular-nums">
                        {formatPercent(progress)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Time elapsed
                      </span>
                      <span className="font-mono font-medium tabular-nums">
                        {formatPercent(timeElapsed)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{ width: `${timeElapsed}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarClockIcon className="size-3.5" />
                    {budget ? formatDate(budget.started_at) : "—"} →{" "}
                    {budget ? formatDate(budget.ends_at) : "—"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <WalletIcon className="size-3.5" />
                    {engine.positions_open} positions open
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-between text-xs text-muted-foreground">
              <span>
                {budget?.active
                  ? "Budget is active and tracking live portfolio value."
                  : "No active budget is being tracked."}
              </span>
              <span className="font-mono">
                {formatCents(portfolio.total_value_cents, { compact: true })}
              </span>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <InfoIcon className="size-4 text-muted-foreground" />
                Budget rules
              </CardTitle>
              <CardDescription>
                How the paper account is scored and guarded.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground">Target multiple</span>
                <span className="font-mono font-medium tabular-nums">
                  {(config.target_multiplier_bps / 10_000).toFixed(1)}×
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground">Max daily loss</span>
                <span className="font-mono font-medium tabular-nums">
                  {formatBps(config.max_daily_loss_bps)}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground">Max drawdown</span>
                <span className="font-mono font-medium tabular-nums">
                  {formatBps(config.max_drawdown_bps)}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground">Position slots</span>
                <span className="font-mono font-medium tabular-nums">
                  {config.max_positions_bull} bull / {config.max_positions_bear}{" "}
                  bear
                </span>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                The active budget resets the performance window. Existing
                positions remain in the portfolio unless the engine closes them.
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="ghost"
                size="sm"
                className="px-0 text-muted-foreground"
                nativeButton={false}
                render={<Link href="/dashboard/engine" />}
              >
                View risk guards
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @4xl/main:grid-cols-2">
          <NewBudgetForm />

          <Card>
            <CardHeader>
              <CardTitle>Account snapshot</CardTitle>
              <CardDescription>
                Live values backing the active budget.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cash</span>
                <span className="font-mono font-medium tabular-nums">
                  {formatCents(portfolio.cash_cents)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Equity</span>
                <span className="font-mono font-medium tabular-nums">
                  {formatCents(portfolio.equity_cents)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total value</span>
                <span className="font-mono font-medium tabular-nums">
                  {formatCents(portfolio.total_value_cents)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cost basis</span>
                <span className="font-mono font-medium tabular-nums">
                  {formatCents(portfolio.total_cost_basis_cents)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Positions</span>
                <span className="font-mono font-medium tabular-nums">
                  {portfolio.positions.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Account</span>
                <span className="font-mono text-xs font-medium">
                  {portfolio.account_id}
                </span>
              </div>
              <div
                className={cn(
                  "rounded-lg border p-3 text-xs",
                  engine.circuit.blocked
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400"
                    : "bg-muted/30 text-muted-foreground"
                )}
              >
                Circuit: {engine.circuit.detail} · day P&L{" "}
                {formatBps(engine.circuit.day_pnl_bps, { sign: true })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
