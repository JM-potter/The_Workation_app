"use client"
import Link from 'next/link'
import {useEffect,useState} from 'react'
import {useRouter} from 'next/navigation'
import Header from '@/components/ui/Header'
import {getMembership,memberHome} from '@/lib/membership-client'
import {supabase} from '@/lib/supabase'
import type {Membership} from '@/lib/server-membership'
export default function PendingPage(){
 const router=useRouter(),[member,setMember]=useState<Membership|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('')
 async function check(){setBusy(true);setError('');try{const m=await getMembership();setMember(m);if(m.status==='approved')router.replace(memberHome(m))}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 useEffect(()=>{void check()},[])
 return <div className="min-h-screen bg-slate-50 text-slate-900"><Header/><main className="max-w-lg mx-auto px-6 py-16 text-center"><div className="text-5xl mb-6">⏳</div><h1 className="text-2xl font-bold">가입 승인 상태 확인</h1><p className="mt-5 text-slate-600">{member?.company_name&&<><strong>{member.company_name}</strong><br/></>}{member?.role==='emp'?'소속 회사 인사담당자가 직원 가입 신청을 확인하고 있습니다.':member?.role==='hr'?'플랫폼 관리자가 회사와 인사담당자 가입 신청을 확인하고 있습니다.':'직원은 소속 회사 인사담당자의 승인, 인사담당자는 플랫폼 관리자의 승인이 필요합니다.'}</p><p className="text-sm text-slate-500 mt-4">이메일 인증을 요청받았다면 먼저 인증을 완료해 주세요. 승인 후 아래 버튼을 누르면 서비스로 이동합니다.</p>{member&&member.status!=='approved'&&<p role="status" className="mt-5 text-amber-700">현재 상태: {member.status==='pending'?'승인 대기':member.status||'확인 필요'}</p>}{error&&<p role="alert" className="mt-4 text-red-600">{error}</p>}<button disabled={busy} onClick={check} className="mt-7 bg-blue-600 text-white rounded-xl px-6 py-3 disabled:opacity-50">{busy?'확인 중…':'승인 상태 다시 확인'}</button><div className="mt-6 flex justify-center gap-5 text-sm"><Link href="/login" className="underline">로그인</Link><button onClick={async()=>{await supabase.auth.signOut();router.replace('/login')}} className="underline">다른 계정으로 로그인</button><Link href="/" className="underline">홈으로</Link></div></main></div>
}
