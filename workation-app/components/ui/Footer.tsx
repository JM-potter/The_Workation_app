import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#1E293B] text-white px-6 pt-16 pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-4 gap-10 mb-12">
          <div>
            <div className="font-bold text-sm mb-4">서비스</div>
            <ul className="space-y-2 text-sm text-[#94A3B8]">
              <li><Link href="/workation" className="hover:text-white transition-colors">워케이션이란?</Link></li>
              <li><Link href="/accommodations" className="hover:text-white transition-colors">숙소 찾기</Link></li>
              <li><Link href="/subsidy" className="hover:text-white transition-colors">지원금 안내</Link></li>
              <li><Link href="/partner" className="hover:text-white transition-colors">파트너 등록</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-sm mb-4">고객지원</div>
            <ul className="space-y-2 text-sm text-[#94A3B8]">
              <li><Link href="#" className="hover:text-white transition-colors">공지사항</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">자주 묻는 질문</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">1:1 문의</Link></li>
              <li><a href="mailto:workation.kr@gmail.com" className="hover:text-white transition-colors">이메일 문의</a></li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-sm mb-4">회사</div>
            <ul className="space-y-2 text-sm text-[#94A3B8]">
              <li><Link href="/about" className="hover:text-white transition-colors">회사 소개</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">이용약관</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">개인정보처리방침</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-sm mb-4">연락처</div>
            <ul className="space-y-2 text-sm text-[#94A3B8]">
              <li>📧 workation.kr@gmail.com</li>
              <li>📞 02-000-0000</li>
              <li className="text-xs">평일 10:00 ~ 18:00</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#334155] pt-6 text-xs text-[#475569] text-center">
          © 2026 더 워케이션. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
