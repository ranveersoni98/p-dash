import Link from "next/link"
import {
  ArrowDownLeftIcon,
  ArrowLeftRightIcon,
  ArrowUpRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleDollarSignIcon,
  LayersIcon,
  ReceiptTextIcon,
  TargetIcon,
  WalletIcon,
} from "lucide-react"

import { StatCard } from "@/components/stat-card"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getLedger,
  getPortfolio,
  getStats,
  type LedgerEntry,
  type LedgerTransactionType,
} from "@/lib/api"
import {
  formatCents,
  formatDateTime,
  humanizeEnum,
  pnlTone,
  shortSymbol,
} from "@/lib/format"
import { cn } from "cn"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Ledger",
}

const PAGE_SIZE = 50

const typeFilters: {
  value: "" | LedgerTransactionType
  label: string
  icon: React.ReactNode
}[] = [
  { value: "", label: "All entries", icon: <LayersIcon /> },
  { value: "trade", label: "Trades", icon: <ArrowLeftRightIcon /> },
  { value: "fee", label: "Fees", icon: <ReceiptTextIcon /> },
  { value: "budget_reset", label: "Budget resets", icon: <TargetIcon /> },
  { value: "account_init", label: "Account init", icon: <WalletIcon /> },
]

function ledgerHref({
  type,
  page,
}: {
  type?: string
  page?: number
}) {
  const search = new URLSearchParams()
  if (type) search.set("type", type)
  if (page && page > 1) search.set("page", String(page))
  const query = search.toString()
  return `/dashboard/ledger${query ? `?${query}` : ""}`
}

function typeClasses(type: string) {
  switch (type) {
    case "trade":
      return "border-primary/30 bg-primary/10 text-primary"
    case "fee":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:text-amber-400"
    case "budget_reset":
      return "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:border-violet-400/30 dark:text-violet-400"
    case "account_init":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-400"
    default:
      return "border-border text-muted-foreground"
  }
}

function typeIcon(type: string) {
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

function descriptionSymbol(entry: LedgerEntry) {
  const match = entry.description?.match(
    /\b([A-Z][A-Z0-9&.-]*\.(?:NS|BO))\b/
  )
  return match?.[1] ?? null
}

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const type = typeof params.type === "string" ? params.type.trim() : ""
  const requestedPage = Number(params.page)
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0
      ? Math.floor(requestedPage)
      : 1

  const [portfolio, stats, ledgerPage, recent] = await Promise.all([
    getPortfolio(),
    getStats(),
    getLedger({
      page,
      page_size: PAGE_SIZE,
      transaction_type: type || undefined,
    }),
    getLedger({ page_size: 200 }),
  ])

  const recentEntries = recent.items
  const inflow = recentEntries
    .filter((entry) => entry.amount_cents > 0)
    .reduce((sum, entry) => sum + entry.amount_cents, 0)
  const outflow = recentEntries
    .filter((entry) => entry.amount_cents < 0)
    .reduce((sum, entry) => sum + entry.amount_cents, 0)
  const fees = recentEntries
    .filter((entry) => entry.transaction_type === "fee")
    .reduce((sum, entry) => sum + Math.abs(entry.amount_cents), 0)
  const net = inflow + outflow
  const tradeEntries = recentEntries.filter(
    (entry) => entry.transaction_type === "trade"
  )
  const tradeInflow = tradeEntries
    .filter((entry) => entry.amount_cents > 0)
    .reduce((sum, entry) => sum + entry.amount_cents, 0)
  const tradeOutflow = tradeEntries
    .filter((entry) => entry.amount_cents < 0)
    .reduce((sum, entry) => sum + Math.abs(entry.amount_cents), 0)
  const netTrading = tradeInflow - tradeOutflow
  const tradeCount = tradeEntries.length
  const activeFilter =
    typeFilters.find((filter) => filter.value === type) ?? typeFilters[0]

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
          <StatCard
            label="Cash balance"
            value={formatCents(portfolio.cash_cents)}
            change={`${formatCents(portfolio.equity_cents, { compact: true })} invested`}
            changeIcon={<WalletIcon />}
            tone="primary"
            footer={`Total value ${formatCents(portfolio.total_value_cents)}`}
            subfooter={`Account ${portfolio.account_id}`}
          />
          <StatCard
            label="Net trade cash flow"
            value={formatCents(netTrading, { sign: true })}
            valueClassName="whitespace-nowrap"
            change={
              tradeCount
                ? `${tradeCount} cash movements`
                : "No trades yet"
            }
            changeIcon={
              netTrading >= 0 ? <ArrowDownLeftIcon /> : <ArrowUpRightIcon />
            }
            tone="primary"
            footer={`Sold ${formatCents(tradeInflow)} · bought ${formatCents(tradeOutflow)}`}
            subfooter={`${(stats.trades.buys + stats.trades.sells).toLocaleString("en-IN")} total fills`}
          />
          <StatCard
            label="Fees paid"
            value={formatCents(fees)}
            change={
              inflow > 0
                ? `${((fees / inflow) * 100).toFixed(2)}% of inflow`
                : "No inflow"
            }
            changeIcon={<ReceiptTextIcon />}
            tone={fees > 0 ? "warning" : "neutral"}
            footer={`Brokerage, taxes and charges`}
            subfooter={`Across the last ${recentEntries.length} ledger entries`}
          />
          <StatCard
            label="Ledger entries"
            value={ledgerPage.total}
            change={activeFilter.label}
            changeIcon={activeFilter.icon}
            tone="neutral"
            footer={`Page ${ledgerPage.page} of ${Math.max(1, ledgerPage.total_pages)}`}
            subfooter={`${recentEntries.length} shown in the rolling window`}
          />
        </div>

        <Card className="mx-4 lg:mx-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleDollarSignIcon className="size-4 text-muted-foreground" />
              Cash ledger
            </CardTitle>
            <CardDescription>
              Every rupee that entered or left the paper account — trades, fees
              and budget resets.
            </CardDescription>
            <CardAction>
              <Badge variant="outline" className="font-mono text-[10px]">
                {formatCents(portfolio.cash_cents, { compact: true })} cash
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {typeFilters.map((filter) => {
                const active = filter.value === type
                return (
                  <Button
                    key={filter.value || "all"}
                    size="sm"
                    variant={active ? "secondary" : "outline"}
                    className={cn("gap-1.5", active && "font-medium")}
                    nativeButton={false}
                    render={
                      <Link
                        href={ledgerHref({ type: filter.value || undefined })}
                      />
                    }
                  >
                    {filter.icon}
                    {filter.label}
                  </Button>
                )
              })}
            </div>

            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead className="hidden w-44 @xl/main:table-cell">
                      When
                    </TableHead>
                    <TableHead className="hidden w-32 @2xl/main:table-cell">
                      Type
                    </TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="hidden @2xl/main:table-cell">
                      Reference
                    </TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerPage.items.length ? (
                    ledgerPage.items.map((entry) => {
                      const symbol = descriptionSymbol(entry)
                      return (
                        <TableRow key={entry.id}>
                          <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground @xl/main:table-cell">
                            {formatDateTime(entry.created_at)}
                          </TableCell>
                          <TableCell className="hidden @2xl/main:table-cell">
                            <Badge
                              variant="outline"
                              className={cn(
                                "gap-1 text-[10px] capitalize",
                                typeClasses(entry.transaction_type)
                              )}
                            >
                              {typeIcon(entry.transaction_type)}
                              {humanizeEnum(entry.transaction_type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-40 @2xl/main:max-w-md">
                            <span
                              className="line-clamp-2 text-sm"
                              title={
                                entry.description ??
                                humanizeEnum(entry.transaction_type)
                              }
                            >
                              {entry.description ??
                                humanizeEnum(entry.transaction_type)}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-muted-foreground @xl/main:hidden">
                              {formatDateTime(entry.created_at)}
                            </span>
                          </TableCell>
                          <TableCell className="hidden @2xl/main:table-cell">
                            {entry.reference_id ? (
                              symbol ? (
                                <Link
                                  href={`/dashboard/market?symbol=${encodeURIComponent(symbol)}`}
                                  className="font-mono text-xs underline-offset-4 hover:underline"
                                >
                                  {shortSymbol(symbol)}
                                </Link>
                              ) : (
                                <span className="font-mono text-[11px] text-muted-foreground">
                                  {entry.reference_id.slice(0, 8)}
                                </span>
                              )
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-mono text-sm font-medium whitespace-nowrap tabular-nums",
                              pnlTone(entry.amount_cents)
                            )}
                          >
                            {formatCents(entry.amount_cents, { sign: true })}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-32 text-center text-muted-foreground"
                      >
                        No {type ? humanizeEnum(type).toLowerCase() : "ledger"}{" "}
                        entries recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              Showing {ledgerPage.items.length} of {ledgerPage.total}{" "}
              {activeFilter.label.toLowerCase()}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Previous page"
                disabled={ledgerPage.page <= 1}
                nativeButton={false}
                render={
                  <Link
                    href={ledgerHref({
                      type: type || undefined,
                      page: Math.max(1, ledgerPage.page - 1),
                    })}
                    aria-disabled={ledgerPage.page <= 1}
                    tabIndex={ledgerPage.page <= 1 ? -1 : undefined}
                  />
                }
              >
                <ChevronLeftIcon />
              </Button>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {ledgerPage.page} / {Math.max(1, ledgerPage.total_pages)}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Next page"
                disabled={ledgerPage.page >= ledgerPage.total_pages}
                nativeButton={false}
                render={
                  <Link
                    href={ledgerHref({
                      type: type || undefined,
                      page: Math.min(
                        Math.max(1, ledgerPage.total_pages),
                        ledgerPage.page + 1
                      ),
                    })}
                    aria-disabled={
                      ledgerPage.page >= ledgerPage.total_pages
                    }
                    tabIndex={
                      ledgerPage.page >= ledgerPage.total_pages
                        ? -1
                        : undefined
                    }
                  />
                }
              >
                <ChevronRightIcon />
              </Button>
            </div>
          </CardFooter>
        </Card>

        <div className="grid grid-cols-1 items-start gap-4 px-4 pb-2 lg:px-6 @4xl/main:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Where cash goes</CardTitle>
              <CardDescription>
                A quick read on the most recent ledger window.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Inflow</span>
                <span className="font-mono text-xs tabular-nums">
                  {formatCents(inflow)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Outflow</span>
                <span className="font-mono text-xs tabular-nums">
                  {formatCents(Math.abs(outflow))}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Fees</span>
                <span className="font-mono text-xs tabular-nums">
                  {formatCents(fees)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 border-t pt-3">
                <span className="font-medium">Net</span>
                <span
                  className={cn(
                    "font-mono text-xs font-medium tabular-nums",
                    pnlTone(net)
                  )}
                >
                  {formatCents(net, { sign: true })}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ledger mix</CardTitle>
              <CardDescription>
                Entry types in the recent window.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(["trade", "fee", "budget_reset", "account_init"] as const).map(
                (entryType) => {
                  const count = recentEntries.filter(
                    (entry) => entry.transaction_type === entryType
                  ).length
                  const share = recentEntries.length
                    ? (count / recentEntries.length) * 100
                    : 0
                  return (
                    <div key={entryType} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {humanizeEnum(entryType)}
                        </span>
                        <span className="font-mono tabular-nums">{count}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/80"
                          style={{ width: `${Math.max(2, share)}%` }}
                        />
                      </div>
                    </div>
                  )
                }
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Paper accounting</CardTitle>
              <CardDescription>
                How the ledger relates to the portfolio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Initial capital</span>
                <span className="font-mono text-xs tabular-nums">
                  {formatCents(stats.money.initial_cents)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Cost basis</span>
                <span className="font-mono text-xs tabular-nums">
                  {formatCents(portfolio.total_cost_basis_cents)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Valuation</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px]",
                    portfolio.valuation_complete
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-400"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:text-amber-400"
                  )}
                >
                  {portfolio.valuation_complete ? "Complete" : "Partial"}
                </Badge>
              </div>
              <p className="rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                Buys post a negative cash entry and add to cost basis. Sells
                release cash and remove basis. Fees are recorded separately so
                execution cost is always visible.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
