import * as React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence, useReducedMotion, useMotionValue, useSpring, animate } from "framer-motion"

type Img = { src?: string; srcSet?: string; alt?: string }
interface Member {
    image?: Img
    name: string
    role: string
    group: string
    location?: string
    bio?: string
    email?: string
}
interface Props {
    members: Member[]
    showHeader: boolean
    eyebrow: string
    title: string
    showFilters: boolean
    allLabel: string
    padding: number
    cardWidth: number
    imageHeight: number
    gap: number
    radius: number
    panelWidth: number
    background: string
    textColor: string
    mutedColor: string
    accentColor: string
    panelColor: string
    panelTextColor: string
    lineColor: string
    headingFont: any
    bodyFont: any
    headingWeight: number
    autoplay: boolean
    interval: number
    draggable: boolean
    showCursor: boolean
    cursorColor: string
    cursorTextColor: string
    showArrows: boolean
    showCounter: boolean
    showProgress: boolean
    emailAction: "copy" | "mailto"
    style?: React.CSSProperties
}

const DEFAULT_MEMBERS: Member[] = [
    {
        "image": {
            "src": "https://images.unsplash.com/photo-1592621385645-e41659e8aabe?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=900&h=1150",
            "alt": "Portrait of Maya Okafor"
        },
        "name": "Maya Okafor",
        "role": "Founder, Creative Direction",
        "group": "Leadership",
        "location": "Lisbon · Since 2016",
        "bio": "Maya sets the creative bar. She sketches every big idea on paper first and believes the best work starts with a good question.",
        "email": "maya@teamreel.studio"
    },
    {
        "image": {
            "src": "https://images.unsplash.com/photo-1791573391615-1ad1f53d7f9e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=900&h=1150",
            "alt": "Portrait of Julien Hart"
        },
        "name": "Julien Hart",
        "role": "Partner, Strategy",
        "group": "Leadership",
        "location": "Paris · Since 2018",
        "bio": "Julien turns messy briefs into clear plans. He loves a tidy roadmap, a strong espresso and launches that run themselves.",
        "email": "julien@teamreel.studio"
    },
    {
        "image": {
            "src": "https://images.unsplash.com/photo-1557053908-4793c484d06f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=900&h=1150",
            "alt": "Portrait of Sofia Reyes"
        },
        "name": "Sofia Reyes",
        "role": "Senior Product Designer",
        "group": "Design",
        "location": "Madrid · Since 2019",
        "bio": "Sofia designs interfaces that feel obvious. She prototypes fast, tests early and sweats every pixel of spacing.",
        "email": "sofia@teamreel.studio"
    },
    {
        "image": {
            "src": "https://images.unsplash.com/photo-1766022411633-e88e3650538b?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=900&h=1150",
            "alt": "Portrait of Kenji Mori"
        },
        "name": "Kenji Mori",
        "role": "Brand Designer",
        "group": "Design",
        "location": "Tokyo · Since 2020",
        "bio": "Kenji builds identities with a quiet confidence — strong type, careful colour and logos that age well.",
        "email": "kenji@teamreel.studio"
    },
    {
        "image": {
            "src": "https://images.unsplash.com/photo-1611451444023-7fe9d86fe1d0?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=900&h=1150",
            "alt": "Portrait of Ava Lindqvist"
        },
        "name": "Ava Lindqvist",
        "role": "Lead Engineer",
        "group": "Engineering",
        "location": "Stockholm · Since 2017",
        "bio": "Ava keeps everything fast and reliable. She prefers simple systems, clean code and zero-drama deploys.",
        "email": "ava@teamreel.studio"
    },
    {
        "image": {
            "src": "https://images.unsplash.com/photo-1584984647264-7e6f4e6d6b91?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=900&h=1150",
            "alt": "Portrait of Omar Haddad"
        },
        "name": "Omar Haddad",
        "role": "Creative Developer",
        "group": "Engineering",
        "location": "Dubai · Since 2021",
        "bio": "Omar brings designs to life with motion and interaction, turning static screens into experiences people remember.",
        "email": "omar@teamreel.studio"
    },
    {
        "image": {
            "src": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=900&h=1150",
            "alt": "Portrait of Leah Brennan"
        },
        "name": "Leah Brennan",
        "role": "Content Lead",
        "group": "Content",
        "location": "Dublin · Since 2019",
        "bio": "Leah finds the story in every project and writes it in plain words — no jargon, just ideas that land.",
        "email": "leah@teamreel.studio"
    },
    {
        "image": {
            "src": "https://images.unsplash.com/photo-1676302225279-12bbabdf5110?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=900&h=1150",
            "alt": "Portrait of Theo Marchetti"
        },
        "name": "Theo Marchetti",
        "role": "Copywriter",
        "group": "Content",
        "location": "Milan · Since 2022",
        "bio": "Theo writes headlines that make people stop scrolling. He reads everything out loud before it ships.",
        "email": "theo@teamreel.studio"
    }
]
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
const FONT = '"Inter", "Inter Placeholder", system-ui, -apple-system, sans-serif'
const pad2 = (n: number) => (n < 10 ? "0" + n : String(n))
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

function Arrow({ dir, color }: { dir: "left" | "right"; color: string }) {
    return (
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ transform: dir === "left" ? "scaleX(-1)" : undefined }}>
            <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function TeamReel(props: Props) {
    const {
        members: rawMembers, showHeader, eyebrow, title, showFilters, allLabel,
        padding, cardWidth, imageHeight, gap, radius, panelWidth,
        background, textColor, mutedColor, accentColor, panelColor, panelTextColor, lineColor,
        headingFont, bodyFont, headingWeight, autoplay, interval, draggable, showCursor, cursorColor, cursorTextColor,
        showArrows, showCounter, showProgress, emailAction, style,
    } = props
    const members = rawMembers && rawMembers.length ? rawMembers : DEFAULT_MEMBERS
    const prefersReduced = !!useReducedMotion()
    // Static contexts (canvas thumbnails, exports, SSR snapshots) get a calm, fully-rendered fallback.
    const isStatic = useIsStaticRenderer()
    const reduce = prefersReduced || isStatic
    const rootRef = useRef<HTMLDivElement>(null)
    const wrapRef = useRef<HTMLDivElement>(null)
    const dragged = useRef(false)
    const [width, setWidth] = useState(1200)
    const [filter, setFilter] = useState<string>("__all")
    const [index, setIndex] = useState(0)
    const [live, setLive] = useState(0)
    const [open, setOpen] = useState<number | null>(null)
    const [hoverRoot, setHoverRoot] = useState(false)
    const [hoverCard, setHoverCard] = useState<number | null>(null)
    const [dragging, setDragging] = useState(false)
    const [copied, setCopied] = useState<number | null>(null)
    // Only run pointer tracking, autoplay and cursor motion while the component is on screen.
    const [inView, setInView] = useState(false)

    const x = useMotionValue(0)
    const cx = useMotionValue(0)
    const cy = useMotionValue(0)
    const sx = useSpring(cx, { stiffness: 520, damping: 42, mass: 0.6 })
    const sy = useSpring(cy, { stiffness: 520, damping: 42, mass: 0.6 })

    useEffect(() => {
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => {
            const w = Math.round(entries[0].contentRect.width)
            if (w > 0) setWidth((prev) => (Math.abs(prev - w) > 1 ? w : prev))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    useEffect(() => {
        if (isStatic) return
        const el = rootRef.current
        if (!el) return
        if (typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }
        const io = new IntersectionObserver(
            (entries) => {
                const visible = entries.some((e) => e.isIntersecting)
                setInView(visible)
                if (!visible) {
                    setHoverCard(null)
                    setHoverRoot(false)
                }
            },
            { threshold: 0, rootMargin: "100px 0px" }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic])

    const narrow = width < 700
    const px = narrow ? Math.min(padding, 20) : padding
    const cw = narrow ? Math.max(220, Math.min(cardWidth, width - px * 2 - 56)) : cardWidth
    const ih = Math.round(imageHeight * (cw / cardWidth))
    const pw = narrow ? 0 : panelWidth

    const groups = useMemo(() => {
        const out: { name: string; count: number }[] = []
        members.forEach((m) => {
            if (!m.group) return
            const g = out.find((q) => q.name === m.group)
            if (g) g.count++
            else out.push({ name: m.group, count: 1 })
        })
        return out
    }, [members])

    const list = filter === "__all" ? members : members.filter((m) => m.group === filter)
    const step = cw + gap
    const maxIndex = Math.max(0, list.length - 1)
    const safeIndex = Math.min(index, maxIndex)
    const spring: any = reduce ? { duration: 0 } : { type: "spring", stiffness: 170, damping: 28, mass: 1 }
    const canDrag = draggable && !isStatic
    const cursorEnabled = showCursor && !narrow && !isStatic && inView

    useEffect(() => { setIndex(0); setOpen(null) }, [filter])

    useEffect(() => {
        if (reduce || !inView) {
            x.set(-safeIndex * step)
            return
        }
        const c = animate(x, -safeIndex * step, spring)
        return () => c.stop()
    }, [safeIndex, step, reduce, inView])

    useEffect(() => {
        return x.on("change", (v: number) => {
            const i = clamp(Math.round(-v / step), 0, maxIndex)
            setLive((p) => (p === i ? p : i))
        })
    }, [step, maxIndex])

    useEffect(() => {
        if (!autoplay || reduce || isStatic || !inView || hoverRoot || open !== null || dragging || maxIndex === 0) return
        const t = setInterval(() => setIndex((i) => (i >= maxIndex ? 0 : i + 1)), Math.max(1.5, interval) * 1000)
        return () => clearInterval(t)
    }, [autoplay, reduce, isStatic, inView, hoverRoot, open, dragging, maxIndex, interval])

    const go = (d: number) => {
        setOpen(null)
        setIndex((i) => clamp(Math.min(i, maxIndex) + d, 0, maxIndex))
    }
    const toggle = (i: number) => {
        if (dragged.current) return
        if (open === i) { setOpen(null); return }
        setOpen(i)
        setIndex(i)
    }
    const onKey = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowRight") { e.preventDefault(); go(1) }
        if (e.key === "ArrowLeft") { e.preventDefault(); go(-1) }
        if (e.key === "Escape") setOpen(null)
    }
    const emailClick = (m: Member, i: number) => {
        if (!m.email) return
        if (emailAction === "copy" && typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(m.email).then(() => {
                setCopied(i)
                setTimeout(() => setCopied(null), 1600)
            }).catch(() => { window.location.href = "mailto:" + m.email })
        } else if (typeof window !== "undefined") {
            window.location.href = "mailto:" + m.email
        }
    }
    const onMove = (e: React.PointerEvent) => {
        if (!cursorEnabled || e.pointerType !== "mouse" || !wrapRef.current) return
        const r = wrapRef.current.getBoundingClientRect()
        cx.set(e.clientX - r.left)
        cy.set(e.clientY - r.top)
    }

    const active = open !== null ? open : live
    const body: React.CSSProperties = { fontFamily: FONT, color: textColor, ...(bodyFont || {}) }
    const cursorOn = cursorEnabled && (hoverCard !== null || dragging)
    const cursorLabel = dragging ? "Drag" : hoverCard !== null && hoverCard === open ? "Close" : "View"
    const item: any = { hide: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.55, ease: EASE } } }
    const group: any = { hide: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.07, delayChildren: reduce ? 0 : 0.18 } } }
    const circle = (disabled: boolean, filled: boolean): React.CSSProperties => ({
        width: 52, height: 52, borderRadius: 999, padding: 0,
        border: "1.5px solid " + (filled ? textColor : lineColor), background: filled ? textColor : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center", cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.3 : 1, transition: "opacity .3s",
    })

    return (
        <div
            ref={rootRef}
            tabIndex={0}
            onKeyDown={onKey}
            onMouseEnter={isStatic ? undefined : () => setHoverRoot(true)}
            onMouseLeave={isStatic ? undefined : () => setHoverRoot(false)}
            aria-roledescription="carousel"
            aria-label={title ? title.replace(/\n/g, " ") : "Team"}
            style={{ ...style, fontFamily: FONT, color: textColor, background, display: "flex", flexDirection: "column", gap: narrow ? 28 : 40, padding: (narrow ? 64 : 104) + "px 0", overflow: "hidden", outline: "none", boxSizing: "border-box", position: "relative" }}
        >
            {(showHeader || showFilters) && (
                <div style={{ display: "flex", flexDirection: "column", gap: narrow ? 18 : 22, padding: "0 " + px + "px" }}>
                    {showHeader && eyebrow && (
                        <div style={{ ...body, alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 13px", borderRadius: 999, border: "1px solid " + lineColor, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                            <span style={{ width: 7, height: 7, borderRadius: 7, background: accentColor }} />
                            {eyebrow}
                        </div>
                    )}
                    {showHeader && title && (
                        <h2 style={{ fontFamily: FONT, color: textColor, margin: 0, whiteSpace: "pre-line", letterSpacing: "-0.05em", ...(headingFont || {}), fontWeight: headingWeight, fontSize: narrow ? 40 : 68, lineHeight: 0.98 }}>{title}</h2>
                    )}
                    {showFilters && groups.length > 1 && (
                        <div role="tablist" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                            {[{ name: "__all", label: allLabel, count: members.length }, ...groups.map((g) => ({ name: g.name, label: g.name, count: g.count }))].map((g) => {
                                const on = filter === g.name
                                return (
                                    <motion.button key={g.name} role="tab" aria-selected={on} onClick={() => setFilter(g.name)}
                                        whileTap={reduce ? undefined : { scale: 0.95 }}
                                        style={{ ...body, fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 999, cursor: "pointer",
                                            border: "1.5px solid " + (on ? textColor : lineColor), background: on ? textColor : "transparent", color: on ? background : textColor, transition: "background .3s, color .3s, border-color .3s" }}>
                                        {g.label}
                                        <span style={{ fontSize: 11, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 9, display: "inline-flex", alignItems: "center", justifyContent: "center", background: on ? "rgba(255,255,255,0.18)" : lineColor, color: on ? background : textColor }}>{g.count}</span>
                                    </motion.button>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            <div ref={wrapRef} onPointerMove={cursorEnabled ? onMove : undefined} style={{ position: "relative", padding: "0 " + px + "px" }}>
                <motion.div
                    drag={canDrag ? "x" : false}
                    dragConstraints={{ left: -maxIndex * step, right: 0 }}
                    dragElastic={0.12}
                    dragMomentum={false}
                    onPointerDownCapture={() => { dragged.current = false }}
                    onDragStart={() => { dragged.current = true; setDragging(true) }}
                    onDragEnd={(_e, info) => {
                        setDragging(false)
                        const proj = x.get() + info.velocity.x * 0.2
                        const i = clamp(Math.round(-proj / step), 0, maxIndex)
                        if (open !== null && i !== open) setOpen(null)
                        if (i === safeIndex) animate(x, -i * step, spring)
                        else setIndex(i)
                        setTimeout(() => { dragged.current = false }, 50)
                    }}
                    style={{ x, display: "flex", gap, alignItems: "flex-start", touchAction: "pan-y", userSelect: "none", cursor: canDrag ? (dragging ? "grabbing" : "grab") : "default" }}
                >
                    {list.map((m, i) => {
                        const isOpen = open === i
                        return (
                            <motion.div key={filter + "-" + m.name + "-" + i}
                                initial={reduce ? false : { opacity: 0, y: 36 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.2 }}
                                transition={reduce ? { duration: 0 } : { duration: 0.9, ease: EASE, delay: Math.min(i, 5) * 0.07 }}
                                style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 18 }}>
                                <motion.div animate={{ width: isOpen ? cw + pw : cw }} initial={false} transition={reduce ? { duration: 0 } : spring}
                                    onClick={() => toggle(i)} role="button" tabIndex={0} aria-expanded={isOpen} aria-label={m.name + ", " + m.role}
                                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(i) } }}
                                    style={{ position: "relative", height: ih, borderRadius: radius, overflow: "hidden", display: "flex", background: panelColor, cursor: "pointer", outline: "none" }}>
                                    <div onPointerEnter={cursorEnabled ? () => setHoverCard(i) : undefined} onPointerLeave={cursorEnabled ? () => setHoverCard(null) : undefined}
                                        style={{ position: "relative", width: cw, height: ih, flexShrink: 0, overflow: "hidden", cursor: cursorEnabled ? "none" : "pointer" }}>
                                        {m.image && m.image.src ? (
                                            <img src={m.image.src} srcSet={m.image.srcSet} alt={m.image.alt || m.name} draggable={false}
                                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} />
                                        ) : <div style={{ width: "100%", height: "100%", background: lineColor }} />}
                                        <AnimatePresence>
                                            {isOpen && (
                                                <motion.button key="x" aria-label="Close profile" onClick={(e) => { e.stopPropagation(); setOpen(null) }}
                                                    initial={{ opacity: 0, scale: 0.4, rotate: -90 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.4, rotate: 90 }}
                                                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 26 }}
                                                    style={{ position: "absolute", top: 14, right: 14, width: 36, height: 36, borderRadius: 36, border: "none", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 3, boxShadow: "0 4px 18px rgba(0,0,0,0.18)" }}>
                                                    <svg width="11" height="11" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 1l8 8M9 1L1 9" stroke="#111" strokeWidth="1.8" strokeLinecap="round" /></svg>
                                                </motion.button>
                                            )}
                                        </AnimatePresence>
                                        {narrow && (
                                            <AnimatePresence>
                                                {isOpen && (
                                                    <motion.div key="ov" variants={group} initial="hide" animate="show" exit={{ opacity: 0, transition: { duration: 0.2 } }}
                                                        style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.88) 55%)", padding: 22, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 14 }}>
                                                        {m.location && <motion.div variants={item} style={{ ...body, color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{m.location}</motion.div>}
                                                        {m.bio && <motion.div variants={item} style={{ ...body, color: "#fff", fontSize: 16, fontWeight: 500, lineHeight: 1.45 }}>{m.bio}</motion.div>}
                                                        {m.email && (
                                                            <motion.button variants={item} onClick={(e) => { e.stopPropagation(); emailClick(m, i) }}
                                                                style={{ ...body, alignSelf: "flex-start", color: "#111", fontSize: 13, fontWeight: 600, padding: "10px 16px", borderRadius: 999, border: "none", background: "#fff", cursor: "pointer" }}>
                                                                {copied === i ? "Copied ✓" : emailAction === "copy" ? "Copy email" : "Send email"}
                                                            </motion.button>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        )}
                                    </div>
                                    {!narrow && (
                                        <div style={{ position: "relative", width: pw, flexShrink: 0, height: ih, background: panelColor }}>
                                            <AnimatePresence>
                                                {isOpen && (
                                                    <motion.div key="panel" variants={group} initial="hide" animate="show" exit={{ opacity: 0, transition: { duration: 0.15 } }}
                                                        style={{ position: "absolute", inset: 0, padding: "30px 28px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                                        <motion.div variants={item} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                                                            <span style={{ ...body, color: panelTextColor, opacity: 0.6, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{m.location}</span>
                                                            <span style={{ ...body, color: panelTextColor, opacity: 0.6, fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{pad2(i + 1)}</span>
                                                        </motion.div>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                                            <motion.div variants={item} style={{ ...body, color: panelTextColor, fontSize: 26, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.05 }}>{m.name}</motion.div>
                                                            <motion.div variants={item} style={{ ...body, color: panelTextColor, opacity: 0.82, fontSize: 16, fontWeight: 500, lineHeight: 1.5 }}>{m.bio}</motion.div>
                                                        </div>
                                                        {m.email ? (
                                                            <motion.button variants={item} whileHover={reduce ? undefined : { scale: 1.04 }} whileTap={reduce ? undefined : { scale: 0.96 }}
                                                                onClick={(e) => { e.stopPropagation(); emailClick(m, i) }}
                                                                style={{ ...body, alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 8, color: panelColor, fontSize: 13, fontWeight: 600, padding: "11px 18px", borderRadius: 999, border: "none", background: panelTextColor, cursor: "pointer" }}>
                                                                {copied === i ? "Copied ✓" : emailAction === "copy" ? "Copy email" : "Send email"}
                                                                <Arrow dir="right" color={panelColor} />
                                                            </motion.button>
                                                        ) : <span />}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </motion.div>
                                <div style={{ width: cw, display: "flex", flexDirection: "column", gap: 5 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                                        <span style={{ ...body, fontSize: 19, fontWeight: 650, letterSpacing: "-0.025em" }}>{m.name}</span>
                                        <span style={{ ...body, fontSize: 12, fontWeight: 700, color: i === active ? textColor : mutedColor, fontVariantNumeric: "tabular-nums", transition: "color .3s" }}>{pad2(i + 1)}</span>
                                    </div>
                                    <span style={{ ...body, fontSize: 14, fontWeight: 500, color: mutedColor }}>{m.role}</span>
                                </div>
                            </motion.div>
                        )
                    })}
                </motion.div>

                {cursorEnabled && <motion.div aria-hidden="true"
                    animate={{ scale: cursorOn ? (dragging ? 0.82 : 1) : 0, opacity: cursorOn ? 1 : 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    style={{ position: "absolute", left: 0, top: 0, x: sx, y: sy, width: 92, height: 92, marginLeft: -46, marginTop: -46, borderRadius: 999, background: cursorColor, color: cursorTextColor, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 6, fontFamily: FONT, fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" }}>
                    <AnimatePresence mode="wait">
                        <motion.span key={cursorLabel} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}>{cursorLabel}</motion.span>
                    </AnimatePresence>
                </motion.div>}
            </div>

            {(showProgress || showCounter || showArrows) && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, padding: "0 " + px + "px" }}>
                    {showProgress && list.length > 1 ? (
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            {list.map((m, i) => {
                                const on = i === active
                                return (
                                    <button key={i} aria-label={"Go to " + m.name} onClick={() => { setOpen(null); setIndex(i) }}
                                        style={{ width: on ? 40 : 16, height: 3, padding: 0, border: "none", borderRadius: 3, background: on ? textColor : lineColor, cursor: "pointer", transition: "width .45s cubic-bezier(.22,1,.36,1), background .45s" }} />
                                )
                            })}
                        </div>
                    ) : <span />}
                    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                        {showCounter && (
                            <div style={{ ...body, display: "flex", alignItems: "center", gap: 4, fontSize: 15, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                                <span style={{ position: "relative", display: "inline-block", overflow: "hidden", height: 20, width: 20 }}>
                                    <AnimatePresence initial={false}>
                                        <motion.span key={active} initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -18, opacity: 0 }}
                                            transition={reduce ? { duration: 0 } : { duration: 0.35, ease: EASE }}
                                            style={{ position: "absolute", left: 0, top: 0, lineHeight: "20px", color: textColor }}>{pad2(Math.min(active + 1, list.length))}</motion.span>
                                    </AnimatePresence>
                                </span>
                                <span style={{ color: mutedColor }}>/ {pad2(list.length)}</span>
                            </div>
                        )}
                        {showArrows && (
                            <div style={{ display: "flex", gap: 8 }}>
                                <motion.button aria-label="Previous" disabled={safeIndex === 0} onClick={() => go(-1)}
                                    whileHover={reduce || safeIndex === 0 ? undefined : { scale: 1.06 }} whileTap={reduce || safeIndex === 0 ? undefined : { scale: 0.92 }}
                                    style={circle(safeIndex === 0, false)}><Arrow dir="left" color={textColor} /></motion.button>
                                <motion.button aria-label="Next" disabled={safeIndex >= maxIndex} onClick={() => go(1)}
                                    whileHover={reduce || safeIndex >= maxIndex ? undefined : { scale: 1.06 }} whileTap={reduce || safeIndex >= maxIndex ? undefined : { scale: 0.92 }}
                                    style={circle(safeIndex >= maxIndex, true)}><Arrow dir="right" color={background} /></motion.button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

TeamReel.defaultProps = {
    members: DEFAULT_MEMBERS,
    showHeader: true,
    eyebrow: "Our people",
    title: "A small crew\nwith big ideas",
    showFilters: true,
    allLabel: "Everyone",
    padding: 40,
    cardWidth: 300,
    imageHeight: 390,
    gap: 16,
    radius: 18,
    panelWidth: 360,
    background: "#F4F3EF",
    textColor: "#0E0E0E",
    mutedColor: "#85827A",
    accentColor: "#FF5A1F",
    panelColor: "#111111",
    panelTextColor: "#FFFFFF",
    lineColor: "#DEDBD3",
    headingWeight: 600,
    autoplay: false,
    interval: 4,
    draggable: true,
    showCursor: true,
    cursorColor: "#111111",
    cursorTextColor: "#FFFFFF",
    showArrows: true,
    showCounter: true,
    showProgress: true,
    emailAction: "copy",
}

addPropertyControls(TeamReel, {
    members: {
        type: ControlType.Array,
        title: "Members",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Portrait" },
                name: { type: ControlType.String, title: "Name", defaultValue: "New member" },
                role: { type: ControlType.String, title: "Role", defaultValue: "Designer" },
                group: { type: ControlType.String, title: "Group", defaultValue: "Design" },
                location: { type: ControlType.String, title: "Meta", defaultValue: "City · Since 2024" },
                bio: { type: ControlType.String, title: "Bio", displayTextArea: true, defaultValue: "A short line about this person." },
                email: { type: ControlType.String, title: "Email", defaultValue: "" },
            },
        },
        defaultValue: DEFAULT_MEMBERS,
    },
    showHeader: { type: ControlType.Boolean, title: "Header", defaultValue: true },
    eyebrow: { type: ControlType.String, title: "Eyebrow", defaultValue: "Our people", hidden: (p: Props) => !p.showHeader },
    title: { type: ControlType.String, title: "Title", displayTextArea: true, defaultValue: "A small crew\nwith big ideas", hidden: (p: Props) => !p.showHeader },
    showFilters: { type: ControlType.Boolean, title: "Filters", defaultValue: true },
    allLabel: { type: ControlType.String, title: "All Label", defaultValue: "Everyone", hidden: (p: Props) => !p.showFilters },
    draggable: { type: ControlType.Boolean, title: "Drag", defaultValue: true },
    showCursor: { type: ControlType.Boolean, title: "Cursor", defaultValue: true },
    showArrows: { type: ControlType.Boolean, title: "Arrows", defaultValue: true },
    showCounter: { type: ControlType.Boolean, title: "Counter", defaultValue: true },
    showProgress: { type: ControlType.Boolean, title: "Progress", defaultValue: true },
    autoplay: { type: ControlType.Boolean, title: "Autoplay", defaultValue: false },
    interval: { type: ControlType.Number, title: "Interval", min: 1.5, max: 15, step: 0.5, unit: "s", defaultValue: 4, hidden: (p: Props) => !p.autoplay },
    emailAction: { type: ControlType.Enum, title: "Email", options: ["copy", "mailto"], optionTitles: ["Copy", "Open mail"], displaySegmentedControl: true, defaultValue: "copy" },
    padding: { type: ControlType.Number, title: "Padding", min: 0, max: 160, defaultValue: 40 },
    cardWidth: { type: ControlType.Number, title: "Card Width", min: 180, max: 520, defaultValue: 300 },
    imageHeight: { type: ControlType.Number, title: "Image Height", min: 200, max: 700, defaultValue: 390 },
    panelWidth: { type: ControlType.Number, title: "Panel Width", min: 220, max: 560, defaultValue: 360 },
    gap: { type: ControlType.Number, title: "Gap", min: 0, max: 64, defaultValue: 16 },
    radius: { type: ControlType.Number, title: "Radius", min: 0, max: 48, defaultValue: 18 },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#F4F3EF" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#0E0E0E" },
    mutedColor: { type: ControlType.Color, title: "Muted", defaultValue: "#85827A" },
    accentColor: { type: ControlType.Color, title: "Accent Dot", defaultValue: "#FF5A1F" },
    panelColor: { type: ControlType.Color, title: "Panel", defaultValue: "#111111" },
    panelTextColor: { type: ControlType.Color, title: "Panel Text", defaultValue: "#FFFFFF" },
    lineColor: { type: ControlType.Color, title: "Lines", defaultValue: "#DEDBD3" },
    cursorColor: { type: ControlType.Color, title: "Cursor", defaultValue: "#111111", hidden: (p: Props) => !p.showCursor },
    cursorTextColor: { type: ControlType.Color, title: "Cursor Text", defaultValue: "#FFFFFF", hidden: (p: Props) => !p.showCursor },
    headingFont: { type: ControlType.Font, title: "Heading Font", controls: "extended", defaultFontType: "sans-serif" },
    headingWeight: { type: ControlType.Enum, title: "Heading Weight", options: [500, 600, 700, 800], optionTitles: ["Medium", "Semibold", "Bold", "Extra Bold"], defaultValue: 600 },
    bodyFont: { type: ControlType.Font, title: "Body Font", controls: "basic", defaultFontType: "sans-serif" },
})
