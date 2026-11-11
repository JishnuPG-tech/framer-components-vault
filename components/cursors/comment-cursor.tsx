// Comment Cursor: a comment bubble with your initial that follows the pointer.
//   rests on its home spot, follows the pointer while it is over the section,
//   opens on a click to show the message, folds back to the initial once the pointer moves on,
//   and glides home when the pointer leaves. On touch it stays home and a tap opens it.
// Place it over a section (pinned to all four sides). It never blocks clicks underneath.
import { useEffect, useRef, useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion"

interface CommentCursorProps {
    message: string
    initial: string
    homeRight: number
    homeBottom: number
    closeDistance: number
    ignoreTop: number
    font: CSSProperties
    bubble: string
    shadow: string
    avatar: string
    ink: string
    maxWidth: number
    center: boolean
    style?: CSSProperties
}

const SPRING = { stiffness: 380, damping: 34, mass: 0.6 }
// the tail (bottom-right corner) sits just above-left of the pointer
const OFFSET = 6
const AVATAR = 30   // the "e" circle
const PAD = 8       // around the circle; the bubble is AVATAR + 2 * PAD = 46px tall
const TEXT_PAD = 20 // beside the message

/**
 * Comment Cursor
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function CommentCursor(props: CommentCursorProps) {
    const {
        message = "Hi, I’m Alex, a product designer open to new projects.",
        initial = "A",
        homeRight = 160,
        homeBottom = 160,
        closeDistance = 30,
        ignoreTop = 0,
        maxWidth = 440,
        center = false,
        font,
        bubble = "#FFFFFF",
        shadow = "1px 1px 20px 0px rgba(0, 0, 0, 0.1)",
        avatar = "#FF5A1F",
        ink = "#15110E",
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const reduce = useReducedMotion()
    const rootRef = useRef<HTMLDivElement>(null)
    const [open, setOpen] = useState(false)
    const [touch, setTouch] = useState(false)
    const openAt = useRef<{ x: number; y: number } | null>(null)
    // the open width is the message's own width, so nothing gets cut off
    // measured on a hidden one-line copy, so the visible text is free to wrap
    const textRef = useRef<HTMLSpanElement>(null)
    const [openWidth, setOpenWidth] = useState(360)
    // desktop: space either side of the pointer when the bubble opened, so it never runs off an edge
    const [space, setSpace] = useState({ left: 10000, right: 0 })
    // space to the left of the home spot: on touch the bubble opens leftwards, so it must fit there
    const [room, setRoom] = useState(400)
    useEffect(() => {
        const measure = () => {
            const t = textRef.current
            if (!t) return
            const w = Math.ceil(t.scrollWidth) + AVATAR + PAD * 2
            setOpenWidth((o) => (o === w ? o : w))
        }
        measure()
        // measure again once the web font is in, or the width is taken from the fallback font
        if (typeof document !== "undefined" && document.fonts) document.fonts.ready.then(measure)
    }, [message, font])

    // where the tail points, in this layer's own coordinates
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const sx = useSpring(x, SPRING)
    const sy = useSpring(y, SPRING)

    // home = the middle of the layer (Center on), or measured from the bottom-right corner,
    // so it holds its place as the section resizes. The tail sits half a bubble past the point,
    // so with Center on the closed circle itself is centred
    const home = (el: HTMLElement) => center
        ? { hx: el.offsetWidth / 2 + (AVATAR + PAD * 2) / 2, hy: el.offsetHeight / 2 + (AVATAR + PAD * 2) / 2 }
        : { hx: el.offsetWidth - homeRight, hy: el.offsetHeight - homeBottom }
    const goHome = (jump = false) => {
        const el = rootRef.current
        if (!el) return
        const { hx, hy } = home(el)
        x.set(hx); y.set(hy)
        if (jump) { sx.jump(hx); sy.jump(hy) }
    }

    useEffect(() => {
        const sync = () => { goHome(true); const r = rootRef.current; if (r) setRoom(home(r).hx) }
        sync()
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(sync)
        ro.observe(el)
        return () => ro.disconnect()
    }, [homeRight, homeBottom, center])

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches
        startTransition(() => setTouch(!fine))
        if (!fine || reduce) return

        const inside = (e: PointerEvent | MouseEvent) => {
            const r = rootRef.current?.getBoundingClientRect()
            if (!r) return null
            const px = e.clientX - r.left, py = e.clientY - r.top
            // inside Top Gap (for example over a nav), the bubble goes home instead of following
            return px >= 0 && py >= ignoreTop && px <= r.width && py <= r.height ? { px, py } : null
        }
        const onMove = (e: PointerEvent) => {
            const p = inside(e)
            if (!p) {
                goHome()
                openAt.current = null
                setOpen(false)
                return
            }
            x.set(p.px - OFFSET)
            y.set(p.py - OFFSET)
            const o = openAt.current
            if (o && Math.hypot(p.px - o.x, p.py - o.y) > closeDistance) {
                openAt.current = null
                setOpen(false)
            }
        }
        const onClick = (e: MouseEvent) => {
            const p = inside(e)
            if (!p) return
            // links, buttons and the switch keep their own click
            const t = e.target as Element | null
            if (t && t.closest && t.closest("a, button, [role='switch'], input, textarea, select")) return
            openAt.current = { x: p.px, y: p.py }
            const w = rootRef.current?.offsetWidth ?? 0
            setSpace({ left: p.px - OFFSET - 16, right: w - (p.px - OFFSET) - 16 })
            setOpen(true)
        }
        window.addEventListener("pointermove", onMove, { passive: true })
        window.addEventListener("click", onClick)
        return () => {
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("click", onClick)
        }
    }, [isStatic, reduce, closeDistance, homeRight, homeBottom, ignoreTop, center])

    // touch: a tap anywhere else closes the bubble
    useEffect(() => {
        if (!touch || !open) return
        const off = (e: PointerEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false) }
        window.addEventListener("pointerdown", off)
        return () => window.removeEventListener("pointerdown", off)
    }, [touch, open])
    // touch: the open bubble fills all the space left of the "e", down to a 16px margin (160–360px)
    const touchWidth = Math.max(160, Math.min(360, room - 16))
    // desktop: one line when it fits Max Width, otherwise it wraps. It opens to the left of the pointer,
    // or flips to the right when the left side is too tight, and never grows past the space it has
    const desired = Math.min(openWidth, maxWidth)
    const flip = !touch && space.left < desired && space.right > space.left
    const avail = flip ? space.right : space.left
    const deskWidth = Math.max(Math.min(160, avail), Math.min(desired, avail))
    const bubbleWidth = touch ? touchWidth : deskWidth
    const wrap = touch || deskWidth < openWidth
    const still = isStatic || reduce

    const text: CSSProperties = {
        fontFamily: "Inter, sans-serif",
        fontSize: 13,
        fontWeight: 500,
        lineHeight: 1.3,
        ...font,
        color: ink,
    }

    return (
        <div ref={rootRef} style={{ ...style, position: "relative", width: "100%", height: "100%", pointerEvents: "none" }}>
            <motion.div style={{ position: "absolute", left: 0, top: 0, x: sx, y: sy }}>
                {/* the bubble hangs up and to the left of its tail */}
                <button
                    type="button"
                    aria-expanded={open}
                    aria-label={message}
                    onClick={touch ? () => setOpen((o) => !o) : undefined}
                    style={{
                        position: "absolute",
                        // the tail corner sits on the pointer: bottom-right normally, bottom-left when flipped
                        right: flip && open ? "auto" : 0,
                        left: flip && open ? 0 : "auto",
                        bottom: 0,
                        display: "flex",
                        flexDirection: flip && open ? "row" : "row-reverse",
                        // touch: the message wraps, so keep the "e" at the bottom corner (the tail) as the bubble grows up
                        alignItems: wrap ? "flex-end" : "center",
                        width: open ? bubbleWidth : AVATAR + PAD * 2,
                        minHeight: AVATAR + PAD * 2,
                        // closed = just the circle; the hidden message must not stretch it (it wraps on touch)
                        maxHeight: open ? 400 : AVATAR + PAD * 2,
                        padding: PAD,
                        border: 0,
                        boxSizing: "border-box",
                        overflow: "hidden",
                        borderRadius: flip && open ? "23px 23px 23px 4px" : "23px 23px 4px 23px",
                        background: bubble,
                        boxShadow: shadow,
                        pointerEvents: touch ? "auto" : "none",
                        WebkitTapHighlightColor: "transparent", touchAction: "manipulation", 
                        cursor: touch ? "pointer" : "default",
                        transition: still ? "none" : "width 260ms cubic-bezier(0.22, 1, 0.36, 1), max-height 260ms cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                >
                    <span
                        style={{
                            display: "grid",
                            placeItems: "center",
                            flex: "none",
                            width: AVATAR,
                            height: AVATAR,
                            borderRadius: "50%",
                            background: avatar,
                            color: ink,
                            fontFamily: "Inter, sans-serif",
                            fontSize: 13,
                            fontWeight: 700,
                            textTransform: "uppercase",
                        }}
                    >
                        {initial}
                    </span>
                    <span
                        style={{
                            ...text,
                            // wrapped (touch, or a long message): the text takes whatever the bubble leaves, with even padding
                            flex: wrap ? "1 1 0" : "none",
                            minWidth: 0,
                            padding: (() => { const near = wrap ? PAD : TEXT_PAD - PAD, far = wrap ? PAD + 4 : TEXT_PAD, v = wrap ? 2 : 0; return flip && open ? `${v}px ${far}px ${v}px ${near}px` : `${v}px ${near}px ${v}px ${far}px` })(),
                            whiteSpace: wrap ? "normal" : "nowrap",
                            textAlign: "left",
                            opacity: open ? 1 : 0,
                            transition: still ? "none" : `opacity 160ms ease ${open ? "80ms" : "0ms"}`,
                        }}
                    >
                        {message}
                    </span>
                    {/* hidden one-line copy, only used to measure the natural width */}
                    <span ref={textRef} aria-hidden style={{ ...text, position: "absolute", visibility: "hidden", whiteSpace: "nowrap", padding: `0 ${TEXT_PAD - PAD}px 0 ${TEXT_PAD}px`, pointerEvents: "none" }}>
                        {message}
                    </span>
                </button>
            </motion.div>
        </div>
    )
}

// the name shown in the Assets panel and insert menu
CommentCursor.displayName = "Comment Cursor"

addPropertyControls(CommentCursor, {
    message: {
        type: ControlType.String,
        title: "Message",
        description: "Shown when the bubble opens. Long messages wrap at Max Width.",
        defaultValue: "Hi, I’m Alex, a product designer open to new projects.",
        displayTextArea: true,
    },
    initial: { type: ControlType.String, title: "Initial", description: "The letter in the circle.", defaultValue: "A" },
    maxWidth: { type: ControlType.Number, title: "Max Width", description: "Desktop only. The open bubble wraps its text beyond this width.", defaultValue: 440, min: 160, max: 600, unit: "px" },
    center: { type: ControlType.Boolean, title: "Center", description: "Rest in the middle of the layer at every screen size. Turn off to place it with Home Right and Home Bottom.", defaultValue: false, enabledTitle: "Yes", disabledTitle: "No" },
    homeRight: { type: ControlType.Number, title: "Home Right", description: "Where the bubble rests: distance from the layer's right edge.", defaultValue: 160, min: 0, max: 1200, unit: "px", hidden: (p: Partial<CommentCursorProps>) => !!p.center },
    homeBottom: { type: ControlType.Number, title: "Home Bottom", description: "Where the bubble rests: distance from the layer's bottom edge.", defaultValue: 160, min: 0, max: 1200, unit: "px", hidden: (p: Partial<CommentCursorProps>) => !!p.center },
    closeDistance: { type: ControlType.Number, title: "Close Distance", description: "Desktop only. After a click opens the bubble, it closes once the mouse moves this far.", defaultValue: 30, min: 5, max: 200, unit: "px" },
    ignoreTop: { type: ControlType.Number, title: "Top Gap", description: "Desktop only. The bubble stops following the mouse this close to the top, for example to stay off a nav.", defaultValue: 0, min: 0, max: 300, unit: "px" },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        description: "The message text.",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "13px", variant: "Medium", lineHeight: "1.3em" },
    },
    bubble: { type: ControlType.Color, title: "Bubble", description: "Background of the bubble.", defaultValue: "#FFFFFF" },
    shadow: { type: ControlType.BoxShadow, title: "Shadow", description: "Shadow under the bubble.", defaultValue: "1px 1px 20px 0px rgba(0, 0, 0, 0.1)" },
    avatar: { type: ControlType.Color, title: "Avatar", description: "The circle behind the initial.", defaultValue: "#FF5A1F" },
    ink: { type: ControlType.Color, title: "Text", description: "Colour of the message and the initial.\n\nComponent crafted by [Eniyan Rajaa K](https://x.com/_eniyanrajaa_)", defaultValue: "#15110E" },
})
