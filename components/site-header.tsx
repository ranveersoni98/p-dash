"use client"

import { usePathname } from "next/navigation"

import { MarketStatus } from "@/components/market-status"
import { RefreshButton } from "@/components/refresh-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

const pageMeta: Record<string, { title: string; description: string }> = {
  "/dashboard": {
    title: "Overview",
    description: "Portfolio, P&L and recent fills",
  },
  "/dashboard/portfolio": {
    title: "Portfolio",
    description: "Live positions and allocation",
  },
  "/dashboard/trades": {
    title: "Trades",
    description: "Fills, fees and execution history",
  },
  "/dashboard/ledger": {
    title: "Ledger",
    description: "Cash movements, trades and fees",
  },
  "/dashboard/budget": {
    title: "Budget",
    description: "Capital target and trading window",
  },
  "/dashboard/market": {
    title: "Market",
    description: "Quotes, signals and research",
  },
  "/dashboard/research": {
    title: "Research",
    description: "Macro regime, rankings and fundamentals",
  },
  "/dashboard/engine": {
    title: "Engine",
    description: "Automation, risk guards and config",
  },
  "/dashboard/settings": {
    title: "Settings",
    description: "Connection and workspace preferences",
  },
}

export function SiteHeader() {
  const pathname = usePathname()
  const meta = pageMeta[pathname] ?? {
    title: "Dashboard",
    description: "Parabellum paper trading",
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full min-w-0 items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4 data-vertical:self-auto"
        />
        <div className="flex min-w-0 items-baseline gap-2">
          <h1 className="truncate text-base font-medium">{meta.title}</h1>
          <p className="hidden truncate text-xs text-muted-foreground md:block">
            {meta.description}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <MarketStatus />
          <Separator
            orientation="vertical"
            className="mx-1 h-4 data-vertical:self-auto"
          />
          <RefreshButton />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
