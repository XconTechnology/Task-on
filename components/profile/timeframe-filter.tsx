"use client"

import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Calendar, Clock, TrendingUp, BarChart3, CalendarDays } from "lucide-react"

interface TimeframeFilterProps {
  value: string
  onValueChange: (value: string) => void
  className?: string
}

const timeframeOptions = [
  {
    value: "today",
    label: "Today",
    icon: Clock,
    description: "Activities from today",
  },
  {
    value: "week",
    label: "This Week",
    icon: Calendar,
    description: "Activities from this week",
  },
  {
    value: "month",
    label: "This Month",
    icon: TrendingUp,
    description: "Activities from this month",
  },
  {
    value: "year",
    label: "This Year",
    icon: BarChart3,
    description: "Activities from this year",
  },
  {
    value: "all",
    label: "All Time",
    icon: CalendarDays,
    description: "All activities",
  },
]

export function TimeframeFilter({ value, onValueChange, className }: TimeframeFilterProps) {
  const selectedOption = timeframeOptions.find((option) => option.value === value)

  return (
    <div className={className}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-[180px] h-10 bg-white border border-gray-300 shadow-sm hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-gray-900">{selectedOption?.label || "Select timeframe"}</span>
            </div>
          </div>
        </SelectTrigger>
        <SelectContent className="w-[220px] bg-white border border-gray-200 shadow-lg rounded-lg p-1">
          {timeframeOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 rounded-md p-3 transition-colors"
            >
              <div className="flex items-center gap-3">
                <option.icon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <div className="flex flex-col">
                  <div className="font-medium text-gray-900 text-sm">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </div>
                {value === option.value && (
                  <div className="ml-auto">
                    <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                  </div>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
