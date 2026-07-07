'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Header from '@/components/ui/Header'
import Footer from '@/components/ui/Footer'

const WORK_SEC  = 25 * 60
const BREAK_SEC =  5 * 60
const IDLE_SEC  = 10 * 60
const GOAL_POMODOROS = 4

type Task = {
  id: string
  title: string
  done: boolean
  focusSecs: number
}

function todayKey() {
  return `wk-focus-${new Date().toISOString().slice(0, 10)}`
}

function loadTasks(): Task[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(todayKey()) ?? '[]') } catch { return [] }
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(todayKey(), JSON.stringify(tasks))
}

export default function FocusPage() {
  const [tasks,        setTasks]        = useState<Task[]>([])
  const [newTitle,     setNewTitle]     = useState('')
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [phase,        setPhase]        = useState<'work' | 'break'>('work')
  const [remaining,    setRemaining]    = useState(WORK_SEC)
  const [running,      setRunning]      = useState(false)
  const [pomoDone,     setPomoDone]     = useState(0)
  const [idleWarn,     setIdleWarn]     = useState(false)
  const [alibi,        setAlibi]        = useState(false)

  // 상용화 연동 기능 시뮬레이션용 상태 추가
  const [gpsCheckedIn, setGpsCheckedIn] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [slackSync, setSlackSync] = useState(true)
  const [slackTestTriggered, setSlackTestTriggered] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)

  const intervalRef  = useRef<NodeJS.Timeout | null>(null)
  const idleRef      = useRef<NodeJS.Timeout | null>(null)
  const runningRef   = useRef(false)
  runningRef.current = running

  // localStorage 초기 로드
  useEffect(() => { setTasks(loadTasks()) }, [])

  // 태스크 저장
  useEffect(() => { if (tasks.length > 0) saveTasks(tasks) }, [tasks])

  // 알리바이 체크
  useEffect(() => {
    const allDone  = tasks.length > 0 && tasks.every(t => t.done)
    const goalMet  = pomoDone >= GOAL_POMODOROS
    setAlibi(allDone && goalMet)
  }, [tasks, pomoDone])

  // 유휴 감지
  const resetIdle = useCallback(() => {
    setIdleWarn(false)
    if (idleRef.current) clearTimeout(idleRef.current)
    if (runningRef.current) {
      idleRef.current = setTimeout(() => {
        setRunning(false)
        setIdleWarn(true)
      }, IDLE_SEC * 1000)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', resetIdle)
    window.addEventListener('keydown',   resetIdle)
    return () => {
      window.removeEventListener('mousemove', resetIdle)
      window.removeEventListener('keydown',   resetIdle)
      if (idleRef.current) clearTimeout(idleRef.current)
    }
  }, [resetIdle])

  // 타이머 틱
  useEffect(() => {
    if (running) {
      resetIdle()
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            // 사이클 전환
            setPhase(p => {
              if (p === 'work') {
                setPomoDone(d => d + 1)
                // 완료된 태스크에 집중 시간 기록
                setActiveTaskId(id => {
                  if (id) setTasks(ts => ts.map(t => t.id === id ? { ...t, focusSecs: t.focusSecs + WORK_SEC } : t))
                  return id
                })
                setRemaining(BREAK_SEC)
                return 'break'
              } else {
                setRemaining(WORK_SEC)
                return 'work'
              }
            })
            return 0
          }
          if (phase === 'work' && activeTaskId) {
            setTasks(ts => ts.map(t => t.id === activeTaskId ? { ...t, focusSecs: t.focusSecs + 1 } : t))
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (idleRef.current) clearTimeout(idleRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, activeTaskId, resetIdle])

  function addTask() {
    const title = newTitle.trim()
    if (!title) return
    const t: Task = { id: Date.now().toString(), title, done: false, focusSecs: 0 }
    setTasks(prev => { const next = [...prev, t]; saveTasks(next); return next })
    setNewTitle('')
  }

  function toggleDone(id: string) {
    setTasks(ts => { const next = ts.map(t => t.id === id ? { ...t, done: !t.done } : t); saveTasks(next); return next })
  }

  function removeTask(id: string) {
    if (activeTaskId === id) { setRunning(false); setActiveTaskId(null) }
    setTasks(ts => { const next = ts.filter(t => t.id !== id); saveTasks(next); return next })
  }

  function startFocus(id: string) {
    if (running && activeTaskId === id) { setRunning(false); return }
    setActiveTaskId(id)
    setPhase('work')
    setRemaining(WORK_SEC)
    setRunning(true)
    setIdleWarn(false)
  }

  function toggleTimer() {
    if (!activeTaskId) return
    setRunning(r => !r)
    setIdleWarn(false)
  }

  function resetTimer() {
    setRunning(false)
    setPhase('work')
    setRemaining(WORK_SEC)
    setIdleWarn(false)
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  const activeTask   = tasks.find(t => t.id === activeTaskId)
  const doneCount    = tasks.filter(t => t.done).length
  const checkPct     = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0
  const totalFocusMins = Math.floor(tasks.reduce((s, t) => s + t.focusSecs, 0) / 60)
  const circumference = 2 * Math.PI * 54
  const progress = phase === 'work'
    ? ((WORK_SEC - remaining) / WORK_SEC) * circumference
    : ((BREAK_SEC - remaining) / BREAK_SEC) * circumference

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />

      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* 알리바이 배너 */}
        {alibi && (
          <div className="mb-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-lg">
            <span className="text-3xl">🏖️</span>
            <div>
              <div className="text-white font-black text-lg">알리바이 획득!</div>
              <div className="text-emerald-100 text-sm">오늘 목표를 모두 달성했어요. 지금부터는 진짜 휴식 시간입니다.</div>
            </div>
            <div className="ml-auto text-5xl">✅</div>
          </div>
        )}

        {/* 오늘의 목표 선언 */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-black text-lg">📋 오늘의 목표 선언</h2>
            <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full border border-blue-500/20">
              {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] mb-4">오늘 완료할 마이크로 산출물을 쪼개서 선언하세요</p>

          {/* 입력 */}
          <div className="flex gap-2 mb-4">
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder="예: 기획서 3페이지 초안 완성"
              className="flex-1 text-sm border border-[#E2E8F0] rounded-xl px-4 py-2.5 outline-none focus:border-blue-400 transition-colors"
            />
            <button onClick={addTask}
              className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors">
              + 추가
            </button>
          </div>

          {/* 체크리스트 */}
          {tasks.length === 0 ? (
            <div className="text-center py-6 text-[#94A3B8] text-sm">
              오늘의 할 일을 선언해주세요
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {tasks.map(task => (
                <div key={task.id}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all ${
                    task.done
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : activeTaskId === task.id && running
                        ? 'bg-blue-500/5 border-blue-400/40'
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

                  {task.focusSecs > 0 && (
                    <span className="text-xs text-blue-400 font-medium shrink-0">
                      🍅 {Math.floor(task.focusSecs / 60)}분
                    </span>
                  )}

                  {!task.done && (
                    <button
                      onClick={() => startFocus(task.id)}
                      className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                        activeTaskId === task.id && running
                          ? 'bg-amber-500/20 text-amber-600 hover:bg-amber-500/30'
                          : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'
                      }`}>
                      {activeTaskId === task.id && running ? '⏸ 일시정지' : '🍅 집중 시작'}
                    </button>
                  )}

                  <button onClick={() => removeTask(task.id)}
                    className="shrink-0 text-[#CBD5E1] hover:text-red-400 transition-colors text-lg leading-none">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 진행률 */}
          {tasks.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-[#94A3B8] mb-1.5">
                <span>체크리스트 달성률</span>
                <span className="font-bold text-[#475569]">{doneCount}/{tasks.length} ({checkPct}%)</span>
              </div>
              <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${checkPct}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* 뽀모도로 타이머 */}
        <div className={`rounded-2xl p-6 mb-6 transition-all ${
          phase === 'work'
            ? 'bg-gradient-to-br from-[#1e3a8a] via-[#1d4ed8] to-[#7c3aed]'
            : 'bg-gradient-to-br from-emerald-600 to-teal-600'
        }`}>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xl">{phase === 'work' ? '🍅' : '☕'}</span>
            <h2 className="font-black text-lg text-white">집중 모드</h2>
            <span className="text-xs bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/30">
              {phase === 'work' ? '딥워크 25분' : '휴식 5분'}
            </span>
            {idleWarn && (
              <span className="ml-auto text-xs bg-amber-400/20 text-amber-200 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                ⚠️ 유휴 감지 — 타이머 일시정지됨
              </span>
            )}
          </div>

          <div className="flex items-center gap-8">
            {/* 원형 타이머 */}
            <div className="relative">
              <svg width="128" height="128" className="-rotate-90">
                <circle cx="64" cy="64" r="54" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
                <circle cx="64" cy="64" r="54" fill="none"
                  stroke={phase === 'work' ? '#93c5fd' : '#6ee7b7'}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - progress}
                  strokeLinecap="round"
                  className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-black text-white tabular-nums">{mm}:{ss}</span>
              </div>
            </div>

            {/* 오른쪽 정보 */}
            <div className="flex-1">
              <div className="text-blue-200 text-xs mb-1">현재 집중 태스크</div>
              <div className={`font-bold text-base mb-4 ${activeTask ? 'text-white' : 'text-white/40'}`}>
                {activeTask ? activeTask.title : '태스크를 선택해주세요'}
              </div>

              <div className="flex gap-2 mb-4">
                <button onClick={toggleTimer} disabled={!activeTaskId}
                  className="px-5 py-2 bg-white/20 hover:bg-white/30 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all border border-white/20">
                  {running ? '⏸ 일시정지' : '▶ 시작'}
                </button>
                <button onClick={resetTimer}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-xl transition-all border border-white/20">
                  ↺ 리셋
                </button>
              </div>

              {/* 뽀모도로 카운터 */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: GOAL_POMODOROS }).map((_, i) => (
                  <span key={i} className={`text-lg transition-all ${i < pomoDone ? 'opacity-100' : 'opacity-30'}`}>
                    🍅
                  </span>
                ))}
                <span className="text-xs text-blue-200 ml-1">{pomoDone}/{GOAL_POMODOROS} 세션</span>
              </div>
            </div>
          </div>

          {/* 유휴 감지 안내 */}
          <div className="mt-4 text-xs text-blue-200/60 flex items-center gap-1">
            <span>🖱️</span>
            <span>마우스·키보드 입력이 10분 없으면 타이머가 자동 일시정지됩니다</span>
          </div>
        </div>

        {/* 오늘의 성과 요약 */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
          <h2 className="font-black text-lg mb-4">📊 오늘의 성과</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label:  '체크리스트 달성률',
                value:  `${checkPct}%`,
                sub:    `${doneCount}/${tasks.length}개 완료`,
                color:  checkPct === 100 ? 'text-emerald-500' : 'text-blue-500',
                icon:   '✅',
              },
              {
                label:  '총 딥워크 시간',
                value:  `${totalFocusMins}분`,
                sub:    `${pomoDone}세션 완료`,
                color:  totalFocusMins >= 100 ? 'text-emerald-500' : 'text-purple-500',
                icon:   '🍅',
              },
              {
                label:  '알리바이 상태',
                value:  alibi ? '획득!' : '진행중',
                sub:    alibi ? '자유롭게 즐기세요 🏖️' : `목표: 체크 100% + ${GOAL_POMODOROS}세션`,
                color:  alibi ? 'text-emerald-500' : 'text-amber-500',
                icon:   alibi ? '🏖️' : '⏳',
              },
            ].map(s => (
              <div key={s.label} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className={`text-2xl font-black mb-0.5 ${s.color}`}>{s.value}</div>
                <div className="text-xs font-semibold text-[#475569] mb-0.5">{s.label}</div>
                <div className="text-xs text-[#94A3B8]">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 상용화 핵심 기술 시뮬레이터 (B2B/B2G) */}
        <div className="bg-white border-2 border-slate-900 rounded-2xl p-6 mt-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🔌</span>
            <h2 className="font-black text-lg text-slate-900">상용화 연동 기능 실시간 시뮬레이터 (B2B/B2G)</h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 font-bold animate-pulse">
              Interactive Mock
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            B2B 기업 인사팀과 지자체가 신뢰 장벽 및 행정 복잡성을 극복하기 위해 플랫폼에 구축된 상용화 기술을 체험해보세요.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* GPS 지오펜싱 */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-400 uppercase">Geofencing & GPS</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    gpsCheckedIn 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {gpsCheckedIn ? '출근 완료' : '출근 전'}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-800 mb-2">📍 위치 기반 근무지 인증</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  지정된 강릉 워케이션 센터 반경 50m 이내에 있을 경우에만 출근 체크 및 보조금 지원 혜택이 연동됩니다.
                </p>
                
                <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs mb-4">
                  {gpsLoading ? (
                    <div className="flex items-center justify-center gap-2 py-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="font-bold text-slate-600">위치 GPS 탐색 및 암호화 인증 중...</span>
                    </div>
                  ) : gpsCheckedIn ? (
                    <div className="space-y-1">
                      <div className="font-black text-emerald-600 flex items-center gap-1">
                        <span>●</span> 인증 완료: 강릉 송정 센터 (반경 22m 이내)
                      </div>
                      <div className="text-[10px] text-slate-400">인증 시간: {new Date().toLocaleTimeString()}</div>
                    </div>
                  ) : (
                    <div className="font-bold text-amber-600 flex items-center gap-1 py-1">
                      <span>●</span> 인증 보류: 코워킹 스페이스 반경 외 (출근 인증이 필요합니다)
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  if (gpsCheckedIn) {
                    setGpsCheckedIn(false)
                  } else {
                    setGpsLoading(true)
                    setTimeout(() => {
                      setGpsLoading(false)
                      setGpsCheckedIn(true)
                    }, 1200)
                  }
                }}
                disabled={gpsLoading}
                className={`w-full py-2 text-xs font-black rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:shadow-none transition-all ${
                  gpsCheckedIn
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-white text-slate-800 hover:bg-slate-50'
                }`}
              >
                {gpsCheckedIn ? '출근 인증 해제' : '근무지 GPS 인증하기'}
              </button>
            </div>

            {/* Slack 상태 동기화 */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-400 uppercase">SaaS API Integration</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={slackSync}
                      onChange={(e) => setSlackSync(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-1 text-[10px] font-bold text-slate-500">연동</span>
                  </label>
                </div>
                <h3 className="font-bold text-sm text-slate-800 mb-2">🔌 Slack 메신저 상태 실시간 연동</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  뽀모도로 몰입 타이머 상태를 슬랙에 자동 동기화하여 팀원들에게 현재 몰입 상태를 공유합니다.
                </p>

                <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm">
                      👤
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">이지은 (마케팅 TF)</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {slackSync && running ? (
                          <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-black">
                            🍅 집중근무중 (방해금지)
                          </span>
                        ) : slackSync && phase === 'break' && running ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded font-black">
                            ☕ 휴식중
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                            💬 온라인
                          </span>
                        )}
                        <span className="text-[9px] text-slate-400">
                          {slackSync && running ? '“강릉 센터에서 몰입 프로젝트 진행 중”' : '“워케이션 원격 근무 중”'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSlackTestTriggered(true)
                    setTimeout(() => setSlackTestTriggered(false), 5000)
                  }}
                  className="w-full py-2 text-xs font-black bg-white hover:bg-slate-50 text-slate-800 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:shadow-none transition-all"
                >
                  Slack 채널 모의 알림 테스트
                </button>
                {slackTestTriggered && (
                  <div className="bg-indigo-950 text-white rounded-lg p-2.5 text-[10px] font-mono leading-relaxed border border-indigo-800 animate-fade-in-down">
                    <span className="text-indigo-400">#workation-feed</span> 🤖봇: <strong>[이지은]</strong>님이 강릉 송정 센터에서 1회차 뽀모도로 몰입 세션을 성공적으로 달성했습니다! 🍅
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 지자체 보조금 확인서 */}
          <div className="mt-6 border border-slate-200 rounded-xl p-4 bg-emerald-50/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-slate-800">🏛️ 지자체 제출용 정량 근무 증빙서 자동 생성</h4>
              <p className="text-xs text-slate-500">오늘 달성한 업무 목록과 집중 세션 데이터가 공인 지자체 양식의 증빙 문서로 즉시 출력됩니다.</p>
            </div>
            <button
              onClick={() => setShowPdfModal(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all shrink-0"
            >
              📄 근무 증빙서(PDF) 발행
            </button>
          </div>
        </div>

        {/* 추가 예정 업무 기능 (로드맵) */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 mt-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🚀</span>
            <h2 className="font-black text-lg">💡 마이 업무 툴 - 추가 예정 기능 로드맵</h2>
          </div>
          <p className="text-xs text-[#94A3B8] mb-6">
            워케이션 임직원의 자율적이고 신뢰성 높은 업무 수행을 위해 곧 도입될 연동 기능입니다.
          </p>

          <div className="flex flex-col gap-4">
            {[
              {
                title: '🔌 협업 툴 실시간 연동 (API)',
                desc: 'Slack 메시지 전송 빈도, Notion 문서 수정 이력, Github 커밋 수 등 연동된 외부 협업 툴의 활동을 감지해 워케이션 중 실제 업무 수행 상태를 자동으로 증빙합니다.',
                tag: '개발 예정 (CBT)',
                tagColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
              },
              {
                title: '🧾 1-Billing 실시간 지출 청구 (OCR)',
                desc: '워케이션 중 지출한 식비, 교통비, 카페 음료 비용 영수증을 사진 촬영하여 간편 업로드하면 OCR이 가맹점명과 세부 금액을 자동 인식하여 회사의 재무팀으로 즉시 청구 정산합니다.',
                tag: '개발 예정 (CBT)',
                tagColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
              },
              {
                title: '📶 카페/근무지 공유 & 네트워크 품질 체크',
                desc: '현지에서 방문한 카페나 코워킹 스페이스의 인터넷(Wi-Fi) 속도, 소음도, 업무 편의성(콘센트 여부)을 원클릭으로 측정하고 평가하여 동료들에게 최적의 근무지를 실시간으로 공유합니다.',
                tag: '기획 중',
                tagColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
              },
              {
                title: '👥 동료 실시간 현황 위젯',
                desc: '동일한 지역 또는 숙소 인근에서 워케이션을 보내고 있는 다른 부서 팀원들의 현재 상태(집중 모드 중, 휴식 중)와 오늘 목표 달성도를 실시간 소셜 위젯으로 공유하여 유기적으로 소통합니다.',
                tag: '기획 중',
                tagColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
              },
              {
                title: '✍️ AI 일일 업무 보고서 초안 생성 (LLM)',
                desc: '오늘 작성한 마이크로 목표 달성 여부와 뽀모도로 타이머로 수집된 순수 딥워크 집중 데이터를 분석하여, 하루 업무를 마치면 자동으로 보고용 일지/이메일 초안을 인공지능이 완성해 줍니다.',
                tag: '정식 출시 이후',
                tagColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
              },
            ].map((feature, i) => (
              <div key={i} className="border border-[#F1F5F9] rounded-xl p-4 bg-[#F8FAFC]/50 hover:bg-white transition-all duration-200 hover:shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
                  <h3 className="font-bold text-sm text-[#0F172A]">{feature.title}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${feature.tagColor}`}>
                    {feature.tag}
                  </span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 지자체 보조금 연동 근무 증빙 확인서 (인쇄 미리보기 모달) */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border-4 border-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
              <h3 className="text-xl font-black text-slate-900">지자체 보조금 증빙 근무 확인서 (미리보기)</h3>
              <button onClick={() => setShowPdfModal(false)} className="text-slate-500 hover:text-slate-900 font-black text-lg">✕</button>
            </div>

            {/* 확인서 내용 */}
            <div id="print-area" className="border-2 border-slate-300 p-8 font-sans text-xs bg-white text-slate-900 space-y-6 relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-100/50 font-black text-[60px] select-none pointer-events-none rotate-12">
                THE WORKATION
              </div>

              <div className="text-center space-y-2 relative z-10">
                <h2 className="text-xl font-black tracking-widest text-slate-950">워케이션 근무 활동 인증서</h2>
                <p className="text-[10px] text-slate-400 font-bold">인증코드: {`WK-AUTH-${new Date().toISOString().slice(0,10).replace(/-/g,'')}`}</p>
              </div>

              <div className="space-y-2 relative z-10 border-t border-b border-slate-900 py-4 text-slate-800">
                <div className="grid grid-cols-2 gap-4 leading-relaxed">
                  <div><strong>피고용자(임직원):</strong> 이지은 (개발 마케팅 TF)</div>
                  <div><strong>소속 회사:</strong> 주식회사 테스트 코리아</div>
                  <div><strong>근무 장소:</strong> 강릉 송정 워케이션 센터 (코워킹 스페이스)</div>
                  <div><strong>인증 정보:</strong> GPS 지오펜싱 인증 완료 ({gpsCheckedIn ? '반경 22m 내' : '출근전 모드'})</div>
                  <div><strong>기준 일자:</strong> {new Date().toLocaleDateString('ko-KR')}</div>
                  <div><strong>총 몰입 시간:</strong> {totalFocusMins}분 ({pomoDone} 세션)</div>
                </div>
              </div>

              <div className="space-y-3 relative z-10">
                <h3 className="font-bold text-sm text-slate-800">일일 마이크로 목표 달성 내역</h3>
                {tasks.length === 0 ? (
                  <p className="text-slate-400 italic">완료되거나 등록된 목표가 없습니다.</p>
                ) : (
                  <table className="w-full text-[10px] border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700">
                        <th className="border border-slate-300 px-2 py-1 text-left">세부 목표명</th>
                        <th className="border border-slate-300 px-2 py-1 text-center">진행시간</th>
                        <th className="border border-slate-300 px-2 py-1 text-center">달성 여부</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map(t => (
                        <tr key={t.id} className="text-slate-600">
                          <td className="border border-slate-300 px-2 py-1.5">{t.title}</td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">{Math.floor(t.focusSecs / 60)}분</td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center font-bold">
                            {t.done ? (
                              <span className="text-emerald-600">완료 (100%)</span>
                            ) : (
                              <span className="text-amber-600">진행 중</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="text-center pt-8 space-y-4 relative z-10">
                <p className="text-[11px] leading-relaxed max-w-md mx-auto text-slate-600">
                  위 임직원은 더 워케이션 플랫폼의 실시간 지오펜싱 GPS 위치 검증 시스템 및 자율 성과 증빙(알리바이 대시보드)을 통해 근무지 내 이탈 없이 집중 근무를 수행하였음을 공식 증명하며, 지자체 워케이션 활성화 보조금 집행 규정을 충족함을 인증합니다.
                </p>
                <div className="pt-4 flex justify-center items-center gap-1">
                  <span className="font-black text-sm text-slate-800">{new Date().toLocaleDateString('ko-KR')}</span>
                  <div className="w-12 h-12 rounded-full border-2 border-red-500 flex items-center justify-center text-[10px] font-black text-red-500 rotate-12 shrink-0">
                    더 워케이션<br />직인생략
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  const printContent = document.getElementById('print-area')?.innerHTML
                  if (printContent) {
                    const printWindow = window.open('', '', 'width=800,height=600')
                    printWindow?.document.write(`
                      <html>
                        <head>
                          <title>워케이션 근무 활동 인증서</title>
                          <style>
                            body { font-family: sans-serif; padding: 40px; color: #333; }
                            .text-center { text-align: center; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
                            .border-t { border-top: 1px solid #000; margin-top: 20px; padding-top: 20px; }
                            .text-emerald-600 { color: #059669; font-weight: bold; }
                            .text-amber-600 { color: #d97706; font-weight: bold; }
                          </style>
                        </head>
                        <body>
                          ${printContent}
                        </body>
                      </html>
                    `)
                    printWindow?.document.close()
                    printWindow?.print()
                  }
                }}
                className="px-5 py-2.5 bg-slate-950 text-white font-black text-xs rounded-lg border-2 border-slate-950 hover:bg-slate-800 transition-colors animate-pulse"
              >
                🖨️ 인쇄 / PDF 다운로드
              </button>
              <button
                onClick={() => setShowPdfModal(false)}
                className="px-5 py-2.5 border-2 border-slate-900 bg-white hover:bg-slate-50 font-bold text-xs rounded-lg transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
