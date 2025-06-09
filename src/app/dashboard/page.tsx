"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Settings, Palette } from "lucide-react"
import { supabase, Project, Template } from '@/lib/supabase'

interface User {
  email: string
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<Project | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])

  useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem('userEmail')
      
      if (!userData) {
        router.push('/login')
        return
      }

      setUser({ email: userData })
    }

    const loadData = async () => {
      if (!projectId) {
        router.push('/projects')
        return
      }

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

        // Load templates for this project
        const { data: templatesData, error: templatesError } = await supabase
          .from('templates')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })

        if (templatesError) {
          console.error('Error loading templates:', templatesError)
        } else {
          setTemplates(templatesData || [])
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
    loadData()
  }, [router, projectId])

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('userEmail')
    router.push('/login')
  }

  if (loading || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
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
                onClick={() => router.push('/projects')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Projects</span>
              </Button>
              <div className="border-l border-gray-300 h-6"></div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">{project.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/projects/${project.id}/settings`)}
                className="flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Project Settings</span>
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Welcome, {user?.email}
              </span>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Overview */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Project Overview</span>
              </CardTitle>
              <CardDescription>
                Global styles and project information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-600">Templates</div>
                  <div className="text-2xl font-bold">{templates.length}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">Primary Color</div>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: project.global_styles.primaryColor }}
                    ></div>
                    <span className="text-sm font-mono">{project.global_styles.primaryColor}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">Font Family</div>
                  <div className="text-sm">{project.global_styles.fontFamily}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Template Editor Card */}
          <Card>
            <CardHeader>
              <CardTitle>Template Editor</CardTitle>
              <CardDescription>
                Create new email templates with project styling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => router.push(`/editor?project=${project.id}`)}
              >
                Create Template
              </Button>
            </CardContent>
          </Card>

          {/* Email Templates Card */}
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Manage templates for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{templates.length}</div>
                <div className="text-sm text-gray-600">Project templates</div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/templates?project=${project.id}`)}
                >
                  View All
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Template Library Card */}
          <Card>
            <CardHeader>
              <CardTitle>Template Library</CardTitle>
              <CardDescription>
                Browse pre-built templates for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Assets Card */}
          <Card>
            <CardHeader>
              <CardTitle>Project Assets</CardTitle>
              <CardDescription>
                Manage images and assets for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Templates */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Templates</CardTitle>
              <CardDescription>
                Latest templates in this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templates.length > 0 ? (
                <div className="space-y-3">
                  {templates.slice(0, 5).map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-gray-600">
                          {template.components?.length || 0} components •
                          Updated {new Date(template.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/templates/${template.id}?project=${project.id}`)}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/editor?project=${project.id}&template=${template.id}`)}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No templates created yet. Start by creating your first template!
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
}