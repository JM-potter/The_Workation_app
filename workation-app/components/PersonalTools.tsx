'use client'
import {useEffect,useRef,useState} from 'react'
import type {Goal} from '@/lib/workation-plan'
type Item={id:string;title:string;at:string;url:string;attribution:string}
type State={configured:boolean;connected:boolean;label?:string;items?:Item[];error?:string;fetchedAt?:string;limited?:boolean}
const tools=[['github','GitHub','코드·이슈 활동'],['notion','Notion','공유 문서의 최근 수정'],['slack','Slack','내 메시지 작성 기록']] as const
function ToolLogo({id}:{id:string}) {return <img src={`/tool-logos/${id}.svg`} alt="" aria-hidden="true" width={24} height={24} className="tool-logo"/>}
export default function PersonalTools({goals,attach,createDraft}:{createDraft:(item:Item)=>boolean;goals:Goal[];attach:(index:number,item:Item)=>boolean}) {
  const [states,setStates]=useState<Record<string,State>>({}),[target,setTarget]=useState(0),[busy,setBusy]=useState(false),[auto,setAuto]=useState(false)
  const [selected,setSelected]=useState('notion'),[notice,setNotice]=useState('')
  const loading=useRef(false)
  async function refresh() {
    if(loading.current)return
    loading.current=true
    if(document.hidden){loading.current=false;return}
    setBusy(true)
    await Promise.all(tools.map(async([id])=>{
      try {
        const status=await fetch(`/api/personal/tools/${id}/status`,{cache:'no-store'});if(!status.ok)throw new Error('연결 상태를 확인하지 못했습니다.')
        const state:State=await status.json()
        if(state.connected){const r=await fetch(`/api/personal/tools/${id}/activity`,{cache:'no-store'});const data=await r.json();if(!r.ok){state.error=data.error;if(r.status===401)state.connected=false;}else Object.assign(state,data)}
        setStates(s=>({...s,[id]:state}))
      }catch {setStates(s=>({...s,[id]:{configured:false,connected:false,error:'연결 상태를 확인하지 못했습니다. 다시 시도해 주세요.'}}))}
    }))
    setBusy(false);loading.current=false
  }
  useEffect(()=>{refresh()},[])
  useEffect(()=>{if(!auto)return;const id=setInterval(refresh,300000);return()=>clearInterval(id)},[auto])
  return <section className="personal-tool-panel"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-bold text-lg">도구에서 가져온 활동</h3><p className="text-sm text-slate-500 mt-2">최근 24시간 · 활동 내역은 작업 시간이나 성과 점수가 아닙니다.</p></div><button disabled={busy} onClick={refresh} className="border rounded-xl px-4 py-2">{busy?'가져오는 중…':'기록 새로고침'}</button></div><label className="block text-sm my-4"><input type="checkbox" checked={auto} onChange={e=>setAuto(e.target.checked)}/> 화면을 열어둔 동안 5분마다 갱신</label><nav className="tool-tabs" aria-label="활동 도구 선택">{tools.map(([id,name])=><button key={id} aria-pressed={selected===id} onClick={()=>setSelected(id)}><ToolLogo id={id}/><span>{name}<small>{states[id]?.connected?'연결됨':states[id]?.configured?'연결 가능':'설정 필요'}</small></span></button>)}</nav><label className="block text-sm mb-4">활동을 남길 업무<select className="border rounded-lg p-2 ml-3 max-w-full" value={target} onChange={e=>setTarget(Number(e.target.value))}>{goals.map((g,i)=><option key={i} value={i}>{g.title || `업무 ${i+1}`}</option>)}</select></label>{notice && <p role="status" className="text-sm text-[#056f7c] mb-4">{notice}</p>}<div className="tool-cards">{tools.map(([id,name,description])=>{const s=states[id];return <article hidden={selected!==id} key={id}><h4 className="tool-title font-bold"><ToolLogo id={id}/>{name}</h4><p className="text-sm text-slate-500 mt-1">{description}</p><p className="text-xs my-3">{!s?'확인 중…':s.error || (s.connected?`연결됨 · ${s.label}`:s.configured?'계정 연결 필요':'운영자 인증 설정 필요')}</p>{s?.connected?<button className="text-sm underline" onClick={async()=>{const r=await fetch(`/api/personal/tools/${id}/connection`,{method:'DELETE'});if(r.ok)setStates(old=>({...old,[id]:{...s,connected:false,items:[]}}));else setStates(old=>({...old,[id]:{...s,error:'연결 해제에 실패했습니다.'}}))}}>이 브라우저에서 연결 해제</button>:s?.configured?<a href={`/api/personal/tools/${id}/connect`} className="tool-connect">{name} 연결하기 →</a>:<p className="text-xs text-slate-500">기존 앱의 인증 정보와 콜백 주소 설정이 필요합니다.</p>}{s?.connected&&<><p className="text-xs text-slate-500 mt-3">{s.fetchedAt?`${new Date(s.fetchedAt).toLocaleTimeString('ko-KR')} 조회 · ${s.items?.length || 0}건`:'조회 대기'}{s.limited?' · 최근 일부 기록만 표시':''}</p>{s.items?.length===0&&!s.error&&<p className="text-sm mt-3">이 범위에서 가져온 기록이 없습니다.</p>}</>}{s?.items?.map(item=><div className="tool-activity" key={item.id}><strong>{item.title}</strong><small>{new Date(item.at).toLocaleString('ko-KR')} · {item.attribution}</small>{/^https?:\/\//i.test(item.url)&&<a href={item.url} target="_blank" rel="noopener noreferrer">원본 보기 ↗</a>}<button onClick={()=>setNotice(createDraft(item)?'업무 초안을 만들었습니다. 목표 정하기에서 확인해 주세요.':'이미 있는 초안이거나 업무가 20개입니다.')}>이 활동으로 업무 초안 만들기</button><button onClick={()=>setNotice(attach(target,item)?'선택한 업무 기록에 추가했습니다. 문서에도 반영됩니다.':'이미 추가된 기록이거나 메모 용량이 가득 찼습니다. 업무 기록을 확인해 주세요.')}>선택한 업무에 기록 추가</button></div>)}</article>})}</div><p className="text-xs text-slate-500 mt-3">Notion의 공유 문서 수정은 다른 사람이 작업한 것일 수 있습니다. GitHub 활동에는 반영 지연이 있을 수 있습니다. 연결 해제는 브라우저 인증을 지우며 서비스의 앱 권한 철회는 각 도구의 설정에서 진행하세요.</p></section>
}
