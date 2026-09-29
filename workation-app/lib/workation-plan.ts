import { MembershipError, type Membership } from './server-membership'

export type Goal = { title: string; criteria: string; due: string; expectedMinutes: number; actualMinutes: number; progress: number; note: string; result: string; link: string }
export type Plan = { id: string; company_id: string; user_id: string; employee_name: string; title: string; place: string; start_date: string; end_date: string; goals: Goal[]; status: 'draft' | 'pending' | 'revision' | 'approved' | 'submitted' | 'rework' | 'completed'; feedback: string; version: number; history: { at: string; action: string; actor: string; note: string }[] }
export const statusLabels: Record<Plan['status'], string> = { draft: '작성 중', pending: '목표 검토 대기', revision: '목표 수정 요청', approved: '업무 진행 중', submitted: '결과 검토 대기', rework: '결과 보완 요청', completed: '검토 완료' }
const fail = (message: string, status = 400): never => { throw new MembershipError(message, status) }
export function requireParticipant(member: Membership) {
  if (member.status !== 'approved' || !member.company_id || !['emp', 'hr'].includes(member.role)) fail('승인된 회사 소속 직원 또는 인사담당자만 이용할 수 있습니다.', 403)
}
function str(value: unknown, limit: number, required = true): string {
  if (typeof value !== 'string' || value.length > limit || (required && !value.trim())) return fail('필수 항목과 입력 길이를 확인해 주세요.')
  return value.trim()
}
function date(value: unknown): string {
  const s = str(value, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || !Number.isFinite(Date.parse(s)) || new Date(s).toISOString().slice(0, 10) !== s) fail('올바른 날짜를 입력해 주세요.')
  return s
}
function number(value: unknown, max: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > max) return fail('시간과 진행률을 확인해 주세요.')
  return value
}
export function readDraft(body: any) {
  const start_date = date(body.start_date), end_date = date(body.end_date)
  if (end_date < start_date) fail('종료일은 시작일 이후여야 합니다.')
  if (!Array.isArray(body.goals) || !body.goals.length || body.goals.length > 20) fail('목표를 1~20개 입력해 주세요.')
  const goals: Goal[] = body.goals.map((g: any) => {
    if (!g || typeof g !== 'object') return fail('목표 정보를 확인해 주세요.')
    const due = date(g.due)
    if (due < start_date || due > end_date) fail('목표 기한은 워케이션 기간 안에 있어야 합니다.')
    const expectedMinutes = number(g.expectedMinutes, 100000)
    if (!expectedMinutes) fail('예상 시간은 1분 이상 입력해 주세요.')
    return { title: str(g.title, 200), criteria: str(g.criteria, 2000), due, expectedMinutes, actualMinutes: 0, progress: 0, note: '', result: '', link: '' }
  })
  return { title: str(body.title, 200), place: str(body.place, 300), start_date, end_date, goals }
}
export function transition(plan: Plan, member: Membership, body: any): Partial<Plan> {
  requireParticipant(member)
  if (plan.company_id !== member.company_id || (member.role === 'emp' && plan.user_id !== member.id)) fail('이 워케이션에 접근할 수 없습니다.', 403)
  const action = body.action
  const own = member.role === 'emp' && plan.user_id === member.id
  let patch: Partial<Plan> = {}
  if (action === 'save' || action === 'submit') {
    if (!own || !['draft', 'revision'].includes(plan.status)) fail('현재 상태에서는 목표를 수정할 수 없습니다.', 409)
    patch = { ...readDraft(body), status: action === 'submit' ? 'pending' : plan.status }
  } else if (['approve', 'revise', 'complete', 'rework'].includes(action)) {
    if (member.role !== 'hr' || member.id === plan.user_id) fail('소속 회사 담당자만 검토할 수 있습니다.', 403)
    const expected = ['approve', 'revise'].includes(action) ? 'pending' : 'submitted'
    if (plan.status !== expected) fail('검토 상태가 변경되었습니다. 새로고침해 주세요.', 409)
    const feedback = str(body.feedback, 2000, ['revise', 'rework'].includes(action))
    patch = { feedback, status: ({ approve: 'approved', revise: 'revision', complete: 'completed', rework: 'rework' } as const)[action as 'approve'] }
  } else if (action === 'record' || action === 'results') {
    if (!own || !['approved', 'rework'].includes(plan.status)) fail('승인된 목표에만 업무 결과를 기록할 수 있습니다.', 409)
    if (!Array.isArray(body.goals) || body.goals.length !== plan.goals.length) fail('목표 목록을 확인해 주세요.')
    const goals = plan.goals.map((g, i) => {
      const input = body.goals[i]
      if (!input || typeof input !== 'object') return fail('업무 기록을 확인해 주세요.')
      const link = str(input.link, 2000, false)
      if (link) { try { if (!['https:', 'http:'].includes(new URL(link).protocol)) fail('결과물 링크는 http 또는 https 주소여야 합니다.') } catch { fail('결과물 링크를 확인해 주세요.') } }
      return { ...g, actualMinutes: number(input.actualMinutes, 100000), progress: number(input.progress, 100), note: str(input.note, 4000, false), result: str(input.result, 4000, action === 'results'), link }
    })
    patch = { goals, status: action === 'results' ? 'submitted' : plan.status }
  } else fail('지원하지 않는 요청입니다.')
  return { ...patch, version: plan.version + 1, history: [...plan.history, { at: new Date().toISOString(), action, actor: member.name || member.email, note: patch.feedback || '' }] }
}
