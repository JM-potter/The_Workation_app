'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Badge from './Badge'
import type { UserRole } from '@/lib/types'
import { supabase, BYPASS_AUTH } from '@/lib/supabase'

const roleLabel: Record<UserRole, string> = {
  hr:  '인사담당자',
  emp: '직원',
  adm: '운영팀',
  prt: '파트너',
  gov: '지자체',
}

interface HeaderProps {
  role?: UserRole
  userName?: string
}

export default function Header({ role: roleProp, userName: nameProp }: HeaderProps) {
  const router = useRouter()
  const [role, setRole]     = useState<UserRole | null>(roleProp ?? null)
  const [userName, setName] = useState(nameProp ?? '')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata
      if (meta?.role) {
        setRole(meta.role as UserRole)
        if (meta?.name) setName(meta.name)
      } else if (BYPASS_AUTH) {
        setRole('emp')
        setName('김지민')
      }
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-white border-b border-[#E2E8F0] px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-sm text-[#94A3B8] hover:text-[#475569] transition-colors">
            ← 뒤로
          </button>
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
        </div>

        {role ? (
          <div className="flex items-center gap-3">
            {role === 'emp' && (
              <Link href="/my" className="text-xs text-[#475569] hover:text-blue-500 transition-colors">
                👤 마이페이지
              </Link>
            )}
            <Badge variant={role}>{roleLabel[role]}</Badge>
            {userName && <span className="text-sm text-[#475569]">{userName}님</span>}
            <button onClick={handleLogout} className="text-xs text-[#94A3B8] hover:text-[#475569] transition-colors">
              로그아웃
            </button>
          </div>
        ) : (
          <Link href="/login" className="text-sm text-[#475569] hover:text-[#0F172A] transition-colors">
            로그인
          </Link>
        )}
      </div>
    </header>
  )
}
