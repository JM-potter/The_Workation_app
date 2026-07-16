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

  const [report, setReport] = useState<string | null>(null)
  const [reportGenerating, setReportGenerating] = useState(false)

  const handleConnectTool = (id: string) => {
    setTools(prev => prev.map(t => t.id === id ? { ...t, status: 'connecting' } : t))
    setTimeout(() => {
      setTools(prev => prev.map(t => {
        if (t.id === id) {
          if (id === 'slack') {
            return { ...t, status: 'connected', usageMinutes: 145, lastActive: '방금 전', logs: ['[10:00] 디자인팀 채널에 메시지 전송', '[11:30] 기획 회의 스레드 응답', '[14:15] 새로운 팀원 환영 인사'] }
          }
          if (id === 'github') {
            return { ...t, status: 'connected', usageMinutes: 210, lastActive: '방금 전', logs: ['[09:30] feat/dashboard 브랜치 커밋', '[13:00] PR #42 리뷰 완료', '[15:45] 버그 픽스 커밋 푸시'] }
          }
        }
        return t
      }))
    }, 1500)
  }

  const handleGenerateReport = () => {
    setReportGenerating(true)
    setReport(null)
    setTimeout(() => {
      setReportGenerating(false)
      const conditionText = condition === '😊' ? '매우 좋음' : condition === '😐' ? '보통' : '주의(지침)';
      setReport(`🎯 워케이션 핵심 목표: [${okrGoal}]\n▶ 현재 달성률: ${okrProgress}%\n\n📊 업무 툴(SaaS) 활동 내역:\n- Slack: 기획/디자인팀과 주요 커뮤니케이션 3건 (145분)\n- GitHub: 대시보드 기능 구현 및 PR 리뷰 등 개발 기여 3건 (210분)\n▶ 총 355분의 높은 딥워크(Deep Work) 시간 기록.\n\n🔋 번아웃 회복 지수 (오늘의 컨디션): ${conditionText}\n- 성공적이고 몰입도 높은 워케이션을 진행 중입니다.`)
    }, 2000)
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
        
        {/* 페이지 타이틀 */}
        <div className="mb-8">
          <div className="text-xs text-[#94A3B8] mb-2">
            <Link href="/my" className="hover:text-blue-500 transition-colors">← 마이페이지로</Link>
          </div>
          <h1 className="text-2xl font-black text-[#0F172A] mb-1">📶 마이 워케이션</h1>
          <p className="text-sm text-[#475569]">제휴 공간 전용 와이파이 근태 인증 및 업무 증빙</p>
        </div>

        {/* 🎯 0. 워케이션 마이크로 OKR 및 컨디션 */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-base text-[#0F172A]">🎯 워케이션 마이크로 OKR</h2>
            <span className="text-[10px] bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full border border-blue-500/20 font-bold">
              자기 주도 성과
            </span>
          </div>
          
          <div className="mb-5">
            <label className="text-xs font-bold text-[#475569] block mb-1">이번 워케이션의 핵심 목표</label>
            <input 
              type="text" 
              value={okrGoal} 
              onChange={e => setOkrGoal(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm font-semibold text-[#0F172A] focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#475569] block">현재 목표 달성률</label>
              <span className="text-sm font-black text-blue-600">{okrProgress}%</span>
            </div>
            <input 
              type="range" 
              min="0" max="100" 
              value={okrProgress} 
              onChange={e => setOkrProgress(Number(e.target.value))}
              className="w-full accent-blue-600 h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="border-t border-[#F1F5F9] pt-4 flex items-center justify-between">
            <div className="text-xs font-bold text-[#475569]">오늘의 컨디션 (번아웃 체크)</div>
            <div className="flex gap-2">
              {['😊', '😐', '😫'].map(emoji => (
                <button 
                  key={emoji}
                  onClick={() => setCondition(emoji)}
                  className={`w-10 h-10 rounded-full text-xl flex items-center justify-center transition-all ${
                    condition === emoji 
                      ? 'bg-blue-100 border-2 border-blue-500 shadow-sm scale-110' 
                      : 'bg-[#F8FAFC] border border-[#E2E8F0] grayscale opacity-60 hover:grayscale-0 hover:opacity-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
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

        {/* 📊 3. 업무 툴 연동 현황 */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-black text-base text-[#0F172A]">📊 실시간 업무 툴 연동 현황</h2>
            <span className="text-[10px] bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-full border border-purple-500/20 font-bold">
              자율 성과 증빙
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] mb-5">업무 툴(Slack, GitHub)을 연동하여 나의 성과를 비침해적으로 증명하세요.</p>
          
          <div className="grid gap-3 mb-5">
            {tools.map(tool => (
              <div key={tool.id} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg border border-[#E2E8F0] flex items-center justify-center text-xl shadow-sm">
                      {tool.icon}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
                        {tool.name}
                        {tool.status === 'connected' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                      </div>
                      <div className="text-[10px] text-[#94A3B8] mt-0.5">
                        {tool.status === 'disconnected' ? '연동되지 않음' : tool.status === 'connecting' ? '연동 중...' : `마지막 활동: ${tool.lastActive}`}
                      </div>
                    </div>
                  </div>
                  <div>
                    {tool.status === 'disconnected' ? (
                      <button onClick={() => handleConnectTool(tool.id)} className="text-xs font-bold bg-white border border-[#E2E8F0] px-3 py-1.5 rounded-lg hover:border-blue-400 hover:text-blue-500 transition-all">
                        연동하기
                      </button>
                    ) : tool.status === 'connecting' ? (
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <div className="text-right">
                        <div className="text-sm font-black text-[#0F172A]">{formatMinutes(tool.usageMinutes)}</div>
                        <div className="text-[10px] text-[#94A3B8]">오늘 누적 사용량</div>
                      </div>
                    )}
                  </div>
                </div>
                {tool.status === 'connected' && tool.logs.length > 0 && (
                  <div className="bg-white rounded-lg border border-[#E2E8F0] p-3 text-xs text-[#475569]">
                    <div className="font-bold text-[#0F172A] mb-1.5 border-b border-[#F1F5F9] pb-1">오늘의 활동 로그</div>
                    <ul className="space-y-1">
                      {tool.logs.map((log, i) => <li key={i}>• {log}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-[#F1F5F9] pt-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-sm text-[#0F172A]">🤖 AI Daily Reporter</h3>
              <button 
                onClick={handleGenerateReport}
                disabled={reportGenerating || !tools.some(t => t.status === 'connected')}
                className={`text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-sm ${
                  tools.some(t => t.status === 'connected')
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                    : 'bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed'
                }`}
              >
                {reportGenerating ? 'AI 요약 중...' : '오늘의 일지 자동 생성 ✨'}
              </button>
            </div>
            {reportGenerating && (
              <div className="flex items-center justify-center p-6 border border-[#E2E8F0] rounded-xl bg-[#F8FAFC]">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold text-indigo-500">LLM이 활동 로그를 분석하고 있습니다...</span>
                </div>
              </div>
            )}
            {report && (
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                <div className="flex gap-2 mb-2">
                  <span className="text-lg">✨</span>
                  <div className="font-bold text-sm text-indigo-900">AI 종합 워케이션 성과 리포트 (수정 가능)</div>
                </div>
                <textarea 
                  className="w-full text-sm text-indigo-900 bg-white border border-indigo-100 rounded-lg p-3 leading-relaxed min-h-[180px] focus:outline-none focus:border-indigo-400 resize-y"
                  value={report}
                  onChange={e => setReport(e.target.value)}
                />
                <div className="mt-3 flex justify-end">
                  <button onClick={() => alert("✅ HR 담당자 대시보드로 보고서가 제출되었습니다.")} className="text-xs bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold px-4 py-2 rounded-lg hover:shadow-md transition-all">
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
