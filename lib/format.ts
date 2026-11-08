const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
})

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
})

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
})

export function formatCents(
  cents: number | null | undefined,
  options: { compact?: boolean; decimals?: number; sign?: boolean } = {}
) {
  if (cents === null || cents === undefined || Number.isNaN(cents)) return "—"

  const { compact = false, decimals, sign = false } = options
  const rupees = cents / 100
  const prefix = sign && rupees > 0 ? "+" : ""

  if (compact) {
    const absolute = Math.abs(rupees)
    const signPrefix = rupees < 0 ? "-" : prefix
    if (absolute >= 1_00_00_000) {
      const crores = absolute / 1_00_00_000
      const rendered =
        crores >= 1_000
          ? new Intl.NumberFormat("en-IN", {
              maximumFractionDigits: 0,
            }).format(crores)
          : crores.toFixed(2)
      return `${signPrefix}₹${rendered}Cr`
    }
    if (absolute >= 1_00_000) {
      return `${signPrefix}₹${(absolute / 1_00_000).toFixed(2)}L`
    }
    if (absolute >= 1_000) {
      return `${signPrefix}₹${(absolute / 1_000).toFixed(1)}K`
    }
  }

  if (decimals !== undefined) {
    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(rupees)
    return prefix ? `${prefix}${formatted}` : formatted
  }

  return prefix ? `${prefix}${currencyFormatter.format(rupees)}` : currencyFormatter.format(rupees)
}

export function formatSignedCents(cents: number | null | undefined) {
  return formatCents(cents, { sign: true })
}

export function formatNumber(value: number | null | undefined, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—"
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(value)
}

export function formatQuantity(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—"
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 3,
  }).format(value)
}

export function formatPercent(
  value: number | null | undefined,
  options: { sign?: boolean; decimals?: number } = {}
) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—"
  const { sign = false, decimals = 2 } = options
  const prefix = sign && value > 0 ? "+" : ""
  return `${prefix}${value.toFixed(decimals)}%`
}

export function formatBps(
  bps: number | null | undefined,
  options: { sign?: boolean; decimals?: number } = {}
) {
  if (bps === null || bps === undefined || Number.isNaN(bps)) return "—"
  return formatPercent(bps / 100, options)
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return dateTimeFormatter.format(date)
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return dateFormatter.format(date)
}

export function formatTime(iso: string | null | undefined) {
  if (!iso) return "—"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return timeFormatter.format(date)
}

export function formatDuration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return "—"
  const total = Math.max(0, Math.floor(seconds))
  const days = Math.floor(total / 86_400)
  const hours = Math.floor((total % 86_400) / 3_600)
  const minutes = Math.floor((total % 3_600) / 60)

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function formatDaysRemaining(iso: string | null | undefined) {
  if (!iso) return "—"
  const target = new Date(iso).getTime()
  if (Number.isNaN(target)) return "—"
  const diff = target - Date.now()
  if (diff <= 0) return "Ended"
  const days = Math.ceil(diff / 86_400_000)
  if (days === 1) return "1 day left"
  return `${days} days left`
}

export function shortSymbol(symbol: string) {
  return symbol.replace(/\.NS$/i, "")
}

export function pnlTone(value: number | null | undefined) {
  if (value === null || value === undefined || value === 0) {
    return "text-muted-foreground"
  }
  return value > 0
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-rose-600 dark:text-rose-400"
}

export function pnlBadgeTone(value: number | null | undefined) {
  if (value === null || value === undefined || value === 0) {
    return "border-border text-muted-foreground"
  }
  return value > 0
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-400"
    : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:border-rose-400/30 dark:text-rose-400"
}

export function humanizeEnum(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function formatQualityNote(note: string | null | undefined) {
  if (!note) return "No factor detail"
  const parts = note
    .trim()
    .split(/\s+/)
    .map((part) => {
      const [rawKey, rawValue] = part.split("=")
      if (!rawKey || rawValue === undefined || rawValue === "null") return null
      const key = rawKey.toLowerCase()
      if (key === "growth" || key === "quality" || key === "value") {
        const bps = Number(rawValue)
        if (Number.isNaN(bps)) return null
        return `${humanizeEnum(key)} ${formatBps(bps)}`
      }
      if (key === "src" || key === "scr" || key === "source") {
        return `Source ${humanizeEnum(rawValue)}`
      }
      return `${humanizeEnum(key)} ${rawValue}`
    })
    .filter((part): part is string => Boolean(part))
  return parts.length ? parts.join(" · ") : note
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}
