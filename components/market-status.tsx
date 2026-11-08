"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "cn"
import { ActivityIcon } from "lucide-react"

type StatusPayload = {
  ok: boolean
  data?: {
    engine_enabled: boolean
    market_open: boolean
    market_session: string
    circuit_blocked: boolean
    server_time: string
  }
}

export function MarketStatus() {
  const [status, setStatus] = React.useState<StatusPayload | null>(null)

  React.useEffect(() => {
    let active = true

    async function load() {
      try {
        const response = await fetch("/api/status", { cache: "no-store" })
        const payload = (await response.json()) as StatusPayload
        if (active) setStatus(payload)
      } catch {
        if (active) setStatus({ ok: false })
      }
    }

    void load()
    const interval = window.setInterval(load, 60_000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [])

  const data = status?.data
  const isBlocked = data?.circuit_blocked
  const isOpen = data?.market_open

  if (!status) {
    return (
      <Badge variant="outline" className="gap-1.5 text-muted-foreground">
        <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground" />
        <span className="hidden sm:inline">Checking market</span>
        <span className="sm:hidden">Market</span>
      </Badge>
    )
  }

  if (!status.ok || !data) {
    return (
      <Badge variant="outline" className="gap-1.5 text-muted-foreground">
        <span className="size-1.5 rounded-full bg-muted-foreground" />
        <span className="hidden sm:inline">API offline</span>
        <span className="sm:hidden">Offline</span>
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      title={data.market_session}
      className={cn(
        "gap-1.5 font-medium",
        isBlocked
          ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400"
          : isOpen
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "border-border text-muted-foreground"
      )}
    >
      {isBlocked ? (
        <ActivityIcon className="size-3" />
      ) : (
        <span
          className={cn(
            "relative flex size-1.5 rounded-full",
            isOpen ? "bg-emerald-500" : "bg-muted-foreground"
          )}
        >
          {isOpen ? (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
          ) : null}
        </span>
      )}
      <span className="hidden sm:inline">
        {isBlocked ? "Circuit blocked" : isOpen ? "Market open" : "Market closed"}
      </span>
      <span className="sm:hidden">
        {isBlocked ? "Blocked" : isOpen ? "Open" : "Closed"}
      </span>
    </Badge>
  )
}
