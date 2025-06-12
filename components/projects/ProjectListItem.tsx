import { useEffect, useState } from "react";
import {
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/lib/types";
import { Card, CardContent } from "../ui/card";
const  ProjectListItem =({
  project,
  onEdit,
}: {
  project: Project;
  onEdit: (project: Project) => void;
}) => {
  const [stats, setStats] = useState({ progress: 0, teamMembers: 0 });

  useEffect(() => {
    fetchProjectStats();
  }, [project.id]);

  const fetchProjectStats = async () => {
    try {
      const response = await fetch(`/api/projects/${project.id}/stats`);
      const data = await response.json();
      if (data.success) {
        setStats({
          progress: data.data.progress,
          teamMembers: data.data.teamMembers,
        });
      }
    } catch (error) {
      console.error("Failed to fetch project stats:", error);
    }
  };

  return (
    <Card className="bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                  {project.name}
                </h3>
                <p className="text-description mt-1">{project.description}</p>
              </div>
              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <p className="text-small text-gray-600">Progress</p>
                  <p className="text-medium font-semibold text-gray-900">
                    {stats.progress}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-small text-gray-600">Team</p>
                  <p className="text-medium font-semibold text-gray-900">
                    {stats.teamMembers} members
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-small text-gray-600">Due Date</p>
                  <p className="text-medium font-semibold text-gray-900">
                    {project.endDate
                      ? new Date(project.endDate).toLocaleDateString()
                      : "No deadline"}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700"
                >
                  {project.status === "active"
                    ? "Active"
                    : project.status === "completed"
                    ? "Completed"
                    : "Archived"}
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onEdit(project)}>
            <MoreHorizontal size={16} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProjectListItem
