export type UserRole = "Owner" | "Admin" | "Member"
export type Action = "create" | "read" | "update" | "delete" | "role_change"
export type Resource = "project" | "task" | "team" | "user" | "workspace"

interface Permission {
  resource: Resource
  actions: Action[]
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  Owner: [
    { resource: "project", actions: ["create", "read", "update", "delete"] },
    { resource: "task", actions: ["create", "read", "update", "delete"] },
    { resource: "team", actions: ["create", "read", "update", "delete"] },
    { resource: "user", actions: ["create", "read", "update", "delete", "role_change"] },
    { resource: "workspace", actions: ["create", "read", "update", "delete"] },
  ],
  Admin: [
    { resource: "project", actions: ["create", "read", "update", "delete"] },
    { resource: "task", actions: ["create", "read", "update", "delete"] },
    { resource: "team", actions: ["create", "read", "update", "delete"] },
    { resource: "user", actions: ["create", "read", "update", "role_change"] },
    { resource: "workspace", actions: ["read"] },
  ],
  Member: [
    { resource: "project", actions: ["read"] },
    { resource: "task", actions: ["create", "read", "update"] },
    { resource: "team", actions: ["read"] },
    { resource: "user", actions: ["read"] },
    { resource: "workspace", actions: ["read"] },
  ],
}

export function canUserPerformAction(userRole: UserRole, resource: Resource, action: Action): boolean {
  const permissions = ROLE_PERMISSIONS[userRole]
  if (!permissions) return false

  const resourcePermission = permissions.find((p) => p.resource === resource)
  return resourcePermission?.actions.includes(action) || false
}

export function getUserRole(role?: string): UserRole {
  if (role === "Owner" || role === "Admin" || role === "Member") {
    return role
  }
  return "Member" // Default fallback
}
