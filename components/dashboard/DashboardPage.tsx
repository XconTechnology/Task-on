import { TrendingUp, Target, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
} from "@/components/ui/chart";
import { MAIN_STATS_DATA, TIME_STATS_DATA } from "@/lib/constants";

import React from "react";
import { DashboardPageStats } from "@/lib/types";
import Image from "next/image";

const DashboardPage = ({
  user,
  stats,
  motivationalMessage,
  priorityChartData,
}) => {
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="header-large">Dashboard</h1>
          <p className="text-description mt-1">
            Welcome back, {user?.username}! Here&apos;s what&apos;s happening
            with your projects.
          </p>
        </div>
        <div className="text-right">
          <p className="text-muted-small">Last updated</p>
          <p className="text-medium font-medium">
            {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Stats Cards Grid - Including Congratulations Box */}
      {/* Stats Cards Grid - 12 Column Layout */}
      <div className="grid grid-cols-14 gap-6">
        {/* Congratulations Box */}
        <Card className="col-span-12 md:col-span-5 bg-white shadow-sm hover:shadow-md transition-shadow border-none relative overflow-hidden">
          <CardContent className="p-0">
            <div
              className={`bg-gradient-to-br ${motivationalMessage.color} p-6 text-white relative`}
            >
              <div className="absolute top-2 right-2">
                <Badge className="bg-white/20 text-white text-xs">
                  Top Performer
                </Badge>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <motivationalMessage.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {motivationalMessage.title.split("!")[0]}
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stats.todayCompletedTasks} Tasks
                  </p>
                  <p className="text-white/80 text-sm">
                    {motivationalMessage.percentage.toFixed(0)}% of daily target
                  </p>
                </div>
                <Progress
                  value={motivationalMessage.percentage}
                  className="h-2 bg-white/20"
                  indicatorClassName="bg-white"
                />
                <Button
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white text-xs"
                >
                  View Details
                </Button>
              </div>
              {/* Gift icon */}
              <div className="absolute bottom-2 right-2 text-2xl ">
                <Image  src={motivationalMessage.giftIcon} alt='gift' width={80} height={80}/>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Stats Cards - Each takes 6 cols on md, 4 on lg */}
        {MAIN_STATS_DATA.map((stat) => (
          <Card
            key={stat.id}
            className="col-span-13  md:col-span-4 lg:col-span-3 bg-white shadow-sm hover:shadow-md transition-shadow border-none"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-small uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stats[stat.key as keyof DashboardPageStats] as number}
                    {stat.showPercentage && `%`}
                  </p>
                  <div className="flex items-center mt-2">
                    <stat.subtextIcon
                      className="w-4 h-4 mr-1"
                      style={{ color: stat.subtextColor.replace("text-", "") }}
                    />
                    <span className={`text-small ${stat.subtextColor}`}>
                      {stat.showPercentage ? `${stats.completionRate}% ` : ""}
                      {stat.subtext}
                    </span>
                  </div>
                </div>
                <div
                  className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}
                >
                  <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
              <Badge
                variant="outline"
                className="text-blue-600 border-blue-200 bg-blue-50"
              >
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
              <Badge
                variant="outline"
                className="text-purple-600 border-purple-200 bg-purple-50"
              >
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
                    {priorityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-4 mt-4 justify-center">
              {priorityChartData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
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
            <Badge
              variant="outline"
              className="text-green-600 border-green-200 bg-green-50"
            >
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
                  <p className="text-white/80 text-small uppercase tracking-wide">
                    {timeStat.label}
                  </p>
                  <p className="text-2xl font-bold">
                    {stats[timeStat.key as keyof DashboardPageStats] as number}{" "}
                    Tasks
                  </p>
                  <p className="text-white/80 text-small">
                    {timeStat.subtitle}
                  </p>
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
  );
};

export default DashboardPage;
