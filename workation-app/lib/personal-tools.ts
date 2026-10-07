import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto'
export const providers = ['github', 'notion', 'slack'] as const
export type Provider = typeof providers[number]
export type ToolConnection = { token: string; userId?: string; label: string; expires: number }
export function toolConfig(provider: Provider) {
  const prefix = provider.toUpperCase()
  return { id: process.env[`${prefix}_CLIENT_ID`], secret: process.env[`${prefix}_CLIENT_SECRET`] }
}
export function connectionKey() {
  if(process.env.PERSONAL_CONNECTION_SECRET) {const key=Buffer.from(process.env.PERSONAL_CONNECTION_SECRET,'hex');if(key.length!==32)throw new Error('Invalid connection key');return key}
  const secret=process.env.NOTION_CLIENT_SECRET || process.env.SLACK_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET
  if(!secret)throw new Error('Connection secret missing')
  return createHash('sha256').update('the-workation:personal-connections:v1:').update(secret).digest()
}
export function seal(value: unknown) {
  const key = connectionKey()
  if (key.length !== 32) throw new Error('Connection secret missing')
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, iv)
  const content = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), content]).toString('base64url')
}
export function unseal<T>(value?: string): T | null {
  try {
    if (!value) return null
    const buffer = Buffer.from(value, 'base64url'), key = connectionKey()
    const decipher = createDecipheriv('aes-256-gcm', key, buffer.subarray(0,12)); decipher.setAuthTag(buffer.subarray(12,28))
    const data = JSON.parse(Buffer.concat([decipher.update(buffer.subarray(28)), decipher.final()]).toString())
    return data.expires > Date.now() ? data : null
  } catch { return null }
}
export function toolOrigin(request: Request) {
  if (process.env.PERSONAL_APP_URL) return new URL(process.env.PERSONAL_APP_URL).origin
  if (process.env.NODE_ENV === 'production') {
    const configured=process.env.NOTION_REDIRECT_URI || process.env.SLACK_REDIRECT_URI
    if(configured)return new URL(configured).origin
    if(process.env.VERCEL_PROJECT_PRODUCTION_URL)return new URL('https://'+process.env.VERCEL_PROJECT_PRODUCTION_URL).origin
    throw new Error('App URL missing')
  }
  const origin = new URL(request.url).origin
  if (!['localhost','127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('Invalid origin')
  return origin
}
export function callbackUrl(provider:Provider, origin:string) {
  const existing=process.env[provider.toUpperCase()+'_REDIRECT_URI']
  if(existing && new URL(existing).origin===origin)return existing
  return origin+'/api/personal/tools/'+provider+'/callback'
}
export const connectionCookie = (p: Provider) => `personal_tool_${p}`
export const cookieOptions = { httpOnly:true, secure:process.env.NODE_ENV === 'production', sameSite:'lax' as const, path:'/api' }

export type ToolActivity = { id:string; title:string; at:string; url:string; attribution:string }
async function json(url:string, init:RequestInit = {}) {
  const r = await fetch(url, {...init, cache:'no-store', signal:AbortSignal.timeout(15000)})
  if (!r.ok) throw new Error(r.status === 401 ? '인증이 만료됐습니다. 다시 연결해 주세요.' : r.status === 429 || r.status === 403 ? '조회 권한 또는 호출 제한을 확인해 주세요.' : '도구에서 기록을 가져오지 못했습니다.')
  const data = await r.json()
  if (data.ok === false) throw new Error('Slack 연결 권한을 확인하고 다시 연결해 주세요.')
  return data
}
export async function activity(provider:Provider, c:ToolConnection) {
  const since = Date.now() - 86400000
  const headers = {Authorization:`Bearer ${c.token}`}
  let items:ToolActivity[] = [], limited = false
  if (provider === 'github') {
    const events = await json(`https://api.github.com/users/${encodeURIComponent(c.label)}/events?per_page=100`, {headers:{...headers,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}})
    limited = events.length === 100
    items = events.filter((e:any) => e.actor?.login === c.label && ['PushEvent','PullRequestEvent','IssuesEvent','IssueCommentEvent','PullRequestReviewEvent','CreateEvent'].includes(e.type)).map((e:any) => ({id:e.id,title:`${e.repo.name} · ${e.type}`,at:e.created_at,url:e.payload?.pull_request?.html_url || e.payload?.issue?.html_url || `https://github.com/${e.repo.name}`,attribution:'연결한 GitHub 계정의 활동'}))
  } else if (provider === 'notion') {
    const pages = await json('https://api.notion.com/v1/search',{method:'POST',headers:{...headers,'Notion-Version':'2022-06-28','Content-Type':'application/json'},body:JSON.stringify({filter:{value:'page',property:'object'},sort:{direction:'descending',timestamp:'last_edited_time'},page_size:100})})
    limited = !!pages.has_more
    items = pages.results.map((p:any) => ({id:p.id,title:(Object.values(p.properties || {}) as any[]).find(v => v.type === 'title')?.title?.map((t:any) => t.plain_text).join('') || '제목 없는 문서',at:p.last_edited_time,url:p.url,attribution:c.userId && p.last_edited_by?.id === c.userId ? '연결한 계정의 최근 수정' : '공유 문서의 최근 수정 · 본인 작업 여부 확인 필요'}))
  } else {
    const data = await json(`https://slack.com/api/search.messages?${new URLSearchParams({query:'from:me',sort:'timestamp',sort_dir:'desc',count:'100'})}`,{headers})
    limited = data.messages?.paging?.pages > 1
    items = (data.messages?.matches || []).map((m:any) => ({id:m.ts,title:`#${m.channel?.name || '채널'} · 메시지 작성`,at:new Date(Number(m.ts)*1000).toISOString(),url:m.permalink,attribution:'연결한 Slack 계정의 활동 · 메시지 본문 미수집'}))
  }
  return {items:items.filter(i => Number.isFinite(Date.parse(i.at)) && Date.parse(i.at) >= since && Date.parse(i.at) <= Date.now()),limited,fetchedAt:new Date().toISOString(),pollSeconds:300}
}
