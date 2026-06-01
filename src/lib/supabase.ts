import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fvavylwbqfcfzoopxknk.supabase.co'

const supabaseAnonKey = 'sb_publishable_SUuvzaxjSu_sRZ-_LFUA3g_UfiV3Clb'

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)