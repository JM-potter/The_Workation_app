const test = require('node:test'), assert = require('node:assert/strict'), vm = require('node:vm'), fs = require('node:fs'), ts = require('typescript');
function load(file, requires) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports, require: k => requires[k], Request, Response, URL, fetch, process: { env: { SUPABASE_SERVICE_ROLE_KEY: 'test' } } });
  return exports;
}
const employee = { id: '11111111-1111-4111-8111-111111111111', company_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: '직원', email: 'employee@example.invalid', role: 'emp', status: 'approved' };
const hr = { ...employee, id: '22222222-2222-4222-8222-222222222222', role: 'hr', name: '담당자' };
const goal = { title: '소개 페이지', criteria: '모바일 초안 제출', due: '2026-10-03', expectedMinutes: 480, actualMinutes: 0, progress: 0, note: '', result: '', link: '' };
const draft = { title: '강릉 워케이션', place: '강릉', start_date: '2026-10-01', end_date: '2026-10-03', goals: [goal] };
function fixture() {
  let actor = employee, rows = [], writes = 0, conflict = false;
  const db = { auth: { getUser: async token => ({ data: { user: token === 'valid' ? { id: actor.id } : null }, error: null }) }, from(table) {
    const filters = []; let insert, update;
    const query = {
      select() { return query }, order() { return query }, eq(k, v) { filters.push(r => r[k] === v); return query }, neq(k, v) { filters.push(r => r[k] !== v); return query },
      insert(v) { insert = v; return query }, update(v) { update = v; return query },
      async maybeSingle() { return execute(true) }, async single() { return execute(true) }, then(resolve) { resolve(execute(false)) }
    };
    function execute(single) {
      if (table === 'users') return { data: { ...actor }, error: null };
      if (insert) { writes++; const row = { ...insert, id: '33333333-3333-4333-8333-333333333333', status: 'draft', version: 1, history: [], feedback: '' }; rows.push(row); return { data: row, error: null } }
      const matches = rows.filter(r => filters.every(f => f(r)));
      if (update) { if (conflict) return { data: null, error: null }; matches.forEach(r => Object.assign(r, update)); writes += matches.length; }
      return { data: single ? matches[0] || null : matches, error: null };
    }
    return query;
  } };
  const membership = load('lib/server-membership.ts', { '@supabase/supabase-js': { createClient: () => db } });
  const domain = load('lib/workation-plan.ts', { './server-membership': membership });
  const route = load('app/api/workation-plans/route.ts', { '@/lib/server-membership': membership, '@/lib/workation-plan': domain, 'next/server': { NextResponse: { json: (v, init) => Response.json(v, init) } } });
  async function call(method, body, token = 'valid') {
    const response = await route[method](new Request('https://example.invalid/api/workation-plans', { method, headers: token ? { Authorization: `Bearer ${token}` } : {}, ...(method === 'GET' ? {} : { body: JSON.stringify(body) }) }));
    return { status: response.status, body: await response.json() };
  }
  return { call, actor: v => { actor = v }, rows: () => rows, writes: () => writes, conflict: () => { conflict = true } };
}
test('employee and HR complete revision, approval, records, rework and review', async () => {
  const f = fixture(); let r = await f.call('POST', draft); assert.equal(r.status, 201); let p = r.body.plan;
  async function act(action, extras = {}) { const r = await f.call('PATCH', { ...draft, id: p.id, version: p.version, action, ...extras }); assert.equal(r.status, 200, JSON.stringify(r.body)); p = r.body.plan; }
  await act('submit'); assert.equal(p.status, 'pending'); f.actor(hr);
  await act('revise', { feedback: '완료 기준 보완' }); assert.equal(p.status, 'revision'); f.actor(employee);
  await act('submit'); f.actor(hr); await act('approve', { feedback: '' }); assert.equal(p.status, 'approved'); f.actor(employee);
  const goals = [{ ...goal, title: 'tampered', actualMinutes: 300, progress: 80, note: '초안 완성', result: '모바일 보완 필요', link: 'https://example.invalid/result' }];
  await act('record', { goals }); assert.equal(p.goals[0].title, goal.title);
  await act('results', { goals }); assert.equal(p.status, 'submitted'); f.actor(hr);
  await act('rework', { feedback: '모바일 화면 추가' }); f.actor(employee);
  await act('results', { goals: [{ ...goals[0], progress: 100, result: '모바일 초안 완성' }] }); f.actor(hr);
  await act('complete', { feedback: '확인했습니다.' }); assert.equal(p.status, 'completed'); assert.equal(p.history.length, 9);
});
test('anonymous, invalid token and unapproved members cannot access', async () => {
  const f = fixture(); for (const token of ['', 'invalid']) assert.equal((await f.call('GET', undefined, token)).status, 401);
  for (const actor of [{ ...employee, status: 'pending' }, { ...employee, company_id: null }, { ...employee, role: 'gov' }]) { f.actor(actor); assert.equal((await f.call('POST', draft)).status, 403) }
  assert.equal(f.writes(), 0);
});
test('company isolation and employee ownership apply to reads and writes', async () => {
  const f = fixture(), p = (await f.call('POST', draft)).body.plan;
  for (const actor of [{ ...hr, company_id: 'other-company' }, { ...employee, id: hr.id }]) {
    f.actor(actor); assert.deepEqual((await f.call('GET')).body.plans, []);
    assert.equal((await f.call('PATCH', { ...draft, id: p.id, version: 1, action: 'submit' })).status, 404);
  }
  assert.equal(f.writes(), 1);
});
test('role restrictions and transitions cannot be bypassed', async () => {
  const f = fixture(), p = (await f.call('POST', draft)).body.plan;
  assert.equal((await f.call('PATCH', { id: p.id, version: 1, action: 'approve', feedback: '' })).status, 403);
  assert.equal((await f.call('PATCH', { id: p.id, version: 1, action: 'results', goals: [goal] })).status, 409);
  f.actor(hr); assert.equal((await f.call('POST', draft)).status, 403);
  assert.equal((await f.call('PATCH', { id: p.id, version: 1, action: 'complete', feedback: '' })).status, 404);
});

test('HR cannot see or address unsubmitted drafts; submitted plans become visible', async () => {
  const f = fixture(); const p = (await f.call('POST', draft)).body.plan;
  f.actor(hr);
  assert.deepEqual((await f.call('GET')).body.plans, []);
  assert.equal((await f.call('PATCH', { id: p.id, version: 1, action: 'approve', feedback: '' })).status, 404);
  f.actor(employee);
  assert.equal((await f.call('GET')).body.plans.length, 1);
  assert.equal((await f.call('PATCH', { ...draft, id: p.id, version: 1, action: 'submit' })).status, 200);
  f.actor(hr);
  assert.equal((await f.call('GET')).body.plans[0].status, 'pending');
});
test('invalid date, zero time and invalid goal shape are rejected without writes', async () => {
  const f = fixture(); for (const input of [{ ...draft, start_date: '2026-02-30' }, { ...draft, end_date: '2026-09-30' }, { ...draft, goals: [null] }, { ...draft, goals: [{ ...goal, due: '2026-11-01' }] }, { ...draft, goals: [{ ...goal, expectedMinutes: 0 }] }]) assert.equal((await f.call('POST', input)).status, 400);
  assert.equal(f.writes(), 0);
});
test('stale revisions and atomic update conflicts do not overwrite changes', async () => {
  const f = fixture(), p = (await f.call('POST', draft)).body.plan;
  assert.equal((await f.call('PATCH', { ...draft, id: p.id, version: 0, action: 'submit' })).status, 409);
  f.conflict(); assert.equal((await f.call('PATCH', { ...draft, id: p.id, version: 1, action: 'submit' })).status, 409);
  assert.equal(f.rows()[0].status, 'draft'); assert.equal(f.writes(), 1);
});
test('result submission requires explanation and safe links; revision requires feedback', async () => {
  const f = fixture(); let p = (await f.call('POST', draft)).body.plan;
  p = (await f.call('PATCH', { ...draft, id: p.id, version: p.version, action: 'submit' })).body.plan; f.actor(hr);
  assert.equal((await f.call('PATCH', { id: p.id, version: p.version, action: 'revise', feedback: '' })).status, 400);
  p = (await f.call('PATCH', { id: p.id, version: p.version, action: 'approve', feedback: '' })).body.plan; f.actor(employee);
  for (const goals of [[goal], [{ ...goal, result: 'done', link: 'javascript:alert(1)' }], [{ ...goal, result: 'done', actualMinutes: -1 }]]) assert.equal((await f.call('PATCH', { id: p.id, version: p.version, action: 'results', goals })).status, 400);
});
