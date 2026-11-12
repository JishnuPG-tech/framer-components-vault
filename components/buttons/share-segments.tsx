import * as React from "react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence, MotionConfig } from "framer-motion"

const SHARE = ["M12 15V3", "M7 8l5-5 5 5", "M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"]
const CLOSE = ["M6 6l12 12", "M18 6L6 18"]
const LINK = [
    "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
    "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
]
const CHECK = ["M5 12.5l4.5 4.5L19 7"]
const MAIL = ["M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z", "M22 7l-10 6L2 7"]
const X_LOGO = "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
const LINKEDIN = "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
const FACEBOOK = "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"

function Stroke({ d, size = 18 }: { d: string[]; size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ display: "block", flexShrink: 0 }}>
            {d.map((p) => (
                <path key={p} d={p} />
            ))}
        </svg>
    )
}

function Brand({ d, size = 16 }: { d: string; size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden style={{ display: "block", flexShrink: 0 }}>
            <path d={d} />
        </svg>
    )
}

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect
const EASE: [number, number, number, number] = [0.2, 0, 0, 1]

// Splits two labels into their shared start and the differing tails, so only the tails morph
function splitPrefix(from: string, to: string) {
    const A = Array.from(from)
    const B = Array.from(to)
    let i = 0
    while (i < A.length && i < B.length && A[i] === B[i]) i++
    return { pre: A.slice(0, i).join(""), a: A.slice(i), b: B.slice(i) }
}

function Glyphs({ chars, show, dir }: { chars: string[]; show: boolean; dir: number }) {
    return (
        <>
            {chars.map((ch, i) => (
                <motion.span
                    key={i + ch}
                    initial={false}
                    animate={show ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: dir * 5, filter: "blur(3px)" }}
                    transition={{ duration: 0.24, ease: EASE, delay: (show ? 0.06 : 0) + i * 0.018 }}
                    style={{ display: "inline-block", whiteSpace: "pre" }}
                >
                    {ch}
                </motion.span>
            ))}
        </>
    )
}

function CopyMorph({ label, done, active }: { label: string; done: string; active: boolean }) {
    const { pre, a, b } = splitPrefix(label, done)
    const aRef = useRef<HTMLSpanElement>(null)
    const bRef = useRef<HTMLSpanElement>(null)
    const [w, setW] = useState<{ a: number; b: number } | null>(null)
    const settled = useRef(false)
    useIsoLayoutEffect(() => {
        const measure = () => {
            const ea = aRef.current
            const eb = bRef.current
            if (!ea || !eb) return
            const next = { a: ea.offsetWidth, b: eb.offsetWidth }
            setW((prev) => (prev && prev.a === next.a && prev.b === next.b ? prev : next))
        }
        measure()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(measure)
        if (aRef.current) ro.observe(aRef.current)
        if (bRef.current) ro.observe(bRef.current)
        return () => ro.disconnect()
    }, [label, done])
    useEffect(() => {
        if (w) settled.current = true
    }, [w])
    const current = active ? done : label
    return (
        <motion.span
            aria-hidden
            initial={false}
            animate={{ marginLeft: current ? 8 : 0 }}
            style={{ display: "flex", alignItems: "center", whiteSpace: "pre" }}
        >
            {pre && <span style={{ whiteSpace: "pre" }}>{pre}</span>}
            <motion.span
                initial={false}
                animate={{ width: w ? (active ? w.b : w.a) : "auto" }}
                transition={settled.current ? undefined : { duration: 0 }}
                style={{ display: "grid", justifyItems: "start", alignItems: "center", flexShrink: 0, minWidth: 0 }}
            >
                <span ref={aRef} style={{ gridArea: "1 / 1", display: "flex" }}>
                    <Glyphs chars={a} show={!active} dir={-1} />
                </span>
                <span ref={bRef} style={{ gridArea: "1 / 1", display: "flex" }}>
                    <Glyphs chars={b} show={active} dir={1} />
                </span>
            </motion.span>
        </motion.span>
    )
}

// Link icon folds away while the check draws itself in
function CopyIcon({ done }: { done: boolean }) {
    return (
        <span style={{ width: 16, height: 16, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <motion.span
                initial={false}
                animate={done ? { opacity: 0, scale: 0.5, rotate: -45, filter: "blur(2px)" } : { opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.26, ease: EASE }}
                style={{ gridArea: "1 / 1", display: "flex" }}
            >
                <Stroke d={LINK} size={16} />
            </motion.span>
            <svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                style={{ gridArea: "1 / 1", display: "block", overflow: "visible" }}
            >
                <motion.path
                    d={CHECK[0]}
                    initial={false}
                    animate={done ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                    transition={
                        done
                            ? { pathLength: { duration: 0.32, ease: EASE, delay: 0.1 }, opacity: { duration: 0.05, delay: 0.1 } }
                            : { duration: 0.18, ease: EASE }
                    }
                />
            </svg>
        </span>
    )
}

type ActionId = "x" | "linkedin" | "facebook" | "email" | "copy"
type NetworkId = Exclude<ActionId, "copy">

const ORDER: ActionId[] = ["x", "linkedin", "facebook", "email", "copy"]
const DEFAULT_BUTTONS: Record<ActionId, boolean> = { x: true, linkedin: true, facebook: true, email: true, copy: true }
const DEFAULT_TEXT = ""
const DEFAULT_LABELS: Record<ActionId, string> = {
    x: "Share on X",
    linkedin: "Share on LinkedIn",
    facebook: "Share on Facebook",
    email: "Send by email",
    copy: "Copy link",
}

const ICONS: Record<NetworkId, React.ReactNode> = {
    x: <Brand d={X_LOGO} size={15} />,
    linkedin: <Brand d={LINKEDIN} size={16} />,
    facebook: <Brand d={FACEBOOK} size={17} />,
    email: <Stroke d={MAIL} size={18} />,
}

const enc = (s: string) => encodeURIComponent(s || "")
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const clean = (s?: string) => (typeof s === "string" ? s.trim() : "")

function activeActions(buttons?: Partial<Record<ActionId, boolean>>): ActionId[] {
    const b: any = buttons || {}
    const list = ORDER.filter((id) => (b[id] ?? DEFAULT_BUTTONS[id]) === true)
    return list.length ? list : ["copy"]
}
const isSingle = (p: any) => activeActions(p.networks).length === 1
const has = (p: any, id: ActionId) => activeActions(p.networks).includes(id)
const usesText = (p: any) => {
    const a = activeActions(p.networks)
    return a.includes("x") || a.includes("linkedin") || a.includes("email") || (a.length > 1 && !!p.nativeShare)
}
const needsLink = (p: any) => {
    const a = activeActions(p.networks)
    return (
        a.includes("copy") ||
        a.includes("facebook") ||
        (a.length > 1 && !!p.nativeShare) ||
        (a.includes("x") && !!(p.xContent && p.xContent.addLink)) ||
        (a.includes("linkedin") && !!(p.linkedinContent && p.linkedinContent.addLink)) ||
        (a.includes("email") && !!(p.emailContent && p.emailContent.addLink))
    )
}

function hashtagList(s?: string) {
    return clean(s)
        .split(/[\s,]+/)
        .map((t) => t.replace(/^#+/, ""))
        .filter(Boolean)
        .join(",")
}

interface XContent {
    text?: string
    hashtags?: string
    via?: string
    addLink?: boolean
    label?: string
}
interface LinkedInContent {
    text?: string
    addLink?: boolean
    label?: string
}
interface EmailContent {
    to?: string
    subject?: string
    body?: string
    addLink?: boolean
    label?: string
}

// Returns null when there is nothing to share: the button then stays inert
function shareHref(id: NetworkId, url: string, text: string, x: XContent, linkedin: LinkedInContent, email: EmailContent): string | null {
    if (id === "x") {
        const post = clean(x.text) || text
        if (!post) return null
        let q = "text=" + enc(post)
        if (x.addLink && url) q += "&url=" + enc(url)
        const tags = hashtagList(x.hashtags)
        if (tags) q += "&hashtags=" + enc(tags)
        const via = clean(x.via).replace(/^@+/, "")
        if (via) q += "&via=" + enc(via)
        return "https://x.com/intent/tweet?" + q
    }
    if (id === "linkedin") {
        const post = clean(linkedin.text) || text
        if (!post) return null
        return "https://www.linkedin.com/feed/?shareActive=true&text=" + enc(linkedin.addLink && url ? post + "\n\n" + url : post)
    }
    if (id === "facebook") return url ? "https://www.facebook.com/sharer/sharer.php?u=" + enc(url) : null
    const subject = clean(email.subject) || text
    const body = clean(email.body) || text
    if (!subject && !body) return null
    const full = email.addLink && url ? (body ? body + "\n\n" + url : url) : body
    const q: string[] = []
    if (subject) q.push("subject=" + enc(subject))
    if (full) q.push("body=" + enc(full))
    return "mailto:" + clean(email.to).replace(/\s+/g, "") + "?" + q.join("&")
}

interface Props {
    networks?: Partial<Record<ActionId, boolean>>
    buttonStyle?: "accent" | "subtle"
    label?: string
    url?: string
    message?: string
    xContent?: XContent
    linkedinContent?: LinkedInContent
    facebookContent?: { label?: string }
    emailContent?: EmailContent
    copyContent?: { label?: string; copied?: string }
    nativeShare?: boolean
    preview?: "closed" | "open"
    colors?: {
        track?: string
        border?: string
        segment?: string
        hover?: string
        text?: string
        primaryFill?: string
        primaryText?: string
    }
    sizing?: { height?: number; padding?: number; gap?: number; radius?: number }
    font?: React.CSSProperties
    dots?: { show?: boolean; color?: string; accent?: string; size?: number; spacing?: number; reach?: number; twinkle?: number; floor?: number }
    transition?: any
    style?: React.CSSProperties
}

/**
 * A share control. With several buttons it splits into network segments and a copy-link action;
 * with a single button it becomes that action directly.
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function SegmentedShare(props: Props) {
    const {
        networks,
        buttonStyle = "subtle",
        label = "Share",
        url = "",
        message = DEFAULT_TEXT,
        xContent = {},
        linkedinContent = {},
        facebookContent = {},
        emailContent = {},
        copyContent = {},
        nativeShare = false,
        preview = "open",
        colors = {},
        sizing = {},
        font,
        transition = { type: "spring", stiffness: 500, damping: 60, mass: 1, delay: 0 },
        dots = {},
        style,
    } = props
    const actions = activeActions(networks)
    const single: ActionId | null = actions.length === 1 ? actions[0] : null
    const text = clean(message)
    // An empty label shows the icon only; accessible names fall back to the defaults
    const pick = (v: string | undefined, d: string) => (typeof v === "string" ? v.trim() : d)
    const labels: Record<ActionId, string> = {
        x: pick(xContent.label, DEFAULT_LABELS.x),
        linkedin: pick(linkedinContent.label, DEFAULT_LABELS.linkedin),
        facebook: pick(facebookContent.label, DEFAULT_LABELS.facebook),
        email: pick(emailContent.label, DEFAULT_LABELS.email),
        copy: pick(copyContent.label, DEFAULT_LABELS.copy),
    }
    const names: Record<ActionId, string> = {
        x: labels.x || DEFAULT_LABELS.x,
        linkedin: labels.linkedin || DEFAULT_LABELS.linkedin,
        facebook: labels.facebook || DEFAULT_LABELS.facebook,
        email: labels.email || DEFAULT_LABELS.email,
        copy: labels.copy || DEFAULT_LABELS.copy,
    }
    const copiedLabel = labels.copy ? pick(copyContent.copied, "Copied") : ""
    const copiedName = copiedLabel || "Copied"
    const shareLabel = clean(label)
    const c = {
        track: colors.track || "rgb(217, 217, 217)",
        border: colors.border || "rgba(255, 255, 255, 0)",
        segment: colors.segment || "rgb(230, 230, 230)",
        hover: colors.hover || "rgb(230, 230, 230)",
        text: colors.text || "rgb(23, 23, 23)",
        primaryFill: colors.primaryFill || "rgb(23, 23, 23)",
        primaryText: colors.primaryText || "rgb(255, 255, 255)",
    }
    const h = sizing.height ?? 44
    const pad = sizing.padding ?? 4
    const gap = sizing.gap ?? 4
    const r = sizing.radius ?? 14

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const [open, setOpen] = useState(isCanvas ? preview === "open" : false)
    const [copied, setCopied] = useState(false)
    const [href, setHref] = useState(url)
    const rootRef = useRef<HTMLDivElement>(null)
    const toggleRef = useRef<HTMLButtonElement>(null)
    const timer = useRef<any>(0)
    const dotsRef = useRef<HTMLCanvasElement>(null)
    const flashAt = useRef(0)
    const flashId = useRef("")
    const dotsOn = dots.show !== false
    const dp = {
        color: dots.color || "rgb(23, 23, 23)",
        accent: dots.accent || "rgb(84, 84, 84)",
        size: dots.size ?? 1.2,
        spacing: Math.max(3, dots.spacing ?? 4.5),
        reach: Math.max(4, dots.reach ?? 17),
        twinkle: clamp01((dots.twinkle ?? 80) / 100),
        floor: clamp01((dots.floor ?? 35) / 100),
        radius: r,
    }
    const dotParams = useRef(dp)
    dotParams.current = dp
    const M = Math.ceil(dp.reach * 1.4 + 6)
    const canvasKey = isCanvas ? String(open) + "|" + (single || "") + "|" + JSON.stringify(dp) : ""

    // Dot halo: a matrix of points that gathers around each segment and twinkles organically
    useEffect(() => {
        const root = rootRef.current
        const cv = dotsRef.current
        if (!dotsOn || !root || !cv || typeof window === "undefined") return
        const ctx = cv.getContext("2d")
        if (!ctx) return
        const reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        const CC = 480
        const CR = 96
        const NN = CC * CR
        const alpha = new Float32Array(NN)
        const rate = new Float32Array(NN)
        const p1 = new Float32Array(NN)
        const p2 = new Float32Array(NN)
        const f1 = new Float32Array(NN)
        const f2 = new Float32Array(NN)
        for (let k = 0; k < NN; k++) {
            rate[k] = 2 + Math.random() * 6
            p1[k] = Math.random() * Math.PI * 2
            p2[k] = Math.random() * Math.PI * 2
            f1[k] = 0.5 + Math.random() * 1.6
            f2[k] = 0.25 + Math.random() * 0.8
        }
        const hovers: Record<string, number> = {}
        let raf = 0
        let last = 0
        let inView = true
        let disposed = false

        const frame = (ms: number) => {
            if (disposed) return
            const now = ms / 1000
            const dt = isCanvas ? 1 : last ? Math.min(1 / 20, Math.max(0, now - last)) : 1 / 60
            last = now
            const P = dotParams.current
            const w = cv.offsetWidth
            const h = cv.offsetHeight
            const dpr = Math.min(2, window.devicePixelRatio || 1)
            const bw = Math.max(1, Math.round(w * dpr))
            const bh = Math.max(1, Math.round(h * dpr))
            if (cv.width !== bw || cv.height !== bh) {
                cv.width = bw
                cv.height = bh
            }
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.clearRect(0, 0, w, h)
            const cr = cv.getBoundingClientRect()
            const sc = cr.width / (w || 1) || 1
            const fid = flashId.current
            const rects: { cx: number; cy: number; hw: number; hh: number; r: number; hov: number; flash: boolean }[] = []
            root.querySelectorAll("[data-sgs]").forEach((el: any) => {
                const b = el.getBoundingClientRect()
                if (b.width < 1 || b.height < 1) return
                const id = el.getAttribute("data-id") || ""
                const hv = el.matches(":hover") ? 1 : 0
                const prev = hovers[id] || 0
                const cur = prev + (hv - prev) * Math.min(1, dt * 8)
                hovers[id] = cur
                const hw = b.width / 2 / sc
                const hh = b.height / 2 / sc
                rects.push({
                    cx: (b.left - cr.left) / sc + hw,
                    cy: (b.top - cr.top) / sc + hh,
                    hw,
                    hh,
                    r: Math.min(P.radius, hw, hh),
                    hov: cur,
                    flash: !!fid && id === fid,
                })
            })
            const flash = flashAt.current ? Math.exp(-(ms - flashAt.current) / 450) : 0
            const sp = P.spacing
            const cols = Math.min(CC, Math.floor(w / sp))
            const rows = Math.min(CR, Math.floor(h / sp))
            const ox = sp / 2
            const oy = (h - rows * sp) / 2 + sp / 2
            let fill = ""
            for (let j = 0; j < rows; j++) {
                const y = oy + j * sp
                for (let i = 0; i < cols; i++) {
                    const x = ox + i * sp
                    let target = 0
                    let hot = 0
                    let boost = 0
                    for (let q = 0; q < rects.length; q++) {
                        const rc = rects[q]
                        const qx = Math.abs(x - rc.cx) - (rc.hw - rc.r)
                        const qy = Math.abs(y - rc.cy) - (rc.hh - rc.r)
                        const d = Math.sqrt(Math.max(qx, 0) ** 2 + Math.max(qy, 0) ** 2) + Math.min(Math.max(qx, qy), 0) - rc.r
                        if (d <= 0) continue
                        const R = P.reach * (1 + 0.35 * rc.hov)
                        if (d >= R) continue
                        let fo = 1 - d / R
                        fo = Math.pow(fo, 1.3)
                        if (fo > target) target = fo
                        if (rc.hov > 0) boost = Math.max(boost, fo * rc.hov)
                        if (rc.flash && flash > 0.01) hot = Math.max(hot, fo * flash)
                    }
                    const k = j * CC + i
                    let a = alpha[k]
                    a += (target - a) * Math.min(1, dt * rate[k])
                    alpha[k] = a
                    if (a < 0.01) continue
                    let b = 0.5
                    if (!reduce) {
                        const n = 0.6 * Math.sin(now * f1[k] + p1[k]) + 0.4 * Math.sin(now * f2[k] + p2[k] + x * 0.015 - now * 0.8)
                        b = 0.5 + 0.5 * n
                    }
                    b = b * b
                    const lvl = Math.min(1, P.floor + (1 - P.floor) * (P.twinkle * b + (1 - P.twinkle) * 0.35) + boost * 0.4)
                    const mat = clamp01((target - a) * 2.5)
                    hot = Math.max(hot, mat * 0.7)
                    const useHot = hot > 0.08
                    const col = useHot ? P.accent : P.color
                    if (col !== fill) {
                        ctx.fillStyle = col
                        fill = col
                    }
                    ctx.globalAlpha = a * (useHot ? Math.max(lvl, hot) : lvl)
                    ctx.beginPath()
                    ctx.arc(x, y, (P.size / 2) * (0.75 + 0.6 * b + boost * 0.3), 0, Math.PI * 2)
                    ctx.fill()
                }
            }
            ctx.globalAlpha = 1
            raf = !isCanvas && inView ? window.requestAnimationFrame(frame) : 0
        }

        const start = () => {
            if (!raf && !disposed) raf = window.requestAnimationFrame(frame)
        }
        const io =
            !isCanvas && typeof IntersectionObserver !== "undefined"
                ? new IntersectionObserver((entries) => {
                      inView = entries.some((e) => e.isIntersecting)
                      if (inView) start()
                  })
                : null
        if (io) io.observe(root)
        const ro = isCanvas && typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => start()) : null
        if (ro) ro.observe(root)
        start()
        return () => {
            disposed = true
            if (raf) window.cancelAnimationFrame(raf)
            if (io) io.disconnect()
            if (ro) ro.disconnect()
        }
    }, [isCanvas, dotsOn, canvasKey])

    useEffect(() => {
        if (isCanvas) setOpen(preview === "open")
    }, [preview, isCanvas])

    useEffect(() => {
        if (url) setHref(url)
        else if (typeof window !== "undefined") setHref(window.location.href)
    }, [url])

    useEffect(() => () => clearTimeout(timer.current), [])

    useEffect(() => {
        if (single && open) setOpen(false)
    }, [single])

    useEffect(() => {
        if (!open || isCanvas || single) return
        const onDown = (e: PointerEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpen(false)
                toggleRef.current && toggleRef.current.focus()
            }
        }
        document.addEventListener("pointerdown", onDown)
        document.addEventListener("keydown", onKey)
        return () => {
            document.removeEventListener("pointerdown", onDown)
            document.removeEventListener("keydown", onKey)
        }
    }, [open, isCanvas, single])

    const flashOn = (id: string) => {
        flashId.current = id
        flashAt.current = typeof performance !== "undefined" ? performance.now() : 0
    }

    const onToggle = () => {
        if (isCanvas) return
        const nav: any = typeof navigator !== "undefined" ? navigator : null
        if (!open && nativeShare && nav && nav.share && window.matchMedia && window.matchMedia("(pointer: coarse)").matches) {
            nav.share({ title: text || undefined, text: text || undefined, url: href }).catch(() => {})
            return
        }
        setOpen((o) => !o)
        if (open) setCopied(false)
    }

    const doCopy = async () => {
        if (isCanvas) return
        let ok = false
        try {
            await navigator.clipboard.writeText(href)
            ok = true
        } catch (e) {
            try {
                const ta = document.createElement("textarea")
                ta.value = href
                ta.style.position = "fixed"
                ta.style.opacity = "0"
                document.body.appendChild(ta)
                ta.select()
                ok = document.execCommand("copy")
                document.body.removeChild(ta)
            } catch (err) {}
        }
        if (!ok) return
        setCopied(true)
        flashOn("copy")
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(false), 1800)
    }

    const onNetwork = (id: NetworkId, live: boolean) => (e: React.MouseEvent) => {
        if (isCanvas || !live) {
            e.preventDefault()
            return
        }
        flashOn(id)
    }

    // A network without text stays inert: no new tab, no mail client
    const netAttrs = (id: NetworkId) => {
        const link = linkFor(id)
        const Tag: any = link ? motion.a : motion.button
        const attrs: any = link
            ? { href: link, target: id === "email" ? undefined : "_blank", rel: "noopener noreferrer" }
            : { type: "button", "aria-disabled": true }
        attrs.onClick = onNetwork(id, !!link)
        return { Tag, attrs }
    }

    const linkFor = (id: NetworkId) => shareHref(id, href, text, xContent, linkedinContent, emailContent)

    const seg: React.CSSProperties = {
        height: h,
        minWidth: h,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        border: "none",
        margin: 0,
        padding: 0,
        borderRadius: r,
        cursor: "pointer",
        textDecoration: "none",
        font: "inherit",
        letterSpacing: "inherit",
        color: c.text,
        backgroundColor: c.segment,
        boxSizing: "border-box",
        WebkitTapHighlightColor: "transparent",
        whiteSpace: "nowrap",
    }
    const labelled: React.CSSProperties = { padding: "0 18px 0 14px", overflow: "hidden" }
    const iconOnly: React.CSSProperties = { padding: 0, width: h, overflow: "hidden" }
    const fit = (txt: string) => (txt ? labelled : iconOnly)

    const copyInner = (
        <span style={{ display: "flex", alignItems: "center" }}>
            <CopyIcon done={copied} />
            {labels.copy && <CopyMorph label={labels.copy} done={copiedLabel} active={copied} />}
        </span>
    )

    const accent = buttonStyle !== "subtle"
    const singleLook: React.CSSProperties = {
        ...seg,
        ...fit(single ? labels[single] : ""),
        backgroundColor: accent ? c.primaryFill : c.segment,
        color: accent ? c.primaryText : c.text,
    }
    const singleHover = accent ? { opacity: 0.9 } : { backgroundColor: c.hover }

    let singleButton: React.ReactNode = null
    if (single === "copy") {
        singleButton = (
            <motion.button
                type="button"
                className="sgs-seg"
                data-sgs="1"
                data-id="copy"
                onClick={doCopy}
                aria-label={copied ? copiedName : names.copy}
                style={singleLook}
                whileHover={singleHover}
                whileTap={{ scale: 0.96 }}
            >
                {copyInner}
            </motion.button>
        )
    } else if (single) {
        const id = single as NetworkId
        const { Tag, attrs } = netAttrs(id)
        singleButton = (
            <Tag {...attrs} className="sgs-seg" data-sgs="1" data-id={id} aria-label={names[id]} title={labels[id] ? undefined : names[id]} style={singleLook} whileHover={singleHover} whileTap={{ scale: 0.96 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 18, height: 18, display: "grid", placeItems: "center", flexShrink: 0 }}>{ICONS[id]}</span>
                    {labels[id]}
                </span>
            </Tag>
        )
    }

    const items: { id: ActionId; node: React.ReactNode }[] = single
        ? []
        : actions.map((id) => {
              if (id === "copy") {
                  return {
                      id,
                      node: (
                          <motion.button
                              type="button"
                              className="sgs-seg"
                              onClick={doCopy}
                              aria-label={copied ? copiedName : names.copy}
                              style={{ ...seg, ...fit(labels.copy), backgroundColor: c.primaryFill, color: c.primaryText }}
                              whileHover={{ opacity: 0.9 }}
                              whileTap={{ scale: 0.96 }}
                          >
                              {copyInner}
                          </motion.button>
                      ),
                  }
              }
              const { Tag, attrs } = netAttrs(id)
              return {
                  id,
                  node: (
                      <Tag
                          {...attrs}
                          className="sgs-seg"
                          aria-label={names[id]}
                          title={names[id]}
                          style={{ ...seg, width: h }}
                          whileHover={{ backgroundColor: c.hover }}
                          whileTap={{ scale: 0.94 }}
                      >
                          {ICONS[id]}
                      </Tag>
                  ),
              }
          })

    const n = items.length
    const t = transition || {}

    return (
        <MotionConfig transition={t} reducedMotion="user">
            <div ref={rootRef} style={{ ...style, ...font, display: "inline-flex", position: "relative" }}>
                <style>{".sgs-seg{outline:none}.sgs-seg:focus-visible{box-shadow:inset 0 0 0 2px " + c.text + "}"}</style>
                {dotsOn && (
                    <canvas
                        ref={dotsRef}
                        aria-hidden
                        style={{
                            position: "absolute",
                            left: -M,
                            top: -M,
                            width: "calc(100% + " + 2 * M + "px)",
                            height: "calc(100% + " + 2 * M + "px)",
                            pointerEvents: "none",
                            zIndex: 0,
                        }}
                    />
                )}
                <div
                    role={single ? undefined : "group"}
                    aria-label={single ? undefined : shareLabel || "Share"}
                    style={{
                        position: "relative",
                        zIndex: 1,
                        display: "flex",
                        alignItems: "center",
                        padding: pad,
                        borderRadius: r + pad,
                        background: c.track,
                        boxShadow: "inset 0 0 0 1px " + c.border,
                    }}
                >
                    {single ? (
                        singleButton
                    ) : (
                        <>
                            <motion.button
                                ref={toggleRef}
                                type="button"
                                className="sgs-seg"
                                data-sgs="1"
                                data-id="toggle"
                                aria-expanded={open}
                                aria-label={open ? "Close share options" : shareLabel || "Share"}
                                onClick={onToggle}
                                style={seg}
                                initial={false}
                                animate={{ paddingLeft: open || !shareLabel ? 0 : 14, paddingRight: open || !shareLabel ? 0 : 18 }}
                                whileHover={{ backgroundColor: c.hover }}
                                whileTap={{ scale: 0.96 }}
                            >
                                <span style={{ width: 18, height: 18, display: "grid", placeItems: "center", flexShrink: 0 }}>
                                    <motion.span
                                        initial={false}
                                        animate={{ opacity: open ? 0 : 1, rotate: open ? 90 : 0, scale: open ? 0.4 : 1 }}
                                        style={{ gridArea: "1 / 1", display: "flex" }}
                                    >
                                        <Stroke d={SHARE} />
                                    </motion.span>
                                    <motion.span
                                        initial={false}
                                        animate={{ opacity: open ? 1 : 0, rotate: open ? 0 : -90, scale: open ? 1 : 0.4 }}
                                        style={{ gridArea: "1 / 1", display: "flex" }}
                                    >
                                        <Stroke d={CLOSE} />
                                    </motion.span>
                                </span>
                                {shareLabel && (
                                    <motion.span
                                        initial={false}
                                        animate={{ width: open ? 0 : "auto", opacity: open ? 0 : 1, marginLeft: open ? 0 : 8 }}
                                        style={{ display: "block", overflow: "hidden", whiteSpace: "nowrap" }}
                                    >
                                        {shareLabel}
                                    </motion.span>
                                )}
                            </motion.button>
                            <AnimatePresence initial={false}>
                                {open &&
                                    items.map((it, i) => (
                                        <motion.div
                                            key={it.id}
                                            initial={{ width: 0, opacity: 0, marginLeft: 0, filter: "blur(4px)" }}
                                            animate={{ width: "auto", opacity: 1, marginLeft: gap, filter: "blur(0px)", transition: { ...t, delay: i * 0.04 } }}
                                            exit={{ width: 0, opacity: 0, marginLeft: 0, filter: "blur(4px)", transition: { ...t, delay: (n - 1 - i) * 0.03 } }}
                                            data-sgs="1"
                                            data-id={it.id}
                                            style={{ display: "flex", overflow: "hidden", borderRadius: r, flexShrink: 0 }}
                                        >
                                            {it.node}
                                        </motion.div>
                                    ))}
                            </AnimatePresence>
                        </>
                    )}
                </div>
                <span aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>
                    {copied ? copiedName : ""}
                </span>
            </div>
        </MotionConfig>
    )
}

SegmentedShare.displayName = "Segmented Share"

addPropertyControls(SegmentedShare, {
    networks: {
        type: ControlType.Object,
        title: "Buttons",
        controls: {
            x: { type: ControlType.Boolean, title: "X", defaultValue: true },
            linkedin: { type: ControlType.Boolean, title: "LinkedIn", defaultValue: true },
            facebook: { type: ControlType.Boolean, title: "Facebook", defaultValue: true },
            email: { type: ControlType.Boolean, title: "Email", defaultValue: true },
            copy: {
                type: ControlType.Boolean,
                title: "Copy Link",
                defaultValue: true,
                description: "Keep one button to turn the share menu into that direct action.",
            },
        },
    },
    buttonStyle: {
        type: ControlType.Enum,
        title: "Style",
        options: ["accent", "subtle"],
        optionTitles: ["Accent", "Subtle"],
        defaultValue: "subtle",
        displaySegmentedControl: true,
        hidden: (p: any) => !isSingle(p),
    },
    preview: {
        type: ControlType.Enum,
        title: "Preview",
        options: ["closed", "open"],
        optionTitles: ["Closed", "Open"],
        defaultValue: "open",
        displaySegmentedControl: true,
        description: "Canvas only",
        hidden: (p: any) => isSingle(p),
    },
    label: { type: ControlType.String, title: "Label", defaultValue: "Share", hidden: (p: any) => isSingle(p) },
    url: {
        type: ControlType.String,
        title: "Link",
        defaultValue: "",
        placeholder: "Current page",
        hidden: (p: any) => !needsLink(p),
    },
    message: {
        type: ControlType.String,
        title: "Text",
        defaultValue: DEFAULT_TEXT,
        placeholder: "Write a post…",
        displayTextArea: true,
        description: "Default copy for every network. A network without text does nothing on click.",
        hidden: (p: any) => !usesText(p),
    },
    xContent: {
        type: ControlType.Object,
        title: "X",
        hidden: (p: any) => !has(p, "x"),
        controls: {
            text: { type: ControlType.String, title: "Post", defaultValue: "", placeholder: "Uses Text", displayTextArea: true },
            hashtags: { type: ControlType.String, title: "Hashtags", defaultValue: "", placeholder: "design, framer" },
            via: { type: ControlType.String, title: "Via", defaultValue: "", placeholder: "@handle" },
            addLink: { type: ControlType.Boolean, title: "Add Link", defaultValue: false },
            label: { type: ControlType.String, title: "Label", defaultValue: DEFAULT_LABELS.x },
        },
    },
    linkedinContent: {
        type: ControlType.Object,
        title: "LinkedIn",
        hidden: (p: any) => !has(p, "linkedin"),
        controls: {
            text: { type: ControlType.String, title: "Post", defaultValue: "", placeholder: "Uses Text", displayTextArea: true },
            addLink: { type: ControlType.Boolean, title: "Add Link", defaultValue: false },
            label: { type: ControlType.String, title: "Label", defaultValue: DEFAULT_LABELS.linkedin },
        },
    },
    facebookContent: {
        type: ControlType.Object,
        title: "Facebook",
        hidden: (p: any) => !has(p, "facebook"),
        controls: {
            label: { type: ControlType.String, title: "Label", defaultValue: DEFAULT_LABELS.facebook },
        },
    },
    emailContent: {
        type: ControlType.Object,
        title: "Email",
        hidden: (p: any) => !has(p, "email"),
        controls: {
            to: { type: ControlType.String, title: "To", defaultValue: "", placeholder: "Optional" },
            subject: { type: ControlType.String, title: "Subject", defaultValue: "", placeholder: "Uses Text" },
            body: { type: ControlType.String, title: "Body", defaultValue: "", placeholder: "Uses Text", displayTextArea: true },
            addLink: { type: ControlType.Boolean, title: "Add Link", defaultValue: false },
            label: { type: ControlType.String, title: "Label", defaultValue: DEFAULT_LABELS.email },
        },
    },
    copyContent: {
        type: ControlType.Object,
        title: "Copy Link",
        hidden: (p: any) => !has(p, "copy"),
        controls: {
            label: { type: ControlType.String, title: "Label", defaultValue: DEFAULT_LABELS.copy },
            copied: { type: ControlType.String, title: "Copied", defaultValue: "Copied" },
        },
    },
    nativeShare: {
        type: ControlType.Boolean,
        title: "Native Share",
        defaultValue: false,
        description: "Opens the device share sheet on touch screens.",
        hidden: (p: any) => isSingle(p),
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            track: { type: ControlType.Color, title: "Background", defaultValue: "rgb(217, 217, 217)" },
            border: { type: ControlType.Color, title: "Border", defaultValue: "rgba(255, 255, 255, 0)" },
            segment: { type: ControlType.Color, title: "Button", defaultValue: "rgb(230, 230, 230)" },
            hover: { type: ControlType.Color, title: "Button Hover", defaultValue: "rgb(230, 230, 230)" },
            text: { type: ControlType.Color, title: "Text", defaultValue: "rgb(23, 23, 23)" },
            primaryFill: { type: ControlType.Color, title: "Accent", defaultValue: "rgb(23, 23, 23)" },
            primaryText: { type: ControlType.Color, title: "Accent Text", defaultValue: "rgb(255, 255, 255)" },
        },
    },
    sizing: {
        type: ControlType.Object,
        title: "Sizing",
        controls: {
            height: { type: ControlType.Number, title: "Height", defaultValue: 44, min: 28, max: 72, step: 1, unit: "px" },
            padding: { type: ControlType.Number, title: "Padding", defaultValue: 4, min: 0, max: 16, step: 1, unit: "px" },
            gap: { type: ControlType.Number, title: "Gap", defaultValue: 4, min: 0, max: 16, step: 1, unit: "px" },
            radius: { type: ControlType.Number, title: "Radius", defaultValue: 14, min: 0, max: 40, step: 1, unit: "px" },
        },
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { variant: "Medium", fontSize: 14, letterSpacing: "-0.01em", lineHeight: "1em" },
    } as any,
    dots: {
        type: ControlType.Object,
        title: "Dots",
        controls: {
            show: { type: ControlType.Boolean, title: "Show", defaultValue: true },
            color: { type: ControlType.Color, title: "Color", defaultValue: "rgb(23, 23, 23)", hidden: (p: any) => p.show === false },
            accent: { type: ControlType.Color, title: "Flash", defaultValue: "rgb(84, 84, 84)", hidden: (p: any) => p.show === false },
            size: { type: ControlType.Number, title: "Size", defaultValue: 1.2, min: 0.5, max: 6, step: 0.1, unit: "px", hidden: (p: any) => p.show === false },
            spacing: { type: ControlType.Number, title: "Spacing", defaultValue: 4.5, min: 3, max: 16, step: 0.5, unit: "px", hidden: (p: any) => p.show === false },
            reach: { type: ControlType.Number, title: "Reach", defaultValue: 17, min: 4, max: 80, step: 1, unit: "px", hidden: (p: any) => p.show === false },
            twinkle: { type: ControlType.Number, title: "Twinkle", defaultValue: 80, min: 0, max: 100, step: 1, unit: "%", hidden: (p: any) => p.show === false },
            floor: { type: ControlType.Number, title: "Min Brightness", defaultValue: 35, min: 0, max: 100, step: 1, unit: "%", hidden: (p: any) => p.show === false },
        },
    },
    transition: { type: ControlType.Transition, title: "Transition", defaultValue: { type: "spring", stiffness: 500, damping: 60, mass: 1, delay: 0 } },
})
