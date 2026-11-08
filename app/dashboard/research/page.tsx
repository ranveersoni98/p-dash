import Link from "next/link"
import {
  ArrowUpRightIcon,
  BrainCircuitIcon,
  GaugeIcon,
  Globe2Icon,
  LayersIcon,
  MicroscopeIcon,
  SparklesIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WavesIcon,
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
  getConfig,
  getHealth,
  getMacro,
  getRankings,
  getResearchStatus,
  type EconomicsRank,
} from "@/lib/api"
import {
  formatBps,
  formatDateTime,
  formatDuration,
  formatNumber,
  formatQualityNote,
  humanizeEnum,
  pnlTone,
  shortSymbol,
} from "@/lib/format"
import { cn } from "cn"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Research",
}

function ScoreBar({
  label,
  value,
  tone,
  max,
}: {
  label: string
  value: number
  tone: string
  max: number
}) {
  const width = Math.min(100, Math.max(2, (Math.abs(value) / Math.max(1, max)) * 100))
  return (
    <div className="min-w-0 space-y-1">
      <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
        <span>{label}</span>
        <span className="font-mono tabular-nums">{formatBps(value)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", tone)}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

function RankingRow({
  rank,
  index,
  max,
}: {
  rank: EconomicsRank
  index: number
  max: number
}) {
  return (
    <TableRow>
      <TableCell className="w-10 text-center font-mono text-xs text-muted-foreground tabular-nums">
        {index + 1}
      </TableCell>
      <TableCell>
        <Link
          href={`/dashboard/market?symbol=${encodeURIComponent(rank.symbol)}`}
          className="flex flex-col"
        >
          <span className="font-medium">{shortSymbol(rank.symbol)}</span>
          <span className="hidden max-w-64 truncate text-xs text-muted-foreground @xl/main:block">
            {formatQualityNote(rank.quality_note)}
          </span>
          <span className="mt-0.5 font-mono text-[10px] text-muted-foreground tabular-nums @xl/main:hidden">
            Q {formatBps(rank.quality_bps)} · G {formatBps(rank.growth_bps)} ·
            V {formatBps(rank.value_bps)}
          </span>
        </Link>
      </TableCell>
      <TableCell className="hidden @2xl/main:table-cell">
        <div className="flex min-w-44 flex-col gap-1.5">
          <ScoreBar
            label="Quality"
            value={rank.quality_bps}
            tone="bg-primary/80"
            max={max}
          />
          <ScoreBar
            label="Growth"
            value={rank.growth_bps}
            tone="bg-emerald-500/80"
            max={max}
          />
          <ScoreBar
            label="Value"
            value={rank.value_bps}
            tone="bg-amber-500/80"
            max={max}
          />
        </div>
      </TableCell>
      <TableCell className="hidden text-right font-mono text-xs tabular-nums @xl/main:table-cell">
        {formatBps(rank.quality_bps)}
      </TableCell>
      <TableCell className="hidden text-right font-mono text-xs tabular-nums @xl/main:table-cell">
        {formatBps(rank.growth_bps)}
      </TableCell>
      <TableCell className="hidden text-right font-mono text-xs tabular-nums @xl/main:table-cell">
        {formatBps(rank.value_bps)}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Open ${rank.symbol}`}
          nativeButton={false}
          render={
            <Link
              href={`/dashboard/market?symbol=${encodeURIComponent(rank.symbol)}`}
            />
          }
        >
          <ArrowUpRightIcon />
        </Button>
      </TableCell>
    </TableRow>
  )
}

export default async function ResearchPage() {
  const [macro, research, rankings, config, health] = await Promise.all([
    getMacro().catch(() => null),
    getResearchStatus(),
    getRankings(),
    getConfig(),
    getHealth(),
  ])

  const regime = macro?.regime ?? "neutral"
  const macroTone =
    regime === "risk_off" || regime === "high_volatility"
      ? "warning"
      : regime === "risk_on"
        ? "positive"
        : "neutral"
  const sorted = [...rankings].sort(
    (a, b) =>
      b.quality_bps + b.growth_bps + b.value_bps -
      (a.quality_bps + a.growth_bps + a.value_bps)
  )
  const macroAgeSecs = macro
    ? Math.max(
        0,
        (new Date(health.server_time).getTime() -
          new Date(macro.fetched_at).getTime()) /
          1000
      )
    : 0
  const scoreMax = Math.max(
    2_000,
    ...sorted.flatMap((rank) => [
      rank.quality_bps,
      rank.growth_bps,
      rank.value_bps,
    ])
  )

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
          <StatCard
            label="Macro regime"
            value={humanizeEnum(regime)}
            change={
              macro?.vix_cents === null || macro?.vix_cents === undefined
                ? "India-only"
                : `VIX ${formatNumber(macro.vix_cents / 100, 2)}`
            }
            changeIcon={<GaugeIcon />}
            tone={macroTone}
            footer={
              macro?.risk_off_penalty_bps
                ? `${formatBps(macro.risk_off_penalty_bps)} risk-off penalty`
                : "No risk-off penalty applied"
            }
            subfooter={
              macro
                ? `Snapshot ${formatDuration(macroAgeSecs)} old`
                : "Macro snapshot unavailable"
            }
          />
          <StatCard
            label="Ranked symbols"
            value={rankings.length}
            change={research.running ? "Research running" : "Research paused"}
            changeIcon={<MicroscopeIcon />}
            tone={research.running ? "positive" : "neutral"}
            footer={`${research.symbols_prefetched} symbols prefetched`}
            subfooter={`Top ${Math.min(10, rankings.length)} shown below`}
          />
          <StatCard
            label="Macro cache"
            value={research.macro_cached ? "Warm" : "Cold"}
            change={`${formatDuration(config.economics_research_interval_seconds)} cycle`}
            changeIcon={<WavesIcon />}
            tone={research.macro_cached ? "positive" : "warning"}
            footer={`Batch size ${config.economics_prefetch_batch_size}`}
            subfooter={`Last cycle ${formatDateTime(research.last_cycle_at)}`}
          />
          <StatCard
            label="Research engine"
            value={config.economics_research_enabled ? "Enabled" : "Disabled"}
            change={`${formatBps(config.tech_score_bias_bps, { sign: true })} tech bias`}
            changeIcon={<SparklesIcon />}
            tone={config.economics_research_enabled ? "primary" : "neutral"}
            footer={`${formatBps(config.indian_bias_bps, { sign: true })} Indian bias`}
            subfooter={`${formatBps(config.high_roi_override_bps, { sign: true })} high-ROI override`}
          />
        </div>

        <div className="grid grid-cols-1 items-start gap-4 px-4 lg:px-6 @4xl/main:grid-cols-3">
          <Card className="@4xl/main:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuitIcon className="size-4 text-muted-foreground" />
                Research rankings
              </CardTitle>
              <CardDescription>
                Quality, growth and value scores the engine folds into every
                signal.
              </CardDescription>
              <CardAction>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {rankings.length} ranked
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              {sorted.length ? (
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader className="bg-muted">
                      <TableRow>
                        <TableHead className="w-10 text-center">#</TableHead>
                        <TableHead>Symbol</TableHead>
                        <TableHead className="hidden @2xl/main:table-cell">
                          Factor breakdown
                        </TableHead>
                        <TableHead className="hidden text-right @xl/main:table-cell">
                          Q
                        </TableHead>
                        <TableHead className="hidden text-right @xl/main:table-cell">
                          G
                        </TableHead>
                        <TableHead className="hidden text-right @xl/main:table-cell">
                          V
                        </TableHead>
                        <TableHead className="w-8" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sorted.slice(0, 20).map((rank, index) => (
                        <RankingRow
                          key={rank.symbol}
                          rank={rank}
                          index={index}
                          max={scoreMax}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-14 text-center text-sm text-muted-foreground">
                  <MicroscopeIcon className="size-8 text-muted-foreground/40" />
                  <span className="font-medium text-foreground">
                    No rankings cached yet
                  </span>
                  <span>
                    The research loop has prefetched{" "}
                    {research.symbols_prefetched} symbols. Rankings populate
                    after the next successful cycle.
                  </span>
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-between gap-2 text-xs text-muted-foreground">
              <span>Sorted by combined quality, growth and value.</span>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 px-0"
                nativeButton={false}
                render={<Link href="/dashboard/market" />}
              >
                Open market
                <ArrowUpRightIcon data-icon="inline-end" />
              </Button>
            </CardFooter>
          </Card>

          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe2Icon className="size-4 text-muted-foreground" />
                  Macro snapshot
                </CardTitle>
                <CardDescription>
                  Regime context applied to exposure sizing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Regime</span>
                  <Badge variant="outline" className="capitalize">
                    {humanizeEnum(regime)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">India VIX</span>
                  <span className="font-mono text-xs tabular-nums">
                    {macro && macro.vix_cents !== null && macro.vix_cents !== undefined
                      ? formatNumber(macro.vix_cents / 100, 2)
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">VIX penalty</span>
                  <span className="font-mono text-xs tabular-nums">
                    {macro ? formatBps(macro.vix_penalty_bps) : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Risk-off penalty</span>
                  <span className="font-mono text-xs tabular-nums">
                    {macro ? formatBps(macro.risk_off_penalty_bps) : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Benchmark move</span>
                  <span
                    className={cn(
                      "font-mono text-xs tabular-nums",
                      pnlTone(macro?.spy_change_bps)
                    )}
                  >
                    {macro
                      ? formatBps(macro.spy_change_bps, { sign: true })
                      : "—"}
                  </span>
                </div>
                <div className="space-y-2 border-t pt-3 text-xs leading-relaxed text-muted-foreground">
                  <p>{macro?.vix_note || "No VIX note recorded."}</p>
                  <p>{macro?.risk_off_note || "No risk-off note recorded."}</p>
                </div>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                Fetched {macro ? formatDateTime(macro.fetched_at) : "—"}
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LayersIcon className="size-4 text-muted-foreground" />
                  Research telemetry
                </CardTitle>
                <CardDescription>
                  Background prefetch and cache state.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Loop</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1",
                      research.running
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-400"
                        : "text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        research.running ? "bg-emerald-500" : "bg-muted-foreground"
                      )}
                    />
                    {research.running ? "Running" : "Paused"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Interval</span>
                  <span className="font-mono text-xs tabular-nums">
                    {formatDuration(config.economics_research_interval_seconds)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Batch size</span>
                  <span className="font-mono text-xs tabular-nums">
                    {config.economics_prefetch_batch_size}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Prefetched</span>
                  <span className="font-mono text-xs tabular-nums">
                    {research.symbols_prefetched} symbols
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Macro cache</span>
                  <span className="font-mono text-xs">
                    {research.macro_cached ? "Warm" : "Empty"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Last cycle</span>
                  <span className="text-right font-mono text-[11px]">
                    {formatDateTime(research.last_cycle_at)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 px-4 pb-2 lg:px-6 @4xl/main:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>How research feeds the engine</CardTitle>
              <CardDescription>
                The scoring layers behind every automated entry.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                {
                  title: "Macro regime",
                  value: humanizeEnum(regime),
                  note: "Sets gross exposure: 95% risk-on, 80% neutral, 70% risk-off, 20% high volatility.",
                  icon:
                    regime === "risk_off" || regime === "high_volatility" ? (
                      <TrendingDownIcon />
                    ) : (
                      <TrendingUpIcon />
                    ),
                },
                {
                  title: "Fundamentals",
                  value: `${rankings.length} ranked`,
                  note: "Quality, growth and value scores are blended into the candidate ranking.",
                  icon: <MicroscopeIcon />,
                },
                {
                  title: "Signal bias",
                  value: `${formatBps(config.tech_score_bias_bps, { sign: true })} tech`,
                  note: "Technical and Indian-market biases nudge scores before position sizing.",
                  icon: <SparklesIcon />,
                },
                {
                  title: "Risk sizing",
                  value: `${formatBps(config.risk_per_trade_bps)} / trade`,
                  note: `Position caps: ${formatBps(config.max_position_bps)} per name, ${formatBps(config.max_sector_bps)} per sector, ${formatBps(config.min_cash_bps)} cash floor.`,
                  icon: <GaugeIcon />,
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3"
                >
                  <div className="mt-0.5 text-muted-foreground">{item.icon}</div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{item.title}</span>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {item.value}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {item.note}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Run a deep dive</CardTitle>
              <CardDescription>
                Open a symbol to inspect its chart, signal and company profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {sorted.slice(0, 8).map((rank) => (
                <Link
                  key={rank.symbol}
                  href={`/dashboard/market?symbol=${encodeURIComponent(rank.symbol)}`}
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
                  <span className="flex shrink-0 items-center gap-2 font-mono text-[11px] tabular-nums">
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
              {!sorted.length ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Rankings will appear here once the research loop completes a
                  cycle.
                </div>
              ) : null}
            </CardContent>
            <CardFooter>
              <Button
                variant="ghost"
                size="sm"
                className="px-0 text-muted-foreground"
                nativeButton={false}
                render={<Link href="/dashboard/engine" />}
              >
                Inspect the engine
                <ArrowUpRightIcon data-icon="inline-end" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
