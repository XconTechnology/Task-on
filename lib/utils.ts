import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Status, Task } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

  // Generate monthly activity data
  export const generateMonthlyActivity = (tasks: Task[]) => {
    const now = new Date()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const monthData = []

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(now.getFullYear(), now.getMonth(), i)
      date.setHours(0, 0, 0, 0)
      const nextDay = new Date(date)
      nextDay.setDate(date.getDate() + 1)

      const dayTasks = tasks.filter((task) => {
        const taskDate = new Date(task.updatedAt)
        return task.status === Status.Completed && taskDate >= date && taskDate < nextDay
      }).length

      monthData.push({
        date: `${i}`,
        tasks: dayTasks,
      })
    }

    return monthData
  }

   // Generate weekly activity data
  export   const generateWeeklyActivity = (tasks: Task[]) => {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      const now = new Date()
      const weekData = days.map((day, index) => {
        const date = new Date(now)
        date.setDate(now.getDate() - now.getDay() + index)
        date.setHours(0, 0, 0, 0)
  
        const nextDay = new Date(date)
        nextDay.setDate(date.getDate() + 1)
  
        const dayTasks = tasks.filter((task) => {
          const taskDate = new Date(task.updatedAt)
          return task.status === Status.Completed && taskDate >= date && taskDate < nextDay
        }).length
  
        return {
          day,
          date: date.toISOString().split("T")[0],
          tasks: dayTasks,
        }
      })
  
      return weekData
    }