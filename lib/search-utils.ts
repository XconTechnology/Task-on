import type { Db } from "mongodb"

// Utility functions for search functionality

export async function populateTasksWithUsers(tasks: any[], db: Db) {
  if (tasks.length === 0) return []

  const userIds = [
    ...new Set([
      ...tasks.map((task) => task.createdBy).filter(Boolean),
      ...tasks.map((task) => task.assignedTo).filter(Boolean),
    ]),
  ]

  if (userIds.length === 0) return tasks.map((task) => ({ ...task, _id: undefined }))

  const taskUsers = await db
    .collection("users")
    .find({ id: { $in: userIds } })
    .project({ id: 1, username: 1, email: 1, profilePictureUrl: 1 })
    .toArray()

  const userMap = taskUsers.reduce(
    (acc, user) => {
      acc[user.id] = user
      return acc
    },
    {} as Record<string, any>,
  )

  return tasks.map((task) => ({
    ...task,
    _id: undefined,
    author: task.createdBy ? userMap[task.createdBy] : undefined,
    assignee: task.assignedTo ? userMap[task.assignedTo] : undefined,
  }))
}

export async function populateDocumentsWithRelatedData(documents: any[], db: Db) {
  if (documents.length === 0) return []

  const projectIds = documents.map((doc) => doc.projectId).filter(Boolean)
  const taskIds = documents.map((doc) => doc.taskId).filter(Boolean)
  const uploaderIds = documents.map((doc) => doc.uploadedBy).filter(Boolean)

  const [projects, tasks, uploaders] = await Promise.all([
    projectIds.length > 0
      ? db
          .collection("projects")
          .find({ id: { $in: projectIds } })
          .toArray()
      : [],
    taskIds.length > 0
      ? db
          .collection("tasks")
          .find({ id: { $in: taskIds } })
          .toArray()
      : [],
    uploaderIds.length > 0
      ? db
          .collection("users")
          .find({ id: { $in: uploaderIds } })
          .project({ id: 1, username: 1, email: 1 })
          .toArray()
      : [],
  ])

  const projectMap = projects.reduce(
    (acc, project) => {
      acc[project.id] = project
      return acc
    },
    {} as Record<string, any>,
  )

  const taskMap = tasks.reduce(
    (acc, task) => {
      acc[task.id] = task
      return acc
    },
    {} as Record<string, any>,
  )

  const uploaderMap = uploaders.reduce(
    (acc, user) => {
      acc[user.id] = user
      return acc
    },
    {} as Record<string, any>,
  )

  return documents.map((doc) => ({
    ...doc,
    _id: undefined,
    project: doc.projectId ? { id: projectMap[doc.projectId]?.id, name: projectMap[doc.projectId]?.name } : undefined,
    task: doc.taskId ? { id: taskMap[doc.taskId]?.id, title: taskMap[doc.taskId]?.title } : undefined,
    uploader: uploaderMap[doc.uploadedBy] || undefined,
  }))
}

export async function getWorkspaceMembers(workspaceId: string, db: Db) {
  const workspace = await db.collection("workspaces").findOne({ id: workspaceId })

  if (!workspace?.members) return []

  const memberIds = workspace.members.map((member: any) => member.memberId)

  return db
    .collection("users")
    .find({ id: { $in: memberIds } })
    .project({ id: 1, username: 1, email: 1, profilePictureUrl: 1 })
    .toArray()
}

export function buildSearchRegex(query: string) {
  return new RegExp(query.toLowerCase().trim(), "i")
}

export async function searchWorkspaceContent(workspaceId: string, searchRegex: RegExp, db: Db) {
  const baseFilter = { workspaceId }

  // Execute all searches in parallel
  const [tasks, projects, documents] = await Promise.all([
    // Search tasks
    db
      .collection("tasks")
      .find({
        ...baseFilter,
        $or: [
          { title: { $regex: searchRegex } },
          { description: { $regex: searchRegex } },
          { tags: { $regex: searchRegex } },
        ],
      })
      .sort({ updatedAt: -1 })
      .limit(8)
      .toArray(),

    // Search projects
    db
      .collection("projects")
      .find({
        ...baseFilter,
        $or: [{ name: { $regex: searchRegex } }, { description: { $regex: searchRegex } }],
      })
      .sort({ updatedAt: -1 })
      .limit(5)
      .toArray(),

    // Search documents
    db
      .collection("documents")
      .find({
        ...baseFilter,
        $or: [
          { name: { $regex: searchRegex } },
          { description: { $regex: searchRegex } },
          { fileName: { $regex: searchRegex } },
        ],
      })
      .sort({ updatedAt: -1 })
      .limit(5)
      .toArray(),
  ])

  return { tasks, projects, documents }
}

export async function getRecentWorkspaceContent(workspaceId: string, db: Db) {
  const baseFilter = { workspaceId }

  const [tasks, projects, documents] = await Promise.all([
    db.collection("tasks").find(baseFilter).sort({ createdAt: -1 }).limit(5).toArray(),
    db
      .collection("projects")
      .find({ ...baseFilter, status: "active" })
      .sort({ updatedAt: -1 })
      .limit(3)
      .toArray(),
    db.collection("documents").find(baseFilter).sort({ createdAt: -1 }).limit(3).toArray(),
  ])

  return { tasks, projects, documents }
}
