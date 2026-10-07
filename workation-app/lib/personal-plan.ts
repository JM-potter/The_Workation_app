import type { Goal, Plan } from './workation-plan'

export function restorePersonalPlan(value: unknown): Plan {
  const p = value as Record<string, unknown>
  const string = (v: unknown, max: number) => typeof v === 'string' && v.length <= max
  if (!p || !['title','employee_name','place','start_date','end_date'].every(k => string(p[k], 200)) || !Array.isArray(p.goals) || p.goals.length < 1 || p.goals.length > 20) throw new Error('Invalid backup')
  const goals: Goal[] = p.goals.map(g => {
    if (!g || !['title','criteria','due','note','result','link'].every(k => string(g[k], 4000)) || ![g.progress,g.actualMinutes,g.expectedMinutes].every(n => Number.isInteger(n) && n >= 0 && n <= 100000) || g.progress > 100) throw new Error('Invalid goal')
    if (g.personalTimer && (!Number.isFinite(g.personalTimer.seconds) || g.personalTimer.seconds < 0 || g.personalTimer.seconds > 6000000 || !Number.isInteger(g.personalTimer.sessions) || g.personalTimer.sessions < 0)) throw new Error('Invalid timer')
    if (g.evidence && (!Array.isArray(g.evidence) || g.evidence.length > 6 || !g.evidence.every((e:any) => e && typeof e.id === 'string' && /^[a-f0-9-]{36}$/i.test(e.id) && string(e.name,255) && string(e.caption,1000) && ['image','video'].includes(e.kind) && (!e.poster || (typeof e.poster === 'string' && e.poster.length <= 2000000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(e.poster)))))) throw new Error('Invalid evidence')
    return { ...(g.evidence ? {evidence:g.evidence.map((e:any)=>({id:e.id,name:e.name,kind:e.kind,caption:e.caption,...(e.poster?{poster:e.poster}:{})}))} : {}), ...(g.personalTimer ? { personalTimer: { seconds:g.personalTimer.seconds, sessions:g.personalTimer.sessions }, actualMinutes: Math.floor(g.personalTimer.seconds / 60) } : {}), title:g.title, criteria:g.criteria, due:g.due, note:g.note, result:g.result, link:g.link, progress:g.progress, actualMinutes:g.personalTimer ? Math.floor(g.personalTimer.seconds / 60) : g.actualMinutes, expectedMinutes:g.expectedMinutes }
  })
  // Company IDs and review state never come from imported data.
  return { ...(typeof p.region==='string' && p.region.length<20 ? {region:p.region} : {}), id:'', company_id:'', user_id:'', employee_name:p.employee_name as string, title:p.title as string, place:p.place as string, start_date:p.start_date as string, end_date:p.end_date as string, goals, status:'approved', feedback:'', version:1, history:[] }
}

export function personalReadiness(plan: Plan) {
  const date = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v
  const link = (v: string) => { if (!v) return true; try { const u = new URL(v); return ['http:','https:'].includes(u.protocol) && !!u.hostname } catch { return false } }
  const hasGoals=plan.goals.length>0
  return [
    {label:'계획 이름',done:!!plan.title.trim(),step:0},
    {label:'작성자',done:!!plan.employee_name.trim(),step:0},
    {label:'기간·목표 기한',done:date(plan.start_date)&&date(plan.end_date)&&plan.start_date<=plan.end_date&&hasGoals&&plan.goals.every(g=>date(g.due)&&g.due>=plan.start_date&&g.due<=plan.end_date),step:0},
    {label:'업무·완료 기준',done:hasGoals&&plan.goals.every(g=>!!g.title.trim()&&!!g.criteria.trim()&&Number.isInteger(g.expectedMinutes)&&g.expectedMinutes>0&&g.expectedMinutes<=100000),step:0},
    {label:'결과 설명·링크 확인',done:hasGoals&&plan.goals.every(g=>!!g.result.trim()&&link(g.link)&&Number.isInteger(g.actualMinutes)&&g.actualMinutes>=0&&g.actualMinutes<=100000&&Number.isInteger(g.progress)&&g.progress>=0&&g.progress<=100),step:2}
  ]
}
export function personalReportReady(plan: Plan): boolean {return personalReadiness(plan).every(item=>item.done)}
