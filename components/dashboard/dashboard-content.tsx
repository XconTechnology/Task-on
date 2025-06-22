"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/user-context";
import { dashboardApi, taskApi } from "@/lib/api";
import { Status,  type DashboardStats } from "@/lib/types";
import DashboardSkeleton from "./DashboardSkeleton";
import DashboardPage from "./DashboardPage";
interface TaskCompletionStats {
  todayCompletedTasks: number;
  weekCompletedTasks: number;
  monthCompletedTasks: number;
}
export default function DashboardContent() {
  const { user } = useUser();
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [tasksPage, setTasksPage] = useState(1);
  const [loadingMoreTasks, setLoadingMoreTasks] = useState(false);

  const [stats, setStats] = useState<TaskCompletionStats>();
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


        setStats({
          todayCompletedTasks: todayCompleted,
          weekCompletedTasks: weekCompleted,
          monthCompletedTasks: monthCompleted,
        });
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDashboardData = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setLoadingMoreTasks(true);
      }

      const response = await dashboardApi.getDashboardData(page, 10);
      if (response.success && response.data) {
        if (append && dashboardData) {
          // Append new tasks to existing data
          setDashboardData({
            ...response.data,
            todayTasks: [
              ...dashboardData.todayTasks,
              ...response.data.todayTasks,
            ],
          });
        } else {
          setDashboardData(response.data);
        }
        setTasksPage(page);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
      setLoadingMoreTasks(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchData()
  }, []);

  const handleLoadMoreTasks = () => {
    if (dashboardData?.hasMoreTasks && !loadingMoreTasks) {
      fetchDashboardData(tasksPage + 1, true);
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!dashboardData) {
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

  if (!user) {
    return <div>No user found</div>;
  }

  return (
    <DashboardPage
      user={user}
      taskStats={stats}
      dashboardData={dashboardData}
      onLoadMoreTasks={handleLoadMoreTasks}
      loadingMoreTasks={loadingMoreTasks}
    />
  );
}
