import { NextResponse } from 'next/server'
import { membershipAdmin, MembershipError } from '@/lib/server-membership'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    // Only expose approved company identifiers and names needed by the employee signup picker.
    const {data,error} = await membershipAdmin().from('companies').select('id,name').eq('approved',true).order('name')
    if(error) throw new MembershipError('회사 목록을 불러오지 못했습니다.')
    return NextResponse.json({companies:data||[]},{headers:{'Cache-Control':'no-store'}})
  } catch(e) { return NextResponse.json({error:e instanceof MembershipError?e.message:'회사 목록을 불러오지 못했습니다.'},{status:e instanceof MembershipError?e.status:500}) }
}
