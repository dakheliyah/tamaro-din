import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bzinnenqdcjxoevbxkkh.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key-here'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  description: string
  global_styles: {
    primaryColor: string
    secondaryColor: string
    fontFamily: string
    fontSize: string
    backgroundColor: string
    textColor: string
  }
  created_at: string
  updated_at: string
}

export interface Template {
  id: string
  project_id: string
  name: string
  components: EmailComponent[]
  created_at: string
  updated_at: string
}

export interface EmailComponent {
  id: string
  type: "text" | "image"
  content: string
  fontSize?: string
  color?: string
  textAlign?: string
  width?: string
  height?: string
  order: number
}