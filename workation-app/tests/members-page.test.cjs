const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

// Exercise the real page after its asynchronous authenticated API response.
async function loadedPage(response, failure) {
  const states = [], effects = []
  let cursor = 0
  const mockReact = {
    ...React,
    useState(initial) {
      const index = cursor++
      if (!(index in states)) states[index] = initial
      return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value }]
    },
    useCallback: fn => fn,
    useEffect: fn => effects.push(fn),
  }
  const exports = {}
  const dependencies = {
    react: mockReact,
    'react/jsx-runtime': require('react/jsx-runtime'),
    'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
    '@/components/ui/Header': { default: () => null },
    '@/lib/membership-client': { memberRequest: async () => { if (failure) throw failure; return response } },
  }
  const source = ts.transpileModule(fs.readFileSync('app/(main)/members/page.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  vm.runInNewContext(source, { exports, Error, require: name => dependencies[name] })
  exports.default()
  effects[0]()
  await new Promise(resolve => setImmediate(resolve))
  cursor = 0
  return renderToStaticMarkup(exports.default())
}

test('authenticated HR response renders company name and pending employee without crashing', async () => {
  const html = await loadedPage({
    company: { id: 'company-1', name: '테스트 회사' },
    members: [{ id: 'employee-1', name: '테스트 직원', email: 'employee@example.invalid', company_name: '테스트 회사', status: 'pending' }],
  })
  assert.match(html, /테스트 회사/)
  assert.match(html, /테스트 직원/)
  assert.match(html, /가입 승인/)
  assert.doesNotMatch(html, /\[object Object\]/)
})

test('authenticated company with no employees renders empty list', async () => {
  const html = await loadedPage({ company: { id: 'company-1', name: '테스트 회사' }, members: [] })
  assert.match(html, /해당하는 직원 신청이 없습니다/)
})

test('API failure stays on page and shows a recoverable error', async () => {
  const html = await loadedPage(null, new Error('다시 로그인해 주세요.'))
  assert.match(html, /다시 로그인해 주세요/)
})

test('unexpected company response shows an error instead of crashing', async () => {
  const html = await loadedPage({ company: { id: 'company-1' }, members: [] })
  assert.match(html, /회사 및 직원 정보를 불러오지 못했습니다/)
})
