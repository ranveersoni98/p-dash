"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronsLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsRightIcon,
  Columns3Icon,
  EllipsisVerticalIcon,
  SearchIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { TradeHistoryItem } from "@/lib/api"
import {
  formatCents,
  formatDateTime,
  formatPercent,
  formatQuantity,
  pnlBadgeTone,
  pnlTone,
  shortSymbol,
} from "@/lib/format"
import { cn } from "cn"

type SideFilter = "all" | "buy" | "sell"
type SortKey =
  | "created_at"
  | "symbol"
  | "side"
  | "quantity"
  | "price_cents"
  | "notional_cents"

const optionalColumns = [
  { id: "price", label: "Price" },
  { id: "fee", label: "Fee" },
  { id: "source", label: "Source" },
  { id: "realized", label: "Realized P&L" },
] as const

type OptionalColumn = (typeof optionalColumns)[number]["id"]

function SideBadge({ side }: { side: TradeHistoryItem["side"] }) {
  const isBuy = side === "buy"
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 uppercase",
        isBuy
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400"
      )}
    >
      {isBuy ? <TrendingUpIcon /> : <TrendingDownIcon />}
      {side}
    </Badge>
  )
}

function SortButton({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string
  sortKey: SortKey
  sort: { key: SortKey; dir: "asc" | "desc" }
  onSort: (key: SortKey) => void
  className?: string
}) {
  const active = sort.key === sortKey
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={cn(
        "inline-flex items-center gap-1 text-left font-medium transition-colors hover:text-foreground",
        active && "text-foreground",
        className
      )}
    >
      {label}
      {active ? (
        sort.dir === "asc" ? (
          <ArrowUpIcon className="size-3" />
        ) : (
          <ArrowDownIcon className="size-3" />
        )
      ) : (
        <ArrowUpDownIcon className="size-3 text-muted-foreground/60" />
      )}
    </button>
  )
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-right", mono && "font-mono text-xs")}>
        {value}
      </span>
    </div>
  )
}

export function TradesTable({
  trades,
  showViewAll = false,
  headerActions,
  className,
}: {
  trades: TradeHistoryItem[]
  showViewAll?: boolean
  headerActions?: React.ReactNode
  className?: string
}) {
  const [side, setSide] = React.useState<SideFilter>("all")
  const [query, setQuery] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [sort, setSort] = React.useState<{
    key: SortKey
    dir: "asc" | "desc"
  }>({ key: "created_at", dir: "desc" })
  const [selected, setSelected] = React.useState<TradeHistoryItem | null>(null)
  const [visible, setVisible] = React.useState<Record<OptionalColumn, boolean>>(
    {
      price: true,
      fee: true,
      source: true,
      realized: true,
    }
  )

  const counts = React.useMemo(
    () => ({
      all: trades.length,
      buy: trades.filter((trade) => trade.side === "buy").length,
      sell: trades.filter((trade) => trade.side === "sell").length,
    }),
    [trades]
  )

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    return trades
      .filter((trade) => side === "all" || trade.side === side)
      .filter((trade) => {
        if (!needle) return true
        return `${trade.symbol} ${trade.source} ${trade.rationale}`
          .toLowerCase()
          .includes(needle)
      })
  }, [trades, side, query])

  const sorted = React.useMemo(() => {
    const copy = [...filtered]
    copy.sort((a, b) => {
      const aValue =
        sort.key === "created_at"
          ? new Date(a.created_at).getTime()
          : a[sort.key]
      const bValue =
        sort.key === "created_at"
          ? new Date(b.created_at).getTime()
          : b[sort.key]

      let result = 0
      if (typeof aValue === "string" && typeof bValue === "string") {
        result = aValue.localeCompare(bValue)
      } else {
        result = Number(aValue ?? 0) - Number(bValue ?? 0)
      }

      return sort.dir === "asc" ? result : -result
    })
    return copy
  }, [filtered, sort])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageRows = sorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  function toggleSort(key: SortKey) {
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "created_at" ? "desc" : "asc" }
    )
  }

  const from = sorted.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, sorted.length)

  return (
    <>
      <Tabs
        value={side}
        onValueChange={(value) => {
          setSide(value as SideFilter)
          setPage(1)
        }}
        className={cn("w-full flex-col justify-start gap-4", className)}
      >
        <div className="flex flex-wrap items-center gap-2 px-4 lg:px-6">
          <TabsList className="**:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1">
            <TabsTrigger value="all">
              All <Badge variant="secondary">{counts.all}</Badge>
            </TabsTrigger>
            <TabsTrigger value="buy">
              Buys <Badge variant="secondary">{counts.buy}</Badge>
            </TabsTrigger>
            <TabsTrigger value="sell">
              Sells <Badge variant="secondary">{counts.sell}</Badge>
            </TabsTrigger>
          </TabsList>

          <div className="relative ml-auto">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Label htmlFor="trade-search" className="sr-only">
              Search trades
            </Label>
            <Input
              id="trade-search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              placeholder="Search symbol…"
              className="h-8 w-40 pl-8 lg:w-52"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="sm" />}
            >
              <Columns3Icon data-icon="inline-start" />
              Columns
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {optionalColumns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={visible[column.id]}
                  onCheckedChange={(checked) =>
                    setVisible((current) => ({
                      ...current,
                      [column.id]: Boolean(checked),
                    }))
                  }
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {headerActions}
          {showViewAll ? (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/dashboard/trades" />}
            >
              View all
            </Button>
          ) : null}
        </div>

        <div className="px-4 lg:px-6">
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>
                    <SortButton
                      label="Symbol"
                      sortKey="symbol"
                      sort={sort}
                      onSort={toggleSort}
                    />
                  </TableHead>
                  <TableHead>
                    <SortButton
                      label="Side"
                      sortKey="side"
                      sort={sort}
                      onSort={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="text-right">
                    <SortButton
                      label="Qty"
                      sortKey="quantity"
                      sort={sort}
                      onSort={toggleSort}
                      className="justify-end"
                    />
                  </TableHead>
                  {visible.price ? (
                    <TableHead className="hidden text-right @2xl/main:table-cell">
                      <SortButton
                        label="Price"
                        sortKey="price_cents"
                        sort={sort}
                        onSort={toggleSort}
                        className="justify-end"
                      />
                    </TableHead>
                  ) : null}
                  <TableHead className="text-right">
                    <SortButton
                      label="Notional"
                      sortKey="notional_cents"
                      sort={sort}
                      onSort={toggleSort}
                      className="justify-end"
                    />
                  </TableHead>
                  {visible.fee ? (
                    <TableHead className="hidden text-right @3xl/main:table-cell">
                      Fee
                    </TableHead>
                  ) : null}
                  {visible.realized ? (
                    <TableHead className="hidden text-right @4xl/main:table-cell">
                      Realized
                    </TableHead>
                  ) : null}
                  {visible.source ? (
                    <TableHead className="hidden @xl/main:table-cell">
                      Source
                    </TableHead>
                  ) : null}
                  <TableHead className="hidden text-right @2xl/main:table-cell">
                    <SortButton
                      label="Executed"
                      sortKey="created_at"
                      sort={sort}
                      onSort={toggleSort}
                      className="justify-end"
                    />
                  </TableHead>
                  <TableHead className="w-8">
                    <span className="sr-only">Details</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.length ? (
                  pageRows.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => setSelected(trade)}
                          className="font-medium text-foreground underline-offset-4 hover:underline"
                          title={trade.symbol}
                        >
                          {shortSymbol(trade.symbol)}
                        </button>
                      </TableCell>
                      <TableCell>
                        <SideBadge side={trade.side} />
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatQuantity(trade.quantity)}
                      </TableCell>
                      {visible.price ? (
                        <TableCell className="hidden text-right font-mono tabular-nums @2xl/main:table-cell">
                          {formatCents(trade.price_cents)}
                        </TableCell>
                      ) : null}
                      <TableCell className="text-right font-mono font-medium tabular-nums">
                        {formatCents(trade.notional_cents)}
                      </TableCell>
                      {visible.fee ? (
                        <TableCell className="hidden text-right font-mono text-xs text-muted-foreground tabular-nums @3xl/main:table-cell">
                          {formatCents(trade.fee_cents)}
                        </TableCell>
                      ) : null}
                      {visible.realized ? (
                        <TableCell className="hidden text-right @4xl/main:table-cell">
                          {trade.realized_pnl_cents === null ||
                          trade.realized_pnl_cents === undefined ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <Badge
                              variant="outline"
                              className={cn(
                                "font-mono tabular-nums",
                                pnlBadgeTone(trade.realized_pnl_cents)
                              )}
                            >
                              {formatCents(trade.realized_pnl_cents, {
                                sign: true,
                              })}
                            </Badge>
                          )}
                        </TableCell>
                      ) : null}
                      {visible.source ? (
                        <TableCell className="hidden @xl/main:table-cell">
                          <Badge
                            variant="outline"
                            className="text-[11px] text-muted-foreground"
                          >
                            {trade.source}
                          </Badge>
                        </TableCell>
                      ) : null}
                      <TableCell
                        className="hidden text-right text-xs text-muted-foreground @2xl/main:table-cell"
                        title={formatDateTime(trade.created_at)}
                      >
                        {formatDateTime(trade.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground"
                          onClick={() => setSelected(trade)}
                        >
                          <EllipsisVerticalIcon />
                          <span className="sr-only">View trade</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No trades match this filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 px-4 lg:px-6">
          <div className="text-sm text-muted-foreground">
            Showing {from}–{to} of {sorted.length} trade
            {sorted.length === 1 ? "" : "s"}
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 sm:flex">
              <Label htmlFor="trade-rows" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${pageSize}`}
                onValueChange={(value) => {
                  if (value) {
                    setPageSize(Number(value))
                    setPage(1)
                  }
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="trade-rows">
                  <SelectValue placeholder={pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectGroup>
                    {[10, 20, 30, 50].map((size) => (
                      <SelectItem key={size} value={`${size}`}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm font-medium">
              Page {currentPage} of {pageCount}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setPage(1)}
                disabled={currentPage <= 1}
              >
                <span className="sr-only">First page</span>
                <ChevronsLeftIcon />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={currentPage <= 1}
              >
                <span className="sr-only">Previous page</span>
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() =>
                  setPage((value) => Math.min(pageCount, value + 1))
                }
                disabled={currentPage >= pageCount}
              >
                <span className="sr-only">Next page</span>
                <ChevronRightIcon />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setPage(pageCount)}
                disabled={currentPage >= pageCount}
              >
                <span className="sr-only">Last page</span>
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </Tabs>

      <Sheet
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      >
        <SheetContent className="sm:max-w-md">
          {selected ? (
            <>
              <SheetHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <SheetTitle>{selected.symbol}</SheetTitle>
                  <SideBadge side={selected.side} />
                </div>
                <SheetDescription>
                  Executed {formatDateTime(selected.created_at)} ·{" "}
                  {selected.source}
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 space-y-4 overflow-y-auto px-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">
                      Quantity
                    </div>
                    <div className="mt-1 font-mono text-lg font-medium tabular-nums">
                      {formatQuantity(selected.quantity)}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">
                      Fill price
                    </div>
                    <div className="mt-1 font-mono text-lg font-medium tabular-nums">
                      {formatCents(selected.price_cents)}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">
                      Notional
                    </div>
                    <div className="mt-1 font-mono text-lg font-medium tabular-nums">
                      {formatCents(selected.notional_cents)}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">
                      Realized P&L
                    </div>
                    <div
                      className={cn(
                        "mt-1 font-mono text-lg font-medium tabular-nums",
                        pnlTone(selected.realized_pnl_cents)
                      )}
                    >
                      {selected.realized_pnl_cents === null ||
                      selected.realized_pnl_cents === undefined
                        ? "—"
                        : formatCents(selected.realized_pnl_cents, {
                            sign: true,
                          })}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-xs">
                  <p className="font-medium text-foreground">Execution note</p>
                  <p className="leading-relaxed text-muted-foreground">
                    {selected.rationale}
                  </p>
                </div>

                <div className="space-y-2.5 rounded-lg border p-3">
                  <DetailRow
                    label="Fee"
                    value={formatCents(selected.fee_cents)}
                  />
                  <DetailRow
                    label="Slippage"
                    value={formatPercent((selected.slippage_bps ?? 0) / 100)}
                  />
                  <DetailRow
                    label="Quote price"
                    value={formatCents(selected.quote_price_cents)}
                  />
                  <DetailRow
                    label="Cash delta"
                    value={formatCents(selected.cash_delta_cents, {
                      sign: true,
                    })}
                  />
                  <DetailRow
                    label="Cost basis"
                    value={formatCents(selected.cost_basis_cents)}
                  />
                  <DetailRow label="Trade ID" value={selected.id} mono />
                </div>
              </div>
              <SheetFooter>
                <SheetClose render={<Button variant="outline" />}>
                  Close
                </SheetClose>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}
