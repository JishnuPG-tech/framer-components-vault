import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Bobob Fit Check Quiz (Dayrate FitCheck): 질문 5개 → 패키지별 가중 합산 → 결과 1개(+근소한 2위).
// 점수: 선택지마다 패키지별 가중치(0–3). 최고점이 결과, 동점이면 packages 배열 순서가 앞선 쪽.
// 가중치 키는 advisory·fractional·interim 고정(= Package 1/2/3). 패키지 id 와 같은 키가 있으면 그것을, 없으면 순서(1·2·3번째)로 찾는다.
// 상태는 step(0..n)·answers 뿐이고 결과는 URL 해시 `#fit=02130`(질문별 선택 번호, 0부터)로 직렬화한다. 잘못된 해시는 무시.
// 접근성: 질문마다 fieldset+legend, 선택지는 진짜 라디오(방향키), 진행/결과 머리글이 aria-live, 결과로 가면 결과 제목에 포커스.
// 색은 컨트롤(= 색 스타일 연결) 그대로 CSS 에 넣는다: 파싱 안 함.

export interface FitOption {
    label: string
    weights?: { advisory?: number; fractional?: number; interim?: number } & Record<string, number | undefined>
}
export interface FitQuestion {
    prompt: string
    options: FitOption[]
}
export interface FitPackage {
    id: string
    name: string
    summary?: string
    title?: string
    lead?: string
    why?: string[]
    from?: string
    bookHref?: string
}
export interface FitScore {
    totals: Record<string, number>
    best: string | null
    second: string | null
    margin: number
}

interface FitCheckProps {
    questions: FitQuestion[]
    packages: FitPackage[]
    resultLead: string
    bookLabel: string
    shareLabel: string
    compact: boolean
    startLabel: string
    startHref: string
    progressLabel: string
    nextLabel: string
    backLabel: string
    seeLabel: string
    errorText: string
    closeLabel: string
    copiedLabel: string
    retakeLabel: string
    closeMargin: number
    background: string
    text: string
    muted: string
    line: string
    accent: string
    buttonBackground: string
    buttonText: string
    titleFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    labelFont?: React.CSSProperties
    radius: number
    style?: React.CSSProperties
}

const HASH_KEY = "#fit="

// ---- 순수 함수 (하네스·단위 시험에서도 쓴다) ----

const SLOTS = ["advisory", "fractional", "interim"]

const weightOf = (option: FitOption | undefined, id: string, index: number): number => {
    const w = option && option.weights
    let raw = w ? w[id] : 0
    if (typeof raw !== "number" && w && index >= 0 && index < SLOTS.length) raw = w[SLOTS[index]]
    return typeof raw === "number" && isFinite(raw) ? Math.max(0, Math.min(3, raw)) : 0
}

/** 답(질문별 선택 번호, 없으면 -1)을 패키지별 합으로. 최고점 = best, 두 번째 = second(동점이면 배열 순서). */
export function score(answers: number[], questions: FitQuestion[], packages: FitPackage[]): FitScore {
    const totals: Record<string, number> = {}
    for (const p of packages) totals[p.id] = 0
    questions.forEach((q, i) => {
        const a = answers[i]
        const option = typeof a === "number" && a >= 0 ? q.options[a] : undefined
        if (!option) return
        packages.forEach((p, k) => {
            totals[p.id] += weightOf(option, p.id, k)
        })
    })
    let best: string | null = null
    for (const p of packages) if (best === null || totals[p.id] > totals[best]) best = p.id
    let second: string | null = null
    for (const p of packages) if (p.id !== best && (second === null || totals[p.id] > totals[second])) second = p.id
    const margin = best !== null && second !== null ? totals[best] - totals[second] : Infinity
    return { totals, best, second, margin }
}

/** `#fit=` + 선택 번호(36진 한 글자) 문자열. 답이 하나라도 비면 null. */
export function buildHash(answers: number[], questions: FitQuestion[]): string | null {
    if (answers.length !== questions.length) return null
    let out = HASH_KEY
    for (let i = 0; i < questions.length; i++) {
        const a = answers[i]
        if (!Number.isInteger(a) || a < 0 || a >= questions[i].options.length || a > 35) return null
        out += a.toString(36)
    }
    return out
}

/** 해시 → 답 배열. 길이·범위가 맞지 않거나 해시가 아니면 null (호출 쪽은 첫 질문으로). */
export function parseHash(hash: string, questions: FitQuestion[]): number[] | null {
    if (!hash || hash.slice(0, HASH_KEY.length) !== HASH_KEY || questions.length === 0) return null
    const body = hash.slice(HASH_KEY.length)
    if (body.length !== questions.length || !/^[0-9a-z]+$/.test(body)) return null
    const answers: number[] = []
    for (let i = 0; i < body.length; i++) {
        const a = parseInt(body[i], 36)
        if (!(a >= 0 && a < questions[i].options.length)) return null
        answers.push(a)
    }
    return answers
}

const fill = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (m, k) => (k in values ? String(values[k]) : m))

// 링크가 비어 있으면 null: 결과 화면에 예약 버튼을 그리지 않는다(단독 사용 때 죽은 링크를 만들지 않음)
const bookUrl = (pkg: FitPackage) => {
    const base = (pkg.bookHref || "").trim()
    if (!base) return null
    return `${base}${base.indexOf("?") >= 0 ? "&" : "?"}pkg=${encodeURIComponent(pkg.id)}`
}

const CSS = `
:where(.bfc){display:block;box-sizing:border-box;width:100%;container-type:inline-size;font-size:16px;line-height:1.6;color:var(--bfc-text);font-family:var(--bfc-body)}
:where(.bfc) *{box-sizing:border-box;margin:0}
:where(.bfc) fieldset{border:0;padding:0;min-width:0}
:where(.bfc) legend{padding:0;width:100%;float:left}
:where(.bfc) legend + *{clear:both}
.bfc-card{background:var(--bfc-bg);border:1px solid var(--bfc-line);border-radius:var(--bfc-radius);padding:clamp(20px,5cqi,40px);min-width:0}
.bfc-eyebrow{font-family:var(--bfc-label);font-size:13px;line-height:1.4;font-weight:500;letter-spacing:.02em;color:var(--bfc-muted)}
.bfc-bar{display:flex;gap:4px;margin:12px 0 28px}
.bfc-seg{flex:1;height:2px;background:var(--bfc-line)}
.bfc-seg[data-on="true"]{background:var(--bfc-accent)}
.bfc-legend{font-family:var(--bfc-title);font-weight:500;font-size:clamp(22px,3.8cqi,28px);line-height:1.25;color:var(--bfc-text);overflow-wrap:anywhere;margin-bottom:20px}
.bfc-opts{display:grid;grid-template-columns:1fr;gap:12px;min-width:0}
@container (min-width:620px){.bfc-opts{grid-template-columns:1fr 1fr}}
.bfc-opt{position:relative;display:block;min-width:0;cursor:pointer}
.bfc-in{position:absolute;opacity:0;width:1px;height:1px;margin:0;pointer-events:none}
.bfc-box{display:flex;gap:14px;align-items:flex-start;height:100%;min-height:56px;padding:16px 18px;border:1px solid var(--bfc-line);border-radius:var(--bfc-radius);background:transparent;transition:border-color .2s ease,background-color .2s ease}
.bfc-opt:hover .bfc-box{border-color:var(--bfc-muted)}
.bfc-dot{flex:none;position:relative;width:18px;height:18px;margin-top:3px;border:1.5px solid var(--bfc-text);border-radius:50%}
.bfc-dot::after{content:"";position:absolute;inset:3px;border-radius:50%;background:var(--bfc-text);transform:scale(0);transition:transform .15s ease}
.bfc-in:checked + .bfc-box{border-color:var(--bfc-text);background:color-mix(in srgb,var(--bfc-text) 6%,transparent)}
.bfc-in:checked + .bfc-box .bfc-dot::after{transform:scale(1)}
.bfc-in:focus-visible + .bfc-box{outline:2px solid var(--bfc-accent);outline-offset:2px}
.bfc-text{min-width:0;overflow-wrap:anywhere}
.bfc-error{margin-top:16px;padding:8px 0 8px 12px;border-left:3px solid var(--bfc-accent);font-size:15px;line-height:1.4;color:var(--bfc-text)}
.bfc-actions{display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px;margin-top:28px}
.bfc-btn{appearance:none;display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 24px;border:1px solid var(--bfc-btn);border-radius:var(--bfc-radius);background:var(--bfc-btn);color:var(--bfc-btn-text);font-family:var(--bfc-label);font-size:15px;line-height:1;font-weight:500;text-decoration:none;cursor:pointer;transition:opacity .2s ease,background-color .2s ease;max-width:100%;text-align:center}
.bfc-btn:hover{opacity:.9}
.bfc-btn:active{transform:scale(.98)}
.bfc-btn[data-kind="secondary"]{background:transparent;color:var(--bfc-text);border-color:var(--bfc-muted)}
.bfc-btn[data-kind="secondary"]:hover{opacity:1;border-color:var(--bfc-text)}
.bfc-btn[data-kind="link"]{background:transparent;color:var(--bfc-text);border-color:transparent;padding:0 4px;min-height:48px;text-decoration:underline;text-decoration-color:var(--bfc-accent);text-decoration-thickness:1px;text-underline-offset:4px}
.bfc-btn[data-kind="link"]:hover{opacity:1;text-decoration-thickness:2px}
.bfc-btn:focus-visible{outline:2px solid var(--bfc-accent);outline-offset:2px}
.bfc-title{font-family:var(--bfc-title);font-weight:500;font-size:clamp(30px,6.4cqi,44px);line-height:1.1;letter-spacing:-.015em;color:var(--bfc-text);margin-top:12px;overflow-wrap:anywhere}
.bfc-title:focus{outline:none}
.bfc-title:focus-visible{outline:2px solid var(--bfc-accent);outline-offset:6px}
.bfc-lead{font-size:clamp(16px,2.6cqi,19px);line-height:1.5;margin-top:16px;max-width:60ch}
.bfc-why{list-style:none;padding:0;margin:24px 0 0;display:grid;gap:10px}
.bfc-why li{position:relative;padding-left:20px;overflow-wrap:anywhere}
.bfc-why li::before{content:"";position:absolute;left:0;top:.75em;width:10px;height:2px;background:var(--bfc-accent)}
.bfc-price{margin-top:24px;padding-top:16px;border-top:1px solid var(--bfc-accent);font-family:var(--bfc-label);font-weight:500;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.bfc-close{margin-top:8px;color:var(--bfc-muted);font-size:15px}
.bfc-status{font-size:14px;color:var(--bfc-muted);min-height:1.5em;font-family:var(--bfc-label)}
@media (max-width:480px){.bfc-actions .bfc-btn:not([data-kind="link"]){width:100%}}
@media (prefers-reduced-motion:reduce){.bfc-box,.bfc-dot::after,.bfc-btn{transition:none}.bfc-btn:active{transform:none}}
`

// Framer 가 글꼴 컨트롤 기본값으로 넘기는 자리표시(Inter·Noto Serif + "… Placeholder")는 안 고른 것으로 보고 Dayrate 글꼴을 쓴다.
const FRAMER_DEFAULT_FONT = /^\s*"?(Inter|Noto Serif)"?\s*,\s*"[^"]* Placeholder"/
const family = (font: React.CSSProperties | undefined, fallback: string) => {
    const f = font && (font as any).fontFamily
    return f && !FRAMER_DEFAULT_FONT.test(String(f)) ? `${f}, ${fallback}` : fallback
}

const TITLE_FALLBACK = `"Newsreader", Georgia, "Times New Roman", serif`
const BODY_FALLBACK = `"Hanken Grotesk", system-ui, sans-serif`

const DEFAULT_QUESTIONS: FitQuestion[] = [
    {
        prompt: "Where are you right now?",
        options: [
            { label: "Still figuring out what I need", weights: { advisory: 3, fractional: 1, interim: 0 } },
            { label: "I have a plan and want a second opinion", weights: { advisory: 3, fractional: 2, interim: 0 } },
            { label: "Things work, but I need steady help", weights: { advisory: 1, fractional: 3, interim: 1 } },
            { label: "Something big has to get finished", weights: { advisory: 0, fractional: 1, interim: 3 } },
        ],
    },
    {
        prompt: "What is coming up next?",
        options: [
            { label: "A decision I am not sure about", weights: { advisory: 3, fractional: 1, interim: 0 } },
            { label: "A launch in the next few months", weights: { advisory: 1, fractional: 3, interim: 2 } },
            { label: "A deadline that cannot move", weights: { advisory: 0, fractional: 2, interim: 3 } },
            { label: "Nothing urgent, I want a plan", weights: { advisory: 3, fractional: 2, interim: 0 } },
        ],
    },
    {
        prompt: "How much time can you give it?",
        options: [
            { label: "A few hours in total", weights: { advisory: 3, fractional: 0, interim: 0 } },
            { label: "A few hours every week", weights: { advisory: 1, fractional: 3, interim: 1 } },
            { label: "Most of my week", weights: { advisory: 0, fractional: 1, interim: 3 } },
            { label: "I have no idea", weights: { advisory: 2, fractional: 2, interim: 1 } },
        ],
    },
    {
        prompt: "How long do you need help?",
        options: [
            { label: "A few sessions", weights: { advisory: 3, fractional: 0, interim: 0 } },
            { label: "Three to six months", weights: { advisory: 1, fractional: 2, interim: 3 } },
            { label: "A year or more", weights: { advisory: 1, fractional: 3, interim: 1 } },
            { label: "Until it is done", weights: { advisory: 0, fractional: 2, interim: 3 } },
        ],
    },
    {
        prompt: "Who will you work with on your side?",
        options: [
            { label: "Just me", weights: { advisory: 3, fractional: 2, interim: 0 } },
            { label: "Me and one teammate", weights: { advisory: 1, fractional: 3, interim: 1 } },
            { label: "A small team and a decision maker", weights: { advisory: 1, fractional: 3, interim: 2 } },
            { label: "A team that expects you to run it", weights: { advisory: 0, fractional: 1, interim: 3 } },
        ],
    },
]

const DEFAULT_PACKAGES: FitPackage[] = [
    {
        id: "advisory",
        name: "Advice",
        summary: "A few focused sessions to check your plan before you commit.",
        title: "Advice fits you",
        lead: "You know roughly where you are going. What you want is an expert second opinion before the big decisions.",
        why: [
            "Two or three sessions are enough to review the plan.",
            "You get a short written summary after each one.",
            "You keep the work; we check it.",
        ],
        from: "From $400 · 2 sessions",
        bookHref: "",
    },
    {
        id: "fractional",
        name: "Retainer",
        summary: "Steady monthly support for a growing project.",
        title: "A Retainer fits you",
        lead: "The work never really stops and you want someone who knows it. A fixed number of days every month keeps things moving.",
        why: [
            "One person who knows your context and priorities.",
            "A fixed monthly scope, so costs stay predictable.",
            "You can pause or stop with a month of notice.",
        ],
        from: "From $1,800 a month · 4 days",
        bookHref: "",
    },
    {
        id: "interim",
        name: "Project",
        summary: "Hands-on delivery of one big piece of work, start to finish.",
        title: "A Project fits you",
        lead: "There is one big thing to get done and a date it has to be done by. We take it on and see it through.",
        why: [
            "One scope, one price, one deadline.",
            "We work alongside your team, not around it.",
            "The last week is a handover so nothing gets lost.",
        ],
        from: "From $9,000 · fixed scope",
        bookHref: "",
    },
]

// 새로 넣은 인스턴스는 Framer 가 안쪽 배열(options·why)을 비워 저장하고 패키지 id 를 항목 id("default-item-0")로 바꾼다.
// 그대로면 빈 화면이라, 같은 순서의 기본 항목이 있으면 비어 있는 안쪽 배열·id 만 기본값으로 채운다. 값이 있는 항목은 그대로 둔다.
function withDefaults(questionsProp: FitQuestion[] | undefined, packagesProp: FitPackage[] | undefined): { questions: FitQuestion[]; packages: FitPackage[] } {
    const qs = Array.isArray(questionsProp) ? questionsProp : DEFAULT_QUESTIONS
    const ps = Array.isArray(packagesProp) ? packagesProp : DEFAULT_PACKAGES
    const questions = qs
        .map((q, i) => (q && !(Array.isArray(q.options) && q.options.length > 0) && DEFAULT_QUESTIONS[i] ? { ...q, options: DEFAULT_QUESTIONS[i].options } : q))
        .filter((q) => q && Array.isArray(q.options) && q.options.length > 0)
    const packages = ps
        .map((p, i) => {
            const d = DEFAULT_PACKAGES[i]
            if (!p || !d) return p
            const id = !p.id || /^default-item-\d+$/.test(p.id) ? d.id : p.id
            const why = Array.isArray(p.why) && p.why.length > 0 ? p.why : d.why
            return { ...p, id, why }
        })
        .filter((p) => p && p.id)
    return { questions, packages }
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 760
 * @framerIntrinsicHeight 520
 * @framerDisableUnlink
 */
export default function FitCheck(props: FitCheckProps) {
    const {
        questions: questionsProp = DEFAULT_QUESTIONS,
        packages: packagesProp = DEFAULT_PACKAGES,
        resultLead = "Your best fit",
        bookLabel = "Book a call about {Name}",
        shareLabel = "Copy result link",
        compact = false,
        startLabel = "Take the fit check",
        startHref = "",
        progressLabel = "Question {n} of {total}",
        nextLabel = "Next",
        backLabel = "Back",
        seeLabel = "See my result",
        errorText = "Choose one answer to continue.",
        closeLabel = "A close second: {Name}",
        copiedLabel = "Copied",
        retakeLabel = "Start again",
        closeMargin = 1,
        background = "#FAF8F2",
        text = "#12261E",
        muted = "#55594B",
        line = "rgba(18,38,30,0.16)",
        accent = "#B07A22",
        buttonBackground = "#12261E",
        buttonText = "#F2EEE3",
        titleFont,
        bodyFont,
        labelFont,
        radius = 2,
        style,
    } = props
    const { questions, packages } = withDefaults(questionsProp, packagesProp)
    const total = questions.length
    const isStatic = useIsStaticRenderer()
    const uid = React.useId()

    const [step, setStep] = React.useState(0)
    const [answers, setAnswers] = React.useState<number[]>([])
    const [error, setError] = React.useState(false)
    const [copied, setCopied] = React.useState(false)
    const focusTarget = React.useRef<"radio" | "result" | null>(null)
    const titleRef = React.useRef<HTMLHeadingElement | null>(null)
    const fieldsetRef = React.useRef<HTMLFieldSetElement | null>(null)
    const copyTimer = React.useRef<number | undefined>(undefined)

    const done = !compact && total > 0 && step >= total

    // 해시 복원: 마운트 때와 hashchange 때. 잘못된 해시는 무시하고 지금 화면 그대로(처음엔 첫 질문).
    const questionsKey = JSON.stringify(questions.map((q) => q.options.length))
    React.useEffect(() => {
        if (isStatic || compact || typeof window === "undefined") return
        const restore = () => {
            const parsed = parseHash(window.location.hash, questions)
            if (parsed) {
                setAnswers(parsed)
                setStep(total)
                setError(false)
            }
        }
        restore()
        window.addEventListener("hashchange", restore)
        return () => window.removeEventListener("hashchange", restore)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStatic, compact, questionsKey])

    React.useEffect(() => () => window.clearTimeout(copyTimer.current), [])

    // 질문/결과가 바뀐 직후 포커스: 결과 제목 또는 그 질문의 (선택된 또는 첫) 라디오.
    React.useEffect(() => {
        const target = focusTarget.current
        if (!target) return
        focusTarget.current = null
        if (target === "result") titleRef.current?.focus()
        else {
            const root = fieldsetRef.current
            const el = (root?.querySelector("input:checked") || root?.querySelector("input")) as HTMLInputElement | null
            el?.focus()
        }
    }, [step])

    const result = React.useMemo(() => (done ? score(answers, questions, packages) : null), [done, answers, questionsKey, packages])
    const bestPkg = result && result.best ? packages.find((p) => p.id === result.best) : undefined
    const secondPkg = result && result.second ? packages.find((p) => p.id === result.second) : undefined
    const showClose = !!(result && secondPkg && result.margin <= closeMargin)

    const choose = (index: number) => {
        setAnswers((prev) => {
            const next = prev.slice()
            while (next.length < total) next.push(-1)
            next[step] = index
            return next
        })
        setError(false)
    }

    const submit = (event: React.FormEvent) => {
        event.preventDefault()
        if ((answers[step] ?? -1) < 0) {
            setError(true)
            // step 이 안 바뀌니 직접 포커스: 첫 라디오로 가면 오류 문구(aria-describedby)가 읽힌다
            ;(fieldsetRef.current?.querySelector("input") as HTMLInputElement | null)?.focus()
            return
        }
        if (step + 1 >= total) {
            const full = questions.map((_, i) => answers[i] ?? -1)
            const hash = buildHash(full, questions)
            if (hash && typeof window !== "undefined") {
                try {
                    window.history.replaceState(null, "", window.location.pathname + window.location.search + hash)
                } catch (e) {
                    /* 해시를 못 쓰는 환경(샌드박스): 결과만 보여 준다 */
                }
            }
            focusTarget.current = "result"
            setStep(total)
        } else {
            focusTarget.current = "radio"
            setStep(step + 1)
        }
    }

    const back = () => {
        setError(false)
        focusTarget.current = "radio"
        setStep(Math.max(0, step - 1))
    }

    const retake = () => {
        try {
            window.history.replaceState(null, "", window.location.pathname + window.location.search)
        } catch (e) {
            /* 무시 */
        }
        setAnswers([])
        setError(false)
        setCopied(false)
        focusTarget.current = "radio"
        setStep(0)
    }

    const share = async () => {
        const hash = buildHash(questions.map((_, i) => answers[i] ?? -1), questions)
        const url = window.location.origin + window.location.pathname + window.location.search + (hash || "")
        let ok = false
        try {
            await navigator.clipboard.writeText(url)
            ok = true
        } catch (e) {
            try {
                const area = document.createElement("textarea")
                area.value = url
                area.setAttribute("readonly", "")
                area.style.position = "fixed"
                area.style.opacity = "0"
                document.body.appendChild(area)
                area.select()
                ok = document.execCommand("copy")
                document.body.removeChild(area)
            } catch (e2) {
                ok = false
            }
        }
        if (ok) {
            setCopied(true)
            window.clearTimeout(copyTimer.current)
            copyTimer.current = window.setTimeout(() => setCopied(false), 3000)
        }
    }

    const vars = {
        "--bfc-bg": background,
        "--bfc-text": text,
        "--bfc-muted": muted,
        "--bfc-line": line,
        "--bfc-accent": accent,
        "--bfc-btn": buttonBackground,
        "--bfc-btn-text": buttonText,
        "--bfc-radius": `${radius}px`,
        "--bfc-title": family(titleFont, TITLE_FALLBACK),
        "--bfc-body": family(bodyFont, BODY_FALLBACK),
        "--bfc-label": family(labelFont || bodyFont, BODY_FALLBACK),
        ...style,
    } as React.CSSProperties

    if (total === 0 || packages.length === 0) {
        return (
            <div className="bfc" style={vars} data-static={isStatic ? "true" : "false"}>
                <style>{CSS}</style>
            </div>
        )
    }

    const question = questions[Math.min(step, total - 1)]
    const qStep = Math.min(step, total - 1)
    const errId = `${uid}-err`
    const eyebrow = done ? resultLead : fill(progressLabel, { n: qStep + 1, total })
    const last = qStep + 1 >= total
    const selected = answers[qStep] ?? -1

    return (
        <div className="bfc" style={vars} data-static={isStatic ? "true" : "false"} data-state={done ? "result" : "question"} data-compact={compact ? "true" : "false"}>
            <style>{CSS}</style>
            <div className="bfc-card">
                <p className="bfc-eyebrow" aria-live="polite" aria-atomic="true" data-role="progress">
                    {eyebrow}
                </p>
                {!done ? (
                    <form onSubmit={compact ? (e) => e.preventDefault() : submit} noValidate>
                        <div className="bfc-bar" aria-hidden="true">
                            {questions.map((_, i) => (
                                <span key={i} className="bfc-seg" data-on={i <= qStep ? "true" : "false"} />
                            ))}
                        </div>
                        <fieldset ref={fieldsetRef} aria-describedby={error ? errId : undefined}>
                            <legend className="bfc-legend">{question.prompt}</legend>
                            <div className="bfc-opts">
                                {question.options.map((option, i) => (
                                    <label key={`${qStep}-${i}`} className="bfc-opt">
                                        <input
                                            className="bfc-in"
                                            type="radio"
                                            name={`${uid}-q${qStep}`}
                                            value={i}
                                            checked={selected === i}
                                            onChange={() => choose(i)}
                                            aria-describedby={error ? errId : undefined}
                                        />
                                        <span className="bfc-box">
                                            <span className="bfc-dot" aria-hidden="true" />
                                            <span className="bfc-text">{option.label}</span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                        {error ? (
                            <p className="bfc-error" id={errId} data-role="error">
                                {errorText}
                            </p>
                        ) : null}
                        <div className="bfc-actions">
                            {compact ? (
                                startHref ? (
                                    <a className="bfc-btn" href={startHref} data-role="start">
                                        {startLabel}
                                    </a>
                                ) : null
                            ) : (
                                <>
                                    {qStep > 0 ? (
                                        <button type="button" className="bfc-btn" data-kind="secondary" onClick={back} data-role="back">
                                            {backLabel}
                                        </button>
                                    ) : null}
                                    <button type="submit" className="bfc-btn" data-role="next">
                                        {last ? seeLabel : nextLabel}
                                    </button>
                                </>
                            )}
                        </div>
                    </form>
                ) : (
                    <div data-role="result" data-package={bestPkg ? bestPkg.id : ""}>
                        <h2 className="bfc-title" tabIndex={-1} ref={titleRef} data-role="result-title">
                            {bestPkg ? bestPkg.title || bestPkg.name : ""}
                        </h2>
                        {bestPkg && bestPkg.lead ? <p className="bfc-lead">{bestPkg.lead}</p> : null}
                        {bestPkg && bestPkg.why && bestPkg.why.length ? (
                            <ul className="bfc-why">
                                {bestPkg.why.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        ) : null}
                        {bestPkg && bestPkg.from ? <p className="bfc-price">{bestPkg.from}</p> : null}
                        {showClose && secondPkg ? (
                            <p className="bfc-close" data-role="close">
                                {fill(closeLabel, { Name: secondPkg.name })}
                            </p>
                        ) : null}
                        <div className="bfc-actions">
                            {bestPkg && bookUrl(bestPkg) ? (
                                <a className="bfc-btn" href={bookUrl(bestPkg) || undefined} data-role="book">
                                    {fill(bookLabel, { Name: bestPkg.name })}
                                </a>
                            ) : null}
                            <button type="button" className="bfc-btn" data-kind="secondary" onClick={share} data-role="share">
                                {shareLabel}
                            </button>
                            <button type="button" className="bfc-btn" data-kind="link" onClick={retake} data-role="retake">
                                {retakeLabel}
                            </button>
                        </div>
                        <p className="bfc-status" role="status" aria-live="polite" data-role="status" style={{ marginTop: 12 }}>
                            {copied ? copiedLabel : ""}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

addPropertyControls(FitCheck, {
    questions: {
        type: ControlType.Array,
        title: "Questions",
        defaultValue: DEFAULT_QUESTIONS,
        control: {
            type: ControlType.Object,
            controls: {
                prompt: { type: ControlType.String, title: "Question", defaultValue: "Question" },
                options: {
                    type: ControlType.Array,
                    title: "Options",
                    control: {
                        type: ControlType.Object,
                        controls: {
                            label: { type: ControlType.String, title: "Label", defaultValue: "Option" },
                            weights: { type: ControlType.Object, title: "Weights", controls: {
                                    advisory: { type: ControlType.Number, title: "Package 1", defaultValue: 0, min: 0, max: 3, step: 1, displayStepper: true },
                                    fractional: { type: ControlType.Number, title: "Package 2", defaultValue: 0, min: 0, max: 3, step: 1, displayStepper: true },
                                    interim: { type: ControlType.Number, title: "Package 3", defaultValue: 0, min: 0, max: 3, step: 1, displayStepper: true },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    packages: {
        type: ControlType.Array,
        title: "Packages",
        defaultValue: DEFAULT_PACKAGES,
        control: {
            type: ControlType.Object,
            controls: {
                id: { type: ControlType.String, title: "Id", defaultValue: "package" },
                name: { type: ControlType.String, title: "Name", defaultValue: "Package" },
                summary: { type: ControlType.String, title: "Summary", defaultValue: "" },
                title: { type: ControlType.String, title: "Result title", defaultValue: "" },
                lead: { type: ControlType.String, title: "Result lead", defaultValue: "", displayTextArea: true },
                why: { type: ControlType.Array, title: "Why", control: { type: ControlType.String }, description: "Empty uses the default points" },
                from: { type: ControlType.String, title: "Price line", defaultValue: "" },
                bookHref: { type: ControlType.String, title: "Book link", defaultValue: "", description: "Empty hides the button" },
            },
        },
    },
    resultLead: { type: ControlType.String, title: "Result lead", defaultValue: "Your best fit" },
    bookLabel: { type: ControlType.String, title: "Book label", defaultValue: "Book a call about {Name}" },
    shareLabel: { type: ControlType.String, title: "Share label", defaultValue: "Copy result link" },
    compact: { type: ControlType.Boolean, title: "Compact", defaultValue: false, enabledTitle: "First question", disabledTitle: "Full" },
    startLabel: { type: ControlType.String, title: "Start label", defaultValue: "Take the fit check", hidden: (p: Partial<FitCheckProps>) => !p.compact },
    startHref: { type: ControlType.String, title: "Start link", defaultValue: "", hidden: (p: Partial<FitCheckProps>) => !p.compact },
    progressLabel: { type: ControlType.String, title: "Progress", defaultValue: "Question {n} of {total}" },
    nextLabel: { type: ControlType.String, title: "Next", defaultValue: "Next" },
    backLabel: { type: ControlType.String, title: "Back", defaultValue: "Back" },
    seeLabel: { type: ControlType.String, title: "See result", defaultValue: "See my result" },
    errorText: { type: ControlType.String, title: "Error", defaultValue: "Choose one answer to continue." },
    closeLabel: { type: ControlType.String, title: "Close second", defaultValue: "A close second: {Name}" },
    copiedLabel: { type: ControlType.String, title: "Copied", defaultValue: "Copied" },
    retakeLabel: { type: ControlType.String, title: "Retake", defaultValue: "Start again" },
    closeMargin: { type: ControlType.Number, title: "Close margin", defaultValue: 1, min: 0, max: 5, step: 1, displayStepper: true },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#FAF8F2" },
    text: { type: ControlType.Color, title: "Text", defaultValue: "#12261E" },
    muted: { type: ControlType.Color, title: "Muted", defaultValue: "#55594B" },
    line: { type: ControlType.Color, title: "Line", defaultValue: "rgba(18,38,30,0.16)" },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#B07A22" },
    buttonBackground: { type: ControlType.Color, title: "Button", defaultValue: "#12261E" },
    buttonText: { type: ControlType.Color, title: "Button text", defaultValue: "#F2EEE3" },
    titleFont: { type: ControlType.Font, title: "Title font", controls: "basic", defaultFontType: "serif" },
    bodyFont: { type: ControlType.Font, title: "Body font", controls: "basic", defaultFontType: "sans-serif" },
    labelFont: { type: ControlType.Font, title: "Label font", controls: "basic", defaultFontType: "sans-serif" },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 2, min: 0, max: 24, step: 1, unit: "px" },
})

