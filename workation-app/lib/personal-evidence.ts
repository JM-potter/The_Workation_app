export type Evidence = { id:string; name:string; kind:'image'|'video'; caption:string; poster?:string }
export const evidenceTypes = ['image/jpeg','image/png','image/webp','video/mp4','video/webm']
function database():Promise<IDBDatabase> {
  return new Promise((resolve,reject) => {
    const request=indexedDB.open('workation-personal-evidence',1)
    request.onupgradeneeded=()=>request.result.createObjectStore('files')
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(new Error('파일 저장 공간을 열 수 없습니다.'))
  })
}
export async function saveEvidenceFiles(files:{id:string;blob:Blob}[]) {
  const db=await database()
  try { await new Promise<void>((resolve,reject)=>{const tx=db.transaction('files','readwrite');files.forEach(f=>tx.objectStore('files').put(f.blob,f.id));tx.oncomplete=()=>resolve();tx.onerror=()=>reject(new Error('파일 저장에 실패했습니다. 저장 공간을 확인해 주세요.'));tx.onabort=()=>reject(new Error('파일 저장이 중단됐습니다.'))}) } finally {db.close()}
}
export async function evidenceFile(id:string):Promise<Blob|undefined> {
  const db=await database()
  try {return await new Promise((resolve,reject)=>{const r=db.transaction('files').objectStore('files').get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(new Error('첨부 파일을 읽지 못했습니다.'))})} finally {db.close()}
}
export function dataUrl(blob:Blob):Promise<string> {return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(new Error('파일을 읽지 못했습니다.'));r.readAsDataURL(blob)})}
export async function videoPoster(file:Blob):Promise<string> {
  const url=URL.createObjectURL(file)
  try {return await new Promise((resolve,reject)=>{
    const v=document.createElement('video');v.muted=true;v.preload='auto';v.src=url
    const timeout=setTimeout(()=>{v.removeAttribute('src');v.load();reject(new Error('영상 미리보기를 만들지 못했습니다. MP4 또는 WebM 파일을 확인해 주세요.'))},12000)
    v.onerror=()=>{clearTimeout(timeout);reject(new Error('이 브라우저에서 재생 가능한 영상 파일을 사용해 주세요.'))}
    v.onloadeddata=()=>{try {const canvas=document.createElement('canvas');canvas.width=Math.min(v.videoWidth,1000);canvas.height=Math.round(canvas.width*v.videoHeight/v.videoWidth);canvas.getContext('2d')!.drawImage(v,0,0,canvas.width,canvas.height);clearTimeout(timeout);resolve(canvas.toDataURL('image/jpeg',.8))} catch {clearTimeout(timeout);reject(new Error('영상 대표 이미지를 만들지 못했습니다.'))}}
  })} finally {URL.revokeObjectURL(url)}
}
