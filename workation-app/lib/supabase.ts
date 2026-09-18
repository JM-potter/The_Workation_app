import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwuxojmyxjqdzthvludo.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_We0xpICRIvqkaJsriQiq3A_Kzppb8T0'

export const supabase = createClient(supabaseUrl.trim(), supabaseKey.trim())

// MVP 솔루션 검증용 로그인 바이패스 설정 (true: 로그인 우회/데모 모드 활성화, false: 실제 로그인 연동)
export const BYPASS_AUTH = false

