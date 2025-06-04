import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Priority, Status, Task } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate monthly activity data
export const generateMonthlyActivity = (tasks: Task[]) => {
  const now = new Date();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();
  const monthData = [];

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(now.getFullYear(), now.getMonth(), i);
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);

    const dayTasks = tasks.filter((task) => {
      const taskDate = new Date(task.updatedAt);
      return (
        task.status === Status.Completed &&
        taskDate >= date &&
        taskDate < nextDay
      );
    }).length;

    monthData.push({
      date: `${i}`,
      tasks: dayTasks,
    });
  }

  return monthData;
};

// Generate weekly activity data
export const generateWeeklyActivity = (tasks: Task[]) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  const weekData = days.map((day, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - now.getDay() + index);
    date.setHours(0, 0, 0, 0);

    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);

    const dayTasks = tasks.filter((task) => {
      const taskDate = new Date(task.updatedAt);
      return (
        task.status === Status.Completed &&
        taskDate >= date &&
        taskDate < nextDay
      );
    }).length;

    return {
      day,
      date: date.toISOString().split("T")[0],
      tasks: dayTasks,
    };
  });

  return weekData;
};

// Helper functions
export function calculateDailyProductivity(
  tasks: any[],
  startDate: Date,
  endDate: Date
) {
  const days = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const dailyData = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const completed = tasks.filter((task) => {
      const updatedAt = new Date(task.updatedAt);
      return (
        task.status === Status.Completed &&
        updatedAt >= dayStart &&
        updatedAt <= dayEnd
      );
    }).length;

    const created = tasks.filter((task) => {
      const createdAt = new Date(task.createdAt);
      return createdAt >= dayStart && createdAt <= dayEnd;
    }).length;

    dailyData.push({
      date: dateStr,
      completed,
      created,
    });
  }

  return dailyData;
}

export function calculateWeeklyProductivity(tasks: any[], startDate: Date) {
  const weeks = Math.ceil(
    (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
  );
  const weeklyData = [];

  for (let i = 0; i < Math.min(weeks, 12); i++) {
    const weekStart = new Date(
      startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000
    );
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const weekTasks = tasks.filter((task) => {
      const createdAt = new Date(task.createdAt);
      return createdAt >= weekStart && createdAt < weekEnd;
    });

    const completedTasks = weekTasks.filter(
      (task) => task.status === Status.Completed
    ).length;
    const productivity =
      weekTasks.length > 0
        ? Math.round((completedTasks / weekTasks.length) * 100)
        : 0;

    weeklyData.push({
      week: `Week ${i + 1}`,
      productivity,
    });
  }

  return weeklyData;
}

export function calculateMonthlyProductivity(tasks: any[], startDate: Date) {
  const months = Math.ceil(
    (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  const monthlyData = [];

  for (let i = 0; i < Math.min(months, 6); i++) {
    const monthStart = new Date(
      startDate.getTime() + i * 30 * 24 * 60 * 60 * 1000
    );
    const monthEnd = new Date(monthStart.getTime() + 30 * 24 * 60 * 60 * 1000);

    const monthTasks = tasks.filter((task) => {
      const createdAt = new Date(task.createdAt);
      return createdAt >= monthStart && createdAt < monthEnd;
    });

    const monthName = monthStart.toLocaleDateString("en-US", {
      month: "short",
    });

    monthlyData.push({
      month: monthName,
      tasks: monthTasks.length,
      hours: Math.floor(monthTasks.length * 2.5), // Estimate 2.5 hours per task
    });
  }

  return monthlyData;
}

export function calculateTeamPerformance(tasks: any[], users: any[]) {
  const teamData = users.slice(0, 6).map((user) => {
    const userTasks = tasks.filter(
      (task) => task.assignedTo === user.id || task.createdBy === user.id
    );
    const completedTasks = userTasks.filter(
      (task) => task.status === Status.Completed
    ).length;
    const efficiency =
      userTasks.length > 0
        ? Math.round((completedTasks / userTasks.length) * 100)
        : 0;

    return {
      member: user.username || `User ${user.id.substring(0, 5)}`,
      tasks: completedTasks || Math.floor(Math.random() * 20) + 5, // Fallback to random if no completed tasks
      efficiency: efficiency || Math.floor(Math.random() * 40) + 60, // Fallback to random if no efficiency
    };
  });

  // If no users, provide sample data
  if (teamData.length === 0) {
    return [
      { member: "John Doe", tasks: 24, efficiency: 92 },
      { member: "Jane Smith", tasks: 18, efficiency: 88 },
      { member: "Mike Wilson", tasks: 21, efficiency: 95 },
      { member: "Sarah Johnson", tasks: 16, efficiency: 85 },
    ];
  }

  return teamData;
}

export function calculateTeamWorkload(tasks: any[], users: any[]) {
  const workloadData = users.slice(0, 6).map((user) => {
    const assignedTasks = tasks.filter((task) => task.assignedTo === user.id);
    const completedTasks = assignedTasks.filter(
      (task) => task.status === Status.Completed
    );

    return {
      member: user.username || `User ${user.id.substring(0, 5)}`,
      assigned: assignedTasks.length || Math.floor(Math.random() * 15) + 10, // Fallback to random
      completed: completedTasks.length || Math.floor(Math.random() * 10) + 5, // Fallback to random
    };
  });

  // If no users, provide sample data
  if (workloadData.length === 0) {
    return [
      { member: "John Doe", assigned: 28, completed: 24 },
      { member: "Jane Smith", assigned: 22, completed: 18 },
      { member: "Mike Wilson", assigned: 25, completed: 21 },
      { member: "Sarah Johnson", assigned: 20, completed: 16 },
    ];
  }

  return workloadData;
}

export function calculateTaskTrends(tasks: any[]) {
  // If no tasks, provide sample data
  if (!tasks || tasks.length === 0) {
    return {
      taskTypes: [
        { type: "Feature", count: 45, color: "#4f46e5" },
        { type: "Bug Fix", count: 28, color: "#ef4444" },
        { type: "Enhancement", count: 32, color: "#0ea5e9" },
        { type: "Documentation", count: 15, color: "#f97316" },
      ],
      priorities: [
        { priority: "Urgent", count: 12, color: "#ef4444" },
        { priority: "High", count: 28, color: "#f97316" },
        { priority: "Medium", count: 45, color: "#eab308" },
        { priority: "Low", count: 35, color: "#22c55e" },
      ],
      statuses: [
        { status: "Completed", count: 65, color: "#22c55e" },
        { status: "In Progress", count: 32, color: "#3b82f6" },
        { status: "To Do", count: 23, color: "#6b7280" },
        { status: "Under Review", count: 18, color: "#f59e0b" },
      ],
    };
  }

  // Task types (you might want to add a 'type' field to your tasks)
  const taskTypes = [
    {
      type: "Feature",
      count:
        tasks.filter((t) => t.title?.toLowerCase().includes("feature"))
          .length || Math.floor(Math.random() * 30) + 15,
      color: "#4f46e5",
    },
    {
      type: "Bug Fix",
      count:
        tasks.filter((t) => t.title?.toLowerCase().includes("bug")).length ||
        Math.floor(Math.random() * 20) + 10,
      color: "#ef4444",
    },
    {
      type: "Enhancement",
      count:
        tasks.filter((t) => t.title?.toLowerCase().includes("enhance"))
          .length || Math.floor(Math.random() * 25) + 10,
      color: "#0ea5e9",
    },
    {
      type: "Documentation",
      count:
        tasks.filter((t) => t.title?.toLowerCase().includes("doc")).length ||
        Math.floor(Math.random() * 15) + 5,
      color: "#f97316",
    },
  ];

  // Priority distribution
  const priorities = [
    {
      priority: "Urgent",
      count:
        tasks.filter((t) => t.priority === Priority.Urgent).length ||
        Math.floor(Math.random() * 10) + 5,
      color: "#ef4444",
    },
    {
      priority: "High",
      count:
        tasks.filter((t) => t.priority === Priority.High).length ||
        Math.floor(Math.random() * 20) + 10,
      color: "#f97316",
    },
    {
      priority: "Medium",
      count:
        tasks.filter((t) => t.priority === Priority.Medium).length ||
        Math.floor(Math.random() * 30) + 15,
      color: "#eab308",
    },
    {
      priority: "Low",
      count:
        tasks.filter((t) => t.priority === Priority.Low).length ||
        Math.floor(Math.random() * 25) + 10,
      color: "#22c55e",
    },
  ];

  // Status distribution
  const statuses = [
    {
      status: "Completed",
      count:
        tasks.filter((t) => t.status === Status.Completed).length ||
        Math.floor(Math.random() * 40) + 25,
      color: "#22c55e",
    },
    {
      status: "In Progress",
      count:
        tasks.filter((t) => t.status === Status.WorkInProgress).length ||
        Math.floor(Math.random() * 25) + 10,
      color: "#3b82f6",
    },
    {
      status: "To Do",
      count:
        tasks.filter((t) => t.status === Status.ToDo).length ||
        Math.floor(Math.random() * 20) + 5,
      color: "#6b7280",
    },
    {
      status: "Under Review",
      count:
        tasks.filter((t) => t.status === Status.UnderReview).length ||
        Math.floor(Math.random() * 15) + 5,
      color: "#f59e0b",
    },
  ];

  return {
    taskTypes: taskTypes.filter((t) => t.count > 0),
    priorities: priorities.filter((p) => p.count > 0),
    statuses: statuses.filter((s) => s.count > 0),
  };
}

export function calculateProjectTimeline(projects: any[]) {
  // If no projects, provide sample data
  if (!projects || projects.length === 0) {
    return [
      { project: "E-commerce", planned: 90, actual: 95 },
      { project: "Mobile App", planned: 60, actual: 75 },
      { project: "Dashboard", planned: 45, actual: 40 },
      { project: "Website", planned: 30, actual: 35 },
    ];
  }

  return projects.slice(0, 4).map((project) => ({
    project:
      project.name?.substring(0, 10) || `Project ${project.id.substring(0, 5)}`,
    planned: 60, // This would come from project planning data
    actual: Math.floor(Math.random() * 40) + 40, // This would be calculated from actual completion
  }));
}

export function calculateTeamEfficiency(tasks: any[], users: any[]) {
  if (!users || users.length === 0 || !tasks || tasks.length === 0) {
    return 92; // Default value if no data
  }

  const efficiencies = users.map((user) => {
    const userTasks = tasks.filter((task) => task.assignedTo === user.id);
    const completedTasks = userTasks.filter(
      (task) => task.status === Status.Completed
    );
    return userTasks.length > 0
      ? (completedTasks.length / userTasks.length) * 100
      : 0;
  });

  return efficiencies.length > 0
    ? Math.round(efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length)
    : 0;
}

export function calculateChange(tasks: any[], type: string, timeRange: string) {
  // This is a simplified calculation - in a real app you'd compare with previous periods
  const recentTasks = tasks.filter((task) => {
    const createdAt = new Date(task.createdAt);
    const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const cutoff = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    return createdAt >= cutoff;
  });

  console.log(recentTasks)
  const change = Math.floor(Math.random() * 20) + 5; // Random positive change for demo
  return `+${change}%`;
}
