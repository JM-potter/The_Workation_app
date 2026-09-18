import { NextResponse } from 'next/server'
import { membershipAdmin, MembershipError, requireSuperAdmin } from '@/lib/server-membership'

export const dynamic = 'force-dynamic' // Vercel 캐싱 강제 비활성화 (항상 최신 데이터 가져오기)

export async function GET(request: Request) {
  try {
    const supabase = membershipAdmin()
    await requireSuperAdmin(request, supabase)
    const { data, error } = await supabase
      .from('users')
      .select('id,name,email,company_name,status,phone_number')
      .eq('status', 'pending')
      .eq('role', 'hr')
    if (error) throw new MembershipError('가입 요청을 불러오지 못했습니다.')
    return NextResponse.json(data || [], { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const known = error instanceof MembershipError
    return NextResponse.json({ error: known ? error.message : '가입 요청을 불러오지 못했습니다.' }, { status: known ? error.status : 500 })
  }
}
