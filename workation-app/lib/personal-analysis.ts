import type { Goal } from './workation-plan'
export type GoalAssessment = { index:number; score:number|null; reason:string; next:string; confidence:'low'|'medium'|'high' }
export function analysisInput(goals:Goal[]) {
  return goals.map((g,index)=>({index,title:g.title,criteria:g.criteria,result:g.result,note:g.note,seconds:g.personalTimer?.seconds || 0,evidence:(g.evidence || []).map(e=>({kind:e.kind,caption:e.caption}))}))
}
export function validateAssessments(value:unknown, count:number):GoalAssessment[] {
  if(!Array.isArray(value)||value.length!==count)throw new Error('invalid evaluation')
  const seen=new Set<number>()
  return value.map(v=>{
    if(!v||!Number.isInteger(v.index)||v.index<0||v.index>=count||seen.has(v.index)||(v.score!==null&&(!Number.isInteger(v.score)||v.score<0||v.score>100))||!['low','medium','high'].includes(v.confidence)||typeof v.reason!=='string'||!v.reason.trim()||v.reason.length>1200||typeof v.next!=='string'||v.next.length>1200)throw new Error('invalid evaluation')
    seen.add(v.index);return {index:v.index,score:v.score,reason:v.reason,next:v.next,confidence:v.confidence}
  }).sort((a,b)=>a.index-b.index)
}
