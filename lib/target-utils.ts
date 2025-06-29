// Enhanced utility functions for target status management

export interface TargetStatusUpdate {
  id: string
  currentStatus: string
  newStatus: string
  reason: string
}

/**
 * Determines the correct status for a target based on current conditions
 * This function will automatically mark targets as "failed" when deadline passes
 */
export function calculateTargetStatus(
  currentValue: number,
  targetValue: number,
  deadline: string,
  currentStatus: string,
): { status: string; reason: string; shouldUpdate: boolean } {
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const isOverdue = now > deadlineDate
  const isCompleted = currentValue >= targetValue

  // If target value is reached, mark as completed regardless of deadline
  if (isCompleted && currentStatus !== "completed") {
    return {
      status: "completed",
      reason: "Target value reached",
      shouldUpdate: true,
    }
  }

  // If already completed and still completed, no change needed
  if (currentStatus === "completed" && isCompleted) {
    return { status: "completed", reason: "Already completed", shouldUpdate: false }
  }

  // CRITICAL: If deadline passed and not completed, mark as failed
  if (isOverdue && currentStatus === "active" && !isCompleted) {
    return {
      status: "failed",
      reason: "Deadline passed without reaching target",
      shouldUpdate: true,
    }
  }

  // If currently failed but target is now completed, mark as completed
  if (currentStatus === "failed" && isCompleted) {
    return {
      status: "completed",
      reason: "Target completed after deadline",
      shouldUpdate: true,
    }
  }

  // If deadline was extended and target is no longer overdue, reactivate
  if (currentStatus === "failed" && !isOverdue && !isCompleted) {
    return {
      status: "active",
      reason: "Deadline extended, target reactivated",
      shouldUpdate: true,
    }
  }

  // No change needed
  return { status: currentStatus, reason: "No change required", shouldUpdate: false }
}

/**
 * Validates if the current value is acceptable
 */
export function validateCurrentValue(currentValue: number, targetValue: number): { isValid: boolean; error?: string } {
  if (currentValue < 0) {
    return { isValid: false, error: "Current value cannot be negative" }
  }

  if (currentValue > targetValue) {
    return {
      isValid: false,
      error: `Current value cannot exceed target value of ${targetValue.toLocaleString()}`,
    }
  }

  return { isValid: true }
}

/**
 * Batch process targets for daily status updates
 * This will automatically fail overdue targets
 */
export function processBatchTargetUpdates(targets: any[]): TargetStatusUpdate[] {
  const updates: TargetStatusUpdate[] = []

  targets.forEach((target) => {
    const statusCheck = calculateTargetStatus(target.currentValue, target.targetValue, target.deadline, target.status)

    if (statusCheck.shouldUpdate) {
      updates.push({
        id: target.id,
        currentStatus: target.status,
        newStatus: statusCheck.status,
        reason: statusCheck.reason,
      })
    }
  })

  return updates
}

/**
 * Check if a single target needs status update
 */
export function checkTargetStatusUpdate(target: any): { needsUpdate: boolean; newStatus?: string; reason?: string } {
  const statusCheck = calculateTargetStatus(target.currentValue, target.targetValue, target.deadline, target.status)

  return {
    needsUpdate: statusCheck.shouldUpdate,
    newStatus: statusCheck.status,
    reason: statusCheck.reason,
  }
}
