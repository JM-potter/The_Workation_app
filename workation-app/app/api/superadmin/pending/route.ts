import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic' // Vercel 캐싱 강제 비활성화 (항상 최신 데이터 가져오기)

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwuxojmyxjqdzthvludo.supabase.co'
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseKey) {
    return NextResponse.json({ error: 'Missing Service Role Key' }, { status: 500 })
  }

  // 서비스 롤 키(마스터키)를 사용하여 클라이언트 생성 (RLS 우회)
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('status', 'pending')
    .eq('role', 'hr')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    debugUrl: supabaseUrl,
    debugKey: supabaseKey ? supabaseKey.split('.')[1] : 'MISSING',
    data: data
  })
}
