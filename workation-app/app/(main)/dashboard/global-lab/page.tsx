"use client";

import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
} from "react";
import Link from "next/link";
import {
  blankDay,
  dates,
  initialTrip,
  loadTrip,
  minutes,
  saveTrip,
  transition,
  validTrip,
  won,
  type Day,
  type Expense,
  type Note,
  type Trip,
} from "@/lib/global-lab";
import styles from "./trip.module.css";

const money = (n: number) => n.toLocaleString("ko-KR") + "원";
const dateLabel = (d: string) =>
  new Date(d + "T12:00:00+09:00").toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  });
const timeLabel = (d: string) =>
  new Date(d).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
const tabs = ["오늘의 기록", "영수증·예산", "현장 노트", "결과 보고서"];
const itinerary = [
  "숙소 · 업무 환경 세팅",
  "도심 · 공간 벤치마킹",
  "바다 · 업무와 휴식",
  "숲 · 회복 경험",
  "귀국 · 기록 마무리",
];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      {isValidElement(children)
        ? cloneElement(children as ReactElement<{ id?: string }>, { id })
        : children}
    </div>
  );
}
function download(text: string, name: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
async function readPhoto(file?: File): Promise<string> {
  if (!file) return "";
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error(
      "JPG·PNG·WebP 사진을 선택해 주세요. HEIC 사진은 JPG로 변환해 주세요.",
    );
  if (file.size > 8 * 1024 * 1024)
    throw new Error("사진은 8MB 이하로 선택해 주세요.");
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("사진을 읽지 못했습니다."));
    r.readAsDataURL(file);
  });
}
function PhotoInput({
  value,
  set,
  error,
  pending,
}: {
  value: string;
  set: (s: string) => void;
  error: (s: string) => void;
  pending: (v: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <div className={styles.photoInput}>
      <Field label="사진 첨부 (선택 · 최대 8MB)">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={loading}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            setLoading(true);
            pending(true);
            try {
              set(await readPhoto(file));
            } catch (e) {
              error((e as Error).message);
            } finally {
              setLoading(false);
              pending(false);
            }
          }}
        />
      </Field>
      {loading && <p>사진을 읽고 있습니다…</p>}
      {value && (
        <>
          <img src={value} alt="첨부 사진 미리보기" />
          <button type="button" onClick={() => set("")}>
            사진 제거
          </button>
        </>
      )}
    </div>
  );
}

export default function GlobalLab() {
  const [trip, setTrip] = useState<Trip>(initialTrip);
  const [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [fatal, setFatal] = useState(false);
  const [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [offline, setOffline] = useState(false);
  const [tab, setTab] = useState(0),
    [selected, setSelected] = useState("2026-09-12"),
    [setup, setSetup] = useState(false);
  const [day, setDay] = useState<Day>(blankDay(selected)),
    [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false),
    busyRef = useRef(false),
    draftRef = useRef(false);
  const [clock, setClock] = useState(Date.now());
  const [editExpense, setEditExpense] = useState<Expense | null>(null),
    [receipt, setReceipt] = useState(""),
    [notePhoto, setNotePhoto] = useState("");
  const [formKey, setFormKey] = useState(0),
    [noteKey, setNoteKey] = useState(0);
  const [offlineReady, setOfflineReady] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const tripRef = useRef(trip);
  useEffect(() => {
    loadTrip()
      .then((value) => {
        if (value) {
          tripRef.current = value;
          setTrip(value);
          setSelected(value.start);
          setDay(
            value.days.find((d) => d.date === value.start) ||
              blankDay(value.start),
          );
        }
      })
      .catch((e) => {
        setFatal(true);
        setError(
          "기기 저장소를 열지 못했습니다. 일반 브라우저에서 다시 열어 주세요. " +
            (e as Error).message,
        );
      })
      .finally(() => setReady(true));
    const network = () => setOffline(!navigator.onLine);
    network();
    window.addEventListener("online", network);
    window.addEventListener("offline", network);
    const timer = setInterval(() => setClock(Date.now()), 15000);
    const before = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current || busyRef.current || draftRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", before);
    const swMessage = (e: MessageEvent) => {
      if (e.data?.type === "TRIP_OFFLINE_READY") setOfflineReady(true);
    };
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.addEventListener("message", swMessage);
      navigator.serviceWorker
        .register("/global-lab-sw.js", { scope: "/dashboard/global-lab" })
        .then((reg) => {
          const prepare = () => {
            const worker = reg.active;
            if (worker)
              worker.postMessage({
                type: "PREPARE_TRIP",
                assets: performance
                  .getEntriesByType("resource")
                  .map((r) => r.name)
                  .filter(
                    (url) =>
                      new URL(url).origin === location.origin &&
                      new URL(url).pathname.startsWith("/_next/static/"),
                  ),
              });
          };
          if (reg.active) prepare();
          else {
            const worker = reg.installing || reg.waiting;
            worker?.addEventListener("statechange", () => {
              if (worker.state === "activated") prepare();
            });
          }
        })
        .catch(() => {});
    }
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", network);
      window.removeEventListener("offline", network);
      window.removeEventListener("beforeunload", before);
      navigator.serviceWorker?.removeEventListener("message", swMessage);
    };
  }, []);
  function markDirty(v: boolean) {
    dirtyRef.current = v;
    setDirty(v);
  }
  function changeDay(next: Day) {
    setDay(next);
    markDirty(true);
  }
  async function persist(next: Trip) {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const value = { ...next, savedAt: new Date().toISOString() };
      await saveTrip(value);
      tripRef.current = value;
      setTrip(value);
      setMessage("이 기기에 저장했습니다.");
      return true;
    } catch (e) {
      setError(
        "저장하지 못했습니다. 화면을 닫지 말고 사진 용량이나 기기 저장 공간을 확인해 주세요. " +
          (e as Error).message,
      );
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function storeDay(next = day) {
    if (
      next.complete &&
      (!next.goal.trim() || !next.criteria.trim() || !next.result.trim())
    ) {
      setError("목표 완료를 확인하려면 목표·완료 기준·결과물을 적어 주세요.");
      return false;
    }
    const current = tripRef.current;
    if (
      await persist({
        ...current,
        days: [...current.days.filter((d) => d.date !== next.date), next].sort(
          (a, b) => a.date.localeCompare(b.date),
        ),
      })
    ) {
      setDay(next);
      markDirty(false);
      return true;
    }
    return false;
  }
  function discardDraft() {
    if (
      draftRef.current &&
      !window.confirm(
        "아직 저장하지 않은 영수증 또는 노트 입력이 있습니다. 입력을 버리고 이동할까요?",
      )
    )
      return false;
    draftRef.current = false;
    setReceipt("");
    setNotePhoto("");
    setEditExpense(null);
    setFormKey((k) => k + 1);
    setNoteKey((k) => k + 1);
    return true;
  }
  async function chooseDate(value: string) {
    if (value === selected) return;
    if (dirtyRef.current && !(await storeDay())) return;
    if (!discardDraft()) return;
    setSelected(value);
    setDay(
      tripRef.current.days.find((d) => d.date === value) || blankDay(value),
    );
  }
  async function chooseTab(value: number) {
    if (value === tab) return;
    if (dirtyRef.current && !(await storeDay())) return;
    if (!discardDraft()) return;
    setTab(value);
  }
  async function timerAction(kind: "work" | "rest" | "stop") {
    const other = trip.days.find(
      (d) => d.date !== selected && d.sessions.some((s) => !s.end),
    );
    if (other) {
      setError(
        `${dateLabel(other.date)}에 진행 중인 기록이 있습니다. 해당 날짜에서 먼저 종료해 주세요.`,
      );
      return;
    }
    if (kind === "work" && (!day.goal.trim() || !day.criteria.trim())) {
      setError("오늘의 목표와 완료 기준을 먼저 적어 주세요.");
      return;
    }
    await storeDay(transition(day, kind));
  }
  const allDates = dates(trip.start, trip.end),
    index = allDates.indexOf(selected);
  const active = day.sessions.find((s) => !s.end);
  const total = trip.expenses.reduce((s, e) => s + won(e), 0),
    local = trip.expenses
      .filter((e) => e.kind === "동네 가게")
      .reduce((s, e) => s + won(e), 0);
  async function exportBackup() {
    if (dirtyRef.current && !(await storeDay())) return;
    download(
      JSON.stringify(tripRef.current),
      `더워케이션-여행백업-${new Date().toISOString().slice(0, 10)}.json`,
    );
    setMessage(
      "사진을 포함한 백업 파일을 내려받았습니다. 파일을 별도 보관해 주세요.",
    );
  }
  if (!ready)
    return (
      <main className={styles.root}>
        <p className={styles.loading}>여행 기록을 불러오고 있습니다…</p>
      </main>
    );
  return (
    <main className={styles.root}>
      <div className={styles.noPrint}>
        <header className={styles.header}>
          <Link href="/my">← 더 워케이션</Link>
          <span>
            GLOBAL LAB <b>여행 실증용</b>
          </span>
          <button onClick={() => setSetup(!setup)} disabled={busy}>
            여행 설정
          </button>
        </header>
        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>JAPAN · WORK & REST</span>
            <h1>{trip.name}</h1>
            <p>
              {dateLabel(trip.start)} — {dateLabel(trip.end)} · 나만의 워케이션
              기록
            </p>
            <p className={styles.question}>{trip.question}</p>
          </div>
          <div className={styles.heroMark}>
            일을 마치고,
            <br />
            마음 편히 쉬기<span>THE WORKATION</span>
          </div>
        </section>
        <div className={styles.storage}>
          <span>
            {offline
              ? "인터넷 연결 확인 필요 · 기기 저장 가능"
              : "이 브라우저에만 저장 · 서버 전송 없음"}
            {trip.savedAt && ` · 최근 저장 ${timeLabel(trip.savedAt)}`}
          </span>
          <button disabled={busy || fatal} onClick={exportBackup}>
            사진 포함 백업 ↓
          </button>
        </div>
        <p className={styles.hint}>
          기기·브라우저를 바꾸거나 사이트 데이터를 지우면 기록이 보이지
          않습니다. 매일 백업 파일을 보관해 주세요.{" "}
          {offlineReady
            ? "오프라인 화면 준비 완료."
            : "출발 전 인터넷에 연결하여 이 화면을 열어 두세요."}
        </p>
        <div aria-live="polite" className={styles.feedback}>
          {message}
        </div>
        {error && (
          <div role="alert" className={styles.error}>
            {error}
          </div>
        )}
        {setup && (
          <section className={styles.card}>
            <h2>이번 여행 설정</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const start = String(f.get("start")),
                  end = String(f.get("end"));
                const ds = dates(start, end);
                if (!ds.length) {
                  setError("여행 기간은 시작일부터 최대 31일로 설정해 주세요.");
                  return;
                }
                if (
                  [...trip.days, ...trip.expenses, ...trip.notes].some(
                    (d) => !ds.includes(d.date),
                  )
                ) {
                  setError(
                    "기록이 있는 날짜는 여행 기간에서 제외할 수 없습니다.",
                  );
                  return;
                }
                if (dirtyRef.current && !(await storeDay())) return;
                if (
                  await persist({
                    ...tripRef.current,
                    name: String(f.get("name")),
                    question: String(f.get("question")),
                    start,
                    end,
                    budget: Number(f.get("budget")),
                    rate: Number(f.get("rate")),
                  })
                ) {
                  if (!ds.includes(selected)) {
                    setSelected(start);
                    setDay(blankDay(start));
                  }
                  setSetup(false);
                }
              }}
            >
              <fieldset disabled={busy || fatal}>
                <div className={styles.grid}>
                  <Field label="여행 이름">
                    <input
                      name="name"
                      defaultValue={trip.name}
                      required
                      maxLength={80}
                    />
                  </Field>
                  <Field label="이번에 확인할 질문">
                    <input
                      name="question"
                      defaultValue={trip.question}
                      maxLength={300}
                    />
                  </Field>
                  <Field label="시작일">
                    <input
                      type="date"
                      name="start"
                      defaultValue={trip.start}
                      required
                    />
                  </Field>
                  <Field label="종료일">
                    <input
                      type="date"
                      name="end"
                      defaultValue={trip.end}
                      required
                    />
                  </Field>
                  <Field label="여행 예산 (원)">
                    <input
                      type="number"
                      name="budget"
                      min="0"
                      max="100000000"
                      defaultValue={trip.budget}
                      required
                    />
                  </Field>
                  <Field label="기본 환율 (1엔당 원 · 직접 확인 후 입력)">
                    <input
                      type="number"
                      name="rate"
                      min="0"
                      max="1000"
                      step="0.0001"
                      defaultValue={trip.rate}
                      required
                    />
                  </Field>
                </div>
                <p className={styles.hint}>
                  기본 환율을 바꿔도 이미 저장한 지출의 환율은 유지됩니다. 0은
                  미설정 상태입니다.
                </p>
                <button className={styles.primary}>설정 저장</button>
              </fieldset>
            </form>
            <hr />
            <Field label="백업 파일로 복원 (현재 기록 교체)">
              <input
                type="file"
                accept=".json,application/json"
                disabled={busy || fatal}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  try {
                    if (file.size > 100 * 1024 * 1024)
                      throw new Error("백업 파일은 100MB 이하만 지원합니다.");
                    const value = JSON.parse(await file.text());
                    if (!validTrip(value))
                      throw new Error("올바른 여행 백업 파일이 아닙니다.");
                    if (
                      !window.confirm(
                        "현재 기기의 여행 기록을 백업 파일 내용으로 교체할까요? 저장하지 않은 입력도 교체됩니다.",
                      )
                    )
                      return;
                    if (await persist(value)) {
                      setSelected(value.start);
                      setDay(
                        value.days.find((d: Day) => d.date === value.start) ||
                          blankDay(value.start),
                      );
                      markDirty(false);
                      setEditExpense(null);
                      setReceipt("");
                      setNotePhoto("");
                      setFormKey((k) => k + 1);
                      setNoteKey((k) => k + 1);
                      setSetup(false);
                    }
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              />
            </Field>
          </section>
        )}
        <div className={styles.stats}>
          <div>
            <span>목표 완료</span>
            <strong>
              {trip.days.filter((d) => d.complete).length}
              <small> / {allDates.length}일</small>
            </strong>
          </div>
          <div>
            <span>기록한 지출 · 환산 포함</span>
            <strong>{money(total)}</strong>
          </div>
          <div>
            <span>{total > trip.budget ? "예산 초과" : "남은 예산"}</span>
            <strong className={total > trip.budget ? styles.red : ""}>
              {money(Math.abs(trip.budget - total))}
            </strong>
          </div>
        </div>
        <nav className={styles.tabs} aria-label="여행 기록 메뉴">
          {tabs.map((t, i) => (
            <button
              key={t}
              aria-current={tab === i ? "page" : undefined}
              className={tab === i ? styles.selected : ""}
              disabled={busy}
              onClick={() => chooseTab(i)}
            >
              {t}
            </button>
          ))}
        </nav>
        {tab !== 3 && (
          <div className={styles.days}>
            {allDates.map((d, i) => (
              <button
                key={d}
                disabled={busy}
                className={d === selected ? styles.daySelected : ""}
                onClick={() => chooseDate(d)}
              >
                <span>DAY {i + 1}</span>
                {dateLabel(d)}
              </button>
            ))}
          </div>
        )}
        {tab === 0 && (
          <section className={styles.card}>
            <div className={styles.sectionTitle}>
              <div>
                <span className={styles.eyebrow}>DAY {index + 1}</span>
                <h2>{itinerary[index] || "나의 워케이션"}</h2>
              </div>
              <span className={styles.pill}>
                {active
                  ? active.kind === "work"
                    ? "업무 진행 중"
                    : "휴식 중"
                  : "시작 전 · 기록 완료"}
              </span>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                storeDay();
              }}
            >
              <fieldset disabled={busy || fatal}>
                <div className={styles.grid}>
                  <Field label="오늘의 장소">
                    <input
                      value={day.place}
                      placeholder="예: 가마쿠라의 카페"
                      maxLength={150}
                      onChange={(e) =>
                        changeDay({ ...day, place: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="오늘의 목표">
                    <input
                      value={day.goal}
                      placeholder="예: 예약 화면 개선안 1장 작성"
                      maxLength={500}
                      onChange={(e) =>
                        changeDay({ ...day, goal: e.target.value })
                      }
                    />
                  </Field>
                </div>
                <Field label="어디까지 하면 완료인가요?">
                  <textarea
                    value={day.criteria}
                    placeholder="예: 이용 흐름 3단계와 개선 포인트 3개 정리"
                    maxLength={3000}
                    onChange={(e) =>
                      changeDay({ ...day, criteria: e.target.value })
                    }
                  />
                </Field>
                <div className={styles.timer}>
                  <div>
                    <span>기록한 업무</span>
                    <strong>
                      {minutes(day.sessions, "work", clock)}
                      <small>분</small>
                    </strong>
                  </div>
                  <div>
                    <span>기록한 휴식</span>
                    <strong>
                      {minutes(day.sessions, "rest", clock)}
                      <small>분</small>
                    </strong>
                  </div>
                  <div className={styles.actions}>
                    {active?.kind !== "work" && (
                      <button
                        type="button"
                        className={styles.primary}
                        onClick={() => timerAction("work")}
                      >
                        {day.sessions.length ? "업무 재개" : "업무 시작"}
                      </button>
                    )}
                    {active?.kind === "work" && (
                      <button
                        type="button"
                        className={styles.primary}
                        onClick={() => timerAction("rest")}
                      >
                        업무 종료 · 휴식 시작
                      </button>
                    )}
                    {active?.kind === "rest" && (
                      <button type="button" onClick={() => timerAction("stop")}>
                        휴식 종료
                      </button>
                    )}
                  </div>
                </div>
                <p className={styles.hint}>
                  버튼을 누른 실제 시각(일본 시간)을 기록합니다. 휴식 시작 후
                  휴대전화·메신저의 방해금지는 직접 설정해 주세요.
                </p>
                <Field label="결과물 링크 또는 완료한 내용">
                  <textarea
                    value={day.result}
                    maxLength={5000}
                    placeholder="문서 링크나 실제로 끝낸 내용을 남겨 주세요."
                    onChange={(e) =>
                      changeDay({ ...day, result: e.target.value })
                    }
                  />
                </Field>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={day.complete}
                    onChange={(e) =>
                      changeDay({ ...day, complete: e.target.checked })
                    }
                  />
                  완료 기준과 결과물을 확인했고, 오늘의 목표를 달성했어요.
                </label>
                <div className={styles.scores}>
                  {(
                    [
                      ["before", "업무 전 피로도"],
                      ["after", "업무 후 피로도"],
                      ["recovery", "전날 휴식 후 회복감"],
                    ] as const
                  ).map(([key, label]) => (
                    <Field key={key} label={label}>
                      <select
                        value={day[key]}
                        onChange={(e) =>
                          changeDay({ ...day, [key]: e.target.value })
                        }
                      >
                        <option value="">아직 기록 안 함</option>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n}
                            {n === 1
                              ? " · 매우 낮음"
                              : n === 5
                                ? " · 매우 높음"
                                : ""}
                          </option>
                        ))}
                      </select>
                    </Field>
                  ))}
                </div>
                <div className={styles.actions}>
                  <button className={styles.primary}>
                    {busy ? "저장 중…" : "오늘의 기록 저장"}
                  </button>
                  <span className={styles.hint}>
                    {dirty
                      ? "저장하지 않은 내용이 있습니다."
                      : "변경 내용을 저장하면 기록에 반영됩니다."}
                  </span>
                </div>
                <details>
                  <summary>시간 기록 확인·수정</summary>
                  <p className={styles.hint}>
                    종료 버튼을 늦게 눌렀다면 종료 시각을 수정하세요. 진행 중인
                    기록은 먼저 종료해 주세요.
                  </p>
                  {day.sessions.map((s, i) => (
                    <div className={styles.session} key={s.start}>
                      <span>
                        {s.kind === "work" ? "업무" : "휴식"} ·{" "}
                        {timeLabel(s.start)}
                      </span>
                      {s.end ? (
                        <label>
                          종료{" "}
                          <input
                            type="datetime-local"
                            aria-label={`${i + 1}번째 기록 종료 시각 (일본 시간)`}
                            value={new Date(Date.parse(s.end) + 9 * 3600000)
                              .toISOString()
                              .slice(0, 16)}
                            onChange={(e) => {
                              const end = Date.parse(
                                e.target.value + ":00+09:00",
                              );
                              if (
                                !Number.isFinite(end) ||
                                end < Date.parse(s.start) ||
                                end > Date.now()
                              ) {
                                setError(
                                  "종료 시각은 시작 이후, 현재 이전으로 입력해 주세요.",
                                );
                                return;
                              }
                              changeDay({
                                ...day,
                                sessions: day.sessions.map((v, j) =>
                                  j === i
                                    ? { ...v, end: new Date(end).toISOString() }
                                    : v,
                                ),
                              });
                            }}
                          />
                        </label>
                      ) : (
                        <span>진행 중</span>
                      )}
                    </div>
                  ))}
                </details>
              </fieldset>
            </form>
          </section>
        )}
        {tab === 1 && (
          <>
            <section className={styles.card}>
              <h2>{editExpense ? "지출 수정" : "영수증 한 장, 지출 한 건"}</h2>
              <p className={styles.hint}>
                일본어 영수증은 사진으로 보관하고 금액은 직접 확인합니다. 자동
                인식·자동 승인 기능은 사용하지 않습니다.
              </p>
              <form
                key={formKey}
                onChange={() => {
                  draftRef.current = true;
                }}
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  const rate = Number(f.get("rate"));
                  if (rate <= 0) {
                    setError("환산에 사용할 1엔당 환율을 입력해 주세요.");
                    return;
                  }
                  const item: Expense = {
                    id: editExpense?.id || crypto.randomUUID(),
                    date: selected,
                    shop: String(f.get("shop")),
                    purpose: String(f.get("purpose")),
                    category: String(f.get("category")),
                    kind: String(f.get("kind")),
                    yen: Number(f.get("yen")),
                    rate,
                    actual:
                      f.get("actual") === "" ? null : Number(f.get("actual")),
                    photo: receipt,
                  };
                  if (
                    await persist({
                      ...trip,
                      expenses: [
                        ...trip.expenses.filter((v) => v.id !== item.id),
                        item,
                      ],
                    })
                  ) {
                    draftRef.current = false;
                    setEditExpense(null);
                    setReceipt("");
                    setFormKey((k) => k + 1);
                  }
                }}
              >
                <fieldset disabled={busy || fatal || photoBusy}>
                  <div className={styles.grid}>
                    <Field label="가게 이름">
                      <input
                        name="shop"
                        defaultValue={editExpense?.shop}
                        required
                        maxLength={200}
                      />
                    </Field>
                    <Field label="사용 목적">
                      <input
                        name="purpose"
                        defaultValue={editExpense?.purpose}
                        placeholder="예: 원격 업무 공간 이용"
                        required
                        maxLength={500}
                      />
                    </Field>
                    <Field label="지출 분류">
                      <select
                        name="category"
                        defaultValue={editExpense?.category || "식비"}
                      >
                        {[
                          "식비",
                          "교통",
                          "업무 공간",
                          "숙박",
                          "개인 지출",
                          "기타",
                        ].map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="가게 유형 · 직접 확인">
                      <select
                        name="kind"
                        defaultValue={editExpense?.kind || "확인 안 됨"}
                      >
                        {["확인 안 됨", "동네 가게", "프랜차이즈"].map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="영수증 금액 (엔)">
                      <input
                        name="yen"
                        type="number"
                        min="1"
                        max="100000000"
                        step="1"
                        defaultValue={editExpense?.yen}
                        required
                      />
                    </Field>
                    <Field label="적용 환율 (1엔당 원)">
                      <input
                        name="rate"
                        type="number"
                        min="0.0001"
                        max="1000"
                        step="0.0001"
                        defaultValue={editExpense?.rate || trip.rate || ""}
                        placeholder="예: 100엔당 950원이면 9.5"
                        required
                      />
                    </Field>
                    <Field label="실제 원화 결제액 (선택)">
                      <input
                        name="actual"
                        type="number"
                        min="0"
                        max="100000000"
                        defaultValue={editExpense?.actual ?? ""}
                        placeholder="카드 청구액 확인 후 입력"
                      />
                    </Field>
                  </div>
                  <PhotoInput
                    value={receipt}
                    set={(v) => {
                      setReceipt(v);
                      draftRef.current = true;
                    }}
                    error={setError}
                    pending={setPhotoBusy}
                  />
                  <div className={styles.actions}>
                    <button className={styles.primary}>
                      {editExpense ? "수정 저장" : "지출 저장"}
                    </button>
                    {editExpense && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditExpense(null);
                          setReceipt("");
                          setFormKey((k) => k + 1);
                        }}
                      >
                        수정 취소
                      </button>
                    )}
                  </div>
                </fieldset>
              </form>
            </section>
            <section className={styles.card}>
              <h2>{dateLabel(selected)} 지출</h2>
              {!trip.expenses.some((e) => e.date === selected) && (
                <p className={styles.empty}>
                  첫 영수증을 남겨 보세요. 사진 없이도 지출을 기록할 수
                  있습니다.
                </p>
              )}
              {trip.expenses
                .filter((e) => e.date === selected)
                .map((e) => (
                  <article key={e.id} className={styles.entry}>
                    {e.photo && <img src={e.photo} alt={`${e.shop} 영수증`} />}
                    <div>
                      <h3>{e.shop}</h3>
                      <p>
                        {e.category} · {e.kind}
                      </p>
                      <p>{e.purpose}</p>
                      <strong>
                        ¥{e.yen.toLocaleString()} · {money(won(e))}
                      </strong>
                      <p className={styles.hint}>
                        {e.actual === null
                          ? `환산액 · 1엔 = ${e.rate}원`
                          : "실제 원화 결제액 반영"}
                      </p>
                      <div className={styles.actions}>
                        <button
                          disabled={busy}
                          onClick={() => {
                            setEditExpense(e);
                            setReceipt(e.photo);
                            setFormKey((k) => k + 1);
                          }}
                        >
                          수정
                        </button>
                        <button
                          disabled={busy}
                          onClick={async () => {
                            if (
                              window.confirm(
                                "이 지출과 영수증 사진을 삭제할까요?",
                              )
                            )
                              await persist({
                                ...trip,
                                expenses: trip.expenses.filter(
                                  (v) => v.id !== e.id,
                                ),
                              });
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
            </section>
          </>
        )}
        {tab === 2 && (
          <>
            <section className={styles.card}>
              <h2>다음 서비스에 가져갈 아이디어</h2>
              <p className={styles.hint}>
                입장·결제·공간·휴식 경험 중 기억할 것을 짧게 남겨 주세요.
              </p>
              <form
                key={noteKey}
                onChange={() => {
                  draftRef.current = true;
                }}
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  const item: Note = {
                    id: crypto.randomUUID(),
                    date: selected,
                    place: String(f.get("place")),
                    good: String(f.get("good")),
                    bad: String(f.get("bad")),
                    idea: String(f.get("idea")),
                    photo: notePhoto,
                  };
                  if (![item.good, item.bad, item.idea].some((x) => x.trim())) {
                    setError(
                      "관찰한 내용이나 적용할 아이디어를 하나 이상 적어 주세요.",
                    );
                    return;
                  }
                  if (
                    await persist({ ...trip, notes: [...trip.notes, item] })
                  ) {
                    draftRef.current = false;
                    setNotePhoto("");
                    setNoteKey((k) => k + 1);
                  }
                }}
              >
                <fieldset disabled={busy || fatal || photoBusy}>
                  <Field label="어디에서 경험했나요?">
                    <input
                      name="place"
                      required
                      maxLength={200}
                      placeholder="공간 또는 서비스 이름"
                    />
                  </Field>
                  {[
                    ["good", "편했던 점"],
                    ["bad", "불편했던 점"],
                    ["idea", "더 워케이션에 적용할 점"],
                  ].map(([name, label]) => (
                    <Field key={name} label={label}>
                      <textarea name={name} maxLength={5000} />
                    </Field>
                  ))}
                  <PhotoInput
                    value={notePhoto}
                    set={(v) => {
                      setNotePhoto(v);
                      draftRef.current = true;
                    }}
                    error={setError}
                    pending={setPhotoBusy}
                  />
                  <button className={styles.primary}>현장 노트 저장</button>
                </fieldset>
              </form>
            </section>
            <section className={styles.card}>
              <h2>이날 남긴 노트</h2>
              {!trip.notes.some((n) => n.date === selected) && (
                <p className={styles.empty}>
                  작은 불편 하나도 다음 개선의 출발점이 됩니다.
                </p>
              )}
              {trip.notes
                .filter((n) => n.date === selected)
                .map((n) => (
                  <article className={styles.entry} key={n.id}>
                    {n.photo && (
                      <img src={n.photo} alt={`${n.place} 현장 사진`} />
                    )}
                    <div>
                      <h3>{n.place}</h3>
                      <p>편했던 점: {n.good || "—"}</p>
                      <p>불편했던 점: {n.bad || "—"}</p>
                      <p>적용할 점: {n.idea || "—"}</p>
                      <button
                        disabled={busy}
                        onClick={async () => {
                          if (window.confirm("이 노트와 사진을 삭제할까요?"))
                            await persist({
                              ...trip,
                              notes: trip.notes.filter((v) => v.id !== n.id),
                            });
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </article>
                ))}
            </section>
          </>
        )}
      </div>
      <section
        className={`${styles.report} ${tab === 3 ? styles.reportVisible : ""}`}
      >
        <div className={styles.noPrint}>
          <div className={styles.sectionTitle}>
            <h2>여행을 한 장의 경험으로</h2>
            <button
              className={styles.primary}
              disabled={busy}
              onClick={() => window.print()}
            >
              인쇄 · PDF 저장
            </button>
          </div>
          <p className={styles.hint}>
            인쇄 창에서 ‘PDF로 저장’을 선택하세요. 사진은 보고서 뒤에
            첨부됩니다. 원본 기록은 ‘사진 포함 백업’으로 별도 보관하세요.
          </p>
        </div>
        <div className={styles.reportHead}>
          <span>THE WORKATION · FIELD REPORT</span>
          <h1>{trip.name}</h1>
          <p>
            {trip.start} — {trip.end}
          </p>
          <p>탐색 질문: {trip.question}</p>
        </div>
        <h2>활동 결과</h2>
        <p>
          목표 완료 {trip.days.filter((d) => d.complete).length}일 · 기록한 업무{" "}
          {trip.days.reduce(
            (s, d) => s + minutes(d.sessions, "work", clock),
            0,
          )}
          분 · 기록한 휴식{" "}
          {trip.days.reduce(
            (s, d) => s + minutes(d.sessions, "rest", clock),
            0,
          )}
          분
        </p>
        {trip.days.some((d) => d.sessions.some((s) => !s.end)) && (
          <p className={styles.red}>
            진행 중인 시간 기록이 포함되어 있습니다. 최종 제출 전 종료해 주세요.
          </p>
        )}
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>날짜·장소</th>
                <th>목표·결과</th>
                <th>업무 / 휴식</th>
                <th>피로 전→후 / 회복</th>
              </tr>
            </thead>
            <tbody>
              {allDates.map((date) => {
                const d =
                  trip.days.find((d) => d.date === date) || blankDay(date);
                return (
                  <tr key={date}>
                    <td>
                      {dateLabel(date)}
                      <br />
                      {d.place || "미기록"}
                    </td>
                    <td>
                      {d.goal || "목표 미기록"}
                      <br />
                      기준: {d.criteria || "—"}
                      <br />
                      {d.complete ? "완료 확인" : "완료 미확인"}
                      <br />
                      {d.result}
                    </td>
                    <td>
                      {minutes(d.sessions, "work", clock)}분 /{" "}
                      {minutes(d.sessions, "rest", clock)}분
                    </td>
                    <td>
                      {d.before || "—"}→{d.after || "—"} / {d.recovery || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className={styles.hint}>
          피로도·회복감은 1~5점의 자기 보고입니다. 시간은 버튼으로 기록한 경과
          시간이며, 업무 성과나 효과의 인과관계를 자동 판정하지 않습니다.
        </p>
        <h2>지출 내역</h2>
        <p>
          예산 {money(trip.budget)} · 총 지출 {money(total)} · 직접 분류한 동네
          가게 지출 {money(local)}
        </p>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>날짜·가게</th>
                <th>목적·분류</th>
                <th>엔화 / 환율</th>
                <th>원화</th>
              </tr>
            </thead>
            <tbody>
              {trip.expenses.map((e) => (
                <tr key={e.id}>
                  <td>
                    {e.date}
                    <br />
                    {e.shop}
                  </td>
                  <td>
                    {e.purpose}
                    <br />
                    {e.category} · {e.kind}
                  </td>
                  <td>
                    ¥{e.yen.toLocaleString()}
                    <br />
                    1엔 = {e.rate}원
                  </td>
                  <td>
                    {money(won(e))}
                    <br />
                    {e.actual === null ? "환산" : "실제 결제"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!trip.expenses.length && <p>등록한 지출이 없습니다.</p>}
        <p className={styles.hint}>
          환산 금액과 실제 결제액이 혼합될 수 있습니다. 지원금 정산 승인이나
          지역 경제 효과를 의미하지 않으며, 제출 전 증빙과 집행 기준을
          확인하세요.
        </p>
        <h2>벤치마킹과 개선 아이디어</h2>
        {trip.notes.length ? (
          trip.notes.map((n) => (
            <article className={styles.reportNote} key={n.id}>
              <h3>
                {n.date} · {n.place}
              </h3>
              <p>편했던 점: {n.good || "—"}</p>
              <p>불편했던 점: {n.bad || "—"}</p>
              <p>적용할 점: {n.idea || "—"}</p>
            </article>
          ))
        ) : (
          <p>등록한 현장 노트가 없습니다.</p>
        )}
        <div className={styles.attachments}>
          <h2>첨부 사진</h2>
          {trip.expenses
            .filter((e) => e.photo)
            .map((e) => (
              <figure key={e.id}>
                <figcaption>
                  {e.date} · {e.shop} · ¥{e.yen.toLocaleString()}
                </figcaption>
                <img src={e.photo} alt={`${e.shop} 영수증 원본`} />
              </figure>
            ))}
          {trip.notes
            .filter((n) => n.photo)
            .map((n) => (
              <figure key={n.id}>
                <figcaption>
                  {n.date} · {n.place}
                </figcaption>
                <img src={n.photo} alt={`${n.place} 현장 사진`} />
              </figure>
            ))}
        </div>
      </section>
      <footer className={styles.noPrint}>
        작게 기록하고, 충분히 쉬세요. <span>THE WORKATION · JAPAN LAB</span>
      </footer>
    </main>
  );
}
