'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/ui/Header'
import Footer from '@/components/ui/Footer'
import Button from '@/components/ui/Button'
import { supabase, BYPASS_AUTH } from '@/lib/supabase'

type Task = {
  id: string
  title: string
  done: boolean
}

type ProofDoc = {
  id: string
  file_name: string
  file_url: string
  created_at: string
}

export default function MyWorkationPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTitle, setNewTitle] = useState('')
  
  // 근태 상태
  const [isConnected, setIsConnected] = useState(false)
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [checkInTime, setCheckInTime] = useState<string | null>(null)
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null)
  
  // 증빙 업로드 상태
  const [proofs, setProofs] = useState<ProofDoc[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      let uid = data.user?.id
      let nameVal = data.user?.user_metadata?.name ?? ''

      if (!uid) {
        if (BYPASS_AUTH) {
          uid = '00000000-0000-0000-0000-000000000000'
          nameVal = '김지민'
        } else {
          return
        }
      }

      setUserId(uid)
      setUserName(nameVal)

      // 이전 등록된 증빙 서류들 로드
      const { data: dData } = await supabase
        .from('documents')
        .select('id, file_name, file_url, created_at')
        .eq('user_id', uid)
        .eq('type', 'work_proof')
        .order('id', { ascending: false })

      if (dData) {
        setProofs(dData as any)
      }
    })

    // 로컬 스토리지에서 오늘 목표 로드
    const today = new Date().toISOString().slice(0, 10)
    const saved = localStorage.getItem(`wk-goals-${today}`)
    if (saved) {
      try { setTasks(JSON.parse(saved)) } catch {}
    }
  }, [])

  // 오늘 목표 저장
  const saveGoals = (newTasks: Task[]) => {
    setTasks(newTasks)
    const today = new Date().toISOString().slice(0, 10)
    localStorage.setItem(`wk-goals-${today}`, JSON.stringify(newTasks))
  }

  const addTask = () => {
    if (!newTitle.trim()) return
    const t: Task = { id: Date.now().toString(), title: newTitle.trim(), done: false }
    saveGoals([...tasks, t])
    setNewTitle('')
  }

  const toggleDone = (id: string) => {
    saveGoals(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const removeTask = (id: string) => {
    saveGoals(tasks.filter(t => t.id !== id))
  }

  // 근무 시작 / 종료 처리
  const handleCheckIn = () => {
    if (!isConnected) return
    setIsCheckedIn(true)
    setCheckInTime(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    setCheckOutTime(null)
  }

  const handleCheckOut = () => {
    if (!isCheckedIn) return
    setIsCheckedIn(false)
    setCheckOutTime(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
  }

  // 업무 사진(증빙) 업로드
  const handleProofUpload = async (file: File) => {
    if (!userId) return
    setUploading(true)
    const path = `${userId}/workation_proof_${Date.now()}_${file.name}`
    
    const { error: uploadError } = await supabase.storage.from('documents').upload(path, file, { upsert: true })
    if (uploadError) {
      alert('업로드 실패: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)
    
    // DB documents 테이블에 삽입
    const { data: inserted } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        type: 'work_proof',
        file_url: publicUrl,
        file_name: file.name,
        status: '확인 대기'
      })
      .select()
      .single()

    if (inserted) {
      setProofs(prev => [inserted, ...prev])
    } else {
      // DB insert 에러 대비 로컬 추가
      setProofs(prev => [{
        id: Date.now().toString(),
        file_name: file.name,
        file_url: publicUrl,
        created_at: new Date().toISOString()
      }, ...prev])
    }
    setUploading(false)
  }

  const doneCount = tasks.filter(t => t.done).length
  const progressPct = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />

      <div className="max-w-3xl mx-auto px-6 py-8">
        
        {/* 페이지 타이틀 */}
        <div className="mb-8">
          <div className="text-xs text-[#94A3B8] mb-2">
            <Link href="/my" className="hover:text-blue-500 transition-colors">← 마이페이지로</Link>
          </div>
          <h1 className="text-2xl font-black text-[#0F172A] mb-1">📶 마이 워케이션</h1>
          <p className="text-sm text-[#475569]">제휴 공간 전용 와이파이 근태 인증 및 업무 증빙</p>
        </div>

        {/* 📶 1. 네트워크 근태 인증 시뮬레이터 */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-base text-[#0F172A]">📡 실시간 근태 인증 시스템</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#94A3B8]">데모용 스위치:</span>
              <button 
                onClick={() => {
                  setIsConnected(!isConnected)
                  if (isCheckedIn) setIsCheckedIn(false)
                }}
                className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all ${
                  isConnected 
                    ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
                    : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {isConnected ? '🔌 와이파이 연결 끊기' : '📶 제휴 공간 와이파이 연결'}
              </button>
            </div>
          </div>

          {/* 네트워크 상태창 */}
          <div className={`rounded-xl p-4 mb-5 border transition-all ${
            isConnected 
              ? 'bg-emerald-500/5 border-emerald-500/20' 
              : 'bg-red-500/5 border-red-500/20'
          }`}>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{isConnected ? '🟢' : '🔴'}</span>
              <div>
                <div className="text-xs text-[#94A3B8] font-semibold uppercase">현재 네트워크 상태</div>
                <div className={`text-sm font-black mt-0.5 ${isConnected ? 'text-emerald-600' : 'text-red-500'}`}>
                  {isConnected 
                    ? '인증됨: 홍천 스마트워크센터 IP 접속 중 (WiFi: Workation_Guest_5G)' 
                    : '미인증: 숙소/개인망 접속 중'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* 출퇴근 액션 버튼 */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleCheckIn}
              disabled={!isConnected || isCheckedIn}
              className={`py-4 rounded-xl text-sm font-bold border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                isCheckedIn
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 cursor-not-allowed'
                  : isConnected
                    ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 shadow-md active:scale-[0.98]'
                    : 'bg-[#F1F5F9] border-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
              }`}
            >
              <span className="text-lg">🚪</span>
              <span className="font-black">근무 시작 (Check-in)</span>
              {checkInTime && <span className="text-[10px] opacity-80">출근 기록: {checkInTime}</span>}
            </button>

            <button
              onClick={handleCheckOut}
              disabled={!isCheckedIn}
              className={`py-4 rounded-xl text-sm font-bold border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                isCheckedIn
                  ? 'bg-red-600 border-red-600 text-white hover:bg-red-700 hover:border-red-700 shadow-md active:scale-[0.98]'
                  : 'bg-[#F1F5F9] border-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
              }`}
            >
              <span className="text-lg">🏃</span>
              <span className="font-black">근무 종료 (Check-out)</span>
              {checkOutTime && <span className="text-[10px] opacity-80">퇴근 기록: {checkOutTime}</span>}
            </button>
          </div>

          {!isConnected && (
            <p className="text-[11px] text-red-400 mt-3 text-center">
              ⚠️ 제휴 공간 전용 와이파이망(예: 홍천 스마트워크센터)에 연결되어야 출퇴근 버튼이 활성화됩니다.
            </p>
          )}
          {isCheckedIn && (
            <p className="text-[11px] text-emerald-600 mt-3 text-center animate-pulse font-medium">
              🟢 현재 정상 근무 중으로 기록되고 있습니다. 업무를 마치면 근무 종료를 눌러주세요.
            </p>
          )}
        </div>

        {/* 📷 2. 업무 사진 업로드 (선택적 증빙용) */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-black text-base text-[#0F172A]">📷 업무 실시간 사진 증빙</h2>
            <span className="text-[10px] bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full border border-blue-500/20 font-bold">
              지자체 보조금 심사 필수
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] mb-5">오늘의 업무 수행 모습을 촬영하거나 캡처하여 선택적으로 증빙해 주세요.</p>

          {/* 파일 업로드 드롭존 */}
          <label className={`flex flex-col items-center justify-center gap-2 w-full py-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
            uploading
              ? 'border-slate-200 bg-slate-50 text-[#94A3B8] cursor-not-allowed'
              : 'border-blue-300 text-blue-500 hover:bg-blue-500/5 hover:border-blue-400'
          }`}>
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold text-slate-500">증빙 이미지를 업로드하는 중...</span>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-3xl mb-2">📸</div>
                <div className="text-xs font-bold">사진 파일 첨부하기 (PNG, JPG)</div>
                <div className="text-[10px] text-[#94A3B8] mt-1">이탈 확인 방지 및 출석 보완 증빙용</div>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              disabled={uploading} 
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleProofUpload(file)
                e.target.value = ''
              }} 
            />
          </label>

          {/* 증빙 등록 내역 */}
          {proofs.length > 0 && (
            <div className="mt-6 border-t border-[#F1F5F9] pt-5">
              <h3 className="text-xs font-bold text-[#475569] mb-3">제출한 근무 증빙 내역 ({proofs.length}건)</h3>
              <div className="grid grid-cols-2 gap-3">
                {proofs.map(p => (
                  <a key={p.id} href={p.file_url} target="_blank" rel="noreferrer" 
                    className="flex flex-col border border-[#E2E8F0] rounded-xl overflow-hidden hover:border-blue-400 transition-colors bg-[#F8FAFC] group">
                    <img src={p.file_url} alt={p.file_name} className="h-28 w-full object-cover group-hover:opacity-90 transition-opacity" />
                    <div className="p-2.5">
                      <div className="text-[10px] text-[#475569] font-bold truncate">📄 {p.file_name}</div>
                      <div className="text-[9px] text-[#94A3B8] mt-0.5">{new Date(p.created_at).toLocaleDateString()}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 📋 3. 오늘의 목표 선언 */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-black text-base text-[#0F172A]">📋 오늘의 업무 목표</h2>
            <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full border border-blue-500/20 font-bold">
              {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] mb-4">오늘 완료할 핵심 마이크로 결과물을 등록해주세요.</p>

          {/* 입력창 */}
          <div className="flex gap-2 mb-4">
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder="예: 강릉 코워킹 오피스에서 기획안 2p 작성"
              className="flex-1 text-sm border border-[#E2E8F0] rounded-xl px-4 py-2.5 outline-none focus:border-blue-400 transition-colors text-slate-800"
            />
            <button onClick={addTask}
              className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors">
              + 추가
            </button>
          </div>

          {/* 목표 리스트 */}
          {tasks.length === 0 ? (
            <div className="text-center py-6 text-[#94A3B8] text-xs">
              선언된 오늘 업무 목표가 없습니다.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {tasks.map(task => (
                <div key={task.id}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all ${
                    task.done
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}>
                  <button onClick={() => toggleDone(task.id)}
                    className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                      task.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[#CBD5E1] hover:border-blue-400'
                    }`}>
                    {task.done && <span className="text-xs">✓</span>}
                  </button>

                  <span className={`flex-1 text-sm ${task.done ? 'line-through text-[#94A3B8]' : 'text-[#0F172A]'}`}>
                    {task.title}
                  </span>

                  <button onClick={() => removeTask(task.id)}
                    className="shrink-0 text-[#CBD5E1] hover:text-red-400 transition-colors text-lg leading-none">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 달성도 프로그레스 */}
          {tasks.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-[#94A3B8] mb-1.5">
                <span>오늘의 목표 완료</span>
                <span className="font-bold text-[#475569]">{doneCount}/{tasks.length} ({progressPct}%)</span>
              </div>
              <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          )}
        </div>

      </div>

      <Footer />
    </div>
  )
}
