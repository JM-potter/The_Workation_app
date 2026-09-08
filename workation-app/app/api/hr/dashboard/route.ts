import { NextResponse } from 'next/server'
import { authenticatedMember, membershipAdmin, MembershipError, requireApprovedHr } from '@/lib/server-membership'

export const dynamic = 'force-dynamic'

type BookingRow = { id: string; user_id: string; accommodation_id: string | null; start_date: string; end_date: string; guests: number; total_price: number; status: string; created_at: string; payment_type: string | null }

const fail = (error: unknown) => NextResponse.json(
  { error: error instanceof MembershipError ? error.message : '대시보드 데이터를 불러오지 못했습니다.' },
  { status: error instanceof MembershipError ? error.status : 500, headers: { 'Cache-Control': 'no-store' } },
)

export async function GET(request: Request) {
  try {
    const db = membershipAdmin()
    const hr = await authenticatedMember(request, db)
    const company = requireApprovedHr(hr)
    const { data: employeeRows, error: employeeError } = await db.from('users').select('id,name,email,status').eq('role', 'emp').eq('company_id', company.id).order('name')
    if (employeeError) throw new MembershipError('직원 정보를 불러오지 못했습니다.')
    const members = employeeRows || []
    const ids = members.map((member) => member.id)
    if (!ids.length) return NextResponse.json({ company: company.name, members, bookings: [], reports: [] }, { headers: { 'Cache-Control': 'no-store' } })
    const [{ data: bookingRows, error: bookingError }, { data: reportRows, error: reportError }] = await Promise.all([
      db.from('bookings').select('id,user_id,accommodation_id,start_date,end_date,guests,total_price,status,created_at,payment_type').eq('company_id', company.id).in('user_id', ids).order('created_at', { ascending: false }),
      db.from('ai_reports').select('id,user_id,github_id,report_text,github_minutes,created_at').in('user_id', ids).order('created_at', { ascending: false }),
    ])
    if (bookingError) throw new MembershipError('예약 정보를 불러오지 못했습니다.')
    if (reportError) throw new MembershipError('업무 리포트를 불러오지 못했습니다.')
    const bookings = (bookingRows || []) as BookingRow[]
    const accommodationIds = bookings.map((booking) => booking.accommodation_id).filter((id): id is string => Boolean(id)).filter((id, index, values) => values.indexOf(id) === index)
    const { data: accommodationRows, error: accommodationError } = accommodationIds.length ? await db.from('accommodations').select('id,name,region').in('id', accommodationIds) : { data: [], error: null }
    if (accommodationError) throw new MembershipError('숙소 정보를 불러오지 못했습니다.')
    const membersById = new Map(members.map((member) => [member.id, member]))
    const accommodationsById = new Map((accommodationRows || []).map((accommodation) => [accommodation.id, accommodation]))
    return NextResponse.json({
      company: company.name,
      members,
      bookings: bookings.map((booking) => ({ ...booking, member: membersById.get(booking.user_id) || null, accommodation: booking.accommodation_id ? accommodationsById.get(booking.accommodation_id) || null : null })),
      reports: (reportRows || []).map((report) => ({ ...report, member: membersById.get(report.user_id) || null })),
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return fail(error) }
}
