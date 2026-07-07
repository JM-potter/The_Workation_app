'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/ui/Header'
import { supabase, BYPASS_AUTH } from '@/lib/supabase'

type Booking = {
  id: string | number
  start_date: string
  end_date: string
  guests: number
  total_price: number
  status: string
  accommodations: { name: string; region: string } | null
}

type Doc = {
  id: string
  booking_id: string
  type: string
  file_url: string
  file_name: string
  status: string
}

const STATUS_STYLE: Record<string, { label: string; bg: string; text: string }> = {
  confirmed: { label: '예약 확정', bg: 'bg-emerald-500',    text: 'text-white' },
  pending:   { label: '대기중',   bg: 'bg-amber-400',      text: 'text-white' },
  cancelled: { label: '취소됨',   bg: 'bg-[#CBD5E1]',      text: 'text-white' },
}

const REGION_COLORS: Record<string, string> = {
  '강원': 'from-blue-400 to-cyan-400',
  '제주': 'from-emerald-400 to-teal-400',
  '전라': 'from-amber-400 to-orange-400',
  '경상': 'from-purple-400 to-violet-400',
  '충청': 'from-pink-400 to-rose-400',
}

function getRegionColor(region: string) {
  const match = Object.keys(REGION_COLORS).find(k => region?.includes(k))
  return match ? REGION_COLORS[match] : 'from-blue-400 to-indigo-400'
}

function formatDate(d: string) {
  const date = new Date(d)
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}

function nights(start: string, end: string) {
  return Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000))
}

export default function MyPage() {
  const [userId, setUserId]       = useState<string | null>(null)
  const [userName, setUserName]   = useState('')
  const [email, setEmail]         = useState('')
  const [bookings, setBookings]   = useState<Booking[]>([])
  const [docs, setDocs]           = useState<Doc[]>([])
  const [loading, setLoading]     = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [openId, setOpenId]       = useState<string | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('wk-onboarded')) setShowOnboarding(true)
  }, [])

  function dismissOnboarding() {
    localStorage.setItem('wk-onboarded', '1')
    setShowOnboarding(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      let uid = data.user?.id
      let emailVal = data.user?.email ?? ''
      let nameVal = data.user?.user_metadata?.name ?? ''

      if (!uid) {
        if (BYPASS_AUTH) {
          uid = '00000000-0000-0000-0000-000000000000'
          emailVal = 'workation.kr@gmail.com'
          nameVal = '김지민'
        } else {
          return
        }
      }

      setUserId(uid)
      setEmail(emailVal)
      setUserName(nameVal)

      const [{ data: bData }, { data: dData }] = await Promise.all([
        supabase
          .from('bookings')
          .select('id, start_date, end_date, guests, total_price, status, accommodations(name, region)')
          .or(`user_id.eq.${uid},user_id.is.null`)
          .order('id', { ascending: false }),
        supabase
          .from('documents')
          .select('id, booking_id, type, file_url, file_name, status')
          .eq('user_id', uid),
      ])

      if (bData) setBookings(bData as any)
      if (dData) setDocs(dData)
      setLoading(false)
    })
  }, [])

  async function handleUpload(bookingId: string, file: File) {
    if (!userId) return
    setUploading(bookingId)
    const path = `${userId}/${bookingId}/work_proof_${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage.from('documents').upload(path, file, { upsert: true })
    if (uploadError) { alert('업로드 실패: ' + uploadError.message); setUploading(null); return }
    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)
    const { data: inserted } = await supabase
      .from('documents')
      .insert({ booking_id: bookingId, user_id: userId, type: 'work_proof', file_url: publicUrl, file_name: file.name })
      .select().single()
    if (inserted) setDocs(prev => [...prev, inserted])
    setUploading(null)
  }

  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length
  const totalNights    = bookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + nights(b.start_date, b.end_date), 0)
  const docCount       = docs.length
  const regions        = Array.from(new Set(bookings.filter(b => b.status === 'confirmed').map(b => b.accommodations?.region?.split(' ')[0]).filter(Boolean))) as string[]

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />

      {/* 히어로 */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="flex items-center gap-5 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-black">
              {userName ? userName[0] : '?'}
            </div>
            <div>
              <div className="text-xl font-black">{userName || '이름 없음'}</div>
              <div className="text-blue-200 text-sm mt-0.5">{email}</div>
            </div>
          </div>

          {/* 스탯 */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: '🏨', value: confirmedCount,      label: '완료한 워케이션' },
              { icon: '🌙', value: totalNights,         label: '총 워케이션 박수' },
              { icon: '📍', value: regions.length,      label: '방문한 지역 수'   },
              { icon: '📄', value: docCount,            label: '제출한 서류'      },
            ].map(s => (
              <div key={s.label} className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-2xl font-black">{s.value}</div>
                <div className="text-xs text-blue-200 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* 방문 지역 태그 */}
        {regions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {regions.map(r => (
              <span key={r} className="text-xs font-medium bg-white border border-[#E2E8F0] text-[#475569] px-3 py-1.5 rounded-full shadow-sm">
                📍 {r}
              </span>
            ))}
          </div>
        )}

        {/* 온보딩 체크리스트 */}
        {showOnboarding && (
          <div className="bg-white border border-blue-200 rounded-2xl p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-black text-base">👋 처음 오셨군요! 이렇게 시작하세요</h2>
                <p className="text-xs text-[#94A3B8] mt-0.5">4단계만 따라오면 워케이션 준비 완료</p>
              </div>
              <button onClick={dismissOnboarding}
                className="text-[#CBD5E1] hover:text-[#94A3B8] transition-colors text-xl leading-none px-1">
                ×
              </button>
            </div>

            <div className="flex flex-col gap-2 mb-4">
              {[
                {
                  step: 1,
                  done: true,
                  icon: '✅',
                  title: '계정 가입 완료',
                  desc: '더 워케이션에 오신 걸 환영해요!',
                  href: null,
                },
                {
                  step: 2,
                  done: false,
                  icon: '🏨',
                  title: '숙소 둘러보기',
                  desc: 'AI 추천으로 팀에 맞는 숙소를 찾아보세요',
                  href: '/accommodations',
                  cta: '숙소 보러가기 →',
                },
                {
                  step: 3,
                  done: bookings.some(b => b.status === 'confirmed'),
                  icon: '📅',
                  title: '첫 예약 완료',
                  desc: '지원금 자동 적용으로 더 저렴하게 예약해요',
                  href: bookings.some(b => b.status === 'confirmed') ? null : '/accommodations',
                  cta: '예약하러 가기 →',
                },
                {
                  step: 4,
                  done: false,
                  icon: '🍅',
                  title: '마이 워케이션 인증',
                  desc: '전용 와이파이 근태 인증 및 업무 증빙 이미지를 업로드하세요',
                  href: '/my-workation',
                  cta: '근태 인증하기 →',
                },
              ].map(s => (
                <div key={s.step} className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all ${
                  s.done
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-[#F8FAFC] border-[#E2E8F0]'
                }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                    s.done ? 'bg-emerald-500 text-white' : 'bg-[#E2E8F0] text-[#94A3B8]'
                  }`}>
                    {s.done ? '✓' : s.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold ${s.done ? 'text-emerald-600' : 'text-[#0F172A]'}`}>
                      {s.title}
                    </div>
                    <div className="text-xs text-[#94A3B8] truncate">{s.desc}</div>
                  </div>
                  {!s.done && s.href && (
                    <Link href={s.href}
                      className="shrink-0 text-xs text-blue-500 hover:text-blue-700 font-semibold whitespace-nowrap">
                      {s.cta}
                    </Link>
                  )}
                </div>
              ))}
            </div>

            <button onClick={dismissOnboarding}
              className="w-full text-xs text-[#94A3B8] hover:text-[#475569] py-2 transition-colors">
              나중에 볼게요
            </button>
          </div>
        )}

        {/* 퀵 액션 버튼 2개 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link href="/my-workation"
            className="flex items-center gap-3 bg-gradient-to-r from-[#1e3a8a] to-[#0d9488] rounded-2xl p-5 hover:opacity-90 transition-opacity group">
            <span className="text-2xl">📶</span>
            <div className="flex-1">
              <div className="text-white font-black text-sm">마이 워케이션</div>
              <div className="text-teal-200 text-xs mt-0.5">와이파이 근태 · 사진 증빙</div>
            </div>
            <span className="text-white/60 group-hover:text-white transition-colors">→</span>
          </Link>

          <Link href="/documents"
            className="flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-5 hover:opacity-90 transition-opacity group">
            <span className="text-2xl">📄</span>
            <div className="flex-1">
              <div className="text-white font-black text-sm">업무 인증</div>
              <div className="text-emerald-100 text-xs mt-0.5">증빙 서류 업로드</div>
            </div>
            <span className="text-white/60 group-hover:text-white transition-colors">→</span>
          </Link>
        </div>

        {/* 예약 목록 */}
        <h2 className="font-black text-lg mb-4">내 워케이션 기록</h2>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#94A3B8] text-sm">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
            불러오는 중...
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8">
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">✈️</div>
              <p className="font-black text-lg text-[#0F172A] mb-1">첫 워케이션을 떠나볼까요?</p>
              <p className="text-sm text-[#94A3B8]">아래 순서대로 따라오면 3분 안에 준비 완료예요</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                {
                  step: '01',
                  icon: '🔍',
                  title: '숙소 찾기',
                  desc: 'AI 추천으로 팀 인원·스타일에 딱 맞는 숙소를 골라요. 지원금 배지도 자동으로 표시돼요.',
                  href: '/accommodations',
                  cta: '숙소 보러가기',
                  color: 'border-blue-200 bg-blue-50',
                  ctaColor: 'bg-blue-500 hover:bg-blue-600',
                },
                {
                  step: '02',
                  icon: '📅',
                  title: '예약하기',
                  desc: '날짜·인원을 선택하면 지원금이 자동 차감돼요. 회사 예산에서 바로 처리됩니다.',
                  href: '/accommodations',
                  cta: '예약 시작하기',
                  color: 'border-purple-200 bg-purple-50',
                  ctaColor: 'bg-purple-500 hover:bg-purple-600',
                },
                {
                  step: '03',
                  icon: '🍅',
                  title: '근무 인증하고 쉬기',
                  desc: '제휴 공간 와이파이로 출퇴근을 인증하고 업무 사진을 증빙하여 지원금 심사를 완료하세요.',
                  href: '/my-workation',
                  cta: '근태 인증 체험',
                  color: 'border-emerald-200 bg-emerald-50',
                  ctaColor: 'bg-emerald-500 hover:bg-emerald-600',
                },
              ].map((s, i, arr) => (
                <div key={s.step} className="relative">
                  {i < arr.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-full w-4 text-center text-[#CBD5E1] z-10 -translate-x-2">→</div>
                  )}
                  <div className={`border rounded-2xl p-5 h-full flex flex-col ${s.color}`}>
                    <div className="text-xs font-black text-[#94A3B8] mb-2">STEP {s.step}</div>
                    <div className="text-2xl mb-2">{s.icon}</div>
                    <div className="font-black text-sm text-[#0F172A] mb-2">{s.title}</div>
                    <div className="text-xs text-[#475569] leading-relaxed flex-1 mb-4">{s.desc}</div>
                    <Link href={s.href}
                      className={`text-center text-xs text-white font-semibold px-4 py-2 rounded-xl transition-colors ${s.ctaColor}`}>
                      {s.cta} →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <p className="text-xs text-[#94A3B8]">궁금한 점이 있으면 <Link href="/faq" className="text-blue-500 hover:underline">FAQ</Link>를 확인해주세요</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {bookings.map(b => {
              const sid        = String(b.id)
              const st         = STATUS_STYLE[b.status] ?? STATUS_STYLE.cancelled
              const region     = b.accommodations?.region ?? ''
              const gradColor  = getRegionColor(region)
              const myDocs     = docs.filter(d => d.booking_id === sid)
              const isOpen     = openId === sid
              const isUploading = uploading === sid
              const n          = nights(b.start_date, b.end_date)
              const docConfirmed = myDocs.some(d => d.status === '확인 완료')

              return (
                <div key={b.id} className="bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
                  {/* 컬러 배너 */}
                  <div className={`bg-gradient-to-r ${gradColor} px-5 py-4 flex items-center justify-between`}>
                    <div>
                      <div className="text-white font-black text-lg leading-tight">{b.accommodations?.name ?? '-'}</div>
                      <div className="text-white/80 text-xs mt-0.5">📍 {region || '-'}</div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.bg} ${st.text} bg-white/20`}>
                      {st.label}
                    </span>
                  </div>

                  {/* 상세 정보 */}
                  <div className="px-5 py-4 flex items-center justify-between">
                    <div className="flex gap-5">
                      <div>
                        <div className="text-xs text-[#94A3B8] mb-0.5">일정</div>
                        <div className="text-sm font-semibold">{formatDate(b.start_date)} – {formatDate(b.end_date)}</div>
                        <div className="text-xs text-[#94A3B8] mt-0.5">{n}박 · {b.guests}명</div>
                      </div>
                      <div>
                        <div className="text-xs text-[#94A3B8] mb-0.5">결제 금액</div>
                        <div className="text-sm font-semibold text-blue-500">{b.total_price?.toLocaleString()}원</div>
                        <div className="text-xs text-[#94A3B8] mt-0.5">회사 예산 차감</div>
                      </div>
                    </div>

                    {b.status === 'confirmed' && (
                      <button onClick={() => setOpenId(isOpen ? null : sid)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors ${
                          myDocs.length > 0
                            ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                            : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'
                        }`}>
                        {myDocs.length > 0 ? (docConfirmed ? '✅ 확인 완료' : `📄 ${myDocs.length}건 제출됨`) : '📎 서류 제출'}
                        <span>{isOpen ? '▲' : '▼'}</span>
                      </button>
                    )}
                  </div>

                  {/* 서류 제출 패널 */}
                  {b.status === 'confirmed' && isOpen && (
                    <div className="border-t border-[#F1F5F9] bg-[#F8FAFC] px-5 py-4">
                      <div className="text-xs font-bold text-[#475569] mb-3">직무 증빙 자료</div>

                      {myDocs.length > 0 && (
                        <div className="flex flex-col gap-2 mb-3">
                          {myDocs.map(doc => (
                            <a key={doc.id} href={doc.file_url} target="_blank" rel="noreferrer"
                              className="flex items-center justify-between bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 hover:border-blue-400 transition-colors group">
                              <span className="text-xs text-[#475569] group-hover:text-blue-500 truncate max-w-[240px]">
                                📄 {doc.file_name}
                              </span>
                              <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                doc.status === '확인 완료'
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : 'bg-amber-500/10 text-amber-600'
                              }`}>{doc.status}</span>
                            </a>
                          ))}
                        </div>
                      )}

                      <label className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-semibold border-2 border-dashed cursor-pointer transition-colors ${
                        isUploading
                          ? 'border-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                          : 'border-blue-300 text-blue-500 hover:bg-blue-500/5 hover:border-blue-400'
                      }`}>
                        {isUploading
                          ? <><div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />업로드 중...</>
                          : <>+ 파일 첨부 {myDocs.length > 0 ? '(추가)' : ''}</>}
                        <input type="file" className="hidden" disabled={!!uploading}
                          onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) handleUpload(sid, file)
                            e.target.value = ''
                          }} />
                      </label>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
