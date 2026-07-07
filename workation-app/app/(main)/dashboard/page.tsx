'use client'
import { useState } from 'react'
import Header from '@/components/ui/Header'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import Footer from '@/components/ui/Footer'

const HARDCODED_BOOKINGS = [
  { id: '1', user_id: 'u1', userName: '김지민 (기획팀)', start_date: '2026-07-10', end_date: '2026-07-12', guests: 2, total_price: 180000, status: 'confirmed', accommodations: { name: '강릉 홍보 체험형 워케이션', region: '강원도 강릉시' } },
  { id: '2', user_id: 'u2', userName: '이개발 (개발팀)', start_date: '2026-07-15', end_date: '2026-07-18', guests: 1, total_price: 240000, status: 'confirmed', accommodations: { name: '제주 애월 바다 전망 오피스', region: '제주특별자치도 제주시' } },
  { id: '3', user_id: 'u3', userName: '박디잔 (디자인팀)', start_date: '2026-07-20', end_date: '2026-07-22', guests: 3, total_price: 320000, status: 'confirmed', accommodations: { name: '속초 설악산 전망 워케이션', region: '강원특별자치도 속초시' } },
  { id: '4', user_id: 'u1', userName: '김지민 (기획팀)', start_date: '2026-08-01', end_date: '2026-08-03', guests: 2, total_price: 150000, status: 'pending', accommodations: { name: '전주 한옥마을 스테이', region: '전라북도 전주시' } },
]

const HARDCODED_SUBSIDY_USAGE = [
  { userName: '김지민 (기획팀)', subsidyName: '강원도 워케이션 체류 지원', region: '강원도 강릉시', date: '2026-07-10', amount: 100000, isDuplicate: false },
  { userName: '이개발 (개발팀)', subsidyName: '제주도 청년 워케이션 바우처', region: '제주도 제주시', date: '2026-07-15', amount: 40000, isDuplicate: false },
  { userName: '박디잔 (디자인팀)', subsidyName: '강원도 워케이션 체류 지원', region: '강원도 속초시', date: '2026-07-20', amount: 150000, isDuplicate: false },
  { userName: '김지민 (기획팀)', subsidyName: '전라북도 한옥마을 지원', region: '전라북도 전주시', date: '2026-08-01', amount: 60000, isDuplicate: true },
]

export default function DashboardPage() {
  const [bookings] = useState(HARDCODED_BOOKINGS)
  const [subsidyUsage] = useState(HARDCODED_SUBSIDY_USAGE)
  
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed')
  const totalAmount       = confirmedBookings.reduce((s, b) => s + b.total_price, 0)
  const totalGuests       = confirmedBookings.reduce((s, b) => s + b.guests, 0)

  const budgetTotal = 5000000
  const budgetUsed  = totalAmount
  const budgetPct   = Math.min(100, Math.round((budgetUsed / budgetTotal) * 100))

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header role="hr" />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black">🏢 통합 HR 대시보드</h1>
              <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full border border-blue-200">데모 모드</span>
            </div>
            <p className="text-sm text-[#475569]">2026년 하반기 전사 워케이션 현황판</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/report">
              <button className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md">
                <span>📊</span> 상세 성과 리포트 보기
              </button>
            </Link>
          </div>
        </div>

        {/* 요약 카드 4개 */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: '총 예약',     value: `${bookings.length}건`,  sub: '진행중인 예약 포함',  color: 'text-blue-600' },
            { label: '참여 직원',   value: `${totalGuests}명`,       sub: '누적 참여',     color: 'text-emerald-600' },
            { label: '예산 사용률', value: `${budgetPct}%`,          sub: `${budgetUsed.toLocaleString()}원 사용`, color: 'text-amber-600' },
            { label: '절감 지원금', value: `${subsidyUsage.filter(s=>!s.isDuplicate).reduce((s, u) => s + u.amount, 0).toLocaleString()}원`, sub: '지자체 지원금 합계', color: 'text-purple-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${s.color.replace('text-', 'from-')}/5 to-transparent rounded-bl-full group-hover:scale-110 transition-transform`} />
              <p className="text-xs font-bold text-[#94A3B8] mb-2">{s.label}</p>
              <p className={`text-3xl font-black ${s.color} tracking-tight mb-1`}>{s.value}</p>
              <p className="text-xs text-[#475569]">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* 예산 게이지 */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex justify-between items-end mb-3">
            <div>
              <h3 className="font-black text-slate-800 flex items-center gap-2">
                <span>💳</span> 연간 워케이션 예산 사용 현황
              </h3>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-slate-800">{budgetUsed.toLocaleString()}원</span>
              <span className="text-sm font-medium text-slate-400 mx-1">/</span>
              <span className="text-sm font-medium text-slate-500">{budgetTotal.toLocaleString()}원</span>
            </div>
          </div>
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all" style={{ width: `${budgetPct}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-xs font-bold text-slate-500">
            <span className="text-blue-600">{budgetPct}% 사용 완료</span>
            <span>잔여 예산 {(budgetTotal - budgetUsed).toLocaleString()}원</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* 지원금 수혜 현황 */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm flex-1">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0] bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="text-lg">💰</span>
                <h2 className="font-black text-slate-800">지자체 지원금 수혜 내역</h2>
                <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-md font-bold">1인 1회 제한</span>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-100 bg-slate-50/30">
                  <th className="text-left px-6 py-3 font-semibold">임직원</th>
                  <th className="text-left px-6 py-3 font-semibold">지원 내역</th>
                  <th className="text-right px-6 py-3 font-semibold">환급액</th>
                </tr>
              </thead>
              <tbody>
                {subsidyUsage.map((u, i) => (
                  <tr key={i} className={`border-b border-slate-50 transition-colors ${u.isDuplicate ? 'bg-red-50/30' : 'hover:bg-slate-50/50'}`}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700">{u.userName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{u.date}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-semibold text-slate-600">{u.subsidyName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">📍 {u.region}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.isDuplicate ? (
                        <div className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-md">
                          <span>⚠️ 중복 수급 불가</span>
                        </div>
                      ) : (
                        <div className="font-black text-emerald-500">+{u.amount.toLocaleString()}원</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 최근 예약 내역 */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm flex-1">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0] bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="text-lg">📅</span>
                <h2 className="font-black text-slate-800">최근 워케이션 예약 승인</h2>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {bookings.map((b, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-800 text-sm">{b.userName}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        b.status === 'confirmed' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {b.status === 'confirmed' ? '예약 확정' : '대기중'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-medium">{b.accommodations.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{b.start_date} ~ {b.end_date} ({b.guests}명)</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-slate-700 text-sm">{b.total_price.toLocaleString()}원</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">회사 예산 차감</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
