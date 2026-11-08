"use client"

import * as React from "react"
import { Loader2Icon, ReceiptIndianRupeeIcon } from "lucide-react"
import { toast } from "sonner"

import { placeTradeAction } from "@/app/dashboard/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { initialActionState } from "@/lib/action-types"
import { formatCents, formatQuantity } from "@/lib/format"
import { cn } from "cn"

export function NewTradeButton({
  defaultOpen = false,
  defaultSymbol,
  variant = "default",
  size = "sm",
  label = "New trade",
  className,
}: {
  defaultOpen?: boolean
  defaultSymbol?: string
  variant?: React.ComponentProps<typeof Button>["variant"]
  size?: React.ComponentProps<typeof Button>["size"]
  label?: string
  className?: string
}) {
  const [state, formAction, pending] = React.useActionState(
    placeTradeAction,
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
    <Sheet defaultOpen={defaultOpen}>
      <SheetTrigger render={<Button variant={variant} size={size} className={className} />}>
        {label}
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Place paper trade</SheetTitle>
          <SheetDescription>
            Buys and sells execute against the latest quote with the engine&apos;s
            configured slippage and fees.
          </SheetDescription>
        </SheetHeader>

        <form
          action={formAction}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
        >
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="trade-symbol">Symbol</Label>
              <Input
                id="trade-symbol"
                name="symbol"
                defaultValue={defaultSymbol}
                placeholder="RELIANCE.NS"
                autoComplete="off"
                spellCheck={false}
                className="font-mono uppercase"
                required
              />
              <p className="text-xs text-muted-foreground">
                NSE ticker with the <code>.NS</code> suffix.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="trade-side">Side</Label>
                <select
                  id="trade-side"
                  name="side"
                  defaultValue="buy"
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="trade-quantity">Quantity</Label>
                <Input
                  id="trade-quantity"
                  name="quantity"
                  type="number"
                  inputMode="decimal"
                  step="0.001"
                  min="0.001"
                  placeholder="1.000"
                  className="font-mono"
                  required
                />
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
              This is a paper-trading account. Orders are simulated, but they do
              update the portfolio and trade history.
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
              </div>
            ) : null}

            {state.trade ? (
              <div className="space-y-2 rounded-lg border p-3 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <ReceiptIndianRupeeIcon className="size-4 text-primary" />
                  Fill receipt
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="text-right font-mono tabular-nums">
                    {formatQuantity(state.trade.quantity)}
                  </span>
                  <span className="text-muted-foreground">Fill price</span>
                  <span className="text-right font-mono tabular-nums">
                    {formatCents(state.trade.price_cents)}
                  </span>
                  <span className="text-muted-foreground">Notional</span>
                  <span className="text-right font-mono tabular-nums">
                    {formatCents(state.trade.notional_cents)}
                  </span>
                  <span className="text-muted-foreground">Fee</span>
                  <span className="text-right font-mono tabular-nums">
                    {formatCents(state.trade.fee_cents)}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="outline" className="uppercase">
                    {state.trade.side}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    {state.trade.symbol}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-auto flex flex-col gap-2 pt-2 pb-4">
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2Icon className="animate-spin" data-icon="inline-start" />
                  Placing trade…
                </>
              ) : (
                "Place trade"
              )}
            </Button>
            <SheetClose render={<Button type="button" variant="outline" />}>
              Cancel
            </SheetClose>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
