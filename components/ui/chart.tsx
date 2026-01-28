"use client"

import * as React from "react"
import { Tooltip, type TooltipProps } from "recharts"
import { cn } from "@/lib/utils"

export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<string, string> }
  )
}

const ChartContext = React.createContext<{
  config: ChartConfig
}>({
  config: {},
})

export function useChartConfig() {
  return React.useContext(ChartContext).config
}

export function ChartContainer({
  config,
  children,
  className,
}: {
  config: ChartConfig
  children: React.ReactNode
  className?: string
}) {
  return (
    <ChartContext.Provider value={{ config }}>
      <div className={className}>{children}</div>
    </ChartContext.Provider>
  )
}

// Thin wrapper around Recharts Tooltip to keep import sites clean
export function ChartTooltip(props: TooltipProps<number, string>) {
  return <Tooltip {...props} />
}

type ChartTooltipContentProps = {
  active?: boolean
  payload?: {
    color?: string
    name?: string
    dataKey?: string
    value?: any
    payload?: any
  }[]
  label?: string | number
  className?: string
  indicator?: "dot" | "line"
  labelFormatter?: (label: any) => React.ReactNode
  valueFormatter?: (value: any, name?: string, payload?: any) => React.ReactNode
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  indicator = "dot",
  labelFormatter,
  valueFormatter,
}: ChartTooltipContentProps) {
  const config = useChartConfig()
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark")

  if (!active || !payload || payload.length === 0) return null

  return (
    <div
      className={cn(
        "rounded-md border bg-popover px-3 py-2 shadow-md",
        "text-sm text-popover-foreground",
        className
      )}
    >
      <div className="text-xs font-medium text-muted-foreground">
        {labelFormatter ? labelFormatter(label) : label}
      </div>
      <div className="mt-2 flex flex-col gap-1">
        {payload.map((item, idx) => {
          // Try to match config by dataKey first, then by name (case-insensitive)
          const dataKey = item.dataKey
          const nameKey = item.name?.toLowerCase()
          const itemConfig =
            (dataKey && config[dataKey]) ||
            (nameKey && config[nameKey]) ||
            (item.name && config[item.name]) ||
            {}

          const color =
            item.color ||
            (itemConfig as any).color ||
            ((itemConfig as any).theme &&
              (itemConfig as any).theme[isDark ? "dark" : "light"]) ||
            "hsl(var(--primary))"

          const name = (itemConfig as any).label || item.name || item.dataKey
          const Icon = (itemConfig as any).icon
          
          // Use valueFormatter if provided, otherwise format the value
          let formattedValue = item.value
          if (valueFormatter) {
            formattedValue = valueFormatter(item.value, item.name || item.dataKey, item.payload)
          } else if (typeof item.value === "number") {
            formattedValue = item.value.toLocaleString()
          }
          
          const value = formattedValue

          return (
            <div key={idx} className="flex items-center gap-2">
              {Icon ? (
                <Icon className="h-3 w-3" style={{ color }} />
              ) : (
                <span
                  className={indicator === "line" ? "h-0.5 w-3" : "h-2 w-2 rounded-full"}
                  style={{ backgroundColor: color }}
                />
              )}
              <span className="text-muted-foreground">{name}</span>
              <span className="font-semibold">{value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}