'use client'
import { useState } from 'react'
import Link from 'next/link'
import Footer from '@/components/ui/Footer'
import Header from '@/components/ui/Header'

const MOCK_APPLICATIONS = [
  { id: 1, company: '더 워케이션 데모 기업', user: '김지민 (기획팀)', dates: '26.07.10 ~ 07.12', reqAmount: 100000, status: 'pending', docs: '사업자등록증, 재직증명서 완비' },
  { id: 2, company: 'AITech 스타트업', user: '박준호 (개발팀)', dates: '26.07.14 ~ 07.16', reqAmount: 150000, status: 'approved', docs: '검토 완료' },
  { id: 3, company: '글로벌 디자인 에이전시', user: '이수아 (디자인팀)', dates: '26.07.18 ~ 07.22', reqAmount: 200000, status: 'pending', docs: '사업자등록증, 재직증명서 완비' },
]

const MOCK_PROOFS = [
  { id: 101, company: '이노베이션 랩스', user: '최동현 (마케팅)', dates: '26.06.20 ~ 06.22', reqAmount: 100000, status: 'pending', proof: '결제 영수증, 위치/근태 인증 완료' },
  { id: 102, company: '더 워케이션 데모 기업', user: '김지민 (기획팀)', dates: '26.06.25 ~ 06.27', reqAmount: 100000, status: 'pending', proof: '결제 영수증, 위치/근태 인증 완료' },
]

export default function GovDashboardPage() {
  const [applications, setApplications] = useState(MOCK_APPLICATIONS)
  const [proofs, setProofs] = useState(MOCK_PROOFS)

  const handleApproveApp = (id: number) => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' } : a))
    alert('✅ 사전 참가 승인이 완료되었습니다. 해당 기업 HR 담당자에게 승인 알림이 발송됩니다.')
  }

  const handleApproveProof = (id: number) => {
    setProofs(prev => prev.filter(p => p.id !== id))
    alert('✅ 사후 증빙 서류 심사가 완료되었습니다. 해당 기업으로 지원금 100,000원이 송금(정산)됩니다.')
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header role="gov" />

      {/* 헤더 배너 */}
      <div className="bg-gradient-to-r from-teal-900 to-emerald-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-emerald-500/30 text-emerald-300 px-3 py-1 rounded-full text-xs font-black border border-emerald-400/30">강원도 워케이션 센터</span>
            <span className="text-white/80 text-sm font-medium">지자체 전용 통합 심사 플랫폼</span>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight mb-2">지자체 통합 관리 대시보드</h1>
              <p className="text-emerald-100 text-lg">플랫폼을 통해 표준화된 공문서를 접수받아 심사 시간이 90% 단축됩니다.</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-emerald-200 mb-1">2026년 하반기 배정 예산 잔여액</p>
              <div className="text-4xl font-black">285,400,000<span className="text-xl ml-1">원</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        
        {/* KPI 요약 */}
        <div className="grid grid-cols-4 gap-6 mb-10">
          {[
            { label: '접수된 총 기업 수', value: '42개사', icon: '🏢', color: 'text-slate-700' },
            { label: '사전 승인 대기', value: `${applications.filter(a => a.status === 'pending').length}건`, icon: '📝', color: 'text-amber-600' },
            { label: '사후 증빙 심사 대기', value: `${proofs.length}건`, icon: '🔍', color: 'text-blue-600' },
            { label: '누적 지원금 집행액', value: '2.1억원', icon: '💸', color: 'text-emerald-600' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center text-2xl border border-slate-100 shrink-0">
                {s.icon}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 mb-1">{s.label}</div>
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* 1. 사전 참가 신청 관리 */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <span>1️⃣</span> 사전 참가 승인 대기
                </h2>
                <p className="text-xs text-slate-500 mt-1">기업 HR에서 원클릭으로 접수한 신청서 내역입니다.</p>
              </div>
              <span className="bg-amber-100 text-amber-700 font-bold px-3 py-1 rounded-full text-xs">
                {applications.filter(a => a.status === 'pending').length}건 대기중
              </span>
            </div>
            
            <div className="p-2 flex-1">
              {applications.map(app => (
                <div key={app.id} className={`p-5 m-2 rounded-2xl border transition-all ${app.status === 'pending' ? 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-800">{app.company}</span>
                        {app.status === 'pending' ? (
                          <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded font-bold">심사 대기</span>
                        ) : (
                          <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded font-bold">승인 완료</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">신청자: {app.user} | 일정: {app.dates}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400 mb-0.5">예상 지원금</div>
                      <div className="text-sm font-black text-slate-700">{app.reqAmount.toLocaleString()}원</div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 flex items-center gap-3">
                    <span className="text-lg">📎</span>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-700 mb-0.5">첨부 서류 검증 결과</div>
                      <div className="text-[11px] text-emerald-600 font-medium">✅ {app.docs} (Auto-Docs 연동)</div>
                    </div>
                    <button className="text-[10px] px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded hover:bg-slate-100 font-bold">
                      서류 열람
                    </button>
                  </div>

                  {app.status === 'pending' && (
                    <div className="flex gap-2 mt-2">
                      <button className="flex-1 text-xs py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors">
                        반려
                      </button>
                      <button 
                        onClick={() => handleApproveApp(app.id)}
                        className="flex-1 text-xs py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500 transition-colors shadow-sm"
                      >
                        신청 승인 (예산 확보)
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 2. 사후 증빙 심사 관리 */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <span>2️⃣</span> 사후 증빙 심사 및 정산
                </h2>
                <p className="text-xs text-slate-500 mt-1">플랫폼이 자동 렌더링한 표준 정산 보고서를 심사합니다.</p>
              </div>
              <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-xs">
                {proofs.length}건 대기중
              </span>
            </div>
            
            <div className="p-2 flex-1">
              {proofs.map(proof => (
                <div key={proof.id} className="p-5 m-2 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-800">{proof.company}</span>
                        <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded font-bold">정산 대기</span>
                      </div>
                      <div className="text-xs text-slate-500">이용자: {proof.user} | 완료: {proof.dates}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400 mb-0.5">정산 요청액</div>
                      <div className="text-sm font-black text-blue-600">{proof.reqAmount.toLocaleString()}원</div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 mb-4 flex items-center gap-3">
                    <span className="text-lg">🖨️</span>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-700 mb-0.5">정산 결과보고서 (PDF)</div>
                      <div className="text-[11px] text-blue-600 font-medium">✨ {proof.proof} (100% 충족)</div>
                    </div>
                    <Link href="/dashboard/subsidy-report">
                      <button className="text-[10px] px-3 py-1.5 bg-white border border-blue-200 text-blue-700 rounded hover:bg-blue-50 font-bold shadow-sm">
                        보고서 검토
                      </button>
                    </Link>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button className="flex-1 text-xs py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors">
                      보완 요청
                    </button>
                    <button 
                      onClick={() => handleApproveProof(proof.id)}
                      className="flex-1 text-xs py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-colors shadow-sm"
                    >
                      최종 승인 및 지원금 송금
                    </button>
                  </div>
                </div>
              ))}

              {proofs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <span className="text-4xl mb-3">🎉</span>
                  <p className="text-sm font-bold">모든 사후 심사를 완료했습니다!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
