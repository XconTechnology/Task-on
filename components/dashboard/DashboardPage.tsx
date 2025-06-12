import { TrendingUp, Target, BarChart3, CheckCircle, Clock, Activity, ArrowUp, Zap, Award } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ChartTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "@/components/ui/chart"
import { TIME_STATS_DATA } from "@/lib/constants"
import { getProgressColor, getProgressTextColor } from "@/lib/utils"

import type React from "react"
import type { DashboardPageStats } from "@/lib/types"
import Image from "next/image"

type DashboardPageProps = {
  user: { username: string }
  stats: DashboardPageStats
  motivationalMessage: any
  priorityChartData: any
}

const DashboardPage: React.FC<DashboardPageProps> = ({ user, stats, motivationalMessage, priorityChartData }) => {
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="header-large">Dashboard</h1>
          <p className="text-description mt-1">
            Welcome back, {user?.username}! Here&apos;s what&apos;s happening with your projects.
          </p>
        </div>
        <div className="text-right">
          <p className="text-muted-small">Last updated</p>
          <p className="text-medium font-medium">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Stats Cards Grid - Including Congratulations Box */}
      <div className="grid grid-cols-1  md:grid-cols-12 lg:grid-cols-13 gap-6">
        {/* Congratulations Box */}
        <Card className="md:col-span-1 lg:col-span-4 bg-white shadow-sm hover:shadow-md transition-shadow border-none relative overflow-hidden">
          <CardContent className="p-0">
            <div className={`bg-gradient-to-br ${motivationalMessage.color} p-6 text-white relative h-full`}>
              <div className="absolute top-2 right-2">
                <Badge className="bg-white/20 text-white text-xs">Top Performer</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <motivationalMessage.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{motivationalMessage.title.split("!")[0]}</span>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.todayCompletedTasks} Tasks</p>
                  <p className="text-white/80 text-sm">{motivationalMessage.percentage.toFixed(0)}% of daily target</p>
                </div>
               <div className="w-2/3">
                 <Progress
                  value={motivationalMessage.percentage}
                  className="h-2 bg-white/20"
                  indicatorClassName="bg-white"
                />
               </div>
                <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white text-xs">
                  View Details
                </Button>
              </div>
              {/* Gift icon */}
              <div className="absolute bottom-2 right-2 text-2xl">
                <Image src={motivationalMessage.giftIcon || "/placeholder.svg"} alt="gift" width={80} height={80} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Tasks Card - Enhanced Design */}
        <Card className="bg-white md:col-span-3 shadow-sm hover:shadow-md transition-shadow border-none overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col h-full">
              <div className="p-5 pb-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">TOTAL TASKS</h3>
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Activity className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline">
                  <p className="text-4xl font-bold text-gray-900">{stats.totalTasks}</p>
                  <div className="ml-3 flex items-center text-xs font-medium text-green-600">
                    <ArrowUp className="w-3 h-3 mr-0.5" />
                    <span>All time</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto p-5 pt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-500">Project completion</span>
                  <span className={`text-xs font-bold ${getProgressTextColor(stats.completionRate)}`}>
                    {stats.completionRate}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(stats.completionRate)}`}
                    style={{ width: `${stats.completionRate}%` }}
                  ></div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></div>
                    <span className="text-xs text-gray-500">Active</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></div>
                    <span className="text-xs text-gray-500">Completed</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completed Tasks Card - Enhanced Design */}
        <Card className="bg-white shadow-sm  md:col-span-3 hover:shadow-md transition-shadow border-none overflow-hidden">
          <CardContent className="p-0 ">
            <div className="flex flex-col space-y-3 h-full">
              <div className="p-5 pb-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">COMPLETED</h3>
                  <div className="bg-green-100 p-2 rounded-full">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline">
                  <p className="text-4xl font-bold text-gray-900">{stats.completedTasks}</p>
                  <div className="ml-3 flex items-center text-xs font-medium text-green-600">
                    <span className="flex items-center">
                      <CheckCircle className="w-3 h-3 mr-0.5" />
                       {stats.completionRate} completion rate
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <div className="px-5 py-3 bg-gradient-to-r from-green-50  to-emerald-50 border-t border-green-100">
                  <div className="flex items-center justify-between ">
                    <div className="flex items-center">
                      <Award className="w-4 h-4 text-green-600 mr-1.5" />
                      <span className="text-xs font-medium text-green-700">completed !</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-600 mr-1">Today:</span>
                      <span className="text-xs font-bold text-green-700">+{stats.todayCompletedTasks}</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center">
                    <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                        style={{ width: `${stats.completionRate}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-xs font-medium text-green-700">{stats.completionRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* In Progress Tasks Card - Enhanced Design */}
        <Card className="bg-white shadow-sm md:col-span-3  hover:shadow-md transition-shadow border-none overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col h-full">
              <div className="p-5 pb-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">IN PROGRESS</h3>
                  <div className="bg-amber-100 p-2 rounded-full">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline">
                  <p className="text-4xl font-bold text-gray-900">{stats.inProgressTasks}</p>
                  <div className="ml-3 flex items-center text-xs font-medium text-amber-600">
                    <span className="flex items-center">
                      <Zap className="w-3 h-3 mr-0.5" />
                      Active tasks
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <div className="px-5 py-3 mt-3">
                  <div className="flex items-center space-x-2">
                    {stats.inProgressTasks > 0 ? (
                      <>
                        <div className="relative flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-white" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-700">Tasks need attention</p>
                          <p className="text-xs text-gray-500">Due soon</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-700">No active tasks</p>
                          <p className="text-xs text-gray-500">All caught up!</p>
                        </div>
                      </>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                  >
                    View active tasks
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <Card className="bg-white shadow-sm border-none">
          <CardHeader className="">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span>Weekly Activity</span>
              </div>
              <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                This Week
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip />
                  <Bar dataKey="tasks" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card className="bg-white shadow-sm border-none">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-purple-600" />
                <span>Task Priority Distribution</span>
              </div>
              <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
                All Tasks
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {priorityChartData.map((entry: any, index: any) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-4 mt-4 justify-center">
              {priorityChartData.map((item: any, index: any) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-small text-gray-600">
                    {item.name} ({item.value})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card className="bg-white shadow-sm border-none">
        <CardHeader className="">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span>30-Day Task Completion Trend</span>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
              Last 30 Days
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.monthlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip />
                <Line
                  type="monotone"
                  dataKey="tasks"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Time-based Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TIME_STATS_DATA.map((timeStat) => (
          <Card
            key={timeStat.id}
            className={`bg-gradient-to-r ${timeStat.color} text-white shadow-lg border-none overflow-hidden`}
          >
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-white/80 text-small uppercase tracking-wide">{timeStat.label}</p>
                  <p className="text-2xl font-bold">
                    {stats[timeStat.key as keyof DashboardPageStats] as number} Tasks
                  </p>
                  <p className="text-white/80 text-small">{timeStat.subtitle}</p>
                </div>
                <div className={`${timeStat.iconBg} p-3  rounded-lg`}>
                  <timeStat.icon className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center space-x-1 text-white/70 relative z-10">
                <timeStat.footerIcon className="w-4 h-4" />
                <span className="text-xs">{timeStat.footerText}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default DashboardPage
