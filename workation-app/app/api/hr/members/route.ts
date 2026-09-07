import { NextResponse } from 'next/server'
import { authenticatedMember, canApproveEmployee, membershipAdmin, MembershipError, requireApprovedHr } from '@/lib/server-membership'
export const dynamic = 'force-dynamic'
const fail = (e: unknown) => NextResponse.json({ error: e instanceof MembershipError ? e.message : '승인 요청을 처리하지 못했습니다.' }, { status: e instanceof MembershipError ? e.status : 500, headers: { 'Cache-Control': 'no-store' } })
export async function GET(request: Request) {
  try {
    const db = membershipAdmin(), hr = await authenticatedMember(request, db), company = requireApprovedHr(hr)
    const { data, error } = await db.from('users').select('id,name,email,role,status,company_name').eq('role','emp').eq('company_name',company).in('status',['pending','approved']).order('name')
    if (error) throw new MembershipError('직원 신청 목록을 불러오지 못했습니다.')
    return NextResponse.json({ company, members: data || [] }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) { return fail(e) }
}
export async function POST(request: Request) {
  try {
    const db = membershipAdmin(), hr = await authenticatedMember(request, db); requireApprovedHr(hr)
    let body: { userId?: unknown }
    try { body = await request.json() } catch { throw new MembershipError('올바른 승인 요청이 아닙니다.',400) }
    if (!body || typeof body.userId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(body.userId)) throw new MembershipError('직원 정보를 확인해 주세요.',400)
    const { data: employee, error } = await db.from('users').select('id,name,email,role,status,company_name').eq('id',body.userId).maybeSingle()
    if (error) throw new MembershipError('직원 정보를 확인하지 못했습니다.')
    if (!employee || !canApproveEmployee(hr,employee)) throw new MembershipError('소속 회사의 직원 신청만 승인할 수 있습니다.',403)
    if (employee.status === 'approved') return NextResponse.json({ success: true })
    if (employee.status !== 'pending') throw new MembershipError('승인 대기 중인 신청이 아닙니다.',409)
    const { data: updated, error: updateError } = await db.from('users').update({status:'approved'}).eq('id',employee.id).eq('role','emp').eq('company_name',hr.company_name!).eq('status','pending').select('id').maybeSingle()
    if (updateError) throw new MembershipError('승인을 저장하지 못했습니다. 다시 시도해 주세요.')
    if (!updated) throw new MembershipError('신청 상태가 변경되었습니다. 목록을 새로고침해 주세요.',409)
    return NextResponse.json({success:true})
  } catch (e) { return fail(e) }
}
