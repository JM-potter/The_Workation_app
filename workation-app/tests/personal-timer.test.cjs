const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),ts=require('typescript')
const output={}
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/personal-timer.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:output})
test('timer counts wall time precisely without counting sleep or backwards clocks',()=>{
 const timer={seconds:59.5,sessions:2}
 assert.equal(output.addMeasuredTime(timer,1000,2500).seconds,61)
 assert.equal(output.addMeasuredTime(timer,1000,31000).seconds,59.5)
 assert.equal(output.addMeasuredTime(timer,2000,1000).seconds,59.5)
 assert.equal(output.timerText(3661),'01:01:01')
})
