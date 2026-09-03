import Link from 'next/link'
import Header from '@/components/ui/Header'
import Footer from '@/components/ui/Footer'

export default function PendingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">⏳</span>
        </div>
        <h1 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">가입 신청이 완료되었습니다</h1>
        <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
          현재 소속 회사의 인사담당자 또는 플랫폼 최고 관리자의 <strong className="text-blue-600">최종 승인을 기다리고 있습니다.</strong>
          <br /><br />
          승인이 완료되면 모든 서비스를 정상적으로 이용하실 수 있습니다.
        </p>
        <Link 
          href="/" 
          className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors shadow-sm"
        >
          메인 홈페이지로 돌아가기
        </Link>
      </div>
      <Footer />
    </div>
  )
}
