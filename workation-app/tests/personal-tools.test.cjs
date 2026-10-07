const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),ts=require('typescript'),crypto=require('node:crypto')
const exp={};const env={PERSONAL_CONNECTION_SECRET:crypto.randomBytes(32).toString('hex'),NODE_ENV:'development'}
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/personal-tools.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:exp,require:()=>crypto,Buffer,process:{env},URL,AbortSignal,fetch:async()=>({ok:true,json:async()=>({results:[{id:'page',properties:{},url:'https://notion.so/page',last_edited_time:new Date().toISOString(),last_edited_by:{id:'someone'}}],has_more:true})})})
test('encrypted connections reject tampering, wrong keys and expiration',()=>{
 const token=exp.seal({token:'private-access',expires:Date.now()+10000});assert.ok(!token.includes('private-access'));assert.equal(exp.unseal(token).token,'private-access');assert.equal(exp.unseal('bad'),null);assert.equal(exp.unseal(exp.seal({expires:Date.now()-1})),null);const old=env.PERSONAL_CONNECTION_SECRET;env.PERSONAL_CONNECTION_SECRET=crypto.randomBytes(32).toString('hex');assert.equal(exp.unseal(token),null);env.PERSONAL_CONNECTION_SECRET=old
})
test('shared Notion edits cannot be presented as personal work',async()=>{
 const result=await exp.activity('notion',{token:'test',userId:'me',label:'test',expires:Date.now()+10000});assert.equal(result.limited,true);assert.match(result.items[0].attribution,/本|본인 작업 여부 확인/);assert.ok(!JSON.stringify(result).includes('test'))
})
