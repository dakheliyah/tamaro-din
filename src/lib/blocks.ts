import { supabase, Block, BlockItem } from './supabase'

// Re-export types for external use
export type { Block, BlockItem } from './supabase'

// Block CRUD operations
export class BlockService {
  // Create a new block
  static async createBlock(data: {
    name: string
    description: string
    structure: Block['structure']
  }): Promise<{ data: Block | null; error: any }> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        return { data: null, error: 'User not authenticated' }
      }

      const { data: block, error } = await supabase
        .from('blocks')
        .insert({
          user_id: user.id,
          name: data.name,
          description: data.description,
          structure: data.structure
        })
        .select()
        .single()

      return { data: block, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get all blocks for current user
  static async getUserBlocks(): Promise<{ data: Block[] | null; error: any }> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        return { data: null, error: 'User not authenticated' }
      }

      const { data: blocks, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      return { data: blocks, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  static async getBlock(id: string) {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('Not authenticated')

    return await supabase
      .from('blocks')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.user.id)
      .single()
  }

  static async getBlockWithItems(id: string) {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('Not authenticated')

    const { data: block, error: blockError } = await supabase
      .from('blocks')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.user.id)
      .single()

    if (blockError || !block) {
      return { data: null, error: blockError }
    }

    const { data: items, error: itemsError } = await supabase
      .from('block_items')
      .select('*')
      .eq('block_id', id)
      .order('row_index', { ascending: true })
      .order('column_index', { ascending: true })

    if (itemsError) {
      return { data: null, error: itemsError }
    }

    return {
      data: {
        ...block,
        items: items || []
      },
      error: null
    }
  }

  // Update block
  static async updateBlock(blockId: string, data: Partial<Block>): Promise<{ 
    data: Block | null; 
    error: any 
  }> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        return { data: null, error: 'User not authenticated' }
      }

      const { data: block, error } = await supabase
        .from('blocks')
        .update(data)
        .eq('id', blockId)
        .eq('user_id', user.id)
        .select()
        .single()

      return { data: block, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Delete block
  static async deleteBlock(blockId: string): Promise<{ error: any }> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        return { error: 'User not authenticated' }
      }

      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('id', blockId)
        .eq('user_id', user.id)

      return { error }
    } catch (error) {
      return { error }
    }
  }
}

// Block Item CRUD operations
export class BlockItemService {
  // Create block item
  static async createBlockItem(data: {
    block_id: string
    row_index: number
    column_index: number
    type: 'text' | 'image'
    content: string
    styles?: BlockItem['styles']
  }): Promise<{ data: BlockItem | null; error: any }> {
    try {
      const { data: item, error } = await supabase
        .from('block_items')
        .insert({
          block_id: data.block_id,
          row_index: data.row_index,
          column_index: data.column_index,
          type: data.type,
          content: data.content,
          styles: data.styles || {}
        })
        .select()
        .single()

      return { data: item, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Update block item
  static async updateBlockItem(itemId: string, data: Partial<BlockItem>): Promise<{ 
    data: BlockItem | null; 
    error: any 
  }> {
    try {
      const { data: item, error } = await supabase
        .from('block_items')
        .update(data)
        .eq('id', itemId)
        .select()
        .single()

      return { data: item, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Delete block item
  static async deleteBlockItem(itemId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('block_items')
        .delete()
        .eq('id', itemId)

      return { error }
    } catch (error) {
      return { error }
    }
  }

  // Bulk update block items (useful for reordering)
  static async bulkUpdateBlockItems(items: Array<{
    id: string
    row_index?: number
    column_index?: number
    content?: string
    styles?: BlockItem['styles']
  }>): Promise<{ data: BlockItem[] | null; error: any }> {
    try {
      const updates = items.map(item => 
        supabase
          .from('block_items')
          .update({
            ...(item.row_index !== undefined && { row_index: item.row_index }),
            ...(item.column_index !== undefined && { column_index: item.column_index }),
            ...(item.content !== undefined && { content: item.content }),
            ...(item.styles !== undefined && { styles: item.styles })
          })
          .eq('id', item.id)
          .select()
          .single()
      )

      const results = await Promise.all(updates)
      const errors = results.filter(result => result.error)
      
      if (errors.length > 0) {
        return { data: null, error: errors[0].error }
      }

      const data = results.map(result => result.data).filter(Boolean) as BlockItem[]
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}

// Utility functions
export const BlockUtils = {
  // Generate a default block structure
  createDefaultStructure: (): Block['structure'] => ({
    rows: [
      {
        columns: 1,
        alignment: 'left' as const
      }
    ]
  }),

  // Validate block structure
  validateStructure: (structure: any): structure is Block['structure'] => {
    if (!structure || typeof structure !== 'object') return false
    if (!Array.isArray(structure.rows)) return false
    
    return structure.rows.every((row: any) => 
      typeof row === 'object' &&
      typeof row.columns === 'number' &&
      row.columns > 0 &&
      row.columns <= 12 && // Max 12 columns
      ['left', 'center', 'right'].includes(row.alignment)
    )
  },

  // Calculate total cells in a block structure
  getTotalCells: (structure: Block['structure']): number => {
    return structure.rows.reduce((total, row) => total + row.columns, 0)
  },

  // Get cell position for a given row and column
  getCellPosition: (structure: Block['structure'], rowIndex: number, columnIndex: number): {
    isValid: boolean
    cellNumber?: number
  } => {
    if (rowIndex < 0 || rowIndex >= structure.rows.length) {
      return { isValid: false }
    }

    const row = structure.rows[rowIndex]
    if (columnIndex < 0 || columnIndex >= row.columns) {
      return { isValid: false }
    }

    let cellNumber = 0
    for (let i = 0; i < rowIndex; i++) {
      cellNumber += structure.rows[i].columns
    }
    cellNumber += columnIndex

    return { isValid: true, cellNumber }
  }
}