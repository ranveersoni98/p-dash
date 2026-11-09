"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { TimerResetIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "cn"

const STORAGE_KEY = "parabellum:auto-refresh-seconds"

const intervals = [
  { value: 0, label: "Off" },
  { value: 15, label: "Every 15 seconds" },
  { value: 30, label: "Every 30 seconds" },
  { value: 60, label: "Every minute" },
  { value: 300, label: "Every 5 minutes" },
] as const

const validIntervals = new Set(intervals.map((interval) => interval.value))

export function AutoRefresh() {
  const router = useRouter()
  const [seconds, setSeconds] = React.useState(0)
  const [remaining, setRemaining] = React.useState(0)
  const remainingRef = React.useRef(0)

  React.useEffect(() => {
    const stored = Number(window.localStorage.getItem(STORAGE_KEY))
    if (validIntervals.has(stored as (typeof intervals)[number]["value"])) {
      setSeconds(stored)
    }
  }, [])

  React.useEffect(() => {
    remainingRef.current = seconds
    setRemaining(seconds)

    if (!seconds) return

    const timer = window.setInterval(() => {
      remainingRef.current -= 1

      if (remainingRef.current <= 0) {
        if (document.visibilityState === "visible") {
          React.startTransition(() => router.refresh())
        }
        remainingRef.current = seconds
      }

      setRemaining(remainingRef.current)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [router, seconds])

  function update(value: number) {
    setSeconds(value)
    window.localStorage.setItem(STORAGE_KEY, String(value))
  }

  const label =
    intervals.find((interval) => interval.value === seconds)?.label ?? "Off"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant={seconds ? "secondary" : "ghost"}
            size="icon-sm"
            aria-label={
              seconds
                ? `Auto refresh on, ${label.toLowerCase()}. Next refresh in ${remaining} seconds.`
                : "Set up auto refresh"
            }
            title={
              seconds
                ? `Auto refresh ${label.toLowerCase()} · next in ${remaining}s`
                : "Auto refresh"
            }
          />
        }
      >
        <TimerResetIcon className={cn(seconds && "text-primary")} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Auto refresh</DropdownMenuLabel>
        {intervals.map((interval) => (
          <DropdownMenuCheckboxItem
            key={interval.value}
            checked={seconds === interval.value}
            onCheckedChange={() => update(interval.value)}
          >
            {interval.label}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <p className="px-2 py-1.5 text-[11px] leading-relaxed text-muted-foreground">
          {seconds
            ? `Refreshes in ${remaining}s. Pauses while this tab is hidden.`
            : "Re-fetches the current view on a timer."}
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
