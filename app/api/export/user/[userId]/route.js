import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";
import {
  getCurrentWorkspaceId,
  getWorkspaceMember,
} from "@/lib/workspace-utils";
import { PDFGenerator } from "@/lib/pdf-generator";
import { getCategoriesForPosition } from "@/lib/constants";

export async function POST(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { userId } = params;
    const { timeframe } = await request.json();

    // Try to get workspace ID from header first, then fallback to user's workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id");
    const currentWorkspaceId = await getCurrentWorkspaceId(
      user.userId,
      headerWorkspaceId || undefined
    );

    if (!currentWorkspaceId) {
      return NextResponse.json(
        { success: false, error: "No workspace found for user" },
        { status: 404 }
      );
    }

    const db = await getDatabase();

    // Get current user's role in the workspace
    const currentUserMember = await getWorkspaceMember(
      user.userId,
      currentWorkspaceId
    );
    if (
      !currentUserMember ||
      (currentUserMember.role !== "Owner" && currentUserMember.role !== "Admin")
    ) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get target user information
    const workspacesCollection = db.collection("workspaces");
    const usersCollection = db.collection("users");
    const tasksCollection = db.collection("tasks");
    const projectsCollection = db.collection("projects");
    const timeEntriesCollection = db.collection("timeEntries");

    const workspace = await workspacesCollection.findOne({
      id: currentWorkspaceId,
    });

    console.log("workspace", workspace);
    if (!workspace) {
      return NextResponse.json(
        { success: false, error: "workspace not found " },
        { status: 404 }
      );
    }
    const targetMember = workspace?.members.find(
      (member) => member.memberId === userId
    );

    console.log("targetMember", targetMember);
    if (!targetMember) {
      return NextResponse.json(
        { success: false, error: "User not found in workspace" },
        { status: 404 }
      );
    }

    // Get user details
    const targetUser = await usersCollection.findOne({ id: userId });
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Calculate date range based on timeframe
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDate = null;

    switch (timeframe) {
      case "week":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case "month":
        startDate = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          now.getDate()
        );
        break;
      case "year":
        startDate = new Date(
          now.getFullYear() - 1,
          now.getMonth(),
          now.getDate()
        );
        break;
      case "all":
      default:
        startDate = null;
        break;
    }

    // Get user's tasks
    const allTasks = await tasksCollection
      .find({
        $or: [{ createdBy: userId }, { assignedTo: userId }],
        workspaceId: currentWorkspaceId,
      })
      .toArray();

    const filteredTasks = startDate
      ? allTasks.filter((task) => new Date(task.updatedAt) >= startDate)
      : allTasks;

    // Get user's projects
    const allProjects = await projectsCollection
      .find({
        assignedMembers: userId, // This works because MongoDB can match an element in an array directly
        workspaceId: currentWorkspaceId,
      })
      .toArray();

    const filteredProjects = startDate
      ? allProjects.filter(
          (project) =>
            new Date(project.updatedAt || project.createdAt) >= startDate
        )
      : allProjects;

    // Get time entries
    const timeEntriesQuery = {
      userId: userId,
      workspaceId: currentWorkspaceId,
    };

    if (startDate) {
      timeEntriesQuery.startTime = { $gte: startDate.toISOString() };
    }

    const timeEntries = await timeEntriesCollection
      .find(timeEntriesQuery)
      .toArray();
    if (!timeEntries) {
      return NextResponse.json(
        { success: false, error: "timeEntries not found" },
        { status: 404 }
      );
    }

    // Calculate statistics
    const completedTasks = filteredTasks.filter(
      (task) => task.status === "Completed"
    );
    const inProgressTasks = filteredTasks.filter(
      (task) => task.status === "In Progress"
    );
    const activeProjects = filteredProjects.filter(
      (project) => project.status === "ongoing"
    );

    const totalTimeTracked = timeEntries.reduce(
      (total, entry) => total + (entry.duration || 0),
      0
    );
    const filteredHours = totalTimeTracked / 3600;

    // Get project names for tasks
    const projectIds = [
      ...new Set(filteredTasks.map((task) => task.projectId).filter(Boolean)),
    ];
    const projects = await projectsCollection
      .find({ id: { $in: projectIds }, workspaceId: currentWorkspaceId })
      .toArray();

    const projectMap = projects.reduce((map, project) => {
      map[project.id] = project.name;
      return map;
    }, {});

    // Calculate project progress
    const projectsWithProgress = filteredProjects.map((project) => {
      const projectTasks = allTasks.filter(
        (task) => task.projectId === project.id
      );
      const completedProjectTasks = projectTasks.filter(
        (task) => task.status === "Completed"
      );
      const progress =
        projectTasks.length > 0
          ? Math.round(
              (completedProjectTasks.length / projectTasks.length) * 100
            )
          : 0;

      return {
        ...project,
        progress,
      };
    });

    // NEW: Calculate category-based analytics
    const userPosition = targetMember.position;
    const userCategories = userPosition
      ? getCategoriesForPosition(userPosition)
      : [];

    // Initialize category analytics
    const categoryAnalytics = {
      byCategory: {},
      totalCategorized: 0,
      totalUncategorized: 0,
      userPosition: userPosition || "No Position Assigned",
    };

    // Count tasks by category and status
    filteredTasks.forEach((task) => {
      const category = task.category || "Uncategorized";
      const status = task.status || "To Do";

      // Only include categories relevant to user's position, or uncategorized tasks
      if (
        category === "Uncategorized" ||
        (userCategories.length > 0 && userCategories.includes(category))
      ) {
        if (!categoryAnalytics.byCategory[category]) {
          categoryAnalytics.byCategory[category] = {
            total: 0,
            completed: 0,
            inProgress: 0,
            toDo: 0,
            underReview: 0,
            uncategorized: category === "Uncategorized",
          };
        }

        categoryAnalytics.byCategory[category].total++;

        switch (status) {
          case "Completed":
            categoryAnalytics.byCategory[category].completed++;
            break;
          case "In Progress":
            categoryAnalytics.byCategory[category].inProgress++;
            break;
          case "Under Review":
            categoryAnalytics.byCategory[category].underReview++;
            break;
          case "To Do":
          default:
            categoryAnalytics.byCategory[category].toDo++;
            break;
        }

        if (category === "Uncategorized") {
          categoryAnalytics.totalUncategorized++;
        } else {
          categoryAnalytics.totalCategorized++;
        }
      }
    });

    // Prepare export data
    const exportData = {
      user: {
        ...targetUser,
        salary: targetMember.salary,
      },
      stats: {
        totalTasks: allTasks.length,
        completedTasks: completedTasks.length,
        inProgressTasks: inProgressTasks.length,
        completionRate:
          allTasks.length > 0
            ? Math.round((completedTasks.length / allTasks.length) * 100)
            : 0,
        totalProjects: allProjects.length,
        activeProjects: activeProjects.length,
        totalTimeTracked,
        filteredHours,
      },
      tasks: filteredTasks.map((task) => ({
        ...task,
        projectName: projectMap[task.projectId] || "Unknown Project",
      })),
      projects: projectsWithProgress,
      timeEntries: timeEntries,
      categoryAnalytics, // NEW: Add category analytics
      timeframe,
      generatedAt: new Date().toISOString(),
    };

    // Generate PDF
    const pdfGenerator = new PDFGenerator();
    const pdfBlob = pdfGenerator.generateUserReport(exportData);

    // Convert blob to buffer for response
    const buffer = await pdfBlob.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${targetUser.username}-report-${timeframe}-${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
