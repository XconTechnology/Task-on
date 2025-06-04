import React from 'react'
import { Card, CardContent } from '../ui/card'
import { Skeleton } from '../ui/skeleton'
import { TrendingUp } from 'lucide-react'

const MetricCard=({
  title,
  value,
  change,
  trend,
  icon: Icon,
  isLoading,
}: {
  title: string
  value: string
  change: string
  trend: "up" | "down"
  icon: any
  isLoading: boolean
})  =>{
  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-12 w-12 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-small uppercase tracking-wide">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            <div className="flex items-center mt-2">
              <TrendingUp className={`w-4 h-4 mr-1 ${trend === "up" ? "text-green-500" : "text-red-500"}`} />
              <span className={`text-small ${trend === "up" ? "text-green-600" : "text-red-600"}`}>{change}</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


export default MetricCard
