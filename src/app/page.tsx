"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Grid, FolderOpen, LogOut, User } from "lucide-react"
import { toast } from "sonner"

export default function Home() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
    const authStatus = localStorage.getItem("isAuthenticated")
    const email = localStorage.getItem("userEmail")
    
    if (authStatus === "true" && email) {
      setIsAuthenticated(true)
      setUserEmail(email)
    } else {
      // Redirect to login page if not authenticated
      router.push("/login")
      return
    }
    
    setIsLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("userEmail")
    toast.success("Logged out successfully")
    router.push("/login")
  }

  const navigateToBlocks = () => {
    router.push("/blocks")
  }

  const navigateToProjects = () => {
    router.push("/projects")
  }

  const navigateToProfile = () => {
    router.push("/profile")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Tamaro Din
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <User className="h-4 w-4" />
                <span>{userEmail}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Your Email Template Builder
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Create beautiful, professional email templates with our intuitive drag-and-drop interface. 
            Choose where you'd like to start:
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Blocks Card */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={navigateToBlocks}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                <Grid className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-2xl">Global Blocks</CardTitle>
              <CardDescription className="text-base">
                Create and manage reusable content blocks
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Build custom blocks with text and images that can be reused across multiple templates. 
                Perfect for headers, footers, and common content sections.
              </p>
              <Button className="w-full" size="lg">
                <Grid className="h-5 w-5 mr-2" />
                Manage Blocks
              </Button>
            </CardContent>
          </Card>

          {/* Projects Card */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={navigateToProjects}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                <FolderOpen className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl">Projects</CardTitle>
              <CardDescription className="text-base">
                Organize your email templates by project
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Create projects to organize your email templates. Each project can have its own 
                styling themes and contain multiple templates for different campaigns.
              </p>
              <Button className="w-full" size="lg">
                <FolderOpen className="h-5 w-5 mr-2" />
                Manage Projects
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats or Recent Activity */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Get Started
          </h3>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            New to the platform? Start by creating your first project to organize your templates, 
            or build some reusable blocks that you can use across multiple email campaigns.
          </p>
        </div>
      </main>
    </div>
  )
}
