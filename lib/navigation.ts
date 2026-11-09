export type NavigationItem = {
  title: string
  url: string
  description: string
  external?: boolean
}

export const navigationGroups: { label: string; items: NavigationItem[] }[] = [
  {
    label: "Trading",
    items: [
      {
        title: "Overview",
        url: "/dashboard",
        description: "Portfolio, P&L and recent fills",
      },
      {
        title: "Portfolio",
        url: "/dashboard/portfolio",
        description: "Live positions and allocation",
      },
      {
        title: "Trades",
        url: "/dashboard/trades",
        description: "Fills, fees and execution history",
      },
      {
        title: "Ledger",
        url: "/dashboard/ledger",
        description: "Cash movements, trades and fees",
      },
      {
        title: "Budget",
        url: "/dashboard/budget",
        description: "Capital target and trading window",
      },
    ],
  },
  {
    label: "Markets",
    items: [
      {
        title: "Market",
        url: "/dashboard/market",
        description: "Quotes, signals and research",
      },
      {
        title: "Research",
        url: "/dashboard/research",
        description: "Macro regime, rankings and fundamentals",
      },
      {
        title: "Engine",
        url: "/dashboard/engine",
        description: "Automation, risk guards and config",
      },
    ],
  },
]

export const secondaryNavigation: NavigationItem[] = [
  {
    title: "Settings",
    url: "/dashboard/settings",
    description: "Connection and workspace preferences",
  },
  {
    title: "API reference",
    url: "http://localhost:3001/docs",
    description: "Interactive OpenAPI documentation",
    external: true,
  },
]

export const pageMeta: Record<string, { title: string; description: string }> =
  Object.fromEntries(
    [...navigationGroups.flatMap((group) => group.items), ...secondaryNavigation].map(
      (item) => [item.url, { title: item.title, description: item.description }]
    )
  )
