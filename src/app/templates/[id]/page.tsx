"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Copy, Edit, Calendar, Layers } from "lucide-react"
import { toast } from "sonner"
import { supabase, Template, Project, EmailComponent } from "@/lib/supabase"

function TemplateViewContent() {
  const [template, setTemplate] = useState<Template | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const templateId = params.id as string
  const projectId = searchParams.get('project')

  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (!isAuthenticated || isAuthenticated !== "true") {
      router.push("/login")
      return
    }

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
          router.push('/projects')
          return
        }

        setProject(projectData)

        // Load template
        const { data: templateData, error: templateError } = await supabase
          .from('templates')
          .select('*')
          .eq('id', templateId)
          .eq('project_id', projectId)
          .single()

        if (templateError || !templateData) {
          console.error('Error loading template:', templateError)
          setError("Template not found in this project")
        } else {
          setTemplate(templateData)
        }
      } catch (error) {
        console.error('Error loading data:', error)
        setError('Error loading template')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router, templateId, projectId])



  const copyTemplateAsHTML = () => {
    if (!template) return
    
    // Generate HTML from template components
    const sortedComponents = [...template.components].sort((a, b) => a.order - b.order)
    
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${template.name}</title>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
`
    
    sortedComponents.forEach(component => {
      if (component.type === "text") {
        html += `    <div style="margin-bottom: 16px; font-size: ${component.fontSize || '16px'}; color: ${component.color || '#000000'}; text-align: ${component.textAlign || 'left'}; width: 100%;">
      ${component.content || 'Sample text'}
    </div>
`
      } else if (component.type === "image") {
        html += `    <div style="margin-bottom: 16px; width: 100%; text-align: center;">
      <img src="${component.content || 'https://via.placeholder.com/400x200'}" alt="Template Image" style="max-width: 100%; height: ${component.height || 'auto'}; border-radius: 4px;" />
    </div>
`
      }
    })
    
    html += `  </div>
</body>
</html>`
    
    navigator.clipboard.writeText(html).then(() => {
      toast.success("HTML copied to clipboard!")
    }).catch(() => {
      toast.error("Failed to copy HTML")
    })
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    } catch {
      return "Unknown"
    }
  }

  if (isLoading || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading template...</div>
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push(`/dashboard?projectId=${projectId}`)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-red-500 mb-4">
                <h3 className="text-lg font-medium mb-2">Template Not Found</h3>
                <p className="text-sm">{error}</p>
              </div>
              <Button onClick={() => router.push(`/templates?projectId=${projectId}`)}>
                Back to Templates
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const sortedComponents = [...template.components].sort((a, b) => a.order - b.order)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push(`/templates?projectId=${projectId}`)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Templates</span>
              </Button>
              <div className="flex flex-col">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {template.name || "Untitled Template"}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {project.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={copyTemplateAsHTML}
                className="flex items-center space-x-2"
              >
                <Copy className="h-4 w-4" />
                <span>Copy HTML</span>
              </Button>
              <Button 
                onClick={() => router.push(`/editor?template=${template.id}&projectId=${projectId}`)}
                className="flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Template</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Template Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Template Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</label>
                  <p className="text-sm">{template.name || "Untitled Template"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Components</label>
                  <div className="flex space-x-2 mt-1">
                    <Badge variant="secondary">
                      {template.components.filter(c => c.type === "text").length} Text
                    </Badge>
                    <Badge variant="secondary">
                      {template.components.filter(c => c.type === "image").length} Images
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Created</label>
                  <p className="text-sm">{formatDate(template.created_at)}</p>
                </div>
                {template.updated_at && template.updated_at !== template.created_at && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated</label>
                    <p className="text-sm">{formatDate(template.updated_at)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Template Preview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Template Preview</CardTitle>
                <CardDescription>
                  This is how your email template will appear
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white border rounded-lg p-6 min-h-[400px] max-w-[600px] mx-auto shadow-sm">
                  {sortedComponents.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                      <p>This template has no components</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sortedComponents.map((component) => (
                        <div key={component.id} className="w-full">
                          {component.type === "text" ? (
                            <div
                              style={{
                                fontSize: component.fontSize || "16px",
                                color: component.color || "#000000",
                                textAlign: (component.textAlign as any) || "left",
                                width: "100%"
                              }}
                            >
                              {component.content || "Sample text"}
                            </div>
                          ) : (
                            <div className="w-full text-center">
                              <img
                                src={component.content || "https://via.placeholder.com/400x200"}
                                alt="Template Image"
                                style={{
                                  maxWidth: "100%",
                                  height: component.height || "auto",
                                  borderRadius: "4px"
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function TemplateViewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TemplateViewContent />
    </Suspense>
  )
}