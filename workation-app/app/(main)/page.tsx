import Link from 'next/link'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import Footer from '@/components/ui/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="px-6 py-5 flex justify-between items-center max-w-6xl mx-auto">
        <Link href="/" className="shrink-0 mr-4">
          <Image
            src="/logo.png"
            alt="더 워케이션"
            width={160}
            height={20}
            className="w-32 md:w-36 h-auto object-contain"
            priority
          />
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/about" className="text-sm text-blue-600 font-bold hover:text-blue-700 transition-colors">회사/사업 모델 소개</Link>
          <Link href="/workation" className="text-sm text-[#475569] hover:text-blue-500 transition-colors">워케이션이란?</Link>
          <Link href="/subsidy" className="text-sm text-[#475569] hover:text-blue-500 transition-colors">지원금 안내</Link>
          <Link href="/partner" className="text-sm text-[#475569] hover:text-blue-500 transition-colors">파트너 등록</Link>
          <Link href="/faq" className="text-sm text-[#475569] hover:text-blue-500 transition-colors">자주 묻는 질문</Link>
        </nav>
        <div className="flex gap-3">
          <Link href="/gov" className="text-sm text-[#475569] hover:text-blue-500 transition-colors px-3 py-2">
            지자체
          </Link>
          <Link href="/dashboard" className="text-sm text-[#475569] hover:text-blue-500 transition-colors px-3 py-2">
            HR 대시보드
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="sm">로그인</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">무료로 시작하기</Button>
          </Link>
        </div>
      </header>

      {/* 히어로 — 배경 이미지 */}
      <section
        className="relative w-full px-6 pt-36 pb-32 text-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1775153014232-c97cbddb59cd?auto=format&fit=crop&w=1920&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/65 via-[#0F172A]/55 to-[#0F172A]/70" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-block bg-white/15 border border-white/30 text-white text-xs font-bold px-3 py-1 rounded-full mb-6">
            기업 전용 워케이션 플랫폼
          </div>
          <h1 className="text-5xl font-black leading-tight mb-6 text-white">
            워케이션,<br />
            <span className="text-blue-300">한 번에 예약하고</span><br />
            자동으로 관리하세요
          </h1>
          <p className="text-white/75 text-lg mb-10 max-w-xl mx-auto">
            숙소 검색부터 단체 예약, 예산 관리, 성과 보고까지.
            인사담당자를 위한 올인원 워케이션 솔루션.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg">지금 시작하기 →</Button>
            </Link>
            <Link href="/accommodations">
              <Button variant="secondary" size="lg" className="!bg-white/15 !text-white !border-white/40 hover:!bg-white/25">숙소 둘러보기</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 수치 — 회색 배경 */}
      <section className="bg-[#F1F5F9] py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-8">
            <span className="text-sm font-bold text-[#475569] uppercase tracking-widest">지금까지의 성과</span>
            <div className="w-8 h-1 bg-blue-400 rounded-full mx-auto mt-2" />
          </div>
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { num: '200+', label: '제휴 숙소' },
              { num: '50+', label: '파트너 기업' },
              { num: '98%', label: '재이용률' },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-3xl font-black text-blue-400 mb-1">{item.num}</div>
                <div className="text-sm text-[#475569]">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 워케이션이란? — 흰 배경 */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-8">
            <span className="text-sm font-bold text-[#475569] uppercase tracking-widest">워케이션 알아보기</span>
            <div className="w-8 h-1 bg-blue-400 rounded-full mx-auto mt-2" />
          </div>
          <div className="text-center">
            <p className="text-[#475569] mb-6">워케이션이 처음이신가요?</p>
            <Link href="/workation">
              <Button variant="secondary" size="lg">워케이션이란? →</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA — 파란 배경 */}
      <section className="bg-blue-50 py-20 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-6">
            <span className="text-sm font-bold text-blue-400 uppercase tracking-widest">지금 시작하기</span>
            <div className="w-8 h-1 bg-blue-300 rounded-full mx-auto mt-2" />
          </div>
          <h2 className="text-2xl font-bold text-[#0F172A] mb-4">지금 바로 시작해보세요</h2>
          <p className="text-[#475569] mb-8">가입 후 5분 안에 첫 워케이션 예약까지 완료할 수 있습니다</p>
          <Link href="/register">
            <Button size="lg" className="!bg-white !text-blue-500 hover:!bg-blue-50 border border-blue-200">무료로 시작하기</Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
