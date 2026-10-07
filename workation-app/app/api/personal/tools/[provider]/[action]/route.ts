import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, createHash } from 'node:crypto'
import { callbackUrl, connectionKey, activity, connectionCookie, cookieOptions, providers, seal, toolConfig, toolOrigin, unseal, type Provider, type ToolConnection } from '@/lib/personal-tools'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
const response = (body:unknown, status=200) => NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}})
export async function GET(req:NextRequest, {params}:{params:{provider:string;action:string}}) {
  if (!providers.includes(params.provider as Provider)) return response({error:'지원하지 않는 도구입니다.'},404)
  const p = params.provider as Provider, config = toolConfig(p), name = connectionCookie(p)
  const connection = unseal<ToolConnection>(req.cookies.get(name)?.value)
  if (params.action === 'status') {
    let configured=false;try{connectionKey();toolOrigin(req);configured=!!(config.id&&config.secret)}catch{}
    return response({configured,connected:!!connection,label:connection?.label})
  }
  try {
    if (params.action === 'activity') {
      if (!connection) return response({error:'계정을 먼저 연결해 주세요.'},401)
      return response(await activity(p,connection))
    }
    const origin = toolOrigin(req), redirect = callbackUrl(p,origin)
    if (!config.id || !config.secret) return response({error:'기존 연동 앱의 인증 설정이 필요합니다.'},503)
    if (params.action === 'connect') {
      const state = 'pw_'+randomBytes(32).toString('hex'), verifier = randomBytes(32).toString('base64url')
      const url = new URL(p === 'github' ? 'https://github.com/login/oauth/authorize' : p === 'notion' ? 'https://api.notion.com/v1/oauth/authorize' : 'https://slack.com/oauth/v2/authorize')
      url.searchParams.set('client_id',config.id);url.searchParams.set('redirect_uri',redirect);url.searchParams.set('state',state)
      if (p === 'slack') url.searchParams.set('user_scope','search:read')
      if (p === 'notion') {url.searchParams.set('response_type','code');url.searchParams.set('owner','user')}
      if (p === 'github') { url.searchParams.set('code_challenge',createHash('sha256').update(verifier).digest('base64url'));url.searchParams.set('code_challenge_method','S256') }
      const res = NextResponse.redirect(url);res.cookies.set(`${name}_state`,seal({state,verifier,expires:Date.now()+600000}),{...cookieOptions,maxAge:600});return res
    }
    if (params.action === 'callback') {
      const pending = unseal<{state:string;verifier:string;expires:number}>(req.cookies.get(`${name}_state`)?.value)
      const url = new URL(req.url), code = url.searchParams.get('code')
      const fail = () => {const r = NextResponse.redirect(`${origin}/personal?tool_error=${p}`);r.cookies.set(`${name}_state`,'',{...cookieOptions,maxAge:0});return r}
      if (!pending || pending.state !== url.searchParams.get('state') || !code || url.searchParams.get('error')) return fail()
      const tokenUrl = p === 'github' ? 'https://github.com/login/oauth/access_token' : p === 'notion' ? 'https://api.notion.com/v1/oauth/token' : 'https://slack.com/api/oauth.v2.access'
      const body = {client_id:config.id,client_secret:config.secret,code,redirect_uri:redirect,...(p === 'notion' ? {grant_type:'authorization_code'} : {}),...(p === 'github' ? {code_verifier:pending.verifier} : {})}
      const tokenResponse = await fetch(tokenUrl,{method:'POST',cache:'no-store',signal:AbortSignal.timeout(15000),headers:{Accept:'application/json','Content-Type':p === 'slack' ? 'application/x-www-form-urlencoded' : 'application/json',...(p === 'notion' ? {Authorization:`Basic ${Buffer.from(`${config.id}:${config.secret}`).toString('base64')}`} : {})},body:p === 'slack' ? new URLSearchParams(body) : JSON.stringify(p === 'notion' ? {grant_type:'authorization_code',code,redirect_uri:redirect} : body)})
      const data = await tokenResponse.json(), token = p === 'slack' ? data.authed_user?.access_token : data.access_token
      if (!tokenResponse.ok || typeof token !== 'string' || data.error || data.ok === false) return fail()
      let label = p === 'notion' ? data.workspace_name || 'Notion' : data.team?.name || 'Slack', userId = p === 'notion' ? data.owner?.user?.id : data.authed_user?.id
      if (p === 'github') {const r = await fetch('https://api.github.com/user',{headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal:AbortSignal.timeout(15000)});if (!r.ok) return fail();const user=await r.json();label=user.login;userId=String(user.id)}
      const maxAge = Math.min(604800,Math.max(60,Number(p === 'slack' ? data.authed_user?.expires_in : data.expires_in) || 604800))
      const res = NextResponse.redirect(`${origin}/personal?tool_connected=${p}`)
      res.cookies.set(name,seal({token,label,userId,expires:Date.now()+maxAge*1000}),{...cookieOptions,maxAge});res.cookies.set(`${name}_state`,'',{...cookieOptions,maxAge:0});return res
    }
    return response({error:'잘못된 경로입니다.'},404)
  } catch { return response({error:'연결 또는 조회에 실패했습니다. 인증 설정과 접근 권한을 확인해 주세요.'},502) }
}
export async function DELETE(req:NextRequest,{params}:{params:{provider:string;action:string}}) {
  if (!providers.includes(params.provider as Provider) || params.action !== 'connection') return response({error:'잘못된 경로입니다.'},404)
  if (req.headers.get('origin') !== toolOrigin(req)) return response({error:'요청 출처를 확인할 수 없습니다.'},403)
  const res = response({disconnected:true});res.cookies.set(connectionCookie(params.provider as Provider),'',{...cookieOptions,maxAge:0});return res
}
