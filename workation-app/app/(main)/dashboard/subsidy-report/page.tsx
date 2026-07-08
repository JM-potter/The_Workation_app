'use client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/ui/Header'
import Footer from '@/components/ui/Footer'
import { Suspense } from 'react'

function SubsidyReportContent() {
  const searchParams = useSearchParams()
  const userName = searchParams.get('user') || '김지민 (기획팀)'
  const subsidyName = searchParams.get('subsidy') || '강원도 워케이션 체류 지원'
  const region = searchParams.get('region') || '강원도 강릉시'
  const amount = searchParams.get('amount') ? parseInt(searchParams.get('amount') as string).toLocaleString() : '100,000'

  const printDocument = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] print:bg-white flex flex-col items-center pb-20">
      <div className="w-full print:hidden">
        <Header role="hr" />
      </div>

      <div className="w-full max-w-5xl px-6 py-8 print:hidden flex justify-between items-center">
        <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1">
          ← 대시보드로 돌아가기
        </Link>
        <button 
          onClick={printDocument}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md"
        >
          <span>🖨️</span> 지자체 제출용 서류 인쇄
        </button>
      </div>

      {/* A4 용지 스타일 컨테이너 */}
      <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-xl print:shadow-none px-[20mm] py-[25mm] text-slate-800 border border-slate-200">
        
        {/* 문서 헤더 */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black tracking-tight leading-tight mb-2 border-b-2 border-slate-800 pb-4 inline-block px-10">
            워케이션 지원금 정산 결과보고서
          </h1>
        </div>

        {/* 1. 신청자 및 프로그램 정보 */}
        <section className="mb-8">
          <h2 className="text-lg font-black border-l-4 border-slate-800 pl-3 mb-3 text-slate-900">1. 지원금 신청 개요</h2>
          <table className="w-full text-sm border-2 border-slate-800">
            <tbody>
              <tr className="border-b border-slate-300">
                <th className="bg-slate-100 py-3 px-4 text-center font-bold w-1/4 border-r border-slate-300">신청 기업명</th>
                <td className="py-3 px-4 w-1/4 border-r border-slate-300">더 워케이션 데모 기업</td>
                <th className="bg-slate-100 py-3 px-4 text-center font-bold w-1/4 border-r border-slate-300">참여자 (소속/성명)</th>
                <td className="py-3 px-4 w-1/4 font-bold">{userName}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <th className="bg-slate-100 py-3 px-4 text-center font-bold border-r border-slate-300">지원 사업명</th>
                <td colSpan={3} className="py-3 px-4 font-bold text-blue-700">{subsidyName}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <th className="bg-slate-100 py-3 px-4 text-center font-bold border-r border-slate-300">체류 지역</th>
                <td className="py-3 px-4 border-r border-slate-300">{region}</td>
                <th className="bg-slate-100 py-3 px-4 text-center font-bold border-r border-slate-300">신청(환급) 금액</th>
                <td className="py-3 px-4 font-black text-slate-800">{amount} 원</td>
              </tr>
              <tr>
                <th className="bg-slate-100 py-3 px-4 text-center font-bold border-r border-slate-300">워케이션 기간</th>
                <td colSpan={3} className="py-3 px-4">2026. 07. 10 ~ 2026. 07. 12 (2박 3일)</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 2. 결제 및 숙박 영수증 증빙 */}
        <section className="mb-8">
          <h2 className="text-lg font-black border-l-4 border-slate-800 pl-3 mb-3 text-slate-900">2. 숙박 시설 이용 및 결제 영수증</h2>
          <div className="border border-slate-300 p-4 rounded bg-slate-50">
            <p className="text-xs text-slate-600 mb-3 font-medium">※ 지자체 관내 숙박시설 이용 내역을 증빙합니다.</p>
            <div className="flex gap-4 h-64">
              <div className="w-1/2 bg-white border border-slate-200 border-dashed rounded flex flex-col items-center justify-center text-slate-400">
                <span className="text-3xl mb-2">🧾</span>
                <span className="text-sm font-bold">카드 결제 매출전표</span>
                <span className="text-xs mt-1">(승인번호: 82910384)</span>
              </div>
              <div className="w-1/2 bg-white border border-slate-200 border-dashed rounded flex flex-col items-center justify-center text-slate-400">
                <span className="text-3xl mb-2">🏨</span>
                <span className="text-sm font-bold">숙소 예약 확정서 (바우처)</span>
                <span className="text-xs mt-1">이용자명: {userName.split(' ')[0]} 일행</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. 업무 수행 및 근태 증빙 */}
        <section className="mb-8 page-break-inside-avoid">
          <h2 className="text-lg font-black border-l-4 border-slate-800 pl-3 mb-3 text-slate-900">3. 근태 및 업무 수행 증빙 (사진)</h2>
          <div className="border border-slate-300 p-4 rounded bg-slate-50">
            <p className="text-xs text-slate-600 mb-3 font-medium">※ 관내 워케이션 센터/스마트워크센터에서 정상적으로 업무를 수행하였음을 증빙합니다.</p>
            <div className="flex gap-4 h-64">
              <div className="w-1/2 bg-slate-200 rounded overflow-hidden relative">
                {/* Placeholder Image for Work Photo */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-200">
                  <span className="text-4xl mb-2">💻</span>
                  <span className="text-sm font-bold">센터 내 업무 사진 1</span>
                  <span className="text-[10px] mt-1 bg-black/40 text-white px-2 py-0.5 rounded">2026. 07. 10 14:22 촬영</span>
                </div>
              </div>
              <div className="w-1/2 bg-slate-200 rounded overflow-hidden relative">
                {/* Placeholder Image for Work Photo */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-200">
                  <span className="text-4xl mb-2">📸</span>
                  <span className="text-sm font-bold">센터 내 업무 사진 2</span>
                  <span className="text-[10px] mt-1 bg-black/40 text-white px-2 py-0.5 rounded">2026. 07. 11 10:15 촬영</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. 서명란 */}
        <section className="mt-16 text-center text-sm font-bold text-slate-800">
          <p className="mb-8">위와 같이 워케이션 프로그램에 성실히 참여하였으며, 제반 증빙 서류를 첨부하여<br/>지원금 지급을 정히 신청(보고)합니다.</p>
          <p className="text-base mb-8">2026년 &nbsp;&nbsp;&nbsp; 월 &nbsp;&nbsp;&nbsp; 일</p>
          
          <div className="flex justify-center gap-20 mt-8">
            <div className="text-right">
              <span className="inline-block w-24 text-left">참 여 자 : </span>
              <span className="inline-block w-32 border-b border-slate-800 text-center">{userName.split(' ')[0]}</span>
              <span className="ml-2">(서명)</span>
            </div>
          </div>
          <div className="flex justify-center gap-20 mt-6">
            <div className="text-right">
              <span className="inline-block w-24 text-left">기업 대표자 : </span>
              <span className="inline-block w-32 border-b border-slate-800 text-center">홍 길 동</span>
              <span className="ml-2">(직인)</span>
            </div>
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
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  )
}

export default function SubsidyReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SubsidyReportContent />
    </Suspense>
  )
}
