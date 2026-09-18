import { supabase } from './supabase'
import type { Membership } from './server-membership'
export async function memberRequest(url: string, init: RequestInit = {}) {
  const {data:{session}}=await supabase.auth.getSession()
  if(!session) throw new Error('로그인이 필요합니다.')
  const response=await fetch(url,{...init,cache:'no-store',headers:{...init.headers,Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'}})
  const data=await response.json()
  if(!response.ok) throw new Error(data.error||'요청을 처리하지 못했습니다.')
  return data
}
export const getMembership = ():Promise<Membership> => memberRequest('/api/account/status')
export const memberHome = (member:Membership) => member.status!=='approved'?'/pending':member.role==='hr'?'/dashboard':'/select'
