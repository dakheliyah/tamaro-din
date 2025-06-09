"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, FolderOpen, Edit, Trash2, Palette, ArrowLeft, User } from "lucide-react"
import { toast } from "sonner"
import { supabase, Project as SupabaseProject } from '@/lib/supabase'

interface ProjectGlobalStyles {
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  fontSize: string
  backgroundColor: string
  textColor: string
}

interface Project {
  id: string
  user_id: string
  name: string
  description: string
  global_styles: ProjectGlobalStyles
  created_at: string
  updated_at: string
  templateCount?: number
}

const defaultGlobalStyles: ProjectGlobalStyles = {
  primaryColor: "#3b82f6",
  secondaryColor: "#64748b",
  fontFamily: "Arial, sans-serif",
  fontSize: "16px",
  backgroundColor: "#ffffff",
  textColor: "#000000"
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDescription, setNewProjectDescription] = useState("")
  const [user, setUser] = useState<{ email: string; id: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndLoadProjects = async () => {
      // Check if user is authenticated
      const isAuthenticated = localStorage.getItem("isAuthenticated")
      const userData = localStorage.getItem('userEmail')

      if (!isAuthenticated || isAuthenticated !== "true" || !userData) {
        router.push("/login")
        return
      }

      // Get current user from Supabase
      const { data: { user: authUser }, error } = await supabase.auth.getUser()

      if (error || !authUser) {
        console.error('Error getting user:', error)
        router.push("/login")
        return
      }

      setUser({ email: authUser.email || userData, id: authUser.id })
      await loadProjects(authUser.id)
    }

    checkAuthAndLoadProjects()
  }, [router])

  const loadProjects = async (userId: string) => {
    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading projects:', error)
        toast.error('Failed to load projects')
        return
      }

      // Calculate template count for each project
      const projectsWithCounts = await Promise.all(
        (projects || []).map(async (project: Project) => {
          const templateCount = await getProjectTemplateCount(project.id)
          return { ...project, templateCount }
        })
      )

      setProjects(projectsWithCounts)
    } catch (error) {
      console.error("Error loading projects:", error)
      toast.error('Failed to load projects')
    } finally {
      setIsLoading(false)
    }
  }

  const getProjectTemplateCount = async (projectId: string): Promise<number> => {
    try {
      const { data: templates, error } = await supabase
        .from('templates')
        .select('id')
        .eq('project_id', projectId)

      if (error) {
        console.error('Error getting template count:', error)
        return 0
      }

      return templates?.length || 0
    } catch {
      return 0
    }
  }

  const createProject = async () => {
    if (!newProjectName.trim()) {
      toast.error("Project name is required")
      return
    }

    if (!user?.id) {
      toast.error("User not authenticated")
      return
    }

    const newProject = {
      user_id: user.id,
      name: newProjectName.trim(),
      description: newProjectDescription.trim(),
      global_styles: { ...defaultGlobalStyles }
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([newProject])
        .select()
        .single()

      if (error) {
        console.error('Error creating project:', error)
        toast.error('Failed to create project')
        return
      }

      const projectWithCount = { ...data, templateCount: 0 }
      setProjects(prev => [projectWithCount, ...prev])
      setNewProjectName("")
      setNewProjectDescription("")
      setIsCreateDialogOpen(false)
      toast.success("Project created successfully!")
    } catch (error) {
      console.error("Error creating project:", error)
      toast.error("Failed to create project")
    }
  }

  const deleteProject = async (projectId: string) => {
    if (confirm("Are you sure you want to delete this project? This will also delete all templates in this project.")) {
      try {
        // First delete all templates in this project
        const { error: templatesError } = await supabase
          .from('templates')
          .delete()
          .eq('project_id', projectId)

        if (templatesError) {
          console.error('Error deleting templates:', templatesError)
          toast.error('Failed to delete project templates')
          return
        }

        // Then delete the project
        const { error: projectError } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectId)

        if (projectError) {
          console.error('Error deleting project:', projectError)
          toast.error('Failed to delete project')
          return
        }

        setProjects(prev => prev.filter(p => p.id !== projectId))
        toast.success("Project deleted successfully")
      } catch (error) {
        console.error("Error deleting project:", error)
        toast.error("Failed to delete project")
      }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("userEmail")
    router.push("/login")
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      })
    } catch {
      return "Unknown"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading projects...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <FolderOpen className="h-6 w-6 mr-2 text-blue-600" />
                  Projects
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your email template projects and their global styling
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <User className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Projects</h2>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Create Project</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Create a new project to organize your email templates with global styling.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Enter project name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="projectDescription">Description (Optional)</Label>
                  <Input
                    id="projectDescription"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Enter project description"
                    className="mt-1"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createProject}>
                    Create Project
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {projects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-500 dark:text-gray-400 mb-4">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No projects found</h3>
                <p className="text-sm">Create your first project to start organizing your email templates.</p>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg truncate">
                        {project.name}
                      </CardTitle>
                      {project.description && (
                        <CardDescription className="mt-1">
                          {project.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {project.templateCount} templates
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Palette className="h-4 w-4" />
                      <span>Global Styles:</span>
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: project.global_styles.primaryColor }}
                      />
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: project.global_styles.secondaryColor }}
                      />
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Created: {formatDate(project.created_at)}
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/dashboard?project=${project.id}`)}
                      >
                        <FolderOpen className="h-4 w-4 mr-1" />
                        Open
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/projects/${project.id}/settings`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteProject(project.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}