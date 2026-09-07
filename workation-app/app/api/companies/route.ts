import { NextResponse } from 'next/server'
import { membershipAdmin, MembershipError } from '@/lib/server-membership'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    // Registration needs company names, never HR names/emails or the public users table.
    const {data,error} = await membershipAdmin().from('users').select('company_name').eq('role','hr').eq('status','approved')
    if(error) throw new MembershipError('회사 목록을 불러오지 못했습니다.')
    const companies=Array.from(new Set((data||[]).map(u=>u.company_name).filter((s):s is string=>typeof s==='string'&&Boolean(s.trim())))).sort()
    return NextResponse.json({companies},{headers:{'Cache-Control':'no-store'}})
  } catch(e) { return NextResponse.json({error:e instanceof MembershipError?e.message:'회사 목록을 불러오지 못했습니다.'},{status:e instanceof MembershipError?e.status:500}) }
}
