import Link from "next/link"
import {
  ArrowUpRightIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  DatabaseIcon,
  ExternalLinkIcon,
  FingerprintIcon,
  GaugeIcon,
  KeyRoundIcon,
  MonitorCogIcon,
  PaletteIcon,
  PlugZapIcon,
  ServerCogIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
  WalletIcon,
} from "lucide-react"

import { StatCard } from "@/components/stat-card"
import { ThemePreference } from "@/components/theme-preference"
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
import { Separator } from "@/components/ui/separator"
import {
  apiBaseUrl,
  getConfig,
  getEngineStatus,
  getHealth,
  getPortfolio,
  getStats,
} from "@/lib/api"
import {
  formatCents,
  formatDateTime,
  formatDuration,
  formatPercent,
} from "@/lib/format"
import { cn } from "cn"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Settings",
}

function SettingRow({
  label,
  value,
  hint,
}: {
  label: string
  value: React.ReactNode
  hint?: string
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <div className="min-w-0">
        <div className="text-muted-foreground">{label}</div>
        {hint ? (
          <div className="text-[11px] text-muted-foreground/80">{hint}</div>
        ) : null}
      </div>
      <div className="shrink-0 text-right font-mono text-xs font-medium tabular-nums">
        {value}
      </div>
    </div>
  )
}

function ExternalLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center justify-between gap-3 rounded-lg border p-2.5 text-sm transition-colors hover:bg-muted/50"
    >
      <span className="min-w-0 truncate">{children}</span>
      <ExternalLinkIcon className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
    </a>
  )
}

export default async function SettingsPage() {
  const [health, config, engine, portfolio, stats] = await Promise.all([
    getHealth(),
    getConfig(),
    getEngineStatus(),
    getPortfolio(),
    getStats(),
  ])

  const budget = portfolio.active_budget ?? engine.budget ?? null
  const baseUrl = apiBaseUrl()
  const online = health.status === "ok"

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
          <StatCard
            label="API connection"
            value={online ? "Online" : "Degraded"}
            change={`v${health.version}`}
            changeIcon={<PlugZapIcon />}
            tone={online ? "positive" : "warning"}
            footer={baseUrl}
            subfooter={`Health check at ${formatDateTime(health.server_time)}`}
          />
          <StatCard
            label="Admin auth"
            value={config.admin_auth_enabled ? "Required" : "Open"}
            change={config.admin_auth_enabled ? "Token set" : "No token"}
            changeIcon={<KeyRoundIcon />}
            tone={config.admin_auth_enabled ? "positive" : "warning"}
            footer={
              config.admin_auth_enabled
                ? "x-admin-token required"
                : "No token required"
            }
            subfooter={
              config.admin_auth_enabled
                ? "Server actions attach the token"
                : "Mutations are open on the API"
            }
          />
          <StatCard
            label="Redis cache"
            value={health.redis_cache === "enabled" ? "Enabled" : "Disabled"}
            change={config.redis_cache_enabled ? "Warm" : "Bypassed"}
            changeIcon={<DatabaseIcon />}
            tone={health.redis_cache === "enabled" ? "positive" : "neutral"}
            footer={`Engine v${health.version}`}
            subfooter={`Up ${formatDuration(health.uptime_secs)}`}
          />
          <StatCard
            label="Engine state"
            value={engine.engine_enabled ? "Running" : "Paused"}
            change={`${engine.tick_interval_seconds}s tick`}
            changeIcon={<GaugeIcon />}
            tone={engine.engine_enabled ? "positive" : "neutral"}
            footer={`${engine.tick_count} ticks · ${engine.market_open ? "market open" : "market closed"}`}
            subfooter={`${engine.positions_open} / ${engine.max_positions_bull} position slots used`}
          />
        </div>

        <div className="grid grid-cols-1 items-start gap-4 px-4 lg:px-6 @4xl/main:grid-cols-3">
          <Card className="@4xl/main:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ServerCogIcon className="size-4 text-muted-foreground" />
                Connection
              </CardTitle>
              <CardDescription>
                The dashboard talks to the Parabellum API server-side.
              </CardDescription>
              <CardAction>
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1",
                    online
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-400"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:text-amber-400"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      online ? "bg-emerald-500" : "bg-amber-500"
                    )}
                  />
                  {online ? "Connected" : "Degraded"}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="text-[11px] tracking-wide text-muted-foreground uppercase">
                  API base URL
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <code className="font-mono text-sm break-all">{baseUrl}</code>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-mono text-[10px]",
                      online
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-400"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:text-amber-400"
                    )}
                  >
                    {online ? "Health check ok" : "Health check failed"}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-3 @xl/main:grid-cols-2">
                <div className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    {online ? (
                      <CheckCircle2Icon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <TriangleAlertIcon className="size-3.5 text-amber-600 dark:text-amber-400" />
                    )}
                    {online ? health.message : "API health check failed"}
                  </div>
                  <SettingRow label="Status" value={health.status} />
                  <SettingRow label="Version" value={`v${health.version}`} />
                  <SettingRow label="Redis" value={health.redis_cache} />
                  <SettingRow
                    label="Started"
                    value={formatDateTime(health.started_at)}
                  />
                  <SettingRow
                    label="Server time"
                    value={formatDateTime(health.server_time)}
                  />
                  <SettingRow
                    label="Uptime"
                    value={formatDuration(health.uptime_secs)}
                  />
                </div>

                <div className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <MonitorCogIcon className="size-3.5 text-muted-foreground" />
                    Runtime
                  </div>
                  <SettingRow label="Market" value={config.market} />
                  <SettingRow label="Currency" value={config.currency} />
                  <SettingRow label="Universe" value={config.market_universe} />
                  <SettingRow
                    label="Market hours only"
                    value={config.market_hours_only ? "Yes" : "No"}
                  />
                  <SettingRow
                    label="Tick interval"
                    value={`${config.engine_tick_interval_seconds}s`}
                  />
                  <SettingRow
                    label="Candidates / tick"
                    value={config.engine_candidates_per_tick}
                  />
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                Override the API host with{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                  PARABELLUM_API_URL
                </code>
                . Set{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                  PARABELLUM_ADMIN_TOKEN
                </code>{" "}
                when the API has admin authentication enabled. Both are read
                only on the server.
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PaletteIcon className="size-4 text-muted-foreground" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Choose how the terminal renders on this device.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ThemePreference />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  The theme toggle in the header switches between light and dark
                  at any time. System follows your OS preference.
                </p>
                <Separator />
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Density</span>
                    <span className="font-mono">Comfortable</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Accent</span>
                    <span className="flex items-center gap-1.5 font-mono">
                      <span className="size-2.5 rounded-full bg-primary" />
                      Emerald
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Numerals</span>
                    <span className="font-mono">Tabular</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <WalletIcon className="size-4 text-muted-foreground" />
                  Account
                </CardTitle>
                <CardDescription>
                  The paper account connected to this workspace.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <SettingRow label="Account" value={portfolio.account_id} />
                <SettingRow
                  label="Total value"
                  value={formatCents(portfolio.total_value_cents)}
                />
                <SettingRow
                  label="Cash"
                  value={formatCents(portfolio.cash_cents)}
                />
                <SettingRow
                  label="Equity"
                  value={formatCents(portfolio.equity_cents)}
                />
                <SettingRow
                  label="Valuation"
                  value={portfolio.valuation_complete ? "Complete" : "Partial"}
                  hint={
                    portfolio.valuation_complete
                      ? undefined
                      : "Some quotes are stale or missing"
                  }
                />
                <SettingRow
                  label="Realized + open P&L"
                  value={
                    stats.money.profit_cents === null
                      ? "—"
                      : formatCents(stats.money.profit_cents, { sign: true })
                  }
                />
                <SettingRow
                  label="Positions"
                  value={portfolio.positions.length}
                />
                <SettingRow label="Trades" value={stats.trades.total} />
                <SettingRow
                  label="Budget"
                  value={budget?.name ?? "None"}
                  hint={
                    budget
                      ? `${formatPercent(budget.progress_to_target_bps / 100)} to target`
                      : undefined
                  }
                />
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
        </div>

        <div className="grid grid-cols-1 items-start gap-4 px-4 pb-2 lg:px-6 @4xl/main:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheckIcon className="size-4 text-muted-foreground" />
                Security & mutations
              </CardTitle>
              <CardDescription>
                How the dashboard authenticates write operations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 text-sm",
                  config.admin_auth_enabled
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-amber-500/30 bg-amber-500/10"
                )}
              >
                {config.admin_auth_enabled ? (
                  <FingerprintIcon className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
                ) : (
                  <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400" />
                )}
                <div>
                  <div className="font-medium">
                    {config.admin_auth_enabled
                      ? "Admin authentication is enabled"
                      : "Admin authentication is disabled"}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {config.admin_auth_enabled
                      ? "Every mutation sends x-admin-token from PARABELLUM_ADMIN_TOKEN."
                      : "The API accepts trades, budgets and engine ticks without a token. Do not expose it publicly."}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <SettingRow
                  label="Trade placement"
                  value="Server action"
                  hint="API token stays on the server"
                />
                <SettingRow label="Budget creation" value="Server action" />
                <SettingRow label="Engine ticks" value="Server action" />
                <SettingRow
                  label="Admin auth"
                  value={config.admin_auth_enabled ? "Enabled" : "Disabled"}
                />
                <SettingRow
                  label="Research"
                  value={
                    config.economics_research_enabled ? "Enabled" : "Disabled"
                  }
                />
                <SettingRow
                  label="Target multiple"
                  value={`${(config.target_multiplier_bps / 10_000).toFixed(1)}×`}
                />
                <SettingRow
                  label="Starting capital"
                  value={formatCents(config.starting_cash_cents)}
                />
              </div>

              <div className="rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                The dashboard never sends the admin token to the browser. All
                write calls run inside server actions, and reads use{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                  cache: no-store
                </code>{" "}
                for live values.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpenIcon className="size-4 text-muted-foreground" />
                API reference
              </CardTitle>
              <CardDescription>
                Explore the endpoints behind every screen.
              </CardDescription>
              <CardAction>
                <Badge variant="outline" className="font-mono text-[10px]">
                  v{config.version}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex-1 space-y-2">
              <ExternalLink href={`${baseUrl}/docs`}>
                Interactive API docs
              </ExternalLink>
              <ExternalLink href={`${baseUrl}/openapi.json`}>
                OpenAPI specification
              </ExternalLink>
              <ExternalLink href={`${baseUrl}/health`}>
                Health check
              </ExternalLink>
              <ExternalLink href={`${baseUrl}/config`}>
                Runtime configuration
              </ExternalLink>
              <ExternalLink href={`${baseUrl}/engine/status`}>
                Engine status
              </ExternalLink>
            </CardContent>
            <CardFooter className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <BookOpenIcon className="size-3.5" />
                NSE paper trading · INR
              </span>
              <span className="font-mono">v{health.version}</span>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
