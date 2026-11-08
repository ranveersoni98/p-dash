"use client"

import * as React from "react"
import { Loader2Icon, PlayIcon } from "lucide-react"
import { toast } from "sonner"

import { runTickAction } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { initialActionState } from "@/lib/action-types"

export function TickButton() {
  const [state, formAction, pending] = React.useActionState(
    runTickAction,
    initialActionState
  )
  const lastMessage = React.useRef("")

  React.useEffect(() => {
    if (!state.message || state.message === lastMessage.current) return
    lastMessage.current = state.message
    if (state.status === "success") toast.success(state.message)
    if (state.status === "error") toast.error(state.message)
  }, [state])

  return (
    <form action={formAction}>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? (
          <Loader2Icon className="animate-spin" data-icon="inline-start" />
        ) : (
          <PlayIcon data-icon="inline-start" />
        )}
        {pending ? "Running…" : "Run tick"}
      </Button>
    </form>
  )
}
