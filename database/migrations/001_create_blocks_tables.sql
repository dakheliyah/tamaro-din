-- Create blocks table
CREATE TABLE IF NOT EXISTS blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  structure JSONB NOT NULL DEFAULT '{"rows": []}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create block_items table
CREATE TABLE IF NOT EXISTS block_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  block_id UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL DEFAULT 0,
  column_index INTEGER NOT NULL DEFAULT 0,
  type VARCHAR(20) NOT NULL CHECK (type IN ('text', 'image')),
  content TEXT NOT NULL DEFAULT '',
  styles JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blocks_user_id ON blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_blocks_created_at ON blocks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_block_items_block_id ON block_items(block_id);
CREATE INDEX IF NOT EXISTS idx_block_items_position ON block_items(block_id, row_index, column_index);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_blocks_updated_at
  BEFORE UPDATE ON blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_block_items_updated_at
  BEFORE UPDATE ON block_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for blocks
CREATE POLICY "Users can view their own blocks" ON blocks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own blocks" ON blocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blocks" ON blocks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blocks" ON blocks
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for block_items
CREATE POLICY "Users can view their own block items" ON block_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM blocks 
      WHERE blocks.id = block_items.block_id 
      AND blocks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own block items" ON block_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM blocks 
      WHERE blocks.id = block_items.block_id 
      AND blocks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own block items" ON block_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM blocks 
      WHERE blocks.id = block_items.block_id 
      AND blocks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own block items" ON block_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM blocks 
      WHERE blocks.id = block_items.block_id 
      AND blocks.user_id = auth.uid()
    )
  );