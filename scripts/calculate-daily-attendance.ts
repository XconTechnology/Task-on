import { apiCall } from "@/lib/api_call"
import type { AttendanceRecord, DailyAttendance, MonthlyAttendance, AttendanceStats, ApiResponse } from "@/lib/types"

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

  // Get user attendance stats
  getUserAttendance: async (
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ApiResponse<{ user: any; records: AttendanceRecord[]; stats: AttendanceStats }>> => {
    let endpoint = `/attendance/user/${userId}`
    const params = new URLSearchParams()
    if (startDate) params.append("startDate", startDate)
    if (endDate) params.append("endDate", endDate)
    if (params.toString()) endpoint += `?${params.toString()}`

    return apiCall(endpoint)
  },

  // Get attendance summary for date range
  getAttendanceSummary: async (startDate: string, endDate: string): Promise<ApiResponse<any>> => {
    return apiCall(`/attendance/summary?startDate=${startDate}&endDate=${endDate}`)
  },
}
