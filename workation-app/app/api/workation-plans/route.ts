import { NextResponse } from 'next/server'
import { authenticatedMember, membershipAdmin, MembershipError } from '@/lib/server-membership'
import { readDraft, requireParticipant, transition, type Plan } from '@/lib/workation-plan'
export const dynamic = 'force-dynamic'
const respond = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
const fail = (e: unknown) => respond({ error: e instanceof MembershipError ? e.message : '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, e instanceof MembershipError ? e.status : 500)
function dbError(error: { code?: string } | null) {
  if (error) throw new MembershipError(['42P01', 'PGRST205'].includes(error.code || '') ? '업무 관리 기능을 준비 중입니다. 운영 담당자에게 문의해 주세요.' : '저장된 정보를 처리하지 못했습니다.', 503)
}
async function context(request: Request) { const db = membershipAdmin(); const member = await authenticatedMember(request, db); requireParticipant(member); return { db, member } }
async function bodyOf(request: Request) {
  const text = await request.text()
  if (text.length > 250000) throw new MembershipError('입력 내용이 너무 큽니다.', 413)
  try { const body = JSON.parse(text); if (!body || typeof body !== 'object' || Array.isArray(body)) throw Error(); return body } catch { throw new MembershipError('올바른 요청이 아닙니다.', 400) }
}
export async function GET(request: Request) {
  try {
    const { db, member } = await context(request)
    let q = db.from('workation_plans').select('*').eq('company_id', member.company_id!).order('created_at', { ascending: false })
    if (member.role === 'emp') q = q.eq('user_id', member.id)
    else q = q.neq('status', 'draft')
    const { data, error } = await q; dbError(error)
    return respond({ plans: data || [], member: { role: member.role, name: member.name } })
  } catch (e) { return fail(e) }
}
export async function POST(request: Request) {
  try {
    const { db, member } = await context(request)
    if (member.role !== 'emp') throw new MembershipError('직원 계정으로 워케이션을 생성해 주세요.', 403)
    const draft = readDraft(await bodyOf(request))
    const { data, error } = await db.from('workation_plans').insert({ ...draft, user_id: member.id, company_id: member.company_id, employee_name: member.name || member.email }).select('*').single()
    dbError(error); return respond({ plan: data }, 201)
  } catch (e) { return fail(e) }
}
export async function PATCH(request: Request) {
  try {
    const { db, member } = await context(request), body = await bodyOf(request)
    if (typeof body.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id) || !Number.isInteger(body.version)) throw new MembershipError('워케이션 정보를 확인해 주세요.', 400)
    let q = db.from('workation_plans').select('*').eq('id', body.id).eq('company_id', member.company_id!)
    if (member.role === 'emp') q = q.eq('user_id', member.id)
    else q = q.neq('status', 'draft')
    const { data, error } = await q.maybeSingle(); dbError(error)
    if (!data) throw new MembershipError('워케이션을 찾을 수 없습니다.', 404)
    if (data.version !== body.version) throw new MembershipError('다른 곳에서 변경되었습니다. 새로고침 후 다시 시도해 주세요.', 409)
    const patch = transition(data as Plan, member, body)
    const { data: saved, error: updateError } = await db.from('workation_plans').update(patch).eq('id', body.id).eq('company_id', member.company_id!).eq('version', body.version).select('*').maybeSingle()
    dbError(updateError)
    if (!saved) throw new MembershipError('다른 곳에서 변경되었습니다. 새로고침 후 다시 시도해 주세요.', 409)
    return respond({ plan: saved })
  } catch (e) { return fail(e) }
}
