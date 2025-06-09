'use client'

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, Save, Plus, Trash2, Move, Type, Image, Grid, AlignLeft, AlignCenter, AlignRight } from "lucide-react"
import { toast } from "sonner"
import { BlockService, BlockItemService, BlockUtils, Block, BlockItem } from '@/lib/blocks'
import { supabase } from '@/lib/supabase'

interface BlockWithItems extends Block {
  items: BlockItem[]
}

export default function BlockEditPage() {
  const router = useRouter()
  const params = useParams()
  const blockId = params.id as string
  
  const [block, setBlock] = useState<BlockWithItems | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false)
  const [newItemType, setNewItemType] = useState<'text' | 'image'>('text')
  const [newItemContent, setNewItemContent] = useState('')
  const [editingItem, setEditingItem] = useState<BlockItem | null>(null)

  useEffect(() => {
    if (blockId) {
      loadBlock()
    }
  }, [blockId])

  const loadBlock = async () => {
    try {
      setIsLoading(true)
      const { data: blockData, error } = await BlockService.getBlockWithItems(blockId)
      
      if (error || !blockData) {
        console.error('Error loading block:', error)
        toast.error('Block not found')
        router.push('/blocks')
        return
      }
      
      setBlock(blockData)
    } catch (error) {
      console.error('Error loading block:', error)
      toast.error('Failed to load block')
      router.push('/blocks')
    } finally {
      setIsLoading(false)
    }
  }

  const saveBlock = async () => {
    if (!block) return
    
    try {
      setIsSaving(true)
      const { error } = await BlockService.updateBlock(block.id, {
        name: block.name,
        description: block.description,
        structure: block.structure
      })
      
      if (error) {
        console.error('Error saving block:', error)
        toast.error('Failed to save block')
      } else {
        toast.success('Block saved successfully')
      }
    } catch (error) {
      console.error('Error saving block:', error)
      toast.error('Failed to save block')
    } finally {
      setIsSaving(false)
    }
  }

  const addRow = () => {
    if (!block) return
    
    const newStructure = {
      ...block.structure,
      rows: [
        ...block.structure.rows,
        { columns: 1, alignment: 'left' as const }
      ]
    }
    
    setBlock({ ...block, structure: newStructure })
  }

  const removeRow = (rowIndex: number) => {
    if (!block || block.structure.rows.length <= 1) return
    
    const newStructure = {
      ...block.structure,
      rows: block.structure.rows.filter((_, index) => index !== rowIndex)
    }
    
    // Remove items in this row
    const newItems = block.items.filter(item => item.row_index !== rowIndex)
      .map(item => ({
        ...item,
        row_index: item.row_index > rowIndex ? item.row_index - 1 : item.row_index
      }))
    
    setBlock({ ...block, structure: newStructure, items: newItems })
  }

  const updateRowColumns = (rowIndex: number, columns: number) => {
    if (!block) return
    
    const newStructure = {
      ...block.structure,
      rows: block.structure.rows.map((row, index) => 
        index === rowIndex ? { ...row, columns } : row
      )
    }
    
    // Remove items that are now out of bounds
    const newItems = block.items.filter(item => 
      item.row_index !== rowIndex || item.column_index < columns
    )
    
    setBlock({ ...block, structure: newStructure, items: newItems })
  }

  const updateRowAlignment = (rowIndex: number, alignment: 'left' | 'center' | 'right') => {
    if (!block) return
    
    const newStructure = {
      ...block.structure,
      rows: block.structure.rows.map((row, index) => 
        index === rowIndex ? { ...row, alignment } : row
      )
    }
    
    setBlock({ ...block, structure: newStructure })
  }

  const addItemToCell = async (rowIndex: number, columnIndex: number) => {
    if (!block || !newItemContent.trim()) {
      toast.error('Content is required')
      return
    }

    try {
      const { data: item, error } = await BlockItemService.createBlockItem({
        block_id: block.id,
        row_index: rowIndex,
        column_index: columnIndex,
        type: newItemType,
        content: newItemContent.trim(),
        styles: {}
      })

      if (error || !item) {
        console.error('Error creating item:', error)
        toast.error('Failed to add item')
        return
      }

      setBlock({ ...block, items: [...block.items, item] })
      setNewItemContent('')
      setIsAddItemDialogOpen(false)
      setSelectedCell(null)
      toast.success('Item added successfully')
    } catch (error) {
      console.error('Error creating item:', error)
      toast.error('Failed to add item')
    }
  }

  const removeItem = async (itemId: string) => {
    if (!block) return

    try {
      const { error } = await BlockItemService.deleteBlockItem(itemId)
      
      if (error) {
        console.error('Error deleting item:', error)
        toast.error('Failed to remove item')
        return
      }

      setBlock({ ...block, items: block.items.filter(item => item.id !== itemId) })
      toast.success('Item removed successfully')
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Failed to remove item')
    }
  }

  const updateItem = async (itemId: string, updates: Partial<BlockItem>) => {
    if (!block) return

    try {
      const { data: updatedItem, error } = await BlockItemService.updateBlockItem(itemId, updates)
      
      if (error || !updatedItem) {
        console.error('Error updating item:', error)
        toast.error('Failed to update item')
        return
      }

      setBlock({
        ...block,
        items: block.items.map(item => item.id === itemId ? updatedItem : item)
      })
      
      setEditingItem(null)
      toast.success('Item updated successfully')
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error('Failed to update item')
    }
  }

  const getItemsInCell = (rowIndex: number, columnIndex: number) => {
    if (!block) return []
    return block.items.filter(item => 
      item.row_index === rowIndex && item.column_index === columnIndex
    )
  }

  const openAddItemDialog = (rowIndex: number, columnIndex: number) => {
    setSelectedCell({ row: rowIndex, col: columnIndex })
    setNewItemType('text')
    setNewItemContent('')
    setIsAddItemDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading block...</p>
        </div>
      </div>
    )
  }

  if (!block) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Block not found</p>
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
                onClick={() => router.push('/blocks')}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blocks
              </Button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <Grid className="h-5 w-5 mr-2 text-blue-600" />
                  Edit Block: {block.name}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={saveBlock}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Block'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Block Settings Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Block Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="blockName">Block Name</Label>
                  <Input
                    id="blockName"
                    value={block.name}
                    onChange={(e) => setBlock({ ...block, name: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="blockDescription">Description</Label>
                  <Textarea
                    id="blockDescription"
                    value={block.description}
                    onChange={(e) => setBlock({ ...block, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Layout Structure</h3>
                    <Button
                      onClick={addRow}
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Row
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {block.structure.rows.map((row, rowIndex) => (
                      <div key={rowIndex} className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Row {rowIndex + 1}</span>
                          {block.structure.rows.length > 1 && (
                            <Button
                              onClick={() => removeRow(rowIndex)}
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Columns</Label>
                            <Select
                              value={row.columns.toString()}
                              onValueChange={(value) => updateRowColumns(rowIndex, parseInt(value))}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5, 6].map(num => (
                                  <SelectItem key={num} value={num.toString()}>
                                    {num} column{num !== 1 ? 's' : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label className="text-xs">Alignment</Label>
                            <div className="flex space-x-1">
                              {[
                                { value: 'left', icon: AlignLeft },
                                { value: 'center', icon: AlignCenter },
                                { value: 'right', icon: AlignRight }
                              ].map(({ value, icon: Icon }) => (
                                <Button
                                  key={value}
                                  onClick={() => updateRowAlignment(rowIndex, value as any)}
                                  size="sm"
                                  variant={row.alignment === value ? "default" : "outline"}
                                  className="h-8 w-8 p-0"
                                >
                                  <Icon className="h-3 w-3" />
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Block Canvas */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Block Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 min-h-96">
                  {block.structure.rows.map((row, rowIndex) => (
                    <div key={rowIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Row {rowIndex + 1} ({row.columns} column{row.columns !== 1 ? 's' : ''}, {row.alignment} aligned)
                        </span>
                      </div>
                      
                      <div 
                        className={`grid gap-4`}
                        style={{ gridTemplateColumns: `repeat(${row.columns}, 1fr)` }}
                      >
                        {Array.from({ length: row.columns }).map((_, columnIndex) => {
                          const cellItems = getItemsInCell(rowIndex, columnIndex)
                          
                          return (
                            <div
                              key={columnIndex}
                              className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg p-4 min-h-24 relative group"
                              style={{ textAlign: row.alignment }}
                            >
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  onClick={() => openAddItemDialog(rowIndex, columnIndex)}
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              {cellItems.length === 0 ? (
                                <div className="text-center text-gray-400 dark:text-gray-500 text-sm">
                                  Click + to add content
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {cellItems.map((item) => (
                                    <div key={item.id} className="group/item relative">
                                      <div className="absolute top-0 right-0 opacity-0 group-hover/item:opacity-100 transition-opacity z-10">
                                        <div className="flex space-x-1">
                                          <Button
                                            onClick={() => setEditingItem(item)}
                                            size="sm"
                                            variant="outline"
                                            className="h-6 w-6 p-0"
                                          >
                                            <Type className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            onClick={() => removeItem(item.id)}
                                            size="sm"
                                            variant="outline"
                                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                      
                                      {item.type === 'text' ? (
                                        <div 
                                          className="text-sm"
                                          style={{
                                            fontSize: item.styles.fontSize || '14px',
                                            color: item.styles.color || '#000',
                                            fontWeight: item.styles.fontWeight || 'normal',
                                            textAlign: item.styles.textAlign || 'left'
                                          }}
                                        >
                                          {item.content}
                                        </div>
                                      ) : (
                                        <div className="flex justify-center">
                                          <img
                                            src={item.content}
                                            alt="Block image"
                                            className="max-w-full h-auto rounded"
                                            style={{
                                              width: item.styles.width || 'auto',
                                              height: item.styles.height || 'auto'
                                            }}
                                            onError={(e) => {
                                              const target = e.target as HTMLImageElement
                                              target.style.display = 'none'
                                              target.nextElementSibling?.classList.remove('hidden')
                                            }}
                                          />
                                          <div className="hidden text-gray-400 text-sm p-4 border border-gray-200 rounded">
                                            Image not found: {item.content}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Content to Cell</DialogTitle>
            <DialogDescription>
              Add text or image content to row {selectedCell?.row ? selectedCell.row + 1 : ''}, column {selectedCell?.col ? selectedCell.col + 1 : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select value={newItemType} onValueChange={(value: 'text' | 'image') => setNewItemType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">
                    <div className="flex items-center">
                      <Type className="h-4 w-4 mr-2" />
                      Text
                    </div>
                  </SelectItem>
                  <SelectItem value="image">
                    <div className="flex items-center">
                      <Image className="h-4 w-4 mr-2" />
                      Image
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="itemContent">
                {newItemType === 'text' ? 'Text Content' : 'Image URL'}
              </Label>
              {newItemType === 'text' ? (
                <Textarea
                  id="itemContent"
                  placeholder="Enter your text content..."
                  value={newItemContent}
                  onChange={(e) => setNewItemContent(e.target.value)}
                  rows={3}
                />
              ) : (
                <Input
                  id="itemContent"
                  placeholder="https://example.com/image.jpg"
                  value={newItemContent}
                  onChange={(e) => setNewItemContent(e.target.value)}
                />
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsAddItemDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedCell && addItemToCell(selectedCell.row, selectedCell.col)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add Content
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit {editingItem.type === 'text' ? 'Text' : 'Image'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editContent">
                  {editingItem.type === 'text' ? 'Text Content' : 'Image URL'}
                </Label>
                {editingItem.type === 'text' ? (
                  <Textarea
                    id="editContent"
                    value={editingItem.content}
                    onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                    rows={3}
                  />
                ) : (
                  <Input
                    id="editContent"
                    value={editingItem.content}
                    onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                  />
                )}
              </div>
              
              {editingItem.type === 'text' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fontSize">Font Size</Label>
                    <Input
                      id="fontSize"
                      placeholder="16px"
                      value={editingItem.styles.fontSize || ''}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        styles: { ...editingItem.styles, fontSize: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Text Color</Label>
                    <Input
                      id="color"
                      placeholder="#000000"
                      value={editingItem.styles.color || ''}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        styles: { ...editingItem.styles, color: e.target.value }
                      })}
                    />
                  </div>
                </div>
              )}
              
              {editingItem.type === 'image' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="width">Width</Label>
                    <Input
                      id="width"
                      placeholder="auto"
                      value={editingItem.styles.width || ''}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        styles: { ...editingItem.styles, width: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Height</Label>
                    <Input
                      id="height"
                      placeholder="auto"
                      value={editingItem.styles.height || ''}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        styles: { ...editingItem.styles, height: e.target.value }
                      })}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setEditingItem(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => updateItem(editingItem.id, {
                  content: editingItem.content,
                  styles: editingItem.styles
                })}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Update
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}