'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/ui/Header'
import Footer from '@/components/ui/Footer'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'

type BillingItem = {
  id: string
  employeeName: string
  accommodationName: string
  region: string
  nights: number
  totalPrice: number
  subsidyPerNight: number
  netCorporatePrice: number
  status: 'paid' | 'unpaid'
}

export default function BillingPage() {
  const [items, setItems] = useState<BillingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isPaying, setIsPaying] = useState(false)
  const [paySuccess, setPaySuccess] = useState(false)
  const [showInvoice, setShowInvoice] = useState(false)

  useEffect(() => {
    // 임시 모의 데이터 생성 (실제 bookings와 subsidies 데이터를 연동하는 알고리즘 시뮬레이션)
    setTimeout(() => {
      setItems([
        {
          id: 'B-101',
          employeeName: '김민수 (개발팀)',
          accommodationName: '세인트존스 호텔 강릉',
          region: '강원도 강릉시',
          nights: 4,
          totalPrice: 480000,
          subsidyPerNight: 40000,
          netCorporatePrice: 320000,
          status: 'unpaid'
        },
        {
          id: 'B-102',
          employeeName: '이지은 (기획팀)',
          accommodationName: '제주 코코모 워케이션 하우스',
          region: '제주특별자치도 서귀포시',
          nights: 3,
          totalPrice: 360000,
          subsidyPerNight: 30000,
          netCorporatePrice: 270000,
          status: 'unpaid'
        },
        {
          id: 'B-103',
          employeeName: '박준형 (디자인팀)',
          accommodationName: '동해 파도소리 오피스 앤 스테이',
          region: '강원도 동해시',
          nights: 5,
          totalPrice: 400000,
          subsidyPerNight: 35000,
          netCorporatePrice: 225000,
          status: 'unpaid'
        }
      ])
      setLoading(false)
    }, 800)
  }, [])

  const totalOriginal = items.reduce((sum, item) => sum + item.totalPrice, 0)
  const totalSubsidy = items.reduce((sum, item) => sum + (item.subsidyPerNight * item.nights), 0)
  const totalCorporate = items.reduce((sum, item) => sum + item.netCorporatePrice, 0)

  const handlePayment = () => {
    setIsPaying(true)
    setTimeout(() => {
      setIsPaying(false)
      setPaySuccess(true)
      setItems(prev => prev.map(item => ({ ...item, status: 'paid' })))
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased">
      <Header role="hr" />

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* 상단 Breadcrumb & 타이틀 */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 mb-2">
            ← 대시보드로 돌아가기
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-md border border-emerald-300 uppercase tracking-wider mb-2">
                1-Billing B2B 정산 시스템
              </span>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">지자체 보조금 연동 통합 정산</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowInvoice(true)}
                disabled={!paySuccess}
                className="px-4 py-2 border-2 border-slate-900 bg-white hover:bg-slate-50 text-slate-900 text-xs font-black rounded-lg shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] disabled:opacity-40 disabled:shadow-none transition-all"
              >
                🧾 전자세금계산서 인쇄
              </button>
            </div>
          </div>
        </div>

        {/* 요약 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border-2 border-slate-900 rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <p className="text-xs font-black text-[#94A3B8] mb-1">총 이용 금액 (원래 가격)</p>
            <p className="text-2xl font-black text-slate-500">{totalOriginal.toLocaleString()} 원</p>
            <p className="text-[10px] text-slate-400 mt-2">임직원 개별 예약 총액 합계</p>
          </div>
          <div className="bg-emerald-50 border-2 border-emerald-950 rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(5,150,105,1)]">
            <p className="text-xs font-black text-emerald-700 mb-1">🎁 지자체 보조금 선공제 혜택</p>
            <p className="text-2xl font-black text-emerald-600">- {totalSubsidy.toLocaleString()} 원</p>
            <p className="text-[10px] text-emerald-500 mt-2 font-bold">더 워케이션 제휴 지자체 자동 지원 한도 차감</p>
          </div>
          <div className="bg-blue-50 border-2 border-blue-950 rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(37,99,235,1)]">
            <p className="text-xs font-black text-blue-700 mb-1">💳 최종 법인카드 일괄 정산액</p>
            <p className="text-3xl font-black text-blue-600">{totalCorporate.toLocaleString()} 원</p>
            <p className="text-[10px] text-blue-500 mt-2 font-bold">법인 1-Billing 단일 계산서 청구 금액</p>
          </div>
        </div>

        {/* 정산 청구 세부 내역 */}
        <div className="bg-white border-2 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] overflow-hidden mb-8">
          <div className="bg-slate-900 px-5 py-4 text-white flex justify-between items-center">
            <h2 className="font-black text-sm">이번 달 일괄 정산 대상 명세서 (3건)</h2>
            <span className="text-xs bg-blue-500 text-white font-bold px-2 py-0.5 rounded-full">
              {paySuccess ? '결제 완료' : '결제 대기'}
            </span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-[#94A3B8] text-sm">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              정산 내역 계산 중...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 border-b-2 border-slate-900">
                    <th className="text-left px-5 py-3 font-black">청구코드</th>
                    <th className="text-left px-5 py-3 font-black">임직원명</th>
                    <th className="text-left px-5 py-3 font-black">이용 숙소 / 지역</th>
                    <th className="text-center px-5 py-3 font-black">숙박일수</th>
                    <th className="text-right px-5 py-3 font-black">원래 가격</th>
                    <th className="text-right px-5 py-3 font-black">지자체 보조금</th>
                    <th className="text-right px-5 py-3 font-black">법인 청구액</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">{item.id}</td>
                      <td className="px-5 py-4 font-bold">{item.employeeName}</td>
                      <td className="px-5 py-4">
                        <div className="font-semibold">{item.accommodationName}</div>
                        <div className="text-xs text-slate-400 mt-0.5">📍 {item.region}</div>
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-slate-600">{item.nights}박</td>
                      <td className="px-5 py-4 text-right text-slate-400 line-through">
                        {item.totalPrice.toLocaleString()}원
                      </td>
                      <td className="px-5 py-4 text-right text-emerald-600 font-bold">
                        -{ (item.subsidyPerNight * item.nights).toLocaleString() }원
                        <div className="text-[10px] text-emerald-500 font-medium">({item.subsidyPerNight.toLocaleString()}/박)</div>
                      </td>
                      <td className="px-5 py-4 text-right font-black text-blue-600">
                        {item.netCorporatePrice.toLocaleString()}원
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 결제 실행 영역 */}
          <div className="bg-slate-50 border-t-2 border-slate-900 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 max-w-xl">
              <span className="font-bold text-slate-700 block mb-1">⚖️ 법인세 세무 처리 정보</span>
              법인세법 시행령 제45조(복리후생비의 손금불산입 외)에 근거하여 본 워케이션 지출 비용은 **100% 손금산입(법인 비용 처리)** 대상입니다. 결제 완료 시 국세청에 지정 복리후생비 명목으로 자동 세금 신고 처리가 연동됩니다.
            </div>

            <div className="shrink-0 flex gap-3 w-full md:w-auto">
              {!paySuccess ? (
                <button
                  onClick={handlePayment}
                  disabled={isPaying}
                  className="w-full md:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-sm flex items-center justify-center gap-2"
                >
                  {isPaying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      카드 결제 승인 중...
                    </>
                  ) : (
                    <>💳 법인카드로 총 {totalCorporate.toLocaleString()}원 일괄 결제</>
                  )}
                </button>
              ) : (
                <div className="w-full md:w-auto bg-emerald-500 text-white font-black px-6 py-3.5 rounded-xl border-2 border-slate-900 flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                  🎉 단일 1-Billing 결제 완료!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 세금계산서 모달 팝업 */}
        {showInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white border-4 border-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
                <h3 className="text-xl font-black text-slate-900">전자세금계산서 (공급받는자 보관용)</h3>
                <button
                  onClick={() => setShowInvoice(false)}
                  className="text-slate-500 hover:text-slate-900 font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              {/* 계산서 폼 */}
              <div className="border border-slate-300 p-4 font-sans text-xs mb-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 border-b pb-4">
                  <div>
                    <h4 className="font-bold text-slate-400 mb-1">공급자 (더 워케이션)</h4>
                    <p>등록번호: 104-86-09234</p>
                    <p>상호: 주식회사 더 워케이션 (대표: 김지민)</p>
                    <p>주소: 서울시 마포구 백범로 31길 21</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-400 mb-1">공급받는자 (귀사 법인)</h4>
                    <p>등록번호: 법인 사업자 지정 정보 자동 연동</p>
                    <p>상호: 더 워케이션 등록 회원사</p>
                    <p>주소: 기업 회원 가입 등록 주소지</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center font-bold bg-slate-50 p-2 border-b">
                  <div>작성일자</div>
                  <div>공급가액</div>
                  <div>세액 (VAT)</div>
                  <div>영수/청구</div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center py-2 border-b">
                  <div>2026-06-10</div>
                  <div className="font-bold">{(Math.round(totalCorporate / 1.1)).toLocaleString()} 원</div>
                  <div>{(totalCorporate - Math.round(totalCorporate / 1.1)).toLocaleString()} 원</div>
                  <div className="text-blue-600 font-black">영수 (결제완료)</div>
                </div>

                <div className="text-[10px] text-slate-400 leading-relaxed">
                  본 계산서는 법인세법 시행령 제45조에 따라 임직원 전원 대상의 휴양 시설 이용 및 직무 역량 강화를 위한 교육훈련 지원금으로서 복리후생비 및 교육훈련비의 손금산입(100% 비용 인정) 대상임을 증명합니다.
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-slate-950 text-white font-black text-xs rounded-lg border-2 border-slate-950 hover:bg-slate-800 transition-colors"
                >
                  🖨️ 바로 인쇄하기
                </button>
                <button
                  onClick={() => setShowInvoice(false)}
                  className="px-5 py-2.5 border-2 border-slate-900 bg-white hover:bg-slate-50 font-bold text-xs rounded-lg transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 하단 플랫폼 검증 팩트 체크 */}
        <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
          <h3 className="text-lg font-black mb-3">💡 1-Billing 정산의 검증용 팩트 시트</h3>
          <ul className="text-xs sm:text-sm text-slate-600 space-y-2 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">1.</span>
              <span><strong>선공제 할인 연동</strong>: 각 기업이 지자체에 복잡하게 개별 보조금 지원을 신청할 필요 없이, 플랫폼이 실시간 API 연동으로 보조금 예산을 선공제 처리해 청구서를 발행합니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">2.</span>
              <span><strong>재무 편의성 극대화</strong>: 개별 임직원의 식대 영수증, 숙박비 인보이스 수십 개를 일일이 대조하지 않고 한 달에 1회 원클릭 통합 결제로 복리후생 지출 정산을 완료할 수 있습니다.</span>
            </li>
          </ul>
        </div>
      </div>
      <Footer />
    </div>
  )
}
