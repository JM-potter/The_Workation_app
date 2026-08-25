'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Footer from '@/components/ui/Footer'
import Header from '@/components/ui/Header'
import { supabase } from '@/lib/supabase'

type Accommodation = {
  id: string
  name: string
  region: string
  price_per_night: number
  capacity: number
  rating: number
  tags: string[]
  amenities: string[]
  description: string
  image_url?: string
}

type SubsidyInfo = {
  region: string
  amount_per_person: number
}

const DEFAULT_IMAGES: Record<string, string> = {
  '1': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
  '2': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80',
  '3': 'https://images.unsplash.com/photo-1582719478250-c89cae4db85b?w=600&q=80',
  '4': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80',
  '5': 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=600&q=80',
  '6': 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
}

function getImageUrl(acc: { id: string; image_url?: string }) {
  // 사용자가 입력한 이미지 URL이 있으면 최우선으로 사용하고, 없으면 기본 이미지 폴백
  return acc.image_url || DEFAULT_IMAGES[acc.id] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80'
}

const LOCATIONS = ['전체', '경기/인천', '강원도', '제주도', '전라남도', '전라북도']

const LOCATION_ALIASES: Record<string, string[]> = {
  '경기/인천': ['경기', '인천'],
  '강원도':    ['강원'],
  '제주도':    ['제주'],
  '전라남도':  ['전라남도', '전남'],
  '전라북도':  ['전라북도', '전북'],
}

export default function AccommodationsPage() {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [subsidies, setSubsidies]           = useState<SubsidyInfo[]>([])
  const [loading, setLoading]               = useState(true)
  const [location, setLocation]             = useState('전체')

  useEffect(() => {
    async function fetchAccommodations() {
      const { data, error } = await supabase.from('accommodations').select('*')
      if (error) console.error('[accommodations fetch error]', error)
      if (data) setAccommodations(data)
      setLoading(false)
    }
    supabase.from('subsidies').select('region, amount_per_person').then(({ data, error }) => {
      if (error) console.error('[subsidies fetch error]', error)
      if (data) setSubsidies(data)
    })
    fetchAccommodations()
  }, [])

  function getSubsidyTotal(region: string) {
    return subsidies
      .filter(s => (region || '').includes(s.region) || (s.region || '').includes((region || '').split(' ')[0]))
      .reduce((sum, s) => sum + s.amount_per_person, 0)
  }

  const filtered = accommodations
    .filter(a => {
      if (location === '전체') return true
      const aliases = LOCATION_ALIASES[location] ?? [location]
      return aliases.some(alias => (a.region || '').includes(alias))
    })
    .sort((a, b) => {
      const aGangwon = (a.region || '').includes('강원') ? 0 : 1
      const bGangwon = b.region.includes('강원') ? 0 : 1
      return aGangwon - bGangwon
    })

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />

      <div className="max-w-6xl mx-auto px-6 py-8">



        {/* 타이틀 + 지도 링크 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">전체 숙소</h1>
            <p className="text-sm text-[#475569]">전국 {accommodations.length}개 제휴 숙소</p>
          </div>
          <Link href="/accommodations/map"
            className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-xl px-4 py-2 text-sm hover:border-blue-500/50 transition-all">
            🗺️ 지도로 보기
          </Link>
        </div>

        {/* 필터 */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          {LOCATIONS.map(loc => (
            <button key={loc} onClick={() => setLocation(loc)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                location === loc ? 'bg-blue-500 text-white' : 'bg-white text-[#475569] border border-[#E2E8F0] hover:border-[#94A3B8]'
              }`}>
              {loc}
            </button>
          ))}
        </div>

        {/* 숙소 그리드 */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#94A3B8]">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
            숙소 불러오는 중...
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {filtered.map(acc => (
              <Link key={acc.id} href={`/accommodations/${acc.id}`}>
                <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden hover:border-blue-500/50 transition-all group">
                  <div className="relative">
                    <img src={getImageUrl(acc)} alt={acc.name} className="h-44 w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm leading-snug mb-1">{acc.name}</h3>
                    <p className="text-xs text-[#94A3B8] mb-2">📍 {(acc.region || '')}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {getSubsidyTotal((acc.region || '')) > 0 && (
                        <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded border border-emerald-500/20">
                          💰 {getSubsidyTotal((acc.region || '')).toLocaleString()}원/인 지원
                        </span>
                      )}
                      {acc.tags && acc.tags.slice(0, 2).map((tag, idx) => (
                        <span key={`tag-${idx}`} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">
                          #{tag}
                        </span>
                      ))}
                      {(acc.amenities || []).slice(0, 1).map(a => (
                        <span key={a} className="text-xs bg-[#F1F5F9] text-[#475569] px-2 py-0.5 rounded">{a}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-400 font-bold text-sm">
                        {(acc.price_per_night || 0).toLocaleString()}원<span className="text-[#94A3B8] font-normal text-xs"> /박</span>
                      </span>
                      <span className="text-xs text-[#94A3B8]">⭐ {acc.rating}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && accommodations.length === 0 && (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🏨</div>
            <p className="text-[#475569] font-medium mb-1">등록된 숙소가 없어요</p>
            <p className="text-xs text-[#94A3B8]">Supabase accommodations 테이블을 확인해주세요</p>
          </div>
        )}
        {!loading && accommodations.length > 0 && filtered.length === 0 && (
          <div className="text-center py-20 text-[#94A3B8]">조건에 맞는 숙소가 없어요</div>
        )}
      </div>
      <Footer />
    </div>
  )
}
