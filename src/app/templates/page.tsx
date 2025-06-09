"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit, Trash2, Plus, ArrowLeft } from "lucide-react"
import { supabase, Template, Project } from "@/lib/supabase"
import { toast } from "sonner"

export default function TemplatesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')
  const [templates, setTemplates] = useState<Template[]>([])
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) {
      router.push('/projects')
      return
    }

    const loadData = async () => {
      try {
        // Load project
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single()

        if (projectError || !projectData) {
          console.error('Error loading project:', projectError)
          toast.error('Project not found')
          router.push('/projects')
          return
        }

        setProject(projectData)

        // Load templates for this project
        const { data: templatesData, error: templatesError } = await supabase
          .from('templates')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })

        if (templatesError) {
          console.error('Error loading templates:', templatesError)
          toast.error('Failed to load templates')
        } else {
          setTemplates(templatesData || [])
        }
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [projectId, router])

  const deleteTemplate = async (templateId: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      try {
        const { error } = await supabase
          .from('templates')
          .delete()
          .eq('id', templateId)

        if (error) {
          console.error('Error deleting template:', error)
          toast.error('Failed to delete template')
        } else {
          // Update local state
          setTemplates(templates.filter(template => template.id !== templateId))
          toast.success('Template deleted successfully')
        }
      } catch (error) {
        console.error("Error deleting template:", error)
        toast.error('Failed to delete template')
      }
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    } catch {
      return "Unknown"
    }
  }

  if (loading || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading templates...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push(`/dashboard?project=${project.id}`)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div className="border-l border-gray-300 h-6"></div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Templates</h1>
                <p className="text-sm text-gray-600">{project.name}</p>
              </div>
            </div>
            <Button 
              onClick={() => router.push(`/editor?project=${project.id}`)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Template</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {templates.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-500 dark:text-gray-400 mb-4">
                <Edit className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No templates found</h3>
                <p className="text-sm">Create your first email template to get started.</p>
              </div>
              <Button onClick={() => router.push("/editor")}>
                Create Your First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg truncate">
                        {template.name || "Untitled Template"}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {template.components?.length || 0} components
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {template.components?.filter(c => c.type === "text").length || 0} text,{" "}
                      {template.components?.filter(c => c.type === "image").length || 0} images
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div>Created: {formatDate(template.created_at)}</div>
                      {template.updated_at && template.updated_at !== template.created_at && (
                        <div>Updated: {formatDate(template.updated_at)}</div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => router.push(`/templates/${template.id}?project=${project.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => router.push(`/editor?project=${project.id}&template=${template.id}`)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => deleteTemplate(template.id)}
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