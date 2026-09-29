import type { Plan } from '@/lib/workation-plan'
import './workation-report.css'

export const duration = (minutes: number) => `${Math.floor(minutes / 60)}시간${minutes % 60 ? ` ${minutes % 60}분` : ''}`
export default function WorkationReport({ plan, unsaved }: { plan: Plan; unsaved: boolean }) {
  const submitted = [...plan.history].reverse().find(h => h.action === 'results')
  const reviewed = [...plan.history].reverse().find(h => h.action === 'complete')
  const resultReport = ['approved', 'submitted', 'rework', 'completed'].includes(plan.status)
  const state = unsaved ? '미저장 초안' : plan.status === 'completed' ? '검토 완료' : plan.status === 'submitted' ? '제출본 · 검토 대기' : '초안'
  return <article className="workation-report" aria-label="워케이션 공식 보고서">
    <header className="report-heading"><img src="/logo.png" alt="더 워케이션" /><span>THE WORKATION / {resultReport ? 'RESULT REPORT' : 'WORK PLAN'}</span></header>
    <h2>워케이션 {resultReport ? '업무 결과 보고서' : '업무 수행 계획서'}</h2>
    <p className="report-state">{state}</p>
    <dl className="report-info"><div><dt>건명</dt><dd>{plan.title || '미입력'}</dd></div><div><dt>작성자</dt><dd>{plan.employee_name || '미입력'}</dd></div><div><dt>수행 기간</dt><dd>{plan.start_date || '미입력'} ~ {plan.end_date || '미입력'}</dd></div><div><dt>수행 장소</dt><dd>{plan.place || '미입력'}</dd></div><div><dt>제출 일시</dt><dd>{submitted ? new Date(submitted.at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '미제출'}</dd></div><div><dt>검토 상태</dt><dd>{plan.status === 'completed' && reviewed ? `${reviewed.actor} · ${new Date(reviewed.at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}` : '검토 미완료'}</dd></div></dl>
    <h3>01. 수행 개요</h3>
    <div className="report-summary"><div><span>업무 목표</span><strong>{plan.goals.length}건</strong></div><div><span>계획 시간</span><strong>{duration(plan.goals.reduce((n, g) => n + g.expectedMinutes, 0))}</strong></div>{resultReport && <div><span>실제 수행 시간</span><strong>{duration(plan.goals.reduce((n, g) => n + g.actualMinutes, 0))}</strong></div>}</div>
    <h3>02. 목표별 {resultReport ? '수행 결과' : '수행 계획'}</h3>
    {plan.goals.map((goal, index) => <section key={index} className="report-goal"><h4>{String(index + 1).padStart(2, '0')}. {goal.title || '업무명 미입력'}</h4><dl><div><dt>완료 기준</dt><dd>{goal.criteria || '미입력'}</dd></div><div><dt>기한 / 계획 시간</dt><dd>{goal.due || '미입력'} / {duration(goal.expectedMinutes)}</dd></div>{resultReport && <><div><dt>진행률 / 수행 시간</dt><dd>{goal.progress}% (직원 기재) / {duration(goal.actualMinutes)}</dd></div><div><dt>수행 내용</dt><dd>{goal.note || '기재 없음'}</dd></div><div><dt>결과 및 미완료 사항</dt><dd>{goal.result || '기재 없음'}</dd></div><div><dt>결과물</dt><dd>{/^https?:\/\//i.test(goal.link) ? <a href={goal.link} target="_blank" rel="noopener noreferrer">{goal.link}</a> : '첨부 링크 없음'}</dd></div></>}</dl></section>)}
    <h3>03. 담당자 검토 의견</h3><p className="report-feedback">{plan.feedback || '검토 의견이 등록되지 않았습니다.'}</p>
    <footer>본 문서는 입력된 계획과 업무 기록을 바탕으로 작성되었습니다. 진행률은 직원 기재 값이며, 담당자의 검토 완료와 목표의 완전한 달성은 구분됩니다.</footer>
  </article>
}
