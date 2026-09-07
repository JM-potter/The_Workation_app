import { NextResponse } from 'next/server'
import { authenticatedMember, membershipAdmin, MembershipError } from '@/lib/server-membership'
export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  try { return NextResponse.json(await authenticatedMember(request,membershipAdmin()),{headers:{'Cache-Control':'no-store'}}) }
  catch(e) { return NextResponse.json({error:e instanceof MembershipError?e.message:'승인 상태를 확인하지 못했습니다.'},{status:e instanceof MembershipError?e.status:500}) }
}
