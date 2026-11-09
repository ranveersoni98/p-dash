"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Dialog } from "@base-ui/react/dialog"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CirclePlusIcon,
  CornerDownLeftIcon,
  Loader2Icon,
  RefreshCwIcon,
  SearchIcon,
  SunMoonIcon,
} from "lucide-react"

import { navigationIcon } from "@/components/nav-icons"
import { Button } from "@/components/ui/button"
import {
  navigationGroups,
  secondaryNavigation,
  type NavigationItem,
} from "@/lib/navigation"
import { shortSymbol } from "@/lib/format"
import { cn } from "cn"

type SymbolResult = {
  symbol: string
  name: string
  source: string
}

type PaletteEntry = {
  id: string
  label: string
  description?: string
  group: "Actions" | "Pages" | "Links" | "Symbols"
  icon: React.ReactNode
  run: () => void
}

const groupOrder: PaletteEntry["group"][] = [
  "Actions",
  "Pages",
  "Links",
  "Symbols",
]

export function CommandPalette() {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [active, setActive] = React.useState(0)
  const [symbols, setSymbols] = React.useState<SymbolResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const listRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) return
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") {
        return
      }
      event.preventDefault()
      setOpen((value) => !value)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  React.useEffect(() => {
    if (open) return
    setQuery("")
    setSymbols([])
    setLoading(false)
    setActive(0)
  }, [open])

  React.useEffect(() => {
    const needle = query.trim()
    if (needle.length < 2) {
      setSymbols([])
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/symbols?q=${encodeURIComponent(needle)}&limit=6`,
          { signal: controller.signal }
        )
        if (!response.ok) throw new Error("Symbol search failed.")
        const payload = (await response.json()) as { symbols?: SymbolResult[] }
        if (!controller.signal.aborted) setSymbols(payload.symbols ?? [])
      } catch (error) {
        if (!controller.signal.aborted) {
          setSymbols([])
          if (error instanceof Error && error.name !== "AbortError") {
            console.error(error)
          }
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 180)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [query])

  const pages = React.useMemo<PaletteEntry[]>(() => {
    const items: NavigationItem[] = [
      ...navigationGroups.flatMap((group) => group.items),
      ...secondaryNavigation,
    ]

    return items.map((item) => {
      const Icon = navigationIcon(item.url)
      return {
        id: `page:${item.url}`,
        label: item.title,
        description: item.description,
        group: item.external ? "Links" : "Pages",
        icon: <Icon />,
        run: () => {
          if (item.external) {
            window.open(item.url, "_blank", "noreferrer")
          } else {
            router.push(item.url)
          }
        },
      }
    })
  }, [router])

  const actions = React.useMemo<PaletteEntry[]>(
    () => [
      {
        id: "action:new-trade",
        label: "New trade",
        description: "Place a paper trade at the latest quote",
        group: "Actions",
        icon: <CirclePlusIcon />,
        run: () => router.push("/dashboard/trades?trade=1"),
      },
      {
        id: "action:refresh",
        label: "Refresh data",
        description: "Re-fetch the current view",
        group: "Actions",
        icon: <RefreshCwIcon />,
        run: () => router.refresh(),
      },
      {
        id: "action:theme",
        label: "Toggle theme",
        description: "Switch between light and dark mode",
        group: "Actions",
        icon: <SunMoonIcon />,
        run: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
      },
    ],
    [resolvedTheme, router, setTheme]
  )

  const normalized = query.trim().toLowerCase()
  const matches = React.useCallback(
    (entry: PaletteEntry) =>
      !normalized ||
      `${entry.label} ${entry.description ?? ""}`
        .toLowerCase()
        .includes(normalized),
    [normalized]
  )

  const symbolEntries = React.useMemo<PaletteEntry[]>(
    () =>
      symbols.map((symbol) => ({
        id: `symbol:${symbol.symbol}`,
        label: shortSymbol(symbol.symbol),
        description: symbol.name || symbol.source,
        group: "Symbols",
        icon: <span className="font-mono text-[10px]">NS</span>,
        run: () =>
          router.push(
            `/dashboard/market?symbol=${encodeURIComponent(symbol.symbol)}`
          ),
      })),
    [router, symbols]
  )

  const items = React.useMemo(
    () => [
      ...actions.filter(matches),
      ...pages.filter(matches),
      ...symbolEntries.filter(matches),
    ],
    [actions, matches, pages, symbolEntries]
  )

  const grouped = React.useMemo(() => {
    const map = new Map<PaletteEntry["group"], PaletteEntry[]>()
    for (const entry of items) {
      const group = map.get(entry.group) ?? []
      group.push(entry)
      map.set(entry.group, group)
    }
    return groupOrder.flatMap((group) =>
      map.has(group) ? [[group, map.get(group)!] as const] : []
    )
  }, [items])

  React.useEffect(() => {
    setActive(0)
  }, [normalized])

  React.useEffect(() => {
    if (!open) return
    const element = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${active}"]`
    )
    element?.scrollIntoView({ block: "nearest" })
  }, [active, open])

  function select(entry: PaletteEntry) {
    setOpen(false)
    entry.run()
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!items.length) return

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActive((value) => (value + 1) % items.length)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActive((value) => (value - 1 + items.length) % items.length)
    } else if (event.key === "Home") {
      event.preventDefault()
      setActive(0)
    } else if (event.key === "End") {
      event.preventDefault()
      setActive(items.length - 1)
    } else if (event.key === "Enter") {
      event.preventDefault()
      const entry = items[active]
      if (entry) select(entry)
    }
  }

  const activeEntry = items[active]

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="hidden h-8 gap-2 text-muted-foreground md:inline-flex"
        onClick={() => setOpen(true)}
        aria-label="Open command palette"
        aria-keyshortcuts="Meta+K Control+K"
      >
        <SearchIcon className="size-3.5" />
        <span className="text-xs font-normal">Search</span>
        <kbd className="pointer-events-none ml-0.5 hidden items-center gap-0.5 rounded border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground lg:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Search"
        title="Search (⌘K)"
      >
        <SearchIcon />
      </Button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/20 backdrop-blur-xs transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <Dialog.Popup className="fixed top-[12vh] left-1/2 z-50 flex max-h-[70vh] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 flex-col overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-2xl outline-none transition duration-150 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
            <Dialog.Title className="sr-only">Command palette</Dialog.Title>
            <Dialog.Description className="sr-only">
              Search pages, actions and symbols, then press Enter to open.
            </Dialog.Description>

            <div className="flex items-center gap-2 border-b px-3">
              <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Search pages, actions, symbols…"
                className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                aria-label="Search pages, actions and symbols"
                role="combobox"
                aria-expanded
                aria-controls="command-palette-list"
                aria-activedescendant={
                  activeEntry ? `command-item-${active}` : undefined
                }
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
              {loading ? (
                <Loader2Icon className="size-4 shrink-0 animate-spin text-muted-foreground" />
              ) : null}
              <kbd className="hidden shrink-0 rounded border bg-muted px-1 font-mono text-[10px] text-muted-foreground sm:inline">
                Esc
              </kbd>
            </div>

            <div
              id="command-palette-list"
              ref={listRef}
              role="listbox"
              className="min-h-0 flex-1 overflow-y-auto p-2"
            >
              {items.length ? (
                grouped.map(([group, entries]) => (
                  <div key={group} role="group" aria-label={group}>
                    <div className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground">
                      {group}
                    </div>
                    {entries.map((entry) => {
                      const index = items.indexOf(entry)
                      const isActive = index === active
                      return (
                        <button
                          key={entry.id}
                          id={`command-item-${index}`}
                          data-index={index}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          onMouseEnter={() => setActive(index)}
                          onClick={() => select(entry)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm outline-none transition-colors",
                            isActive
                              ? "bg-accent text-accent-foreground"
                              : "text-foreground hover:bg-accent/60"
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-7 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground [&_svg:not([class*='size-'])]:size-3.5",
                              isActive && "border-primary/30 bg-primary/10 text-primary"
                            )}
                          >
                            {entry.icon}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">
                              {entry.label}
                            </span>
                            {entry.description ? (
                              <span className="block truncate text-xs text-muted-foreground">
                                {entry.description}
                              </span>
                            ) : null}
                          </span>
                          {isActive ? (
                            <CornerDownLeftIcon className="size-3.5 shrink-0 text-muted-foreground" />
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center gap-1 px-6 py-12 text-center">
                  <SearchIcon className="size-6 text-muted-foreground/40" />
                  <p className="text-sm font-medium">No results</p>
                  <p className="text-xs text-muted-foreground">
                    {loading
                      ? "Searching symbols…"
                      : `Nothing matches “${query.trim()}”.`}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 border-t px-3 py-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <ArrowUpIcon className="size-3" />
                <ArrowDownIcon className="size-3" />
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <CornerDownLeftIcon className="size-3" />
                Open
              </span>
              <span className="ml-auto hidden sm:inline">
                {loading ? "Searching symbols…" : "Type to search symbols"}
              </span>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
