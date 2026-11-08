import Link from "next/link"
import {
  ArrowUpRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Clock3Icon,
  GaugeIcon,
  Globe2Icon,
  InfoIcon,
  SearchIcon,
  SparklesIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WavesIcon,
} from "lucide-react"

import { NewTradeButton } from "@/components/new-trade-button"
import { PriceChart } from "@/components/price-chart"
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
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getFundamentals,
  getHealth,
  getMovers,
  getPositions,
  getPriceHistory,
  getQuotes,
  getRankings,
  getResearchStatus,
  getSignal,
  getSymbols,
  getMacro,
  type CompanyFundamentals,
  type EconomicsRank,
  type MarketQuote,
  type Mover,
  type PriceHistoryResponse,
  type TradingSignal,
} from "@/lib/api"
import {
  formatBps,
  formatCents,
  formatDateTime,
  formatDuration,
  formatNumber,
  formatQualityNote,
  formatQuantity,
  humanizeEnum,
  pnlBadgeTone,
  pnlTone,
  shortSymbol,
} from "@/lib/format"
import { cn } from "cn"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Market",
}

function marketHref({
  q,
  page,
  symbol,
}: {
  q?: string
  page?: number
  symbol?: string
}) {
  const search = new URLSearchParams()
  if (q) search.set("q", q)
  if (page && page > 1) search.set("page", String(page))
  if (symbol) search.set("symbol", symbol)
  const query = search.toString()
  return `/dashboard/market${query ? `?${query}` : ""}`
}

function SignalBadge({ action }: { action: TradingSignal["action"] }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 uppercase",
        action === "buy"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-400"
          : action === "sell"
            ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:border-rose-400/30 dark:text-rose-400"
            : "text-muted-foreground"
      )}
    >
      {action === "buy" ? (
        <TrendingUpIcon />
      ) : action === "sell" ? (
        <TrendingDownIcon />
      ) : (
        <WavesIcon />
      )}
      {action}
    </Badge>
  )
}

function MoverRow({ mover }: { mover: Mover }) {
  return (
    <Link
      href={marketHref({ symbol: mover.symbol })}
      className="flex items-center justify-between gap-3 rounded-lg border p-2 text-sm transition-colors hover:bg-muted/50"
    >
      <span className="min-w-0">
        <span className="block truncate font-medium">
          {shortSymbol(mover.symbol)}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {mover.name ?? mover.provider}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block font-mono text-sm tabular-nums">
          {formatCents(mover.price_cents)}
        </span>
        <span
          className={cn(
            "block font-mono text-xs tabular-nums",
            pnlTone(mover.day_change_bps)
          )}
        >
          {formatBps(mover.day_change_bps, { sign: true })}
        </span>
      </span>
    </Link>
  )
}

function EmptyPulse({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
      <WavesIcon className="size-8 text-muted-foreground/40" />
      {children}
    </div>
  )
}

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const q = typeof params.q === "string" ? params.q.trim() : ""
  const requestedPage = Number(params.page)
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0
      ? Math.floor(requestedPage)
      : 1
  const symbolParam =
    typeof params.symbol === "string" ? params.symbol.trim() : ""

  const [book, movers, macro, research, rankings, symbolPage, health] =
    await Promise.all([
      getPositions(),
      getMovers(6),
      getMacro(),
      getResearchStatus(),
      getRankings(),
      getSymbols({ q: q || undefined, page, page_size: 12 }),
      getHealth(),
    ])

  const holdings = [...book.positions].sort(
    (a, b) => (b.market_value_cents ?? 0) - (a.market_value_cents ?? 0)
  )
  const selectedSymbol = symbolParam || holdings[0]?.symbol || "RELIANCE.NS"
  const directorySymbols = symbolPage.items.map((item) => item.symbol)
  const watchlist = holdings.slice(0, 5)

  const quoteSymbols = [
    ...new Set([
      selectedSymbol,
      ...directorySymbols,
      ...watchlist.map((position) => position.symbol),
    ]),
  ]

  const quotesResponse = await getQuotes(quoteSymbols).catch(() => null)
  const quoteMap = new Map<string, MarketQuote>(
    (quotesResponse?.quotes ?? []).map((quote) => [quote.symbol, quote])
  )

  const [signalResult, historyResult, fundamentalsResult] =
    await Promise.allSettled([
      getSignal(selectedSymbol),
      getPriceHistory(selectedSymbol, 90),
      getFundamentals(selectedSymbol),
    ])

  const signal = signalResult.status === "fulfilled" ? signalResult.value : null
  const history: PriceHistoryResponse | null =
    historyResult.status === "fulfilled" ? historyResult.value : null
  const fundamentals: CompanyFundamentals | null =
    fundamentalsResult.status === "fulfilled" ? fundamentalsResult.value : null
  const fundamentalsError =
    fundamentalsResult.status === "rejected"
      ? fundamentalsResult.reason instanceof Error
        ? fundamentalsResult.reason.message
        : "Fundamentals are unavailable."
      : null

  const selectedQuote = quoteMap.get(selectedSymbol) ?? null
  const serverNow = new Date(health.server_time).getTime()
  const macroAgeSecs = Math.max(
    0,
    (serverNow - new Date(macro.fetched_at).getTime()) / 1000
  )
  const selectedName =
    fundamentals?.name ??
    symbolPage.items.find((item) => item.symbol === selectedSymbol)?.name ??
    holdings.find((position) => position.symbol === selectedSymbol)?.name ??
    selectedSymbol

  const gainers = movers.gainers.slice(0, 4)
  const losers = movers.losers.slice(0, 4)
  const hasMovers = gainers.length > 0 || losers.length > 0
  const topFactors = signal
    ? [...signal.factors]
        .sort(
          (a, b) =>
            Math.abs(b.score_bps * b.weight_bps) -
            Math.abs(a.score_bps * a.weight_bps)
        )
        .slice(0, 5)
    : []
  const factorScale = Math.max(
    1,
    ...topFactors.map((factor) => Math.abs(factor.score_bps))
  )
  const pulse = watchlist
    .map((position) => ({
      position,
      quote: quoteMap.get(position.symbol),
    }))
    .sort(
      (a, b) =>
        Math.abs(b.quote?.day_change_bps ?? 0) -
        Math.abs(a.quote?.day_change_bps ?? 0)
    )

  const bookMovers = watchlist.flatMap((position) => {
    const quote = quoteMap.get(position.symbol)
    return quote ? [{ position, quote }] : []
  })
  const bookGainers = bookMovers
    .filter((entry) => entry.quote.day_change_bps > 0)
    .sort((a, b) => b.quote.day_change_bps - a.quote.day_change_bps)
    .slice(0, 3)
    .map((entry) => ({ ...entry.quote, name: entry.position.name }))
  const bookLosers = bookMovers
    .filter((entry) => entry.quote.day_change_bps < 0)
    .sort((a, b) => a.quote.day_change_bps - b.quote.day_change_bps)
    .slice(0, 3)
    .map((entry) => ({ ...entry.quote, name: entry.position.name }))
  const hasBookMovers = bookGainers.length > 0 || bookLosers.length > 0

  const macroTone =
    macro.regime === "risk_off" || macro.regime === "high_volatility"
      ? "warning"
      : macro.regime === "risk_on"
        ? "positive"
        : "neutral"

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
          <StatCard
            label="Market session"
            value={health.market_open ? "Open" : "Closed"}
            change={health.market_open ? "Trading" : "Between sessions"}
            changeIcon={<Clock3Icon />}
            tone={health.market_open ? "positive" : "primary"}
            footer="NSE equities · 09:15–15:30 IST"
            subfooter={
              selectedQuote
                ? `${selectedQuote.provider} · ${formatDateTime(selectedQuote.observed_at)}`
                : "Waiting for the next quote"
            }
          />
          <StatCard
            label="Tracked universe"
            value={symbolPage.total}
            change="Nifty 500"
            changeIcon={<Globe2Icon />}
            tone="neutral"
            footer={`${book.positions.length} held · ${quoteSymbols.length} on screen`}
            subfooter={`Directory page ${symbolPage.page} of ${symbolPage.total_pages}`}
          />
          <StatCard
            label="Macro regime"
            value={humanizeEnum(macro.regime)}
            change={
              macro.vix_cents === null || macro.vix_cents === undefined
                ? "India-only"
                : `VIX ${formatNumber(macro.vix_cents / 100, 2)}`
            }
            changeIcon={<GaugeIcon />}
            tone={macroTone}
            footer={macro.vix_note || "Macro snapshot from the research loop"}
            subfooter={`Updated ${formatDateTime(macro.fetched_at)}`}
          />
          <StatCard
            label="Research loop"
            value={research.running ? "Running" : "Paused"}
            change={`${research.symbols_prefetched} prefetched`}
            changeIcon={<SparklesIcon />}
            tone={research.running ? "positive" : "neutral"}
            footer={
              research.macro_cached ? "Macro cache warm" : "Macro cache empty"
            }
            subfooter={`Last cycle ${formatDateTime(research.last_cycle_at)}`}
          />
        </div>

        <div className="grid grid-cols-1 items-start gap-4 px-4 lg:px-6 @4xl/main:grid-cols-3">
          <div className="@4xl/main:col-span-2">
            <PriceChart
              symbol={selectedSymbol}
              name={selectedName}
              quote={selectedQuote}
              history={history}
            />
          </div>

          <div className="flex flex-col gap-4">
            <Card className="@container/card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Signal
                  <span className="font-mono text-xs font-normal text-muted-foreground">
                    {shortSymbol(selectedSymbol)}
                  </span>
                </CardTitle>
                <CardDescription>
                  Live technical read from the engine.
                </CardDescription>
                <CardAction>
                  {signal ? <SignalBadge action={signal.action} /> : null}
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-4">
                {signal ? (
                  <>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg border bg-muted/30 p-2">
                        <div className="text-[11px] text-muted-foreground">
                          Confidence
                        </div>
                        <div className="mt-0.5 font-mono text-sm font-medium tabular-nums">
                          {formatBps(signal.confidence_bps, {
                            decimals: 0,
                          })}
                        </div>
                      </div>
                      <div className="rounded-lg border bg-muted/30 p-2">
                        <div className="text-[11px] text-muted-foreground">
                          Suggested
                        </div>
                        <div className="mt-0.5 font-mono text-sm font-medium tabular-nums">
                          {formatQuantity(signal.suggested_quantity)}
                        </div>
                      </div>
                      <div className="rounded-lg border bg-muted/30 p-2">
                        <div className="text-[11px] text-muted-foreground">
                          Max size
                        </div>
                        <div className="mt-0.5 font-mono text-sm font-medium tabular-nums">
                          {formatCents(signal.max_notional_cents, {
                            compact: true,
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {topFactors.map((factor) => {
                        const magnitude = Math.min(
                          100,
                          (Math.abs(factor.score_bps) / factorScale) * 100
                        )
                        return (
                          <div key={factor.name} className="space-y-1">
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="truncate text-muted-foreground">
                                {humanizeEnum(factor.name)}
                              </span>
                              <span
                                className={cn(
                                  "shrink-0 font-mono tabular-nums",
                                  pnlTone(factor.score_bps)
                                )}
                              >
                                {formatBps(factor.score_bps, { sign: true })}
                              </span>
                            </div>
                            <div className="h-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  factor.score_bps >= 0
                                    ? "bg-emerald-500/70"
                                    : "bg-rose-500/70"
                                )}
                                style={{
                                  width: `${Math.max(4, magnitude)}%`,
                                }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                      {signal.rationale}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Quality {signal.signal_quality}</span>
                      <span>{signal.factors.length} factors</span>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No signal is available for this symbol right now.
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <NewTradeButton
                  defaultSymbol={selectedSymbol}
                  label="Trade this symbol"
                  variant="outline"
                  size="sm"
                />
              </CardFooter>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 px-4 lg:px-6 @4xl/main:grid-cols-3">
          <Card className="@4xl/main:col-span-2">
            <CardHeader>
              <CardTitle>Market movers</CardTitle>
              <CardDescription>
                Session leaders and laggards across the Nifty 500.
              </CardDescription>
              <CardAction>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {formatDateTime(movers.generated_at)}
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
                      <MoverRow key={mover.symbol} mover={mover} />
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-400">
                      <TrendingDownIcon className="size-3.5" />
                      Losers
                    </div>
                    {losers.map((mover) => (
                      <MoverRow key={mover.symbol} mover={mover} />
                    ))}
                  </div>
                </div>
              ) : hasBookMovers ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-2.5 text-xs text-muted-foreground">
                    <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                      Market-wide movers publish when the NSE session opens.
                      Showing the largest daily moves in your book instead.
                    </span>
                  </div>
                  <div className="grid gap-4 @xl/main:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        <TrendingUpIcon className="size-3.5" />
                        Book gainers
                      </div>
                      {bookGainers.length ? (
                        bookGainers.map((mover) => (
                          <MoverRow key={mover.symbol} mover={mover} />
                        ))
                      ) : (
                        <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                          No holdings are up today.
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-400">
                        <TrendingDownIcon className="size-3.5" />
                        Book losers
                      </div>
                      {bookLosers.length ? (
                        bookLosers.map((mover) => (
                          <MoverRow key={mover.symbol} mover={mover} />
                        ))
                      ) : (
                        <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                          No holdings are down today.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyPulse>
                  <span className="font-medium text-foreground">
                    No movers while the session is closed
                  </span>
                  <span>
                    Quotes continue to refresh from the last close. Movers
                    publish once the NSE reopens.
                  </span>
                </EmptyPulse>
              )}
            </CardContent>
            <CardFooter className="justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {hasMovers
                  ? "Top 4 gainers and losers across the Nifty 500."
                  : hasBookMovers
                    ? "Largest daily moves across your open positions."
                    : "Movers resume when the NSE session opens."}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 px-0"
                nativeButton={false}
                render={<Link href="/dashboard/portfolio" />}
              >
                Portfolio
                <ArrowUpRightIcon data-icon="inline-end" />
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Holdings pulse</CardTitle>
              <CardDescription>
                Latest quotes across the book, ranked by daily move.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pulse.length ? (
                <div className="space-y-2">
                  {pulse.map(({ position, quote }) => (
                    <Link
                      key={position.symbol}
                      href={marketHref({ symbol: position.symbol })}
                      className="flex items-center justify-between gap-2 rounded-lg border p-2 text-sm transition-colors hover:bg-muted/50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {shortSymbol(position.symbol)}
                        </span>
                        <span className="block font-mono text-[11px] text-muted-foreground tabular-nums">
                          {formatCents(position.market_value_cents)}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        {quote ? (
                          <>
                            <span className="block font-mono text-xs tabular-nums">
                              {formatCents(quote.price_cents)}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "mt-0.5 gap-0.5 px-1.5 py-0 font-mono text-[10px] tabular-nums",
                                pnlBadgeTone(quote.day_change_bps)
                              )}
                            >
                              {formatBps(quote.day_change_bps, {
                                sign: true,
                              })}
                            </Badge>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No quote
                          </span>
                        )}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyPulse>No open holdings to quote.</EmptyPulse>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="ghost"
                size="sm"
                className="px-0 text-muted-foreground"
                nativeButton={false}
                render={<Link href="/dashboard/portfolio" />}
              >
                Open portfolio
                <ArrowUpRightIcon data-icon="inline-end" />
              </Button>
            </CardFooter>
          </Card>
        </div>

        <Card className="mx-4 lg:mx-6">
          <CardHeader>
            <CardTitle>Symbol directory</CardTitle>
            <CardDescription>
              Search the active Nifty 500 universe and load a symbol into the
              chart.
            </CardDescription>
            <CardAction>
              <Badge variant="outline" className="font-mono text-[10px]">
                {symbolPage.total} symbols
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              action="/dashboard/market"
              method="get"
              className="flex flex-wrap items-center gap-2"
            >
              <input type="hidden" name="symbol" value={selectedSymbol} />
              <div className="relative min-w-0 flex-1 sm:max-w-xs">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="q"
                  defaultValue={q}
                  placeholder="Search symbol or company…"
                  className="h-8 pl-8"
                  aria-label="Search symbols"
                />
              </div>
              <Button type="submit" size="sm" variant="outline">
                Search
              </Button>
              {q ? (
                <Button
                  size="sm"
                  variant="ghost"
                  nativeButton={false}
                  render={
                    <Link href={marketHref({ symbol: selectedSymbol })} />
                  }
                >
                  Clear
                </Button>
              ) : null}
            </form>

            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead className="hidden @2xl/main:table-cell">
                      Source
                    </TableHead>
                    <TableHead className="text-right">Quote</TableHead>
                    <TableHead className="text-right">Day</TableHead>
                    <TableHead className="hidden text-right @3xl/main:table-cell">
                      Last selected
                    </TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {symbolPage.items.length ? (
                    symbolPage.items.map((symbol) => {
                      const quote = quoteMap.get(symbol.symbol)
                      const active = symbol.symbol === selectedSymbol
                      return (
                        <TableRow
                          key={symbol.symbol}
                          data-state={active ? "selected" : undefined}
                        >
                          <TableCell>
                            <Link
                              href={marketHref({
                                q,
                                page: symbolPage.page,
                                symbol: symbol.symbol,
                              })}
                              className="flex flex-col"
                            >
                              <span className="font-medium">
                                {shortSymbol(symbol.symbol)}
                              </span>
                              <span className="max-w-56 truncate text-xs text-muted-foreground">
                                {symbol.name}
                              </span>
                            </Link>
                          </TableCell>
                          <TableCell className="hidden @2xl/main:table-cell">
                            <Badge variant="outline" className="text-[10px]">
                              {symbol.source}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {quote ? formatCents(quote.price_cents) : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {quote ? (
                              <span
                                className={cn(
                                  "font-mono text-xs tabular-nums",
                                  pnlTone(quote.day_change_bps)
                                )}
                              >
                                {formatBps(quote.day_change_bps, {
                                  sign: true,
                                })}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden text-right text-xs text-muted-foreground @3xl/main:table-cell">
                            {formatDateTime(symbol.last_selected_at)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Open ${symbol.symbol}`}
                              nativeButton={false}
                              render={
                                <Link
                                  href={marketHref({
                                    q,
                                    page: symbolPage.page,
                                    symbol: symbol.symbol,
                                  })}
                                />
                              }
                            >
                              <ArrowUpRightIcon />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No symbols match “{q}”. Try a different search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              Showing {symbolPage.items.length} of {symbolPage.total} symbols
              {q ? ` matching “${q}”` : ""}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Previous page"
                disabled={symbolPage.page <= 1}
                nativeButton={false}
                render={
                  <Link
                    href={marketHref({
                      q,
                      page: Math.max(1, symbolPage.page - 1),
                      symbol: selectedSymbol,
                    })}
                    aria-disabled={symbolPage.page <= 1}
                    tabIndex={symbolPage.page <= 1 ? -1 : undefined}
                  />
                }
              >
                <ChevronLeftIcon />
              </Button>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {symbolPage.page} / {symbolPage.total_pages}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Next page"
                disabled={symbolPage.page >= symbolPage.total_pages}
                nativeButton={false}
                render={
                  <Link
                    href={marketHref({
                      q,
                      page: Math.min(
                        symbolPage.total_pages,
                        symbolPage.page + 1
                      ),
                      symbol: selectedSymbol,
                    })}
                    aria-disabled={symbolPage.page >= symbolPage.total_pages}
                    tabIndex={
                      symbolPage.page >= symbolPage.total_pages ? -1 : undefined
                    }
                  />
                }
              >
                <ChevronRightIcon />
              </Button>
            </div>
          </CardFooter>
        </Card>

        <div className="grid grid-cols-1 items-start gap-4 px-4 lg:px-6 @4xl/main:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Macro & research</CardTitle>
              <CardDescription>
                Context the engine applies to every signal.
              </CardDescription>
              <CardAction>
                <Badge variant="outline" className="capitalize">
                  {humanizeEnum(macro.regime)}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex-1 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">VIX</span>
                <span className="font-mono text-xs tabular-nums">
                  {macro.vix_cents === null ||
                  macro.vix_cents === undefined
                    ? "—"
                    : formatNumber(macro.vix_cents / 100, 2)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Risk-off penalty</span>
                <span className="font-mono text-xs tabular-nums">
                  {formatBps(macro.risk_off_penalty_bps)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Prefetched</span>
                <span className="font-mono text-xs tabular-nums">
                  {research.symbols_prefetched} symbols
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Research loop</span>
                <span className="font-mono text-xs tabular-nums">
                  {research.running ? "Running" : "Paused"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Snapshot age</span>
                <span className="font-mono text-xs tabular-nums">
                  {formatDuration(macroAgeSecs)} ago
                </span>
              </div>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              Research runs every few minutes across the active universe.
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fundamentals</CardTitle>
              <CardDescription>
                Company profile for {shortSymbol(selectedSymbol)}.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-3 text-sm">
              {fundamentals ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Sector</span>
                    <span className="text-right text-xs font-medium">
                      {fundamentals.sector} · {fundamentals.industry}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">
                      Recommendation
                    </span>
                    <Badge variant="outline" className="capitalize">
                      {fundamentals.recommendation}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Market cap</span>
                    <span className="font-mono text-xs tabular-nums">
                      {formatCents(fundamentals.market_cap_cents, {
                        compact: true,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">P/E</span>
                    <span className="font-mono text-xs tabular-nums">
                      {fundamentals.pe_ratio?.toFixed(2) ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Target price</span>
                    <span className="font-mono text-xs tabular-nums">
                      {formatCents(fundamentals.target_price_cents)}
                    </span>
                  </div>
                  <p className="line-clamp-4 border-t pt-3 text-xs leading-relaxed text-muted-foreground">
                    {fundamentals.description}
                  </p>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
                  <Globe2Icon className="size-8 text-muted-foreground/40" />
                  <span className="font-medium text-foreground">
                    Fundamentals paused
                  </span>
                  <span>
                    {fundamentalsError ??
                      "No company profile is cached for this symbol."}
                  </span>
                </div>
              )}
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              Profiles refresh daily while fundamentals providers are healthy.
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Research rankings</CardTitle>
              <CardDescription>
                Quality, growth and value scores from the research loop.
              </CardDescription>
              <CardAction>
                <Badge variant="outline" className="text-[10px]">
                  {rankings.length} ranked
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex-1">
              {rankings.length ? (
                <div className="space-y-2">
                  {rankings.slice(0, 6).map((rank: EconomicsRank) => (
                    <Link
                      key={rank.symbol}
                      href={marketHref({ symbol: rank.symbol })}
                      className="flex items-center justify-between gap-3 rounded-lg border p-2.5 text-sm transition-colors hover:bg-muted/50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {shortSymbol(rank.symbol)}
                        </span>
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {formatQualityNote(rank.quality_note)}
                        </span>
                      </span>
                      <span className="flex shrink-0 gap-3 font-mono text-[11px] tabular-nums">
                        <span className="text-muted-foreground">
                          Q {formatBps(rank.quality_bps)}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          G {formatBps(rank.growth_bps)}
                        </span>
                        <span className="text-amber-600 dark:text-amber-400">
                          V {formatBps(rank.value_bps)}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyPulse>
                  <span className="font-medium text-foreground">
                    Rankings populate after the next research cycle
                  </span>
                  <span>
                    The loop is {research.running ? "running" : "paused"} and
                    has prefetched {research.symbols_prefetched} symbols so far.
                  </span>
                </EmptyPulse>
              )}
            </CardContent>
            <CardFooter className="justify-between gap-2 text-xs text-muted-foreground">
              <span>Sorted by quality score.</span>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 px-0"
                nativeButton={false}
                render={<Link href="/dashboard/engine" />}
              >
                Engine
                <ArrowUpRightIcon data-icon="inline-end" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
