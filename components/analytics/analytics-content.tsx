"use client"

import { useState, useEffect } from "react"
import { TrendingUp, BarChart3, PieChart, Activity, Download,  Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "@/components/ui/chart"
import MetricCard from "./MetricCard"
import { AnalyticsData } from "@/lib/types"
import { monthlyOverviewConfig, productivityChartConfig, taskDistributionConfig } from "@/lib/constants"



export default function AnalyticsContent() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/analytics?timeRange=${timeRange}`)
      const data = await response.json()

      if (data.success) {
        // Ensure we have data for task types
        if (!data.data.trends.taskTypes || data.data.trends.taskTypes.length === 0) {
          data.data.trends.taskTypes = [
            { type: "Feature", count: 45, color: "#4f46e5" },
            { type: "Bug Fix", count: 28, color: "#ef4444" },
            { type: "Enhancement", count: 32, color: "#0ea5e9" },
            { type: "Documentation", count: 15, color: "#f97316" },
          ]
        }

        setAnalyticsData(data.data)
      } else {
        console.error("Failed to fetch analytics:", data.error)
      }
    } catch (error) {
      console.error("Failed to fetch analytics data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = () => {
    // Implement export functionality
    console.log("Exporting analytics data...")
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="header-large">Analytics</h1>
          <p className="text-description mt-1">Comprehensive insights into your projects, teams, and productivity.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download size={16} className="mr-2" />
            <span className="text-medium">Export</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Tasks"
          value={analyticsData?.keyMetrics.totalTasks.toString() || "0"}
          change={analyticsData?.keyMetrics.tasksChange || "+0%"}
          trend="up"
          icon={BarChart3}
          isLoading={isLoading}
        />
        <MetricCard
          title="Completion Rate"
          value={`${analyticsData?.keyMetrics.completionRate || 0}%`}
          change={analyticsData?.keyMetrics.completionChange || "+0%"}
          trend="up"
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <MetricCard
          title="Team Efficiency"
          value={`${analyticsData?.keyMetrics.teamEfficiency || 0}%`}
          change={analyticsData?.keyMetrics.efficiencyChange || "+0%"}
          trend="up"
          icon={Activity}
          isLoading={isLoading}
        />
        <MetricCard
          title="Projects Active"
          value={analyticsData?.keyMetrics.activeProjects.toString() || "0"}
          change={analyticsData?.keyMetrics.projectsChange || "+0"}
          trend="up"
          icon={PieChart}
          isLoading={isLoading}
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productivity Trend */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Productivity Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="space-y-3 w-full">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>
            ) : (
              <div className="h-64">
                <ChartContainer config={productivityChartConfig}>
                  <LineChart data={analyticsData?.productivity.daily || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="var(--color-completed)"
                      strokeWidth={3}
                      dot={{ fill: "var(--color-completed)", strokeWidth: 2, r: 4 }}
                      name="Completed"
                    />
                    <Line
                      type="monotone"
                      dataKey="created"
                      stroke="var(--color-created)"
                      strokeWidth={3}
                      dot={{ fill: "var(--color-created)", strokeWidth: 2, r: 4 }}
                      name="Created"
                    />
                  </LineChart>
                </ChartContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Distribution */}
        <Card className="bg-white shadow-sm space-y-0">
          <CardHeader className=" pb-0 ">
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-purple-600" />
              <span>Task Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Skeleton className="h-48 w-48 rounded-full" />
              </div>
            ) : (
              <div className="h-64">
                <ChartContainer  config={taskDistributionConfig}>
                  <RechartsPieChart >
                    <Pie
                      data={analyticsData?.trends.taskTypes || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="type"
                    >
                      {analyticsData?.trends.taskTypes.map((entry:any, index:any) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent nameKey="type" />} />
                  </RechartsPieChart>
                </ChartContainer>
                <div className="flex flex-wrap gap-4 justify-center">
                  {analyticsData?.trends.taskTypes.map((item:any, index:any) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-small text-gray-600">
                        {item.type} ({item.count})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-orange-600" />
              <span>Team Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {analyticsData?.team.performance.map((member:any, index:any) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-small font-medium">{member.member.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-medium font-medium text-gray-900">{member.member}</p>
                        <p className="text-small text-gray-600">{member.tasks} tasks completed</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-medium font-semibold text-gray-900">{member.efficiency}%</p>
                      <p className="text-small text-gray-600">Efficiency</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span>Monthly Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="space-y-3 w-full">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ) : (
              <div className="h-64">
                <ChartContainer config={monthlyOverviewConfig}>
                  <BarChart data={analyticsData?.productivity.monthly || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="tasks" fill="var(--color-tasks)" radius={[4, 4, 0, 0]} name="Tasks" />
                    <Bar dataKey="hours" fill="var(--color-hours)" radius={[4, 4, 0, 0]} name="Hours" />
                  </BarChart>
                </ChartContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
