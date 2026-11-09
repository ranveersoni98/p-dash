"use client"

import { usePathname } from "next/navigation"

import { AutoRefresh } from "@/components/auto-refresh"
import { CommandPalette } from "@/components/command-palette"
import { MarketStatus } from "@/components/market-status"
import { RefreshButton } from "@/components/refresh-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { pageMeta } from "@/lib/navigation"

function currentPageMeta(pathname: string) {
  if (pageMeta[pathname]) return pageMeta[pathname]

  const match = Object.entries(pageMeta)
    .filter(
      ([url]) => url !== "/dashboard" && pathname.startsWith(`${url}/`)
    )
    .sort(([a], [b]) => b.length - a.length)[0]

  return (
    match?.[1] ?? {
      title: "Dashboard",
      description: "Parabellum paper trading",
    }
  )
}

export function SiteHeader() {
  const pathname = usePathname()
  const meta = currentPageMeta(pathname)

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
          <CommandPalette />
          <MarketStatus />
          <Separator
            orientation="vertical"
            className="mx-1 h-4 data-vertical:self-auto"
          />
          <RefreshButton />
          <AutoRefresh />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
