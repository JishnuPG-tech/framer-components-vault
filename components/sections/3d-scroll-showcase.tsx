import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"

type Entry = {
    label?: string
    heading?: string
    body?: string
    image?: any
    imageUrl?: string
    link?: string
}

const FALLBACK: Entry[] = [
    {
        label: "Research",
        heading: "Research",
        body: "Every project opens with field notes, site visits and honest questions, so the work is rooted in how people actually live and move.",
        imageUrl:
            "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1400&q=80",
    },
    {
        label: "Architecture",
        heading: "Architecture",
        body: "Calm, durable structures drawn around daylight and circulation, with plans that stay generous long after the first walkthrough.",
        imageUrl:
            "https://images.unsplash.com/photo-1618220179428-22790b461013?w=1400&q=80",
    },
    {
        label: "Craft",
        heading: "Craft",
        body: "Hand-finished surfaces, careful joinery and natural materials that wear in gracefully and reveal more character every season.",
        imageUrl:
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&q=80",
    },
    {
        label: "Styling",
        heading: "Styling",
        body: "The final layer of objects, textiles and light that turns a finished room into a lived-in place ready to be photographed.",
        imageUrl:
            "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1400&q=80",
    },
]

/* ---------- pure helpers (no markup) ---------- */

function tidy(list?: Entry[]): Entry[] {
    const src = Array.isArray(list) && list.length ? list : FALLBACK
    return src.map((e) => ({
        label: e?.label ?? "",
        heading: e?.heading || e?.label || "",
        body: e?.body ?? "",
        image: e?.image,
        imageUrl: e?.imageUrl,
        link: e?.link,
    }))
}

function pictureOf(e: Entry): string {
    if (e.image && typeof e.image === "object" && e.image.src)
        return e.image.src
    if (typeof e.image === "string" && e.image) return e.image
    return e.imageUrl || ""
}

// fluid size: tracks the stage width against a 1440px reference, never above the set px
function fluid(px: number): string {
    const lo = Math.max(10, px * 0.5)
    return `clamp(${lo}px, ${((px / 1440) * 100).toFixed(3)}cqw, ${px}px)`
}

function typeOf(font: any) {
    if (!font || typeof font !== "object") return {}
    const { fontSize, ...rest } = font
    return rest
}

function frameSize(hPct: number, ratio: number, narrow: boolean, pad: number) {
    const r = Math.max(0.3, ratio || 0.76)
    const capW = narrow ? `calc(100cqw - ${pad * 2}px)` : "40cqw"
    const w = `min(calc(${hPct}cqh * ${r}), ${capW})`
    return { width: w, height: `calc(${w} / ${r})` }
}

function pad2(n: number) {
    return String(n).padStart(2, "0")
}

/* ---------- live-only hooks ---------- */

function useReducedMotion() {
    const [on, setOn] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setOn(mq.matches)
        sync()
        mq.addEventListener?.("change", sync)
        return () => mq.removeEventListener?.("change", sync)
    }, [])
    return on
}

/* ---------- live view ---------- */

function LiveTessitura(p: any) {
    const items = tidy(p.items)
    const count = items.length
    const reduced = useReducedMotion()

    const shellRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const [current, setCurrent] = useState(0)
    const currentRef = useRef(0)
    const [narrow, setNarrow] = useState(false)

    const inView = useRef(false)
    const tabAwake = useRef(true)
    const pending = useRef(0)
    const live = useRef(p)
    live.current = { ...p, count }

    const stickTop = Math.max(0, p.stickyTop ?? 0)
    const mode: "wheel" | "page" = p.mode === "page" ? "page" : "wheel"
    const manualPin = useRef(false)

    const shift = useCallback((dir: number) => {
        const n = live.current.count
        const next = Math.min(n - 1, Math.max(0, currentRef.current + dir))
        if (next === currentRef.current) return false
        currentRef.current = next
        setCurrent(next)
        return true
    }, [])

    const read = useCallback(() => {
        pending.current = 0
        if (!inView.current || !tabAwake.current) return
        const shell = shellRef.current
        const stage = stageRef.current
        if (!shell || !stage) return
        const n = live.current.count
        const top = Math.max(0, live.current.stickyTop ?? 0)
        const box = shell.getBoundingClientRect()
        const stageH = stage.offsetHeight
        const travel = box.height - stageH

        // pin fallback: if an ancestor breaks CSS sticky, pin with a transform
        const pin = Math.min(Math.max(0, top - box.top), Math.max(0, travel))
        if (!manualPin.current && travel > 0) {
            const natural = stage.getBoundingClientRect().top
            if (Math.abs(natural - (box.top + pin)) > 2) {
                manualPin.current = true
                stage.style.position = "relative"
                stage.style.top = "0px"
            }
        }
        if (manualPin.current)
            stage.style.transform = `translate3d(0, ${pin}px, 0)`

        let t = travel > 0 ? (top - box.top) / travel : 0
        t = Math.min(1, Math.max(0, t))
        const next = Math.min(n - 1, Math.floor(t * n))
        if (next !== currentRef.current) {
            currentRef.current = next
            setCurrent(next)
        }
    }, [])

    const ask = useCallback(() => {
        if (pending.current || !inView.current || !tabAwake.current) return
        pending.current = requestAnimationFrame(read)
    }, [read])

    // wheel mode: wheel / swipe / arrow keys step items inside the frame,
    // and the page takes over again once the first or last item is reached
    useEffect(() => {
        if (mode !== "wheel") return
        const root = shellRef.current
        if (!root) return

        let acc = 0
        let locked = false
        let lockTimer = 0
        let idleTimer = 0
        let startY = 0
        let swiped = false

        const can = (dir: number) =>
            dir > 0
                ? currentRef.current < live.current.count - 1
                : currentRef.current > 0
        const hold = () => {
            locked = true
            window.clearTimeout(lockTimer)
            const ms = Math.max(260, (live.current.duration ?? 0.9) * 750)
            lockTimer = window.setTimeout(() => {
                locked = false
                acc = 0
            }, ms)
        }
        const go = (dir: number) => {
            if (shift(dir)) hold()
        }

        const onWheel = (ev: WheelEvent) => {
            const d = ev.deltaY
            if (!d || Math.abs(d) < Math.abs(ev.deltaX)) return
            const dir = d > 0 ? 1 : -1
            if (!locked && !can(dir)) return
            ev.preventDefault()
            if (locked) return
            acc += d
            window.clearTimeout(idleTimer)
            idleTimer = window.setTimeout(() => (acc = 0), 180)
            if (Math.abs(acc) >= (live.current.sensitivity ?? 40)) {
                acc = 0
                go(dir)
            }
        }
        const onTouchStart = (ev: TouchEvent) => {
            startY = ev.touches[0]?.clientY ?? 0
            swiped = false
        }
        const onTouchMove = (ev: TouchEvent) => {
            const y = ev.touches[0]?.clientY ?? 0
            const dy = startY - y
            if (Math.abs(dy) < 6) return
            const dir = dy > 0 ? 1 : -1
            if (!can(dir) && !locked && !swiped) return
            ev.preventDefault()
            if (!swiped && !locked && Math.abs(dy) > 45) {
                swiped = true
                go(dir)
            }
        }
        const onKey = (ev: KeyboardEvent) => {
            if (ev.key === "ArrowDown" || ev.key === "ArrowRight") {
                if (can(1)) {
                    ev.preventDefault()
                    if (!locked) go(1)
                }
            } else if (ev.key === "ArrowUp" || ev.key === "ArrowLeft") {
                if (can(-1)) {
                    ev.preventDefault()
                    if (!locked) go(-1)
                }
            }
        }

        root.addEventListener("wheel", onWheel, { passive: false })
        root.addEventListener("touchstart", onTouchStart, { passive: true })
        root.addEventListener("touchmove", onTouchMove, { passive: false })
        root.addEventListener("keydown", onKey)
        return () => {
            root.removeEventListener("wheel", onWheel)
            root.removeEventListener("touchstart", onTouchStart)
            root.removeEventListener("touchmove", onTouchMove)
            root.removeEventListener("keydown", onKey)
            window.clearTimeout(lockTimer)
            window.clearTimeout(idleTimer)
        }
    }, [mode, shift])

    // page mode: track page scroll, rAF only while in view and tab visible
    useEffect(() => {
        if (mode !== "page") return
        const shell = shellRef.current
        if (!shell) return
        manualPin.current = false
        if (stageRef.current) {
            stageRef.current.style.transform = ""
            stageRef.current.style.position = ""
            stageRef.current.style.top = ""
        }

        let io: IntersectionObserver | null = null
        if (typeof IntersectionObserver !== "undefined") {
            io = new IntersectionObserver(
                (rows) => {
                    inView.current = rows.some((r) => r.isIntersecting)
                    if (inView.current) ask()
                    else if (pending.current) {
                        cancelAnimationFrame(pending.current)
                        pending.current = 0
                    }
                },
                { threshold: 0 }
            )
            io.observe(shell)
        } else {
            inView.current = true
            ask()
        }

        const onVis = () => {
            tabAwake.current = document.visibilityState !== "hidden"
            if (tabAwake.current) ask()
        }
        onVis()

        window.addEventListener("scroll", ask, { passive: true, capture: true })
        window.addEventListener("resize", ask, { passive: true })
        document.addEventListener("visibilitychange", onVis)

        return () => {
            io?.disconnect()
            window.removeEventListener("scroll", ask, { capture: true } as any)
            window.removeEventListener("resize", ask)
            document.removeEventListener("visibilitychange", onVis)
            if (pending.current) cancelAnimationFrame(pending.current)
            pending.current = 0
        }
    }, [ask, mode])

    useEffect(() => {
        const stage = stageRef.current
        if (!stage || typeof ResizeObserver === "undefined") return
        const bp = live.current.breakpoint ?? 810
        const ro = new ResizeObserver((rows) => {
            const w = rows[0]?.contentRect.width ?? 0
            setNarrow(w > 0 && w < (live.current.breakpoint ?? bp))
        })
        ro.observe(stage)
        return () => ro.disconnect()
    }, [])

    useEffect(() => {
        if (currentRef.current > count - 1) {
            currentRef.current = Math.max(0, count - 1)
            setCurrent(currentRef.current)
        }
        ask()
    }, [count, ask])

    const goTo = (i: number) => {
        if (mode === "wheel") {
            currentRef.current = i
            setCurrent(i)
            return
        }
        const shell = shellRef.current
        const stage = stageRef.current
        if (!shell || !stage || typeof window === "undefined") return
        const box = shell.getBoundingClientRect()
        const travel = box.height - stage.offsetHeight
        const y =
            window.scrollY + box.top - stickTop + travel * ((i + 0.5) / count)
        window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" })
    }

    const dur = reduced ? 0 : Math.max(0.1, p.duration ?? 0.9)
    const curve = [0.76, 0, 0.18, 1] as any
    const style = p.transition ?? "wipe"
    const pad = p.padding ?? 24
    const frame = frameSize(
        p.imageHeight ?? 88,
        p.imageRatio ?? 0.76,
        narrow,
        pad
    )

    const listFont = typeOf(p.listFont)
    const headFont = typeOf(p.headingFont)
    const bodyFont = typeOf(p.bodyFont)
    const tagFont = typeOf(p.indexFont)

    const listCol = (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: fluid(p.listGap ?? 4),
                alignSelf: "center",
                minWidth: 0,
            }}
        >
            {items.map((e, i) => (
                <motion.button
                    key={i}
                    type="button"
                    onClick={() => goTo(i)}
                    initial={false}
                    animate={{
                        color: i === current ? p.activeColor : p.idleColor,
                    }}
                    transition={{ duration: dur * 0.6, ease: "easeOut" }}
                    style={{
                        all: "unset",
                        cursor: "pointer",
                        fontSize: fluid(
                            narrow
                                ? (p.listSize ?? 40) * 0.7
                                : (p.listSize ?? 40)
                        ),
                        whiteSpace: "nowrap",
                        ...listFont,
                    }}
                >
                    {e.label}
                </motion.button>
            ))}
        </div>
    )

    const layers = items.map((e, i) => {
        const shown = i <= current
        const isTop = i === current
        let anim: any
        if (style === "fade") {
            anim = {
                opacity: shown ? 1 : 0,
                clipPath: "inset(0% 0% 0% 0%)",
                scale: 1,
            }
        } else if (style === "zoom") {
            anim = {
                opacity: shown ? 1 : 0,
                clipPath: "inset(0% 0% 0% 0%)",
                scale: shown ? 1 : 1.08,
            }
        } else {
            anim = {
                opacity: 1,
                clipPath: shown ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)",
                scale: 1,
            }
        }
        const src = pictureOf(e)
        const body = (
            <>
                <motion.div
                    initial={false}
                    animate={{ scale: isTop ? 1 : shown ? 1.05 : 1.14 }}
                    transition={{ duration: dur * 1.3, ease: curve }}
                    style={{ position: "absolute", inset: 0 }}
                >
                    {src ? (
                        <img
                            src={src}
                            alt={e.heading || e.label || ""}
                            draggable={false}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                background: p.placeholder,
                            }}
                        />
                    )}
                </motion.div>
                {p.showIndex && (
                    <span
                        style={{
                            position: "absolute",
                            top: fluid(28),
                            left: fluid(32),
                            color: p.indexColor,
                            fontSize: fluid(p.indexSize ?? 11),
                            ...tagFont,
                        }}
                    >
                        {pad2(i + 1)}
                    </span>
                )}
            </>
        )
        return (
            <motion.div
                key={i}
                initial={false}
                animate={anim}
                transition={{ duration: dur, ease: curve }}
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: i + 1,
                    overflow: "hidden",
                    pointerEvents: isTop ? "auto" : "none",
                }}
            >
                {e.link ? (
                    <a
                        href={e.link}
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "block",
                        }}
                    >
                        {body}
                    </a>
                ) : (
                    body
                )}
            </motion.div>
        )
    })

    const imageCol = (
        <div
            style={{
                position: "relative",
                width: frame.width,
                height: frame.height,
                justifySelf: "center",
                alignSelf: "center",
                borderRadius: p.radius ?? 0,
                overflow: "hidden",
                background: p.placeholder,
            }}
        >
            {layers}
        </div>
    )

    const textCol = (
        <div
            style={{
                display: "grid",
                alignSelf: "center",
                paddingLeft: narrow ? 0 : fluid(p.textInset ?? 56),
                maxWidth: narrow ? "100%" : fluid(p.textWidth ?? 520),
                minWidth: 0,
            }}
        >
            {items.map((e, i) => {
                const on = i === current
                const lift = i < current ? -14 : 14
                return (
                    <motion.div
                        key={i}
                        initial={false}
                        animate={{ opacity: on ? 1 : 0, y: on ? 0 : lift }}
                        transition={{
                            duration: dur * 0.65,
                            delay: on ? dur * 0.3 : 0,
                            ease: curve,
                        }}
                        style={{
                            gridArea: "1 / 1",
                            pointerEvents: on ? "auto" : "none",
                        }}
                        aria-hidden={!on}
                    >
                        <div
                            style={{
                                margin: 0,
                                color: p.headingColor,
                                fontSize: fluid(p.headingSize ?? 26),
                                ...headFont,
                            }}
                        >
                            {e.heading}
                        </div>
                        <p
                            style={{
                                margin: 0,
                                marginTop: fluid(p.textGap ?? 18),
                                color: p.bodyColor,
                                fontSize: fluid(p.bodySize ?? 14),
                                ...bodyFont,
                            }}
                        >
                            {e.body}
                        </p>
                    </motion.div>
                )
            })}
        </div>
    )

    return (
        <div
            ref={shellRef}
            tabIndex={mode === "wheel" ? 0 : undefined}
            style={{
                ...p.style,
                position: "relative",
                width: "100%",
                height:
                    mode === "wheel"
                        ? "100%"
                        : `${count * Math.max(30, p.scrollPerItem ?? 100)}vh`,
                background: p.background,
                outline: "none",
            }}
        >
            <div
                ref={stageRef}
                style={
                    {
                        position: mode === "wheel" ? "relative" : "sticky",
                        top: mode === "wheel" ? 0 : stickTop,
                        width: "100%",
                        height:
                            mode === "wheel"
                                ? "100%"
                                : `calc(100vh - ${stickTop}px)`,
                        overflow: "hidden",
                        containerType: "size",
                        boxSizing: "border-box",
                        padding: pad,
                        display: "grid",
                        gridTemplateColumns: narrow ? "1fr" : "1fr auto 1fr",
                        gridTemplateRows: narrow ? "auto 1fr auto" : "100%",
                        gap: narrow ? 20 : 0,
                    } as any
                }
            >
                {listCol}
                {imageCol}
                {textCol}
            </div>
        </div>
    )
}

/* ---------- static view (canvas / export) ---------- */

function StaticTessitura(p: any) {
    const items = tidy(p.items)
    const first = items[0]
    const pad = p.padding ?? 24
    const frame = frameSize(
        p.imageHeight ?? 88,
        p.imageRatio ?? 0.76,
        false,
        pad
    )
    const src = pictureOf(first)
    const listFont = typeOf(p.listFont)
    const headFont = typeOf(p.headingFont)
    const bodyFont = typeOf(p.bodyFont)
    const tagFont = typeOf(p.indexFont)

    return (
        <div
            style={{
                ...p.style,
                position: "relative",
                width: "100%",
                height: p.mode === "page" ? "100vh" : "100%",
                background: p.background,
                overflow: "hidden",
            }}
        >
            <div
                style={
                    {
                        width: "100%",
                        height: "100%",
                        containerType: "size",
                        boxSizing: "border-box",
                        padding: pad,
                        display: "grid",
                        gridTemplateColumns: "1fr auto 1fr",
                        gridTemplateRows: "100%",
                    } as any
                }
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: fluid(p.listGap ?? 4),
                        alignSelf: "center",
                    }}
                >
                    {items.map((e, i) => (
                        <div
                            key={i}
                            style={{
                                color: i === 0 ? p.activeColor : p.idleColor,
                                fontSize: fluid(p.listSize ?? 40),
                                whiteSpace: "nowrap",
                                ...listFont,
                            }}
                        >
                            {e.label}
                        </div>
                    ))}
                </div>

                <div
                    style={{
                        position: "relative",
                        width: frame.width,
                        height: frame.height,
                        justifySelf: "center",
                        alignSelf: "center",
                        borderRadius: p.radius ?? 0,
                        overflow: "hidden",
                        background: p.placeholder,
                    }}
                >
                    {src && (
                        <img
                            src={src}
                            alt={first.heading || ""}
                            style={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                            }}
                        />
                    )}
                    {p.showIndex && (
                        <span
                            style={{
                                position: "absolute",
                                top: fluid(28),
                                left: fluid(32),
                                color: p.indexColor,
                                fontSize: fluid(p.indexSize ?? 11),
                                ...tagFont,
                            }}
                        >
                            01
                        </span>
                    )}
                </div>

                <div
                    style={{
                        alignSelf: "center",
                        paddingLeft: fluid(p.textInset ?? 56),
                        maxWidth: fluid(p.textWidth ?? 520),
                    }}
                >
                    <div
                        style={{
                            color: p.headingColor,
                            fontSize: fluid(p.headingSize ?? 26),
                            ...headFont,
                        }}
                    >
                        {first.heading}
                    </div>
                    <p
                        style={{
                            margin: 0,
                            marginTop: fluid(p.textGap ?? 18),
                            color: p.bodyColor,
                            fontSize: fluid(p.bodySize ?? 14),
                            ...bodyFont,
                        }}
                    >
                        {first.body}
                    </p>
                </div>
            </div>
        </div>
    )
}

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Tessitura(props: any) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <StaticTessitura {...props} />
    return <LiveTessitura {...props} />
}

Tessitura.defaultProps = {
    items: FALLBACK,
    mode: "wheel",
    sensitivity: 40,
    scrollPerItem: 100,
    stickyTop: 0,
    transition: "wipe",
    duration: 0.9,
    background: "#FAFAFA",
    placeholder: "#E6E6E6",
    activeColor: "#0A0A0A",
    idleColor: "#C6C6C6",
    headingColor: "#0A0A0A",
    bodyColor: "#7A7A7A",
    indexColor: "#FFFFFF",
    showIndex: true,
    listSize: 40,
    listGap: 4,
    headingSize: 26,
    bodySize: 14,
    indexSize: 11,
    textGap: 18,
    textInset: 56,
    textWidth: 520,
    imageHeight: 88,
    imageRatio: 0.76,
    radius: 0,
    padding: 24,
    breakpoint: 810,
}

addPropertyControls(Tessitura, {
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "List Label",
                    defaultValue: "Untitled",
                },
                heading: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Untitled",
                },
                body: {
                    type: ControlType.String,
                    title: "Caption",
                    displayTextArea: true,
                    defaultValue:
                        "Add a short note that explains this part of the process.",
                },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    defaultValue: "",
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: FALLBACK,
    },
    mode: {
        type: ControlType.Enum,
        title: "Scroll",
        options: ["wheel", "page"],
        optionTitles: ["Wheel", "Page Sticky"],
        displaySegmentedControl: true,
        defaultValue: "wheel",
    },
    sensitivity: {
        type: ControlType.Number,
        title: "Wheel Distance",
        min: 10,
        max: 200,
        step: 5,
        defaultValue: 40,
        hidden: (p: any) => p.mode === "page",
    },
    scrollPerItem: {
        type: ControlType.Number,
        title: "Scroll / Item",
        min: 30,
        max: 300,
        step: 5,
        unit: "vh",
        defaultValue: 100,
        hidden: (p: any) => p.mode !== "page",
    },
    stickyTop: {
        type: ControlType.Number,
        title: "Sticky Top",
        min: 0,
        max: 300,
        unit: "px",
        defaultValue: 0,
        hidden: (p: any) => p.mode !== "page",
    },
    transition: {
        type: ControlType.Enum,
        title: "Image Change",
        options: ["wipe", "fade", "zoom"],
        optionTitles: ["Wipe", "Fade", "Zoom"],
        defaultValue: "wipe",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.1,
        max: 2.5,
        step: 0.05,
        unit: "s",
        defaultValue: 0.9,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FAFAFA",
    },
    placeholder: {
        type: ControlType.Color,
        title: "Image Fill",
        defaultValue: "#E6E6E6",
    },
    activeColor: {
        type: ControlType.Color,
        title: "List Active",
        defaultValue: "#0A0A0A",
    },
    idleColor: {
        type: ControlType.Color,
        title: "List Idle",
        defaultValue: "#C6C6C6",
    },
    headingColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#0A0A0A",
    },
    bodyColor: {
        type: ControlType.Color,
        title: "Caption Color",
        defaultValue: "#7A7A7A",
    },
    listFont: {
        type: ControlType.Font,
        title: "List Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontWeight: 500,
            letterSpacing: "-0.035em",
            lineHeight: "1.25em",
        },
    },
    listSize: {
        type: ControlType.Number,
        title: "List Size",
        min: 12,
        max: 120,
        defaultValue: 40,
    },
    listGap: {
        type: ControlType.Number,
        title: "List Gap",
        min: 0,
        max: 60,
        defaultValue: 4,
    },
    headingFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontWeight: 500,
            letterSpacing: "-0.03em",
            lineHeight: "1.2em",
        },
    },
    headingSize: {
        type: ControlType.Number,
        title: "Title Size",
        min: 10,
        max: 96,
        defaultValue: 26,
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Caption Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontWeight: 400,
            letterSpacing: "-0.01em",
            lineHeight: "1.35em",
        },
    },
    bodySize: {
        type: ControlType.Number,
        title: "Caption Size",
        min: 9,
        max: 40,
        defaultValue: 14,
    },
    textGap: {
        type: ControlType.Number,
        title: "Title Gap",
        min: 0,
        max: 80,
        defaultValue: 18,
    },
    textInset: {
        type: ControlType.Number,
        title: "Text Inset",
        min: 0,
        max: 200,
        defaultValue: 56,
    },
    textWidth: {
        type: ControlType.Number,
        title: "Text Width",
        min: 160,
        max: 900,
        defaultValue: 520,
    },
    imageHeight: {
        type: ControlType.Number,
        title: "Image Height",
        min: 30,
        max: 100,
        unit: "%",
        defaultValue: 88,
    },
    imageRatio: {
        type: ControlType.Number,
        title: "Image Ratio",
        min: 0.4,
        max: 1.8,
        step: 0.01,
        defaultValue: 0.76,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 60,
        defaultValue: 0,
    },
    showIndex: {
        type: ControlType.Boolean,
        title: "Number",
        defaultValue: true,
    },
    indexColor: {
        type: ControlType.Color,
        title: "Number Color",
        defaultValue: "#FFFFFF",
        hidden: (p: any) => !p.showIndex,
    },
    indexFont: {
        type: ControlType.Font,
        title: "Number Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontWeight: 500 },
        hidden: (p: any) => !p.showIndex,
    },
    indexSize: {
        type: ControlType.Number,
        title: "Number Size",
        min: 8,
        max: 40,
        defaultValue: 11,
        hidden: (p: any) => !p.showIndex,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 120,
        defaultValue: 24,
    },
    breakpoint: {
        type: ControlType.Number,
        title: "Stack Below",
        min: 320,
        max: 1200,
        unit: "px",
        defaultValue: 810,
    },
})
