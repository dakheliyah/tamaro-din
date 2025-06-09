'use client'

import { useState, useEffect } from 'react'
import { Block, BlockItem, BlockService } from '@/lib/blocks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Search, Grid, Plus, Calendar, Layers } from 'lucide-react'
import { toast } from 'sonner'
import { BlockPreview } from './BlockPreview'

interface BlockWithItems extends Block {
  items: BlockItem[]
}

interface BlockSelectorProps {
  isOpen?: boolean
  onClose?: () => void
  onBlockSelect: (block: BlockWithItems) => void
  onBlockDragStart?: (block: BlockWithItems) => void
  selectedBlockId?: string
  className?: string
}

export function BlockSelector({ isOpen = false, onClose, onBlockSelect, onBlockDragStart, selectedBlockId, className = '' }: BlockSelectorProps) {
  const [blocks, setBlocks] = useState<BlockWithItems[]>([])
  const [filteredBlocks, setFilteredBlocks] = useState<BlockWithItems[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    loadBlocks()
  }, [])

  useEffect(() => {
    filterBlocks()
  }, [blocks, searchQuery])

  const loadBlocks = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await BlockService.getUserBlocks()
      
      if (error) {
        console.error('Error loading blocks:', error)
        toast.error('Failed to load blocks')
        return
      }

      // Load items for each block
      const blocksWithItems: BlockWithItems[] = []
      for (const block of data || []) {
        const { data: blockWithItems, error: itemsError } = await BlockService.getBlockWithItems(block.id)
        if (!itemsError && blockWithItems) {
          blocksWithItems.push(blockWithItems)
        }
      }
      
      setBlocks(blocksWithItems)
    } catch (error) {
      console.error('Error loading blocks:', error)
      toast.error('Failed to load blocks')
    } finally {
      setIsLoading(false)
    }
  }

  const filterBlocks = () => {
    if (!searchQuery.trim()) {
      setFilteredBlocks(blocks)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = blocks.filter(block => 
      block.name.toLowerCase().includes(query) ||
      block.description.toLowerCase().includes(query)
    )
    
    setFilteredBlocks(filtered)
  }

  const handleBlockSelect = (block: BlockWithItems) => {
    onBlockSelect(block)
    setIsDialogOpen(false)
    if (onClose) {
      onClose()
    }
  }

  const handleDragStart = (e: React.DragEvent, block: BlockWithItems) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'block',
      block: block
    }))
    if (onBlockDragStart) {
      onBlockDragStart(block)
    }
  }

  const getBlockStats = (block: BlockWithItems) => {
    const totalCells = block.structure.rows.reduce((sum, row) => sum + row.columns, 0)
    const filledCells = new Set(block.items.map(item => `${item.row_index}-${item.column_index}`)).size
    
    return {
      rows: block.structure.rows.length,
      totalCells,
      filledCells,
      items: block.items.length
    }
  }

  if (!isOpen) {
    return null
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading blocks...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Layers className="h-5 w-5 mr-2 text-blue-600" />
          Content Blocks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search blocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Select a Content Block</DialogTitle>
                <DialogDescription>
                  Choose a block to add to your template. You can drag and drop it into your email layout.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search blocks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <ScrollArea className="h-96">
                  {filteredBlocks.length === 0 ? (
                    <div className="text-center py-8">
                      <Grid className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        {searchQuery ? 'No blocks match your search' : 'No blocks available'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        {!searchQuery && 'Create your first block to get started'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredBlocks.map((block) => {
                        const stats = getBlockStats(block)
                        const isSelected = selectedBlockId === block.id
                        
                        return (
                          <div
                            key={block.id}
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            onClick={() => handleBlockSelect(block)}
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-medium text-sm">{block.name}</h3>
                                  {block.description && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                      {block.description.length > 60 
                                        ? `${block.description.substring(0, 60)}...` 
                                        : block.description
                                      }
                                    </p>
                                  )}
                                </div>
                                {isSelected && (
                                  <Badge variant="default" className="ml-2">
                                    Selected
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                                <span>{stats.rows} row{stats.rows !== 1 ? 's' : ''}</span>
                                <span>{stats.filledCells}/{stats.totalCells} cells</span>
                                <span>{stats.items} item{stats.items !== 1 ? 's' : ''}</span>
                              </div>
                              
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(block.created_at).toLocaleDateString()}
                              </div>
                              
                              <div className="mt-3">
                                <BlockPreview 
                                  block={block} 
                                  className="border-0 shadow-none" 
                                  showTitle={false}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <ScrollArea className="h-64">
          {filteredBlocks.length === 0 ? (
            <div className="text-center py-8">
              <Grid className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {searchQuery ? 'No blocks match your search' : 'No blocks available'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBlocks.map((block) => {
                const stats = getBlockStats(block)
                const isSelected = selectedBlockId === block.id
                
                return (
                  <div
                    key={block.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-sm ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => handleBlockSelect(block)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, block)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm truncate">{block.name}</h3>
                      {isSelected && (
                        <Badge variant="default">
                          Selected
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <span>{stats.rows}r</span>
                      <span>{stats.filledCells}/{stats.totalCells}c</span>
                      <span>{stats.items}i</span>
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      Drag to add to template
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export default BlockSelector