import { NextResponse } from 'next/server'
import { authenticatedMember, membershipAdmin, MembershipError } from '@/lib/server-membership'

export const dynamic = 'force-dynamic'

const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value)
const fail = (error: unknown) => NextResponse.json(
  { error: error instanceof MembershipError ? error.message : '예약 요청을 처리하지 못했습니다.' },
  { status: error instanceof MembershipError ? error.status : 500, headers: { 'Cache-Control': 'no-store' } },
)

function approvedCompanyMember(member: { role: string; status: string; company_id: string | null }) {
  if (member.status !== 'approved' || !member.company_id || !['hr', 'emp'].includes(member.role)) {
    throw new MembershipError('승인된 회사 소속 계정만 예약을 이용할 수 있습니다.', 403)
  }
}

export async function GET(request: Request) {
  try {
    const db = membershipAdmin(), member = await authenticatedMember(request, db)
    approvedCompanyMember(member)
    let query = db.from('bookings').select('id,user_id,company_id,start_date,end_date,guests,total_price,status,payment_type,created_at,accommodations(name,region)').eq('company_id', member.company_id!).order('created_at', { ascending: false })
    if (member.role === 'emp') query = query.eq('user_id', member.id)
    const { data, error } = await query
    if (error) throw new MembershipError('예약 정보를 불러오지 못했습니다.')
    return NextResponse.json({ bookings: data || [] }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return fail(error) }
}

export async function POST(request: Request) {
  try {
    const db = membershipAdmin(), member = await authenticatedMember(request, db)
    approvedCompanyMember(member)
    if (member.role !== 'emp') throw new MembershipError('직원 계정으로만 예약을 생성할 수 있습니다.', 403)
    const body = await request.json()
    if (!uuid(body?.accommodationId) || typeof body?.startDate !== 'string' || typeof body?.endDate !== 'string' || !Number.isInteger(body?.guests) || body.guests < 1 || body.guests > 30 || !Number.isFinite(body?.totalPrice) || body.totalPrice < 0 || !['corporate', 'personal'].includes(body?.paymentType)) {
      throw new MembershipError('예약 정보를 다시 확인해 주세요.', 400)
    }
    if (new Date(body.endDate).getTime() <= new Date(body.startDate).getTime()) throw new MembershipError('체크아웃 날짜는 체크인 이후여야 합니다.', 400)
    const { data: accommodation, error: accommodationError } = await db.from('accommodations').select('id').eq('id', body.accommodationId).maybeSingle()
    if (accommodationError || !accommodation) throw new MembershipError('선택한 숙소를 찾을 수 없습니다.', 404)
    const { data, error } = await db.from('bookings').insert({
      user_id: member.id, company_id: member.company_id, accommodation_id: accommodation.id,
      start_date: body.startDate, end_date: body.endDate, guests: body.guests,
      total_price: Math.round(body.totalPrice), status: 'confirmed', payment_type: body.paymentType,
    }).select('id').single()
    if (error || !data) throw new MembershipError('예약을 저장하지 못했습니다.')
    return NextResponse.json({ booking: data }, { status: 201 })
  } catch (error) { return fail(error) }
}

export async function PATCH(request: Request) {
  try {
    const db = membershipAdmin(), member = await authenticatedMember(request, db)
    approvedCompanyMember(member)
    if (member.role !== 'hr') throw new MembershipError('인사담당자만 회사 예약을 변경할 수 있습니다.', 403)
    const body = await request.json()
    if (!uuid(body?.id)) throw new MembershipError('예약 정보를 확인해 주세요.', 400)
    const update: Record<string, unknown> = {}
    if (body.status !== undefined) {
      if (!['confirmed', 'cancelled'].includes(body.status)) throw new MembershipError('예약 상태를 확인해 주세요.', 400)
      update.status = body.status
    }
    if (body.startDate !== undefined || body.endDate !== undefined || body.guests !== undefined || body.totalPrice !== undefined) {
      if (typeof body.startDate !== 'string' || typeof body.endDate !== 'string' || !Number.isInteger(body.guests) || body.guests < 1 || body.guests > 30 || !Number.isFinite(body.totalPrice) || body.totalPrice < 0 || new Date(body.endDate).getTime() <= new Date(body.startDate).getTime()) throw new MembershipError('변경할 예약 정보를 다시 확인해 주세요.', 400)
      Object.assign(update, { start_date: body.startDate, end_date: body.endDate, guests: body.guests, total_price: Math.round(body.totalPrice) })
    }
    if (!Object.keys(update).length) throw new MembershipError('변경할 내용이 없습니다.', 400)
    const { data, error } = await db.from('bookings').update(update).eq('id', body.id).eq('company_id', member.company_id!).select('id').maybeSingle()
    if (error) throw new MembershipError('예약을 변경하지 못했습니다.')
    if (!data) throw new MembershipError('소속 회사의 예약만 변경할 수 있습니다.', 404)
    return NextResponse.json({ success: true })
  } catch (error) { return fail(error) }
}

export async function DELETE(request: Request) {
  try {
    const db = membershipAdmin(), member = await authenticatedMember(request, db)
    approvedCompanyMember(member)
    if (member.role !== 'hr') throw new MembershipError('인사담당자만 회사 예약을 삭제할 수 있습니다.', 403)
    const id = new URL(request.url).searchParams.get('id')
    if (!uuid(id)) throw new MembershipError('예약 정보를 확인해 주세요.', 400)
    const { data, error } = await db.from('bookings').delete().eq('id', id).eq('company_id', member.company_id!).select('id').maybeSingle()
    if (error) throw new MembershipError('예약을 삭제하지 못했습니다.')
    if (!data) throw new MembershipError('소속 회사의 예약만 삭제할 수 있습니다.', 404)
    return NextResponse.json({ success: true })
  } catch (error) { return fail(error) }
}
