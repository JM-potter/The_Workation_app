import Header from '@/components/ui/Header'
import Footer from '@/components/ui/Footer'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />

      {/* Hero Section */}
      <section className="relative w-full h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&q=80" 
            alt="Team working in a beautiful environment" 
            className="w-full h-full object-cover brightness-50"
          />
        </div>
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto mt-16">
          <span className="text-blue-300 font-bold tracking-widest text-sm mb-4 block uppercase">Our Vision</span>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6 break-keep">
            완벽한 3박자 선순환 생태계
          </h1>
          <p className="text-lg text-slate-200 leading-relaxed break-keep">
            '더 워케이션'은 단순한 숙소 예약 서비스가 아닙니다.<br className="hidden md:block" />
            기업의 성과, 임직원의 재충전, 그리고 지역 사회의 자생력을<br className="hidden md:block" /> 
            하나의 시스템으로 연결하는 B2B SaaS 플랫폼입니다.
          </p>
          <p className="text-md text-slate-300 mt-4 leading-relaxed break-keep">
            우리는 호스피탈리티(Hospitality) 수준의 완벽한 휴식 경험이 최고의 성과를 견인하고,<br className="hidden md:block" />
            그 성과가 다시 지역을 살리는 거대한 선순환 구조를 만듭니다.
          </p>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-[#0F172A] mb-4">우리가 만드는 3가지 핵심 가치</h2>
            <div className="w-16 h-1 bg-blue-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Value 1: Enterprise */}
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">
                🏢
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-2 flex flex-col">
                <span className="text-blue-600 text-sm font-semibold mb-1">기업 (HR/CEO)</span>
                압도적 업무 능률과<br />투명한 통제력
              </h3>
              <ul className="text-sm text-slate-600 space-y-4 mt-6">
                <li className="flex gap-2">
                  <span className="text-blue-500 shrink-0">✓</span>
                  <span className="break-keep"><strong>목표 기반 조기 퇴근(Sprint & Off)</strong> 시스템으로 시간 낭비 없이 170%의 업무 압축률을 달성합니다.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500 shrink-0">✓</span>
                  <span className="break-keep"><strong>'사업장 밖 간주근로 특약' 자동 생성 및 1-Billing(통합 정산)</strong>으로 인사팀의 행정 및 노무 리스크를 0으로 만듭니다.</span>
                </li>
              </ul>
            </div>

            {/* Value 2: Employees */}
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">
                🧑‍💻
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-2 flex flex-col">
                <span className="text-emerald-600 text-sm font-semibold mb-1">임직원</span>
                번아웃 제로,<br />진정한 디지털 디톡스
              </h3>
              <ul className="text-sm text-slate-600 space-y-4 mt-6">
                <li className="flex gap-2">
                  <span className="text-emerald-500 shrink-0">✓</span>
                  <span className="break-keep">답답한 ERP가 아닌, <strong>B2C 여행 앱처럼 직관적이고 설레는 신청 경험</strong>을 제공합니다.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-500 shrink-0">✓</span>
                  <span className="break-keep">귀찮은 설문조사 대신 시스템 행동 로그 기반의 <strong>'무설문 성과 리포트'</strong>로 눈치 보지 않는 완벽한 뇌 휴식을 보장합니다.</span>
                </li>
              </ul>
            </div>

            {/* Value 3: Local Community */}
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">
                🌊
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-2 flex flex-col">
                <span className="text-sky-600 text-sm font-semibold mb-1">지역 사회</span>
                소비를 넘어선<br />지속 가능한 상생
              </h3>
              <ul className="text-sm text-slate-600 space-y-4 mt-6">
                <li className="flex gap-2">
                  <span className="text-sky-500 shrink-0">✓</span>
                  <span className="break-keep"><strong>지자체 보조금 자동 렌더링 엔진</strong>으로 지역의 인프라와 기업의 자본을 막힘없이 연결합니다.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sky-500 shrink-0">✓</span>
                  <span className="break-keep">단순 체류를 넘어 제주 바다숲(해조류) 조성 등 <strong>지역 해양 생태계 복원과 기업의 ESG 활동이 자연스럽게 맞물리는 문화</strong>를 구축합니다.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Evolution Section */}
      <section className="py-24 bg-white px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="w-full md:w-1/2 rounded-3xl overflow-hidden shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80" 
              alt="Evolution of working style" 
              className="w-full h-full object-cover aspect-video md:aspect-square"
            />
          </div>
          <div className="w-full md:w-1/2">
            <span className="text-blue-600 font-bold text-sm mb-3 block">Evolution of Work</span>
            <h2 className="text-3xl md:text-4xl font-black text-[#0F172A] mb-6 leading-tight break-keep">
              일하는 방식의 진화
            </h2>
            <p className="text-[#475569] leading-relaxed mb-6 break-keep">
              강력한 리더십과 체계적인 작전 수행 능력으로 기업의 워케이션 도입을 가장 전략적이고 안전하게 지휘합니다.
            </p>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
              <p className="text-[#334155] font-medium leading-relaxed break-keep">
                대표에게는 투명한 성과(ROI) 데이터를,<br />
                직원에게는 설레는 쉼표를 제공하여<br />
                <strong>핵심 인재 이탈(Retention)을 방어하는 최고의 파트너</strong>가 되겠습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
