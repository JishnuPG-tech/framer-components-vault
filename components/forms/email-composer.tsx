// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type KeyboardEvent as ReactKeyboardEvent,
} from "react"
import { createPortal } from "react-dom"

// ─── How it works ────────────────────────────────────────────────────────────
// At rest this is a plain email link (a real mailto, so it works without
// JavaScript and reads well to search engines).
// Click it and the address flies into the "To" line of a letter that unfolds
// right where the link sits:
// • a line that says a person is there (reply time, your local time),
// • a subject, topic chips that start the message, and the message itself
//   with the greeting already written,
// • Send. Inside a Framer Form it then asks one short question, where to
//   reply, and submits the form, so the message lands in the form's inbox
//   (email, webhook, Sheets: whatever the form is set to). Anywhere else it
//   hands the letter to Gmail, Outlook or the visitor's mail app, filled in.
// When it's sent, the letter folds into a small "Sent" pill that lifts off
// and flies away, while the address settles back into the link.
// Drafts stay on the visitor's device until they send.
// The letter lives in a layer on the page body, so no parent can clip it;
// its fields stay part of the form through the form attribute.

// ─── Defaults ────────────────────────────────────────────────────────────────

interface Palette {
    link: string
    underline: string
    card: string
    field: string
    text: string
    muted: string
    button: string
    buttonText: string
    success: string
    error: string
    shadow: string
    veil: string
}
const DEFAULT_LIGHT: Palette = {
    link: "#1D1D1F",
    underline: "#A1A1A6",
    card: "#FFFFFF",
    field: "#F2F2F4",
    text: "#1D1D1F",
    muted: "#86868B",
    button: "#1D1D1F",
    buttonText: "#FFFFFF",
    success: "#1F8A4C",
    error: "#D93025",
    shadow: "rgba(0, 0, 0, 0.28)",
    veil: "rgba(251, 251, 250, 0.72)",
}
const DEFAULT_DARK: Palette = {
    link: "#F5F5F7",
    underline: "#6E6E73",
    card: "#1C1C1E",
    field: "#2C2C2E",
    text: "#F5F5F7",
    muted: "#8E8E93",
    button: "#F5F5F7",
    buttonText: "#1D1D1F",
    success: "#4CC17A",
    error: "#FF6B5E",
    shadow: "rgba(0, 0, 0, 0.7)",
    veil: "rgba(11, 11, 12, 0.6)",
}
interface Texts {
    to: string
    greeting: string
    subject: string
    message: string
    lastSent: string
    ask: string
    askPlaceholder: string
    send: string
    sending: string
    thanks: string
    thanksPlain: string
    ready: string
    error: string
    copy: string
    copied: string
    copyFailed: string
}
const DEFAULT_TEXTS: Texts = {
    to: "To",
    greeting: "Hi {name},",
    subject: "Subject",
    message: "Write your message",
    lastSent: "You wrote {when}",
    ask: "Where should I reply?",
    askPlaceholder: "you@email.com",
    send: "Send",
    sending: "Sending",
    thanks: "Sent to {name}",
    thanksPlain: "Sent",
    ready: "Opened in {app}",
    error: "Couldn't send. Try again.",
    copy: "Copy",
    copied: "Copied",
    copyFailed: "Couldn't copy",
}
interface Topic {
    label: string
    subject: string
    starter: string
}
const DEFAULT_TOPICS: Topic[] = [
    {
        label: "New project",
        subject: "A new project",
        starter: "I'm planning a new website and",
    },
    {
        label: "Collaboration",
        subject: "Working together",
        starter: "I'd love to work with you on",
    },
    {
        label: "Just saying hi",
        subject: "Hello",
        starter: "I came across your work and",
    },
]
// What Framer's ResponsiveImage control hands over (older values are a plain URL)
interface ResponsiveImage {
    src?: string
    srcSet?: string
    alt?: string
}
interface Person {
    avatar: "initial" | "photo" | "hidden"
    photo: ResponsiveImage | string
    photoFit: "fill" | "fit"
    name: string
    city: string
    timeZone: string
    replyNote: string
}
const DEFAULT_PERSON: Person = {
    avatar: "initial",
    photo: "",
    photoFit: "fill",
    name: "Justyna",
    city: "Olsztyn",
    timeZone: "Europe/Warsaw",
    replyNote: "Usually replies within a day",
}
interface Fields {
    from: string
    subject: string
    message: string
}
const DEFAULT_FIELDS: Fields = {
    from: "Email",
    subject: "Subject",
    message: "Message",
}
interface Shape {
    width: number
    radius: number
}
const DEFAULT_SHAPE: Shape = { width: 520, radius: 30 }
interface Behaviour {
    opens: "auto" | "below" | "above" | "center"
    gmail: boolean
    outlook: boolean
    mailApp: boolean
    veil: boolean
    arrow: boolean
    drafts: boolean
}
const DEFAULT_BEHAVIOUR: Behaviour = {
    opens: "auto",
    gmail: true,
    outlook: false,
    mailApp: false,
    veil: true,
    arrow: true,
    drafts: true,
}

function withDefaults<T extends object>(defaults: T, value?: Partial<T>): T {
    const out = { ...defaults }
    if (value && typeof value === "object")
        for (const k of Object.keys(defaults) as (keyof T)[]) {
            const v = value[k]
            if (v !== undefined && v !== null) out[k] = v as T[keyof T]
        }
    return out
}

// Font control values can carry a colour; the palette decides colour
type FontValue = CSSProperties & { "--framer-font-color"?: string }
function fontStyle(f?: FontValue): CSSProperties {
    if (!f || typeof f !== "object") return {}
    const { color: _color, "--framer-font-color": _framerColor, ...rest } = f
    return rest
}

// ─── Motion ──────────────────────────────────────────────────────────────────

interface Motion {
    ease: string
    ms: number
}

// A real spring, sampled into a CSS linear() curve
function spring(stiffness: number, damping: number): Motion {
    const w0 = Math.sqrt(stiffness)
    const z = damping / (2 * Math.sqrt(stiffness))
    const wd = w0 * Math.sqrt(Math.max(1e-6, 1 - z * z))
    const x = (t: number) =>
        z < 1
            ? 1 -
              Math.exp(-z * w0 * t) *
                  (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t))
            : 1 - Math.exp(-w0 * t) * (1 + w0 * t)
    let T = 0
    while (
        T < 3 &&
        !(Math.abs(1 - x(T)) < 0.001 && Math.abs(1 - x(T + 0.05)) < 0.001)
    )
        T += 0.01
    const pts: number[] = []
    for (let i = 0; i <= 48; i++) pts.push(+x((i / 48) * T).toFixed(4))
    pts[48] = 1
    const ok =
        typeof CSS !== "undefined" &&
        CSS.supports?.("transition-timing-function", "linear(0, 1)")
    return {
        ease: ok
            ? `linear(${pts.join(", ")})`
            : "cubic-bezier(.2, .9, .25, 1.1)",
        ms: Math.round(T * 1000),
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const APPS = { gmail: "Gmail", outlook: "Outlook", mail: "Mail" }
type App = keyof typeof APPS

function appUrl(app: App, to: string, subject: string, body: string) {
    const e = encodeURIComponent
    if (app === "gmail")
        return `https://mail.google.com/mail/?view=cm&fs=1&to=${e(to)}${subject ? "&su=" + e(subject) : ""}${body ? "&body=" + e(body) : ""}`
    if (app === "outlook")
        return `https://outlook.live.com/mail/0/deeplink/compose?to=${e(to)}${subject ? "&subject=" + e(subject) : ""}${body ? "&body=" + e(body) : ""}`
    const q = [subject && "subject=" + e(subject), body && "body=" + e(body)]
        .filter(Boolean)
        .join("&")
    return `mailto:${to}${q ? "?" + q : ""}`
}

// The async Clipboard API only; it needs a secure (https) page and a click
async function copyText(text: string): Promise<boolean> {
    if (!navigator.clipboard?.writeText) {
        console.warn("[Email Composer] Copying needs the Clipboard API (an https page)")
        return false
    }
    try {
        await navigator.clipboard.writeText(text)
        return true
    } catch (error) {
        console.warn("[Email Composer] Couldn't copy the address", error)
        return false
    }
}

const store = {
    get(k: string) {
        try {
            return JSON.parse(localStorage.getItem(k) || "null")
        } catch (e) {
            // Storage can be blocked (private windows); drafts are just skipped
            return null
        }
    },
    set(k: string, v: unknown) {
        try {
            if (v === null) localStorage.removeItem(k)
            else localStorage.setItem(k, JSON.stringify(v))
        } catch (e) {
            // Storage can be blocked (private windows); drafts are just skipped
        }
    },
}

// Locked previews (the Framer Marketplace frames sites without form or popup
// rights) can't submit forms, and tabs they open inherit the lock, so Gmail
// would break there. A form that fires no submit event means we're in one.
function inLockedFrame() {
    try {
        if (window.self === window.top) return false
        const f = document.createElement("form")
        let fired = false
        f.addEventListener("submit", (e) => {
            fired = true
            e.preventDefault()
        })
        f.style.display = "none"
        document.body.appendChild(f)
        f.requestSubmit()
        f.remove()
        return !fired
    } catch (e) {
        return false
    }
}

function timeIn(timeZone: string) {
    if (!timeZone) return ""
    try {
        return new Intl.DateTimeFormat(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            timeZone,
        }).format(new Date())
    } catch (e) {
        return ""
    }
}

function ago(at: number) {
    const days = Math.round((Date.now() - at) / 86400000)
    try {
        const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
        if (days < 1) {
            const hours = Math.round((Date.now() - at) / 3600000)
            return hours < 1
                ? rtf.format(0, "minute")
                : rtf.format(-hours, "hour")
        }
        return rtf.format(-days, "day")
    } catch (e) {
        return days < 1 ? "today" : `${days} days ago`
    }
}

// Resource timing with the HTTP status, where the browser provides it
type TimingWithStatus = PerformanceResourceTiming & { responseStatus?: number }

// Framer's form posts to /forms/vN/forms/<id>/submit; read the result from
// the browser's own timing entries (no patching of fetch)
function watchFormResult(t0: number, done: (ok: boolean) => void) {
    let finished = false
    let po: PerformanceObserver | null = null
    const finish = (ok: boolean) => {
        if (finished) return
        finished = true
        po?.disconnect()
        clearTimeout(timer)
        done(ok)
    }
    try {
        po = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as TimingWithStatus[]) {
                if (entry.startTime < t0 - 50) continue
                if (!/\/forms\/v\d+\/forms\/[^/?#]+\/submit/.test(entry.name))
                    continue
                const status = entry.responseStatus
                finish(!status || status < 400)
            }
        })
        po.observe({ type: "resource", buffered: false })
    } catch (e) {
        // Without PerformanceObserver the timeout below still reports a result
        console.warn("[Email Composer] Can't watch the form request", e)
    }
    const timer = setTimeout(() => finish(false), 12000)
    return () => {
        if (finished) return
        finished = true
        po?.disconnect()
        clearTimeout(timer)
    }
}

const CSS_TEXT = `
.cpl-root{position:relative;display:inline-block;max-width:100%;box-sizing:border-box;text-align:center}
.cpl-card{text-align:left}
.cpl-link{position:relative;isolation:isolate;display:inline-block;vertical-align:bottom;color:var(--cpl-link);text-decoration:none;cursor:pointer;white-space:nowrap;outline:none;-webkit-tap-highlight-color:transparent}
.cpl-link:focus-visible{outline:2px solid var(--cpl-text);outline-offset:6px;border-radius:6px}
.cpl-dom{color:var(--cpl-domain);transition:color .35s ease}
.cpl-link:hover .cpl-dom,.cpl-link:focus-visible .cpl-dom{color:inherit}
.cpl-arr{position:absolute;left:100%;top:50%;width:.55em;height:.55em;margin-left:.22em;opacity:0;transform:translate(-.25em,-40%);transition:opacity .25s ease,transform .5s cubic-bezier(.2,.9,.3,1);pointer-events:none}
.cpl-link:hover .cpl-arr,.cpl-link:focus-visible .cpl-arr{opacity:1;transform:translate(0,-58%)}
.cpl-layer[data-state=open] .cpl-fly .cpl-dom,.cpl-layer[data-ink] .cpl-fly .cpl-dom{color:inherit}
.cpl-link[data-snap] .cpl-dom{transition:none}
.cpl-root[data-open] .cpl-arr{visibility:visible;opacity:0;transform:translate(0,-58%);transition:opacity .14s ease}
@media (hover: none){.cpl-link:hover .cpl-dom{color:var(--cpl-domain)}.cpl-link:hover .cpl-arr{opacity:0}}
.cpl-root[data-open] .cpl-link{visibility:hidden}
.cpl-word{display:inline-block;text-decoration:inherit;transition:opacity .22s ease,filter .22s ease,transform .5s cubic-bezier(.2,.9,.3,1)}
.cpl-layer{position:absolute;left:0;top:0;width:0;height:0;z-index:1000}
.cpl-fly{position:absolute;z-index:2;left:0;top:0;white-space:nowrap;transform-origin:0 0;pointer-events:none;display:none;color:var(--cpl-link)}
.cpl-card{position:absolute;z-index:1;display:none;overflow:hidden;background:var(--cpl-card);color:var(--cpl-text);box-shadow:0 0 0 .5px rgba(0,0,0,.06),0 2px 6px rgba(0,0,0,.04),0 30px 80px -24px var(--cpl-shadow);pointer-events:auto;box-sizing:border-box}
.cpl-veil{position:fixed;inset:0;z-index:0;display:none;background:var(--cpl-veil);opacity:0;pointer-events:none;transition:opacity .5s ease}
.cpl-layer[data-state] .cpl-fly,.cpl-layer[data-state] .cpl-card,.cpl-layer[data-state] .cpl-veil{display:block}
.cpl-layer[data-state=open] .cpl-veil{opacity:1;pointer-events:auto}
.cpl-pill{position:absolute;z-index:3;left:0;top:0;display:none;align-items:center;gap:8px;height:44px;padding:0 18px 0 16px;box-sizing:border-box;border-radius:999px;background:var(--cpl-button);color:var(--cpl-buttonText);font-size:15px;font-weight:500;letter-spacing:-.01em;white-space:nowrap;opacity:0;pointer-events:none;box-shadow:0 12px 30px -12px var(--cpl-shadow)}
.cpl-pill svg{width:15px;height:15px;flex:none}
.cpl-layer[data-state] .cpl-pill{display:flex}
@media (hover: hover){.cpl-veil{-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}}
.cpl-body{position:absolute;left:0;top:0;padding:30px 32px 26px;display:flex;flex-direction:column;box-sizing:border-box;font-size:16px;letter-spacing:-.01em;line-height:1.5}
.cpl-canvas .cpl-card{display:block;position:absolute;left:0;top:calc(100% + 16px)}
.cpl-canvas .cpl-body{position:relative}
.cpl-head{display:flex;align-items:center;gap:10px;min-height:30px}
.cpl-face img{display:block;width:100%;height:100%;border-radius:50%}
.cpl-face{position:relative;width:28px;height:28px;border-radius:50%;flex:none;display:grid;place-items:center;background:var(--cpl-field);color:var(--cpl-text);font-size:12px;font-weight:500}
.cpl-face::after{content:"";position:absolute;right:-1px;bottom:-1px;width:8px;height:8px;border-radius:50%;background:var(--cpl-success);box-shadow:0 0 0 2px var(--cpl-card)}
.cpl-label{color:var(--cpl-muted);flex:none;font-size:.875em}
.cpl-to-addr{all:unset;cursor:copy;display:inline-flex;align-items:center;gap:7px;min-width:0;height:28px;font-size:.875em;border-radius:6px}
.cpl-slot{font-weight:500;white-space:nowrap;visibility:hidden}
.cpl-canvas .cpl-slot{visibility:visible}
.cpl-copy{display:inline-grid;width:13px;height:13px;flex:none;color:var(--cpl-muted);transition:color .2s ease}
.cpl-copy svg{width:13px;height:13px}
.cpl-to-addr:hover .cpl-copy,.cpl-to-addr:focus-visible .cpl-copy{color:var(--cpl-text)}
.cpl-to-addr[data-done] .cpl-copy{color:var(--cpl-success)}
.cpl-to-addr:focus-visible{box-shadow:0 0 0 2px var(--cpl-text)}
.cpl-time{margin-left:auto;padding-left:12px;color:var(--cpl-muted);font-size:.875em;white-space:nowrap;font-variant-numeric:tabular-nums;transition:color .2s ease}
.cpl-time[data-done]{color:var(--cpl-success)}
.cpl-time[data-failed]{color:var(--cpl-error)}
.cpl-subject{all:unset;box-sizing:border-box;display:block;width:100%;margin-top:30px;font:inherit;font-size:1.875em;font-weight:400;letter-spacing:-.025em;line-height:1.2;color:var(--cpl-text)}
.cpl-subject::placeholder{color:var(--cpl-muted);opacity:.8}
.cpl-topics{display:flex;flex-wrap:wrap;gap:4px 18px;margin-top:12px}
.cpl-topic{all:unset;cursor:pointer;font-size:.875em;color:var(--cpl-muted);border-radius:4px;transition:color .2s ease}
.cpl-topic:hover,.cpl-topic[aria-pressed=true]{color:var(--cpl-text)}
.cpl-msg{all:unset;box-sizing:border-box;display:block;width:100%;margin-top:22px;font:inherit;font-size:1.0625em;line-height:1.65;color:var(--cpl-text);white-space:pre-wrap;resize:none;overflow:auto;min-height:8.25em;max-height:16.5em}
.cpl-msg::placeholder{color:var(--cpl-muted);opacity:.8}
.cpl-msg[aria-invalid=true]::placeholder,.cpl-subject[aria-invalid=true]::placeholder{color:var(--cpl-error)}
.cpl-bar{position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:22px;min-height:44px}
.cpl-status{color:var(--cpl-muted);font-size:.875em;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cpl-status[data-tone=error]{color:var(--cpl-error)}
.cpl-alt{all:unset;cursor:pointer;color:var(--cpl-muted);font-size:.875em;border-radius:4px;transition:color .2s ease}
.cpl-alt:hover{color:var(--cpl-text)}
.cpl-send{display:flex;align-items:center;gap:18px;flex:none;margin-left:auto}
.cpl-btn{all:unset;cursor:pointer;height:44px;padding:0 20px 0 22px;border-radius:999px;font-weight:500;font-size:.9375em;display:inline-flex;align-items:center;gap:8px;color:var(--cpl-buttonText);background:var(--cpl-button);transition:transform .15s ease,opacity .2s;box-sizing:border-box;flex:none}
.cpl-btn:active{transform:scale(.97)}
.cpl-btn[disabled]{cursor:default;opacity:.85}
.cpl-btn svg{width:13px;height:13px;transition:transform .4s cubic-bezier(.2,.9,.3,1)}
.cpl-btn:hover svg{transform:translate(2px,-2px)}
.cpl-row{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;transition:opacity .2s ease,transform .45s cubic-bezier(.2,.9,.3,1)}
.cpl-ask{position:absolute;inset:0;display:flex;align-items:center;gap:10px;opacity:0;transform:translateY(10px);pointer-events:none;transition:opacity .2s ease,transform .45s cubic-bezier(.2,.9,.3,1)}
.cpl-bar[data-step=ask] .cpl-row{opacity:0;transform:translateY(-10px);pointer-events:none}
.cpl-bar[data-step=ask] .cpl-ask{opacity:1;transform:none;pointer-events:auto}
.cpl-ask-field{all:unset;box-sizing:border-box;flex:1;min-width:0;height:44px;padding:0 18px;border-radius:999px;background:var(--cpl-field);color:var(--cpl-text);font:inherit;font-size:.9375em;transition:box-shadow .2s}
.cpl-ask-field::placeholder{color:var(--cpl-muted)}
.cpl-ask-field[aria-invalid=true]{box-shadow:inset 0 0 0 1.5px var(--cpl-error)}
.cpl-ask-label{color:var(--cpl-muted);font-size:.875em;white-space:nowrap}
.cpl-spin{width:14px;height:14px;border-radius:50%;border:1.6px solid currentColor;border-right-color:transparent;animation:cpl-spin .7s linear infinite}
@keyframes cpl-spin{to{transform:rotate(360deg)}}
.cpl-btn:focus-visible,.cpl-alt:focus-visible,.cpl-topic:focus-visible{box-shadow:0 0 0 2px var(--cpl-text)}
.cpl-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media (prefers-reduced-motion: reduce){.cpl-spin{animation-duration:1.6s}.cpl-word,.cpl-row,.cpl-ask{transition:opacity .15s ease}}
@media (max-width: 480px){.cpl-ask-label,.cpl-hint,.cpl-status:not([data-tone=error]){display:none}.cpl-body{padding:24px 22px 20px}.cpl-subject{font-size:1.625em;margin-top:24px}}
`

const varsOf = (p: Palette, radius: number) =>
    `--cpl-link:${p.link};--cpl-domain:${p.underline};--cpl-card:${p.card};--cpl-field:${p.field};--cpl-text:${p.text};--cpl-muted:${p.muted};--cpl-button:${p.button};--cpl-buttonText:${p.buttonText};--cpl-success:${p.success};--cpl-error:${p.error};--cpl-shadow:${p.shadow};--cpl-veil:${p.veil};--cpl-radius:${radius}px`

const COPY_ICON = (
    <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <rect x="5.5" y="5.5" width="8" height="8" rx="2" />
        <path d="M10.5 5.5V4.3A1.8 1.8 0 0 0 8.7 2.5H4.3A1.8 1.8 0 0 0 2.5 4.3v4.4a1.8 1.8 0 0 0 1.8 1.8h1.2" />
    </svg>
)

const CHECK_ICON = (
    <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M3.5 8.4l2.9 2.8 6.1-6.4" />
    </svg>
)
const SEND_ICON = (
    <svg
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M3.5 10.5l7-7M4.5 3.5h6v6" />
    </svg>
)

interface EmailComposerProps {
    email: string
    person?: Partial<Person>
    topics?: Topic[]
    texts?: Partial<Texts>
    fields?: Partial<Fields>
    theme: "auto" | "light" | "dark"
    light?: Partial<Palette>
    dark?: Partial<Palette>
    linkFont?: FontValue
    cardFont?: FontValue
    shape?: Partial<Shape>
    behaviour?: Partial<Behaviour>
    canvasState: "closed" | "open"
    onSent?: () => void
    onError?: () => void
}

/**
 * @framerIntrinsicWidth 280
 * @framerIntrinsicHeight 40
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 *
 * @framerDisableUnlink
 */
export default function EmailComposer(props: EmailComposerProps) {
    const email = (props.email || "justyna@justbuilt.it").trim()
    const T = withDefaults(DEFAULT_TEXTS, props.texts)
    const P = withDefaults(DEFAULT_PERSON, props.person)
    const F = withDefaults(DEFAULT_FIELDS, props.fields)
    const S = withDefaults(DEFAULT_SHAPE, props.shape)
    const B = withDefaults(DEFAULT_BEHAVIOUR, props.behaviour)
    const L = withDefaults(DEFAULT_LIGHT, props.light)
    const D = withDefaults(DEFAULT_DARK, props.dark)
    const topics = (Array.isArray(props.topics) ? props.topics : DEFAULT_TOPICS)
        .filter((t) => t && t.label)
        .slice(0, 5)
    const theme = props.theme ?? "dark"
    const linkFont = fontStyle(props.linkFont)
    const cardFont = fontStyle(props.cardFont)
    const greeting = P.name ? T.greeting.replace("{name}", P.name) : ""
    const split = email.indexOf("@")
    const local = split > 0 ? email.slice(0, split) : email
    const domain = split > 0 ? email.slice(split) : ""

    const isCanvas = useIsOnFramerCanvas()
    const isStatic = useIsStaticRenderer()
    const live = !isCanvas && !isStatic

    // A class name from the colours, so server and browser agree on it
    const cls = useMemo(() => {
        const key = JSON.stringify([theme, L, D, S.radius])
        let h = 5381
        for (let i = 0; i < key.length; i++)
            h = ((h << 5) + h + key.charCodeAt(i)) >>> 0
        return "cpl" + h.toString(36)
    }, [theme, JSON.stringify(L), JSON.stringify(D), S.radius])
    const themeCss =
        theme === "light"
            ? `.${cls}{${varsOf(L, S.radius)}}`
            : theme === "dark"
              ? `.${cls}{${varsOf(D, S.radius)}}`
              : `.${cls}{${varsOf(L, S.radius)}}@media (prefers-color-scheme: dark){.${cls}{${varsOf(D, S.radius)}}}`

    const rootRef = useRef<HTMLSpanElement>(null)
    const linkRef = useRef<HTMLAnchorElement>(null)
    const addrRef = useRef<HTMLSpanElement>(null)
    const pillRef = useRef<HTMLSpanElement>(null)
    const flyRef = useRef<HTMLSpanElement>(null)
    const cardRef = useRef<HTMLDivElement>(null)
    const bodyRef = useRef<HTMLDivElement>(null)
    const slotRef = useRef<HTMLSpanElement>(null)
    const fromRef = useRef<HTMLInputElement>(null)
    const subjectRef = useRef<HTMLInputElement>(null)
    const msgRef = useRef<HTMLTextAreaElement>(null)

    const [layer, setLayer] = useState<HTMLDivElement | null>(null)
    const [formId, setFormId] = useState<string | null>(null)
    const [locked, setLocked] = useState(false)
    const [status, setStatus] = useState<"idle" | "sending" | "error">("idle")
    const [step, setStep] = useState<"write" | "ask">("write")
    const [topic, setTopic] = useState(-1)
    const [copied, setCopied] = useState<"" | "ok" | "failed">("")
    const [preferred, setPreferred] = useState<App>("gmail")
    const [isOpen, setIsOpen] = useState(false)
    const [clock, setClock] = useState("")
    const [lastSent, setLastSent] = useState<number | null>(null)
    const [liveMsg, setLiveMsg] = useState("")

    const state = useRef<"rest" | "open" | "closing">("rest")
    const keyboardUsed = useRef(false)
    const geo = useRef({ up: false, anchor: 0, safeTop: 12, sx: 0, sy: 0, s: 1 })
    const timers = useRef<number[]>([])
    const later = (fn: () => void, ms: number) => {
        const id = window.setTimeout(fn, ms)
        timers.current.push(id)
        return id
    }
    const springs = useRef<{ open: Motion; close: Motion; snap: Motion } | null>(null)
    const key = "email-composer:" + email
    const propsRef = useRef(props)
    propsRef.current = props

    // The letter's layer sits on the page body so no parent can clip it
    useEffect(() => {
        if (!live || typeof document === "undefined") return
        const el = document.createElement("div")
        el.className = "cpl-layer"
        document.body.appendChild(el)
        setLayer(el)
        const reduce = window.matchMedia?.(
            "(prefers-reduced-motion: reduce)"
        ).matches
        const still = { ease: "linear", ms: 1 }
        springs.current = reduce
            ? { open: still, close: still, snap: still }
            : {
                  // Critically damped: glides in and settles with no bounce
                  open: spring(200, 28.3),
                  close: spring(340, 37),
                  snap: spring(260, 32.3),
              }
        const form = rootRef.current?.closest("form")
        if (form) {
            if (!form.id)
                form.id = "cpl-form-" + Math.random().toString(36).slice(2, 8)
            setFormId(form.id)
        }
        setLocked(inLockedFrame())
        const via = store.get(key + ":via")
        if (via && via in APPS) setPreferred(via)
        const sent = store.get(key + ":sent")
        if (sent && sent.at) setLastSent(sent.at)
        return () => {
            timers.current.forEach(clearTimeout)
            el.remove()
            setLayer(null)
        }
    }, [live, key])
    useEffect(() => {
        if (layer) layer.className = "cpl-layer " + cls
    }, [layer, cls])

    // Your local time, kept current while the letter is open
    useEffect(() => {
        if (!isOpen) return
        const tick = () => setClock(timeIn(P.timeZone))
        tick()
        const id = window.setInterval(tick, 20000)
        return () => clearInterval(id)
    }, [isOpen, P.timeZone])

    // Restore a draft once the letter exists
    useEffect(() => {
        if (!layer) return
        const d = B.drafts ? store.get(key) : null
        if (subjectRef.current)
            subjectRef.current.value = d?.s ?? ""
        if (msgRef.current) msgRef.current.value = d?.m ?? ""
        if (fromRef.current)
            fromRef.current.value = store.get("email-composer:me") || ""
        if (typeof d?.t === "number") setTopic(d.t)
    }, [layer, formId, key, B.drafts])

    const saveDraft = () => {
        const s = subjectRef.current?.value || ""
        const m = msgRef.current?.value || ""
        const empty = !s && (!m.trim() || m.trim() === greeting)
        if (B.drafts) store.set(key, empty ? null : { s, m, t: topic })
        if (status === "error") setStatus("idle")
        subjectRef.current?.setAttribute("aria-invalid", "false")
        msgRef.current?.setAttribute("aria-invalid", "false")
    }

    // ─── Sizing ─────────────────────────────────────────────────────────────
    function grow() {
        const m = msgRef.current
        if (!m) return
        m.style.height = "auto"
        m.style.height = m.scrollHeight + "px"
    }
    // The letter follows its content (a longer message, the reply step)
    function fit(ms = 260) {
        if (state.current !== "open" || !layer) return
        const card = cardRef.current!
        const fly = flyRef.current!
        const g = geo.current
        const H = bodyRef.current!.offsetHeight
        const was = parseFloat(card.style.top) || 0
        let top = g.up ? g.anchor - H : was
        // Keep Send in view as the letter grows, without going under a header
        const base = layer.getBoundingClientRect().top
        const vh = window.innerHeight
        if (base + top + H > vh - 12) top = vh - 12 - H - base
        if (base + top < g.safeTop) top = g.safeTop - base
        const ease = `${ms}ms cubic-bezier(.2,.9,.3,1)`
        card.style.transition = `height ${ease}, top ${ease}`
        card.style.height = H + "px"
        card.style.top = top + "px"
        if (top !== was) {
            g.sy += top - was
            fly.style.transition = `transform ${ease}`
            fly.style.transform = `translate(${g.sx}px, ${g.sy}px) scale(${g.s})`
        }
    }

    // Space taken at the top of the window by a fixed or sticky header
    function topInset() {
        let inset = 12
        const vh = window.innerHeight
        const x = window.innerWidth / 2
        if (typeof document.elementsFromPoint !== "function") return inset
        for (const y of [2, 24]) {
            for (const el of document.elementsFromPoint(x, y) as HTMLElement[]) {
                if (layer?.contains(el)) continue
                let n: HTMLElement | null = el
                while (n && n !== document.body) {
                    const pos = getComputedStyle(n).position
                    if (pos === "fixed" || pos === "sticky") {
                        const rr = n.getBoundingClientRect()
                        if (rr.top <= 1 && rr.height < vh * 0.4)
                            inset = Math.max(inset, rr.bottom + 12)
                        break
                    }
                    n = n.parentElement
                }
            }
        }
        return inset
    }

    // ─── Opening and closing ────────────────────────────────────────────────
    function geometry() {
        const link = linkRef.current!
        const r = link.getBoundingClientRect()
        const W = Math.min(S.width, window.innerWidth - 24)
        const body = bodyRef.current!
        body.style.width = W + "px"
        grow()
        const H = body.offsetHeight
        const vw = window.innerWidth
        const vh = window.innerHeight
        const safeTop = topInset()
        let left = (r.width - W) / 2
        if (r.left + left < 12) left = 12 - r.left
        if (r.left + left + W > vw - 12) left = vw - 12 - W - r.left
        // Below the link, above it, or in the middle of the window
        const belowTop = Math.max(-20, safeTop - r.top)
        const aboveTop = Math.min(r.height + 20, vh - 12 - r.top) - H
        const downFits = r.top + belowTop + H <= vh - 12
        const upFits = r.top + aboveTop >= safeTop
        const mode = B.opens
        const place =
            mode === "below" || mode === "above" || mode === "center"
                ? mode
                : downFits
                  ? "below"
                  : upFits
                    ? "above"
                    : "center"
        let top = place === "above" ? aboveTop : belowTop
        // Never past the top of the window or under a header
        if (r.top + top < safeTop) top = safeTop - r.top
        if (place === "center") {
            const y = Math.min(Math.max((vh - H) / 2, safeTop), Math.max(safeTop, vh - 12 - H))
            top = y - r.top
            left = (vw - W) / 2 - r.left
        }
        const linkSize = parseFloat(getComputedStyle(link).fontSize) || 32
        const cardSize = parseFloat(getComputedStyle(slotRef.current!).fontSize) || 14
        const s = cardSize / linkSize
        const slot = slotRef.current!.getBoundingClientRect()
        const b = body.getBoundingClientRect()
        const flyH = flyRef.current!.offsetHeight * s
        const sx = left + (slot.left - b.left)
        const sy = top + (slot.top - b.top) + (slot.height - flyH) / 2
        geo.current = { up: place === "above", anchor: r.height + 20, safeTop, sx, sy, s }
        return {
            r,
            W,
            H,
            left,
            top,
            s,
            sx,
            sy,
        }
    }
    function setBox(
        l: number,
        t: number,
        w: number,
        h: number,
        radius: number,
        tr: Motion | null
    ) {
        const card = cardRef.current!
        card.style.transition = tr
            ? ["left", "top", "width", "height", "border-radius"]
                  .map((p) => `${p} ${tr.ms}ms ${tr.ease}`)
                  .join(", ") + ", opacity 320ms ease"
            : "none"
        Object.assign(card.style, {
            left: l + "px",
            top: t + "px",
            width: w + "px",
            height: h + "px",
            borderRadius: radius + "px",
        })
    }
    // Whether the link is showing its hover look (cursor on it, or keyboard focus)
    function hot() {
        const l = linkRef.current
        return !!l && (l.matches(":hover") || l.matches(":focus-visible"))
    }
    function inSticky() {
        let n = rootRef.current?.parentElement || null
        while (n && n !== document.body) {
            if (getComputedStyle(n).position === "sticky") return true
            n = n.parentElement
        }
        return false
    }
    function inFixed() {
        let n = rootRef.current?.parentElement || null
        while (n && n !== document.body) {
            if (getComputedStyle(n).position === "fixed") return true
            n = n.parentElement
        }
        return false
    }
    function placeLayer() {
        const r = linkRef.current!.getBoundingClientRect()
        const fixed = inFixed()
        layer!.style.position = fixed ? "fixed" : "absolute"
        layer!.style.left = r.left + (fixed ? 0 : window.scrollX) + "px"
        layer!.style.top = r.top + (fixed ? 0 : window.scrollY) + "px"
    }
    // After opening: scroll just enough to show the whole letter
    function reveal() {
        if (state.current !== "open" || !layer) return
        // Measured from where the letter is going, not where it is mid-animation
        const card = cardRef.current!
        const top = layer.getBoundingClientRect().top + (parseFloat(card.style.top) || 0)
        const height = parseFloat(card.style.height) || 0
        const rr = { top, bottom: top + height, height }
        const vh = window.innerHeight
        const safe = geo.current.safeTop
        let dy = 0
        if (rr.height <= vh - safe - 12) {
            if (rr.bottom > vh - 12) dy = rr.bottom - (vh - 12)
            else if (rr.top < safe) dy = rr.top - safe
        } else if (rr.top < safe) dy = rr.top - safe
        if (Math.abs(dy) > 1) {
            const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
            window.scrollBy({ top: dy, behavior: reduce ? "auto" : "smooth" })
        }
    }

    function open() {
        if (!layer || state.current !== "rest") return
        timers.current.forEach(clearTimeout)
        timers.current = []
        setStep("write")
        setStatus("idle")
        // The greeting is already written; the cursor waits after it
        const msg = msgRef.current
        if (msg && !msg.value.trim() && greeting) msg.value = greeting + "\n\n"
        const sp = springs.current!
        const fly = flyRef.current!
        const body = bodyRef.current!
        const card = cardRef.current!
        placeLayer()
        layer.toggleAttribute("data-ink", hot())
        layer.setAttribute("data-state", "moving")
        const g = geometry()
        setBox(0, 0, g.r.width, g.r.height, 8, null)
        card.style.opacity = "0"
        fly.style.transition = "none"
        fly.style.transform = "none"
        fly.style.textDecorationColor = ""
        body.style.transition = "none"
        body.style.opacity = "0"
        body.style.transform = "translateY(6px)"
        card.getBoundingClientRect()
        setBox(g.left, g.top, g.W, g.H, S.radius, sp.open)
        card.style.opacity = "1"
        fly.style.transition = `transform ${sp.open.ms}ms ${sp.open.ease}, text-decoration-color 200ms ease`
        fly.style.transform = `translate(${g.sx}px, ${g.sy}px) scale(${g.s})`
        fly.style.textDecorationColor = "transparent"
        body.style.transition =
            sp.open.ms < 5
                ? "none"
                : "opacity 380ms ease 160ms, transform 700ms cubic-bezier(.22, 1, .36, 1) 160ms"
        body.style.opacity = "1"
        body.style.transform = "none"
        layer.setAttribute("data-state", "open")
        rootRef.current?.setAttribute("data-open", "")
        linkRef.current?.setAttribute("aria-expanded", "true")
        state.current = "open"
        setIsOpen(true)
        later(reveal, sp.open.ms < 5 ? 0 : 120)
        later(
            () => {
                const target =
                    subjectRef.current && !subjectRef.current.value
                        ? subjectRef.current
                        : msgRef.current
                target?.focus({ preventScroll: true })
                if (target === msgRef.current && msg)
                    msg.setSelectionRange(msg.value.length, msg.value.length)
            },
            sp.open.ms < 5 ? 0 : 260
        )
    }

    // fold: the letter folds into the address on its way back (after sending)
    function close(after?: () => void, focusLink = false, fold = false) {
        if (!layer || state.current !== "open") return
        const restore = wantsFocusBack(focusLink)
        state.current = "closing"
        // Ink stays if the link will show its hover look when the letter is gone
        layer.toggleAttribute("data-ink", hot() || (restore && keyboardUsed.current))
        layer.setAttribute("data-state", "closing")
        const sp = springs.current!
        const fly = flyRef.current!
        const body = bodyRef.current!
        const card = cardRef.current!
        const r = linkRef.current!.getBoundingClientRect()
        const t = fold ? sp.snap : sp.close
        body.style.transformOrigin = "30% 0"
        body.style.transition = fold
            ? "opacity 180ms ease, transform 320ms cubic-bezier(.5, 0, .75, 0)"
            : "opacity 140ms ease, transform 200ms ease"
        body.style.opacity = "0"
        body.style.transform = fold
            ? "translateY(-14px) scale(0.96)"
            : "translateY(6px)"
        const go = () => {
            setBox(0, 0, r.width, r.height, 8, t)
            card.style.transition += ", opacity 220ms ease 120ms"
            card.style.opacity = "0"
            fly.style.transition = `transform ${t.ms}ms ${t.ease}, text-decoration-color 300ms ease 150ms`
            fly.style.transform = "none"
            fly.style.textDecorationColor = ""
        }
        if (fold && t.ms > 5) later(go, 140)
        else go()
        linkRef.current?.setAttribute("aria-expanded", "false")
        later(
            () => {
                layer.removeAttribute("data-state")
                layer.removeAttribute("data-ink")
                rootRef.current?.removeAttribute("data-open")
                state.current = "rest"
                setIsOpen(false)
                setStep("write")
                if (restore) returnFocus()
                after?.()
            },
            Math.max(t.ms + (fold ? 140 : 0), 300)
        )
    }

    // ─── Sent: the letter folds into a pill that lifts off and flies away ───
    function sendOff(text: string) {
        if (!layer || state.current !== "open") return
        const restore = wantsFocusBack(false)
        state.current = "closing"
        const sp = springs.current!
        const still = sp.open.ms < 5
        const card = cardRef.current!
        const body = bodyRef.current!
        const fly = flyRef.current!
        const pill = pillRef.current!
        const label = pill.querySelector(".cpl-pill-text")
        if (label) label.textContent = text
        layer.toggleAttribute("data-ink", hot() || (restore && keyboardUsed.current))
        layer.setAttribute("data-state", "closing")
        linkRef.current?.setAttribute("aria-expanded", "false")
        pill.getAnimations?.().forEach((a) => a.cancel())
        pill.style.transition = "none"
        pill.style.opacity = "0"
        const w = pill.offsetWidth
        const h = pill.offsetHeight
        const cl = parseFloat(card.style.left) || 0
        const ct = parseFloat(card.style.top) || 0
        const cw = parseFloat(card.style.width) || w
        const ch = parseFloat(card.style.height) || h
        const px = cl + (cw - w) / 2
        const py = ct + (ch - h) / 2
        pill.style.left = px + "px"
        pill.style.top = py + "px"
        // The words fade and the sheet folds down into the pill's shape
        body.style.transition = "opacity 160ms ease"
        body.style.opacity = "0"
        setBox(px, py, w, h, h / 2, sp.snap)
        // Ink arrives once the sheet is nearly pill-sized, so it never reads as grey
        card.style.transition += `, background-color 160ms ease ${Math.round(sp.snap.ms * 0.55)}ms`
        card.style.background = "var(--cpl-button)"
        // Meanwhile the address goes home to the link
        fly.style.transition = `transform ${sp.close.ms}ms ${sp.close.ease}`
        fly.style.transform = "none"
        later(() => {
            rootRef.current?.removeAttribute("data-open")
            fly.style.visibility = "hidden"
            if (restore) returnFocus()
        }, sp.close.ms)
        later(clearLetter, Math.max(sp.snap.ms, 400) + 200)
        later(
            () => {
                pill.style.transition = "opacity 160ms ease"
                pill.style.opacity = "1"
                later(() => {
                    card.style.transition = "none"
                    card.style.opacity = "0"
                }, 170)
            },
            still ? 0 : Math.max(sp.snap.ms - 140, 200)
        )
        // A beat to read it, then it lifts off along a soft arc
        const flight = still ? 1 : 1100
        later(
            () => {
                pill.animate?.(
                    still
                        ? [{ opacity: 1 }, { opacity: 0 }]
                        : [
                              { transform: "translate(0, 0) rotate(0) scale(1)", opacity: 1 },
                              {
                                  transform: "translate(60px, -55px) rotate(-8deg) scale(0.92)",
                                  opacity: 1,
                                  offset: 0.35,
                              },
                              {
                                  transform: "translate(330px, -200px) rotate(-18deg) scale(0.6)",
                                  opacity: 0,
                              },
                          ],
                    { duration: still ? 200 : flight, easing: "cubic-bezier(.5, 0, .4, 1)", fill: "forwards" }
                )
                later(() => {
                    pill.getAnimations?.().forEach((a) => a.cancel())
                    pill.style.opacity = "0"
                    card.style.background = ""
                    fly.style.visibility = ""
                    layer.removeAttribute("data-state")
                    layer.removeAttribute("data-ink")
                    rootRef.current?.removeAttribute("data-open")
                    state.current = "rest"
                    setIsOpen(false)
                    setStep("write")
                }, (still ? 200 : flight) + 50)
            },
            still ? 400 : sp.snap.ms + 700
        )
    }

    // ─── Outside clicks, keys, resizes ──────────────────────────────────────
    useEffect(() => {
        if (!layer) return
        const onDown = (e: PointerEvent) => {
            if (state.current !== "open") return
            const t = e.target as Node
            if (cardRef.current?.contains(t) || linkRef.current?.contains(t))
                return
            close()
        }
        let lastW = window.innerWidth
        const onResize = () => {
            // Phones resize as the address bar slides; only a width change counts
            if (window.innerWidth === lastW) return
            lastW = window.innerWidth
            if (state.current === "open") close()
        }
        const onKey = () => (keyboardUsed.current = true)
        const onPointer = () => (keyboardUsed.current = false)
        // A modal letter keeps focus: anything that lands outside comes back in
        const onFocusIn = (e: FocusEvent) => {
            if (state.current !== "open" || !B.veil) return
            const t = e.target as Node
            if (cardRef.current?.contains(t) || linkRef.current?.contains(t)) return
            focusables()[0]?.focus({ preventScroll: true })
        }
        window.addEventListener("pointerdown", onDown, true)
        window.addEventListener("pointerdown", onPointer, true)
        window.addEventListener("keydown", onKey, true)
        window.addEventListener("focusin", onFocusIn)
        window.addEventListener("resize", onResize)
        return () => {
            window.removeEventListener("pointerdown", onDown, true)
            window.removeEventListener("pointerdown", onPointer, true)
            window.removeEventListener("keydown", onKey, true)
            window.removeEventListener("focusin", onFocusIn)
            window.removeEventListener("resize", onResize)
        }
    }, [layer])

    useEffect(() => {
        if (state.current === "open") requestAnimationFrame(() => fit())
    }, [step, status, topic])

    // A link in normal flow scrolls with the page and a fixed one is placed
    // fixed, so neither needs watching. Only a sticky parent can move the link
    // against the page while the letter is open: follow it, and only when it
    // has really moved.
    useEffect(() => {
        if (!isOpen || !layer || !inSticky()) return
        let frame = 0
        let lastX = NaN
        let lastY = NaN
        const onScroll = () => {
            if (frame) return
            frame = requestAnimationFrame(() => {
                frame = 0
                const r = linkRef.current?.getBoundingClientRect()
                if (!r) return
                const x = r.left + window.scrollX
                const y = r.top + window.scrollY
                if (x === lastX && y === lastY) return
                lastX = x
                lastY = y
                placeLayer()
            })
        }
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => {
            window.removeEventListener("scroll", onScroll)
            if (frame) cancelAnimationFrame(frame)
        }
    }, [isOpen, layer])

    // ─── Writing ────────────────────────────────────────────────────────────
    function pickTopic(i: number) {
        const tp = topics[i]
        const msg = msgRef.current!
        const subj = subjectRef.current!
        const prev = topics[topic]
        const head = greeting ? greeting + "\n\n" : ""
        const current = msg.value
        // Swap the starter only while the visitor hasn't written past it
        const untouched =
            !current.trim() ||
            current.trim() === greeting ||
            (prev && current.trim() === (head + prev.starter).trim())
        if (untouched) msg.value = head + (tp.starter ? tp.starter + " " : "")
        if (!subj.value || (prev && subj.value === prev.subject))
            subj.value = tp.subject || tp.label
        setTopic(i)
        grow()
        saveDraft()
        msg.focus({ preventScroll: true })
        msg.setSelectionRange(msg.value.length, msg.value.length)
    }

    // ─── Sending ────────────────────────────────────────────────────────────
    // Keyboard focus stays inside the open letter
    function focusables() {
        const card = cardRef.current
        if (!card) return [] as HTMLElement[]
        return Array.from(
            card.querySelectorAll<HTMLElement>("button, input, textarea")
        ).filter(
            (el) =>
                el.tabIndex >= 0 &&
                !(el as HTMLButtonElement).disabled &&
                !el.closest("[aria-hidden='true']") &&
                el.getClientRects().length > 0
        )
    }
    function trapTab(e: ReactKeyboardEvent) {
        const items = focusables()
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        const active = document.activeElement
        if (e.shiftKey && (active === first || !cardRef.current?.contains(active))) {
            e.preventDefault()
            last.focus()
        } else if (!e.shiftKey && active === last) {
            e.preventDefault()
            first.focus()
        }
    }
    // Focus goes back to the link on every way of closing, whenever the letter
    // was modal or held focus; a plain click elsewhere on a non-modal page keeps it
    function wantsFocusBack(asked: boolean) {
        return asked || B.veil || !!cardRef.current?.contains(document.activeElement)
    }
    function returnFocus() {
        const link = linkRef.current
        if (!link) return
        // The link shows its hover look at once, matching the address that flew back
        link.setAttribute("data-snap", "")
        link.focus({ preventScroll: true })
        requestAnimationFrame(() =>
            requestAnimationFrame(() => link.removeAttribute("data-snap"))
        )
    }

    function shake() {
        cardRef.current?.animate?.(
            [
                { transform: "translateX(0)" },
                { transform: "translateX(-6px)" },
                { transform: "translateX(5px)" },
                { transform: "translateX(-3px)" },
                { transform: "translateX(0)" },
            ],
            { duration: 360, easing: "ease-out" }
        )
    }
    function messageOk() {
        const msg = msgRef.current!
        const text = msg.value.trim()
        const ok = !!text && text !== greeting
        msg.setAttribute("aria-invalid", ok ? "false" : "true")
        if (!ok) {
            shake()
            msg.focus()
            msg.setSelectionRange(msg.value.length, msg.value.length)
        }
        return ok
    }
    function clearLetter() {
        if (subjectRef.current) subjectRef.current.value = ""
        if (msgRef.current) msgRef.current.value = ""
        store.set(key, null)
        setTopic(-1)
    }
    function sent() {
        const at = Date.now()
        store.set(key + ":sent", { at })
        setLastSent(at)
        const text = P.name ? T.thanks.replace("{name}", P.name) : T.thanksPlain
        sendOff(text)
        setLiveMsg(text)
    }

    function primary() {
        if (!formId) return handOff(main)
        if (step === "write") {
            if (!messageOk()) return
            setStep("ask")
            later(() => {
                fromRef.current?.focus({ preventScroll: true })
                fromRef.current?.select()
            }, 120)
            return
        }
        submit()
    }

    function submit() {
        if (status === "sending") return
        const fromEl = fromRef.current!
        const from = fromEl.value.trim()
        if (!from || !fromEl.checkValidity()) {
            fromEl.setAttribute("aria-invalid", "true")
            shake()
            fromEl.focus()
            return
        }
        fromEl.setAttribute("aria-invalid", "false")
        store.set("email-composer:me", from)
        const form = document.getElementById(formId!) as HTMLFormElement | null
        if (!form) return
        setStatus("sending")
        let submitted = false
        const onSubmit = () => (submitted = true)
        form.addEventListener("submit", onSubmit, { capture: true, once: true })
        const done = () => {
            setStatus("idle")
            sent()
            propsRef.current.onSent?.()
        }
        const stop = watchFormResult(performance.now(), (ok) => {
            if (ok) done()
            else {
                setStatus("error")
                setLiveMsg(T.error)
                shake()
                propsRef.current.onError?.()
            }
        })
        try {
            form.requestSubmit()
        } catch (e) {
            form.submit()
        }
        form.removeEventListener("submit", onSubmit, { capture: true })
        // Previews that block forms (like the Marketplace's) never submit:
        // play the send so the letter still shows how it behaves
        if (!submitted) {
            stop()
            later(done, 700)
        }
    }

    function handOff(app: App) {
        if (!messageOk()) return
        const subject = subjectRef.current?.value.trim() || ""
        const body = msgRef.current?.value.trim() || ""
        const url = appUrl(app, email, subject, body)
        // A tab opened from a locked preview inherits the lock and the inbox
        // breaks there, so the preview plays the hand-off instead
        if (!locked) {
            if (app === "mail") window.location.href = url
            else window.open(url, "_blank", "noopener")
        }
        setPreferred(app)
        store.set(key + ":via", app)
        const text = T.ready.replace("{app}", APPS[app])
        sendOff(text)
        setLiveMsg(text)
    }

    async function copy() {
        const ok = await copyText(email)
        setCopied(ok ? "ok" : "failed")
        setLiveMsg(ok ? T.copied : T.copyFailed)
        later(() => setCopied(""), ok ? 1400 : 2400)
    }

    // ─── Rendering ──────────────────────────────────────────────────────────
    const inForm = !!formId
    // The inboxes offered, with the visitor's last choice as the main button
    const offered = (["mail", "outlook", "gmail"] as App[]).filter((a) =>
        a === "gmail" ? B.gmail : a === "outlook" ? B.outlook : B.mailApp
    )
    // Outside a form there must be at least one way to send
    if (!formId && offered.length === 0) offered.push("mail")
    const main: App = offered.includes(preferred)
        ? preferred
        : offered[offered.length - 1]
    const apps: App[] = offered.filter((a) => a !== main)
    if (main) apps.push(main)

    const note = lastSent
        ? T.lastSent.replace("{when}", ago(lastSent))
        : P.replyNote
    const photo: string =
        typeof P.photo === "string" ? P.photo : P.photo?.src || ""
    const photoSet: string | undefined =
        typeof P.photo === "object" ? P.photo?.srcSet : undefined
    const photoAlt: string =
        (typeof P.photo === "object" && P.photo?.alt) || P.name || ""
    const initial = (P.name || email).trim().charAt(0).toUpperCase()
    const showPhoto = P.avatar === "photo" && !!photo

    const card = (canvas: boolean) => (
        <div
            className="cpl-card"
            ref={canvas ? undefined : cardRef}
            role="dialog"
            aria-modal={B.veil && !canvas ? true : undefined}
            aria-label={`Write to ${email}`}
            style={canvas ? { width: S.width, borderRadius: S.radius } : undefined}
            onKeyDown={(e) => {
                if (e.key === "Tab") trapTab(e)
                if (e.key === "Escape") {
                    e.preventDefault()
                    if (step === "ask") {
                        setStep("write")
                        msgRef.current?.focus()
                    } else close(undefined, true)
                }
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault()
                    primary()
                }
            }}
        >
            <div
                className="cpl-body"
                ref={canvas ? undefined : bodyRef}
                style={{ ...cardFont, width: canvas ? "100%" : undefined }}
            >
                <div className="cpl-head">
                    {P.avatar !== "hidden" && (
                    <span className="cpl-face" aria-hidden={showPhoto ? undefined : true}>
                        {showPhoto ? (
                            <img
                                src={photo}
                                srcSet={photoSet}
                                sizes="28px"
                                alt={photoAlt}
                                style={{ objectFit: P.photoFit === "fit" ? "contain" : "cover" }}
                            />
                        ) : (
                            initial
                        )}
                    </span>
                    )}
                    <span className="cpl-label">{T.to}</span>
                    <button
                        type="button"
                        className="cpl-to-addr"
                        onClick={copy}
                        data-done={copied === "ok" ? "" : undefined}
                        title={copied === "ok" ? T.copied : T.copy}
                        aria-label={`${T.copy} ${email}`}
                    >
                        <span className="cpl-slot" ref={canvas ? undefined : slotRef}>
                            {email}
                        </span>
                        <span className="cpl-copy">{copied === "ok" ? CHECK_ICON : COPY_ICON}</span>
                    </button>
                    {copied ? (
                        <span className="cpl-time" data-done={copied === "ok" ? "" : undefined} data-failed={copied === "failed" ? "" : undefined}>
                            {copied === "ok" ? T.copied : T.copyFailed}
                        </span>
                    ) : (canvas ? "10:42" : clock) ? (
                        <span className="cpl-time">
                            {canvas ? "10:42" : clock}
                            {P.city ? ` in ${P.city}` : ""}
                        </span>
                    ) : null}
                </div>
                <input
                    ref={canvas ? undefined : subjectRef}
                    className="cpl-subject"
                    type="text"
                    name={inForm ? F.subject : undefined}
                    form={formId || undefined}
                    placeholder={T.subject}
                    aria-label={T.subject}
                    autoComplete="off"
                    onInput={saveDraft}
                    readOnly={canvas}
                />
                {topics.length > 0 && (
                    <div className="cpl-topics" role="group" aria-label="Topics">
                        {topics.map((tp, i) => (
                            <button
                                key={i}
                                type="button"
                                className="cpl-topic"
                                aria-pressed={topic === i}
                                onClick={() => !canvas && pickTopic(i)}
                            >
                                {tp.label}
                            </button>
                        ))}
                    </div>
                )}
                <textarea
                    ref={canvas ? undefined : msgRef}
                    className="cpl-msg"
                    name={inForm ? F.message : undefined}
                    form={formId || undefined}
                    placeholder={T.message}
                    aria-label={T.message}
                    rows={5}
                    onInput={() => {
                        grow()
                        fit(160)
                        saveDraft()
                    }}
                    readOnly={canvas}
                    defaultValue={canvas && greeting ? greeting + "\n\n" : undefined}
                />
                <div className="cpl-bar" data-step={inForm ? step : "write"}>
                    <div className="cpl-row" aria-hidden={step === "ask" ? true : undefined}>
                        <span
                            className="cpl-status"
                            data-tone={status === "error" ? "error" : undefined}
                        >
                            {status === "error" ? T.error : note || null}
                        </span>
                        <span className="cpl-send">
                            {(["gmail", "outlook", "mail"] as App[])
                                .filter((a) => offered.includes(a) && (inForm || canvas || a !== main))
                                .map((a) => (
                                    <button
                                        key={a}
                                        type="button"
                                        className="cpl-alt"
                                        onClick={() => handOff(a)}
                                        tabIndex={step === "ask" ? -1 : 0}
                                    >
                                        {APPS[a]}
                                    </button>
                                ))}
                            <button
                                type="button"
                                className="cpl-btn"
                                onClick={primary}
                                tabIndex={step === "ask" ? -1 : 0}
                            >
                                {inForm || canvas ? T.send : APPS[main]}
                                {SEND_ICON}
                            </button>
                        </span>
                    </div>
                    {(inForm || canvas) && (
                        <div className="cpl-ask" aria-hidden={step !== "ask"}>
                            <span className="cpl-ask-label">{T.ask}</span>
                            <input
                                ref={canvas ? undefined : fromRef}
                                className="cpl-ask-field"
                                type="email"
                                name={canvas ? undefined : F.from}
                                form={formId || undefined}
                                placeholder={T.askPlaceholder}
                                aria-label={T.ask}
                                autoComplete="email"
                                inputMode="email"
                                required={inForm}
                                tabIndex={step === "ask" ? 0 : -1}
                                readOnly={canvas}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault()
                                        submit()
                                    }
                                }}
                                onInput={() => {
                                    fromRef.current?.setAttribute("aria-invalid", "false")
                                    if (status === "error") setStatus("idle")
                                }}
                            />
                            <button
                                type="button"
                                className="cpl-btn"
                                disabled={status === "sending"}
                                onClick={submit}
                                tabIndex={step === "ask" ? 0 : -1}
                            >
                                {status === "sending" ? (
                                    <>
                                        <span className="cpl-spin" aria-hidden="true" />
                                        {T.sending}
                                    </>
                                ) : (
                                    <>
                                        {T.send}
                                        {SEND_ICON}
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )

    const showCanvasCard = isCanvas && props.canvasState === "open"

    return (
        <span
            ref={rootRef}
            className={`cpl-root ${cls}${showCanvasCard ? " cpl-canvas" : ""}`}
        >
            <style>{CSS_TEXT + themeCss}</style>
            <a
                ref={linkRef}
                className="cpl-link"
                href={`mailto:${email}`}
                aria-haspopup="dialog"
                aria-expanded="false"
                style={linkFont}
                onClick={(e) => {
                    if (!live || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
                        return
                    e.preventDefault()
                    if (state.current === "rest") open()
                    else if (state.current === "open") close(undefined, true)
                }}
            >
                <span ref={addrRef} className="cpl-word cpl-addr">
                    {local}
                    {domain && <span className="cpl-dom">{domain}</span>}
                </span>
                {B.arrow && (
                <svg
                    className="cpl-arr"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M4.5 11.5l7-7M5.5 4.5h6v6" />
                </svg>
                )}
            </a>
            {showCanvasCard && card(true)}
            {layer &&
                createPortal(
                    <>
                        <span className="cpl-fly" ref={flyRef} aria-hidden="true" style={linkFont}>
                            {local}
                            {domain && <span className="cpl-dom">{domain}</span>}
                        </span>
                        {B.veil && <span className="cpl-veil" aria-hidden="true" />}
                        <span
                            className="cpl-pill"
                            ref={pillRef}
                            aria-hidden="true"
                            style={{ fontFamily: cardFont.fontFamily }}
                        >
                            {CHECK_ICON}
                            <span className="cpl-pill-text" />
                        </span>
                        {card(false)}
                        <span className="cpl-sr" aria-live="polite">
                            {liveMsg}
                        </span>
                    </>,
                    layer
                )}
        </span>
    )
}

EmailComposer.displayName = "Email Composer"

const colorControl = (title: string, defaultValue: string) => ({
    type: ControlType.Color as const,
    title,
    defaultValue,
})
const paletteControls = (d: Palette) => ({
    link: colorControl("Link", d.link),
    underline: colorControl("Domain", d.underline),
    card: colorControl("Card", d.card),
    field: colorControl("Fields", d.field),
    text: colorControl("Text", d.text),
    muted: colorControl("Muted", d.muted),
    button: colorControl("Button", d.button),
    buttonText: colorControl("Button Text", d.buttonText),
    success: colorControl("Success", d.success),
    error: colorControl("Error", d.error),
    shadow: colorControl("Shadow", d.shadow),
    veil: colorControl("Veil", d.veil),
})

addPropertyControls(EmailComposer, {
    email: {
        type: ControlType.String,
        title: "Email",
        defaultValue: "justyna@justbuilt.it",
        placeholder: "you@yourdomain.com",
        description: "The address shown and written to.",
    },
    person: {
        type: ControlType.Object,
        title: "You",
        buttonTitle: "Avatar, Name, Time",
        controls: {
            avatar: {
                type: ControlType.Enum,
                title: "Avatar",
                defaultValue: DEFAULT_PERSON.avatar,
                options: ["initial", "photo", "hidden"],
                optionTitles: ["Initial", "Photo", "None"],
                displaySegmentedControl: true,
                segmentedControlDirection: "horizontal",
                description: "The small circle at the top of the letter.",
            },
            photo: {
                type: ControlType.ResponsiveImage,
                title: "Photo",
                description: "Set its alt text in the image field. Without alt text, your name is used.",
                hidden: (p: Partial<Person>) => p?.avatar !== "photo",
            },
            photoFit: {
                type: ControlType.Enum,
                title: "Fit",
                defaultValue: DEFAULT_PERSON.photoFit,
                options: ["fill", "fit"],
                optionTitles: ["Fill", "Fit"],
                displaySegmentedControl: true,
                segmentedControlDirection: "horizontal",
                hidden: (p: Partial<Person>) => p?.avatar !== "photo" || !p?.photo,
            },
            name: {
                type: ControlType.String,
                title: "Name",
                defaultValue: DEFAULT_PERSON.name,
                description: "Used in the greeting. Leave empty for no greeting.",
            },
            city: {
                type: ControlType.String,
                title: "City",
                defaultValue: DEFAULT_PERSON.city,
            },
            timeZone: {
                type: ControlType.String,
                title: "Time Zone",
                defaultValue: DEFAULT_PERSON.timeZone,
                placeholder: "Europe/London",
                description: "Shows your local time. Leave empty to hide it.",
            },
            replyNote: {
                type: ControlType.String,
                title: "Reply Note",
                defaultValue: DEFAULT_PERSON.replyNote,
                description: "At the bottom of the letter. Leave empty to hide it.",
            },
        },
    },
    topics: {
        type: ControlType.Array,
        title: "Topics",
        maxCount: 5,
        defaultValue: DEFAULT_TOPICS,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Topic" },
                subject: { type: ControlType.String, title: "Subject", defaultValue: "" },
                starter: {
                    type: ControlType.String,
                    title: "First Line",
                    defaultValue: "",
                    displayTextArea: true,
                    description: "Starts the message after the greeting.",
                },
            },
        },
    },
    texts: {
        type: ControlType.Object,
        title: "Words",
        buttonTitle: "Labels, Messages",
        controls: {
            greeting: {
                type: ControlType.String,
                title: "Greeting",
                defaultValue: DEFAULT_TEXTS.greeting,
                description: "{name} becomes your name.",
            },
            lastSent: {
                type: ControlType.String,
                title: "Last Sent",
                defaultValue: DEFAULT_TEXTS.lastSent,
                description: "Shown to visitors who wrote before. {when} becomes 2 days ago.",
            },
            to: { type: ControlType.String, title: "To", defaultValue: DEFAULT_TEXTS.to },
            subject: { type: ControlType.String, title: "Subject", defaultValue: DEFAULT_TEXTS.subject },
            message: { type: ControlType.String, title: "Message", defaultValue: DEFAULT_TEXTS.message },
            ask: { type: ControlType.String, title: "Reply Question", defaultValue: DEFAULT_TEXTS.ask },
            askPlaceholder: { type: ControlType.String, title: "Reply Hint", defaultValue: DEFAULT_TEXTS.askPlaceholder },
            send: { type: ControlType.String, title: "Send", defaultValue: DEFAULT_TEXTS.send },
            sending: { type: ControlType.String, title: "Sending", defaultValue: DEFAULT_TEXTS.sending },
            thanks: {
                type: ControlType.String,
                title: "Sent",
                defaultValue: DEFAULT_TEXTS.thanks,
                description: "On the pill that flies off after sending. {name} becomes your name.",
            },
            thanksPlain: { type: ControlType.String, title: "Sent, No Name", defaultValue: DEFAULT_TEXTS.thanksPlain },
            ready: {
                type: ControlType.String,
                title: "Handed Off",
                defaultValue: DEFAULT_TEXTS.ready,
                description: "{app} becomes Gmail, Outlook or Mail.",
            },
            error: { type: ControlType.String, title: "Error", defaultValue: DEFAULT_TEXTS.error },
            copy: { type: ControlType.String, title: "Copy", defaultValue: DEFAULT_TEXTS.copy },
            copied: { type: ControlType.String, title: "Copied", defaultValue: DEFAULT_TEXTS.copied },
            copyFailed: { type: ControlType.String, title: "Copy Failed", defaultValue: DEFAULT_TEXTS.copyFailed },
        },
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        defaultValue: "dark",
        options: ["auto", "light", "dark"],
        optionTitles: ["Auto", "Light", "Dark"],
        displaySegmentedControl: true,
        segmentedControlDirection: "horizontal",
        description: "Auto follows the visitor's light or dark setting.",
    },
    light: {
        type: ControlType.Object,
        title: "Light",
        buttonTitle: "Colours",
        controls: paletteControls(DEFAULT_LIGHT),
        hidden: (p: Partial<EmailComposerProps>) => p.theme === "dark",
    },
    dark: {
        type: ControlType.Object,
        title: "Dark",
        buttonTitle: "Colours",
        controls: paletteControls(DEFAULT_DARK),
        hidden: (p: Partial<EmailComposerProps>) => p.theme === "light",
    },
    linkFont: {
        type: ControlType.Font,
        title: "Link Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 32,
            variant: "Medium",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
    },
    cardFont: {
        type: ControlType.Font,
        title: "Letter Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 16,
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1.5em",
        },
    },
    shape: {
        type: ControlType.Object,
        title: "Shape",
        buttonTitle: "Width, Radius",
        controls: {
            width: {
                type: ControlType.Number,
                title: "Letter Width",
                defaultValue: DEFAULT_SHAPE.width,
                min: 300,
                max: 640,
                step: 10,
                unit: "px",
                description: "Phones use the screen width.",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: DEFAULT_SHAPE.radius,
                min: 0,
                max: 32,
                step: 1,
                unit: "px",
            },
        },
    },
    behaviour: {
        type: ControlType.Object,
        title: "Behaviour",
        buttonTitle: "Opens, Inboxes, Drafts",
        controls: {
            opens: {
                type: ControlType.Enum,
                title: "Opens",
                defaultValue: DEFAULT_BEHAVIOUR.opens,
                options: ["auto", "below", "above", "center"],
                optionTitles: ["Auto", "Below", "Above", "Centre"],
                description:
                    "Auto opens below the link, above it when there's no room, and in the centre of the screen when neither fits.",
            },
            gmail: {
                type: ControlType.Boolean,
                title: "Gmail",
                defaultValue: DEFAULT_BEHAVIOUR.gmail,
                description: "Offer writing from Gmail, with the letter filled in.",
            },
            outlook: {
                type: ControlType.Boolean,
                title: "Outlook",
                defaultValue: DEFAULT_BEHAVIOUR.outlook,
            },
            mailApp: {
                type: ControlType.Boolean,
                title: "Mail App",
                defaultValue: DEFAULT_BEHAVIOUR.mailApp,
                description: "Opens the visitor's default email app, whichever their computer is set to.",
            },
            arrow: {
                type: ControlType.Boolean,
                title: "Hover Arrow",
                defaultValue: DEFAULT_BEHAVIOUR.arrow,
                description: "The small arrow that appears after the link on hover.",
            },
            veil: {
                type: ControlType.Boolean,
                title: "Soften Page",
                defaultValue: DEFAULT_BEHAVIOUR.veil,
                description: "Fades and blurs the page behind the letter. Phones get the fade only.",
            },
            drafts: {
                type: ControlType.Boolean,
                title: "Keep Drafts",
                defaultValue: DEFAULT_BEHAVIOUR.drafts,
                description: "Keeps an unsent message on the visitor's device.",
            },
        },
    },
    canvasState: {
        type: ControlType.Enum,
        title: "Canvas",
        defaultValue: "closed",
        options: ["closed", "open"],
        optionTitles: ["Closed", "Open"],
        displaySegmentedControl: true,
        segmentedControlDirection: "horizontal",
        description: "Shows the letter on the canvas so you can style it.",
    },
    fields: {
        type: ControlType.Object,
        title: "Form Fields",
        buttonTitle: "Names",
        description: "Advanced. The column names your form inbox receives when the link sits inside a Framer Form.",
        controls: {
            from: { type: ControlType.String, title: "Reply To", defaultValue: DEFAULT_FIELDS.from },
            subject: { type: ControlType.String, title: "Subject", defaultValue: DEFAULT_FIELDS.subject },
            message: { type: ControlType.String, title: "Message", defaultValue: DEFAULT_FIELDS.message },
        },
    },
    onSent: { type: ControlType.EventHandler, title: "On Sent" },
    onError: { type: ControlType.EventHandler, title: "On Error" },
})
