import type { DailyAttendance, MonthlyAttendance, ApiResponse, UserMonthlyAttendance } from "./types"
import { apiCall } from "./api_call"

export const attendanceApi = {
  // Calculate daily attendance (run at end of day)
  calculateDailyAttendance: async (date?: string): Promise<ApiResponse<DailyAttendance>> => {
    const endpoint = `/attendance/calculate${date ? `?date=${date}` : ""}`
    return apiCall<DailyAttendance>(endpoint, {
      method: "POST",
    })
  },

  // Get daily attendance
  getDailyAttendance: async (date?: string): Promise<ApiResponse<DailyAttendance>> => {
    const endpoint = `/attendance/daily${date ? `?date=${date}` : ""}`
    return apiCall<DailyAttendance>(endpoint)
  },

  // Get monthly attendance
  getMonthlyAttendance: async (month?: string): Promise<ApiResponse<MonthlyAttendance>> => {
    const endpoint = `/attendance/monthly${month ? `?month=${month}` : ""}`
    return apiCall<MonthlyAttendance>(endpoint)
  },



  // Get attendance summary for date range
  getAttendanceSummary: async (startDate: string, endDate: string): Promise<ApiResponse<any>> => {
    return apiCall(`/attendance/summary?startDate=${startDate}&endDate=${endDate}`)
  },
  // Get user's monthly attendance
  getUserMonthlyAttendance: async (userId: string, month: string): Promise<ApiResponse<UserMonthlyAttendance>> => {
    return apiCall<UserMonthlyAttendance>(`/attendance/user/${userId}/monthly?month=${month}`)
  },

  // Get user's attendance stats for multiple months
  getUserAttendanceStats: async (
    userId: string,
    months = 6,
  ): Promise<
    ApiResponse<{
      monthlyStats: Array<{
        month: string
        attendanceRate: number
        presentDays: number
        totalDays: number
      }>
      overallStats: {
        averageAttendanceRate: number
        totalPresentDays: number
        totalWorkingDays: number
      }
    }>
  > => {
    return apiCall(`/attendance/user/${userId}/stats?months=${months}`)
  },

  // Calculate user attendance for a specific month
  calculateUserMonthlyAttendance: async (userId: string, month: string): Promise<ApiResponse<void>> => {
    return apiCall(`/attendance/user/${userId}/calculate`, {
      method: "POST",
      body: JSON.stringify({ month }),
    })
  },
}
