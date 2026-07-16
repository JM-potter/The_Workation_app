'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/ui/Header'
import Footer from '@/components/ui/Footer'
import { supabase, BYPASS_AUTH } from '@/lib/supabase'

type ProofDoc = {
  id: string
  file_name: string
  file_url: string
  created_at: string
}

export default function MyWorkationPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  
  // 근태 상태
  const [isConnected, setIsConnected] = useState(false)
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [checkInTime, setCheckInTime] = useState<string | null>(null)
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null)
  
  // 증빙 업로드 상태
  const [proofs, setProofs] = useState<ProofDoc[]>([])
  const [uploading, setUploading] = useState(false)

  // 업무 툴 사용량 연동 (Mock)
  const [tools, setTools] = useState([
    { id: 'slack', name: 'Slack', icon: '💬', usageMinutes: 0, lastActive: '-', status: 'disconnected', logs: [] as string[] },
    { id: 'github', name: 'GitHub', icon: '🐙', usageMinutes: 0, lastActive: '-', status: 'disconnected', logs: [] as string[] }
  ])
  
  // OKR & 컨디션 상태
  const [okrGoal, setOkrGoal] = useState('결제 모듈 리팩토링 및 테스트 코드 작성')
  const [okrProgress, setOkrProgress] = useState(65)
  const [condition, setCondition] = useState('😊') // 😊, 😐, 😫

  const [githubUsername, setGithubUsername] = useState('')
  const [githubEvents, setGithubEvents] = useState<any[]>([])
  
  const [slackRole, setSlackRole] = useState('')
  
  const [report, setReport] = useState<string | null>(null)
  const [reportGenerating, setReportGenerating] = useState(false)

  const handleConnectTool = async (id: string) => {
    if (id === 'github') {
      if (!githubUsername) {
        alert('GitHub 닉네임(Username)을 입력해주세요! (이메일 주소 불가)');
        return;
      }
      setTools(prev => prev.map(t => t.id === id ? { ...t, status: 'connecting' } : t))
      
      try {
        const res = await fetch(`https://api.github.com/users/${githubUsername}/events/public`);
        if (!res.ok) throw new Error('GitHub 계정을 찾을 수 없거나 데이터를 불러올 수 없습니다.');
        const data = await res.json();
        
        // 오늘 날짜의 PushEvent, PullRequestEvent 필터링
        const today = new Date().toISOString().split('T')[0];
        const validEvents = data.filter((e: any) => 
          (e.type === 'PushEvent' || e.type === 'PullRequestEvent') && 
          e.created_at.startsWith(today)
        ).slice(0, 10);

        setGithubEvents(validEvents);
        const usageMinutes = validEvents.length * 45; // 1개당 45분 산정

        setTools(prev => prev.map(t => t.id === id ? { 
          ...t, 
          status: 'connected', 
          usageMinutes, 
          lastActive: '방금 전', 
          logs: validEvents.map((e: any) => `[${new Date(e.created_at).toLocaleTimeString('ko-KR', {hour: '2-digit', minute:'2-digit'})}] ${e.type === 'PushEvent' ? '코드 푸시' : 'PR 활동'} (${e.repo.name})`) 
        } : t));
      } catch (e: any) {
        alert(e.message);
        setTools(prev => prev.map(t => t.id === id ? { ...t, status: 'disconnected' } : t));
      }
    } else {
      // 고도화된 슬랙 시뮬레이션 로직
      if (id === 'slack') {
        if (!slackRole) {
          alert('본인의 직무(예: 기획, 개발, 디자인)를 간단히 입력해주세요!');
          return;
        }
        setTools(prev => prev.map(t => t.id === id ? { ...t, status: 'connecting' } : t))
        setTimeout(() => {
          const mockLogs = [
            `[10:00] ${slackRole}팀 주간 회의 스레드 참석`,
            `[13:30] 유관 부서에 업무 진행 상황 공유`,
            `[15:15] 새로운 프로젝트 관련 자료 업로드`
          ]
          setTools(prev => prev.map(t => t.id === id ? { ...t, status: 'connected', usageMinutes: 145, lastActive: '방금 전', logs: mockLogs } : t))
        }, 1500)
      }
    }
  }

  const handleGenerateReport = async () => {
    setReportGenerating(true)
    setReport(null)
    
    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          okrGoal,
          okrProgress,
          condition: condition === '😊' ? '최상' : condition === '😐' ? '보통' : '지침',
          githubUsername,
          githubEvents
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '리포트 생성 실패');
      
      setReport(data.report);
    } catch (e: any) {
      alert(e.message);
      setReport("Gemini API 호출에 실패했습니다. (.env.local 파일에 GEMINI_API_KEY가 있는지 확인해주세요)");
    } finally {
      setReportGenerating(false)
    }
  }

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
  }, [])

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

  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? `${h}시간 ${m}분` : `${m}분`
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />

      <div className="max-w-3xl mx-auto px-6 py-8">
        
        {/* 페이지 타이틀 (토스 스타일 큼직한 타이포그래피) */}
        <div className="mb-10 mt-4">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 tracking-tight leading-tight mb-3">오늘의 워케이션<br/>어떻게 진행되고 있나요?</h1>
          <p className="text-[#64748B] font-semibold text-[15px]">제휴 공간 인증 및 실시간 업무 증빙</p>
        </div>

        {/* 🎯 0. 워케이션 마이크로 OKR 및 컨디션 */}
        <div className="bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] border border-white rounded-[32px] p-8 mb-6 shadow-[0_10px_40px_rgb(0,0,0,0.06)] relative overflow-hidden">
          {/* 장식용 블러 원형 */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h2 className="font-bold text-[20px] text-[#0F172A] flex items-center gap-2">
              <span className="text-2xl drop-shadow-md">🎯</span> 나의 핵심 목표
            </h2>
            <span className="text-[12px] bg-white text-indigo-600 border border-indigo-100 px-3 py-1.5 rounded-full font-extrabold shadow-sm">
              자기 주도 성과
            </span>
          </div>
          
          <div className="mb-8 relative z-10">
            <input 
              type="text" 
              value={okrGoal} 
              onChange={e => setOkrGoal(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-[20px] px-6 py-5 text-[16px] font-bold text-[#0F172A] focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-slate-400 shadow-sm hover:shadow-md"
              placeholder="이번 워케이션의 핵심 목표를 적어주세요"
            />
          </div>

          <div className="mb-10 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <label className="text-[14px] font-bold text-[#475569]">현재 달성률</label>
              <span className="text-[28px] font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 drop-shadow-sm">{okrProgress}%</span>
            </div>
            <input 
              type="range" 
              min="0" max="100" 
              value={okrProgress} 
              onChange={e => setOkrProgress(Number(e.target.value))}
              className="w-full accent-indigo-600 h-3 bg-white border border-slate-200 rounded-full appearance-none cursor-pointer shadow-inner"
            />
          </div>

          <div className="bg-white/80 backdrop-blur-md border border-white rounded-[24px] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm relative z-10">
            <div className="text-[15px] font-bold text-[#334155]">오늘의 컨디션 어떠신가요?</div>
            <div className="flex gap-3">
              {['😊', '😐', '😫'].map(emoji => (
                <button 
                  key={emoji}
                  onClick={() => setCondition(emoji)}
                  className={`w-14 h-14 rounded-2xl text-3xl flex items-center justify-center transition-all duration-300 ${
                    condition === emoji 
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-[0_8px_20px_rgba(99,102,241,0.4)] scale-110 -translate-y-1' 
                      : 'bg-[#F1F5F9] text-slate-400 grayscale hover:grayscale-0 hover:bg-white hover:shadow-md hover:-translate-y-1'
                  }`}
                >
                  <span className={condition === emoji ? 'drop-shadow-md' : ''}>{emoji}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 📶 1. 네트워크 근태 인증 시뮬레이터 */}
        <div className="bg-white rounded-[32px] p-8 mb-6 shadow-[0_10px_40px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-[20px] text-[#0F172A] flex items-center gap-2">
              <span className="text-2xl">📡</span> 실시간 근태 인증 시스템
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#94A3B8] font-medium">데모용 스위치:</span>
              <button 
                onClick={() => {
                  setIsConnected(!isConnected)
                  if (isCheckedIn) setIsCheckedIn(false)
                }}
                className={`text-xs px-4 py-2 rounded-xl font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                  isConnected 
                    ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                }`}
              >
                {isConnected ? '🔌 와이파이 끊기' : '📶 공간 와이파이 연결'}
              </button>
            </div>
          </div>

          {/* 네트워크 상태창 */}
          <div className={`rounded-[20px] p-5 mb-6 border-2 transition-all duration-500 ${
            isConnected 
              ? 'bg-emerald-50/50 border-emerald-100' 
              : 'bg-red-50/50 border-red-100'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-inner ${isConnected ? 'bg-emerald-100' : 'bg-red-100'}`}>
                {isConnected ? '🟢' : '🔴'}
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">현재 네트워크 상태</div>
                <div className={`text-[15px] font-black ${isConnected ? 'text-emerald-600' : 'text-red-500'}`}>
                  {isConnected 
                    ? '인증됨: 홍천 스마트워크센터 IP 접속 중 (WiFi: Workation_Guest_5G)' 
                    : '미인증: 숙소/개인망 접속 중'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* 출퇴근 액션 버튼 */}
          <div className="grid grid-cols-2 gap-5">
            <button
              onClick={handleCheckIn}
              disabled={!isConnected || isCheckedIn}
              className={`py-5 rounded-[20px] text-sm font-bold transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
                isCheckedIn
                  ? 'bg-emerald-50 text-emerald-600 cursor-not-allowed border border-emerald-100'
                  : isConnected
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_8px_20px_rgba(59,130,246,0.4)] hover:shadow-[0_12px_25px_rgba(59,130,246,0.5)] hover:-translate-y-1 active:scale-95'
                    : 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-100'
              }`}
            >
              <span className="text-2xl drop-shadow-sm">🚪</span>
              <span className="font-black text-[15px]">근무 시작 (Check-in)</span>
              {checkInTime && <span className="text-[11px] opacity-90 font-medium">출근 기록: {checkInTime}</span>}
            </button>

            <button
              onClick={handleCheckOut}
              disabled={!isCheckedIn}
              className={`py-5 rounded-[20px] text-sm font-bold transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
                isCheckedIn
                  ? 'bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-[0_8px_20px_rgba(244,63,94,0.4)] hover:shadow-[0_12px_25px_rgba(244,63,94,0.5)] hover:-translate-y-1 active:scale-95'
                  : 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-100'
              }`}
            >
              <span className="text-2xl drop-shadow-sm">🏃</span>
              <span className="font-black text-[15px]">근무 종료 (Check-out)</span>
              {checkOutTime && <span className="text-[11px] opacity-90 font-medium">퇴근 기록: {checkOutTime}</span>}
            </button>
          </div>

          {!isConnected && (
            <div className="mt-5 text-center bg-red-50/50 text-red-500 py-3 rounded-xl text-[12px] font-bold">
              ⚠️ 제휴 공간 전용 와이파이망(예: 홍천 스마트워크센터)에 연결되어야 버튼이 활성화됩니다.
            </div>
          )}
          {isCheckedIn && (
            <div className="mt-5 text-center bg-emerald-50/50 text-emerald-600 py-3 rounded-xl text-[12px] font-bold animate-pulse">
              🟢 현재 정상 근무 중으로 기록되고 있습니다. 업무를 마치면 근무 종료를 눌러주세요.
            </div>
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

        {/* 📊 3. 업무 툴 연동 현황 */}
        <div className="bg-white rounded-[24px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-[19px] text-[#191F28]">실시간 업무 툴 연동</h2>
              <div className="flex items-center gap-1 bg-[#F2F4F6] text-[#4E5968] px-2.5 py-1 rounded-full text-[12px] font-bold">
                <span className="text-[14px]">🔒</span> 보안 연동 (Metadata Only)
              </div>
            </div>
            <span className="text-[12px] bg-[#E8F3FF] text-[#3182F6] px-3 py-1 rounded-full font-bold">
              Real-time API
            </span>
          </div>
          <p className="text-[14px] text-[#8B95A1] mb-6">
            사내 메시지 내용이나 소스 코드는 <strong className="text-[#F04452]">절대 수집되지 않으며</strong>, 오직 활동 시간 정보만 안전하게 측정합니다.
          </p>
          
          <div className="grid gap-4 mb-6">
            {tools.map(tool => (
              <div key={tool.id} className="bg-[#F9FAFB] rounded-[20px] p-5 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)]">
                      {tool.icon}
                    </div>
                    <div>
                      <div className="font-bold text-[16px] text-[#191F28] flex items-center gap-2">
                        {tool.name}
                        {tool.status === 'connected' && <span className="w-2 h-2 rounded-full bg-[#00C85A] animate-pulse" />}
                      </div>
                      <div className="text-[13px] text-[#8B95A1] mt-0.5">
                        {tool.status === 'disconnected' ? '연동되지 않음' : tool.status === 'connecting' ? '연동 중...' : `최근 업데이트: ${tool.lastActive}`}
                      </div>
                    </div>
                  </div>
                  <div>
                    {tool.status === 'disconnected' ? (
                      <div className="flex items-center gap-2">
                        {tool.id === 'github' && (
                          <input 
                            type="text" 
                            placeholder="GitHub 닉네임 (Username)" 
                            value={githubUsername}
                            onChange={e => setGithubUsername(e.target.value)}
                            className="bg-white border-none rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-[#3182F6] shadow-sm w-32"
                          />
                        )}
                        {tool.id === 'slack' && (
                          <input 
                            type="text" 
                            placeholder="직무 (예: 기획)" 
                            value={slackRole}
                            onChange={e => setSlackRole(e.target.value)}
                            className="bg-white border-none rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-[#3182F6] shadow-sm w-32"
                          />
                        )}
                        <button onClick={() => handleConnectTool(tool.id)} className="text-[14px] font-bold bg-[#3182F6] text-white px-4 py-2 rounded-xl hover:bg-[#1B64DA] transition-all shadow-sm">
                          연동하기
                        </button>
                      </div>
                    ) : tool.status === 'connecting' ? (
                      <div className="w-6 h-6 border-3 border-[#3182F6] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <div className="text-right">
                        <div className="text-xl font-black text-[#191F28] tracking-tight">{formatMinutes(tool.usageMinutes)}</div>
                        <div className="text-[12px] text-[#8B95A1] font-medium mt-0.5">오늘 자동 측정된 시간</div>
                      </div>
                    )}
                  </div>
                </div>
                {tool.status === 'connected' && tool.logs.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 mt-3 shadow-sm border border-[#F2F4F6]">
                    <div className="font-bold text-[#333D4B] text-[13px] mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#3182F6] rounded-full"></span> 
                      오늘의 활동 (최신순)
                    </div>
                    <ul className="space-y-1.5">
                      {tool.logs.map((log, i) => <li key={i} className="text-[13px] text-[#4E5968] truncate">{log}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-8 mt-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[20px] text-[#0F172A] flex items-center gap-2">
                <span className="text-2xl">🤖</span> AI Daily Reporter
              </h3>
              <button 
                onClick={handleGenerateReport}
                disabled={reportGenerating || !tools.some(t => t.status === 'connected')}
                className={`text-[15px] font-bold px-6 py-3 rounded-full transition-all duration-300 ${
                  tools.some(t => t.status === 'connected')
                    ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-[0_8px_20px_rgba(168,85,247,0.4)] hover:shadow-[0_12px_25px_rgba(168,85,247,0.6)] hover:-translate-y-1 active:scale-95'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {reportGenerating ? 'AI가 요약 중이에요...' : '오늘의 성과 요약하기 ✨'}
              </button>
            </div>
            {reportGenerating && (
              <div className="flex items-center justify-center p-10 border border-purple-100 rounded-[24px] bg-gradient-to-br from-purple-50/50 to-indigo-50/50">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin shadow-sm" />
                  <span className="text-[15px] font-bold text-purple-700 animate-pulse">Gemini AI가 진짜 깃허브 데이터를 분석하고 있습니다...</span>
                </div>
              </div>
            )}
            {report && (
              <div className="bg-gradient-to-br from-[#F4F1FD] to-[#EEF2FF] border border-indigo-100 rounded-[28px] p-8 shadow-[0_10px_30px_rgb(0,0,0,0.03)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400" />
                <div className="flex gap-2 mb-4">
                  <span className="text-2xl drop-shadow-sm">✨</span>
                  <div className="font-bold text-[18px] text-[#4B309B]">Gemini 종합 성과 리포트 (수정 가능)</div>
                </div>
                <textarea 
                  className="w-full text-[16px] text-[#334155] bg-white/80 backdrop-blur-sm border border-indigo-100 rounded-[20px] p-6 leading-relaxed min-h-[220px] focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-400 focus:bg-white resize-y shadow-inner transition-all"
                  value={report}
                  onChange={e => setReport(e.target.value)}
                />
                <div className="mt-5 flex justify-end">
                  <button onClick={() => alert("✅ HR 담당자 대시보드로 보고서가 제출되었습니다.")} className="text-[15px] bg-slate-800 text-white font-bold px-6 py-3.5 rounded-full hover:bg-slate-900 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    HR 대시보드로 최종 제출
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      <Footer />
    </div>
  )
}
