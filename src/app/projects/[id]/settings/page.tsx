"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Palette } from "lucide-react"
import { toast } from "sonner"
import { supabase, Project } from "@/lib/supabase"

interface ProjectGlobalStyles {
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  fontSize: string
  backgroundColor: string
  textColor: string
}

export default function ProjectSettingsPage() {
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [globalStyles, setGlobalStyles] = useState<ProjectGlobalStyles>({
    primaryColor: "#3b82f6",
    secondaryColor: "#64748b",
    fontFamily: "Work Sans, sans-serif",
    fontSize: "16px",
    backgroundColor: "#ffffff",
    textColor: "#000000"
  })
  
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  useEffect(() => {
    checkAuthAndLoadProject()
  }, [projectId])

  const checkAuthAndLoadProject = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push("/login")
        return
      }

      await loadProject()
    } catch (error) {
      console.error("Auth check failed:", error)
      router.push("/login")
    }
  }

  const loadProject = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push("/login")
        return
      }

      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', session.user.id)
        .single()

      if (error) {
        console.error('Error loading project:', error)
        toast.error('Project not found')
        router.push('/projects')
        return
      }

      if (project) {
        setProject(project)
        setProjectName(project.name)
        setProjectDescription(project.description || "")
        
        // Parse global_styles from database
        if (project.global_styles) {
          setGlobalStyles({
            primaryColor: project.global_styles.primaryColor || "#3b82f6",
            secondaryColor: project.global_styles.secondaryColor || "#64748b",
            fontFamily: project.global_styles.fontFamily || "Work Sans, sans-serif",
            fontSize: project.global_styles.fontSize || "16px",
            backgroundColor: project.global_styles.backgroundColor || "#ffffff",
            textColor: project.global_styles.textColor || "#000000"
          })
        }
      }
    } catch (error) {
      console.error('Error loading project:', error)
      toast.error('Error loading project')
      router.push('/projects')
    } finally {
      setIsLoading(false)
    }
  }

  const saveProject = async () => {
    if (!projectName.trim()) {
      toast.error("Project name is required")
      return
    }

    setIsSaving(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push("/login")
        return
      }

      const { data: updatedProject, error } = await supabase
        .from('projects')
        .update({
          name: projectName.trim(),
          description: projectDescription.trim(),
          global_styles: globalStyles,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .eq('user_id', session.user.id)
        .select()
        .single()

      if (error) {
        console.error('Error saving project:', error)
        toast.error('Failed to save project settings')
        return
      }

      if (updatedProject) {
        setProject(updatedProject)
        toast.success('Project settings saved successfully!')
      }
    } catch (error) {
      console.error('Error saving project:', error)
      toast.error('Failed to save project settings')
    } finally {
      setIsSaving(false)
    }
  }

  const updateGlobalStyle = (key: keyof ProjectGlobalStyles, value: string) => {
    setGlobalStyles(prev => ({ ...prev, [key]: value }))
  }

  const fontFamilyOptions = [
    "Work Sans, sans-serif",
    "Arial, sans-serif",
    "Helvetica, sans-serif",
    "Georgia, serif",
    "Times New Roman, serif",
    "Verdana, sans-serif",
    "Trebuchet MS, sans-serif",
    "Courier New, monospace"
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading project settings...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-red-500 mb-4">
                <h3 className="text-lg font-medium mb-2">Project Not Found</h3>
                <p className="text-sm">The project you're looking for doesn't exist.</p>
              </div>
              <Button onClick={() => router.push("/projects")}>
                Back to Projects
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push("/projects")}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Projects</span>
              </Button>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Project Settings
              </h1>
            </div>
            <Button 
              onClick={saveProject}
              disabled={isSaving}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Project Information */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>
                Basic information about your project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="projectDescription">Description</Label>
                <Textarea
                  id="projectDescription"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Enter project description (optional)"
                  className="mt-1"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Global Styles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Global Styles</span>
              </CardTitle>
              <CardDescription>
                These styles will be automatically applied to all new templates in this project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={globalStyles.primaryColor}
                      onChange={(e) => updateGlobalStyle('primaryColor', e.target.value)}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={globalStyles.primaryColor}
                      onChange={(e) => updateGlobalStyle('primaryColor', e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={globalStyles.secondaryColor}
                      onChange={(e) => updateGlobalStyle('secondaryColor', e.target.value)}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={globalStyles.secondaryColor}
                      onChange={(e) => updateGlobalStyle('secondaryColor', e.target.value)}
                      placeholder="#64748b"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="backgroundColor">Background Color</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={globalStyles.backgroundColor}
                      onChange={(e) => updateGlobalStyle('backgroundColor', e.target.value)}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={globalStyles.backgroundColor}
                      onChange={(e) => updateGlobalStyle('backgroundColor', e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="textColor">Text Color</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      id="textColor"
                      type="color"
                      value={globalStyles.textColor}
                      onChange={(e) => updateGlobalStyle('textColor', e.target.value)}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={globalStyles.textColor}
                      onChange={(e) => updateGlobalStyle('textColor', e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Typography */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fontFamily">Font Family</Label>
                  <select
                    id="fontFamily"
                    value={globalStyles.fontFamily}
                    onChange={(e) => updateGlobalStyle('fontFamily', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {fontFamilyOptions.map((font) => (
                      <option key={font} value={font}>
                        {font.split(',')[0]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="fontSize">Default Font Size</Label>
                  <Input
                    id="fontSize"
                    value={globalStyles.fontSize}
                    onChange={(e) => updateGlobalStyle('fontSize', e.target.value)}
                    placeholder="16px"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Preview */}
              <div>
                <Label>Style Preview</Label>
                <div 
                  className="mt-2 p-4 border rounded-lg"
                  style={{
                    backgroundColor: globalStyles.backgroundColor,
                    color: globalStyles.textColor,
                    fontFamily: globalStyles.fontFamily,
                    fontSize: globalStyles.fontSize
                  }}
                >
                  <h3 style={{ color: globalStyles.primaryColor, marginBottom: '8px', fontSize: '1.2em', fontWeight: 'bold' }}>
                    Sample Email Header
                  </h3>
                  <p style={{ marginBottom: '8px' }}>
                    This is how your email content will look with the current global styles.
                  </p>
                  <p style={{ color: globalStyles.secondaryColor, fontSize: '0.9em' }}>
                    Secondary text appears in the secondary color.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}