import Link from "next/link"
import {
  ArrowDownLeftIcon,
  ArrowLeftRightIcon,
  ArrowUpRightIcon,
  CircleDollarSignIcon,
  ReceiptTextIcon,
  TargetIcon,
  WalletIcon,
} from "lucide-react"

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
import type { LedgerEntry } from "@/lib/api"
import { formatCents, formatDateTime, shortSymbol } from "@/lib/format"
import { cn } from "cn"

function entryIcon(type: string) {
  switch (type) {
    case "trade":
      return <ArrowLeftRightIcon />
    case "fee":
      return <ReceiptTextIcon />
    case "budget_reset":
      return <TargetIcon />
    case "account_init":
      return <WalletIcon />
    default:
      return <CircleDollarSignIcon />
  }
}

function entrySymbol(entry: LedgerEntry) {
  const match = entry.description?.match(
    /\b([A-Z][A-Z0-9&.-]*\.(?:NS|BO))\b/
  )
  return match?.[1] ?? null
}

export function LedgerActivityCard({
  entries,
  cashCents,
}: {
  entries: LedgerEntry[] | null
  cashCents: number
}) {
  const items = entries?.slice(0, 6) ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDownLeftIcon className="size-4 text-muted-foreground" />
          Cash activity
        </CardTitle>
        <CardDescription>
          Latest movements in the paper-trading ledger.
        </CardDescription>
        <CardAction>
          <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
            {formatCents(cashCents, { compact: true })} cash
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="flex-1">
        {items.length ? (
          <div className="space-y-1.5">
            {items.map((entry) => {
              const symbol = entrySymbol(entry)
              const body = (
                <>
                  <span className="flex min-w-0 items-start gap-2">
                    <span className="mt-0.5 text-muted-foreground">
                      {entryIcon(entry.transaction_type)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm">
                        {entry.description ?? entry.transaction_type}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        {formatDateTime(entry.created_at)}
                        {symbol ? ` · ${shortSymbol(symbol)}` : ""}
                      </span>
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 font-mono text-xs font-medium tabular-nums",
                      entry.amount_cents >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {formatCents(entry.amount_cents, { sign: true })}
                  </span>
                </>
              )

              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-2 transition-colors hover:bg-muted/50"
                >
                  {symbol ? (
                    <Link
                      href={`/dashboard/market?symbol=${encodeURIComponent(symbol)}`}
                      className="flex min-w-0 flex-1 items-center justify-between gap-3"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                      {body}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
            <CircleDollarSignIcon className="size-7 text-muted-foreground/40" />
            <span className="font-medium text-foreground">
              No ledger entries yet
            </span>
            <span>
              Account initialisation, trades and fees will show up here.
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
          render={<Link href="/dashboard/ledger" />}
        >
          Open ledger
          <ArrowUpRightIcon data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  )
}
