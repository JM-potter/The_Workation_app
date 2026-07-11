'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Header from '@/components/ui/Header'
import Footer from '@/components/ui/Footer'
import Button from '@/components/ui/Button'
import { supabase, BYPASS_AUTH } from '@/lib/supabase'

export default function EmployeeSelectPage() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        if (BYPASS_AUTH) {
          setUserName('김지민')
          setCompanyName('더 워케이션')
        } else {
          router.push('/login')
        }
      } else {
        const meta = data.user.user_metadata
        setUserName(meta?.name || '임직원')
        setCompanyName(meta?.company_name || '파트너사')
      }
      setLoading(false)
    })
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#475569]">포탈로 이동 중입니다...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        {/* 상단 웰컴 메시지 */}
        <div className="text-center mb-12 animate-fade-in">
          <span className="inline-block bg-blue-500/10 text-blue-600 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-blue-500/20">
            {companyName} 임직원 전용 포탈
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
            안녕하세요, <span className="text-blue-600">{userName}님</span> 👋
          </h1>
          <p className="text-sm sm:text-base text-[#475569] mt-3 max-w-lg mx-auto">
            오늘 워케이션지에서의 일정을 선택해 주세요. <br />
            자유로운 쉼과 생산적인 집중을 모두 지원합니다.
          </p>
        </div>

        {/* 2선택 카드 카드 레이아웃 */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto w-full">
          {/* 카드 1: 숙소 예약 */}
          <Link href="/accommodations" className="group">
            <div className="h-full bg-white border border-[#E2E8F0] hover:border-blue-400 hover:shadow-[0_10px_30px_rgba(59,130,246,0.08)] rounded-2xl p-8 transition-all duration-300 flex flex-col justify-between transform hover:-translate-y-1">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-3xl mb-6 shadow-md shadow-blue-500/10 group-hover:scale-110 transition-transform duration-300">
                  🏖️
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-xl font-bold text-[#0F172A] group-hover:text-blue-600 transition-colors">
                    숙소 예약 및 탐색
                  </h2>
                  <span className="text-[10px] font-bold bg-[#F1F5F9] text-[#475569] px-2 py-0.5 rounded">
                    Booking
                  </span>
                </div>
                <p className="text-sm text-[#475569] leading-relaxed mb-6">
                  지자체 지원 혜택이 적용되는 숙소를 탐색하고 예약을 관리하세요. 새로운 워케이션을 위한 숙소를 찾아봅니다.
                </p>
              </div>
              <div className="pt-4 border-t border-[#F1F5F9] flex items-center justify-between">
                <span className="text-sm font-semibold text-[#475569] group-hover:text-blue-600 transition-colors">
                  숙소 둘러보기
                </span>
                <span className="text-sm transform group-hover:translate-x-1.5 transition-transform duration-300 text-blue-500">
                  →
                </span>
              </div>
            </div>
          </Link>

          {/* 카드 2: 실시간 업무 측정 */}
          <Link href="/my-workation" className="group">
            <div className="h-full bg-white border border-[#E2E8F0] hover:border-purple-400 hover:shadow-[0_10px_30px_rgba(168,85,247,0.08)] rounded-2xl p-8 transition-all duration-300 flex flex-col justify-between transform hover:-translate-y-1">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-3xl mb-6 shadow-md shadow-purple-500/10 group-hover:scale-110 transition-transform duration-300">
                  📈
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-xl font-bold text-[#0F172A] group-hover:text-purple-600 transition-colors">
                    실시간 업무 측정 및 증빙
                  </h2>
                  <span className="text-[10px] font-bold bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded">
                    Work Measurement
                  </span>
                </div>
                <p className="text-sm text-[#475569] leading-relaxed mb-6">
                  SaaS API(Slack, GitHub 등) 연동을 통해 비침해적으로 업무 성과를 측정하고 지자체 보조금 심사용 근태를 증빙합니다.
                </p>
              </div>
              <div className="pt-4 border-t border-[#F1F5F9] flex items-center justify-between">
                <span className="text-sm font-semibold text-[#475569] group-hover:text-purple-600 transition-colors">
                  업무 측정 대시보드 입장
                </span>
                <span className="text-sm transform group-hover:translate-x-1.5 transition-transform duration-300 text-purple-500">
                  →
                </span>
              </div>
            </div>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
