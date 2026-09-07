export type Session = { kind: "work" | "rest"; start: string; end?: string };
export type Day = {
  date: string;
  place: string;
  goal: string;
  criteria: string;
  result: string;
  complete: boolean;
  before: string;
  after: string;
  recovery: string;
  sessions: Session[];
};
export type Expense = {
  id: string;
  date: string;
  shop: string;
  purpose: string;
  category: string;
  kind: string;
  yen: number;
  rate: number;
  actual: number | null;
  photo: string;
};
export type Note = {
  id: string;
  date: string;
  place: string;
  good: string;
  bad: string;
  idea: string;
  photo: string;
};
export type Trip = {
  version: 1;
  name: string;
  start: string;
  end: string;
  budget: number;
  rate: number;
  question: string;
  days: Day[];
  expenses: Expense[];
  notes: Note[];
  savedAt: string;
};
export const initialTrip = (): Trip => ({
  version: 1,
  name: "일본에서 일하고 쉬는 5일",
  start: "2026-09-12",
  end: "2026-09-16",
  budget: 420000,
  rate: 0,
  question: "목표한 일을 마친 뒤, 편하게 쉴 수 있는가?",
  days: [],
  expenses: [],
  notes: [],
  savedAt: "",
});
export function dates(start: string, end: string) {
  const a = Date.parse(start + "T00:00:00Z"),
    b = Date.parse(end + "T00:00:00Z");
  if (
    !Number.isFinite(a) ||
    !Number.isFinite(b) ||
    b < a ||
    b - a > 30 * 86400000
  )
    return [];
  return Array.from({ length: (b - a) / 86400000 + 1 }, (_, i) =>
    new Date(a + i * 86400000).toISOString().slice(0, 10),
  );
}
export const blankDay = (date: string): Day => ({
  date,
  place: "",
  goal: "",
  criteria: "",
  result: "",
  complete: false,
  before: "",
  after: "",
  recovery: "",
  sessions: [],
});
export const won = (e: Expense) => e.actual ?? Math.round(e.yen * e.rate);
export function minutes(
  sessions: Session[],
  kind: Session["kind"],
  now = Date.now(),
) {
  return Math.floor(
    sessions
      .filter((s) => s.kind === kind)
      .reduce(
        (sum, s) =>
          sum +
          Math.max(0, (s.end ? Date.parse(s.end) : now) - Date.parse(s.start)),
        0,
      ) / 60000,
  );
}
export function transition(
  day: Day,
  kind: Session["kind"] | "stop",
  now = new Date().toISOString(),
): Day {
  const sessions = day.sessions.map((s) => (s.end ? s : { ...s, end: now }));
  if (kind !== "stop") sessions.push({ kind, start: now });
  return { ...day, sessions };
}
const text = (x: unknown): x is string =>
  typeof x === "string" && x.length <= 12000000;
const amount = (x: unknown): x is number =>
  typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= 1e12;
const photo = (x: unknown) =>
  text(x) &&
  (x === "" || /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(x));
const score = (x: unknown) =>
  typeof x === "string" && ["", "1", "2", "3", "4", "5"].includes(x);
export function validTrip(x: any): x is Trip {
  if (
    !x ||
    x.version !== 1 ||
    !["name", "question", "savedAt"].every((k) => text(x[k])) ||
    !text(x.start) ||
    !text(x.end) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(x.start) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(x.end) ||
    !dates(x.start, x.end).length ||
    !amount(x.budget) ||
    !amount(x.rate)
  )
    return false;
  const ds = dates(x.start, x.end);
  if (
    ![x.days, x.expenses, x.notes].every(
      (v) => Array.isArray(v) && v.length <= 1000,
    )
  )
    return false;
  if (
    !x.days.every(
      (d: any) =>
        d &&
        ds.includes(d.date) &&
        ["place", "goal", "criteria", "result"].every((k) => text(d[k])) &&
        typeof d.complete === "boolean" &&
        [d.before, d.after, d.recovery].every(score) &&
        Array.isArray(d.sessions) &&
        d.sessions.length < 1000 &&
        d.sessions.every(
          (s: any) =>
            s &&
            ["work", "rest"].includes(s.kind) &&
            text(s.start) &&
            Number.isFinite(Date.parse(s.start)) &&
            (s.end === undefined ||
              (text(s.end) &&
                Number.isFinite(Date.parse(s.end)) &&
                Date.parse(s.end) >= Date.parse(s.start))),
        ),
    )
  )
    return false;
  if (
    new Set(x.days.map((d: Day) => d.date)).size !== x.days.length ||
    x.days.flatMap((d: Day) => d.sessions).filter((s: Session) => !s.end)
      .length > 1
  )
    return false;
  if (
    !x.expenses.every(
      (e: any) =>
        e &&
        ds.includes(e.date) &&
        ["id", "shop", "purpose", "category", "kind"].every((k) =>
          text(e[k]),
        ) &&
        amount(e.yen) &&
        amount(e.rate) &&
        (e.actual === null || amount(e.actual)) &&
        photo(e.photo),
    )
  )
    return false;
  if (
    !x.notes.every(
      (n: any) =>
        n &&
        ds.includes(n.date) &&
        ["id", "place", "good", "bad", "idea"].every((k) => text(n[k])) &&
        photo(n.photo),
    )
  )
    return false;
  return (
    new Set(x.expenses.map((e: Expense) => e.id)).size === x.expenses.length &&
    new Set(x.notes.map((n: Note) => n.id)).size === x.notes.length
  );
}
const DB = "workation-japan-lab-v1";
async function db() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore("trip");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export async function loadTrip(): Promise<Trip | null> {
  const d = await db();
  try {
    return await new Promise((resolve, reject) => {
      const r = d.transaction("trip").objectStore("trip").get("current");
      r.onsuccess = () =>
        r.result === undefined
          ? resolve(null)
          : validTrip(r.result)
            ? resolve(r.result)
            : reject(
                new Error(
                  "기존 기록을 읽을 수 없습니다. 백업 파일로 복원해 주세요.",
                ),
              );
      r.onerror = () => reject(r.error);
    });
  } finally {
    d.close();
  }
}
export async function saveTrip(value: Trip) {
  if (!validTrip(value))
    throw new Error("날짜·금액·기록 내용을 확인해 주세요.");
  const d = await db();
  try {
    await new Promise<void>((resolve, reject) => {
      const t = d.transaction("trip", "readwrite");
      t.objectStore("trip").put(value, "current");
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  } finally {
    d.close();
  }
}
