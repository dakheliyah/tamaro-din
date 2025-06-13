'use client'

import { Block, BlockItem } from '@/lib/blocks'
import { Card, CardContent } from '@/components/ui/card'
import { Grid } from 'lucide-react'

interface BlockPreviewProps {
  block: Block & { items: BlockItem[] }
  className?: string
  showTitle?: boolean
  interactive?: boolean
  onItemClick?: (item: BlockItem) => void
}

export function BlockPreview({ 
  block, 
  className = '', 
  showTitle = false, 
  interactive = false,
  onItemClick 
}: BlockPreviewProps) {
  const getItemsInCell = (rowIndex: number, columnIndex: number) => {
    return block.items.filter(item => 
      item.row_index === rowIndex && item.column_index === columnIndex
    )
  }

  return (
    <Card className={`${className} ${interactive ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}>
      {showTitle && (
        <div className="p-3 border-b bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center space-x-2">
            <Grid className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-sm">{block.name}</span>
          </div>
          {block.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {block.description}
            </p>
          )}
        </div>
      )}
      
      <CardContent className="p-4">
        <div className="space-y-0">
          {block.structure.rows.map((row, rowIndex) => {
            const rowPadding = row.padding || { top: 0, right: 0, bottom: 0, left: 0 }
            
            return (
              <div 
                key={rowIndex} 
                className="grid gap-0"
                style={{ 
                  gridTemplateColumns: `repeat(${row.columns}, 1fr)`,
                  padding: `${rowPadding.top}px ${rowPadding.right}px ${rowPadding.bottom}px ${rowPadding.left}px`
                }}
              >
                {Array.from({ length: row.columns }).map((_, columnIndex) => {
                  const cellItems = getItemsInCell(rowIndex, columnIndex)
                  const columnSettings = row.columnSettings?.[columnIndex] || {
                    horizontalAlign: 'left',
                    verticalAlign: 'top',
                    padding: { top: 0, right: 0, bottom: 0, left: 0 }
                  }
                  
                  const columnPadding = columnSettings.padding || { top: 0, right: 0, bottom: 0, left: 0 }
                  const justifyContent = columnSettings.verticalAlign === 'top' ? 'flex-start' : 
                                       columnSettings.verticalAlign === 'center' ? 'center' : 'flex-end'
                  const alignItems = columnSettings.horizontalAlign === 'left' ? 'flex-start' : 
                                   columnSettings.horizontalAlign === 'center' ? 'center' : 'flex-end'
                  
                  return (
                    <div
                      key={columnIndex}
                      className="min-h-12 rounded border border-gray-200 dark:border-gray-700 flex flex-col"
                      style={{ 
                        justifyContent,
                        alignItems,
                        padding: `${columnPadding.top}px ${columnPadding.right}px ${columnPadding.bottom}px ${columnPadding.left}px`
                      }}
                    >
                      {cellItems.length === 0 ? (
                        <div className="text-center text-gray-400 dark:text-gray-500 text-xs py-2">
                          Empty
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {cellItems.map((item) => (
                            <div 
                              key={item.id} 
                              className={`${interactive && onItemClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded p-1' : ''}`}
                              onClick={() => interactive && onItemClick && onItemClick(item)}
                            >
                              {item.type === 'text' ? (
                                <div 
                                  className="text-xs leading-relaxed"
                                  style={{
                                    fontSize: item.styles.fontSize ? `calc(${item.styles.fontSize} * 0.8)` : '11px',
                                    color: item.styles.color || '#000',
                                    fontWeight: item.styles.fontWeight || 'normal',
                                    textAlign: item.styles.textAlign || 'left'
                                  }}
                                >
                                  {item.content.length > 50 
                                    ? `${item.content.substring(0, 50)}...` 
                                    : item.content
                                  }
                                </div>
                              ) : (
                                <div className="flex justify-center">
                                  <img
                                    src={item.content}
                                    alt="Block image"
                                    className="max-w-full h-auto rounded max-h-16 object-cover"
                                    style={{
                                      width: item.styles.width ? `calc(${item.styles.width} * 0.5)` : 'auto',
                                      maxWidth: '100%'
                                    }}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.style.display = 'none'
                                      target.nextElementSibling?.classList.remove('hidden')
                                    }}
                                  />
                                  <div className="hidden text-gray-400 text-xs p-2 border border-gray-200 rounded bg-gray-50">
                                    📷 Image
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
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default BlockPreview