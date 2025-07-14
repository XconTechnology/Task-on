import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import type { User, Task, Project, TimeEntry, WorkspaceMember } from "./types"

interface CategoryAnalytics {
  byCategory: Record<
    string,
    {
      total: number
      completed: number
      inProgress: number
      toDo: number
      underReview: number
      uncategorized?: boolean
    }
  >
  totalCategorized: number
  totalUncategorized: number
  userPosition: string
}

interface UserExportData {
  user: User & {
    salary?: WorkspaceMember["salary"]
  }
  stats: {
    totalTasks: number
    completedTasks: number
    inProgressTasks: number
    completionRate: number
    totalProjects: number
    activeProjects: number
    totalTimeTracked: number
    filteredHours: number
  }
  tasks: Array<
    Task & {
      projectName?: string
      category?: string // NEW
    }
  >
  projects: Array<
    Project & {
      progress: number
    }
  >
  timeEntries: TimeEntry[]
  categoryAnalytics: CategoryAnalytics // NEW
  timeframe: string
  generatedAt: string
}

export class PDFGenerator {
  private doc: jsPDF
  private pageHeight: number
  private pageWidth: number
  private margin: number
  private currentY: number

  constructor() {
    this.doc = new jsPDF()
    this.pageHeight = this.doc.internal.pageSize.height
    this.pageWidth = this.doc.internal.pageSize.width
    this.margin = 20
    this.currentY = this.margin
  }

  private addNewPageIfNeeded(requiredHeight = 30) {
    if (this.currentY + requiredHeight > this.pageHeight - this.margin) {
      this.doc.addPage()
      this.currentY = this.margin
    }
  }

  private formatCurrency(amount: number, currency: string): string {
    const currencySymbols: { [key: string]: string } = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      CAD: "C$",
      AUD: "A$",
      JPY: "¥",
    }
    const symbol = currencySymbols[currency] || currency
    return `${symbol}${amount.toLocaleString()}`
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  private formatTimeframe(timeframe: string): string {
    switch (timeframe) {
      case "week":
        return "Last Week"
      case "month":
        return "Last Month"
      case "year":
        return "Last Year"
      case "all":
        return "All Time"
      default:
        return timeframe
    }
  }

  generateUserReport(data: UserExportData): Blob {
    // Header
    this.doc.setFontSize(24)
    this.doc.setTextColor(44, 62, 80)
    this.doc.text("Performance Report", this.margin, this.currentY)

    this.currentY += 15
    this.doc.setFontSize(16)
    this.doc.setTextColor(127, 140, 141)
    this.doc.text(`${data.user.username} - ${this.formatTimeframe(data.timeframe)}`, this.margin, this.currentY)

    this.currentY += 10
    this.doc.setFontSize(10)
    this.doc.text(`Generated on: ${new Date(data.generatedAt).toLocaleString()}`, this.margin, this.currentY)

    // Add line separator
    this.currentY += 10
    this.doc.setDrawColor(189, 195, 199)
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
    this.currentY += 15

    // User Information Section
    this.addNewPageIfNeeded(60)
    this.doc.setFontSize(16)
    this.doc.setTextColor(44, 62, 80)
    this.doc.text("User Information", this.margin, this.currentY)
    this.currentY += 10

    const userInfo = [
      ["Name", data.user.username],
      ["Email", data.user.email],
      ["Position", data.categoryAnalytics.userPosition], // NEW: Show user position
      ["Member Since", new Date(data.user.createdAt).toLocaleDateString()],
    ]

    if (data.user.salary) {
      userInfo.push(["Salary", this.formatCurrency(data.user.salary.amount, data.user.salary.currency)])
      userInfo.push(["Salary Last Updated", new Date(data.user.salary.lastUpdated).toLocaleDateString()])
    }

    // Use autoTable function directly
    autoTable(this.doc, {
      startY: this.currentY,
      head: [["Field", "Value"]],
      body: userInfo,
      theme: "grid",
      headStyles: { fillColor: [52, 152, 219], textColor: 255 },
      margin: { left: this.margin, right: this.margin },
    })

    this.currentY = (this.doc as any).lastAutoTable.finalY + 20

    // Performance Summary Section
    this.addNewPageIfNeeded(80)
    this.doc.setFontSize(16)
    this.doc.setTextColor(44, 62, 80)
    this.doc.text("Performance Summary", this.margin, this.currentY)
    this.currentY += 10

    const performanceData = [
      ["Total Tasks", data.stats.totalTasks.toString()],
      ["Completed Tasks", data.stats.completedTasks.toString()],
      ["In Progress Tasks", data.stats.inProgressTasks.toString()],
      ["Completion Rate", `${data.stats.completionRate}%`],
      ["Total Projects", data.stats.totalProjects.toString()],
      ["Active Projects", data.stats.activeProjects.toString()],
      ["Time Tracked", this.formatDuration(data.stats.totalTimeTracked)],
      ["Filtered Hours", `${data.stats.filteredHours.toFixed(1)}h`],
    ]

    autoTable(this.doc, {
      startY: this.currentY,
      head: [["Metric", "Value"]],
      body: performanceData,
      theme: "grid",
      headStyles: { fillColor: [46, 204, 113], textColor: 255 },
      margin: { left: this.margin, right: this.margin },
    })

    this.currentY = (this.doc as any).lastAutoTable.finalY + 20

    // NEW: Category Analytics Section
    if (Object.keys(data.categoryAnalytics.byCategory).length > 0) {
      this.addNewPageIfNeeded(80)
      this.doc.setFontSize(16)
      this.doc.setTextColor(44, 62, 80)
      this.doc.text("Task Categories Analysis", this.margin, this.currentY)
      this.currentY += 5

      // Add position context
      this.doc.setFontSize(10)
      this.doc.setTextColor(127, 140, 141)
      this.doc.text(`Based on position: ${data.categoryAnalytics.userPosition}`, this.margin, this.currentY)
      this.currentY += 10

      const categoryData: string[][] = []

      // Sort categories: put "Uncategorized" last, sort others alphabetically
      const sortedCategories = Object.keys(data.categoryAnalytics.byCategory).sort((a, b) => {
        if (a === "Uncategorized") return 1
        if (b === "Uncategorized") return -1
        return a.localeCompare(b)
      })

      sortedCategories.forEach((category) => {
        const stats = data.categoryAnalytics.byCategory[category]
        const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

        categoryData.push([
          category,
          stats.total.toString(),
          stats.completed.toString(),
          stats.inProgress.toString(),
          stats.toDo.toString(),
          stats.underReview.toString(),
          `${completionRate}%`,
        ])
      })

      autoTable(this.doc, {
        startY: this.currentY,
        head: [["Category", "Total", "Completed", "In Progress", "To Do", "Under Review", "Completion %"]],
        body: categoryData,
        theme: "grid",
        headStyles: { fillColor: [142, 68, 173], textColor: 255 },
        margin: { left: this.margin, right: this.margin },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 35 }, // Category name
          1: { cellWidth: 15 }, // Total
          2: { cellWidth: 20 }, // Completed
          3: { cellWidth: 20 }, // In Progress
          4: { cellWidth: 15 }, // To Do
          5: { cellWidth: 20 }, // Under Review
          6: { cellWidth: 20 }, // Completion %
        },
        // Highlight uncategorized tasks
        didParseCell: (data) => {
          if (
            data.row.index >= 0 &&
            categoryData[data.row.index] &&
            categoryData[data.row.index][0] === "Uncategorized"
          ) {
            data.cell.styles.fillColor = [255, 248, 220] // Light yellow background
            data.cell.styles.textColor = [139, 69, 19] // Brown text
          }
        },
      })

      this.currentY = (this.doc as any).lastAutoTable.finalY + 15

      // Add category summary
      this.doc.setFontSize(10)
      this.doc.setTextColor(127, 140, 141)
      const summaryText = `Summary: ${data.categoryAnalytics.totalCategorized} categorized tasks, ${data.categoryAnalytics.totalUncategorized} uncategorized tasks`
      this.doc.text(summaryText, this.margin, this.currentY)
      this.currentY += 15
    }

    // Tasks Section
    if (data.tasks.length > 0) {
      this.addNewPageIfNeeded(60)
      this.doc.setFontSize(16)
      this.doc.setTextColor(44, 62, 80)
      this.doc.text("Tasks Overview", this.margin, this.currentY)
      this.currentY += 10

      const taskData = data.tasks.slice(0, 20).map((task) => [
        task.title.length > 25 ? task.title.substring(0, 25) + "..." : task.title,
        task.status,
        task.priority,
        task.category || "No Category", // NEW: Show category
        task.projectName || "N/A",
        task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date",
      ])

      autoTable(this.doc, {
        startY: this.currentY,
        head: [["Task", "Status", "Priority", "Category", "Project", "Due Date"]], // NEW: Added Category column
        body: taskData,
        theme: "grid",
        headStyles: { fillColor: [155, 89, 182], textColor: 255 },
        margin: { left: this.margin, right: this.margin },
        styles: { fontSize: 7 }, // Smaller font to fit category column
        columnStyles: {
          0: { cellWidth: 35 }, // Task
          1: { cellWidth: 20 }, // Status
          2: { cellWidth: 15 }, // Priority
          3: { cellWidth: 25 }, // Category
          4: { cellWidth: 25 }, // Project
          5: { cellWidth: 25 }, // Due Date
        },
      })

      this.currentY = (this.doc as any).lastAutoTable.finalY + 20
    }

    // Projects Section
    if (data.projects.length > 0) {
      this.addNewPageIfNeeded(60)
      this.doc.setFontSize(16)
      this.doc.setTextColor(44, 62, 80)
      this.doc.text("Projects Overview", this.margin, this.currentY)
      this.currentY += 10

      const projectData = data.projects.map((project) => [
        project.name.length > 25 ? project.name.substring(0, 25) + "..." : project.name,
        project.status,
        `${project.progress}%`,
        project.startDate ? new Date(project.startDate).toLocaleDateString() : "N/A",
        project.description?.substring(0, 40) + "..." || "No description",
      ])

      autoTable(this.doc, {
        startY: this.currentY,
        head: [["Project", "Status", "Progress", "Start Date", "Description"]],
        body: projectData,
        theme: "grid",
        headStyles: { fillColor: [230, 126, 34], textColor: 255 },
        margin: { left: this.margin, right: this.margin },
        styles: { fontSize: 8 },
      })

      this.currentY = (this.doc as any).lastAutoTable.finalY + 20
    }

    // Time Tracking Section
    if (data.timeEntries.length > 0) {
      this.addNewPageIfNeeded(60)
      this.doc.setFontSize(16)
      this.doc.setTextColor(44, 62, 80)
      this.doc.text("Time Tracking Details", this.margin, this.currentY)
      this.currentY += 10

      const timeData = data.timeEntries
        .slice(0, 15)
        .map((entry) => [
          entry.taskTitle?.substring(0, 25) + "..." || "Unknown Task",
          entry.projectName || "N/A",
          this.formatDuration(entry.duration),
          new Date(entry.startTime).toLocaleDateString(),
          entry.endTime ? new Date(entry.endTime).toLocaleTimeString() : "Ongoing",
        ])

      autoTable(this.doc, {
        startY: this.currentY,
        head: [["Task", "Project", "Duration", "Date", "End Time"]],
        body: timeData,
        theme: "grid",
        headStyles: { fillColor: [52, 73, 94], textColor: 255 },
        margin: { left: this.margin, right: this.margin },
        styles: { fontSize: 8 },
      })

      this.currentY = (this.doc as any).lastAutoTable.finalY + 20
    }

    // Footer
    const totalPages = this.doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i)
      this.doc.setFontSize(8)
      this.doc.setTextColor(127, 140, 141)
      this.doc.text(
        `Page ${i} of ${totalPages} | Generated by Project Management System`,
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: "center" },
      )
    }

    return this.doc.output("blob")
  }
}
