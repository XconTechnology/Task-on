import type React from "react"
import type { ChartConfig } from "@/components/ui/chart"

export interface ChartContainerProps {
  children: React.ReactNode
  className?: string
  config: ChartConfig
}
