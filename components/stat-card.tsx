import * as React from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "cn"

export type StatTone =
  | "positive"
  | "negative"
  | "neutral"
  | "primary"
  | "warning"

const toneClasses: Record<StatTone, string> = {
  positive:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-400",
  negative:
    "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:border-rose-400/30 dark:text-rose-400",
  neutral: "border-border text-muted-foreground",
  primary: "border-primary/30 bg-primary/10 text-primary",
  warning:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:text-amber-400",
}

export function StatCard({
  label,
  value,
  change,
  changeIcon,
  tone = "neutral",
  footer,
  footerIcon,
  subfooter,
  valueClassName,
}: {
  label: string
  value: React.ReactNode
  change?: React.ReactNode
  changeIcon?: React.ReactNode
  tone?: StatTone
  footer?: React.ReactNode
  footerIcon?: React.ReactNode
  subfooter?: React.ReactNode
  valueClassName?: string
}) {
  return (
    <Card className="@container/card max-w-full *:data-[slot=card]:bg-linear-to-t">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
          <CardTitle
            className={cn(
              "text-2xl font-semibold whitespace-nowrap tabular-nums @[250px]/card:text-3xl",
              valueClassName
            )}
          >
            {value}
          </CardTitle>
          {change ? (
            <Badge
              variant="outline"
              className={cn(
                "max-w-full shrink-0 gap-1 text-[11px]",
                toneClasses[tone]
              )}
            >
              {changeIcon}
              {change}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex items-center gap-1.5 font-medium">
          <span className="truncate">{footer}</span>
          {footerIcon}
        </div>
        <div className="line-clamp-1 text-muted-foreground">{subfooter}</div>
      </CardFooter>
    </Card>
  )
}
