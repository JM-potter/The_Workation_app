import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type Membership = { id: string; name: string; email: string; role: string; status: string; company_id: string | null; company_name: string | null }
export class MembershipError extends Error {
  constructor(message: string, public status = 500) { super(message) }
}
export function membershipAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new MembershipError('승인 서비스 설정을 확인해 주세요.', 503)
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwuxojmyxjqdzthvludo.supabase.co', key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) },
  })
}
export async function authenticatedMember(request: Request, db: SupabaseClient) {
  const token = request.headers.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1]
  if (!token) throw new MembershipError('로그인이 필요합니다.', 401)
  const { data: auth, error: authError } = await db.auth.getUser(token)
  if (authError || !auth.user) throw new MembershipError('다시 로그인해 주세요.', 401)
  const { data, error } = await db.from('users').select('id,name,email,role,status,company_id,company_name').eq('id', auth.user.id).maybeSingle()
  if (error) throw new MembershipError('회원 정보를 불러오지 못했습니다.')
  if (!data) throw new MembershipError('가입 정보 반영을 기다리고 있습니다. 잠시 후 다시 확인해 주세요.', 409)
  return data as Membership
}
export async function requireSuperAdmin(request: Request, db: SupabaseClient) {
  const token = request.headers.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1]
  if (!token) throw new MembershipError('로그인이 필요합니다.', 401)
  const { data: auth, error: authError } = await db.auth.getUser(token)
  if (authError || !auth.user) throw new MembershipError('다시 로그인해 주세요.', 401)
  const adminEmail = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase()
  if (!adminEmail) throw new MembershipError('슈퍼관리자 설정을 확인해 주세요.', 503)
  if (auth.user.email?.trim().toLowerCase() !== adminEmail) throw new MembershipError('슈퍼관리자 권한이 필요합니다.', 403)
  return auth.user
}
export function requireApprovedHr(member: Membership) {
  if (member.role !== 'hr' || member.status !== 'approved') throw new MembershipError('승인된 인사담당자만 직원 신청을 관리할 수 있습니다.', 403)
  if (!member.company_id) throw new MembershipError('계정에 연결된 회사 정보가 없습니다.', 409)
  return { id: member.company_id, name: member.company_name?.trim() || '회사' }
}
export function canApproveEmployee(hr: Membership, employee: Membership) {
  return hr.role === 'hr' && hr.status === 'approved' && Boolean(hr.company_id) && employee.role === 'emp' && employee.company_id === hr.company_id && employee.id !== hr.id
}
