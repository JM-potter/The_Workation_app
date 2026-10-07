'use client'
import {useEffect,useState} from 'react'
import {evidenceFile,evidenceTypes,saveEvidenceFiles,videoPoster,type Evidence} from '@/lib/personal-evidence'

export function EvidencePreview({item,documentMode=false}:{item:Evidence;documentMode?:boolean}) {
  const [url,setUrl]=useState(''),[failed,setFailed]=useState(false)
  useEffect(()=>{let live=true,objectUrl='';evidenceFile(item.id).then(blob=>{if(!live)return;if(!blob){setFailed(true);return}objectUrl=URL.createObjectURL(blob);setUrl(objectUrl)}).catch(()=>{if(live)setFailed(true)});return()=>{live=false;if(objectUrl)URL.revokeObjectURL(objectUrl)}},[item.id])
  return <figure className="evidence-preview">{item.kind==='image' ? url ? <img src={url} alt={item.caption || item.name}/> : <p>{failed?'첨부 원본 없음 · 백업을 복원해 주세요.':'사진 불러오는 중…'}</p> : <><div className={documentMode?'evidence-video-screen':''}>{url ? <video src={url} controls preload="metadata" poster={item.poster} aria-label={item.caption || item.name}/> : <p>{failed?'영상 원본 없음 · 백업을 복원해 주세요.':'영상 불러오는 중…'}</p>}</div>{documentMode && item.poster && <img className="evidence-video-print" src={item.poster} alt={`영상 대표 이미지: ${item.caption || item.name}`}/>}</>}<figcaption><strong>{item.name}</strong>{item.caption && <p>{item.caption}</p>}{item.kind==='video' && documentMode && <small>영상은 화면에서 재생할 수 있습니다. PDF에는 대표 이미지와 설명이 포함됩니다.</small>}</figcaption></figure>
}

export default function PersonalEvidence({items,onChange,onBusy,disabled=false}:{disabled?:boolean;items:Evidence[];onChange:(items:Evidence[])=>void;onBusy:(busy:boolean)=>void}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState('')
  return <div className="evidence-editor"><label className={`evidence-upload ${busy?'opacity-50':''}`}><span aria-hidden="true">＋</span><strong>{busy?'자료 저장 중…':'사진·영상 추가'}</strong><small>JPG · PNG · WebP · MP4 · WebM / 파일당 20MB, 업무당 6개</small><input className="sr-only" type="file" accept={evidenceTypes.join(',')} disabled={disabled || busy || items.length>=6} onChange={async e=>{
    const file=e.target.files?.[0];e.target.value='';if(!file)return
    if(!evidenceTypes.includes(file.type)||file.size>20*1024*1024||!file.size){setError('지원하는 사진·영상 파일을 20MB 이하로 선택해 주세요.');return}
    setBusy(true);onBusy(true);setError('')
    try {const id=crypto.randomUUID(),kind=file.type.startsWith('image/')?'image':'video';const poster=kind==='video'?await videoPoster(file):undefined;await saveEvidenceFiles([{id,blob:file}]);onChange([...items,{id,name:file.name,kind,caption:'',...(poster?{poster}:{})}])}catch(e){setError(e instanceof Error?e.message:'자료를 저장하지 못했습니다.')}finally{setBusy(false);onBusy(false)}
  }}/></label>{error&&<p role="alert" className="text-red-700 text-sm">{error}</p>}<div className="evidence-grid">{items.map(item=><div key={item.id} className="evidence-card"><EvidencePreview item={item}/><label className="block text-sm mt-3">이 자료가 보여주는 결과<input className="mt-2 w-full border rounded-lg p-3" value={item.caption} maxLength={1000} placeholder="예: 완성한 모바일 화면 / 시연 영상" onChange={e=>onChange(items.map(x=>x.id===item.id?{...x,caption:e.target.value}:x))}/></label><button disabled={busy} className="text-sm text-red-700 mt-3" onClick={()=>{if(confirm('문서에서 이 첨부 자료를 제외할까요?'))onChange(items.filter(x=>x.id!==item.id))}}>문서에서 제외</button></div>)}</div></div>
}
