const API_BASE_URL =
  process.env.PARABELLUM_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001"

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}

type RequestOptions = RequestInit & {
  admin?: boolean
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { admin = false, headers: inputHeaders, ...init } = options
  const headers = new Headers(inputHeaders)

  if (init.body) {
    headers.set("content-type", "application/json")
  }

  if (admin) {
    const token = process.env.PARABELLUM_ADMIN_TOKEN
    if (token) {
      headers.set("x-admin-token", token)
    }
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    })
  } catch (error) {
    throw new ApiError(
      `Could not reach the trading API at ${API_BASE_URL}.`,
      0,
      error
    )
  }

  const text = await response.text()
  let body: unknown = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }
  }

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : `Trading API request failed (${response.status}).`
    throw new ApiError(message, response.status, body)
  }

  return body as T
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path)
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
    admin: true,
  })
}

export function apiBaseUrl() {
  return API_BASE_URL
}

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type BudgetPeriod = "day" | "week" | "month"
export type TradeSide = "buy" | "sell"
export type SignalAction = "buy" | "sell" | "hold"
export type MacroRegime =
  | "risk_on"
  | "neutral"
  | "risk_off"
  | "high_volatility"
export type GuardReason =
  | "ok"
  | "daily_loss_limit"
  | "drawdown_limit"
  | "trade_cap"
  | "cooldown"

export interface BudgetStatus {
  id: string
  name: string
  period: BudgetPeriod
  initial_cash_cents: number
  target_cash_cents: number
  current_value_cents: number
  profit_loss_cents: number
  progress_to_target_bps: number
  started_at: string
  ends_at: string
  active: boolean
}

export interface BudgetRequest {
  period: BudgetPeriod
  initial_cash_cents: number
  name?: string | null
  target_multiplier_bps?: number | null
}

export interface BudgetSnapshot {
  initial_cents: number
  target_cents: number
  progress_bps: number
}

export interface MarketQuote {
  symbol: string
  price_cents: number
  day_change_bps: number
  provider: string
  observed_at: string
}

export interface Mover extends MarketQuote {
  name?: string | null
}

export interface MoversResponse {
  generated_at: string
  gainers: Mover[]
  losers: Mover[]
}

export interface QuotesResponse {
  generated_at: string
  quotes: MarketQuote[]
  missing: string[]
}

export interface Position {
  symbol: string
  quantity: number
  avg_cost_cents: number
  market_price_cents?: number | null
  market_value_cents?: number | null
  unrealized_pnl_cents?: number | null
}

export interface PositionDetail {
  symbol: string
  name?: string | null
  quantity: number
  avg_cost_cents: number
  cost_basis_cents: number
  market_price_cents?: number | null
  market_value_cents?: number | null
  unrealized_pnl_cents?: number | null
  unrealized_pnl_bps?: number | null
  day_change_bps?: number | null
  weight_bps: number
  opened_at: string
  updated_at: string
}

export interface Portfolio {
  account_id: string
  cash_cents: number
  equity_cents: number
  total_value_cents: number
  total_cost_basis_cents: number
  valuation_complete: boolean
  positions: Position[]
  active_budget?: BudgetStatus | null
}

export interface PositionsResponse {
  generated_at: string
  count: number
  cash_cents: number
  equity_cents: number
  total_value_cents: number
  total_cost_basis_cents: number
  valuation_complete: boolean
  total_unrealized_pnl_cents: number
  positions: PositionDetail[]
}

export interface StockProfile {
  account_id: string
  cash_cents: number
  equity_cents: number
  total_value_cents: number
  valuation_complete: boolean
  initial_cash_cents?: number | null
  generated_cents?: number | null
  active_budget?: BudgetStatus | null
  positions: Position[]
  recent_trades: TradeHistoryItem[]
}

export interface MoneyStats {
  left_cents: number
  equity_cents: number
  total_cents: number
  spent_cents: number
  initial_cents: number
  profit_cents: number | null
  valuation_complete: boolean
  currency: string
}

export interface TradeStats {
  total: number
  buys: number
  sells: number
  buy_volume_cents: number
  sell_volume_cents: number
}

export interface ShareStats {
  bought: number
  sold: number
  held: number
}

export interface PositionStats {
  current: number
  symbols: string[]
}

export interface TopTradedSymbol {
  symbol: string
  trades: number
  volume_cents: number
}

export interface TradeTimestamps {
  first?: string | null
  last?: string | null
}

export interface TradingStats {
  money: MoneyStats
  trades: TradeStats
  shares: ShareStats
  positions: PositionStats
  top_symbols: TopTradedSymbol[]
  timestamps: TradeTimestamps
  budget?: BudgetSnapshot | null
}

export interface TradeHistoryItem {
  id: string
  symbol: string
  side: TradeSide
  quantity: number
  price_cents: number
  notional_cents: number
  source: string
  rationale: string
  fee_cents: number
  cash_delta_cents: number
  cost_basis_cents: number
  realized_pnl_cents?: number | null
  quote_price_cents?: number | null
  slippage_bps?: number | null
  created_at: string
}

export interface TradePage {
  items: TradeHistoryItem[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export type LedgerTransactionType =
  | "account_init"
  | "trade"
  | "fee"
  | "budget_reset"

export interface LedgerEntry {
  id: string
  amount_cents: number
  transaction_type: string
  reference_id?: string | null
  description?: string | null
  created_at: string
}

export interface LedgerPage {
  items: LedgerEntry[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface TradeReceipt {
  id: string
  symbol: string
  side: TradeSide
  quantity: number
  price_cents: number
  notional_cents: number
  fee_cents: number
  source: string
  rationale: string
}

export interface CircuitState {
  blocked: boolean
  reason: GuardReason
  detail: string
  entries_today: number
  max_entries_per_day: number
  total_value_cents: number
  day_start_total_cents: number
  peak_total_cents: number
  day_pnl_cents: number
  day_pnl_bps: number
  drawdown_from_peak_bps: number
  max_daily_loss_bps: number
  max_drawdown_bps: number
  halted_until?: string | null
}

export interface SignalFactor {
  name: string
  score_bps: number
  weight_bps: number
  note: string
}

export interface TradingSignal {
  symbol: string
  action: SignalAction
  confidence_bps: number
  suggested_quantity: number
  max_notional_cents: number
  price_cents: number
  rationale: string
  signal_quality: string
  factors: SignalFactor[]
}

export interface TickSummary {
  signals: TradingSignal[]
  analyzed: number
  trades_executed: number
  holds: number
  buys_signaled: number
  sells_signaled: number
  circuit_entries_blocked?: number
  circuit_reason?: string | null
  market_open: boolean
  market_note: string
}

export interface EngineStatusResponse {
  engine_enabled: boolean
  started_at: string
  server_time: string
  uptime_secs: number
  tick_interval_seconds: number
  candidates_per_tick: number
  universe: string
  market: string
  currency: string
  market_open: boolean
  market_session: string
  market_hours_only: boolean
  tick_count: number
  positions_open: number
  max_positions_bull: number
  max_positions_bear: number
  circuit: CircuitState
  budget?: BudgetStatus | null
  last_tick_at?: string | null
  last_tick?: TickSummary | null
}

export interface DashboardSummary {
  server_time: string
  uptime_secs: number
  engine: EngineStatusResponse
  portfolio: Portfolio
  stats: TradingStats
  recent_trades: TradeHistoryItem[]
}

export interface HealthResponse {
  status: string
  message: string
  version: string
  redis_cache: string
  engine_enabled: boolean
  market: string
  market_open: boolean
  market_session: string
  market_hours_only: boolean
  started_at: string
  server_time: string
  uptime_secs: number
}

export interface RuntimeConfigResponse {
  version: string
  market: string
  currency: string
  indian_market_only: boolean
  market_universe: string
  market_hours_only: boolean
  engine_enabled: boolean
  engine_candidates_per_tick: number
  engine_tick_interval_seconds: number
  engine_symbol_refresh_hours: number
  starting_cash_cents: number
  target_multiplier_bps: number
  trade_size_bps: number
  max_position_bps: number
  max_trade_notional_cents: number
  min_entry_price_cents: number
  max_quote_age_secs: number
  slippage_bps: number
  trading_cost_bps: number
  entry_threshold_bps: number
  exit_threshold_bps: number
  stop_loss_pct: number
  take_profit_pct: number
  trailing_stop_activation_pct: number
  trailing_stop_loss_pct: number
  scale_in_enabled: boolean
  scale_in_threshold_pct: number
  scale_in_add_pct: number
  max_positions_bull: number
  max_positions_bear: number
  max_entries_per_tick: number
  max_sector_bps: number
  min_cash_bps: number
  atr_stop_multiplier: number
  max_stop_pct: number
  time_stop_days: number
  risk_per_trade_bps: number
  max_daily_loss_bps: number
  max_drawdown_bps: number
  max_entries_per_day: number
  cooldown_secs: number
  economics_research_enabled: boolean
  economics_research_interval_seconds: number
  economics_prefetch_batch_size: number
  tech_score_bias_bps: number
  indian_bias_bps: number
  high_roi_override_bps: number
  universe_min_price_cents: number
  universe_min_turnover_cents: number
  redis_cache_enabled: boolean
  admin_auth_enabled: boolean
}

export interface MacroSnapshot {
  vix_cents?: number | null
  vix_penalty_bps: number
  vix_note: string
  risk_off_penalty_bps: number
  risk_off_note: string
  spy_change_bps?: number | null
  regime: MacroRegime
  fetched_at: string
}

export interface EconomicsRank {
  symbol: string
  quality_bps: number
  growth_bps: number
  value_bps: number
  quality_note: string
}

export interface ResearchStatus {
  running: boolean
  last_cycle_at?: string | null
  symbols_prefetched: number
  macro_cached: boolean
  top_ranked: EconomicsRank[]
}

export interface SymbolInfo {
  symbol: string
  name: string
  source: string
  active: boolean
  last_selected_at?: string | null
}

export interface SymbolPage {
  items: SymbolInfo[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface PriceBar {
  date: string
  close_cents: number
}

export interface PriceHistorySummary {
  first_close_cents: number
  last_close_cents: number
  change_cents: number
  change_bps: number
  high_cents: number
  low_cents: number
  trading_days: number
}

export interface PriceHistoryResponse {
  symbol: string
  from: string
  to: string
  bars: PriceBar[]
  summary?: PriceHistorySummary | null
}

export interface CompanyFundamentals {
  symbol: string
  name: string
  sector: string
  industry: string
  description: string
  recommendation: string
  fetched_at: string
  source: string
  market_cap_cents?: number | null
  pe_ratio?: number | null
  eps?: number | null
  target_price_cents?: number | null
  dividend_yield_pct?: number | null
  profit_margin_pct?: number | null
  return_on_equity_pct?: number | null
  revenue_growth_pct?: number | null
  debt_to_equity?: number | null
  current_ratio?: number | null
  total_revenue_cents?: number | null
  gross_profit_cents?: number | null
  operating_income_cents?: number | null
  net_income_cents?: number | null
  total_debt_cents?: number | null
  total_equity_cents?: number | null
  employees?: number | null
  analyst_count?: number | null
  previous_year_revenue_cents?: number | null
}

/* -------------------------------------------------------------------------- */
/*                                 Endpoints                                  */
/* -------------------------------------------------------------------------- */

export const getDashboard = () => apiGet<DashboardSummary>("/dashboard")
export const getEngineStatus = () =>
  apiGet<EngineStatusResponse>("/engine/status")
export const getHealth = () => apiGet<HealthResponse>("/health")
export const getConfig = () => apiGet<RuntimeConfigResponse>("/config")
export const getPortfolio = () => apiGet<Portfolio>("/portfolio")
export const getPositions = () => apiGet<PositionsResponse>("/positions")
export const getStats = () => apiGet<TradingStats>("/stats")
export const getActiveBudget = () =>
  apiGet<BudgetStatus | null>("/budgets/active")
export const getMacro = () => apiGet<MacroSnapshot>("/economics/macro")
export const getResearchStatus = () =>
  apiGet<ResearchStatus>("/economics/research/status")
export const getRankings = () => apiGet<EconomicsRank[]>("/economics/rankings")

export function getTrades(params: {
  page?: number
  page_size?: number
  symbol?: string
  side?: TradeSide
  source?: string
} = {}) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value))
  }
  const query = search.toString()
  return apiGet<TradePage>(`/trades/history${query ? `?${query}` : ""}`)
}

export function getLedger(params: {
  page?: number
  page_size?: number
  transaction_type?: string
  from?: string
  to?: string
} = {}) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value))
  }
  const query = search.toString()
  return apiGet<LedgerPage>(`/ledger${query ? `?${query}` : ""}`)
}

export const getStockProfile = () => apiGet<StockProfile>("/stock-profile")

export function getMovers(limit = 8) {
  return apiGet<MoversResponse>(`/market/movers?limit=${limit}`)
}

export function getQuotes(symbols: string[]) {
  const unique = [...new Set(symbols.filter(Boolean))]
  if (!unique.length) {
    return Promise.resolve<QuotesResponse>({
      generated_at: new Date().toISOString(),
      quotes: [],
      missing: [],
    })
  }
  return apiGet<QuotesResponse>(
    `/market/quotes?symbols=${encodeURIComponent(unique.join(","))}`
  )
}

export function getSymbols(params: {
  q?: string
  page?: number
  page_size?: number
  include_inactive?: boolean
} = {}) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value))
  }
  const query = search.toString()
  return apiGet<SymbolPage>(`/market/symbols${query ? `?${query}` : ""}`)
}

export function getQuote(symbol: string) {
  return apiGet<MarketQuote>(`/market/quote/${encodeURIComponent(symbol)}`)
}

export function getSignal(symbol: string) {
  return apiGet<TradingSignal>(`/market/signal/${encodeURIComponent(symbol)}`)
}

export function getPriceHistory(symbol: string, days = 90) {
  return apiGet<PriceHistoryResponse>(
    `/market/history/${encodeURIComponent(symbol)}?days=${days}`
  )
}

export function getFundamentals(symbol: string) {
  return apiGet<CompanyFundamentals>(
    `/economics/profile/${encodeURIComponent(symbol)}`
  )
}

export function createBudget(body: BudgetRequest) {
  return apiPost<BudgetStatus>("/budgets", body)
}

export function placeTrade(body: {
  symbol: string
  side: TradeSide
  quantity: number
}) {
  return apiPost<TradeReceipt>("/trades", body)
}

export function runEngineTick() {
  return apiPost<TickSummary>("/engine/tick", {})
}
