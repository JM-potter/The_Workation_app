const test = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync(
  require("node:path").join(__dirname, "../lib/global-lab.ts"),
  "utf8",
);
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const sandbox = { exports: {} };
vm.runInNewContext(code, sandbox);
const { dates, blankDay, initialTrip, validTrip, transition, minutes, won } =
  sandbox.exports;
test("trip dates are inclusive and invalid/reversed/overlong ranges are rejected", () => {
  assert.equal(dates("2026-09-12", "2026-09-16").length, 5);
  assert.equal(dates("2026-09-16", "2026-09-12").length, 0);
  assert.equal(dates("2026-09-12", "2026-12-16").length, 0);
});
test("work → rest → resume preserves separate durations across a reload", () => {
  let d = transition(blankDay("2026-09-12"), "work", "2026-09-12T01:00:00Z");
  d = transition(d, "rest", "2026-09-12T03:00:00Z");
  d = JSON.parse(JSON.stringify(d));
  d = transition(d, "work", "2026-09-12T04:00:00Z");
  d = transition(d, "stop", "2026-09-12T04:30:00Z");
  assert.equal(minutes(d.sessions, "work"), 150);
  assert.equal(minutes(d.sessions, "rest"), 60);
  assert.equal(d.sessions.filter((s) => !s.end).length, 0);
});
test("actual billing overrides estimated conversion, including a zero refund", () => {
  assert.equal(won({ yen: 1000, rate: 9.5, actual: null }), 9500);
  assert.equal(won({ yen: 1000, rate: 9.5, actual: 9750 }), 9750);
  assert.equal(won({ yen: 1000, rate: 9.5, actual: 0 }), 0);
});
test("backup validator rejects corrupt data without overwriting stored records", () => {
  const t = initialTrip();
  assert.equal(validTrip(t), true);
  assert.equal(validTrip({ ...t, budget: -1 }), false);
  assert.equal(
    validTrip({
      ...t,
      days: [
        { ...blankDay(t.start), sessions: [{ kind: "work", start: "bad" }] },
      ],
    }),
    false,
  );
  assert.equal(
    validTrip({ ...t, days: [blankDay(t.start), blankDay(t.start)] }),
    false,
  );
  const e = {
    id: "a",
    date: t.start,
    shop: "店",
    purpose: "점심",
    category: "식비",
    kind: "동네 가게",
    yen: 1000,
    rate: 9.5,
    actual: null,
    photo: "",
  };
  assert.equal(validTrip({ ...t, expenses: [e] }), true);
  assert.equal(
    validTrip({ ...t, expenses: [{ ...e, photo: "javascript:alert(1)" }] }),
    false,
  );
  assert.equal(validTrip({ ...t, expenses: [e, e] }), false);
});
