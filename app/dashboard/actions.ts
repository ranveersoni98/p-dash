"use server"

import { revalidatePath } from "next/cache"

import {
  createBudget,
  placeTrade,
  runEngineTick,
  type BudgetPeriod,
  type TradeSide,
} from "@/lib/api"
import type { ActionState } from "@/lib/action-types"

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong."
}

export async function placeTradeAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const symbol = String(formData.get("symbol") ?? "")
    .trim()
    .toUpperCase()
  const side = String(formData.get("side") ?? "").trim() as TradeSide
  const quantity = Number(formData.get("quantity"))

  if (!symbol) {
    return { status: "error", message: "Enter a symbol, e.g. RELIANCE.NS." }
  }
  if (side !== "buy" && side !== "sell") {
    return { status: "error", message: "Choose a valid side." }
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { status: "error", message: "Quantity must be greater than zero." }
  }

  try {
    const receipt = await placeTrade({ symbol, side, quantity })
    revalidatePath("/dashboard", "layout")

    return {
      status: "success",
      message: `${receipt.side.toUpperCase()} ${receipt.quantity} ${receipt.symbol} filled at ${(receipt.price_cents / 100).toFixed(2)}.`,
      trade: receipt,
    }
  } catch (error) {
    return { status: "error", message: errorMessage(error) }
  }
}

export async function createBudgetAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const period = String(formData.get("period") ?? "").trim() as BudgetPeriod
  const initialCash = Number(formData.get("initialCash"))
  const targetMultiplier = Number(formData.get("targetMultiplier") ?? 40000)
  const name = String(formData.get("name") ?? "").trim()

  if (period !== "day" && period !== "week" && period !== "month") {
    return { status: "error", message: "Choose a budget period." }
  }
  if (!Number.isFinite(initialCash) || initialCash <= 0) {
    return {
      status: "error",
      message: "Starting capital must be greater than zero.",
    }
  }
  if (!Number.isFinite(targetMultiplier) || targetMultiplier <= 0) {
    return { status: "error", message: "Choose a valid target multiplier." }
  }

  try {
    const budget = await createBudget({
      period,
      initial_cash_cents: Math.round(initialCash * 100),
      target_multiplier_bps: Math.round(targetMultiplier),
      name: name || null,
    })
    revalidatePath("/dashboard", "layout")

    return {
      status: "success",
      message: `Budget "${budget.name}" is live until ${new Date(budget.ends_at).toLocaleDateString("en-IN")}.`,
      budget,
    }
  } catch (error) {
    return { status: "error", message: errorMessage(error) }
  }
}

export async function runTickAction(
  _previousState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  try {
    const summary = await runEngineTick()
    revalidatePath("/dashboard", "layout")

    return {
      status: "success",
      message: summary.market_open
        ? `Tick complete — analyzed ${summary.analyzed}, executed ${summary.trades_executed} trade${summary.trades_executed === 1 ? "" : "s"}.`
        : `Tick skipped — ${summary.market_note}`,
    }
  } catch (error) {
    return { status: "error", message: errorMessage(error) }
  }
}
