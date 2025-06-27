"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Grid,
  List,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CreateProjectModal from "@/components/modals/create-project-modal";
import EditProjectModal from "@/components/modals/edit-project-modal";
import type { Project } from "@/lib/types";
import { projectApi } from "@/lib/api";
import ProjectCard from "./ProjectCard";
import ProjectListItem from "./ProjectListItem";

export default function ProjectsContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
  try {
    const response = await projectApi.getProjects(); // ✅ Using your projectApi

    if (response.success) {
      setProjects(response.data || []);
    }
  } catch (error) {
    console.error("Failed to fetch projects:", error);
  } finally {
    setIsLoading(false);
  }
};

  const handleProjectCreated = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  const handleEditProject = (project: any) => {
    setEditingProject(project);
    setIsEditModalOpen(true);
  };

  const handleProjectUpdated = (updatedProject: Project) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === updatedProject.id ? updatedProject : project
      )
    );
  };

  const handleProjectDeleted = (projectId: string) => {
    setProjects((prev) => prev.filter((project) => project.id !== projectId));
  };

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 space-y-6 overflow-hidden bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="header-large">Projects</h1>
            <p className="text-description mt-1">
              Manage and organize all your projects in one place.
            </p>
          </div>
          <Button
            className="bg-primary hover:bg-bg_hovered text-white"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={16} className="mr-2" />
            <span className="text-medium text-white">New Project</span>
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid size={16} />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List size={16} />
            </Button>
          </div>
        </div>

        {/* Projects Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProjects.map((project) => (
              <div key={project.id}>
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={handleEditProject}
                />
              </div>
            ))}
            {filteredProjects.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Target size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="header-small mb-2">No projects found</h3>
                <p className="text-description mb-4">
                  Create your first project to get started.
                </p>
                <Button
                  className="bg-primary hover:bg-bg_hovered"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus size={16} className="mr-2 text-white" />
                  <span className="text-medium text-white">Create Project</span>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <ProjectListItem
                key={project.id}
                project={project}
                onEdit={handleEditProject}
              />
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleProjectCreated}
      />
      <EditProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        project={editingProject}
        onSuccess={handleProjectUpdated}
        onDelete={handleProjectDeleted}
      />
    </>
  );
}