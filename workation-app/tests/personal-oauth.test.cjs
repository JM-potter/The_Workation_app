const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),crypto=require('node:crypto')
function fixture(){
 const env={NODE_ENV:'production',NOTION_CLIENT_ID:'id',NOTION_CLIENT_SECRET:'notion-secret',NOTION_REDIRECT_URI:'https://example.com/api/auth/notion/callback',SLACK_CLIENT_ID:'id',SLACK_CLIENT_SECRET:'slack-secret',SLACK_REDIRECT_URI:'https://example.com/api/auth/slack/callback'}
 let calls=[]
 const fetch=async(url,init)=>{calls.push({url,init});return {ok:true,json:async()=>url.includes('slack')?{ok:true,authed_user:{access_token:'private-token',id:'me'},team:{name:'workspace'}}:{access_token:'private-token',workspace_name:'workspace',owner:{user:{id:'me'}}}}}
 const load=(file,requires)=>{const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:k=>requires[k],process:{env},URL,URLSearchParams,Buffer,AbortSignal,fetch});return exports}
 const result=(body,status=200,location)=>({body,status,location,cookies:{values:new Map(),set(name,value,options){this.values.set(name,{value,options})}}})
 const NextResponse={json:(body,init)=>result(body,init?.status),redirect:url=>result(null,307,String(url))}
 const lib=load('lib/personal-tools.ts',{'node:crypto':crypto})
 const route=load('app/api/personal/tools/[provider]/[action]/route.ts',{'next/server':{NextResponse},'node:crypto':crypto,'@/lib/personal-tools':lib})
 const request=(url,cookies={})=>({url,cookies:{get:name=>cookies[name]?{value:cookies[name]}:undefined,has:name=>!!cookies[name]},headers:{get:()=>null}})
 return {route,lib,calls,request,legacy:provider=>load(`app/api/auth/${provider}/callback/route.ts`,{'next/server':{NextResponse},'@/app/api/personal/tools/[provider]/[action]/route':route})}
}
test('personal Notion and Slack reuse registered callbacks and keep tokens server-side',async()=>{
 for(const provider of ['notion','slack']){
  const f=fixture(),params={provider,action:'connect'}
  const start=await f.route.GET(f.request(`https://example.com/api/personal/tools/${provider}/connect`),{params})
  const auth=new URL(start.location),name=`personal_tool_${provider}_state`,stateCookie=start.cookies.values.get(name)
  assert.equal(auth.searchParams.get('redirect_uri'),`https://example.com/api/auth/${provider}/callback`);assert.equal(stateCookie.options.httpOnly,true);assert.equal(stateCookie.options.path,'/api')
  const callback=await f.legacy(provider).GET(f.request(`https://example.com/api/auth/${provider}/callback?code=code&state=${auth.searchParams.get('state')}`,{[name]:stateCookie.value}))
  assert.equal(callback.location,`https://example.com/personal?tool_connected=${provider}`)
  assert.ok(!JSON.stringify(callback).includes('private-token'))
  assert.equal(f.lib.unseal(callback.cookies.values.get(`personal_tool_${provider}`).value).token,'private-token')
  assert.equal(f.calls.length,1)
 }
})
test('personal callback cannot fall through to legacy flow without valid state',async()=>{
 const f=fixture();const res=await f.legacy('notion').GET(f.request('https://example.com/api/auth/notion/callback?code=code&state=pw_forged'))
 assert.equal(res.location,'https://example.com/personal?tool_error=notion');assert.equal(f.calls.length,0)
 const status=await f.route.GET(f.request('https://example.com/api/personal/tools/notion/status'),{params:{provider:'notion',action:'status'}})
 assert.equal(status.body.configured,true);assert.equal(status.body.connected,false)
})
