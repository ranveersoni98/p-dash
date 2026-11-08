import Link from "next/link"
import {
  ActivityIcon,
  ArrowUpRightIcon,
  Clock3Icon,
  CpuIcon,
  ShieldAlertIcon,
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
import type { EngineStatusResponse } from "@/lib/api"
import { formatBps, formatDateTime, formatDuration } from "@/lib/format"
import { cn } from "cn"

export function EngineStatusCard({ engine }: { engine: EngineStatusResponse }) {
  const { circuit } = engine
  const statusTone = circuit.blocked
    ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400"
    : engine.market_open
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      : "border-border text-muted-foreground"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CpuIcon className="size-4 text-muted-foreground" />
          Engine
        </CardTitle>
        <CardDescription>
          {engine.tick_interval_seconds}s tick · {engine.universe.toUpperCase()}
        </CardDescription>
        <CardAction>
          <Badge variant="outline" className={cn("gap-1", statusTone)}>
            <span
              className={cn(
                "size-1.5 rounded-full",
                circuit.blocked
                  ? "bg-rose-500"
                  : engine.market_open
                    ? "bg-emerald-500"
                    : "bg-muted-foreground"
              )}
            />
            {circuit.blocked ? "Blocked" : engine.market_open ? "Live" : "Idle"}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 text-sm">
        <div className="flex items-start justify-between gap-3">
          <span className="shrink-0 text-muted-foreground">Market session</span>
          <span className="text-right text-xs leading-snug font-medium">
            {engine.market_open ? "Open" : "Closed"} ·{" "}
            {engine.market_session.replace("NSE ", "")}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Last tick</span>
          <span className="flex items-center gap-1 text-xs font-medium">
            <Clock3Icon className="size-3" />
            {formatDateTime(engine.last_tick_at)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Ticks run</span>
          <span className="font-mono text-xs tabular-nums">
            {engine.tick_count} · {formatDuration(engine.uptime_secs)} uptime
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Open positions</span>
          <span className="font-mono text-xs tabular-nums">
            {engine.positions_open} / {engine.max_positions_bull}
          </span>
        </div>
        <div
          className={cn(
            "flex items-start gap-2 rounded-lg border p-2 text-xs",
            circuit.blocked
              ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400"
              : "bg-muted/30 text-muted-foreground"
          )}
        >
          <ShieldAlertIcon className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {circuit.detail} · day P&L{" "}
            <span className="font-mono">
              {formatBps(circuit.day_pnl_bps, { sign: true })}
            </span>
          </span>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="px-0 text-muted-foreground"
          nativeButton={false}
          render={<Link href="/dashboard/engine" />}
        >
          Open engine
        </Button>
        <div className="flex items-center gap-1 text-muted-foreground">
          <ActivityIcon className="size-4" />
          <ArrowUpRightIcon className="size-4" />
        </div>
      </CardFooter>
    </Card>
  )
}
