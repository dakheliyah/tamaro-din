'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Grid, ArrowLeft, Eye, User } from "lucide-react"
import { toast } from "sonner"
import { BlockService, BlockUtils, Block } from '@/lib/blocks'
import { supabase } from '@/lib/supabase'

export default function BlocksPage() {
  const router = useRouter()
  const [blocks, setBlocks] = useState<Block[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newBlockName, setNewBlockName] = useState("")
  const [newBlockDescription, setNewBlockDescription] = useState("")
  const [user, setUser] = useState<{ email: string; id: string } | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        router.push('/login')
        return
      }

      setUser({ email: user.email || '', id: user.id })
      await loadBlocks()
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/login')
    }
  }

  const loadBlocks = async () => {
    try {
      setIsLoading(true)
      const { data: blocksData, error } = await BlockService.getUserBlocks()

      if (error) {
        console.error('Error loading blocks:', error)
        toast.error('Failed to load blocks')
      } else {
        setBlocks(blocksData || [])
      }
    } catch (error) {
      console.error('Error loading blocks:', error)
      toast.error('Failed to load blocks')
    } finally {
      setIsLoading(false)
    }
  }

  const createBlock = async () => {
    if (!newBlockName.trim()) {
      toast.error('Block name is required')
      return
    }

    try {
      const { data: block, error } = await BlockService.createBlock({
        name: newBlockName.trim(),
        description: newBlockDescription.trim(),
        structure: BlockUtils.createDefaultStructure()
      })

      if (error) {
        console.error('Error creating block:', error)
        toast.error('Failed to create block')
      } else if (block) {
        setBlocks([block, ...blocks])
        setNewBlockName('')
        setNewBlockDescription('')
        setIsCreateDialogOpen(false)
        toast.success('Block created successfully')
      }
    } catch (error) {
      console.error('Error creating block:', error)
      toast.error('Failed to create block')
    }
  }

  const deleteBlock = async (blockId: string) => {
    if (!confirm('Are you sure you want to delete this block? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await BlockService.deleteBlock(blockId)

      if (error) {
        console.error('Error deleting block:', error)
        toast.error('Failed to delete block')
      } else {
        setBlocks(blocks.filter(block => block.id !== blockId))
        toast.success('Block deleted successfully')
      }
    } catch (error) {
      console.error('Error deleting block:', error)
      toast.error('Failed to delete block')
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
      return "Invalid date"
    }
  }

  const getBlockStats = (block: Block) => {
    const totalCells = BlockUtils.getTotalCells(block.structure)
    const rowCount = block.structure.rows.length
    return { totalCells, rowCount }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading blocks...</p>
        </div>
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
                  <Grid className="h-6 w-6 mr-2 text-blue-600" />
                  Global Blocks
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create reusable content blocks for your email templates
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <User className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="text-white">
                    <Plus className="h-4 w-4" />
                    Create Block
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Block</DialogTitle>
                    <DialogDescription>
                      Create a reusable content block that can be used across multiple email templates.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="blockName">Block Name</Label>
                      <Input
                        id="blockName"
                        placeholder="e.g., Header Block, Footer Block"
                        value={newBlockName}
                        onChange={(e) => setNewBlockName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && createBlock()}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="blockDescription">Description (Optional)</Label>
                      <Input
                        id="blockDescription"
                        placeholder="Brief description of this block"
                        value={newBlockDescription}
                        onChange={(e) => setNewBlockDescription(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && createBlock()}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={createBlock}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Create Block
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {blocks.length === 0 ? (
          <div className="text-center py-12">
            <Grid className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No blocks yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Create your first reusable content block to get started. Blocks can contain text, images, and custom layouts.
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Block
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blocks.map((block) => {
              const stats = getBlockStats(block)
              return (
                <Card key={block.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">
                          {block.name}
                        </CardTitle>
                        {block.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {block.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <Grid className="h-4 w-4 mr-1" />
                          {stats.rowCount} row{stats.rowCount !== 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 grid grid-cols-2 gap-px mr-1">
                            <div className="bg-blue-400 rounded-sm"></div>
                            <div className="bg-blue-300 rounded-sm"></div>
                            <div className="bg-blue-300 rounded-sm"></div>
                            <div className="bg-blue-200 rounded-sm"></div>
                          </div>
                          {stats.totalCells} cell{stats.totalCells !== 1 ? 's' : ''}
                        </div>
                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Created: {formatDate(block.created_at)}
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => router.push(`/blocks/${block.id}/edit`)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/blocks/${block.id}/preview`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteBlock(block.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}