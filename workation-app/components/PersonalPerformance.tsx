'use client'
import { useEffect, useState } from 'react'
import type { Plan } from '@/lib/workation-plan'
import { analysisInput, type GoalAssessment } from '@/lib/personal-analysis'
import { timerText } from '@/lib/personal-timer'
export default function PersonalPerformance({plan}:{plan:Plan}){
  const [configured,setConfigured]=useState<boolean|null>(null),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('')
  const [analysis,setAnalysis]=useState<{goals:GoalAssessment[];snapshot:string;at:string}|null>(null)
  const snapshot=JSON.stringify(analysisInput(plan.goals)), stale=!!analysis&&analysis.snapshot!==snapshot
  useEffect(()=>{fetch('/api/personal/analysis').then(r=>r.json()).then(v=>setConfigured(v.configured===true)).catch(()=>setConfigured(false))},[])
  async function evaluate(){
    setBusy(true);setError('')
    try{
      const response=await fetch('/api/personal/analysis',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({consent,plan:{...plan,goals:plan.goals.map(g=>({...g,evidence:[],note:g.note+'\n'+(g.evidence || []).map(e=>`${e.kind==='image'?'사진':'영상'} 설명: ${e.caption}`).join('\n')}))}})})
      const data=await response.json();if(!response.ok)throw new Error(data.error || '분석을 완료하지 못했습니다.')
      setAnalysis({goals:data.goals,snapshot,at:data.at})
    }catch(e){setError(e instanceof Error?e.message:'연결을 확인해 주세요.')}
    finally{setBusy(false)}
  }
  const maxSeconds=Math.max(1,...plan.goals.map(g=>g.personalTimer?.seconds || 0))
  return <section className="personal-performance" aria-label="목표별 성과 분석">
    <div className="performance-heading"><div><span className="performance-eyebrow">MY WORK INSIGHTS</span><h2>목표별로 얼마나 진행했을까요?</h2><p>측정한 시간과 AI의 결과 평가를 함께 확인하세요.</p></div><span className="performance-badge">Gemini Flash</span></div>
    <div className="performance-goals">{plan.goals.map((g,i)=>{const evaluation=!stale?analysis?.goals.find(a=>a.index===i):undefined;const seconds=g.personalTimer?.seconds || 0;return <article key={i}>
      <h3><span>{String(i+1).padStart(2,'0')}</span>{g.title || '목표 이름을 입력해 주세요'}</h3>
      <div className="performance-metric"><span>측정 시간</span><strong>{timerText(seconds)}</strong></div><div className="performance-track" role="img" aria-label={`측정 시간 ${timerText(seconds)}. 가장 오래 측정한 목표와 비교`}><span style={{width:`${seconds/maxSeconds*100}%`}}/></div>
      <p className="performance-count">연결 활동 메모 {(g.note.match(/\[도구 활동\]/g)||[]).length}건 · 첨부 {g.evidence?.length || 0}개</p>
      <div className="performance-score"><span>AI 추정 달성률</span><strong>{evaluation?.score!=null?`${evaluation.score}%`:'평가 전 / 근거 부족'}</strong></div>
      {evaluation?.score!=null&&<div className="performance-track score" role="img" aria-label={`AI 추정 달성률 ${evaluation.score}%`}><span style={{width:`${evaluation.score}%`}}/></div>}
      {evaluation&&<div className="performance-reason"><small>근거 신뢰도 · {{low:'낮음',medium:'보통',high:'높음'}[evaluation.confidence]}</small><p>{evaluation.reason}</p><p><b>다음 할 일</b> {evaluation.next}</p></div>}
    </article>})}</div>
    <p className="performance-help">시간 그래프는 목표 간 측정 시간 비교입니다. AI 점수는 제출한 설명에 따른 추정이며, 성과 검증이나 지원금 지급 판단이 아닙니다. 사진·영상 원본과 링크 내용은 이번 분석에서 읽지 않습니다.</p>
    {stale&&<p role="status">기록이 바뀌었습니다. 최신 결과로 다시 분석해 주세요.</p>}
    {analysis&&!stale&&<p className="performance-help">분석 시각 {new Date(analysis.at).toLocaleString('ko-KR')} · 화면을 새로 열면 다시 분석할 수 있습니다.</p>}
    <label className="performance-consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> 목표·결과·활동 메모·첨부 설명을 Google AI에 전송하는 데 동의합니다. 무료 API에서는 전송 내용이 제품 개선에 사용될 수 있습니다. 회사 기밀은 제외해 주세요.</label>
    <button className="performance-analyze" disabled={!configured||!consent||busy||!plan.goals.some(g=>g.title.trim())} onClick={evaluate}>{busy?'결과를 분석하는 중…':'AI로 결과 분석하기'}</button>
    {configured===false&&<p role="status">이 서버에 AI 연결 설정이 없습니다. Vercel에 등록된 키는 로컬에 자동 적용되지 않습니다.</p>}
    {error&&<p role="alert">{error}</p>}
  </section>
}
