"use client"

import * as React from "react"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { createBudgetAction } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { initialActionState } from "@/lib/action-types"
import { formatCents } from "@/lib/format"
import { cn } from "cn"

export function NewBudgetForm() {
  const [state, formAction, pending] = React.useActionState(
    createBudgetAction,
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
    <Card>
      <CardHeader>
        <CardTitle>Start a new budget</CardTitle>
        <CardDescription>
          Set the paper account&apos;s trading window, starting capital and
          target multiple.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="budget-name">Name (optional)</Label>
            <Input
              id="budget-name"
              name="name"
              placeholder="Weekly momentum run"
              autoComplete="off"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="budget-period">Period</Label>
              <select
                id="budget-period"
                name="period"
                defaultValue="week"
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="budget-cash">Starting capital (₹)</Label>
              <Input
                id="budget-cash"
                name="initialCash"
                type="number"
                inputMode="decimal"
                min="1"
                step="1000"
                defaultValue="50000"
                className="font-mono"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="budget-target">Target</Label>
              <select
                id="budget-target"
                name="targetMultiplier"
                defaultValue="40000"
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="20000">2× capital</option>
                <option value="30000">3× capital</option>
                <option value="40000">4× capital</option>
              </select>
            </div>
          </div>

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
            Starting a new budget replaces the active budget and resets the
            paper account&apos;s performance window.
          </div>

          {state.status !== "idle" ? (
            <div
              className={cn(
                "rounded-lg border p-3 text-sm",
                state.status === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400"
              )}
              role="status"
            >
              {state.message}
              {state.budget ? (
                <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                  <span className="opacity-70">Initial</span>
                  <span className="text-right font-mono">
                    {formatCents(state.budget.initial_cash_cents)}
                  </span>
                  <span className="opacity-70">Target</span>
                  <span className="text-right font-mono">
                    {formatCents(state.budget.target_cash_cents)}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? (
              <>
                <Loader2Icon className="animate-spin" data-icon="inline-start" />
                Starting…
              </>
            ) : (
              "Start budget"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
