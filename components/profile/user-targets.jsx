"use client"

import { useState, useEffect } from "react"
import { Target, Calendar, TrendingUp, AlertCircle, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { targetApi } from "@/lib/api"
import { useFormState } from "react-dom"



export default function UserTargets({ userId, timeframe }) {
  const [targets, setTargets] = useState([])
  const [stats, setStats] = useFormState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [editingTarget, setEditingTarget] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [newCurrentValue, setNewCurrentValue] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  // Fetch user targets
  const fetchTargets = async () => {
    try {
      setIsLoading(true)
      const response = await targetApi.getUserTargets(userId, timeframe, statusFilter)
      if (response.success && response.data) {
        setTargets(response.data.targets)
        setStats(response.data.stats)
      }
    } catch (error) {
      console.error("Failed to fetch user targets:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load targets. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTargets()
  }, [userId, timeframe, statusFilter])

  // Handle target card click
  const handleTargetClick = (target) => {
    if (target.status !== "active") {
      toast({
        variant: "warning",
        title: "Cannot Update Target",
        description: `This target is ${target.status} and cannot be updated.`,
      })
      return
    }
    handleEditTarget(target)
  }

  // Handle edit target
  const handleEditTarget = (target) => {
    setEditingTarget(target)
    setNewCurrentValue(target.currentValue.toString())
    setIsEditModalOpen(true)
  }

  // Validate current value input
  const validateInput = (value, targetValue) => {
    const numValue = Number(value)

    if (isNaN(numValue) || value.trim() === "") {
      return { isValid: false, error: "Please enter a valid number" }
    }

    if (numValue < 0) {
      return { isValid: false, error: "Value cannot be negative" }
    }

    if (numValue > targetValue) {
      return { isValid: false, error: `Value cannot exceed target of ${targetValue.toLocaleString()}` }
    }

    return { isValid: true }
  }

  // Handle update progress
  const handleUpdateProgress = async () => {
    if (!editingTarget) return

    // Validate input before sending
    const validation = validateInput(newCurrentValue, editingTarget.targetValue)
    if (!validation.isValid) {
      toast({
        variant: "destructive",
        title: "Invalid Value",
        description: validation.error,
      })
      return
    }

    setIsUpdating(true)
    try {
      const response = await targetApi.updateUserTargetProgress(userId, editingTarget.id, Number(newCurrentValue))
      if (response.success && response.data) {
        // Update the target in the list
        setTargets((prev) => prev.map((target) => (target.id === editingTarget.id ? response.data : target)))
        setIsEditModalOpen(false)
        setEditingTarget(null)

        // Show appropriate success message
        const message = response.statusChanged
          ? `Progress updated! Status changed to ${response.newStatus}.`
          : "Progress updated successfully!"

        toast({
          variant: response.statusChanged ? "info" : "success",
          title: response.statusChanged ? "Status Updated" : "Progress Updated",
          description: message,
        })

        // Refresh stats
        fetchTargets()
      }
    } catch (error) {
      console.error("Failed to update target progress:", error)

      // Handle specific error messages from the API
      const errorMessage = error.response?.data?.error || "Failed to update target progress. Please try again."

      toast({
        variant: "destructive",
        title: "Update Failed",
        description: errorMessage,
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle input change with real-time validation
  const handleInputChange = (value) => {
    setNewCurrentValue(value)
  }

  // Get input validation state for styling
  const getInputValidation = () => {
    if (!editingTarget || !newCurrentValue) return { isValid: true, error: "" }
    return validateInput(newCurrentValue, editingTarget.targetValue)
  }

  // Get status color and icon
  const getStatusConfig = (status) => {
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

  // Get card styling based on status
  const getCardStyling = (status) => {
    if (status === "active") {
      return {
        cardClass:
          "border-0 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-200 bg-white cursor-pointer transform hover:scale-[1.02]",
        contentClass: "text-gray-900",
        interactive: true,
      }
    } else {
      return {
        cardClass: "border-0 shadow-sm bg-gray-50 opacity-75 cursor-not-allowed",
        contentClass: "text-gray-500",
        interactive: false,
      }
    }
  }

  // Calculate progress percentage
  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100)
  }

  // Check if target is overdue
  const isOverdue = (deadline, status) => {
    return new Date(deadline) < new Date() && status === "active"
  }

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Get days remaining
  const getDaysRemaining = (deadline) => {
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

  const inputValidation = getInputValidation()

  return (
    <>
      <div className="space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalTargets}</p>
                  </div>
                  <Target className="h-8 w-8 text-gray-400" />
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
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Success Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">My Targets</h3>
            <p className="text-sm text-gray-600">Click on active targets to update progress</p>
          </div>
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

        {/* Targets List */}
        <div className="space-y-3">
          {targets.length === 0 ? (
            <div className="text-center py-12">
              <Target size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No targets assigned</h3>
              <p className="text-gray-600">You don&apos;t have any targets assigned for the selected timeframe.</p>
            </div>
          ) : (
            targets.map((target) => {
              const statusConfig = getStatusConfig(target.status)
              const StatusIcon = statusConfig.icon
              const progressPercentage = getProgressPercentage(target.currentValue, target.targetValue)
              const daysRemaining = getDaysRemaining(target.deadline)
              const overdue = isOverdue(target.deadline, target.status)
              const cardStyling = getCardStyling(target.status)

              return (
                <Card key={target.id} className={cardStyling.cardClass} onClick={() => handleTargetClick(target)}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`font-semibold text-lg ${cardStyling.contentClass}`}>{target.title}</h3>
                          <Badge className={`${statusConfig.color} border text-xs font-medium px-2 py-1`}>
                            <StatusIcon size={12} className="mr-1" />
                            {target.status}
                          </Badge>
                          {overdue && (
                            <Badge className="bg-red-50 text-red-700 border-red-200 text-xs font-medium px-2 py-1">
                              <AlertCircle size={12} className="mr-1" />
                              Overdue
                            </Badge>
                          )}
                        </div>
                        <p className={`text-sm mb-4 ${cardStyling.contentClass}`}>{target.description}</p>
                      </div>
                      {target.status === "active" && (
                        <div className="ml-4 text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
                          Click to update
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <div>
                          <p className={`text-sm font-medium ${cardStyling.contentClass}`}>
                            {formatDate(target.deadline)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {daysRemaining > 0 ? `${daysRemaining} days left` : overdue ? "Overdue" : "Due today"}
                          </p>
                        </div>
                      </div>

                      {target.project && (
                        <div className="flex items-center gap-2">
                          <Target size={16} className="text-gray-400" />
                          <div>
                            <p className={`text-sm font-medium ${cardStyling.contentClass}`}>{target.project.name}</p>
                            <p className="text-xs text-gray-500">Project</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-medium ${cardStyling.contentClass}`}>
                          {target.currentValue.toLocaleString()} / {target.targetValue.toLocaleString()} {target.unit}
                        </span>
                        <span className={`text-sm font-semibold ${cardStyling.contentClass}`}>
                          {Math.round(progressPercentage)}%
                        </span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* Update Progress Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Update Progress</DialogTitle>
          </DialogHeader>
          {editingTarget && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{editingTarget.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{editingTarget.description}</p>
              </div>

              <div>
                <Label htmlFor="currentValue">Current Progress</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="currentValue"
                    type="number"
                    value={newCurrentValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="Enter current value"
                    min="0"
                    max={editingTarget.targetValue}
                    className={`${!inputValidation.isValid ? "border-red-500 focus:border-red-500" : ""}`}
                  />
                  <span className="text-sm text-gray-500">
                    / {editingTarget.targetValue} {editingTarget.unit}
                  </span>
                </div>
                {!inputValidation.isValid && <p className="text-sm text-red-600 mt-1">{inputValidation.error}</p>}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateProgress}
                  disabled={isUpdating || !newCurrentValue || !inputValidation.isValid}
                >
                  {isUpdating ? "Updating..." : "Update Progress"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
