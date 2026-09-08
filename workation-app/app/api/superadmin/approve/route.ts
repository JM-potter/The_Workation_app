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

    const { data: updated, error } = await supabase
      .from('users')
      .update({ status: 'approved' })
      .eq('id', userId)
      .eq('role', 'hr')
      .eq('status', 'pending')
      .select('id')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!updated) {
      return NextResponse.json({ error: '승인 대기 중인 기업 가입 요청이 아닙니다.' }, { status: 409 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const known = err instanceof MembershipError
    return NextResponse.json({ error: known ? err.message : '승인 요청을 처리하지 못했습니다.' }, { status: known ? err.status : 500 })
  }
}
