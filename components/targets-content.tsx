"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Plus, Search, Filter, TargetIcon, Calendar, TrendingUp, AlertCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import CreateTargetModal from "@/components/modals/create-target-modal"
import EditTargetModal from "@/components/modals/edit-target-modal"
import type { Target, TargetStats } from "@/lib/types"
import { targetApi } from "@/lib/api"

export default function TargetsContent() {
  const [allTargets, setAllTargets] = useState<Target[]>([]) // Store all targets
  const [stats, setStats] = useState<TargetStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingTarget, setEditingTarget] = useState<Target | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Filtered targets using useMemo for performance
  const filteredTargets = useMemo(() => {
    let filtered = allTargets

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((target) => target.status === statusFilter)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (target) =>
          target.title.toLowerCase().includes(query) ||
          target.description.toLowerCase().includes(query) ||
          target.assignee?.username.toLowerCase().includes(query) ||
          target.assignee?.email.toLowerCase().includes(query) ||
          target.project?.name.toLowerCase().includes(query),
      )
    }

    return filtered
  }, [allTargets, statusFilter, searchQuery])

  // Fetch all targets (we'll do client-side filtering for smooth UX)
  const fetchAllTargets = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await targetApi.getTargets(1, 100) // Get more targets at once
      if (response.success && response.data) {
        setAllTargets(response.data.targets)
        setHasMore(response.data.hasMore)
      }
    } catch (error) {
      console.error("Failed to fetch targets:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load more targets
  const loadMoreTargets = async () => {
    if (!hasMore || isLoadingMore) return

    try {
      setIsLoadingMore(true)
      const response = await targetApi.getTargets(page + 1, 50)
      if (response.success && response.data) {
        const { targets, hasMore } = response.data
        setAllTargets((prev) => [...prev, ...targets])
        setHasMore(hasMore)
        setPage(page + 1)
      }
    } catch (error) {
      console.error("Failed to load more targets:", error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Fetch target stats
  const fetchStats = async () => {
    try {
      const response = await targetApi.getTargetStats()
      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch target stats:", error)
    }
  }

  // Initial load
  useEffect(() => {
    fetchAllTargets()
    fetchStats()
  }, [fetchAllTargets])

  // Handle target created
  const handleTargetCreated = (newTarget: Target) => {
    setAllTargets((prev) => [newTarget, ...prev])
    fetchStats()
  }

  // Handle target updated
  const handleTargetUpdated = (updatedTarget: Target) => {
    setAllTargets((prev) => prev.map((target) => (target.id === updatedTarget.id ? updatedTarget : target)))
    fetchStats()
  }

  // Handle target deleted
  const handleTargetDeleted = (targetId: string) => {
    setAllTargets((prev) => prev.filter((target) => target.id !== targetId))
    fetchStats()
  }

  // Handle edit target
  const handleEditTarget = (target: Target) => {
    setEditingTarget(target)
    setIsEditModalOpen(true)
  }

  // Get status color and icon
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return { color: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock }
      case "completed":
        return { color: "bg-green-50 text-green-700 border-green-200", icon: TrendingUp }
      case "failed":
        return { color: "bg-red-50 text-red-700 border-red-200", icon: AlertCircle }
      case "cancelled":
        return { color: "bg-gray-50 text-gray-700 border-gray-200", icon: AlertCircle }
      default:
        return { color: "bg-gray-50 text-gray-700 border-gray-200", icon: Clock }
    }
  }

  // Calculate progress percentage
  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Get days remaining (for active targets only)
  const getDaysRemaining = (deadline: string) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Targets</h1>
            <p className="text-sm text-gray-600 mt-1">Set and track performance targets for team members</p>
          </div>
          <Button
            className="bg-primary hover:bg-bg_hovered text-white shadow-sm"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={16} className="mr-2" />
            New Target
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalTargets}</p>
                  </div>
                  <TargetIcon className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Active</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.activeTargets}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completedTargets}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Failed</p>
                    <p className="text-2xl font-bold text-red-600">{stats.failedTargets}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Success Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg shadow-sm border-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search targets, members, or projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 border-gray-200">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

       {filteredTargets.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <TargetIcon size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery || statusFilter !== "all" ? "No targets found" : "No targets yet"}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Create your first target to get started"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsCreateModalOpen(true)}>
                  <Plus size={16} className="mr-2" />
                  Create Target
                </Button>
              )}
            </div>
          )}
        {/* Targets List */}
        <div className="gap-3 grid grid-cols-3">
          {filteredTargets.map((target) => {
            const statusConfig = getStatusConfig(target.status)
            const StatusIcon = statusConfig.icon
            const progressPercentage = getProgressPercentage(target.currentValue, target.targetValue)
            const daysRemaining = getDaysRemaining(target.deadline)

            return (
              <Card
                key={target.id}
                className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer bg-white"
                onClick={() => handleEditTarget(target)}
              >
                <CardContent className="p-5">
                  <div className="w-full mb-3">
                    <Badge className={`${statusConfig.color} border text-xs font-medium px-2 py-1`}>
                      <StatusIcon size={12} className="mr-1" />
                      {target.status}
                    </Badge>
                  </div>

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 text-base">{target.title}</h3>
                      </div>
                      <p className="text-description text-gray-600 mb-4 line-clamp-2">{target.description}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-medium font-medium text-gray-900">
                        {target.currentValue.toLocaleString()} / {target.targetValue.toLocaleString()} {target.unit}
                      </span>
                      <span className="text-medium font-semibold text-gray-900">{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-[0.35rem]" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 mt-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {target.assignee?.profilePictureUrl ? (
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={target.assignee.profilePictureUrl || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">
                              {target.assignee.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-700">
                              {target.assignee?.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-medium font-medium text-gray-900">{target.assignee?.username}</p>
                          <p className="text-small text-gray-500">Assignee</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      <div>
                        <p className="text-medium font-medium text-gray-900">{formatDate(target.deadline)}</p>
                        <p className="text-small text-gray-500">
                          {target.status === "active"
                            ? daysRemaining > 0
                              ? `${daysRemaining} days left`
                              : "Due today"
                            : target.status === "completed"
                              ? "Completed"
                              : target.status === "failed"
                                ? "Failed"
                                : "Cancelled"}
                        </p>
                      </div>
                    </div>

                    {target.project && (
                      <div className="flex items-center gap-2">
                        <TargetIcon size={16} className="text-gray-400" />
                        <div>
                          <p className="text-medium font-medium text-gray-900">{target.project.name}</p>
                          <p className="text-small text-gray-500">Project</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}

         

          {/* Load More Button */}
          {hasMore && filteredTargets.length > 0 && searchQuery === "" && statusFilter === "all" && (
            <div className="text-center py-4">
              <Button variant="outline" onClick={loadMoreTargets} disabled={isLoadingMore}>
                {isLoadingMore ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </div>
      </div>

      <CreateTargetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleTargetCreated}
      />
      <EditTargetModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        target={editingTarget}
        onSuccess={handleTargetUpdated}
        onDelete={handleTargetDeleted}
      />
    </>
  )
}
