import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwuxojmyxjqdzthvludo.supabase.co'
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseKey) {
      return NextResponse.json({ error: 'Missing Service Role Key' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 1. 공개 테이블에서 먼저 삭제
    const { error: dbError } = await supabase.from('users').delete().eq('id', userId)
    if (dbError) {
      console.error('Error deleting from public.users:', dbError)
    }

    // 2. Auth(비밀) 테이블에서 완전히 계정 삭제 (마스터키 권한 필수)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
