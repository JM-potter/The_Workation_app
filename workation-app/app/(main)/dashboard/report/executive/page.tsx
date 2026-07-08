'use client'
import Link from 'next/link'
import Header from '@/components/ui/Header'
import Footer from '@/components/ui/Footer'

export default function ExecutiveReportPage() {
  const printDocument = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] print:bg-white flex flex-col items-center">
      <div className="w-full print:hidden">
        <Header role="hr" />
      </div>

      <div className="w-full max-w-5xl px-6 py-8 print:hidden flex justify-between items-center">
        <Link href="/dashboard/report" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1">
          ← 뒤로 가기
        </Link>
        <div className="flex gap-3">
          <button 
            onClick={printDocument}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md"
          >
            <span>🖨️</span> PDF 저장 및 인쇄
          </button>
        </div>
      </div>

      {/* A4 용지 스타일 컨테이너 */}
      <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-xl print:shadow-none mb-20 px-[20mm] py-[25mm] text-slate-800">
        
        {/* 문서 헤더 */}
        <div className="border-b-2 border-slate-800 pb-4 mb-8 flex justify-between items-end">
          <div>
            <div className="text-sm font-bold text-slate-500 mb-1">Executive Briefing Document</div>
            <h1 className="text-3xl font-black tracking-tight leading-tight">
              2026년 하반기 전사 워케이션<br />도입 성과 및 ROI 분석 보고서
            </h1>
          </div>
          <div className="text-right text-sm font-medium text-slate-600">
            <p>보고일자: 2026. 07. 10</p>
            <p>작성부서: 인사기획팀 (HR)</p>
            <p>수 신: 경영진 및 이사회</p>
          </div>
        </div>

        {/* 1. 추진 개요 */}
        <section className="mb-10">
          <h2 className="text-xl font-black border-l-4 border-slate-800 pl-3 mb-4 text-slate-900">1. 추진 개요</h2>
          <table className="w-full text-sm border-t-2 border-b-2 border-slate-800 mb-4">
            <tbody>
              <tr className="border-b border-slate-200">
                <th className="bg-slate-50 py-3 px-4 text-left font-bold w-1/4">추진 목적</th>
                <td className="py-3 px-4">구성원 번아웃 해소, 조직 로열티 강화 및 우수 인재 리텐션 확보</td>
              </tr>
              <tr className="border-b border-slate-200">
                <th className="bg-slate-50 py-3 px-4 text-left font-bold">운영 기간</th>
                <td className="py-3 px-4">2026년 3월 ~ 6월 (시범 도입 기간)</td>
              </tr>
              <tr className="border-b border-slate-200">
                <th className="bg-slate-50 py-3 px-4 text-left font-bold">참여 현황</th>
                <td className="py-3 px-4">총 28명 (개발 45%, 기획 30%, 디자인 15%, 마케팅 10%)</td>
              </tr>
              <tr>
                <th className="bg-slate-50 py-3 px-4 text-left font-bold">총 집행 예산</th>
                <td className="py-3 px-4">총 740,000원 (초기 배정 예산 500만원 대비 14.8% 사용 완료)</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 2. 주요 성과 요약 */}
        <section className="mb-10">
          <h2 className="text-xl font-black border-l-4 border-blue-600 pl-3 mb-4 text-slate-900">2. 핵심 성과 요약 (Executive Summary)</h2>
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-4 text-justify leading-relaxed text-sm">
            이번 상반기 시범 워케이션 프로그램은 <strong>초기 투자 예산 대비 3.2배의 ROI(투자 수익률)</strong>를 달성하며 성공적으로 마무리되었습니다. 
            참여 임직원의 eNPS(직원 추천 지수)가 <strong>+18%p 상승</strong>하여 우수 인재 이탈 방지에 크게 기여하였고, 
            지자체 지원금 제도를 적극 활용하여 회사의 실질적인 체류비 부담을 <strong>240만원 절감</strong>하였습니다.
          </div>
          
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="border border-slate-200 p-4 text-center rounded-lg">
              <div className="text-xs text-slate-500 font-bold mb-1">종합 ROI</div>
              <div className="text-2xl font-black text-blue-600">3.2배</div>
            </div>
            <div className="border border-slate-200 p-4 text-center rounded-lg">
              <div className="text-xs text-slate-500 font-bold mb-1">eNPS 향상률</div>
              <div className="text-2xl font-black text-emerald-600">+18%p</div>
            </div>
            <div className="border border-slate-200 p-4 text-center rounded-lg">
              <div className="text-xs text-slate-500 font-bold mb-1">비용 절감액</div>
              <div className="text-2xl font-black text-purple-600">240만원</div>
            </div>
            <div className="border border-slate-200 p-4 text-center rounded-lg">
              <div className="text-xs text-slate-500 font-bold mb-1">이직 비용 절감</div>
              <div className="text-2xl font-black text-slate-800">약 1.2억원</div>
            </div>
          </div>
        </section>

        {/* 3. 조직 문화 및 생산성 변화 */}
        <section className="mb-10">
          <h2 className="text-xl font-black border-l-4 border-slate-800 pl-3 mb-4 text-slate-900">3. 조직 문화 및 생산성 변화 지표</h2>
          <p className="text-sm mb-4 leading-relaxed">
            워케이션 참여자의 업무 툴(SaaS) 사용량 데이터를 기반으로 한 객관적 지표와 익명 설문을 종합한 결과, 휴식과 업무의 병행이 오히려 <strong>개인 집중도 및 부서 간 협업 역량을 유의미하게 상승</strong>시킨 것으로 확인되었습니다.
          </p>

          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm mt-4">
            <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
              <span className="font-bold text-slate-700">업무 집중도 (일일 집중 시간)</span>
              <div className="text-right">
                <span className="text-slate-400 line-through mr-2">68%</span>
                <span className="font-black text-blue-600">84% (▲ 16%p)</span>
              </div>
            </div>
            <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
              <span className="font-bold text-slate-700">팀 결속력 (협업 만족도)</span>
              <div className="text-right">
                <span className="text-slate-400 line-through mr-2">72%</span>
                <span className="font-black text-blue-600">91% (▲ 19%p)</span>
              </div>
            </div>
            <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
              <span className="font-bold text-slate-700">직무 스트레스 / 번아웃 지수</span>
              <div className="text-right">
                <span className="text-slate-400 line-through mr-2">52%</span>
                <span className="font-black text-emerald-600">31% (▼ 21%p 개선)</span>
              </div>
            </div>
            <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
              <span className="font-bold text-slate-700">6개월 내 이직 고려 비율</span>
              <div className="text-right">
                <span className="text-slate-400 line-through mr-2">38%</span>
                <span className="font-black text-emerald-600">19% (▼ 19%p 개선)</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-900 flex gap-3">
            <span className="text-lg">💡</span>
            <div>
              <strong>SaaS 트래킹 데이터 인사이트:</strong> Slack 메시지 응답 속도가 평균 34% 빨라졌으며, Notion 문서 공동 편집 활동이 52% 증가하여 비대면 상황에서도 소통 공백이 발생하지 않았음을 증명합니다.
            </div>
          </div>
        </section>

        {/* 4. 재무 및 ESG 기여도 */}
        <section className="mb-10">
          <h2 className="text-xl font-black border-l-4 border-slate-800 pl-3 mb-4 text-slate-900">4. 재무 효율성 및 ESG 기여도</h2>
          
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="w-1/3 bg-slate-50 p-4 border border-slate-200 rounded-lg">
                <div className="text-sm font-bold text-slate-800 mb-2 border-b border-slate-300 pb-2">가결산(재무) 효과</div>
                <ul className="text-xs space-y-2 text-slate-700 list-disc pl-4">
                  <li>지자체(강원/제주/전북 등) 체류 보조금 <strong>총 240만원 전액 환급</strong> 완료</li>
                  <li>리텐션 상승으로 인한 <strong>예상 채용/온보딩 세이브 비용 약 1.2억 원</strong> 산출</li>
                </ul>
              </div>
              <div className="w-2/3 bg-slate-50 p-4 border border-slate-200 rounded-lg">
                <div className="text-sm font-bold text-slate-800 mb-2 border-b border-slate-300 pb-2">ESG 경영 기여도 산출</div>
                <ul className="text-xs space-y-2 text-slate-700 list-disc pl-4">
                  <li><strong>[E] 환경:</strong> 출퇴근 미발생으로 인한 <strong>탄소 배출량 3,591kg CO₂ 저감</strong> 산출. (금년도 지속가능경영보고서 환경 지표에 반영 예정)</li>
                  <li><strong>[S] 사회:</strong> 지역사회 체류에 따른 지역 경제 활성화(소비 창출) <strong>약 840만원 기여</strong> 및 인구소멸지역 생활인구 유입 성과 인정.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 5. 결론 및 향후 계획 */}
        <section>
          <h2 className="text-xl font-black border-l-4 border-blue-600 pl-3 mb-4 text-slate-900">5. 결론 및 향후 계획(안)</h2>
          <div className="text-sm leading-relaxed text-slate-800 space-y-3">
            <p>
              본 제도는 단순한 복지 혜택을 넘어, <strong>최소한의 예산으로 직원 몰입도와 회사 충성도를 극대화할 수 있는 고효율 HR 전략</strong>임이 데이터로 입증되었습니다. 
            </p>
            <p>
              이에 따라 시범 운영을 종료하고 하반기부터 <strong>'전사 정규 복지 제도'로의 격상 및 예산 증액 편성을 건의</strong>합니다. 향후 가족 동반형 워케이션 패키지 및 글로벌(해외) 거점 워케이션 등으로 확장하여 핵심 인재 채용 시 강력한 고용 브랜딩(Employer Branding) 무기로 활용하고자 합니다.
            </p>
          </div>
          
          <div className="mt-12 text-center text-sm font-bold text-slate-800">
            <p className="mb-4">상기와 같이 워케이션 도입 성과를 보고합니다.</p>
            <p className="text-lg mt-8">인 사 기 획 팀 장<span className="ml-16 inline-block w-20 border-b border-slate-800 text-right text-xs font-normal pb-1">(서명 / 인)</span></p>
          </div>
        </section>

      </div>
      
      <div className="w-full print:hidden">
        <Footer />
      </div>

      <style jsx global>{`
        @media print {
          body {
            background-color: white;
            margin: 0;
            padding: 0;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  )
}
