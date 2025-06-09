"use client"

import { useState, useRef, useCallback, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Move, Type, Image, Palette, Layout, Save, ArrowLeft } from "lucide-react"
import { supabase, Template, Project } from "@/lib/supabase"
import { toast } from "sonner"

interface EmailComponent {
  id: string
  type: 'text' | 'image'
  content: string
  styles: {
    fontSize?: string
    color?: string
    textAlign?: 'left' | 'center' | 'right'
    width?: string
    height?: string
  }
  order: number
}



function EditorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [components, setComponents] = useState<EmailComponent[]>([])
  const [selectedComponent, setSelectedComponent] = useState<EmailComponent | null>(null)
  const [templateName, setTemplateName] = useState("")
  const [draggedType, setDraggedType] = useState<'text' | 'image' | null>(null)
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null)
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Component templates
  const componentTypes = [
    { type: 'text' as const, label: 'Text Block', icon: '📝' },
    { type: 'image' as const, label: 'Image', icon: '🖼️' }
  ]

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substr(2, 9)

  // Load project and template if provided in URL
  useEffect(() => {
    const projectId = searchParams.get('project')
    const templateId = searchParams.get('template')
    
    if (!projectId) {
      router.push('/projects')
      return
    }
    
    loadProject(projectId)
    
    if (templateId) {
      loadTemplate(templateId, projectId)
    }
  }, [searchParams, router])

  const loadProject = async (projectId: string) => {
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()
      
      if (error || !project) {
        console.error('Error loading project:', error)
        toast.error('Project not found')
        router.push('/projects')
        return
      }
      
      setCurrentProject(project)
    } catch (error) {
      console.error('Error loading project:', error)
      toast.error('Failed to load project')
      router.push('/projects')
    }
  }

  const loadTemplate = async (templateId: string, projectId: string) => {
    try {
      const { data: template, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .eq('project_id', projectId)
        .single()
      
      if (error || !template) {
        console.error('Error loading template:', error)
        toast.error('Template not found')
        return
      }
      
      setCurrentTemplateId(templateId)
      setTemplateName(template.name || 'Untitled Template')
      
      // Convert and apply global styles
      const convertedComponents = template.components.map((comp: any) => {
        const baseStyles = comp.styles || {}
        
        // Apply global styles as defaults
        if (currentProject) {
          if (comp.type === 'text' && !baseStyles.fontFamily) {
            baseStyles.fontFamily = currentProject.global_styles.fontFamily
          }
          if (comp.type === 'text' && !baseStyles.fontSize) {
            baseStyles.fontSize = currentProject.global_styles.fontSize
          }
          if (comp.type === 'text' && !baseStyles.color) {
            baseStyles.color = currentProject.global_styles.textColor
          }
        }
        
        return {
          ...comp,
          styles: baseStyles
        }
      })
      
      setComponents(convertedComponents)
    } catch (error) {
      console.error('Error loading template:', error)
      toast.error('Failed to load template')
    }
  }

  // Handle drag start from sidebar
  const handleDragStart = (type: 'text' | 'image') => {
    setDraggedType(type)
  }

  // Handle drop on canvas
  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedType || !canvasRef.current) return
    
    // Type guard to ensure draggedType is properly typed
    const componentType: 'text' | 'image' = draggedType

    const rect = canvasRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    
    // Find the insertion point based on Y position
    const sortedComponents = [...components].sort((a, b) => a.order - b.order)
    let insertOrder = components.length
    
    // Calculate cumulative heights to determine insertion point
    let cumulativeHeight = 20 // Initial padding
    for (let i = 0; i < sortedComponents.length; i++) {
      const componentHeight = sortedComponents[i].type === 'text' ? 60 : 120 // Approximate heights
      if (y < cumulativeHeight + componentHeight / 2) {
        insertOrder = i
        break
      }
      cumulativeHeight += componentHeight + 16 // 16px gap between components
    }
    
    // Adjust order of existing components
    const updatedComponents = components.map(comp => 
      comp.order >= insertOrder ? { ...comp, order: comp.order + 1 } : comp
    )

    const baseStyles: any = {
      width: '100%',
      height: componentType === 'image' ? '120px' : 'auto'
    }

    // Apply global styles from project
    if (currentProject && componentType === 'text') {
      baseStyles.fontSize = currentProject.global_styles.fontSize
      baseStyles.color = currentProject.global_styles.textColor
      baseStyles.fontFamily = currentProject.global_styles.fontFamily
      baseStyles.textAlign = 'left'
    } else if (componentType === 'text') {
      baseStyles.fontSize = '16px'
      baseStyles.color = '#000000'
      baseStyles.textAlign = 'left'
    }

    const newComponent: EmailComponent = {
      id: generateId(),
      type: componentType,
      content: componentType === 'text' ? 'Click to edit text' : 'https://media-cdn.tripadvisor.com/media/photo-s/21/f4/4b/8f/the-kingsbury-hotel.jpg',
      styles: baseStyles,
      order: insertOrder
    }

    setComponents([...updatedComponents, newComponent])
    setDraggedType(null)
  }, [draggedType, components, currentProject])

  // Handle canvas drag over
  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Select component
  const selectComponent = (component: EmailComponent) => {
    setSelectedComponent(component)
  }

  // Update component content
  const updateComponentContent = (id: string, content: string) => {
    setComponents(prev => prev.map(comp => 
      comp.id === id ? { ...comp, content } : comp
    ))
    if (selectedComponent?.id === id) {
      setSelectedComponent(prev => prev ? { ...prev, content } : null)
    }
  }

  // Update component styles
  const updateComponentStyles = (id: string, styles: Partial<EmailComponent['styles']>) => {
    setComponents(prev => prev.map(comp => 
      comp.id === id ? { ...comp, styles: { ...comp.styles, ...styles } } : comp
    ))
    if (selectedComponent?.id === id) {
      setSelectedComponent(prev => prev ? { ...prev, styles: { ...prev.styles, ...styles } } : null)
    }
  }

  // Move component up or down
  const moveComponent = (id: string, direction: 'up' | 'down') => {
    const sortedComponents = [...components].sort((a, b) => a.order - b.order)
    const currentIndex = sortedComponents.findIndex(comp => comp.id === id)
    
    if (currentIndex === -1) return
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= sortedComponents.length) return
    
    // Swap orders
    const currentComponent = sortedComponents[currentIndex]
    const targetComponent = sortedComponents[targetIndex]
    
    setComponents(prev => prev.map(comp => {
      if (comp.id === currentComponent.id) {
        return { ...comp, order: targetComponent.order }
      }
      if (comp.id === targetComponent.id) {
        return { ...comp, order: currentComponent.order }
      }
      return comp
    }))
  }

  // Delete component
  const deleteComponent = (id: string) => {
    setComponents(prev => prev.filter(comp => comp.id !== id))
    if (selectedComponent?.id === id) {
      setSelectedComponent(null)
    }
  }

  // Save template
  const saveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name')
      return
    }

    if (!currentProject) {
      toast.error('No project selected')
      return
    }

    try {
      const templateData = {
        name: templateName,
        components,
        project_id: currentProject.id
      }

      if (currentTemplateId) {
        // Update existing template
        const { error } = await supabase
          .from('templates')
          .update(templateData)
          .eq('id', currentTemplateId)

        if (error) {
          console.error('Error updating template:', error)
          toast.error('Failed to update template')
        } else {
          toast.success('Template updated successfully!')
        }
      } else {
        // Create new template
        const { data, error } = await supabase
          .from('templates')
          .insert([templateData])
          .select()
          .single()

        if (error) {
          console.error('Error creating template:', error)
          toast.error('Failed to create template')
        } else {
          setCurrentTemplateId(data.id)
          toast.success('Template created successfully!')
        }
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
    }
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading project...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push(`/dashboard?project=${currentProject.id}`)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
            <div className="border-l border-gray-300 h-6"></div>
            <div>
              <h1 className="text-lg font-semibold">
                {templateName || 'New Template'} 
                <span className="text-sm font-normal text-gray-600 ml-2">in {currentProject.name}</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-600">
              Project Styles: 
              <span className="font-mono ml-1">{currentProject.global_styles.fontFamily}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
      {/* Sidebar - Component Palette */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Components</h2>
          <div className="space-y-2">
            {componentTypes.map((type) => (
              <div
                key={type.type}
                draggable
                onDragStart={() => handleDragStart(type.type)}
                className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-grab hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span className="text-xl">{type.icon}</span>
                <span className="text-sm font-medium">{type.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Template Actions */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="templateName">Template Name</Label>
            <Input
              id="templateName"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button onClick={saveTemplate} className="w-full">
            {currentTemplateId ? 'Update Template' : 'Save Template'}
          </Button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Email Template Editor</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                Preview
              </Button>
              <Button variant="outline" size="sm">
                Export HTML
              </Button>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-2xl mx-auto">
            <div
              ref={canvasRef}
              onDrop={handleCanvasDrop}
              onDragOver={handleCanvasDragOver}
              className="relative bg-white border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg min-h-[600px] w-full max-w-[600px] mx-auto"
              style={{ minHeight: '600px' }}
            >
              {components.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <p className="text-lg mb-2">Drag components here to start building</p>
                    <p className="text-sm">Maximum width: 600px (email standard)</p>
                  </div>
                </div>
              )}

              <div className="p-5 space-y-4">
                {[...components]
                  .sort((a, b) => a.order - b.order)
                  .map((component, index) => (
                    <div
                      key={component.id}
                      className={`relative cursor-pointer border-2 rounded-lg transition-all ${
                        selectedComponent?.id === component.id
                          ? 'border-blue-500 shadow-lg'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                      onClick={() => selectComponent(component)}
                    >
                      {/* Component Controls */}
                      {selectedComponent?.id === component.id && (
                        <div className="absolute -top-10 right-0 flex gap-1 z-10">
                          {index > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                moveComponent(component.id, 'up')
                              }}
                              className="h-8 w-8 p-0"
                            >
                              ↑
                            </Button>
                          )}
                          {index < components.length - 1 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                moveComponent(component.id, 'down')
                              }}
                              className="h-8 w-8 p-0"
                            >
                              ↓
                            </Button>
                          )}
                        </div>
                      )}
                      
                      {component.type === 'text' ? (
                        <div
                          style={{
                            fontSize: component.styles.fontSize,
                            color: component.styles.color,
                            textAlign: component.styles.textAlign
                          }}
                          className="p-4 min-h-[60px] w-full bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          {component.content}
                        </div>
                      ) : (
                        <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
                          <img
                            src={component.content}
                            alt="Email component"
                            className="w-full object-cover"
                            style={{
                              height: component.styles.height
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-semibold mb-4">Properties</h2>
        
        {selectedComponent ? (
          <div className="space-y-4">
            <div>
              <Label>Content</Label>
              {selectedComponent.type === 'text' ? (
                <Textarea
                  value={selectedComponent.content}
                  onChange={(e) => updateComponentContent(selectedComponent.id, e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              ) : (
                <Input
                  value={selectedComponent.content}
                  onChange={(e) => updateComponentContent(selectedComponent.id, e.target.value)}
                  placeholder="Image URL"
                  className="mt-1"
                />
              )}
            </div>

            {selectedComponent.type === 'text' && (
              <>
                <div>
                  <Label>Font Size</Label>
                  <Input
                    value={selectedComponent.styles.fontSize || '16px'}
                    onChange={(e) => updateComponentStyles(selectedComponent.id, { fontSize: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <Input
                    type="color"
                    value={selectedComponent.styles.color || '#000000'}
                    onChange={(e) => updateComponentStyles(selectedComponent.id, { color: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Text Align</Label>
                  <select
                    value={selectedComponent.styles.textAlign || 'left'}
                    onChange={(e) => updateComponentStyles(selectedComponent.id, { textAlign: e.target.value as 'left' | 'center' | 'right' })}
                    className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </>
            )}

            {selectedComponent.type === 'image' && (
              <div>
                <Label>Height</Label>
                <Input
                  value={selectedComponent.styles.height || '120px'}
                  onChange={(e) => updateComponentStyles(selectedComponent.id, { height: e.target.value })}
                  className="mt-1"
                  placeholder="e.g., 120px, 200px"
                />
              </div>
            )}

            <Button
              variant="destructive"
              onClick={() => deleteComponent(selectedComponent.id)}
              className="w-full"
            >
              Delete Component
            </Button>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">Select a component to edit its properties</p>
        )}
      </div>
      </div>
    </div>
  )
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditorContent />
    </Suspense>
  )
}