'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Footer from '@/components/ui/Footer'
import Header from '@/components/ui/Header'
import { supabase } from '@/lib/supabase'

const PERF_BENCHMARKS = [
  { label: '업무 집중도',  before: 68, after: 84, unit: '%', icon: '🎯', desc: '일일 집중 시간 비율' },
  { label: '팀 결속력',   before: 72, after: 91, unit: '%', icon: '🤝', desc: '협업 만족도 설문 결과' },
  { label: '직원 만족도', before: 74, after: 92, unit: '%', icon: '😊', desc: 'eNPS 기반 환산 점수' },
  { label: '이직 의향',   before: 38, after: 19, unit: '%', icon: '🚪', reverse: true, desc: '6개월 내 이직 고려 비율' },
  { label: '번아웃 지수', before: 52, after: 31, unit: '%', icon: '🔥', reverse: true, desc: '직무 스트레스 자가 진단' },
  { label: '협업 활동',   before: 64, after: 88, unit: '%', icon: '💬', desc: '타 부서 소통 빈도' },
]

type BookingRow = {
  id: string
  start_date: string
  end_date: string
  guests: number
  total_price: number
  status: string
  accommodations: { name: string; region: string; location: string } | null
}

type SubsidyRow = { region: string; name: string; amount_per_person: number }

function normalizeRegion(r: string) {
  return r.replace('특별자치도', '도').replace('특별자치시', '시').replace('특별시', '시').replace('광역시', '시').split(' ')[0]
}
function regionMatch(a: string, b: string) {
  if (!a || !b) return false
  const na = normalizeRegion(a), nb = normalizeRegion(b)
  return (na && nb) && (na.includes(nb) || nb.includes(na))
}
function daysBetween(start: string, end: string) {
  if (!start || !end) return 3
  return Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000))
}

export default function ReportPage() {
  // Hardcoded for demo mode

  const [bookings,   setBookings]   = useState<BookingRow[]>([])
  const [subsidies,  setSubsidies]  = useState<SubsidyRow[]>([])
  const [companyName, setCompany]   = useState('우리 회사')
  const [loading,    setLoading]    = useState(true)
  const [aiSummary,  setAiSummary]  = useState('')
  const [aiLoading,  setAiLoading]  = useState(false)
  const [aiError,    setAiError]    = useState('')

  useEffect(() => {
    // Hardcoded mock data bypasses fetch
    setBookings([
      { id: '1', start_date: '2026-07-10', end_date: '2026-07-12', guests: 2, total_price: 180000, status: 'confirmed', accommodations: { name: '강릉 홍보 체험형 워케이션', region: '강원도 강릉시', location: '' } },
      { id: '2', start_date: '2026-07-15', end_date: '2026-07-18', guests: 1, total_price: 240000, status: 'confirmed', accommodations: { name: '제주 애월 바다 전망 오피스', region: '제주특별자치도 제주시', location: '' } },
      { id: '3', start_date: '2026-07-20', end_date: '2026-07-22', guests: 3, total_price: 320000, status: 'confirmed', accommodations: { name: '속초 설악산 전망 워케이션', region: '강원특별자치도 속초시', location: '' } },
    ] as any)
    setSubsidies([
      { region: '강원도', name: '강원도 워케이션 체류 지원', amount_per_person: 50000 },
      { region: '제주특별자치도', name: '제주도 청년 워케이션 바우처', amount_per_person: 40000 },
    ])
    setCompany('더 워케이션 데모 기업')
    setLoading(false)
  }, [])

  const confirmed = bookings
  const participants = confirmed.reduce((s, b) => s + (b.guests || 0), 0)
  const totalBudget  = confirmed.reduce((s, b) => s + (b.total_price || 0), 0)

  const subsidySaved = confirmed.reduce((s, b) => {
    const region = b.accommodations?.region || ''
    if (!region) return s
    return s + subsidies
      .filter(sub => regionMatch(region, sub.region))
      .reduce((a, sub) => a + (sub.amount_per_person || 0) * (b.guests || 0), 0)
  }, 0)

  const latest       = confirmed[0]
  const accomName    = latest?.accommodations?.name || '워케이션 숙소'
  const region       = latest?.accommodations?.region || ''
  const startDate    = latest?.start_date || ''
  const endDate      = latest?.end_date || ''
  const days         = startDate && endDate ? daysBetween(startDate, endDate) : 3

  const carbonSaved  = Math.round(28.5 * 2 * days * (participants || 28) * 0.21)
  const localSpend   = (participants || 28) * days * 100000
  const roi          = totalBudget > 0
    ? (((participants * 84 * 50000) - totalBudget) / totalBudget + 1).toFixed(1)
    : '3.2'

  const generateAI = useCallback(async () => {
    setAiLoading(true)
    setAiError('')
    try {
      const res = await fetch('/api/report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          accommodationName: accomName,
          region,
          startDate,
          endDate,
          participants: participants || 28,
          totalBudget,
          subsidySaved,
          days,
        }),
      })
      const data = await res.json()
      if (data.summary) setAiSummary(data.summary)
      else setAiError(data.error || 'AI 생성에 실패했습니다.')
    } catch {
      setAiError('서버 오류가 발생했습니다.')
    } finally {
      setAiLoading(false)
    }
  }, [companyName, accomName, region, startDate, endDate, participants, totalBudget, subsidySaved, days])

  const summaryText = aiSummary || (
    `이번 워케이션(${participants || 28}명)은 직원 만족도 +18%p, 팀 결속력 +19%p 향상을 이끌어냈습니다. ` +
    `특히 개발 및 디자인 부서의 번아웃 지수가 대폭 감소(-21%p)하였으며, ` +
    `지원금 ${(subsidySaved || 0).toLocaleString()}원 절감으로 실질 비용 부담이 줄어들어 ` +
    `투자 대비 생산성·리텐션 효과를 종합한 ROI는 ${roi}배로 측정됩니다. ` +
    `또한 통근 거리 감소로 인한 탄소 ${carbonSaved}kg 저감은 ESG 경영 지표에 즉시 반영 가능합니다.`
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header role="hr" />

      {/* 히어로 섹션 */}
      <div className="bg-[#0F172A] text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="max-w-5xl mx-auto px-6 py-12 relative z-10">
          <Link href="/dashboard" className="text-sm font-medium text-blue-300 hover:text-white transition-colors mb-4 inline-flex items-center gap-1">
            ← 대시보드
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs font-bold border border-white/20">HR Report</span>
                <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30">Auto Generated</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-2">워케이션 종합 성과 분석 리포트</h1>
              {loading ? (
                <p className="text-slate-400">데이터를 분석하고 있습니다...</p>
              ) : (
                <p className="text-slate-300 text-lg">
                  {companyName} <span className="text-slate-500 mx-2">|</span> 
                  총 {participants || 28}명 참여 <span className="text-slate-500 mx-2">|</span>
                  {days}일간의 워케이션 임팩트
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl font-bold transition-all border border-white/10">
                <span>🖨️</span> PDF 저장
              </button>
              <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20">
                경영진 보고서 제출 <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        
        {/* 1. 경영진 요약 (Executive Summary) */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-5 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <span className="text-xl">📋</span> Executive Summary
            </h2>
            <button
              onClick={generateAI}
              disabled={aiLoading}
              className="text-xs font-bold px-4 py-2 bg-white text-blue-600 rounded-lg shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow transition-all flex items-center gap-2"
            >
              {aiLoading ? (
                <><span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> AI 분석 중...</>
              ) : (
                <><span>✨</span> AI 심층 분석 재생성</>
              )}
            </button>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-4 gap-6 mb-8">
              {[
                { label: '종합 ROI', value: `${roi}x`, sub: '투자 대비 효과', icon: '📈', color: 'from-blue-500 to-indigo-600' },
                { label: 'eNPS 점수 향상', value: '+18%p', sub: '직원 추천 지수', icon: '💖', color: 'from-emerald-400 to-teal-500' },
                { label: '비용 절감(지원금)', value: `${(subsidySaved/10000).toFixed(0)}만원`, sub: '지자체 혜택', icon: '💰', color: 'from-purple-500 to-fuchsia-600' },
                { label: '탄소 배출 저감', value: `${carbonSaved}kg`, sub: 'ESG 기여도', icon: '🌿', color: 'from-amber-400 to-orange-500' },
              ].map(s => (
                <div key={s.label} className="relative group overflow-hidden rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all">
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${s.color}`} />
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-2xl">{s.icon}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md bg-slate-50 text-slate-500`}>Impact</span>
                  </div>
                  <div className="text-3xl font-black text-slate-800 tracking-tight mb-1">{s.value}</div>
                  <div className="text-sm font-bold text-slate-600">{s.label}</div>
                  <div className="text-xs text-slate-400 mt-1">{s.sub}</div>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 text-sm text-slate-700 leading-relaxed border border-slate-100 relative">
              <div className="absolute top-6 left-6 text-2xl opacity-20">❝</div>
              <div className="pl-10 relative z-10">
                {aiLoading ? (
                  <div className="flex items-center gap-3 text-blue-600 font-semibold py-2">
                    <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    수십 개의 데이터를 바탕으로 AI 인사이트를 도출하고 있습니다...
                  </div>
                ) : aiError ? (
                  <p className="text-red-500 font-medium">{aiError}</p>
                ) : (
                  <p className="font-medium text-[15px]">{summaryText}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. 상세 지표 대시보드 (2단 그리드) */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          
          {/* 지표 전후 비교 */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">📊 6대 핵심 조직 문화 지표 변화</h3>
              <p className="text-xs text-slate-500 mt-1">워케이션 전후 데이터 (SaaS 트래킹 및 익명 설문 기반)</p>
            </div>
            <div className="p-6">
              {PERF_BENCHMARKS.map((p, idx) => {
                const diff   = p.reverse ? p.before - p.after : p.after - p.before
                const isGood = p.reverse ? p.after < p.before : p.after > p.before
                return (
                  <div key={p.label} className={`flex items-center gap-4 p-3 rounded-xl ${idx % 2 === 0 ? 'bg-slate-50/50' : ''}`}>
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-lg shadow-sm shrink-0">
                      {p.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-bold text-slate-700">{p.label}</span>
                        <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${isGood ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {p.reverse ? '▼' : '▲'} {Math.abs(diff)}{p.unit}
                        </span>
                      </div>
                      
                      <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                        {p.before < p.after ? (
                          <>
                            <div className="h-full bg-slate-300" style={{ width: `${p.before}%` }} />
                            <div className="h-full bg-blue-500" style={{ width: `${p.after - p.before}%` }} />
                          </>
                        ) : (
                          <>
                            <div className="h-full bg-blue-500" style={{ width: `${p.after}%` }} />
                            <div className="h-full bg-slate-300" style={{ width: `${p.before - p.after}%` }} />
                          </>
                        )}
                      </div>
                      <div className="flex justify-between mt-1 text-[10px] font-semibold text-slate-400">
                        <span>전: {p.before}{p.unit}</span>
                        <span>후: {p.after}{p.unit}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 추가 분석 컨테이너 */}
          <div className="flex flex-col gap-8">
            
            {/* 부서별 참여율 및 효과 */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex-1">
              <div className="px-8 py-6 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-800">🏢 부서별 참여도 및 생산성 향상률</h3>
                <p className="text-xs text-slate-500 mt-1">어떤 팀에서 가장 효과가 컸을까요?</p>
              </div>
              <div className="p-6 flex flex-col gap-5">
                {[
                  { dept: '개발 (Engineering)', part: 45, prod: '+22%', color: 'bg-blue-500' },
                  { dept: '기획 (Product)', part: 30, prod: '+15%', color: 'bg-indigo-500' },
                  { dept: '디자인 (Design)', part: 15, prod: '+28%', color: 'bg-purple-500' },
                  { dept: '마케팅 (Marketing)', part: 10, prod: '+12%', color: 'bg-teal-500' },
                ].map(d => (
                  <div key={d.dept}>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-xs font-bold text-slate-700">{d.dept}</span>
                      <span className="text-xs font-bold text-slate-500">생산성 {d.prod}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${d.color} rounded-full`} style={{ width: `${d.part}%` }} />
                      </div>
                      <span className="text-xs font-bold w-8 text-right text-slate-600">{d.part}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SaaS 툴 연동 현황 리디자인 */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-sm border border-slate-700 overflow-hidden text-white relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-2xl rounded-full" />
              <div className="px-8 py-5 border-b border-slate-700/50">
                <h3 className="text-base font-black flex items-center gap-2">
                  <span>⚡</span> 업무 툴 (SaaS) 활성 데이터
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">💬</span>
                      <span className="text-sm font-bold">Slack</span>
                    </div>
                    <div className="text-2xl font-black text-emerald-400 mb-1">+34%</div>
                    <div className="text-[10px] text-slate-400">메시지 응답 속도 향상</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">📝</span>
                      <span className="text-sm font-bold">Notion</span>
                    </div>
                    <div className="text-2xl font-black text-blue-400 mb-1">+52%</div>
                    <div className="text-[10px] text-slate-400">문서 공동편집 증가</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. ESG & 재무 요약 */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="col-span-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-blue-100">
              📉
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">이직 비용 절감</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">
              직원 이직 의향 감소(-19%p)로 인해 발생한 예상 채용 및 온보딩 절감 비용
            </p>
            <div className="text-2xl font-black text-blue-600 mt-auto">
              약 1.2억원 <span className="text-xs font-normal text-slate-400">/ 연간</span>
            </div>
          </div>

          <div className="col-span-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-emerald-100">
              🌱
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">ESG 기후테크 성과</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">
              통근 대체 효과로 인한 탄소 배출 저감 및 지역사회 활성화 기여도
            </p>
            <div className="text-xl font-black text-emerald-600 mt-auto flex flex-col gap-1">
              <span>{carbonSaved}kg CO₂ 저감</span>
              <span className="text-xs text-slate-400 font-medium">지역 경제 기여: {(localSpend/10000).toLocaleString()}만원</span>
            </div>
          </div>

          <div className="col-span-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center text-center">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-purple-100">
              💸
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">보조금 혜택 현황</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">
              지자체 워케이션 활성화 지원금을 통해 환급받아 실질적으로 아낀 기업 예산
            </p>
            <div className="text-2xl font-black text-purple-600 mt-auto">
              {(subsidySaved/10000).toLocaleString()}만원 <span className="text-xs font-normal text-slate-400">확보</span>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
