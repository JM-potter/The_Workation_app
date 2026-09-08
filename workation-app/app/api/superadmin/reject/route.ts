import { NextResponse } from 'next/server'
import { membershipAdmin, MembershipError, requireSuperAdmin } from '@/lib/server-membership'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    if (typeof userId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(userId)) {
      return NextResponse.json({ error: '가입 요청 정보를 확인해 주세요.' }, { status: 400 })
    }
    const supabase = membershipAdmin()
    await requireSuperAdmin(request, supabase)

    // 1. 공개 테이블에서 먼저 삭제
    const { data: pendingHr, error: lookupError } = await supabase.from('users').select('id').eq('id', userId).eq('role', 'hr').eq('status', 'pending').maybeSingle()
    if (lookupError) throw new MembershipError('가입 요청을 확인하지 못했습니다.')
    if (!pendingHr) return NextResponse.json({ error: '승인 대기 중인 기업 가입 요청이 아닙니다.' }, { status: 409 })
    const { error: dbError } = await supabase.from('users').delete().eq('id', userId)
    if (dbError) throw new MembershipError('가입 요청을 삭제하지 못했습니다.')

    // 2. Auth(비밀) 테이블에서 완전히 계정 삭제 (마스터키 권한 필수)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)
    
    // 에러가 났는데 그게 "유저를 찾을 수 없음(하드코딩된 가짜 데이터)"인 경우는 무시하고 성공 처리
    if (authError && authError.status !== 404) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const known = err instanceof MembershipError
    return NextResponse.json({ error: known ? err.message : '가입 요청을 처리하지 못했습니다.' }, { status: known ? err.status : 500 })
  }
}
