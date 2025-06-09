// Utility to get current workspace ID from localStorage with retries
function getCurrentWorkspaceIdFromStorage(retries = 3): string | null {
  if (typeof window === "undefined") {
    return null // Server-side, can't access localStorage
  }

  for (let i = 0; i < retries; i++) {
    try {
      const workspaceId = localStorage.getItem("currentWorkspaceId")
      if (workspaceId) {
        return workspaceId
      }
      // If not found, wait a bit and try again (in case of timing issues)
      if (i < retries - 1) {
        // Synchronous wait for localStorage (should be instant anyway)
        continue
      }
    } catch (error) {
      console.error(`Attempt ${i + 1} to get workspace ID failed:`, error)
      if (i === retries - 1) {
        throw error
      }
    }
  }
  return null
}

export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    // Get current workspace ID from localStorage with retries
    const currentWorkspaceId = getCurrentWorkspaceIdFromStorage(3)

    // If we're on the client and don't have a workspace ID, that's an error
    if (typeof window !== "undefined" && !currentWorkspaceId) {
      return {
        success: false,
        error: "No workspace selected. Please select a workspace to continue.",
      }
    }

    const defaultHeaders: HeadersInit = {
      "Content-Type": "application/json",
    }

    // Add workspace ID to headers if available
    if (currentWorkspaceId) {
      defaultHeaders["x-workspace-id"] = currentWorkspaceId
    }

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`,
      }
    }

    return {
      success: data.success !== false,
      data: data.data,
      error: data.error,
    }
  } catch (error) {
    console.error("API call failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
