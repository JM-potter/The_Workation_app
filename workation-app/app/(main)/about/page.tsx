'use client'
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import Header from '@/components/ui/Header'
import Footer from '@/components/ui/Footer'
import Button from '@/components/ui/Button'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased overflow-x-hidden">
      <Header />

      {/* Hero Section */}
      <section className="relative py-24 px-6 text-center overflow-hidden bg-white border-b-2 border-slate-900">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-b from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-900 text-xs font-black px-4 py-2 rounded-full mb-6 border-2 border-slate-900 uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            🎯 B2B 솔루션 가설 검증 장표 (Validation Deck)
          </span>
          <h1 className="text-3xl sm:text-6xl font-black leading-none tracking-tight mb-6 text-slate-950">
            경쟁사는 안내하고,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600">
              더 워케이션은 해결합니다
            </span>
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed font-semibold">
            더 워케이션은 단순 숙소 연계를 넘어 **"도입 명분 부족", "업무 성과 불확실성", "지자체 행정의 번거로움"** 그리고 가장 본질적인 **"직원과 회사 간의 신뢰 장벽"**을 해결하는 B2B 행정 자동화 SaaS 및 성과 인증 솔루션입니다.
          </p>
        </div>
      </section>

      {/* 4대 핵심 문제 정의 */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-black text-red-600 tracking-widest uppercase bg-red-100 px-2.5 py-1 rounded border border-red-300">The Problems</span>
          <h2 className="text-3xl sm:text-4xl font-black mt-4 text-slate-900 tracking-tight">우리가 발견한 4가지 핵심 문제 장벽</h2>
          <div className="w-12 h-1.5 bg-red-500 rounded-full mx-auto mt-4" />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {[
            {
              title: '💡 도입 명분(Benefits)의 부재',
              desc: '회사가 비용과 리소스를 들여 워케이션을 보내주어야 하는 명확한 경영상의 명분이 부족합니다. 단순 휴양이나 일회성 복지에 그친다는 경영진의 인식이 강합니다.'
            },
            {
              title: '📉 업무 성과(Performance) 측정 불가',
              desc: '사무실 밖 원격 근무지에서 임직원이 실제로 몰입하여 산출물을 내고 있는지 객관적으로 파악하고 정량화할 수 있는 기준이나 협업 도구가 없습니다.'
            },
            {
              title: '🏛️ 복잡한 행정으로 인한 정보 격차',
              desc: '전국의 많은 지자체들이 예산(보조금)과 워케이션 센터 인프라를 지원하지만, 복잡한 신청/사후 증빙 절차로 인해 기업들이 혜택을 인지하지 못하거나 포기합니다.'
            },
            {
              title: '🔒 가장 본질적인 장벽: 직원과 회사 간의 \'신뢰\'',
              desc: '보이지 않는 곳에서 일하는 직원을 온전히 신뢰할 수 있는가에 대한 문화적·제도적 한계가 존재합니다. 마이크로 매니징(감시) 없이도 신뢰를 구축할 수 있는 안전장치가 필수적입니다.',
              highlight: true
            }
          ].map((prob, i) => (
            <div key={i} className={`bg-white border-2 border-slate-900 rounded-2xl p-6 transition-all duration-300 ${
              prob.highlight 
                ? 'bg-rose-50/50 border-red-500 shadow-[4px_4px_0px_0px_rgba(239,68,68,0.2)]' 
                : 'hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]'
            }`}>
              <h3 className="font-black text-slate-900 text-lg mb-3">{prob.title}</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">{prob.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Core Logic & Solution */}
      <section className="bg-slate-900 text-white py-20 px-6 border-y-2 border-slate-950 relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-black text-blue-400 tracking-widest uppercase bg-blue-950 px-2.5 py-1 rounded border border-blue-900">How We Solve It</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-4 text-white tracking-tight">신뢰와 효율의 장벽을 해결하는 더 워케이션의 3대 솔루션</h2>
            <div className="w-12 h-1.5 bg-blue-500 rounded-full mx-auto mt-4" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* 알리바이 대시보드 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-blue-500/50 transition-all">
              <div>
                <div className="text-3xl mb-4">🍅</div>
                <h3 className="text-lg font-black mb-2 text-white">알리바이 대시보드 (Alibi)</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  감시(Monitoring) 대신 자율적인 마이크로 목표 선언과 뽀모도로 타이머 세션을 통해, 임직원은 떳떳하게 몰입을 인증하고 회사는 신뢰할 수 있는 업무 데이터를 확보합니다.
                </p>
              </div>
              <Link href="/focus">
                <span className="inline-block text-xs font-bold text-blue-400 hover:text-blue-300">알리바이 타이머 체험하기 →</span>
              </Link>
            </div>

            {/* 1-Billing 정산 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-500/50 transition-all">
              <div>
                <div className="text-3xl mb-4">💳</div>
                <h3 className="text-lg font-black mb-2 text-white">1-Billing 통합 정산</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  수십 개의 개별 영수증을 취합할 필요 없이, 지자체 지원금을 실시간으로 자동 선공제하여 한 달에 1회 단일 통합 인보이스로 일괄 결제 및 투명한 법인세 세무 처리를 지원합니다.
                </p>
              </div>
              <Link href="/dashboard/billing">
                <span className="inline-block text-xs font-bold text-emerald-400 hover:text-emerald-300">원빌링 시뮬레이터 체험하기 →</span>
              </Link>
            </div>

            {/* 위치 인증 & 서류 자동화 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-purple-500/50 transition-all">
              <div>
                <div className="text-3xl mb-4">📍</div>
                <h3 className="text-lg font-black mb-2 text-white">지오펜싱 위치 기반 인증</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  지정된 코워킹 오피스 공간 GPS 검증을 통해 투명한 출퇴근 인증을 연동하고, 지자체 보조금 신청을 위한 행정 증빙용 PDF 보고서를 마우스 클릭 한 번으로 자동 완성합니다.
                </p>
              </div>
              <Link href="/focus">
                <span className="inline-block text-xs font-bold text-purple-400 hover:text-purple-300">지자체 PDF 발행 체험하기 →</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4대 기업 혜택 */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-black text-blue-600 tracking-widest uppercase bg-blue-100 px-2.5 py-1 rounded border border-blue-300">Corporate Benefits</span>
          <h2 className="text-3xl sm:text-4xl font-black mt-4 text-slate-900 tracking-tight">워케이션 도입을 주저할 이유가 없는 4대 기업 혜택</h2>
          <div className="w-12 h-1.5 bg-blue-600 rounded-full mx-auto mt-4" />
        </div>

        <div className="flex flex-col gap-10">
          {/* 1. HR 관점 */}
          <div className="bg-white border-2 border-slate-900 rounded-2xl p-6 md:p-8 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4 mb-6">
              <div>
                <span className="text-xs font-black bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-1 rounded uppercase tracking-wider mb-2 inline-block">
                  Perspective 01. HR 관점
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950">대체 불가능한 핵심 인재 퇴사 방어 (Retention)</h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase block">핵심 근거 지표</span>
                <span className="text-xl font-black text-rose-600">이직 선호도 80% ↑ / 채용 대체 비용 30%~50%</span>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-sm font-black text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200">
                💡 핵심 주장: 워케이션 비용은 단순 지출이 아니라, 수천만 원짜리 인재 이탈을 막는 가장 가성비 좋은 '리텐션 방어 비용'이다.
              </p>
              <div className="grid md:grid-cols-2 gap-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">📊 객관적 근거 (데이터)</h4>
                  <ul className="list-disc pl-4 space-y-1.5">
                    <li><strong>대체 채용 비용의 팩트</strong>: 미국 인적자원관리협회(SHRM) 등에 따르면 핵심 인력 1명이 퇴사 후 새 대체 인력을 구하고 온보딩하는 비용은 해당 연봉의 30%~50%(평균 수천만 원)에 달합니다.</li>
                    <li><strong>MZ세대의 수요</strong>: 잡코리아 설문 결과 밀레니얼/Z세대 직장인 80% 이상이 유연근무 및 워케이션이 도입된 기업으로의 이직을 강력 선호합니다.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">🏢 대기업 도입 실제 사례</h4>
                  <p>
                    <strong>토스(Toss) & 당근마켓</strong>: 연봉 인상 경쟁 출혈 대신, '겨울방학(Workation)' 및 '어디서든 일할 수 있는 원격 근무 제도'를 선제 도입하여 핵심 개발자의 이탈률을 획기적으로 낮추고 외부 우수 인재를 블랙홀처럼 흡수했습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. 경영/인증 관점 */}
          <div className="bg-white border-2 border-slate-900 rounded-2xl p-6 md:p-8 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4 mb-6">
              <div>
                <span className="text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1 rounded uppercase tracking-wider mb-2 inline-block">
                  Perspective 02. 경영/인증 관점
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950">정부 사업 입찰 가점 및 대외 스펙 확보</h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase block">핵심 획득 혜택</span>
                <span className="text-xl font-black text-amber-600">조달청 공공 입찰 신인도 가점 1~2점</span>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-sm font-black text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200">
                💡 핵심 주장: 워케이션은 단순한 여가가 아니라, 기업의 B2G/B2B 매출 확대를 위한 '영업용 인증 스펙'을 쌓는 행위이다.
              </p>
              <div className="grid md:grid-cols-2 gap-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">🏛️ 객관적 근거 (제도 및 혜택)</h4>
                  <ul className="list-disc pl-4 space-y-1.5">
                    <li><strong>가족/여가친화인증 정량 지표</strong>: 여성가족부 '가족친화인증', 문체부 '여가친화인증' 심사 시 [유연근무 활용률] 및 [휴양시설 지원제도]가 핵심 정량 배점으로 명시되어 있습니다.</li>
                    <li><strong>확정 법령 혜택</strong>: 우수기업 인증 획득 시 조달청 공공입찰 가점 1~2점(수주 당락 결정점수), 신보/기보 보증료율 감면, 출입국 우대 등 즉각적 법적 혜택 수혜.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">🏢 실제 사례</h4>
                  <p>
                    에듀테크 <strong>'클래스팅'</strong>과 HR 플랫폼 <strong>'플렉스(flex)'</strong>는 임직원 워케이션 지원 제도를 증빙 자료로 제출하여 우수기업에 선정되었으며, 이를 대외 공식 PR 및 투자 유치(IR) 스펙자료로 적극 활용 중입니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. 재무 관점 */}
          <div className="bg-white border-2 border-slate-900 rounded-2xl p-6 md:p-8 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4 mb-6">
              <div>
                <span className="text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-300 px-2.5 py-1 rounded uppercase tracking-wider mb-2 inline-block">
                  Perspective 03. 재무 관점
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950">법인세 절감과 '1+1 예산 레버리지'</h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase block">핵심 세무 근거</span>
                <span className="text-xl font-black text-indigo-600">법인세법 시행령 제45조 100% 손금산입</span>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-sm font-black text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200">
                💡 핵심 주장: 워케이션 비용은 임직원 개인의 소득세 폭탄이 아니라, 기업의 법인세를 합법적으로 낮춰주는 복리후생비(손금)이다.
              </p>
              <div className="grid md:grid-cols-2 gap-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">⚖️ 객관적 근거 (법령 및 세무)</h4>
                  <ul className="list-disc pl-4 space-y-1.5">
                    <li><strong>법인세 절감(비용 처리)</strong>: 임직원 전체를 대상으로 하는 휴양 시설 이용 및 직무 교육훈련비는 법인세법에 의거하여 100% 손금산입 처리되어 법인세 과세 표준을 실질적으로 낮춰줍니다.</li>
                    <li><strong>지원금 비과세 효과</strong>: 지자체에서 제공하는 숙박비 지원금(인당 4만 원 상당) 및 공유 오피스 혜택은 기업 과세 대상 매출로 잡히지 않는 '공짜 레버리지' 자본입니다.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">🏢 실제 실무 사례</h4>
                  <p>
                    대부분의 중견기업 재무팀은 연말(11월~12월)이 되면 당해 연도 이익 증가에 따른 법인세 폭탄을 방어하기 위해 복리후생비 및 교육훈련비 예산 명목으로 오프사이트 워크숍 및 워케이션 예산을 집중 집행하여 법인세를 절감합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. 생산성 관점 */}
          <div className="bg-white border-2 border-slate-900 rounded-2xl p-6 md:p-8 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4 mb-6">
              <div>
                <span className="text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded uppercase tracking-wider mb-2 inline-block">
                  Perspective 04. 생산성 관점
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950">몰입형 오프사이트(Off-site) 스프린트</h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase block">핵심 업무 성과</span>
                <span className="text-xl font-black text-emerald-600">컨텍스트 스위칭 제거 및 딥워크 극대화</span>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-sm font-black text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200">
                💡 핵심 주장: 반복되는 똑같은 사무실의 회의실에서는 혁신이 불가능하다. 워케이션은 '공간의 격리'를 통한 단기 몰입 프로젝트(Sprint) 환경을 의미한다.
              </p>
              <div className="grid md:grid-cols-2 gap-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">🧠 객관적 근거 (이론 및 연구)</h4>
                  <ul className="list-disc pl-4 space-y-1.5">
                    <li><strong>컨텍스트 스위칭 제거</strong>: 개발자나 기획자가 사무실 내 잦은 미팅, 비정기 호출 등 생산성을 끊어놓는 맥락 끊김을 차단하여, 순수 딥워크(Deep Work) 생산성을 극대화합니다.</li>
                    <li><strong>빌 게이츠의 Think Week</strong>: 완전히 단절된 외딴 숲속 별장에서 일주일간 회사의 중대 전략을 구상하던 마이크로소프트의 핵심 의사결정 모델이 현대 B2B 워케이션의 시초입니다.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">🏢 실제 사례</h4>
                  <p>
                    <strong>마이리얼트립</strong>: 신규 핵심 서비스 런칭이나 중요 개발 마일스톤이 있을 때, 해당 TF팀을 통째로 제주도/강원도 워케이션 오피스로 파견하여 일주일 만에 앱 개발 및 테스트를 끝내고 돌아오는 '스프린트 워케이션'으로 속도감 있는 성과를 입증했습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Market Funnel Section */}
      <section className="py-20 px-6 max-w-4xl mx-auto border-t-2 border-slate-900">
        <div className="text-center mb-16">
          <span className="text-xs font-black text-blue-600 tracking-widest uppercase bg-blue-100 px-2.5 py-1 rounded border border-blue-300">Market Potential</span>
          <h2 className="text-3xl sm:text-4xl font-black mt-4 text-slate-900 tracking-tight">지방 소멸 기금 활성화를 이끄는 시장 잠재력</h2>
          <div className="w-12 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mx-auto mt-4" />
        </div>

        <div className="flex flex-col gap-4">
          {[
            { level: 'TAM', title: '글로벌 기업 웰니스 & 원격 복지 시장', size: '30조 원', desc: '글로벌 기업 웰니스 시장 72조 원 중 원격근무 도입 비중 40% 적용 (Allied Market Research)', width: 'w-full', bg: 'from-blue-600 to-indigo-600 shadow-blue-500/20' },
            { level: 'SAM', title: '국내 300인 이상 기업 복지 시장', size: '2조 원', desc: '국내 300인 이상 종사자 300만 명 × 연평균 복지 예산 70만 원 (고용노동부)', width: 'sm:w-[92%] w-full', bg: 'from-indigo-600 to-purple-600 shadow-indigo-500/20' },
            { level: 'SOM', title: '수도권 IT 벤처 및 스타트업 시장', size: '1,000억 원', desc: '수도권 스타트업 4만 개사 중 10% 우선 타겟 × 기업 연평균 예산 2,500만 원 (중소벤처기업부)', width: 'sm:w-[84%] w-full', bg: 'from-purple-600 to-pink-600 shadow-purple-500/20' },
            { level: 'LAM', title: '1차년도 진입 목표 시장', size: '10.5억 원', desc: '초기 IT 스타트업 150개사 × 부서 단위 14명 × 인당 지원 한도 50만 원 거래액 기준', width: 'sm:w-[76%] w-full', bg: 'from-emerald-600 to-teal-600 shadow-emerald-500/20' }
          ].map((m) => (
            <div key={m.level} className={`mx-auto ${m.width} bg-gradient-to-r ${m.bg} text-white rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:scale-[1.01] transition-all duration-300 border-2 border-slate-900`}>
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center font-black text-white shrink-0 text-base border border-white/20">
                {m.level}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-extrabold text-sm sm:text-base text-white">{m.title}</h3>
                  <span className="text-xs bg-white text-slate-900 font-black px-2.5 py-0.5 rounded-full border border-white/20 shadow-sm">{m.size}</span>
                </div>
                <p className="text-xs text-white/80">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CFO & Government Analysis */}
      <section className="bg-slate-50 border-t-2 border-slate-900 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-black text-slate-500 bg-white border border-slate-300 px-2.5 py-1 rounded">Platform Insights</span>
            <h2 className="text-3xl font-black mt-4 text-slate-900 tracking-tight">💡 솔루션 신뢰 검증을 위해 보완 설계된 백엔드 장치</h2>
            <p className="text-xs text-slate-400 mt-2">CFO와 지자체 실무자가 가장 불안해하는 요소를 보완한 플랫폼 기능입니다.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <h3 className="font-black text-slate-900 text-base mb-2">💸 1-Billing 정산의 세무 회계적 적법성</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                재무팀 설득의 가장 핵심은 적법한 세무 처리입니다. 더 워케이션 플랫폼은 복리후생비 또는 교육훈련비로 안전하게 회계 처리될 수 있도록, 다수의 가맹점 영수증을 **단일 법인 전자세금계산서 정산 증빙**으로 통합 연동해 법인세 리스크를 제로화합니다.
              </p>
            </div>
            
            <div className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <h3 className="font-black text-slate-900 text-base mb-2">🏛️ 지자체 예산 소진 사전 예측 알림</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                지자체 예산 소진으로 인한 지원금 중단 사고는 기업의 워케이션 계획에 큰 차질을 줍니다. 본 플랫폼은 각 지자체 예산 현황 API를 실시간 모니터링하여, **예산 소진 30일 전 실시간 알림 서비스**를 제공하여 기업의 리스크를 사전에 완전히 통제합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 py-24 px-6 text-center relative overflow-hidden border-t-2 border-slate-900">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-black/10 rounded-full translate-x-1/2 translate-y-1/2 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-6 leading-tight">
            가상 예약과 툴로 즉시 검증해보세요
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm mb-12 max-w-xl mx-auto leading-relaxed font-semibold">
            비로그인 상태로도 지자체 보조금 연동 1-Billing 정산, 실시간 GPS Geofencing 출근 인증, 뽀모도로 업무 타이머, 지자체 제출용 PDF 서류 출력 기능을 모두 체험해보실 수 있습니다.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/accommodations">
              <Button size="lg" className="!bg-white !text-blue-700 hover:!bg-blue-50 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                1. 숙소 예약 프로세스 체험
              </Button>
            </Link>
            <Link href="/focus">
              <Button size="lg" className="!bg-slate-900 !text-white hover:!bg-slate-800 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                2. 알리바이 대시보드 체험 (GPS/Slack)
              </Button>
            </Link>
            <Link href="/dashboard/billing">
              <Button size="lg" className="!bg-emerald-500 !text-white hover:!bg-emerald-600 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                3. 원빌링 정산 체험
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
