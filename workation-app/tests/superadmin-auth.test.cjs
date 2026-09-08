const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),ts=require('typescript')
function load(file,requires,env){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:k=>requires[k],Request,Response,fetch,process:{env},console});return exports}
function fixture(email='theworkation.kr@gmail.com'){
  let selected=''
  const db={auth:{getUser:async token=>({data:{user:token==='valid'?{id:'11111111-1111-4111-8111-111111111111',email}:null},error:token==='valid'?null:{}})},from(){const q={select(v){selected=v;return q},eq(){return q},then(resolve){resolve({data:[],error:null})}};return q}}
  const env={SUPABASE_SERVICE_ROLE_KEY:'test-only',SUPERADMIN_EMAIL:'theworkation.kr@gmail.com'}
  const helper=load('lib/server-membership.ts',{'@supabase/supabase-js':{createClient:()=>db}},env)
  const route=load('app/api/superadmin/pending/route.ts',{'@/lib/server-membership':helper,'next/server':{NextResponse:{json:(body,init)=>Response.json(body,init)}}},env)
  return {route,selected:()=>selected}
}
const req=token=>new Request('https://example.invalid/api/superadmin/pending',{headers:token?{Authorization:`Bearer ${token}`}:{}})
test('superadmin pending list requires a valid login',async()=>{const f=fixture();assert.equal((await f.route.GET(req(''))).status,401);assert.equal((await f.route.GET(req('invalid'))).status,401)})
test('other signed-in accounts cannot view HR applicants',async()=>{const f=fixture('other@example.invalid');assert.equal((await f.route.GET(req('valid'))).status,403)})
test('configured superadmin only receives the HR approval fields',async()=>{const f=fixture();const response=await f.route.GET(req('valid'));assert.equal(response.status,200);assert.equal(f.selected(),'id,name,email,company_name,status,phone_number')})
