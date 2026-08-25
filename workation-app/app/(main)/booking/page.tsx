'use client'
import Footer from '@/components/ui/Footer'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/ui/Header'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useAuthOnly } from '@/lib/useAuthOnly'

const STEPS = ['날짜·인원 선택', '업무 목표 설정', '지원금 확인', '최종 확인']

type Accommodation = {
  id: string
  name: string
  region: string
  price_per_night: number
  image_url?: string
}

type Subsidy = {
  id: string
  region: string
  name: string
  amount_per_person: number
  min_nights: number
  unit: string
  conditions: string
  deadline: string
  provider: string
}

function BookingContent() {
  useAuthOnly()
  const router       = useRouter()
  const searchParams = useSearchParams()
  const accId        = searchParams.get('id')

  const [acc, setAcc]               = useState<Accommodation | null>(null)
  const [subsidies, setSubsidies]   = useState<Subsidy[]>([])
  const [step, setStep]             = useState(0)
  const [guests, setGuests]         = useState(Number(searchParams.get('guests')) || 4)
  const [eligibleGuests, setEligibleGuests] = useState(Number(searchParams.get('guests')) || 4)
  const [checkIn, setCheckIn]       = useState(searchParams.get('checkIn') || '')
  const [checkOut, setCheckOut]     = useState(searchParams.get('checkOut') || '')
  const [useSubsidy, setUseSubsidy] = useState(true)
  const [saving, setSaving]         = useState(false)
  const [paymentType, setPaymentType] = useState<'corporate' | 'personal'>('corporate')
  const [goals, setGoals]           = useState<string[]>([''])

  useEffect(() => {
    if (!accId) return
    supabase.from('accommodations').select('*').eq('id', accId).single()
      .then(({ data }) => {
        if (data) {
          setAcc(data)
          // 숙소 지역에 맞는 지원금 자동 매칭
          supabase.from('subsidies').select('*').then(({ data: subs }) => {
            if (subs) {
              const matched = subs.filter(s => data.region.includes(s.region) || s.region.includes(data.region.split(' ')[0]))
              setSubsidies(matched)
            }
          })
        }
      })
  }, [accId])

  const pricePerNight  = acc?.price_per_night ?? 85000
  const nights         = checkIn && checkOut
    ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 3
  const subsidyPerHead = subsidies.reduce((s, m) => s + m.amount_per_person, 0)
  const subsidyTotal   = useSubsidy ? subsidyPerHead * eligibleGuests : 0
  const finalTotal     = pricePerNight * nights * guests - subsidyTotal

  async function handleBookingComplete() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('bookings').insert({
      user_id:          user?.id ?? null,
      accommodation_id: accId,
      start_date:       checkIn  || '2026-06-10',
      end_date:         checkOut || '2026-06-13',
      guests,
      total_price:      finalTotal,
      status:           'confirmed',
      payment_type:     paymentType,
    })
    setSaving(false)
    if (error) {
      alert('예약 저장 실패: ' + error.message)
      return
    }

    // 목표를 로컬 스토리지에 저장 (데모 및 워케이션 대시보드 연동용)
    const validGoals = goals.filter(g => g.trim() !== '')
    if (validGoals.length > 0) {
      localStorage.setItem('workation_goals', JSON.stringify(validGoals))
    }

    router.push('/booking/confirm')
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />

      <div className="max-w-xl mx-auto px-6 py-10">
        {/* 단계 표시 */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`flex items-center gap-2 text-sm font-medium transition-all ${
                i === step ? 'text-blue-500' : i < step ? 'text-[#475569]' : 'text-[#CBD5E1]'
              }`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                  i === step   ? 'bg-blue-500 border-blue-500 text-white'
                  : i < step   ? 'bg-[#E2E8F0] border-[#E2E8F0] text-[#475569]'
                  : 'bg-transparent border-[#E2E8F0] text-[#CBD5E1]'
                }`}>{i + 1}</span>
                {s}
              </div>
              {i < STEPS.length - 1 && <span className="text-[#CBD5E1]">—</span>}
            </div>
          ))}
        </div>

        {/* STEP 0 — 날짜·인원 */}
        {step === 0 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="font-bold text-lg">날짜와 인원을 선택해주세요</h2>

            <div className="bg-[#F1F5F9] rounded-xl p-4 flex items-center gap-3">
              {acc?.image_url
                ? <img src={acc.image_url} alt={acc.name} className="w-12 h-12 rounded-lg object-cover" />
                : <span className="text-3xl">🏨</span>
              }
              <div>
                <div className="font-medium text-sm">{acc?.name ?? '숙소 불러오는 중...'}</div>
                <div className="text-xs text-[#94A3B8]">{acc?.region} · {pricePerNight.toLocaleString()}원/박</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#475569] mb-1 block">체크인</label>
                <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)}
                  className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-[#475569] mb-1 block">체크아웃</label>
                <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)}
                  className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#475569] mb-1 block">전체 숙박 인원</label>
                <select value={guests} onChange={e => {
                  const newGuests = Number(e.target.value);
                  setGuests(newGuests);
                  if (eligibleGuests > newGuests) setEligibleGuests(newGuests);
                }}
                  className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-blue-500">
                  {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}명</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#475569] mb-1 flex items-center gap-1">
                  지원금 대상 인원
                  <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded font-bold">워케이션</span>
                </label>
                <select value={eligibleGuests} onChange={e => setEligibleGuests(Number(e.target.value))}
                  className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 text-sm text-emerald-800 focus:outline-none focus:border-emerald-500 font-medium">
                  {Array.from({ length: guests + 1 }, (_, i) => i).reverse().map(n => (
                    <option key={n} value={n}>{n === 0 ? '0명 (미적용)' : `${n}명`}</option>
                  ))}
                </select>
              </div>
            </div>

            <Button size="lg" className="w-full mt-2" onClick={() => setStep(1)}>다음 → 지원금 확인</Button>
          </div>
        )}

        {/* STEP 1 — 업무 목표 설정 */}
        {step === 1 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1 mb-2">
              <h2 className="font-bold text-lg">이번 워케이션의 핵심 업무 목표를 알려주세요</h2>
              <p className="text-sm text-[#475569]">작성해주신 목표는 향후 AI 업무 성과 리포트의 기준이 됩니다. (예: 3분기 마케팅 기획안 초안 완성)</p>
            </div>

            <div className="flex flex-col gap-3">
              {goals.map((goal, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </span>
                  <input 
                    type="text" 
                    value={goal}
                    onChange={(e) => {
                      const newGoals = [...goals];
                      newGoals[idx] = e.target.value;
                      setGoals(newGoals);
                    }}
                    placeholder="핵심 목표를 구체적으로 작성해주세요."
                    className="flex-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                  {goals.length > 1 && (
                    <button onClick={() => setGoals(goals.filter((_, i) => i !== idx))} className="text-[#94A3B8] hover:text-red-500 px-2">
                      ✕
                    </button>
                  )}
                </div>
              ))}
              
              {goals.length < 3 && (
                <button 
                  onClick={() => setGoals([...goals, ''])}
                  className="text-sm font-medium text-blue-500 hover:text-blue-600 self-start mt-2 flex items-center gap-1"
                >
                  <span>+</span> 목표 추가하기 (최대 3개)
                </button>
              )}
            </div>

            <div className="flex gap-3 mt-4">
              <Button variant="secondary" size="lg" className="flex-1" onClick={() => setStep(0)}>← 이전</Button>
              <Button 
                size="lg" 
                className="flex-1" 
                onClick={() => {
                  if (goals.filter(g => g.trim() !== '').length === 0) {
                    alert('최소 1개 이상의 업무 목표를 작성해주세요.');
                    return;
                  }
                  setStep(2);
                }}
              >
                다음 → 지원금 확인
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2 — 지원금 */}
        {step === 2 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">💰</span>
              <h2 className="font-bold text-lg">지원금 자동 매칭 결과</h2>
            </div>
            <p className="text-xs text-[#475569]">{acc?.region} 워케이션 기준 · {eligibleGuests}명 지원 대상</p>

            {subsidies.length === 0 ? (
              <div className="bg-[#F1F5F9] rounded-xl p-4 text-sm text-[#94A3B8] text-center">
                이 지역에 매칭된 지원금이 없어요
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {subsidies.map(s => (
                  <div key={s.id} className="flex items-start justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                    <div>
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="text-xs text-[#94A3B8] mt-0.5">📍 {s.provider}</div>
                      <div className="text-xs text-[#94A3B8]">최소 {s.min_nights}박 이상 · {s.conditions}</div>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <div className="font-bold text-emerald-500">{s.amount_per_person.toLocaleString()}원</div>
                      <div className="text-xs text-[#94A3B8]">{s.unit}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-[#F1F5F9] rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold">지원금 선공제 적용</span>
                <button onClick={() => setUseSubsidy(!useSubsidy)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${useSubsidy ? 'bg-emerald-500' : 'bg-[#E2E8F0]'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${useSubsidy ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between text-[#475569]">
                  <span>숙박비 ({nights}박)</span>
                  <span>{(pricePerNight * nights * guests).toLocaleString()}원</span>
                </div>
                {useSubsidy && subsidies.length > 0 && (
                  <div className="flex justify-between text-emerald-500">
                    <span>지원금 차감 ({eligibleGuests}명 × {subsidyPerHead.toLocaleString()}원)</span>
                    <span>- {subsidyTotal.toLocaleString()}원</span>
                  </div>
                )}
                <div className="border-t border-[#E2E8F0] pt-2 flex justify-between font-bold">
                  <span>최종 결제 금액</span>
                  <span className="text-blue-500 text-lg">{finalTotal.toLocaleString()}원</span>
                </div>
                {useSubsidy && subsidies.length > 0 && (
                  <p className="text-xs text-emerald-500 text-right">💡 {subsidyTotal.toLocaleString()}원 절감</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" size="lg" className="flex-1" onClick={() => setStep(1)}>← 수정</Button>
              <Button size="lg" className="flex-1" onClick={() => setStep(3)}>다음 → 최종 확인</Button>
            </div>
          </div>
        )}

        {/* STEP 3 — 최종 확인 */}
        {step === 3 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="font-bold text-lg">예약 내용을 확인해주세요</h2>

            <div className="bg-[#F1F5F9] rounded-xl p-4 flex flex-col gap-3 text-sm">
              {[
                ['숙소',      acc?.name ?? ''],
                ['지역',      acc?.region ?? ''],
                ['체크인',    checkIn  || '2026-06-10'],
                ['체크아웃',  checkOut || '2026-06-13'],
                ['숙박 기간', `${nights}박`],
                ['인원',      `${guests}명`],
                ['숙박비',    `${(pricePerNight * nights * guests).toLocaleString()}원`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-[#94A3B8]">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
              {useSubsidy && subsidies.length > 0 && (
                <div className="flex justify-between text-emerald-500">
                  <span>지원금 선공제 ({subsidies.length}개 매칭)</span>
                  <span>- {subsidyTotal.toLocaleString()}원</span>
                </div>
              )}
              <div className="border-t border-[#E2E8F0] pt-3 flex justify-between font-bold">
                <span>최종 결제 금액</span>
                <span className="text-blue-500 text-lg">{finalTotal.toLocaleString()}원</span>
              </div>
            </div>

            <div className="bg-[#F1F5F9] rounded-xl p-4 flex flex-col gap-3 text-sm">
              <h3 className="font-bold text-[#0F172A] mb-1">결제 방식 선택</h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => setPaymentType('corporate')}
                  className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${paymentType === 'corporate' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-[#E2E8F0] bg-white text-[#475569]'}`}
                >
                  🏢 회사 예산 결제
                </button>
                <button 
                  onClick={() => setPaymentType('personal')}
                  className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${paymentType === 'personal' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-[#E2E8F0] bg-white text-[#475569]'}`}
                >
                  💳 개인 사비 결제
                </button>
              </div>
              <p className="text-xs text-[#94A3B8] mt-1 text-center">
                {paymentType === 'corporate' 
                  ? '💡 결제 금액이 회사 예산에서 차감되며, 지자체 지원금은 회사로 환급됩니다.' 
                  : '💡 개인 사비로 결제하며, 지자체 지원금은 워케이션 종료 후 개인 계좌로 환급됩니다.'}
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" size="lg" className="flex-1" onClick={() => setStep(2)}>← 수정</Button>
              <Button size="lg" className="flex-1" onClick={handleBookingComplete}>
                {saving ? '저장 중...' : '예약 완료'}
              </Button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-[#94A3B8]">불러오는 중...</div>}>
      <BookingContent />
    </Suspense>
  )
}
