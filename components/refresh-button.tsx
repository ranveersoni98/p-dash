"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { RefreshCwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "cn"

export function RefreshButton() {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Refresh data"
      title="Refresh data"
      disabled={isPending}
      onClick={() => {
        startTransition(() => router.refresh())
      }}
    >
      <RefreshCwIcon className={cn(isPending && "animate-spin")} />
    </Button>
  )
}
