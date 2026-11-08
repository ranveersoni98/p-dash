"use client"

import { useTheme } from "next-themes"
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useMounted } from "@/hooks/use-mounted"
import { cn } from "cn"

const options = [
  { value: "system", label: "System", icon: MonitorIcon },
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
] as const

export function ThemePreference() {
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()

  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((option) => {
        const active = mounted && theme === option.value
        const Icon = option.icon
        return (
          <Button
            key={option.value}
            type="button"
            variant={active ? "default" : "outline"}
            size="sm"
            className={cn("justify-center gap-2", !mounted && "opacity-60")}
            aria-pressed={active}
            onClick={() => setTheme(option.value)}
          >
            <Icon data-icon="inline-start" />
            {option.label}
          </Button>
        )
      })}
    </div>
  )
}
