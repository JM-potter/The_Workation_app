'use client'
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { supabase, BYPASS_AUTH } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleLogin() {
    setError('')
    setLoading(true)

    // BYPASS_AUTH 로직이 삭제되었습니다.
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (authError) {
      setError('이메일 또는 비밀번호가 올바르지 않아요')
    } else {
      const role = data.user?.user_metadata?.role
      if (role === 'emp') router.push('/select')
      else if (role === 'hr') router.push('/dashboard')
      else router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-1 text-sm text-[#94A3B8] hover:text-[#475569] transition-colors mb-6">
          ← 뒤로가기
        </Link>
        <div className="text-center mb-8">
          <Link href="/" className="text-xl font-black text-[#0F172A]">더 워케이션</Link>
          <p className="text-sm text-[#475569] mt-2">계정에 로그인하세요</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 flex flex-col gap-4">
          <Input
            label="이메일"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="비밀번호"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          <Button size="lg" className="w-full mt-2" onClick={handleLogin}>
            {loading ? '로그인 중...' : '로그인'}
          </Button>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-[#E2E8F0]" />
            <span className="text-xs text-[#94A3B8]">또는</span>
            <div className="flex-1 h-px bg-[#E2E8F0]" />
          </div>

          <button className="w-full flex items-center justify-center gap-3 border border-[#E2E8F0] rounded-xl py-3 text-sm font-medium text-[#475569] hover:bg-[#F8FAFC] transition-colors">
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.1-6.1C34.46 3.05 29.5 1 24 1 14.82 1 7.07 6.48 3.64 14.22l7.14 5.55C12.48 13.67 17.77 9.5 24 9.5z"/><path fill="#4285F4" d="M46.52 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.68c-.55 2.96-2.2 5.47-4.68 7.16l7.18 5.58C43.34 37.26 46.52 31.33 46.52 24.5z"/><path fill="#FBBC05" d="M10.78 28.23A14.6 14.6 0 0 1 9.5 24c0-1.47.25-2.89.68-4.23L3.04 14.22A23.93 23.93 0 0 0 .5 24c0 3.87.93 7.53 2.54 10.78l7.74-6.55z"/><path fill="#34A853" d="M24 46.5c5.5 0 10.12-1.82 13.48-4.94l-7.18-5.58c-1.82 1.22-4.15 1.94-6.3 1.94-6.23 0-11.52-4.17-13.22-9.77l-7.74 6.55C7.07 41.52 14.82 46.5 24 46.5z"/></svg>
            Google로 로그인
          </button>

          <button className="w-full flex items-center justify-center gap-3 bg-[#FEE500] rounded-xl py-3 text-sm font-medium text-[#191919] hover:brightness-95 transition-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#191919"><path d="M12 3C7.03 3 3 6.36 3 10.5c0 2.62 1.56 4.93 3.93 6.3L6 21l4.42-2.3c.51.07 1.04.1 1.58.1 4.97 0 9-3.36 9-7.5S16.97 3 12 3z"/></svg>
            카카오로 로그인
          </button>
        </div>

        <p className="text-center text-sm text-[#94A3B8] mt-6">
          계정이 없으신가요?{' '}
          <Link href="/register" className="text-blue-400 hover:underline font-medium">회원가입</Link>
        </p>
      </div>
    </div>
  )
}
