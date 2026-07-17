'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
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

  const [tools, setTools] = useState([
    { id: 'slack', name: 'Slack', icon: '💬', usageMinutes: 0, lastActive: '-', status: 'disconnected', logs: [] as string[] },
    { id: 'github', name: 'GitHub', icon: '🐙', usageMinutes: 0, lastActive: '-', status: 'disconnected', logs: [] as string[] },
    { id: 'notion', name: 'Notion', icon: '📓', usageMinutes: 0, lastActive: '-', status: 'disconnected', logs: [] as string[] }
  ])
  


  const [condition, setCondition] = useState('😊') // 😊, 😐, 😫

  const [githubUsername, setGithubUsername] = useState('')
  const [githubEvents, setGithubEvents] = useState<any[]>([])
  
  const [report, setReport] = useState<string | null>(null)
  const [reportGenerating, setReportGenerating] = useState(false)

  // 노션, 슬랙 실시간 체류 시간 측정(Polling)용 상태
  const [notionToken, setNotionToken] = useState<string | null>(null)
  const [notionPagesState, setNotionPagesState] = useState<any[]>([])
  const [slackToken, setSlackToken] = useState<string | null>(null)

  // 예약 시 설정한 워케이션 목표 상태
  const [workationGoals, setWorkationGoals] = useState<string[]>([])

  const fetchNotionData = async (token: string, isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setTools(prev => prev.map(t => t.id === 'notion' ? { ...t, status: 'connecting' } : t));
      }

      const res = await fetch('/api/notion/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() })
      });
      
      if (!res.ok) throw new Error('Failed to fetch Notion activity');
      const data = await res.json();
      
      if (data.pages && data.pages.length > 0) {
        setNotionPagesState(prevPages => {
          let additionalMinutes = 0;
          const isInitialLoad = prevPages.length === 0;

          if (isInitialLoad) {
            additionalMinutes = data.pages.length * 5; // 최초 연동 시 문서당 기본 5분 부여
          } else {
            // 변경된(최근 수정 시간이 더 최신인) 문서 찾기
            data.pages.forEach((newPage: any) => {
              const oldPage = prevPages.find(p => p.id === newPage.id);
              if (!oldPage || new Date(newPage.last_edited_time) > new Date(oldPage.last_edited_time)) {
                additionalMinutes += 1; // 수정 감지 시 1분(또는 지정된 갱신주기) 추가
              }
            });
          }

          setTools(prevTools => prevTools.map(t => t.id === 'notion' ? {
            ...t,
            status: 'connected',
            usageMinutes: t.usageMinutes + additionalMinutes,
            lastActive: '방금 전',
            logs: data.pages.map((p: any) => `[${new Date(p.last_edited_time).toLocaleTimeString('ko-KR', {hour: '2-digit', minute:'2-digit'})}] 수정: ${p.title}`)
          } : t));

          return data.pages; // 새로운 페이지 상태로 업데이트
        });
      } else {
        if (isManualRefresh) {
          setTools(prev => prev.map(t => t.id === 'notion' ? { ...t, status: 'connected' } : t));
        }
      }
    } catch (error) {
      console.error(error);
      if (isManualRefresh) alert('노션 데이터를 갱신하는데 실패했습니다.');
    }
  }

  const fetchSlackData = async (token: string, isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setTools(prev => prev.map(t => t.id === 'slack' ? { ...t, status: 'connecting' } : t));
      }
      const res = await fetch('/api/slack/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() })
      });
      if (!res.ok) throw new Error('Failed to fetch Slack activity');
      const data = await res.json();
      
      if (data.logs && data.logs.length > 0) {
        setTools(prevTools => prevTools.map(t => t.id === 'slack' ? {
          ...t,
          status: 'connected',
          usageMinutes: data.logs.length * 3, // 메시지 1건당 집중 시간 3분으로 가정
          lastActive: '방금 전',
          logs: data.logs
        } : t));
      } else {
        if (isManualRefresh) {
          setTools(prev => prev.map(t => t.id === 'slack' ? { ...t, status: 'connected', logs: ['오늘의 활동 내역이 없습니다.'] } : t));
        }
      }
    } catch (error) {
      console.error(error);
      if (isManualRefresh) alert('슬랙 데이터를 갱신하는데 실패했습니다.');
    }
  }

  // 1분마다 노션/슬랙 백그라운드 Polling
  useEffect(() => {
    const interval = setInterval(() => {
      if (notionToken) fetchNotionData(notionToken, false);
      if (slackToken) fetchSlackData(slackToken, false);
    }, 60000); // 1분
    return () => clearInterval(interval);
  }, [notionToken, slackToken]);

  const handleNotionConnect = async () => {
    // 1. 노션 OAuth 공식 팝업 열기 (정식 런칭 모드)
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const popup = window.open(
      '/api/auth/notion',
      'Notion Auth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // 2. 팝업(callback 라우트)에서 보내는 비밀 메시지 수신 대기
    const messageListener = async (event: MessageEvent) => {
      if (event.data?.type === 'NOTION_AUTH_SUCCESS') {
        const token = event.data.token;
        window.removeEventListener('message', messageListener);
        
        // 3. 토큰을 저장하고 실시간 추적 엔진 가동
        setNotionToken(token.trim());
        await fetchNotionData(token.trim(), true);
      }
    };
    
    window.addEventListener('message', messageListener);
  }

  const handleSlackConnect = async () => {
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    window.open(
      '/api/auth/slack',
      'Slack Auth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    const messageListener = async (event: MessageEvent) => {
      if (event.data?.type === 'SLACK_AUTH_SUCCESS') {
        const token = event.data.token;
        window.removeEventListener('message', messageListener);
        
        setSlackToken(token.trim());
        await fetchSlackData(token.trim(), true);
      }
    };
    
    window.addEventListener('message', messageListener);
  }

  const handleConnectTool = async (toolId: string) => {
    if (toolId === 'notion') {
      handleNotionConnect();
      return;
    }

    // 깃허브 실제 연동 로직
    if (toolId === 'github') {
      if (!githubUsername) {
        alert('GitHub 닉네임(Username)을 입력해주세요! (이메일 주소 불가)');
        return;
      }
      setTools(prev => prev.map(t => t.id === toolId ? { ...t, status: 'connecting' } : t))
      
      try {
        const res = await fetch(`https://api.github.com/users/${githubUsername}/events/public`);
        if (!res.ok) throw new Error('GitHub 계정을 찾을 수 없거나 데이터를 불러올 수 없습니다.');
        const data = await res.json();
        
        // 오늘 날짜의 모든 이벤트 시간순 정렬
        const today = new Date().toISOString().split('T')[0];
        const validEvents = data.filter((e: any) => e.created_at.startsWith(today))
          .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        let usageMinutes = 0;
        if (validEvents.length > 0) {
          usageMinutes += 60; // 첫 커밋/활동에 대한 기본 업무 시간(컨텍스트 타임) 1시간 부여
          
          for (let i = 1; i < validEvents.length; i++) {
            const diffMs = new Date(validEvents[i].created_at).getTime() - new Date(validEvents[i-1].created_at).getTime();
            const diffMins = Math.floor(diffMs / (1000 * 60));
            
            if (diffMins <= 120) {
              // 이벤트 간격이 2시간 이내면 연속된 업무 세션으로 간주하여 실제 시간차(분) 합산
              usageMinutes += diffMins;
            } else {
              // 이벤트 간격이 2시간 초과면 새로운 업무 세션으로 간주하고 기본 60분 다시 부여
              usageMinutes += 60;
            }
          }
        }

        // 최신순 출력을 위해 다시 역순 정렬 (최대 10개)
        const displayEvents = [...validEvents].reverse().slice(0, 10);
        setGithubEvents(displayEvents);

        setTools(prev => prev.map(t => t.id === toolId ? { 
          ...t, 
          status: 'connected', 
          usageMinutes, 
          lastActive: displayEvents.length > 0 ? '방금 전' : '-', 
          logs: displayEvents.map((e: any) => `[${new Date(e.created_at).toLocaleTimeString('ko-KR', {hour: '2-digit', minute:'2-digit'})}] ${e.type === 'PushEvent' ? '코드 푸시' : e.type === 'PullRequestEvent' ? 'PR 활동' : '기타 활동'} (${e.repo.name})`) 
        } : t));
      } catch (e: any) {
        alert(e.message);
        setTools(prev => prev.map(t => t.id === toolId ? { ...t, status: 'disconnected' } : t));
      }
    } else if (toolId === 'slack') {
      handleSlackConnect();
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
          workationGoals,
          notionLogs: tools.find(t => t.id === 'notion')?.logs || [],
          slackLogs: tools.find(t => t.id === 'slack')?.logs || [],
          condition: condition === '😊' ? '최상' : condition === '😐' ? '보통' : '지침',
          githubUsername,
          githubEvents
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.details ? `${data.error} (${data.details})` : (data.error || '리포트 생성 실패');
        throw new Error(errorMsg);
      }
      
      setReport(data.report);
    } catch (e: any) {
      alert(e.message);
      setReport(`Gemini API 호출에 실패했습니다.\n\n[상세 에러 내용]\n${e.message}\n\n* Vercel 환경 변수(GEMINI_API_KEY) 설정 후 'Redeploy'를 했는지 확인해주세요.\n* Vercel Logs 탭에서 더 자세한 서버 로그를 확인할 수 있습니다.`);
    } finally {
      setReportGenerating(false)
    }
  }

  const handleSubmitReport = async () => {
    if (!report) return;
    
    const githubMins = tools.find(t => t.id === 'github')?.usageMinutes || 0;
    
    const { error } = await supabase.from('ai_reports').insert({
      user_id: userId,
      github_id: githubUsername,
      report_text: report,
      github_minutes: githubMins
    });
    
    if (error) {
      alert("리포트 저장 실패: " + error.message);
      return;
    }
    
    alert("✅ HR 담당자 대시보드로 보고서가 제출되었습니다.");
    router.push('/dashboard/report');
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

      // 예약 시 설정한 워케이션 목표 불러오기 (로컬 스토리지)
      try {
        const storedGoals = localStorage.getItem('workation_goals');
        if (storedGoals) {
          setWorkationGoals(JSON.parse(storedGoals));
        }
      } catch (e) {
        console.error('Failed to parse workation_goals', e);
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
        <div className="mb-8 mt-4">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 tracking-tight leading-tight mb-3">오늘의 워케이션<br/>어떻게 진행되고 있나요?</h1>
          <p className="text-[#64748B] font-semibold text-[15px]">제휴 공간 인증 및 실시간 업무 증빙</p>
        </div>

        {/* 🎯 이번 워케이션의 핵심 목표 (예약 시 설정) */}
        {workationGoals.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-[24px] p-6 mb-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 rounded-l-[24px]"></div>
            <h2 className="font-bold text-[17px] text-blue-900 flex items-center gap-2 mb-3">
              <span className="text-xl drop-shadow-sm">🚩</span> 예약 시 설정한 '나의 워케이션 목표'
            </h2>
            <ul className="space-y-2">
              {workationGoals.map((goal, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-[15px] font-medium text-blue-800 leading-relaxed">{goal}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 🎯 오늘의 컨디션 체크 */}
        <div className="bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] border border-white rounded-[32px] p-8 mb-6 shadow-[0_10px_40px_rgb(0,0,0,0.06)] relative overflow-hidden">
          {/* 장식용 블러 원형 */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="bg-white/80 backdrop-blur-md border border-white rounded-[24px] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm relative z-10">
            <div className="text-[15px] font-bold text-[#334155] flex items-center gap-2">
              <span className="text-xl">🌡️</span> 오늘의 컨디션 어떠신가요?
            </div>
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
                        <button onClick={() => handleConnectTool(tool.id)} className="text-[14px] font-bold bg-[#3182F6] text-white px-4 py-2 rounded-xl hover:bg-[#1B64DA] transition-all shadow-sm">
                          연동하기
                        </button>
                      </div>
                    ) : tool.status === 'connecting' ? (
                      <div className="w-6 h-6 border-3 border-[#3182F6] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xl font-black text-[#191F28] tracking-tight">{formatMinutes(tool.usageMinutes)}</div>
                          <div className="text-[12px] text-[#8B95A1] font-medium mt-0.5">오늘 자동 측정된 시간</div>
                        </div>
                        {(tool.id === 'notion' || tool.id === 'slack') && (
                          <button 
                            onClick={() => {
                              if (tool.id === 'notion' && notionToken) fetchNotionData(notionToken, true)
                              if (tool.id === 'slack' && slackToken) fetchSlackData(slackToken, true)
                            }}
                            className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center group"
                            title="즉시 최신화 (새치기 갱신)"
                          >
                            <span className="text-lg group-active:rotate-180 transition-transform duration-300">🔄</span>
                          </button>
                        )}
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
                  <button onClick={handleSubmitReport} className="text-[15px] bg-slate-800 text-white font-bold px-6 py-3.5 rounded-full hover:bg-slate-900 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    HR 대시보드로 최종 제출
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 🖨️ 4. B2C 지자체 지원금 결과보고서 (개인 사비 결제자용) */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 mt-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-black text-base text-[#0F172A]">🧾 개인 지원금 신청용 서류 출력</h2>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                B2C 개인 결제자 전용
              </span>
            </div>
            <p className="text-xs text-[#94A3B8]">개인 사비로 결제하신 경우, 지자체에 제출할 [결제+증빙] 통합 서류를 한 번에 렌더링합니다.</p>
          </div>
          <Link href={`/dashboard/subsidy-report?user=${encodeURIComponent(userName)}`} target="_blank">
            <button className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm whitespace-nowrap">
              결과보고서 PDF 렌더링
            </button>
          </Link>
        </div>

      </div>

      <Footer />
    </div>
  )
}
