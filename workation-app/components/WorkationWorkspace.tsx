'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/ui/Header'
import { memberRequest } from '@/lib/membership-client'
import WorkationGoalInput from '@/components/WorkationGoalInput'
import WorkationReport, { duration } from '@/components/WorkationReport'
import '@/app/(main)/workation-plans/readability.css'
import type { Goal, Plan } from '@/lib/workation-plan'

const labels: Record<Plan['status'], string> = { draft: '작성 중', pending: '목표 검토 대기', revision: '목표 수정 요청', approved: '업무 진행 중', submitted: '결과 검토 대기', rework: '결과 보완 요청', completed: '검토 완료' }
const actions: Record<string, string> = { save: '목표 저장', submit: '목표 제출', approve: '목표 승인', revise: '목표 수정 요청', record: '업무 기록 저장', results: '결과 제출', complete: '결과 검토 완료', rework: '결과 보완 요청' }
const nextSteps: Record<Plan['status'], string> = { draft: '직원: 계획과 목표를 작성한 뒤 승인 요청을 보내 주세요.', pending: '회사 담당자: 참가 일정과 목표를 검토해 주세요.', revision: '직원: 담당자 의견을 반영하고 다시 제출해 주세요.', approved: '직원: 업무를 기록하고 완료 후 결과를 제출해 주세요.', submitted: '회사 담당자: 결과를 확인하고 검토 의견을 남겨 주세요.', rework: '직원: 보완 의견을 확인하고 결과를 다시 제출해 주세요.', completed: '담당자의 결과 검토가 완료되었습니다.' }
const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 disabled:bg-slate-50'
const buttonClass = 'rounded-lg bg-blue-600 px-4 py-2.5 text-white text-sm font-semibold disabled:opacity-50'
function blankGoal(due = ''): Goal { return { title: '', criteria: '', due, expectedMinutes: 60, actualMinutes: 0, progress: 0, note: '', result: '', link: '' } }
type Draft = Pick<Plan, 'title' | 'place' | 'start_date' | 'end_date' | 'goals'>
const blankDraft = (): Draft => ({ title: '', place: '', start_date: '', end_date: '', goals: [blankGoal()] })

export default function WorkationWorkspace({ request = memberRequest, preview = false, onDirtyChange }: { request?: typeof memberRequest; preview?: boolean; onDirtyChange?: (dirty: boolean) => void }) {
  const errorRef = useRef<HTMLDivElement>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [role, setRole] = useState('')
  const [memberName, setMemberName] = useState('')
  const [selected, setSelected] = useState<Plan | null>(null)
  const [draft, setDraft] = useState<Draft>(blankDraft)
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [resultMode, setResultMode] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [filter, setFilter] = useState('all')
  async function load() {
    setLoading(true); setError('')
    try { const data = await request('/api/workation-plans'); setPlans(data.plans); setRole(data.member.role); setMemberName(data.member.name); setSelected(null); setCreating(false); setDirty(false); setShowReport(false); if (preview && data.plans[0]) choose(data.plans[0]) }
    catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])
  useEffect(() => { if (error) { errorRef.current?.focus(); errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }) } }, [error])
  useEffect(() => { onDirtyChange?.(dirty) }, [dirty, onDirtyChange])
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  const canLeave = () => !dirty || window.confirm('저장하지 않은 변경이 있습니다. 변경 내용을 버리고 이동하시겠습니까?')
  function choose(plan: Plan | null) {
    if (!canLeave()) return
    setResultMode(plan?.status === 'rework'); setShowReport(false); setSelected(plan); setCreating(!plan); setDraft(plan ? { ...plan, goals: plan.goals.map(g => ({ ...g })) } : blankDraft()); setFeedback(''); setDirty(false); setError(''); setNotice('')
  }
  function change(key: keyof Draft, value: string) { setError(''); setDraft(d => ({ ...d, [key]: value, goals: key === 'end_date' ? d.goals.map(g => ({ ...g, due: !g.due || g.due === d.end_date ? value : g.due })) : d.goals })); setDirty(true) }
  function changeGoal(index: number, key: keyof Goal, value: string | number) { setError(''); setDraft(d => ({ ...d, goals: d.goals.map((g, i) => i === index ? { ...g, [key]: value } : g) })); setDirty(true) }
  async function save(action: string) {
    if (creating || ['save', 'submit'].includes(action)) {
      if (!draft.title.trim()) { setError('워케이션 이름을 입력해 주세요. 예: 강릉 서비스 기획 워케이션'); return }
      if (!draft.start_date || !draft.end_date || draft.end_date < draft.start_date) { setError('시작일과 종료일을 확인해 주세요.'); return }
      if (!draft.place.trim()) { setError('일할 장소나 지역을 입력해 주세요.'); return }
      for (let i = 0; i < draft.goals.length; i++) {
        const goal = draft.goals[i]
        const missing = !goal.title.trim() ? '할 일' : !goal.criteria.trim() ? '완료 기준' : !goal.due || goal.due < draft.start_date || goal.due > draft.end_date ? '기간 안에 있는 목표 기한' : goal.expectedMinutes < 1 ? '예상 소요 시간' : ''
        if (missing) { setError(`목표 ${i + 1}의 ${missing}을 입력해 주세요.`); return }
      }
    }
    if (action === 'results') {
      const missing = draft.goals.findIndex(g => !g.result.trim())
      if (missing >= 0) { setError(`목표 ${missing + 1}의 ‘어떤 결과가 나왔나요?’에 완료 내용이나 남은 일을 적어 주세요.`); return }
    }
    if (['revise', 'rework'].includes(action) && !feedback.trim()) { setError('직원이 수정할 내용을 검토 의견에 적어 주세요.'); return }
    setBusy(true); setError(''); setNotice('')
    try {
      const data = await request('/api/workation-plans', { method: creating ? 'POST' : 'PATCH', body: JSON.stringify({ ...draft, id: selected?.id, version: selected?.version, action, feedback }) })
      const plan = data.plan as Plan
      setPlans(prev => [plan, ...prev.filter(p => p.id !== plan.id)])
      setSelected(plan); setDraft({ ...plan, goals: plan.goals.map(g => ({ ...g })) }); setCreating(false); setDirty(false); setFeedback('')
      setNotice(creating ? '워케이션을 저장했습니다. 내용을 확인한 뒤 목표 승인을 요청해 주세요.' : `${actions[action]}이 완료되었습니다.`)
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  const editable = role === 'emp' && (creating || (!!selected && ['draft', 'revision'].includes(selected.status)))
  const recording = role === 'emp' && !!selected && ['approved', 'rework'].includes(selected.status)
  const reviewing = role === 'hr' && !!selected && ['pending', 'submitted'].includes(selected.status)
  const visible = plans.filter(p => filter === 'all' || (filter === 'waiting' ? ['pending', 'submitted'].includes(p.status) : filter === 'active' ? ['approved','rework'].includes(p.status) : p.status === 'completed'))
  return <div className="workation-ui min-h-screen bg-slate-50 text-slate-900">{!preview && <Header />}
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6"><div><p className="text-blue-700 text-sm font-semibold">THE WORKATION · 업무와 성과</p><h1 className="text-3xl font-bold mt-2">{role === 'hr' ? '우리 회사 워케이션' : '내 워케이션'}</h1><p className="text-slate-600 mt-2">{role === 'hr' ? '직원의 계획을 검토하고 합의한 업무의 진행 상황을 확인하세요.' : '회사와 계획을 합의하고, 승인 후 업무 진행 상황을 남기세요.'}</p></div><div className="flex gap-2"><button className="border bg-white rounded-lg px-4 py-2 disabled:opacity-50" disabled={busy || loading} onClick={() => { if (canLeave()) void load() }}>새로고침</button>{role === 'emp' && <button className={buttonClass} disabled={busy || loading} onClick={() => choose(null)}>워케이션 만들기</button>}</div></div>

      {error && <div ref={errorRef} tabIndex={-1} role="alert" className="bg-red-50 text-red-800 p-4 rounded-xl mb-4">{error} {!preview && /로그인|인증|세션/.test(error) && <Link href="/login" className="underline ml-3">로그인</Link>}</div>}
      {notice && <p role="status" className="bg-emerald-50 text-emerald-800 p-4 rounded-xl mb-4">{notice}</p>}
      {loading ? <p role="status" className="py-12 text-center">워케이션을 불러오는 중입니다…</p> : <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        <aside><label className="text-sm">목록 보기<select className={inputClass} value={filter} onChange={e => setFilter(e.target.value)}><option value="all">전체</option><option value="waiting">담당자 검토 대기</option><option value="active">진행 중</option><option value="completed">검토 완료</option></select></label><div className="space-y-3 mt-4">{visible.map(p => <button key={p.id} disabled={busy} onClick={() => choose(p)} aria-pressed={selected?.id === p.id} className={`w-full text-left p-4 rounded-xl border bg-white ${selected?.id === p.id ? 'border-blue-600 ring-1 ring-blue-600' : 'border-slate-200'}`}><span className="text-xs font-semibold text-blue-700">{labels[p.status]}</span><span className="block font-semibold mt-2 break-words">{p.title}</span><span className="block text-sm text-slate-600 mt-1">{p.employee_name} · {p.start_date} ~ {p.end_date}</span></button>)}{!visible.length && <p className="text-slate-600 py-6">{error ? '목록을 불러오지 못했습니다.' : role === 'hr' ? '아직 등록된 워케이션이 없습니다.' : '첫 워케이션을 만들어 보세요.'}</p>}</div></aside>
        <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 min-w-0">
          {!selected && !creating ? <div className="py-16 text-center"><h2 className="text-xl font-semibold">목표가 있는 워케이션을 시작하세요</h2><p className="text-slate-600 mt-3">목록에서 워케이션을 선택하면 계획과 진행 상황을 확인할 수 있습니다.</p></div> : <>
            <ol className="journey-steps" aria-label="워케이션 진행 단계">{['계획 작성', '회사 검토', '업무 진행', '결과 확인'].map((label, i) => {
              const stage = !selected || ['draft','revision'].includes(selected.status) ? 0 : selected.status === 'pending' ? 1 : ['approved','rework'].includes(selected.status) ? 2 : 3
              return <li key={label} aria-current={stage === i ? 'step' : undefined} className={stage === i ? 'current' : stage > i ? 'done' : ''}><span>{stage > i ? '✓' : i + 1}</span>{label}</li>
            })}</ol>
            <h2 className="text-xl font-semibold">{recording ? (resultMode ? '업무 결과 제출' : '업무 진행 상황') : creating ? '새 워케이션 계획' : labels[selected!.status]}</h2><p className="text-sm text-slate-600 mt-2 mb-5">{creating ? '일정과 할 일을 간단히 알려 주세요. 입력한 내용은 정식 계획서로 정리됩니다.' : recording ? (resultMode ? '업무를 마쳤을 때 결과물을 제출해 주세요.' : '매일 보고서를 쓸 필요 없이, 변화가 있을 때 기록하세요.') : role === 'emp' && selected?.status === 'pending' ? '회사 담당자가 검토하고 있습니다. 승인되면 이 화면에서 업무를 기록할 수 있습니다.' : role === 'emp' && selected?.status === 'submitted' ? '결과를 제출했습니다. 담당자의 검토를 기다려 주세요.' : nextSteps[selected!.status]}</p>
            {selected?.feedback && <div className="bg-amber-50 text-amber-900 rounded-xl p-4 mb-5 whitespace-pre-wrap"><strong>담당자 의견</strong><p className="mt-1">{selected.feedback}</p></div>}
            <div className="workation-tabs">
              <button aria-pressed={!showReport && !resultMode} onClick={() => { setShowReport(false); setResultMode(false) }}>{recording ? '진행 기록' : '내용 확인·작성'}</button>
              {recording && <button aria-pressed={!showReport && resultMode} onClick={() => { setShowReport(false); setResultMode(true) }}>결과 제출</button>}
              <button className="report-link" aria-pressed={showReport} onClick={() => setShowReport(true)}>{editable || selected?.status === 'pending' ? '계획서 미리보기' : '보고서 미리보기'}</button>
              {showReport && <button onClick={() => window.print()}>인쇄 / PDF 저장</button>}
            </div>
            {showReport ? <WorkationReport unsaved={dirty || creating} plan={{ ...(selected || { id: '', company_id: '', user_id: '', employee_name: memberName, status: 'draft', feedback: '', version: 1, history: [] }), ...draft, ...(reviewing && dirty ? { feedback } : {}) }} /> : <>
            <fieldset disabled={busy} className="space-y-5">
              {editable ? <><div className="form-section-title"><h3>1. 일정과 장소</h3><p>회사와 합의할 기본 정보입니다. 아래 항목을 모두 입력해 주세요.</p></div><label className="block text-sm">이번 워케이션의 이름을 정해 주세요<input aria-label="워케이션 이름" className={inputClass} maxLength={200} value={draft.title} onChange={e => change('title', e.target.value)} placeholder="예: 강릉 서비스 기획 워케이션" /></label><div className="grid sm:grid-cols-2 gap-4"><label className="text-sm">시작일<input className={inputClass} type="date" value={draft.start_date} onChange={e => change('start_date', e.target.value)} /></label><label className="text-sm">종료일<input className={inputClass} type="date" min={draft.start_date} value={draft.end_date} onChange={e => change('end_date', e.target.value)} /></label></div><label className="block text-sm">어디에서 일하실 예정인가요?<input aria-label="장소" className={inputClass} maxLength={300} value={draft.place} onChange={e => change('place', e.target.value)} placeholder="직접 준비한 숙소·공간 또는 지역" /></label></> : <div><h3 className="text-lg font-semibold break-words">{draft.title}</h3><p className="text-slate-600 break-words">{draft.place} · {draft.start_date} ~ {draft.end_date}</p></div>}
              {editable && <div className="rounded-xl bg-blue-50 p-4 text-sm"><p className="font-semibold text-blue-900">2. 합의할 업무 목표</p><p className="mt-1 text-slate-600">할 일 → 완료 기준 → 기한 순으로 적어 주세요. 목표 기한은 종료일로 자동 입력됩니다.</p></div>}
              <div className="space-y-5">{draft.goals.map((g, i) => <div key={i} className="workation-goal"><div className="flex justify-between items-center mb-3"><h3 className="font-semibold">목표 {i + 1}</h3>{editable && draft.goals.length > 1 && <button className="text-sm text-red-700" onClick={() => { setDraft(d => ({ ...d, goals: d.goals.filter((_, j) => j !== i) })); setDirty(true) }}>목표 삭제</button>}</div>
                {editable ? <WorkationGoalInput goal={g} editing start={draft.start_date} end={draft.end_date} change={(key,value) => changeGoal(i,key,value)} /> : <div className="space-y-2 break-words"><p className="goal-title font-medium">{g.title}</p><details className="goal-criteria" open={reviewing || selected?.status === 'pending'}><summary>{selected && ['draft','pending','revision'].includes(selected.status) ? '검토할 완료 기준' : '합의한 완료 기준 보기'}</summary><p className="whitespace-pre-wrap">{g.criteria}</p></details><p className="text-sm text-slate-600">기한 {g.due} · 예상 {duration(g.expectedMinutes)}</p></div>}
                {recording ? <WorkationGoalInput goal={g} editing={false} results={resultMode} start={draft.start_date} end={draft.end_date} change={(key,value) => changeGoal(i,key,value)} /> : !editable && selected && !['draft','pending','revision'].includes(selected.status) && <div className="mt-3 text-sm space-y-2 break-words"><p>직원 기록 진행률 {g.progress}% · 실제 {duration(g.actualMinutes)}</p>{g.note && <p className="whitespace-pre-wrap">업무 기록: {g.note}</p>}{g.result && <p className="whitespace-pre-wrap">결과: {g.result}</p>}{/^https?:\/\//i.test(g.link) && <a href={g.link} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">결과물 열기 ↗</a>}</div>}
              </div>)}</div>
              {editable && draft.goals.length < 20 && <button className="border rounded-lg px-4 py-2 text-sm" onClick={() => { setDraft(d => ({ ...d, goals: [...d.goals, blankGoal(d.end_date)] })); setDirty(true) }}>+ 목표 추가</button>}
              {reviewing && <label className="block text-sm">검토 의견 · 수정·보완 요청 시 필수<textarea className={inputClass} rows={3} placeholder="예: 초안의 범위에 모바일 화면도 포함해 주세요." maxLength={2000} value={feedback} onChange={e => { setFeedback(e.target.value); setDirty(true) }} /></label>}
              <div className="workation-actions">{editable && <><button className={creating ? buttonClass : 'secondary-action'} onClick={() => save('save')}>{creating ? '계획 저장하고 확인하기' : '변경 내용 저장'}</button>{!creating && <button className={buttonClass} onClick={() => save('submit')}>목표 승인 요청</button>}</>}{recording && <button className={buttonClass} onClick={() => save(resultMode ? 'results' : 'record')}>{resultMode ? '최종 결과 제출' : '진행 상황 저장'}</button>}{reviewing && <><button className={buttonClass} onClick={() => save(selected!.status === 'pending' ? 'approve' : 'complete')}>{selected!.status === 'pending' ? '참가·목표 승인' : '결과 검토 완료'}</button><button className="border rounded-lg px-4 py-2 text-sm" onClick={() => save(selected!.status === 'pending' ? 'revise' : 'rework')}>{selected!.status === 'pending' ? '수정 요청' : '보완 요청'}</button></>}{editable && <p className="action-help">{creating ? '저장 후 내용을 확인하고 회사에 승인 요청을 보낼 수 있습니다.' : '승인 요청을 누르면 현재 내용이 저장되고 회사 담당자에게 검토를 요청합니다.'}</p>}{busy && <span role="status">처리 중…</span>}{dirty && !busy && <span className="text-sm text-amber-800">저장하지 않은 변경이 있습니다.</span>}</div>
            </fieldset>
            </>}
            {selected?.status === 'completed' && <div className="mt-6 bg-emerald-50 rounded-xl p-4"><h3 className="font-semibold">검토 완료 요약</h3><p className="text-sm mt-2">전체 목표 {selected.goals.length}개 · 예상 {selected.goals.reduce((n, g) => n + g.expectedMinutes, 0)}분 · 실제 {selected.goals.reduce((n, g) => n + g.actualMinutes, 0)}분</p><p className="text-sm mt-1">진행률은 직원 기록이며, 검토 완료가 모든 목표의 100% 달성을 의미하지는 않습니다.</p></div>}
            {!!selected?.history.length && <details className="mt-6 border-t pt-4"><summary className="text-sm font-semibold cursor-pointer">처리 이력 ({selected.history.length})</summary><ol className="mt-3 space-y-3 text-sm">{selected.history.slice().reverse().map((h, i) => <li key={i}><p>{actions[h.action] || h.action} · {h.actor} · {new Date(h.at).toLocaleString('ko-KR')}</p>{h.note && <p className="whitespace-pre-wrap text-slate-600">{h.note}</p>}</li>)}</ol></details>}
          </>}
        </section>
      </div>}
    </main>
  </div>
}
