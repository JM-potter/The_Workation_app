'use client'
import { useCallback, useRef, useState } from 'react'
import WorkationWorkspace from './WorkationWorkspace'
import type { Plan } from '@/lib/workation-plan'

function sample(): Plan {
  return {
    id: '11111111-1111-4111-8111-111111111111', company_id: 'preview-company', user_id: 'preview-employee', employee_name: '김직원',
    title: '강릉 서비스 기획 워케이션', place: '강릉 · 회사에서 준비한 업무 공간', start_date: '2026-10-05', end_date: '2026-10-07',
    status: 'draft', feedback: '', version: 1, history: [],
    goals: [{ title: '신규 서비스 소개 페이지 초안 완성', criteria: 'PC·모바일 화면을 포함한 초안을 만들고 검토 링크를 제출합니다.', due: '2026-10-07', expectedMinutes: 480, actualMinutes: 0, progress: 0, note: '', result: '', link: '' }],
  }
}

export default function WorkationPreview() {
  const plans = useRef<Plan[]>([sample()])
  const [role, setRole] = useState<'emp' | 'hr'>('emp')
  const [dirty, setDirty] = useState(false)
  const [generation, setGeneration] = useState(0)
  const request = useCallback(async (_url: string, init: RequestInit = {}) => {
    const actor = role === 'emp' ? '김직원' : '이담당'
    if (!init.method || init.method === 'GET') return { plans: structuredClone(plans.current.filter(p => role === 'emp' || p.status !== 'draft')), member: { role, name: actor } }
    const body = JSON.parse(String(init.body || '{}'))
    if (init.method === 'POST') {
      if (role !== 'emp') throw new Error('직원 화면에서 만들어 주세요.')
      const item = { ...sample(), id: crypto.randomUUID(), title: body.title, place: body.place, start_date: body.start_date, end_date: body.end_date, goals: body.goals }
      plans.current.unshift(item)
      return { plan: structuredClone(item) }
    }
    const plan = plans.current.find(p => p.id === body.id)
    if (!plan || body.version !== plan.version) throw new Error('새로고침 후 다시 시도해 주세요.')
    const transitions: Record<string, { role: string; from: string[]; to?: Plan['status'] }> = {
      save: { role: 'emp', from: ['draft', 'revision'] }, submit: { role: 'emp', from: ['draft', 'revision'], to: 'pending' },
      approve: { role: 'hr', from: ['pending'], to: 'approved' }, revise: { role: 'hr', from: ['pending'], to: 'revision' },
      record: { role: 'emp', from: ['approved', 'rework'] }, results: { role: 'emp', from: ['approved', 'rework'], to: 'submitted' },
      complete: { role: 'hr', from: ['submitted'], to: 'completed' }, rework: { role: 'hr', from: ['submitted'], to: 'rework' },
    }
    const transition = transitions[body.action]
    if (!transition || transition.role !== role || !transition.from.includes(plan.status)) throw new Error('현재 역할과 상태에서 처리할 수 없습니다.')
    if (['revise', 'rework'].includes(body.action) && !body.feedback?.trim()) throw new Error('수정할 내용을 입력해 주세요.')
    if (role === 'emp') {
      if (['save', 'submit'].includes(body.action)) Object.assign(plan, { title: body.title, place: body.place, start_date: body.start_date, end_date: body.end_date, goals: body.goals })
      else plan.goals = body.goals
    } else plan.feedback = body.feedback || ''
    plan.status = transition.to || plan.status
    plan.version++
    plan.history.push({ action: body.action, actor, at: new Date().toISOString(), note: role === 'hr' ? plan.feedback : '' })
    return { plan: structuredClone(plan) }
  }, [role])
  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <div className="bg-[#053f47] text-white px-5 py-4">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div><strong className="text-lg">사전 합의 기능 미리보기</strong><p className="text-sm mt-1 text-teal-100">예시 데이터입니다. 실제 회사에 전송되지 않으며, 브라우저를 새로고침하면 초기화됩니다.</p></div>
        <div className="flex flex-wrap gap-2">{([['emp', '① 직원 화면'], ['hr', '② 회사 담당자 화면']] as const).map(([value, label]) => <button key={value} disabled={dirty} aria-pressed={role === value} onClick={() => setRole(value)} className={`px-4 py-2 rounded-lg border disabled:opacity-50 ${role === value ? 'bg-white text-[#053f47]' : 'border-teal-700 text-white'}`}>{label}</button>)}<button disabled={dirty} className="px-3 py-2 text-sm underline disabled:opacity-50" onClick={() => { plans.current = [sample()]; setRole('emp'); setGeneration(v => v + 1) }}>처음부터</button></div>
      </div>
      <p className="max-w-6xl mx-auto text-sm mt-3 text-teal-100">{dirty ? '작성한 내용을 저장하면 역할을 전환할 수 있습니다.' : '직원: 예시 계획 확인 → 목표 승인 요청 / 담당자: 같은 계획을 승인하거나 수정 요청'}</p>
    </div>
    <WorkationWorkspace key={`${role}-${generation}`} preview request={request} onDirtyChange={setDirty} />
  </div>
}
