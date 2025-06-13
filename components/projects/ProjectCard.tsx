import { useEffect, useState } from "react"
import { Calendar, Users, MoreHorizontal, CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Project } from "@/lib/types"
import { getProgressColor, getProgressTextColor } from "@/lib/utils"
import Link from "next/link"

const ProjectCard = ({
  project,
  onEdit,
}: {
  project: Project
  onEdit: (project: Project) => void
}) => {
  const [stats, setStats] = useState({ progress: 0, teamMembers: 0, totalTasks: 0, completedTasks: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProjectStats()
  }, [project.id])

  const fetchProjectStats = async () => {
    try {
      const response = await fetch(`/api/projects/${project.id}/stats`)
      const data = await response.json()
      if (data.success) {
        setStats({
          progress: data.data.progress,
          teamMembers: data.data.teamMembers,
          totalTasks: data.data.totalTasks,
          completedTasks: data.data.completedTasks,
        })
      }
    } catch (error) {
      console.error("Failed to fetch project stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const progressColor = getProgressColor(stats.progress)
  const progressTextColor = getProgressTextColor(stats.progress)

  return (
    <Card className="bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
              {project.name}
            </CardTitle>
            <p className="text-description mt-1 line-clamp-2">{project.description}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onEdit(project)}
          >
            <MoreHorizontal size={16} />
          </Button>
        </div>
      </CardHeader>
      <Link href={`/projects/${project.id}`}>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-small text-gray-600">Progress</span>
                <span className={`text-small font-medium ${progressTextColor}`}>
                  {isLoading ? "..." : `${stats.progress}%`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`bg-gradient-to-r ${progressColor} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${stats.progress}%` }}
                />
              </div>
              
              {/* Task completion indicator */}
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <div className="flex items-center">
                  <CheckCircle size={12} className="mr-1 text-green-500" />
                  <span>{stats.completedTasks} completed</span>
                </div>
                <div>
                  <span>{stats.totalTasks} total tasks</span>
                </div>
              </div>
            </div>

            {/* Team and Dates */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 bg-gray-50 px-2 py-1 rounded-md">
                <Users size={14} className="text-blue-500" />
                <span className="text-small text-gray-600">
                  {isLoading ? "..." : `${stats.teamMembers} members`}
                </span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 px-2 py-1 rounded-md">
                <Calendar size={14} className="text-purple-500" />
                <span className="text-small text-gray-600">
                  {project.endDate ? new Date(project.endDate).toLocaleDateString() : "No deadline"}
                </span>
              </div>
            </div>

            {/* Status Badge and Team Members */}
            <div className="flex items-center justify-between">
              <Badge
                variant="secondary"
                className={
                  project.status === "active"
                    ? "bg-blue-100 text-blue-700"
                    : project.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }
              >
                {project.status === "active" ? "Active" : project.status === "completed" ? "Completed" : "Archived"}
              </Badge>
              
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  {Array.from({ length: Math.min(stats.teamMembers, 3) }).map((_, i) => (
                    <Avatar key={i} className="h-6 w-6 border-2 border-white">
                      <AvatarImage src={`/placeholder.svg?height=24&width=24&text=${i + 1}`} />
                      <AvatarFallback className="text-extra-small bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {String.fromCharCode(65 + i)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                {stats.teamMembers > 3 && (
                  <div className="h-6 w-6 bg-gray-100 border-2 border-white rounded-full flex items-center justify-center ml-1">
                    <span className="text-extra-small text-gray-600">+{stats.teamMembers - 3}</span>
                  </div>
                )}
                <Button variant="ghost" size="sm" className="ml-1 p-0 h-6 w-6 rounded-full">
                  <ArrowRight size={12} className="text-gray-400" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}

export default ProjectCard