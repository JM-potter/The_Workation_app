'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type PendingUser = {
  id: string
  name: string
  email: string
  company_name: string
  status: string
  phone_number: string
}

export default function SuperAdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 보안 통과 체크 (로컬 스토리지 기반 간단한 우회 확인)
    const token = localStorage.getItem('superadmin_token')
    if (!token) {
      alert('접근 권한이 없습니다.')
      router.push('/login')
      return
    }
    fetchPendingUsers()
  }, [router])

  async function fetchPendingUsers() {
    setLoading(true)
    try {
      // 프론트엔드 직접 접근 대신, 우리가 방금 뚫어둔 백엔드(API)로 요청
      const res = await fetch('/api/superadmin/pending')
      const data = await res.json()
      
      if (res.ok) {
        setUsers(data as PendingUser[])
      } else {
        console.error('Error fetching users:', data.error)
      }
    } catch (error) {
      console.error('Network error:', error)
    }
    setLoading(false)
  }

  async function handleApprove(userId: string) {
    try {
      const res = await fetch('/api/superadmin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        alert('성공적으로 승인되었습니다!')
        fetchPendingUsers()
      } else {
        alert('승인 중 오류가 발생했습니다: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      alert('승인 요청 중 네트워크 오류가 발생했습니다.')
      console.error(error)
    }
  }

  async function handleReject(userId: string) {
    if (!confirm('정말로 이 가입 요청을 거절하고 계정을 삭제하시겠습니까?')) return;
    
    try {
      const res = await fetch('/api/superadmin/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        alert('성공적으로 삭제되었습니다.')
        fetchPendingUsers()
      } else {
        alert('삭제 중 오류가 발생했습니다: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      alert('삭제 요청 중 네트워크 오류가 발생했습니다.')
      console.error(error)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">불러오는 중...</div>
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-[#0F172A] flex items-center gap-2">
              👑 더 워케이션 슈퍼 관리자
            </h1>
            <p className="text-sm text-[#475569] mt-1">기업(HR) 가입 요청 승인 및 플랫폼 전체 관리</p>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('superadmin_token')
              router.push('/login')
            }}
            className="text-sm text-red-500 hover:underline font-medium"
          >
            로그아웃
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E2E8F0] bg-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-[#0F172A]">가입 대기 중인 기업(HR) 목록</h2>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold">
              총 {users.length}건
            </span>
          </div>

          {users.length === 0 ? (
            <div className="px-6 py-12 text-center text-[#94A3B8]">
              현재 대기 중인 가입 요청이 없습니다.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-6 py-3 font-medium">기업명</th>
                  <th className="px-6 py-3 font-medium">담당자 이름</th>
                  <th className="px-6 py-3 font-medium">이메일</th>
                  <th className="px-6 py-3 font-medium">연락처</th>
                  <th className="px-6 py-3 font-medium text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#0F172A]">{user.company_name || '미입력'}</td>
                    <td className="px-6 py-4">{user.name}</td>
                    <td className="px-6 py-4 text-[#64748B]">{user.email}</td>
                    <td className="px-6 py-4 text-[#0F172A] font-medium">{user.phone_number || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleApprove(user.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                        >
                          승인하기
                        </button>
                        <button 
                          onClick={() => handleReject(user.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                        >
                          거절(삭제)
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
