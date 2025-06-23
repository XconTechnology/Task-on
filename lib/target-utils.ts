// Utility functions for target status management

export interface TargetStatusUpdate {
  id: string
  currentStatus: string
  newStatus: string
  reason: string
}

/**
 * Determines the correct status for a target based on current conditions
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

  // If already completed and still completed, no change needed
  if (currentStatus === "completed" && isCompleted) {
    return { status: "completed", reason: "Already completed", shouldUpdate: false }
  }

  // If target value is reached, mark as completed regardless of deadline
  if (isCompleted) {
    return {
      status: "completed",
      reason: "Target value reached",
      shouldUpdate: currentStatus !== "completed",
    }
  }

  // If deadline passed and not completed, mark as failed
  if (isOverdue && currentStatus === "active") {
    return {
      status: "failed",
      reason: "Deadline passed without reaching target",
      shouldUpdate: true,
    }
  }

  // If currently failed but deadline hasn't passed and not completed, keep as active
  if (currentStatus === "failed" && !isOverdue && !isCompleted) {
    return {
      status: "active",
      reason: "Deadline extended or corrected",
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
