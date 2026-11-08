import Link from "next/link"
import { ArrowUpRightIcon, BarChart3Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { TopTradedSymbol } from "@/lib/api"
import { formatCents, shortSymbol } from "@/lib/format"

export function TopSymbolsCard({ symbols }: { symbols: TopTradedSymbol[] }) {
  const top = [...symbols]
    .sort((a, b) => b.volume_cents - a.volume_cents)
    .slice(0, 5)
  const max = top[0]?.volume_cents || 1

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3Icon className="size-4 text-muted-foreground" />
          Top traded
        </CardTitle>
        <CardDescription>Most active names by notional volume.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {top.length ? (
          <div className="space-y-3">
            {top.map((symbol) => (
              <Link
                key={symbol.symbol}
                href={`/dashboard/market?symbol=${encodeURIComponent(symbol.symbol)}`}
                className="group block space-y-1.5"
              >
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium group-hover:underline">
                    {shortSymbol(symbol.symbol)}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                    {formatCents(symbol.volume_cents, { compact: true })}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/80"
                    style={{
                      width: `${Math.max(4, (symbol.volume_cents / max) * 100)}%`,
                    }}
                  />
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {symbol.trades} trade{symbol.trades === 1 ? "" : "s"}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No trade volume yet.
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant="ghost"
          size="sm"
          className="px-0 text-muted-foreground"
          nativeButton={false}
          render={<Link href="/dashboard/trades" />}
        >
          All trades
          <ArrowUpRightIcon data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  )
}
