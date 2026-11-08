"use client"

import * as React from "react"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronsLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsRightIcon,
  SearchIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { PositionDetail } from "@/lib/api"
import {
  formatBps,
  formatCents,
  formatPercent,
  formatQuantity,
  pnlBadgeTone,
  pnlTone,
  shortSymbol,
} from "@/lib/format"
import { cn } from "cn"

type Filter = "all" | "winners" | "losers"
type SortKey =
  | "symbol"
  | "quantity"
  | "avg_cost_cents"
  | "market_price_cents"
  | "market_value_cents"
  | "weight_bps"
  | "day_change_bps"
  | "unrealized_pnl_cents"

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

export function PositionsTable({
  positions,
  headerActions,
}: {
  positions: PositionDetail[]
  headerActions?: React.ReactNode
}) {
  const [filter, setFilter] = React.useState<Filter>("all")
  const [query, setQuery] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [sort, setSort] = React.useState<{
    key: SortKey
    dir: "asc" | "desc"
  }>({ key: "market_value_cents", dir: "desc" })

  const counts = React.useMemo(
    () => ({
      all: positions.length,
      winners: positions.filter((position) => (position.unrealized_pnl_cents ?? 0) > 0)
        .length,
      losers: positions.filter((position) => (position.unrealized_pnl_cents ?? 0) < 0)
        .length,
    }),
    [positions]
  )

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    return positions
      .filter((position) => {
        const pnl = position.unrealized_pnl_cents ?? 0
        if (filter === "winners") return pnl > 0
        if (filter === "losers") return pnl < 0
        return true
      })
      .filter((position) => {
        if (!needle) return true
        return `${position.symbol} ${position.name ?? ""}`
          .toLowerCase()
          .includes(needle)
      })
  }, [positions, filter, query])

  const sorted = React.useMemo(() => {
    const copy = [...filtered]
    copy.sort((a, b) => {
      const aValue = a[sort.key]
      const bValue = b[sort.key]
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
        : { key, dir: key === "symbol" ? "asc" : "desc" }
    )
  }

  const from = sorted.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, sorted.length)

  return (
    <Tabs
      value={filter}
      onValueChange={(value) => {
        setFilter(value as Filter)
        setPage(1)
      }}
      className="w-full flex-col justify-start gap-4"
    >
      <div className="flex flex-wrap items-center gap-2 px-4 lg:px-6">
        <TabsList className="**:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1">
          <TabsTrigger value="all">
            All <Badge variant="secondary">{counts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="winners">
            Winners <Badge variant="secondary">{counts.winners}</Badge>
          </TabsTrigger>
          <TabsTrigger value="losers">
            Losers <Badge variant="secondary">{counts.losers}</Badge>
          </TabsTrigger>
        </TabsList>
        <div className="relative ml-auto">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Label htmlFor="position-search" className="sr-only">
            Search positions
          </Label>
          <Input
            id="position-search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
            placeholder="Search holdings…"
            className="h-8 w-44 pl-8 lg:w-56"
          />
        </div>
        {headerActions}
      </div>

      <div className="px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>
                  <SortButton
                    label="Holding"
                    sortKey="symbol"
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
                <TableHead className="hidden text-right @3xl/main:table-cell">
                  <SortButton
                    label="Avg cost"
                    sortKey="avg_cost_cents"
                    sort={sort}
                    onSort={toggleSort}
                    className="justify-end"
                  />
                </TableHead>
                <TableHead className="hidden text-right @2xl/main:table-cell">
                  <SortButton
                    label="LTP"
                    sortKey="market_price_cents"
                    sort={sort}
                    onSort={toggleSort}
                    className="justify-end"
                  />
                </TableHead>
                <TableHead className="text-right">
                  <SortButton
                    label="Value"
                    sortKey="market_value_cents"
                    sort={sort}
                    onSort={toggleSort}
                    className="justify-end"
                  />
                </TableHead>
                <TableHead className="hidden @2xl/main:table-cell">
                  <SortButton
                    label="Weight"
                    sortKey="weight_bps"
                    sort={sort}
                    onSort={toggleSort}
                  />
                </TableHead>
                <TableHead className="hidden text-right @xl/main:table-cell">
                  <SortButton
                    label="Day"
                    sortKey="day_change_bps"
                    sort={sort}
                    onSort={toggleSort}
                    className="justify-end"
                  />
                </TableHead>
                <TableHead className="text-right">
                  <SortButton
                    label="P&L"
                    sortKey="unrealized_pnl_cents"
                    sort={sort}
                    onSort={toggleSort}
                    className="justify-end"
                  />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length ? (
                pageRows.map((position) => (
                  <TableRow key={position.symbol}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {shortSymbol(position.symbol)}
                        </span>
                        <span className="max-w-28 truncate text-xs text-muted-foreground @2xl/main:max-w-44">
                          {position.name ?? position.symbol}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatQuantity(position.quantity)}
                    </TableCell>
                    <TableCell className="hidden text-right font-mono tabular-nums @3xl/main:table-cell">
                      {formatCents(position.avg_cost_cents)}
                    </TableCell>
                    <TableCell className="hidden text-right font-mono tabular-nums @2xl/main:table-cell">
                      {formatCents(position.market_price_cents)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium tabular-nums">
                      {formatCents(position.market_value_cents)}
                    </TableCell>
                    <TableCell className="hidden @2xl/main:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary/80"
                            style={{
                              width: `${Math.min(100, position.weight_bps / 100)}%`,
                            }}
                          />
                        </div>
                        <span className="font-mono text-xs tabular-nums text-muted-foreground">
                          {formatPercent(position.weight_bps / 100)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-right @xl/main:table-cell">
                      {position.day_change_bps === null ||
                      position.day_change_bps === undefined ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <Badge
                          variant="outline"
                          className={cn(
                            "gap-1 font-mono tabular-nums",
                            pnlBadgeTone(position.day_change_bps)
                          )}
                        >
                          {position.day_change_bps >= 0 ? (
                            <TrendingUpIcon />
                          ) : (
                            <TrendingDownIcon />
                          )}
                          {formatBps(position.day_change_bps, { sign: true })}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className={cn(
                          "font-mono font-medium tabular-nums",
                          pnlTone(position.unrealized_pnl_cents)
                        )}
                      >
                        {formatCents(position.unrealized_pnl_cents, {
                          sign: true,
                        })}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground tabular-nums">
                        {formatBps(position.unrealized_pnl_bps, { sign: true })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No positions match this filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 px-4 lg:px-6">
        <div className="text-sm text-muted-foreground">
          Showing {from}–{to} of {sorted.length} holding
          {sorted.length === 1 ? "" : "s"}
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 sm:flex">
            <Label htmlFor="position-rows" className="text-sm font-medium">
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
              <SelectTrigger size="sm" className="w-20" id="position-rows">
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
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
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
  )
}
