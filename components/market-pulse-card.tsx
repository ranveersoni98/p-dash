import Link from "next/link"
import {
  ArrowUpRightIcon,
  InfoIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WavesIcon,
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
import type { MoversResponse } from "@/lib/api"
import {
  formatBps,
  formatCents,
  formatDateTime,
  pnlTone,
  shortSymbol,
} from "@/lib/format"
import { cn } from "cn"

function MoverRow({
  symbol,
  name,
  price_cents,
  day_change_bps,
}: {
  symbol: string
  name?: string | null
  price_cents: number
  day_change_bps: number
}) {
  return (
    <Link
      href={`/dashboard/market?symbol=${encodeURIComponent(symbol)}`}
      className="flex items-center justify-between gap-3 rounded-lg border p-2 text-sm transition-colors hover:bg-muted/50"
    >
      <span className="min-w-0">
        <span className="block truncate font-medium">{shortSymbol(symbol)}</span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {name ?? "NSE"}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block font-mono text-xs tabular-nums">
          {formatCents(price_cents)}
        </span>
        <span
          className={cn(
            "block font-mono text-[11px] tabular-nums",
            pnlTone(day_change_bps)
          )}
        >
          {formatBps(day_change_bps, { sign: true })}
        </span>
      </span>
    </Link>
  )
}

export function MarketPulseCard({ movers }: { movers: MoversResponse | null }) {
  const gainers = movers?.gainers.slice(0, 4) ?? []
  const losers = movers?.losers.slice(0, 4) ?? []
  const hasMovers = gainers.length > 0 || losers.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WavesIcon className="size-4 text-muted-foreground" />
          Market pulse
        </CardTitle>
        <CardDescription>
          Session leaders and laggards across the Nifty 500.
        </CardDescription>
        <CardAction>
          <Badge variant="outline" className="font-mono text-[10px]">
            {movers ? formatDateTime(movers.generated_at) : "No feed"}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex-1">
        {hasMovers ? (
          <div className="grid gap-4 @xl/main:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <TrendingUpIcon className="size-3.5" />
                Gainers
              </div>
              {gainers.map((mover) => (
                <MoverRow key={mover.symbol} {...mover} />
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-400">
                <TrendingDownIcon className="size-3.5" />
                Losers
              </div>
              {losers.map((mover) => (
                <MoverRow key={mover.symbol} {...mover} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-8 text-center text-sm text-muted-foreground">
            <InfoIcon className="size-7 text-muted-foreground/40" />
            <span className="font-medium text-foreground">
              Movers publish when the session opens
            </span>
            <span>
              Quotes keep refreshing from the last close. Live gainers and
              losers appear during NSE hours.
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant="ghost"
          size="sm"
          className="px-0 text-muted-foreground"
          nativeButton={false}
          render={<Link href="/dashboard/market" />}
        >
          Open market
          <ArrowUpRightIcon data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  )
}
