const test = require('node:test'), assert = require('node:assert/strict'), vm = require('node:vm'), fs = require('node:fs'), ts = require('typescript')
const exportsForTest = {}
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/personal-plan.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText, {exports:exportsForTest, URL})
const { restorePersonalPlan, personalReportReady } = exportsForTest
const sample = () => ({title:'개인 업무',employee_name:'작성자',place:'집',start_date:'2026-10-07',end_date:'2026-10-08',goals:[{title:'초안',criteria:'3쪽 작성',due:'2026-10-08',expectedMinutes:60,actualMinutes:45,progress:75,note:'문구 작성',result:'2쪽 작성, 1쪽 남음',link:'https://example.com/document'}]})
test('personal backup restores records without company or review privileges', () => {
  const p = restorePersonalPlan({...sample(),company_id:'other',user_id:'other',status:'completed',feedback:'approved',history:[{action:'complete'}]})
  assert.equal(p.company_id,''); assert.equal(p.user_id,''); assert.equal(p.feedback,''); assert.equal(p.history.length,0); assert.equal(p.goals[0].progress,75); assert.equal(personalReportReady(p),true)
})
test('malformed backup cannot replace saved records', () => {
  for (const p of [null,{}, {...sample(),goals:[]}, {...sample(),goals:[{...sample().goals[0],progress:101}]}, {...sample(),goals:[{...sample().goals[0],note:3}]}]) assert.throws(() => restorePersonalPlan(p))
})
test('report rejects missing results, impossible dates and unsafe links; partial results allowed', () => {
  for (const change of [{result:''},{link:'javascript:alert(1)'},{due:'2026-10-09'},{actualMinutes:-1},{expectedMinutes:0}]) { const p=restorePersonalPlan(sample()); Object.assign(p.goals[0],change); assert.equal(personalReportReady(p),false) }
  const p=restorePersonalPlan(sample()); p.start_date='2026-02-30'; assert.equal(personalReportReady(p),false)
})
