'use client'
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'

const roles = [
  { value: 'hr',  label: '인사담당자', desc: '기업 예약·예산 관리' },
  { value: 'emp', label: '직원',       desc: '개인 워케이션 예약' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole]         = useState<'hr' | 'emp' | ''>('')
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  
  const [showCompanyList, setShowCompanyList] = useState(false)
  const [companyList, setCompanyList] = useState<string[]>([])

  // 직원일 경우 가입된(승인된) HR 회사 목록 불러오기 (자동완성용)
  useEffect(() => {
    if (role === 'emp') {
      const fetchCompanies = async () => {
        const { data } = await supabase
          .from('users')
          .select('company_name')
          .eq('role', 'hr')
          .eq('status', 'approved')
        
        if (data) {
          const uniqueCompanies = Array.from(new Set(data.map(u => u.company_name).filter(Boolean)))
          setCompanyList(uniqueCompanies as string[])
        }
      }
      fetchCompanies()
    }
  }, [role])

  async function handleRegister() {
    if (!role || !name || !email || !password || !companyName) {
      setError('모든 필수 항목을 입력해주세요')
      return
    }
    if (role === 'hr' && !phoneNumber) {
      setError('인사담당자는 검증을 위해 연락처를 반드시 입력해야 합니다.')
      return
    }

    setError('')
    setLoading(true)
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { 
            name, 
            role,
            company_name: companyName,
            status: 'pending', // 신규 가입자는 무조건 승인 대기 상태
            phone_number: role === 'hr' ? phoneNumber : null
          } 
        },
      })
      setLoading(false)
      if (authError) {
        setError(authError.message)
      } else if (data.user) {
        // 성공 시 무조건 승인 대기 페이지로 이동
        router.push('/pending')
      } else {
        setError('가입 처리 중 오류가 발생했어요. 다시 시도해주세요.')
      }
    } catch (e: unknown) {
      setLoading(false)
      setError('연결 오류: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-1 text-sm text-[#94A3B8] hover:text-[#475569] transition-colors mb-6">
          ← 뒤로가기
        </Link>
        <div className="text-center mb-8">
          <Link href="/" className="text-xl font-black text-[#0F172A]">더 워케이션</Link>
          <p className="text-sm text-[#475569] mt-2">새 계정을 만들어보세요</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-[#475569] mb-2">역할을 선택해주세요</p>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((r) => (
                <button key={r.value} onClick={() => setRole(r.value as 'hr' | 'emp')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    role === r.value ? 'border-blue-500 bg-blue-500/10' : 'border-[#E2E8F0] bg-[#F1F5F9] hover:border-[#94A3B8]'
                  }`}>
                  <div className="font-semibold text-sm">{r.label}</div>
                  <div className="text-xs text-[#94A3B8] mt-0.5">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <Input label="이름" type="text" placeholder="홍길동" value={name} onChange={e => setName(e.target.value)} />
          <Input label="이메일" type="email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} />
          <Input label="비밀번호" type="password" placeholder="6자 이상" value={password} onChange={e => setPassword(e.target.value)} />

          {/* 소속 회사명 및 자동완성 */}
          <div className="relative">
            <Input 
              label="소속 회사명" 
              type="text" 
              placeholder={role === 'hr' ? "정확한 법인명을 기입해주세요" : "소속 회사를 검색해주세요"} 
              value={companyName} 
              onChange={e => {
                setCompanyName(e.target.value)
                setShowCompanyList(true)
              }}
              onFocus={() => setShowCompanyList(true)}
              onBlur={() => setTimeout(() => setShowCompanyList(false), 200)}
            />
            
            {role === 'emp' && showCompanyList && companyName.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {companyList.filter(c => c.includes(companyName)).length > 0 ? (
                  companyList.filter(c => c.includes(companyName)).map((c, idx) => (
                    <div 
                      key={idx} 
                      className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 border-b last:border-0"
                      onClick={() => {
                        setCompanyName(c)
                        setShowCompanyList(false)
                      }}
                    >
                      {c}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-slate-500 bg-slate-50">
                    가입(승인)된 회사가 없습니다.<br/>인사담당자에게 가입을 요청해주세요.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* HR 전용 연락처 */}
          {role === 'hr' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <Input 
                label="연락처 (관리자 검증용)" 
                type="text" 
                placeholder="010-1234-5678" 
                value={phoneNumber} 
                onChange={e => setPhoneNumber(e.target.value)} 
              />
              <p className="text-[11px] text-blue-500 mt-1">기업 승인을 위해 플랫폼 관리자가 연락을 드릴 수 있습니다.</p>
            </div>
          )}

          {error && <p className="text-sm text-red-500 text-center font-medium bg-red-50 py-2 rounded-lg">{error}</p>}
          
          <button
            onClick={handleRegister}
            style={{ background: '#3B82F6', color: 'white', width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 700, fontSize: '16px', border: 'none', cursor: 'pointer', marginTop: '4px' }}
          >
            {loading ? '가입 처리 중...' : '가입하기'}
          </button>
        </div>

        <p className="text-center text-sm text-[#94A3B8] mt-6">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-blue-500 hover:underline font-bold">로그인</Link>
        </p>
      </div>
    </div>
  )
}
