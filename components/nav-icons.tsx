import {
  ArrowLeftRightIcon,
  BookOpenIcon,
  BriefcaseBusinessIcon,
  ChartCandlestickIcon,
  CpuIcon,
  LayoutDashboardIcon,
  MicroscopeIcon,
  ReceiptTextIcon,
  Settings2Icon,
  TargetIcon,
  type LucideIcon,
} from "lucide-react"

export const navigationIcons: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboardIcon,
  "/dashboard/portfolio": BriefcaseBusinessIcon,
  "/dashboard/trades": ArrowLeftRightIcon,
  "/dashboard/ledger": ReceiptTextIcon,
  "/dashboard/budget": TargetIcon,
  "/dashboard/market": ChartCandlestickIcon,
  "/dashboard/research": MicroscopeIcon,
  "/dashboard/engine": CpuIcon,
  "/dashboard/settings": Settings2Icon,
  "http://localhost:3001/docs": BookOpenIcon,
}

export function navigationIcon(url: string) {
  return navigationIcons[url] ?? LayoutDashboardIcon
}
