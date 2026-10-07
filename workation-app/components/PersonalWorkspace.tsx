'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { addMeasuredTime, timerText } from '@/lib/personal-timer'
import { restorePersonalPlan, personalReportReady, personalReadiness } from '@/lib/personal-plan'
import type { Goal, Plan } from '@/lib/workation-plan'
import PersonalRegion from './PersonalRegion'
import PersonalPerformance from './PersonalPerformance'
import PersonalTools from './PersonalTools'
import PersonalEvidence from './PersonalEvidence'
import {dataUrl,evidenceFile,evidenceTypes,saveEvidenceFiles} from '@/lib/personal-evidence'
import WorkationGoalInput from './WorkationGoalInput'
import WorkationReport from './WorkationReport'
import './personal-workspace.css'

const storageKey = 'the-workation.personal.v1'
const today = () => new Date().toLocaleDateString('en-CA')
const emptyGoal = (due: string): Goal => ({ title: '', criteria: '', due, expectedMinutes: 60, actualMinutes: 0, progress: 0, note: '', result: '', link: '' })
const emptyPlan = (): Plan => ({ id: '', company_id: '', user_id: '', employee_name: '', title: '', place: '', start_date: today(), end_date: today(), goals: [emptyGoal(today())], status: 'approved', feedback: '', version: 1, history: [] })
const field = 'mt-2 w-full rounded-xl border border-slate-300 p-3 bg-white focus:ring-2 focus:ring-teal-600'

export default function PersonalWorkspace({preview=false}:{preview?:boolean}) {
  const [plan, setPlan] = useState<Plan>(()=>preview?{...emptyPlan(),title:'브랜드 소개 페이지 제작',employee_name:'검수용 예시',place:'제주 공유 사무실',goals:[{...emptyGoal(today()),title:'모바일 소개 화면 완성',criteria:'주요 서비스 설명과 신청 버튼을 포함한 화면 1개',result:'모바일 소개 화면을 완성했습니다. 추가 문구 검토가 남았습니다.'}]}:emptyPlan())
  const [ready, setReady] = useState(false)
  const [step, setStep] = useState(preview?1:0)
  const [saved, setSaved] = useState('')
  const [error, setError] = useState('')
  const [blocked, setBlocked] = useState(false)
  const [running, setRunning] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [activeGoal,setActiveGoal]=useState(0)
  const [notice,setNotice]=useState('')
  const [storageError,setStorageError]=useState('')
  const alertRef=useRef<HTMLParagraphElement>(null)
  const editorRef=useRef<HTMLElement>(null)
  function focusCurrentAction(){
    editorRef.current?.scrollIntoView({block:'start',behavior:'smooth'});
    const fields=Array.from(editorRef.current?.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('input:not([type=file]), textarea') || []);
    const target=fields.find(field=>!field.value.trim()) || fields[0];
    if(step===1) editorRef.current?.querySelector<HTMLButtonElement>('.personal-timer button')?.focus();else target?.focus({preventScroll:true});
  }
  useEffect(()=>{if(error){alertRef.current?.focus();alertRef.current?.scrollIntoView({block:'center',behavior:'smooth'})}},[error])
  const tick = useRef(0)
  useEffect(() => {
    if (running === null) return
    tick.current = Date.now()
    const collect = () => {
      const now = Date.now(), previous = tick.current; tick.current = now
      setPlan(p => ({ ...p, goals: p.goals.map((g,i) => {
        if (i !== running) return g
        const personalTimer = addMeasuredTime(g.personalTimer || {seconds:0,sessions:0}, previous, now)
        return {...g, personalTimer, actualMinutes:Math.floor(personalTimer.seconds / 60)}
      }) }))
    }
    const id = window.setInterval(collect, 1000)
    const pauseHidden = () => { if (document.hidden) { collect(); setRunning(null) } }
    document.addEventListener('visibilitychange', pauseHidden)
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange',pauseHidden); collect() }
  }, [running])
  function startTimer(index: number) {
    if (blocked || (!preview && saved !== '이 브라우저에 저장됨')) { setError('저장이 가능한 상태에서 측정을 시작해 주세요.'); return }
    if (!plan.goals[index].title.trim()) { setError('먼저 목표 정하기에서 업무 이름을 입력해 주세요.'); setStep(0); return }
    if (running !== null) return
    setPlan(p => ({...p, goals:p.goals.map((g,i) => i === index ? {...g, personalTimer:{seconds:g.personalTimer?.seconds || 0,sessions:(g.personalTimer?.sessions || 0) + 1},actualMinutes:Math.floor((g.personalTimer?.seconds || 0)/60)} : g)}))
    setRunning(index)
  }
  useEffect(() => {
    if(preview){setReady(true);setSaved('검수용 예시 · 실제 기록 저장 안 함');return}
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        setPlan(restorePersonalPlan(JSON.parse(raw)))
      }
    } catch { setBlocked(true); setError('저장된 기록을 불러오지 못했습니다. 기존 기록을 덮어쓰지 않도록 자동 저장을 중지했습니다.') }
    const params=new URLSearchParams(window.location.search)
    if(params.get('tool_connected')){setStep(1);setNotice('도구가 연결되었습니다. 아래 도구 활동에서 기록을 확인하세요.')}
    if(params.get('tool_error')){setStep(1);setError('연결을 완료하지 못했습니다. 계정 권한을 확인하고 다시 연결해 주세요.')}
    setReady(true)
  }, [])
  useEffect(() => {
    if (!ready || blocked || preview) return
    try { localStorage.setItem(storageKey, JSON.stringify(plan)); setSaved('이 브라우저에 저장됨'); setStorageError('') }
    catch { setSaved('저장 실패'); setStorageError('브라우저 저장이 제한되어 있습니다. 입력한 기록은 아래 백업 버튼으로 보관하세요.') }
  }, [plan, ready, blocked])
  function change(key: keyof Plan, value: string) { setPlan(p => ({ ...p, [key]: value })) }
  function goalChange(index: number, key: keyof Goal, value: string | number) { setPlan(p => ({ ...p, goals: p.goals.map((g, i) => i === index ? { ...g, [key]: value } : g) })) }
  async function backup() {
    if(uploading){setError('자료 저장이 끝난 뒤 백업해 주세요.');return}
    try {
    const assets: {id:string;data:string}[]=[];let bytes=0
    for(const g of plan.goals) for(const e of g.evidence || []) {const file=await evidenceFile(e.id);if(!file)throw new Error('첨부 원본이 없어 전체 백업을 만들 수 없습니다.');bytes+=file.size;if(bytes>60*1024*1024)throw new Error('백업은 전체 자료 60MB까지 지원합니다. 일부 자료를 제외한 뒤 다시 시도해 주세요.');assets.push({id:e.id,data:await dataUrl(file)})}
    const url = URL.createObjectURL(new Blob([JSON.stringify({...plan,assets}, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a'); a.href = url; a.download = '개인업무-백업.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch(e){setError(e instanceof Error?e.message:'백업을 만들지 못했습니다.')}
  }
  function navigate(next:number) {
    if(uploading){setError('자료 저장이 끝난 뒤 이동해 주세요.');return}
    setRunning(null);setError('');if(next===3)openReport();else setStep(next)
  }
  function openReport() {
    if (!personalReportReady(plan)) {
      setError('문서 정리 전에 제목·작성자·기간과 각 업무의 제목·완료 기준·기한·결과를 확인해 주세요. 링크는 http 또는 https 주소로 입력하세요.'); return
    }
    setRunning(null); setError(''); setStep(3)
  }
  const readiness=personalReadiness(plan),prepared=readiness.filter(item=>item.done).length
  if (!ready) return <p className="p-8">내 기록을 불러오는 중입니다…</p>
  return <div className="personal-workspace min-h-screen bg-slate-50">
    <header className="personal-header"><nav className="max-w-5xl mx-auto flex justify-between items-center"><Link href="/" aria-label="더 워케이션 홈"><Image src="/logo.png" alt="더 워케이션" width={1233} height={511} className="personal-brand" priority/></Link><Link href="/login" className="text-sm">회사용 로그인 →</Link></nav></header>
    <main className="personal-main mx-auto px-4 py-8 space-y-6">
      {preview && <p className="text-sm text-[#056f7c]">검수용 예시 화면입니다. 실제 개인 업무 기록은 변경하지 않습니다.</p>}
      <div className="personal-intro"><div><span className="personal-eyebrow">THE WORKATION · 개인 업무 공간</span><h1>개인 업무 공간</h1><p>지금 할 일을 정하고, 실행한 과정과 결과를 모으세요.</p></div></div>

      <nav aria-label="개인 업무 순서" className="personal-steps grid grid-cols-2 sm:grid-cols-4 gap-2">{['목표 정하기', '업무 기록', '결과·증빙', '문서 정리'].map((label, i) => <button key={label} aria-current={step === i ? 'step' : undefined} onClick={() => navigate(i)} className={`p-4 rounded-xl border text-left font-semibold ${step === i ? 'bg-[#056f7c] text-white' : 'bg-white'}`}><span className="personal-step-number">{String(i + 1).padStart(2, '0')}</span><span>{label}<small>{['할 일과 완료 기준','진행 상태와 메모','완성한 것과 링크','미리 보기와 PDF'][i]}</small></span></button>)}</nav>



      <section className="personal-next-action"><div><span>지금 할 일 · {step+1} / 4</span><h2>{['아래 빈칸에 이번에 할 일을 적어 주세요','업무를 고르고 시작 버튼을 눌러 주세요','완성한 내용을 적고 자료를 첨부해 주세요','완성된 문서를 확인하고 저장하세요'][step]}</h2><p>{['계획 이름 → 내 이름 → 할 일 → 완료 기준 순서로 입력하면 됩니다. 지역 혜택은 아래에서 선택할 수 있어요.','업무 시작을 누르면 시간을 기록합니다. 메모와 도구 연결은 필요할 때만 사용하세요.','결과 설명은 문서를 만들 때 필요해요. 사진·영상·링크는 선택 사항입니다.','내용이 맞으면 인쇄 / PDF 저장을 누르세요. 수정하려면 결과 수정으로 돌아가세요.'][step]}</p></div>{step<3&&<button onClick={focusCurrentAction}>{['입력할 곳으로 이동 ↓','시작 버튼으로 이동 ↓','결과 입력하기 ↓'][step]}</button>}</section>
      {notice && <p role="status" className="text-sm text-[#056f7c]">{notice}</p>}
      {storageError && <p role="alert" className="text-red-700">{storageError}</p>}
      {error && <p ref={alertRef} tabIndex={-1} role="alert" className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-800">{error}</p>}


      {step === 3 ? <><div className="flex gap-3"><button className="rounded-xl bg-[#056f7c] text-white px-5 py-3" onClick={() => window.print()}>인쇄 / PDF 저장</button><button onClick={() => navigate(2)}>결과 수정</button></div><WorkationReport plan={plan} unsaved={!preview && saved !== '이 브라우저에 저장됨'} personal /></> : <section ref={editorRef} data-stage={step} className="personal-editor bg-white border rounded-2xl p-5 sm:p-8 space-y-6">
        <div className="personal-section-heading"><span>STEP {String(step + 1).padStart(2, '0')} / 04</span><h2 className="text-xl font-bold">{['무엇을 해낼 계획인가요?', '한 업무에 집중해서 시작하세요', '결과와 확인할 수 있는 자료를 모아 주세요'][step]}</h2><p>{['먼저 이번 업무의 이름과 기간을 적고, 아래에 할 일을 추가하세요.', '업무 시작 버튼을 누르세요. 쉬는 동안에는 일시정지하세요.', '완성한 결과와 남은 일을 적어 주세요. 링크는 선택 사항입니다.'][step]}</p></div>
        {step === 0 && <div className="personal-basics grid sm:grid-cols-2 gap-4">{([['title','이번 계획의 이름 · 필수','예: 10월 포트폴리오 준비'],['employee_name','내 이름 · 필수','내 이름'],['place','업무 장소 (선택)','예: 제주, 집, 공유 사무실']] as const).map(([key,label,hint]) => <label key={key}>{label}<input className={field} maxLength={200} value={plan[key]} placeholder={hint} onChange={e => change(key,e.target.value)} /></label>)}<div className="grid grid-cols-2 gap-3"><label>시작일<input className={field} type="date" value={plan.start_date} onChange={e => change('start_date',e.target.value)} /></label><label>종료일<input className={field} type="date" min={plan.start_date} value={plan.end_date} onChange={e => change('end_date',e.target.value)} /></label></div></div>}
        {step === 1 && <label className="work-task-picker">지금 할 업무<select aria-label="측정할 업무 선택" value={activeGoal} onChange={e=>{setRunning(null);setActiveGoal(Number(e.target.value))}}>{plan.goals.map((g,i)=><option key={i} value={i}>{g.title || '새 업무'}</option>)}</select></label>}
        {plan.goals.map((g,i) => <section hidden={step === 1 && activeGoal !== i} key={i} className="personal-goal border rounded-xl p-4"><div className="flex justify-between gap-3"><h3 className="font-semibold"><span className="goal-number">{String(i+1).padStart(2,'0')}</span>{g.title || '새 업무'}</h3>{step === 0 && plan.goals.length > 1 && <button onClick={() => { if (uploading || running !== null) { setError('자료 저장을 마치고 타이머를 일시정지한 뒤 업무를 삭제해 주세요.'); return } if (confirm('이 업무의 기록과 결과도 삭제할까요?')) setPlan(p => ({ ...p, goals:p.goals.filter((_,j) => j !== i) })) }} className="text-sm text-red-700">삭제</button>}</div>{step === 1 && <div className="personal-timer"><div><span className="timer-label">{running === i ? '● 업무 측정 중' : '측정한 업무 시간'}</span><strong>{timerText(g.personalTimer?.seconds || 0)}</strong><small>{g.personalTimer?.sessions || 0}회 작업 · {running === i ? 'ON' : 'OFF'}</small></div><button type="button" disabled={running !== null && running !== i} onClick={() => running === i ? setRunning(null) : startTimer(i)}>{running === i ? 'Ⅱ 일시정지' : '▶ 업무 시작'}</button></div>}{step === 1 && !g.personalTimer && g.actualMinutes > 0 && <p className="text-xs text-slate-500 mt-2">기존 직접 입력 시간: {g.actualMinutes}분. 측정을 시작하면 타이머 시간으로 바뀝니다.</p>}{step > 0 && <p className="goal-context">완료 기준 · {g.criteria || '목표 설정에서 입력해 주세요'}<span>기한 {g.due} · {step === 2 ? `측정 시간 ${timerText(g.personalTimer?.seconds || 0)}` : `계획 ${g.expectedMinutes}분`}</span></p>}<WorkationGoalInput goal={g} editing={step === 0} results={step === 2} personal start={plan.start_date} end={plan.end_date} change={(k,v) => goalChange(i,k,v)} />{step === 2 && <PersonalEvidence disabled={uploading} items={g.evidence || []} onBusy={setUploading} onChange={evidence => setPlan(p => ({...p,goals:p.goals.map((goal,j)=>j===i?{...goal,evidence}:goal)}))}/>}</section>)}
        {step === 0 && plan.goals.length < 20 && <button onClick={() => setPlan(p => ({ ...p, goals:[...p.goals,emptyGoal(p.end_date)] }))} className="border rounded-xl p-3">+ 업무 추가</button>}
        <div className="personal-actions flex justify-between items-center gap-3"><span className="text-sm text-slate-500">{preview ? '검수용 예시 · 기록 저장 안 함' : '입력한 내용은 자동 저장됩니다.'}</span><button className="bg-[#056f7c] text-white rounded-xl px-6 py-3" onClick={() => navigate(step + 1)}>{['목표 저장하고 업무 시작 →','업무 마치고 결과 정리 →','자료가 포함된 문서 보기 →'][step]}</button></div>
      </section>}
      {step===0&&<details className="personal-region-options"><summary>워케이션 지역·지원 혜택 살펴보기 <span>선택 사항 · {plan.region || '지역을 골라 주세요'}</span></summary><PersonalRegion value={plan.region || ''} onChange={region=>change('region',region)}/></details>}
      <section className="personal-readiness"><div><strong>문서 준비 {prepared*20}%</strong><span>{prepared===5?'입력 조건을 갖췄어요. 문서를 확인하세요.':`5개 항목 중 ${5-prepared}개를 채우면 결과 문서를 만들 수 있어요.`}</span></div><progress aria-label="문서 준비 상태" value={prepared} max={5}/><div className="readiness-checks">{readiness.map(item=><button key={item.label} onClick={()=>navigate(item.step)}>{item.done?'✓':'○'} {item.label}</button>)}</div><small>문서 입력 항목의 준비 상태입니다. 업무 달성률이나 지원금 지급 확률이 아닙니다.</small></section>
      {step === 2 && <PersonalPerformance plan={plan}/>}
      {step === 1 && <div className="work-dashboard"><div><span>측정한 총 시간</span><strong>{timerText(plan.goals.reduce((sum,g)=>sum+(g.personalTimer?.seconds || 0),0))}</strong></div><div><span>현재 작업</span><strong>{running === null ? '쉬는 중' : plan.goals[running]?.title}</strong></div><div><span>결과를 남긴 업무</span><strong>{plan.goals.filter(g=>g.result.trim()).length} / {plan.goals.length}건</strong></div></div>}
{step === 1 && <aside className="timer-guidance">업무를 시작할 때 ON, 쉬는 동안 OFF로 전환하세요. 다른 탭으로 이동하거나 화면을 닫으면 측정이 멈춥니다. 타이머는 이 화면에서 시작한 시간만 측정하며 실제 활동이나 성과를 자동 검증하지 않습니다.</aside>}
      {step === 1 && <details className="personal-tool-details"><summary>도구 활동 연결·확인 <span>GitHub · Notion · Slack</span></summary><PersonalTools createDraft={item=>{if(plan.goals.length>=20||plan.goals.some(g=>g.note.includes(item.url)&&g.note.includes(item.title)))return false;const goal={...emptyGoal(plan.end_date),title:item.title.slice(0,200),note:`[도구 활동] ${item.title} · ${item.at} · ${item.attribution}\n${item.url}`,link:/^https?:\/\//i.test(item.url)?item.url:''};setPlan(p=>({...p,goals:p.goals.length===1&&!p.goals[0].title.trim()? [goal] : [...p.goals,goal]}));return true}} goals={plan.goals} attach={(index,item)=>{const g=plan.goals[index];if(!g)return false;const text=`[도구 활동] ${item.title} · ${item.at} · ${item.attribution}\n${item.url}`;if(g.note.includes(text))return false;const note=[g.note,text].filter(Boolean).join('\n');if(note.length>4000)return false;goalChange(index,'note',note);return true}}/></details>}
      <details className="personal-backup"><summary>기록 보관·복원 <span>{saved || '저장 확인 중'}</span></summary><div className="flex flex-wrap gap-3 items-center text-sm mt-3"><button onClick={backup} className="underline">기록 백업</button><label className="underline cursor-pointer">백업 불러오기<input className="sr-only" type="file" accept="application/json" onChange={async e => {
        const file = e.target.files?.[0]; e.target.value = ''; if (!file) return
        try {
          if (file.size > 90*1024*1024) throw new Error()
          const parsed=JSON.parse(await file.text())
          const restored = restorePersonalPlan(parsed)
          if (uploading || running !== null) { setError('자료 저장을 마치고 타이머를 일시정지한 뒤 백업을 불러와 주세요.'); return }
          if (!confirm('현재 기록을 백업 파일의 기록으로 바꿀까요? 현재 기록은 먼저 백업해 주세요.')) return
          const assets: {id:string;blob:Blob}[]=[]
          for(const goal of restored.goals) for(const item of goal.evidence || []) {
            const originalId=item.id,asset=parsed.assets?.find((a:any)=>a.id===originalId)
            if(!asset || typeof asset.data !== 'string' || !/^data:(image\/(jpeg|png|webp)|video\/(mp4|webm));base64,[A-Za-z0-9+/=]+$/.test(asset.data))throw new Error()
            const [header,base64]=asset.data.split(',');const type=header.slice(5,header.indexOf(';'));if(!evidenceTypes.includes(type)||type.startsWith('image/')!==(item.kind==='image'))throw new Error()
            const binary=atob(base64);if(binary.length>20*1024*1024)throw new Error()
            item.id=crypto.randomUUID();assets.push({id:item.id,blob:new Blob([Uint8Array.from(binary,c=>c.charCodeAt(0))],{type})})
          }
          if(assets.length)await saveEvidenceFiles(assets)
          setRunning(null); setBlocked(false); setPlan(restored); setActiveGoal(0); setStep(0)
        } catch { setError('사용 가능한 개인 업무 백업 파일이 아닙니다. 기존 기록은 유지됩니다.') }
      }} /></label><p className="text-xs text-slate-500">사진·영상 원본을 포함해 백업합니다. 첨부 자료 합계 60MB까지 지원합니다.</p></div></details>
      <details className="personal-storage"><summary>이 브라우저에 자동 저장돼요 <span>저장 안내</span></summary><p>회사 관리자에게 전달되지 않습니다. 공용 기기에서는 사용을 피하고, 브라우저 데이터를 지우기 전에 백업하세요. 기기 간 동기화는 아직 지원하지 않습니다. 자료는 이 브라우저에 보관됩니다. 사진·영상까지 보관하려면 기록 백업을 이용하세요.</p></details>
    </main><footer className="personal-footer"><Image src="/logo.png" alt="더 워케이션" width={1233} height={511}/><span>나만의 방식으로 일하고, 결과로 남기세요.</span></footer>
  </div>
}

