"use client"

import { useState, useEffect } from "react"
import { TrendingUp, BarChart3, PieChart, Activity, Download, Filter, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ChartContainer,
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
  COLORS,
} from "@/components/ui/chart"

interface AnalyticsData {
  productivity: {
    daily: Array<{ date: string; completed: number; created: number }>
    weekly: Array<{ week: string; productivity: number }>
    monthly: Array<{ month: string; tasks: number; hours: number }>
  }
  projects: {
    completion: Array<{ name: string; completed: number; total: number }>
    timeline: Array<{ project: string; planned: number; actual: number }>
  }
  team: {
    performance: Array<{ member: string; tasks: number; efficiency: number }>
    workload: Array<{ member: string; assigned: number; completed: number }>
  }
  trends: {
    taskTypes: Array<{ type: string; count: number; color: string }>
    priorities: Array<{ priority: string; count: number; color: string }>
    statuses: Array<{ status: string; count: number; color: string }>
  }
}

export default function AnalyticsContent() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")
  const [selectedMetric, setSelectedMetric] = useState("productivity")

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    setIsLoading(true)
    try {
      // Simulate API call - in real app, this would fetch from your analytics endpoint
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock analytics data
      const mockData: AnalyticsData = {
        productivity: {
          daily: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            completed: Math.floor(Math.random() * 10) + 1,
            created: Math.floor(Math.random() * 8) + 2,
          })),
          weekly: Array.from({ length: 12 }, (_, i) => ({
            week: `Week ${i + 1}`,
            productivity: Math.floor(Math.random() * 40) + 60,
          })),
          monthly: Array.from({ length: 6 }, (_, i) => ({
            month: new Date(Date.now() - (5 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
              month: "short",
            }),
            tasks: Math.floor(Math.random() * 50) + 20,
            hours: Math.floor(Math.random() * 100) + 50,
          })),
        },
        projects: {
          completion: [
            { name: "E-commerce Platform", completed: 45, total: 60 },
            { name: "Mobile App", completed: 28, total: 40 },
            { name: "Analytics Dashboard", completed: 35, total: 35 },
            { name: "Marketing Website", completed: 12, total: 20 },
          ],
          timeline: [
            { project: "E-commerce", planned: 90, actual: 95 },
            { project: "Mobile App", planned: 60, actual: 75 },
            { project: "Dashboard", planned: 45, actual: 40 },
            { project: "Website", planned: 30, actual: 35 },
          ],
        },
        team: {
          performance: [
            { member: "John Doe", tasks: 24, efficiency: 92 },
            { member: "Jane Smith", tasks: 18, efficiency: 88 },
            { member: "Mike Wilson", tasks: 21, efficiency: 95 },
            { member: "Sarah Johnson", tasks: 16, efficiency: 85 },
          ],
          workload: [
            { member: "John Doe", assigned: 28, completed: 24 },
            { member: "Jane Smith", assigned: 22, completed: 18 },
            { member: "Mike Wilson", assigned: 25, completed: 21 },
            { member: "Sarah Johnson", assigned: 20, completed: 16 },
          ],
        },
        trends: {
          taskTypes: [
            { type: "Feature", count: 45, color: COLORS.primary },
            { type: "Bug Fix", count: 28, color: COLORS.danger },
            { type: "Enhancement", count: 32, color: COLORS.secondary },
            { type: "Documentation", count: 15, color: COLORS.accent },
          ],
          priorities: [
            { type: "Urgent", count: 12, color: COLORS.danger },
            { type: "High", count: 28, color: COLORS.accent },
            { type: "Medium", count: 45, color: COLORS.primary },
            { type: "Low", count: 35, color: COLORS.secondary },
          ],
          statuses: [
            { type: "Completed", count: 65, color: COLORS.secondary },
            { type: "In Progress", count: 32, color: COLORS.primary },
            { type: "To Do", count: 23, color: COLORS.accent },
          ],
        },
      }

      setAnalyticsData(mockData)
    } catch (error) {
      console.error("Failed to fetch analytics data:", error)
    } finally {
      setIsLoading(false)
    }
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
          <Button variant="outline">
            <Filter size={16} className="mr-2" />
            <span className="text-medium">Filter</span>
          </Button>
          <Button variant="outline">
            <Download size={16} className="mr-2" />
            <span className="text-medium">Export</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard title="Total Tasks" value="247" change="+12%" trend="up" icon={BarChart3} isLoading={isLoading} />
        <MetricCard
          title="Completion Rate"
          value="87%"
          change="+5%"
          trend="up"
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <MetricCard title="Team Efficiency" value="92%" change="+3%" trend="up" icon={Activity} isLoading={isLoading} />
        <MetricCard title="Projects Active" value="8" change="+2" trend="up" icon={PieChart} isLoading={isLoading} />
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
                <ChartContainer>
                  <LineChart data={analyticsData?.productivity.daily || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke={COLORS.primary}
                      strokeWidth={3}
                      dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
                      name="Completed"
                    />
                    <Line
                      type="monotone"
                      dataKey="created"
                      stroke={COLORS.secondary}
                      strokeWidth={3}
                      dot={{ fill: COLORS.secondary, strokeWidth: 2, r: 4 }}
                      name="Created"
                    />
                  </LineChart>
                </ChartContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Distribution */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
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
                <ChartContainer>
                  <RechartsPieChart>
                    <Pie
                      data={analyticsData?.trends.taskTypes || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {analyticsData?.trends.taskTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ChartContainer>
                <div className="flex flex-wrap gap-4 mt-4 justify-center">
                  {analyticsData?.trends.taskTypes.map((item, index) => (
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

      {/* Project Performance */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <span>Project Completion Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="space-y-3 w-full">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-5/6" />
                <Skeleton className="h-8 w-4/6" />
                <Skeleton className="h-8 w-3/6" />
              </div>
            </div>
          ) : (
            <div className="h-64">
              <ChartContainer>
                <BarChart data={analyticsData?.projects.completion || []} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={120} />
                  <Bar dataKey="completed" fill={COLORS.secondary} radius={[0, 4, 4, 0]} name="Completed" />
                  <Bar dataKey="total" fill="#E5E7EB" radius={[0, 4, 4, 0]} name="Total" />
                </BarChart>
              </ChartContainer>
            </div>
          )}
        </CardContent>
      </Card>

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
                {analyticsData?.team.performance.map((member, index) => (
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

        <Card className="bg-white shadow-sm">
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
                <ChartContainer>
                  <BarChart data={analyticsData?.productivity.monthly || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Bar dataKey="tasks" fill={COLORS.primary} radius={[4, 4, 0, 0]} name="Tasks" />
                    <Bar dataKey="hours" fill={COLORS.accent} radius={[4, 4, 0, 0]} name="Hours" />
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

function MetricCard({
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
}) {
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
