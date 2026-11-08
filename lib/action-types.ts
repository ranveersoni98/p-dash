import type { BudgetStatus, TradeReceipt } from "@/lib/api"

export type ActionState = {
  status: "idle" | "success" | "error"
  message: string
  trade?: TradeReceipt
  budget?: BudgetStatus
}

export const initialActionState: ActionState = {
  status: "idle",
  message: "",
}
