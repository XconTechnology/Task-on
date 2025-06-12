"use client";
import { useEffect, useState } from "react";
import { useUser } from "@/lib/user-context";
import { Trophy, Star, Rocket, Diamond } from "lucide-react";

import { DashboardPageStats, Priority, Status } from "@/lib/types";
import DashboardSkeleton from "./DashboardSkeleton";
import { generateMonthlyActivity, generateWeeklyActivity } from "@/lib/utils";
import DashboardPage from "./DashboardPage";
import { taskApi } from "@/lib/api";

export default function DashboardContent() {
  const { user } = useUser();
  const [stats, setStats] = useState<DashboardPageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await taskApi.getALLTasks();
        if (response.success && response.data) {
          const allTasks = response.data || [];

          // Calculate time-based stats using correct Status enum
          const now = new Date();
          const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1); // Start of month

          const todayCompleted = allTasks.filter((task: any) => {
            const taskDate = new Date(task.updatedAt);
            return task.status === Status.Completed && taskDate >= today;
          }).length;

          const weekCompleted = allTasks.filter((task: any) => {
            const taskDate = new Date(task.updatedAt);
            return task.status === Status.Completed && taskDate >= weekStart;
          }).length;

          const monthCompleted = allTasks.filter((task: any) => {
            const taskDate = new Date(task.updatedAt);
            return task.status === Status.Completed && taskDate >= monthStart;
          }).length;

          // Calculate basic stats
          const totalTasks = allTasks.length;
          const completedTasks = allTasks.filter(
            (task: any) => task.status === Status.Completed
          ).length;
          const inProgressTasks = allTasks.filter(
            (task: any) => task.status === Status.WorkInProgress
          ).length;
          const todoTasks = allTasks.filter(
            (task: any) => task.status === Status.ToDo
          ).length;
          const completionRate =
            totalTasks > 0
              ? Math.round((completedTasks / totalTasks) * 100)
              : 0;
          const todayCompletionRate =
            totalTasks > 0
              ? Math.round((todayCompleted / totalTasks) * 100)
              : 0;
          // Calculate priority stats
          const priorityStats = {
            urgent: allTasks.filter(
              (task: any) => task.priority === Priority.Urgent
            ).length,
            high: allTasks.filter(
              (task: any) => task.priority === Priority.High
            ).length,
            medium: allTasks.filter(
              (task: any) => task.priority === Priority.Medium
            ).length,
            low: allTasks.filter((task: any) => task.priority === Priority.Low)
              .length,
            backlog: allTasks.filter(
              (task: any) => task.priority === Priority.Backlog
            ).length,
          };

          // Generate weekly activity
          const weeklyActivity = generateWeeklyActivity(allTasks);
          const monthlyActivity = generateMonthlyActivity(allTasks);

          setStats({
            totalTasks,
            completedTasks,
            inProgressTasks,
            todoTasks,
            todayCompletedTasks: todayCompleted,
            weekCompletedTasks: weekCompleted,
            monthCompletedTasks: monthCompleted,
            projectsCount: new Set(allTasks.map((task: any) => task.projectId))
              .size,
            completionRate,
            weeklyActivity,
            monthlyActivity,
            priorityStats,
            todayCompletionRate
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="header-medium mb-2">Welcome to ProjectFlow!</h2>
          <p className="text-description">
            Start by creating your first project to see your dashboard
            analytics.
          </p>
        </div>
      </div>
    );
  }

  // Motivational message based on today's performance
  const getMotivationalMessage = () => {
    if (stats.todayCompletedTasks >= 5) {
      return {
        type: "celebration",
        title: "Congratulations! 🎉",
        message: `Amazing work! You've completed ${stats.todayCompletedTasks} tasks today. You're on fire!`,
        icon: Trophy,
        giftIcon: "/gift.png",
        color: "from-green-500 to-emerald-600",
        percentage: Math.min((stats.todayCompletedTasks / 10) * 100, 100),
      };
    } else if (stats.todayCompletedTasks >= 3) {
      return {
        type: "good",
        title: "Great Progress! 👏",
        message: `You've completed ${stats.todayCompletedTasks} tasks today. Keep up the excellent work!`,
        icon: Star,
        giftIcon: "/good_progress.gif",
        color: "from-blue-500 to-cyan-600",
        percentage: Math.min((stats.todayCompletedTasks / 10) * 100, 100),
      };
    } else if (stats.todayCompletedTasks >= 1) {
      return {
        type: "encouraging",
        title: "Good Start! 💪",
        message: `You've completed ${stats.todayCompletedTasks} task${
          stats.todayCompletedTasks > 1 ? "s" : ""
        } today. Every step counts!`,
        icon: Rocket,
        giftIcon: "/gift.png",
        color: "from-purple-500 to-pink-600",
        percentage: Math.min((stats.todayCompletedTasks / 10) * 100, 100),
      };
    } else {
      return {
        type: "motivational",
        title: "Ready to Conquer? ⚡",
        message:
          "Today is full of possibilities! Start with one task and build momentum.",
        icon: Diamond,
        giftIcon: "/gift.png",
        color: "from-orange-500 to-red-600",
        percentage: 0,
      };
    }
  };

  const motivationalMessage = getMotivationalMessage();

  // Prepare chart data with correct colors
  const priorityChartData = [
    { name: "Urgent", value: stats.priorityStats.urgent, color: "#ef4444" },
    { name: "High", value: stats.priorityStats.high, color: "#f97316" },
    { name: "Medium", value: stats.priorityStats.medium, color: "#eab308" },
    { name: "Low", value: stats.priorityStats.low, color: "#22c55e" },
    { name: "Backlog", value: stats.priorityStats.backlog, color: "#6b7280" },
  ].filter((item) => item.value > 0);

  if (!user) {
    return <div>no user</div>;
  }
  return (
    <div>
      <DashboardPage
        user={user}
        stats={stats}
        motivationalMessage={motivationalMessage}
        priorityChartData={priorityChartData}
      />
    </div>
  );
}
