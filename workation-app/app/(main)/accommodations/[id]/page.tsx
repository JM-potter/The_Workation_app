'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/ui/Footer'
import Header from '@/components/ui/Header'
import Button from '@/components/ui/Button'
import { supabase, BYPASS_AUTH } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Accommodation = {
  id: string
  name: string
  region: string
  address?: string
  price_per_night: number
  capacity: number
  rating: number
  tags: string[]
  amenities: string[]
  description: string
  image_url?: string
}

type Subsidy = {
  id: string
  name: string
  region: string
  amount_per_person: number
  min_nights: number
  unit: string
  conditions: string
  provider: string
}

const DEFAULT_IMAGES: Record<string, string> = {
  '1': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&q=80',
  '2': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1000&q=80',
  '3': 'https://images.unsplash.com/photo-1582719478250-c89cae4db85b?w=1000&q=80',
  '4': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000&q=80',
  '5': 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1000&q=80',
  '6': 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1000&q=80',
}

function getImageUrl(acc: { id: string; image_url?: string }) {
  // 사용자가 입력한 이미지 URL이 있으면 최우선으로 사용하고, 없으면 기본 이미지 폴백
  return acc.image_url || DEFAULT_IMAGES[acc.id] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&q=80'
}

export default function AccommodationDetailPage() {
  const router = useRouter()
  const { id } = useParams()
  const [acc, setAcc]             = useState<Accommodation | null>(null)
  const [subsidies, setSubsidies] = useState<Subsidy[]>([])
  const [loading, setLoading]     = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(1)

  async function handleBooking() {
    const { data } = await supabase.auth.getUser()
    if (!data.user && !BYPASS_AUTH) {
      setShowLoginModal(true)
    } else {
      router.push(`/booking?id=${acc?.id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`)
    }
  }

  useEffect(() => {
    async function fetch() {
      const { data, error } = await supabase.from('accommodations').select('*').eq('id', id).single()
      if (data) {
        setAcc(data)
        const { data: subs } = await supabase.from('subsidies').select('*')
        if (subs) {
          setSubsidies(subs.filter((s: Subsidy) =>
            (data.region || '').includes(s.region) || (s.region || '').includes((data.region || '').split(' ')[0])
          ))
        }
      }
      setLoading(false)
    }
    fetch()
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />
      <div className="flex items-center justify-center py-40 text-[#94A3B8]">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
        불러오는 중...
      </div>
    </div>
  )

  if (!acc) return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />
      <div className="text-center py-40 text-[#94A3B8]">숙소를 찾을 수 없어요</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link href="/accommodations" className="text-sm text-[#94A3B8] hover:text-[#475569] flex items-center gap-1 mb-6 transition-colors">
          ← 숙소 목록으로
        </Link>

        <img src={getImageUrl(acc)} alt={acc.name} className="w-full h-72 object-cover rounded-2xl mb-6" />

        <div className="grid grid-cols-3 gap-6">
          {/* 왼쪽: 상세 정보 */}
          <div className="col-span-2 flex flex-col gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">💻 업무공간</span>
                <span className="text-xs bg-[#F1F5F9] text-[#475569] px-2 py-0.5 rounded">📶 와이파이</span>
                <span className="text-xs bg-[#F1F5F9] text-[#475569] px-2 py-0.5 rounded">⭐ {acc.rating}</span>
              </div>
              <h1 className="text-2xl font-bold mb-1">{acc.name}</h1>
              <p className="text-sm text-[#475569]">📍 {acc.address || (acc.region || '')}</p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
              <h2 className="font-semibold mb-3">숙소 소개</h2>
              <p className="text-sm text-[#475569] leading-relaxed">{acc.description}</p>
            </div>

            {acc.amenities?.length > 0 && (
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <h2 className="font-semibold mb-3">편의시설</h2>
                <div className="grid grid-cols-2 gap-2">
                  {(acc.amenities || []).map((a) => (
                    <div key={a} className="flex items-center gap-2 text-sm text-[#475569]">
                      <span className="text-emerald-500">✓</span> {a}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽: 예약 카드 */}
          <div className="col-span-1">
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 sticky top-6">
              <div className="text-2xl font-black text-blue-400 mb-1">
                {(acc.price_per_night || 0).toLocaleString()}원
              </div>
              <div className="text-xs text-[#94A3B8] mb-5">1박 기준 · 세금 포함</div>

              <div className="flex flex-col gap-3 mb-4">
                <div>
                  <label className="text-xs text-[#475569] mb-1 block">체크인</label>
                  <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-[#475569] mb-1 block">체크아웃</label>
                  <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-[#475569] mb-1 block">인원</label>
                  <select value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-500">
                    {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}명</option>)}
                  </select>
                </div>
              </div>

              {subsidies.length > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-sm">💰</span>
                    <span className="text-xs font-semibold text-emerald-700">지원금 자동 매칭</span>
                  </div>
                  {subsidies.map(s => (
                    <div key={s.id} className="flex justify-between items-center text-xs mb-1">
                      <span className="text-emerald-700 truncate pr-2">{s.name}</span>
                      <span className="font-bold text-emerald-600 shrink-0">{(s.amount_per_person || 0).toLocaleString()}원/인</span>
                    </div>
                  ))}
                </div>
              )}

              <Button size="lg" className="w-full" onClick={handleBooking}>예약하기</Button>

              <p className="text-xs text-[#94A3B8] text-center mt-3">회사 예산에서 자동 차감됩니다</p>
            </div>
          </div>
        </div>
      </div>
      {/* 로그인 유도 모달 */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-lg font-bold mb-2">로그인이 필요해요</h2>
            <p className="text-sm text-[#475569] mb-6">예약하려면 먼저 로그인해주세요.</p>
            <div className="flex flex-col gap-3">
              <Link href="/login">
                <Button size="lg" className="w-full">로그인하기</Button>
              </Link>
              <Link href="/register">
                <Button variant="secondary" size="lg" className="w-full">회원가입</Button>
              </Link>
              <button onClick={() => setShowLoginModal(false)} className="text-sm text-[#94A3B8] hover:text-[#475569] transition-colors">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  )
}
