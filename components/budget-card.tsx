import Link from "next/link"
import {
  ArrowUpRightIcon,
  CalendarClockIcon,
  TargetIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"

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
import type { BudgetStatus } from "@/lib/api"
import {
  formatCents,
  formatDate,
  formatDaysRemaining,
  formatPercent,
  humanizeEnum,
  pnlTone,
} from "@/lib/format"
import { cn } from "cn"

export function BudgetCard({ budget }: { budget: BudgetStatus | null }) {
  if (!budget) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget</CardTitle>
          <CardDescription>No active budget is running.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center py-8">
          <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
            <TargetIcon className="size-8 text-muted-foreground/50" />
            <p>Start a budget to track capital against a target.</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/dashboard/budget" />}
          >
            Set up budget
          </Button>
        </CardFooter>
      </Card>
    )
  }

  const progress = Math.min(
    100,
    Math.max(0, budget.progress_to_target_bps / 100)
  )
  const aboveTarget = budget.profit_loss_cents >= 0
  const Icon = aboveTarget ? TrendingUpIcon : TrendingDownIcon

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Budget
          <Badge variant="outline" className="text-[10px] uppercase">
            {humanizeEnum(budget.period)}
          </Badge>
        </CardTitle>
        <CardDescription className="truncate">{budget.name}</CardDescription>
        <CardAction>
          <Badge
            variant="outline"
            className={cn("gap-1 font-mono", pnlTone(budget.profit_loss_cents))}
          >
            <Icon />
            {formatCents(budget.profit_loss_cents, { sign: true })}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Current value</div>
            <div className="font-mono text-xl font-semibold tabular-nums">
              {formatCents(budget.current_value_cents)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Target</div>
            <div className="font-mono text-sm font-medium tabular-nums">
              {formatCents(budget.target_cash_cents)}
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress to target</span>
            <span className="font-mono font-medium tabular-nums">
              {formatPercent(progress)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Initial {formatCents(budget.initial_cash_cents)}</span>
            <span>{formatDaysRemaining(budget.ends_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2 text-xs text-muted-foreground">
          <CalendarClockIcon className="size-3.5 shrink-0" />
          <span>
            {formatDate(budget.started_at)} → {formatDate(budget.ends_at)}
          </span>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="px-0 text-muted-foreground"
          nativeButton={false}
          render={<Link href="/dashboard/budget" />}
        >
          Manage budget
        </Button>
        <ArrowUpRightIcon className="size-4 text-muted-foreground" />
      </CardFooter>
    </Card>
  )
}
