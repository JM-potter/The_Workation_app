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
  return DEFAULT_IMAGES[acc.id] || acc.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&q=80'
}

const MOCK_ACCOMMODATIONS: Accommodation[] = [
  { id: '1', name: '강릉 오션뷰 워케이션 센터', region: '강원도 강릉시', address: '강원도 강릉시 창해로 14', price_per_night: 85000, capacity: 4, rating: 4.8, tags: ['오션뷰', '코워킹'], amenities: ['와이파이', '커피머신', '모니터'], description: '탁 트인 바다를 보며 업무에 집중할 수 있는 최고의 코워킹 스페이스입니다.' },
  { id: '2', name: '제주 힐링 프라이빗 오피스', region: '제주도 제주시', address: '제주특별자치도 제주시 애월읍', price_per_night: 120000, capacity: 2, rating: 4.9, tags: ['자연', '프라이빗'], amenities: ['와이파이', '개인오피스', '주차장'], description: '제주의 맑은 공기와 함께하는 힐링 워케이션을 경험해보세요.' },
  { id: '3', name: '여수 밤바다 코워킹 스페이스', region: '전라남도 여수시', address: '전라남도 여수시 돌산읍', price_per_night: 75000, capacity: 3, rating: 4.7, tags: ['야경', '힐링'], amenities: ['와이파이', '라운지', '루프탑'], description: '여수 밤바다의 낭만을 즐기며 워라밸을 실현할 수 있는 숙소입니다.' },
  { id: '4', name: '경주 한옥 워크 하우스', region: '경상북도 경주시', address: '경상북도 경주시 교촌길', price_per_night: 90000, capacity: 4, rating: 4.6, tags: ['한옥', '전통'], amenities: ['와이파이', '마당', '다도세트'], description: '고즈넉한 한옥에서 전통의 멋을 느끼며 여유롭게 업무를 진행하세요.' },
  { id: '5', name: '부산 해운대 스마트 워크센터', region: '부산광역시 해운대구', address: '부산광역시 해운대구 해운대해변로', price_per_night: 110000, capacity: 10, rating: 4.8, tags: ['스마트', '도심'], amenities: ['와이파이', '회의실', '프린터'], description: '해운대 중심에 위치한 최고급 시설의 스마트 워크센터입니다.' },
  { id: '6', name: '남해 프라이빗 풀빌라 오피스', region: '경상남도 남해군', address: '경상남도 남해군 남면', price_per_night: 150000, capacity: 6, rating: 5.0, tags: ['풀빌라', '럭셔리'], amenities: ['와이파이', '수영장', '바베큐'], description: '남해의 푸른 바다를 품은 럭셔리 풀빌라에서 완벽한 워케이션을.' }
]

export default function AccommodationDetailPage() {
  const router = useRouter()
  const { id } = useParams()
  const [acc, setAcc]             = useState<Accommodation | null>(null)
  const [subsidies, setSubsidies] = useState<Subsidy[]>([])
  const [loading, setLoading]     = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)

  async function handleBooking() {
    const { data } = await supabase.auth.getUser()
    if (!data.user && !BYPASS_AUTH) {
      setShowLoginModal(true)
    } else {
      router.push(`/booking?id=${acc?.id}`)
    }
  }

  useEffect(() => {
    async function fetch() {
      const { data, error } = await supabase.from('accommodations').select('*').eq('id', id).single()
      let currentAcc = data;
      
      if (error || !data) {
        currentAcc = MOCK_ACCOMMODATIONS.find(a => a.id === id) || null;
      }
      
      if (currentAcc) {
        setAcc(currentAcc)
        const { data: subs } = await supabase.from('subsidies').select('*')
        if (subs) {
          setSubsidies(subs.filter((s: Subsidy) =>
            currentAcc.region.includes(s.region) || s.region.includes(currentAcc.region.split(' ')[0])
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
              <p className="text-sm text-[#475569]">📍 {acc.address || acc.region}</p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
              <h2 className="font-semibold mb-3">숙소 소개</h2>
              <p className="text-sm text-[#475569] leading-relaxed">{acc.description}</p>
            </div>

            {acc.amenities?.length > 0 && (
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <h2 className="font-semibold mb-3">편의시설</h2>
                <div className="grid grid-cols-2 gap-2">
                  {acc.amenities.map((a) => (
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
                {acc.price_per_night.toLocaleString()}원
              </div>
              <div className="text-xs text-[#94A3B8] mb-5">1박 기준 · 세금 포함</div>

              <div className="flex flex-col gap-3 mb-4">
                <div>
                  <label className="text-xs text-[#475569] mb-1 block">체크인</label>
                  <input type="date" className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-[#475569] mb-1 block">체크아웃</label>
                  <input type="date" className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-[#475569] mb-1 block">인원</label>
                  <select className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-500">
                    {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n}>{n}명</option>)}
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
                      <span className="font-bold text-emerald-600 shrink-0">{s.amount_per_person.toLocaleString()}원/인</span>
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
