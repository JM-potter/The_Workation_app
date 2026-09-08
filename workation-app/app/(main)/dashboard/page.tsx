'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Footer from '@/components/ui/Footer'
import Header from '@/components/ui/Header'
import { memberRequest } from '@/lib/membership-client'

type Member = { id: string; name: string | null; email: string; status: string }
type Booking = { id: string; user_id: string; start_date: string; end_date: string; guests: number; total_price: number; status: string; payment_type: string | null; member: Member | null; accommodation: { name: string; region: string } | null }
type Report = { id: string; github_id: string | null; report_text: string; github_minutes: number | null; created_at: string; member: Member | null }
type Dashboard = { company: string; members: Member[]; bookings: Booking[]; reports: Report[] }

const nameOf = (member: Member | null) => member?.name?.trim() || member?.email || '알 수 없는 직원'
const won = (amount: number) => `${amount.toLocaleString()}원`

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setData(await memberRequest('/api/hr/dashboard') as Dashboard) }
    catch (e) { setData(null); setError(e instanceof Error ? e.message : '대시보드 데이터를 불러오지 못했습니다.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const members = data?.members || [], bookings = data?.bookings || [], reports = data?.reports || []
  const confirmed = bookings.filter((booking) => booking.status === 'confirmed')
  const companySpend = confirmed.filter((booking) => booking.payment_type !== 'personal').reduce((sum, booking) => sum + (booking.total_price || 0), 0)
  const participantCount = confirmed.map((booking) => booking.user_id).filter((id, index, values) => values.indexOf(id) === index).length
  const cards = [
    ['등록 직원', `${members.length}명`, `승인 대기 ${members.filter((member) => member.status === 'pending').length}명`, 'text-blue-600'],
    ['참여 직원', `${participantCount}명`, '예약 확정 기준', 'text-emerald-600'],
    ['전체 예약', `${bookings.length}건`, `확정 ${confirmed.length}건`, 'text-amber-600'],
    ['회사 예산 사용', won(companySpend), '확정 예약 기준', 'text-purple-600'],
  ]

  return <div className="min-h-screen bg-[#F8FAFC]">
    <Header role="hr" />
    <main className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-black">🏢 {data?.company || '회사'} HR 대시보드</h1><p className="mt-1 text-sm text-slate-600">소속 직원의 실제 가입·예약·업무 리포트 현황입니다.</p></div><div className="flex gap-3"><button onClick={load} disabled={loading} className="rounded-xl border bg-white px-4 py-2.5 text-sm font-bold disabled:opacity-50">{loading ? '불러오는 중…' : '새로고침'}</button><Link href="/members" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white">직원 가입 승인</Link></div></div>
      {error && <div role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>}
      <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">{cards.map(([label, value, sub, color]) => <div key={label} className="rounded-2xl border bg-white p-5 shadow-sm"><p className="mb-2 text-xs font-bold text-slate-400">{label}</p><p className={`text-2xl font-black ${color}`}>{loading ? '—' : value}</p><p className="mt-1 text-xs text-slate-500">{sub}</p></div>)}</section>
      <section className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm"><h2 className="border-b px-6 py-5 font-black text-slate-800">최근 워케이션 예약</h2>{loading ? <p className="p-8 text-center text-sm text-slate-500">예약 정보를 불러오는 중입니다…</p> : !bookings.length ? <p className="p-8 text-center text-sm text-slate-500">등록된 예약이 없습니다.</p> : <ul className="divide-y">{bookings.slice(0, 6).map((booking) => <li key={booking.id} className="flex items-start justify-between gap-4 px-6 py-4"><div><p className="text-sm font-bold">{nameOf(booking.member)}</p><p className="mt-1 text-xs text-slate-600">{booking.accommodation?.name || '숙소 정보 없음'}</p><p className="mt-1 text-[11px] text-slate-400">{booking.start_date} ~ {booking.end_date} · {booking.guests}명</p></div><div className="text-right"><span className={`rounded-md px-2 py-1 text-[10px] font-bold ${booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{booking.status === 'confirmed' ? '예약 확정' : booking.status}</span><p className="mt-2 text-sm font-black">{won(booking.total_price || 0)}</p></div></li>)}</ul>}</div>
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="flex items-center justify-between border-b px-6 py-5"><h2 className="font-black text-slate-800">직원 업무 리포트</h2><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{reports.length}건</span></div>{loading ? <p className="p-8 text-center text-sm text-slate-500">업무 리포트를 불러오는 중입니다…</p> : !reports.length ? <p className="p-8 text-center text-sm text-slate-500">제출된 업무 리포트가 없습니다.</p> : <ul className="divide-y">{reports.slice(0, 4).map((report) => <li key={report.id} className="px-6 py-4"><div className="flex justify-between gap-3"><p className="text-sm font-bold">{nameOf(report.member)}</p><span className="text-[11px] text-slate-400">개발 집중 {report.github_minutes || 0}분</span></div><p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-slate-600">{report.report_text}</p></li>)}</ul>}</div>
      </section>
      <section className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="font-black text-slate-800">직원 가입 상태</h2>{loading ? <p className="py-6 text-center text-sm text-slate-500">직원 정보를 불러오는 중입니다…</p> : !members.length ? <p className="py-6 text-center text-sm text-slate-500">아직 등록된 직원이 없습니다. 직원 가입 신청을 승인해 주세요.</p> : <ul className="mt-4 grid gap-3 sm:grid-cols-2">{members.map((member) => <li key={member.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-bold">{nameOf(member)}</p><p className="truncate text-xs text-slate-500">{member.email}</p></div><span className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold ${member.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{member.status === 'approved' ? '승인됨' : '승인 대기'}</span></li>)}</ul>}</section>
    </main>
    <Footer />
  </div>
}
