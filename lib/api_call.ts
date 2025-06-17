// Cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number; ttl: number }>()

// Cache cleanup interval (5 minutes)
setInterval(
  () => {
    const now = Date.now()
    for (const [key, value] of apiCache.entries()) {
      if (now - value.timestamp > value.ttl) {
        apiCache.delete(key)
      }
    }
  },
  5 * 60 * 1000,
)

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
  options: RequestInit & { cache?: boolean; cacheTTL?: number } = {},
): Promise<{ success: boolean; data?: T; error?: string; unreadCount?: number }> {
  try {
    const { cache = false, cacheTTL = 5 * 60 * 1000, ...fetchOptions } = options // 5 minutes default cache

    // Check cache for GET requests
    if (cache && (!fetchOptions.method || fetchOptions.method === "GET")) {
      const cacheKey = `${endpoint}${JSON.stringify(fetchOptions)}`
      const cached = apiCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.data
      }
    }

    // Get current workspace ID from localStorage with retries
    const currentWorkspaceId = getCurrentWorkspaceIdFromStorage(3)

    // If we're on the client and don't have a workspace ID, that's an error
    if (
      typeof window !== "undefined" &&
      !currentWorkspaceId &&
      !endpoint.includes("/auth/") &&
      !endpoint.includes("/workspaces/user")
    ) {
      return {
        success: false,
        error: "No workspace selected. Please select a workspace to continue.",
      }
    }

    const defaultHeaders: HeadersInit = {}

    // Only set Content-Type for non-FormData requests
    if (!(fetchOptions.body instanceof FormData)) {
      defaultHeaders["Content-Type"] = "application/json"
    }

    // Add workspace ID to headers if available
    if (currentWorkspaceId) {
      defaultHeaders["x-workspace-id"] = currentWorkspaceId
    }

    const response = await fetch(`/api${endpoint}`, {
      ...fetchOptions,
      headers: {
        ...defaultHeaders,
        ...fetchOptions.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`,
      }
    }

    const result = {
      success: data.success !== false,
      data: data.data,
      error: data.error,
      unreadCount: data.unreadCount,
    }

    // Cache successful GET requests
    if (cache && (!fetchOptions.method || fetchOptions.method === "GET") && result.success) {
      const cacheKey = `${endpoint}${JSON.stringify(fetchOptions)}`
      apiCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        ttl: cacheTTL,
      })
    }

    return result
  } catch (error) {
    console.error("API call failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}


// Clear cache function for when data changes
export function clearApiCache(pattern?: string) {
  if (pattern) {
    for (const key of apiCache.keys()) {
      if (key.includes(pattern)) {
        apiCache.delete(key)
      }
    }
  } else {
    apiCache.clear()
  }
}
