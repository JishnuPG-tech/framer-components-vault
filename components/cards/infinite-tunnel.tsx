import React, { useRef, useEffect, useState, useMemo, useCallback } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ---- types -------------------------------------------------------------

type ImgValue = { src?: string } | string | undefined

interface ManualItem {
    image?: ImgValue
    caption?: string
    link?: string
}

interface Resolved {
    src: string
    caption: string
    href: string
}

interface Slot {
    baseAngle: number
    ux: number
    uy: number
}

type Mode = "spiral" | "corridor" | "scatter"

interface Props {
    source?: "manual" | "cms"
    items?: ManualItem[]
    collectionSlot?: React.ReactNode
    layout?: {
        mode?: Mode
        count?: number
        cardWidth?: number
        aspect?: number
        spacing?: number
        spread?: number
        cornerRadius?: number
        captions?: boolean
    }
    motion?: {
        wheel?: boolean
        drag?: boolean
        speed?: number
        direction?: "forward" | "back"
        newTab?: boolean
        cursor?: boolean
    }
    camera?: {
        perspective?: number
        spin?: number
        sway?: number
    }
    effects?: {
        fog?: number
        motionBlur?: number
        vignette?: number
    }
    caption?: {
        show?: boolean
        font?: React.CSSProperties
        align?: "left" | "center" | "right"
        color?: string
    }
    style?: {
        background?: string
        captionColor?: string
        shadow?: boolean
        shadowColor?: string
        shadowSize?: number
    }
    width?: number
    height?: number
}

// ---- constants ---------------------------------------------------------

const GOLDEN = Math.PI * (3 - Math.sqrt(5)) // ~137.5deg, even helix spacing

const PLACEHOLDERS: Resolved[] = [
    { src: "https://framerusercontent.com/images/6zVhN2rRmVmDMgecSeyQAleShFg.jpg", caption: "Aurora", href: "" },
    { src: "https://framerusercontent.com/images/gVJ5dWV0aBBebqEqxVDhXMv50.jpg", caption: "Drift", href: "" },
    { src: "https://framerusercontent.com/images/Zv124GRvs0ZyN7ZEBChEYEe7UHM.jpg", caption: "Vertex", href: "" },
    { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", caption: "Halo", href: "" },
    { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", caption: "Echo", href: "" },
    { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", caption: "Lumen", href: "" },
    { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", caption: "Strata", href: "" },
    { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", caption: "Pulse", href: "" },
]

// ---- helpers -----------------------------------------------------------

function srcOf(value: ImgValue): string {
    if (!value) return ""
    return typeof value === "string" ? value : value.src ?? ""
}

function resolveManual(items?: ManualItem[]): Resolved[] {
    if (!items || items.length === 0) return PLACEHOLDERS
    const out: Resolved[] = []
    for (const it of items) {
        const src = srcOf(it.image)
        if (!src) continue
        out.push({ src, caption: it.caption ?? "", href: it.link ?? "" })
    }
    return out.length ? out : PLACEHOLDERS
}

function clampN(n: number | string, a: number, b: number) {
    return Math.min(b, Math.max(a, Number(n) || 0))
}

// deterministic pseudo-random in [0,1) for the scatter layout
function rand(i: number, s: number) {
    const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453
    return x - Math.floor(x)
}

// per-slot base position (unit vectors / angle), independent of spread
function buildSlots(count: number, mode: Mode): Slot[] {
    const slots: Slot[] = []
    for (let i = 0; i < count; i++) {
        if (mode === "spiral") {
            slots.push({ baseAngle: i * GOLDEN, ux: 0, uy: 0 })
        } else if (mode === "corridor") {
            const wall = i % 4
            const lateral = ((i / 4) | 0) % 2 ? 0.5 : -0.5
            let ux = 0
            let uy = 0
            if (wall === 0) { ux = lateral; uy = -1 }
            else if (wall === 1) { ux = 1; uy = lateral }
            else if (wall === 2) { ux = lateral; uy = 1 }
            else { ux = -1; uy = lateral }
            slots.push({ baseAngle: 0, ux, uy })
        } else {
            const ux = (rand(i, 1) * 2 - 1) * 1.4
            const uy = (rand(i, 2) * 2 - 1) * 1.4
            slots.push({ baseAngle: 0, ux, uy })
        }
    }
    return slots
}

// ---- component ---------------------------------------------------------

/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 700
 *
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function InfiniteTunnel(props: Props) {
    const {
        source = "manual",
        items,
        collectionSlot,
        layout = {},
        motion = {},
        camera = {},
        effects = {},
        style = {},
    } = props

    const mode = (layout.mode ?? "spiral") as Mode
    const count = Math.round(clampN(layout.count ?? 14, 4, 60))
    const cardWidth = clampN(layout.cardWidth ?? 240, 40, 1000)
    const aspect = clampN(layout.aspect ?? 1.3, 0.2, 4)
    const cardHeight = cardWidth * aspect
    const spacing = clampN(layout.spacing ?? 300, 40, 2000)
    const spread = clampN(layout.spread ?? 240, 0, 2000)
    const cornerRadius = clampN(layout.cornerRadius ?? 14, 0, 200)

    const wheel = motion.wheel ?? true
    const drag = motion.drag ?? true
    const speed = clampN(motion.speed ?? 60, 0, 2000)
    const direction = motion.direction ?? "forward"
    const newTab = motion.newTab ?? false
    const showCursor = motion.cursor ?? false

    const perspective = clampN(camera.perspective ?? 1000, 200, 4000)
    const spin = clampN(camera.spin ?? 90, 0, 360)
    const sway = clampN(camera.sway ?? 8, 0, 30)

    const fog = clampN(effects.fog ?? 60, 0, 100)
    const motionBlur = clampN(effects.motionBlur ?? 6, 0, 30)
    const vignette = clampN(effects.vignette ?? 40, 0, 100)

    const background = style.background ?? "#06070a"

    // captions + typography (legacy layout.captions / style.captionColor fallbacks)
    const caption = props.caption ?? {}
    const captionsOn = caption.show ?? layout.captions ?? false
    const captionFont = caption.font
    const captionAlign = caption.align ?? "center"
    const captionColor = caption.color ?? style.captionColor ?? "#ffffff"

    // card shadow (user-settable; looks heavy on a white bg by default so it can be dialled or turned off)
    const shadowOn = style.shadow ?? true
    const shadowColor = style.shadowColor ?? "rgba(0,0,0,0.45)"
    const shadowSize = clampN(style.shadowSize ?? 60, 0, 200)
    const cardShadow = shadowOn
        ? `0 ${Math.round(shadowSize * 0.4)}px ${shadowSize}px ${shadowColor}`
        : "none"

    const isStatic = useIsStaticRenderer()

    // resolved content (manual or CMS), cycled across `count` slots
    const manualItems = useMemo(() => resolveManual(items), [items])
    const [cmsItems, setCmsItems] = useState<Resolved[]>([])
    const resolved =
        source === "cms" ? (cmsItems.length ? cmsItems : PLACEHOLDERS) : manualItems
    const N = resolved.length

    const slots = useMemo(() => buildSlots(count, mode), [count, mode])

    // refs
    const rootRef = useRef<HTMLDivElement | null>(null)
    const stageRef = useRef<HTMLDivElement | null>(null)
    const probeRef = useRef<HTMLDivElement | null>(null)
    const cardRefs = useRef<(HTMLDivElement | null)[]>([])
    const imgRefs = useRef<(HTMLImageElement | null)[]>([])
    // live per-card depth + opacity, for click hit-testing
    const cardZRef = useRef<number[]>([])
    const cardOpRef = useRef<number[]>([])
    // src -> the real anchor inside the CMS slot, so clicks use Framer routing
    const anchorsRef = useRef<Map<string, HTMLAnchorElement>>(new Map())

    const camZRef = useRef(0)
    const camRawRef = useRef(0)
    const prevCamRef = useRef(0)
    const velRef = useRef(0)
    const lastFrameRef = useRef(0)

    const draggingRef = useRef(false)
    const movedRef = useRef(false)
    const startYRef = useRef(0)
    const startRawRef = useRef(0)
    const downXRef = useRef(0)
    const downYRef = useRef(0)

    const swayTXRef = useRef(0)
    const swayTYRef = useRef(0)
    const swayXRef = useRef(0)
    const swayYRef = useRef(0)

    // ---- CMS slot probe: img + caption (first text) + anchor -----------
    // runs on the canvas too (isStatic) so the design view previews real CMS
    useEffect(() => {
        if (source !== "cms") return
        // Skip only during true static OUTPUT (export / thumbnail generation);
        // still runs on the canvas so the design view previews bound CMS content.
        if (
            RenderTarget.current() === RenderTarget.export ||
            RenderTarget.current() === RenderTarget.thumbnail
        )
            return
        const probe = probeRef.current
        if (!probe) return
        const read = () => {
            const out: Resolved[] = []
            const seen = new Set<string>()
            anchorsRef.current.clear()
            probe.querySelectorAll("img").forEach((img) => {
                // Framer renders the distinct per-row CMS image through
                // srcset/currentSrc; the plain `src` attribute is often a
                // shared placeholder, so keying on it collapses many rows to
                // one and the tunnel just repeats. Prefer currentSrc (the
                // actually-displayed image), then srcset's first candidate,
                // then src. This is safe here because the value is snapshotted
                // into each card's data-src at read time and never re-queried
                // live at click, so it can't drift the click-through matching.
                const el = img as HTMLImageElement
                const srcsetFirst = (img.getAttribute("srcset") || "")
                    .split(",")[0]
                    .trim()
                    .split(/\s+/)[0]
                const src =
                    el.currentSrc ||
                    srcsetFirst ||
                    img.getAttribute("src") ||
                    el.src ||
                    ""
                if (!src || seen.has(src)) return
                seen.add(src)
                // nearest ancestor row that holds text
                let row: HTMLElement | null = img.parentElement
                while (row && row !== probe && !(row.textContent || "").trim()) {
                    row = row.parentElement
                }
                let caption = img.getAttribute("alt") || ""
                if (row) {
                    const el = Array.from(row.querySelectorAll("*")).find(
                        (e) => e.children.length === 0 && (e.textContent || "").trim()
                    )
                    if (el) caption = (el.textContent || "").trim()
                }
                // the real anchor (if the row/image is linked) for click routing
                let href = ""
                const a = img.closest("a") as HTMLAnchorElement | null
                if (a) {
                    href = a.getAttribute("href") || ""
                    anchorsRef.current.set(src, a)
                }
                out.push({ src, caption, href })
            })
            setCmsItems((prev) => {
                if (
                    prev.length === out.length &&
                    prev.every(
                        (p, i) => p.src === out[i].src && p.caption === out[i].caption
                    )
                )
                    return prev
                return out
            })
        }
        // Debounce: coalesce mutation bursts into one read per frame.
        let raf = 0
        const schedule = () => {
            if (raf) return
            raf = requestAnimationFrame(() => {
                raf = 0
                read()
            })
        }
        read()
        const obs = new MutationObserver(schedule)
        obs.observe(probe, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true,
            attributeFilter: ["src", "srcset", "alt", "href"],
        })
        return () => {
            obs.disconnect()
            if (raf) cancelAnimationFrame(raf)
        }
    }, [isStatic, source, collectionSlot])

    // ---- navigate a card: click the real CMS anchor, else open the link
    const navigateCard = useCallback(
        (src: string, href: string) => {
            const a = anchorsRef.current.get(src)
            if (a) {
                a.click() // lets Framer's router handle CMS links correctly
                return
            }
            if (!href) return
            if (newTab) window.open(href, "_blank", "noopener")
            else window.location.href = href
        },
        [newTab]
    )

    // ---- input: wheel ---------------------------------------------------
    useEffect(() => {
        if (isStatic || !wheel) return
        const root = rootRef.current
        if (!root) return
        const onWheel = (e: WheelEvent) => {
            e.preventDefault()
            camRawRef.current += e.deltaY
        }
        root.addEventListener("wheel", onWheel, { passive: false })
        return () => root.removeEventListener("wheel", onWheel)
    }, [isStatic, wheel])

    // ---- input: drag + sway + click ------------------------------------
    useEffect(() => {
        if (isStatic) return
        const root = rootRef.current
        if (!root) return

        const setSwayFromEvent = (clientX: number, clientY: number) => {
            if (sway <= 0) return
            const r = root.getBoundingClientRect()
            swayTXRef.current = ((clientX - r.left) / Math.max(r.width, 1)) * 2 - 1
            swayTYRef.current = ((clientY - r.top) / Math.max(r.height, 1)) * 2 - 1
        }

        const onDown = (e: PointerEvent) => {
            if (drag) {
                draggingRef.current = true
                movedRef.current = false
                startYRef.current = e.clientY
                startRawRef.current = camRawRef.current
                if (showCursor) root.style.cursor = "grabbing"
            }
            downXRef.current = e.clientX
            downYRef.current = e.clientY
        }
        const onMove = (e: PointerEvent) => {
            setSwayFromEvent(e.clientX, e.clientY)
            if (!draggingRef.current) return
            const dy = e.clientY - startYRef.current
            if (Math.abs(dy) > 5 || Math.abs(e.clientX - downXRef.current) > 5)
                movedRef.current = true
            // drag up = fly forward
            camRawRef.current = startRawRef.current + (startYRef.current - e.clientY) * 2
        }
        const onUp = () => {
            const wasDragging = draggingRef.current
            draggingRef.current = false
            if (showCursor && drag) root.style.cursor = "grab"
            if (wasDragging && movedRef.current) return // a drag, not a click
            // hit-test by real on-screen rect; pick the frontmost SOLID card
            // under the cursor, ignoring the huge fading ghosts passing the camera
            const x = downXRef.current
            const y = downYRef.current
            let bestI = -1
            let bestZ = -Infinity
            for (let i = 0; i < count; i++) {
                const card = cardRefs.current[i]
                if (!card) continue
                if ((cardOpRef.current[i] ?? 0) < 0.5) continue
                const rect = card.getBoundingClientRect()
                if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                    const z = cardZRef.current[i] ?? -Infinity
                    if (z > bestZ) {
                        bestZ = z
                        bestI = i
                    }
                }
            }
            if (bestI < 0) return
            const card = cardRefs.current[bestI]
            if (!card) return
            navigateCard(
                card.getAttribute("data-src") || "",
                card.getAttribute("data-href") || ""
            )
        }

        const onCancel = () => {
            // a cancelled gesture (e.g. interrupted touch) must not leave the
            // drag latched on; reset without navigating
            draggingRef.current = false
            movedRef.current = false
            if (showCursor && drag) root.style.cursor = "grab"
        }

        root.addEventListener("pointerdown", onDown)
        window.addEventListener("pointermove", onMove)
        window.addEventListener("pointerup", onUp)
        window.addEventListener("pointercancel", onCancel)
        return () => {
            root.removeEventListener("pointerdown", onDown)
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerup", onUp)
            window.removeEventListener("pointercancel", onCancel)
        }
    }, [isStatic, drag, sway, navigateCard, count, showCursor])

    // ---- main rAF loop --------------------------------------------------
    useEffect(() => {
        if (isStatic) return
        const root = rootRef.current
        let frame = 0

        const dirSign = direction === "back" ? -1 : 1
        const passZ = perspective * 0.5
        const S = count * spacing
        const zFar = passZ - S
        const nearFade = Math.max(spacing * 2, 1)
        const fogDist = Math.max((fog / 100) * S, 1)
        const tf = mode === "spiral" ? (spin * Math.PI) / 180 / 1000 : 0
        const rollPer = mode === "spiral" ? 0 : (spin * Math.PI) / 180 / 1000

        const tick = () => {
            const now = performance.now()
            const dt = Math.min(0.05, (now - lastFrameRef.current) / 1000)
            lastFrameRef.current = now

            // auto-drift + eased follow of the raw target
            camRawRef.current += dirSign * speed * dt
            const k = 1 - Math.pow(0.82, dt * 60)
            camZRef.current += (camRawRef.current - camZRef.current) * k
            const camZ = camZRef.current

            // velocity -> motion blur (low-pass smoothed)
            const inst = Math.abs(camZ - prevCamRef.current)
            prevCamRef.current = camZ
            velRef.current += (inst - velRef.current) * 0.2
            const blurPx = motionBlur > 0 ? Math.min(velRef.current * 0.05, motionBlur) : 0

            // stage sway + barrel roll
            const stage = stageRef.current
            if (stage) {
                swayXRef.current += (swayTXRef.current - swayXRef.current) * 0.08
                swayYRef.current += (swayTYRef.current - swayYRef.current) * 0.08
                const rx = -swayYRef.current * sway
                const ry = swayXRef.current * sway
                const rollDeg = (camZ * rollPer * 180) / Math.PI
                stage.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateZ(${rollDeg.toFixed(2)}deg)`
            }

            for (let i = 0; i < count; i++) {
                const card = cardRefs.current[i]
                if (!card) continue
                const slot = slots[i]
                const wrapVal = (((camZ - i * spacing) % S) + S) % S
                const zPos = passZ - S + wrapVal

                let x: number
                let y: number
                if (mode === "spiral") {
                    const angle = slot.baseAngle + zPos * tf
                    x = Math.cos(angle) * spread
                    y = Math.sin(angle) * spread
                } else {
                    x = slot.ux * spread
                    y = slot.uy * spread
                }

                const opNear = clampN((passZ - zPos) / nearFade, 0, 1)
                const opFar = clampN((zPos - zFar) / fogDist, 0, 1)
                const op = Math.min(opNear, opFar)

                card.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${zPos.toFixed(1)}px)`
                card.style.opacity = op.toFixed(3)
                card.style.visibility = op < 0.01 ? "hidden" : "visible"
                cardZRef.current[i] = zPos
                cardOpRef.current[i] = op
                const img = imgRefs.current[i]
                if (img) img.style.filter = blurPx > 0.05 ? `blur(${blurPx.toFixed(2)}px)` : "none"
            }
            frame = requestAnimationFrame(tick)
        }

        const start = () => {
            if (frame) return
            // reset the frame clock on (re)start so dt never jumps after a pause
            lastFrameRef.current = performance.now()
            frame = requestAnimationFrame(tick)
        }
        const stop = () => {
            if (frame) cancelAnimationFrame(frame)
            frame = 0
        }

        // Only run the flight loop while the tunnel is on screen. A rAF loop
        // that runs regardless of visibility burns CPU/GPU with multiple
        // instances on a page and is rejected by Framer review.
        let io: IntersectionObserver | null = null
        if (root && typeof IntersectionObserver !== "undefined") {
            io = new IntersectionObserver(
                (entries) => {
                    for (const e of entries) {
                        if (e.isIntersecting) start()
                        else stop()
                    }
                },
                { threshold: 0 }
            )
            io.observe(root)
        } else {
            start()
        }

        return () => {
            stop()
            if (io) io.disconnect()
        }
    }, [
        isStatic,
        count,
        mode,
        spacing,
        spread,
        perspective,
        spin,
        sway,
        fog,
        motionBlur,
        speed,
        direction,
        slots,
    ])

    // ---- render ---------------------------------------------------------
    const rootH =
        typeof props.height === "number" && props.height > 0 ? props.height : undefined

    // static thumbnail: a calm spread of the first few cards, no motion
    const staticPositions = (i: number) => {
        const passZ = perspective * 0.5
        const S = count * spacing
        const zPos = passZ - S * 0.25 - i * spacing
        const slot = slots[i] || { baseAngle: 0, ux: 0, uy: 0 }
        let x = slot.ux * spread
        let y = slot.uy * spread
        if (mode === "spiral") {
            const angle = slot.baseAngle + zPos * ((spin * Math.PI) / 180 / 1000)
            x = Math.cos(angle) * spread
            y = Math.sin(angle) * spread
        }
        const opFar = clampN((zPos - (passZ - S)) / Math.max((fog / 100) * S, 1), 0, 1)
        return { x, y, zPos, op: Math.min(opFar, 1) }
    }

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: rootH ?? "100%",
                minHeight: 320,
                overflow: "hidden",
                background,
                perspective: `${perspective}px`,
                perspectiveOrigin: "50% 50%",
                touchAction: isStatic ? "auto" : "none",
                cursor: showCursor && drag && !isStatic ? "grab" : undefined,
                userSelect: "none",
                WebkitUserSelect: "none",
            }}
        >
            <div
                ref={stageRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    transformStyle: "preserve-3d",
                    transformOrigin: "50% 50%",
                    willChange: "transform",
                }}
            >
                {Array.from({ length: count }).map((_, i) => {
                    const item = resolved[i % N]
                    const sp = isStatic ? staticPositions(i) : null
                    return (
                        <div
                            key={i}
                            ref={(el) => {
                                cardRefs.current[i] = el
                            }}
                            data-card=""
                            data-src={item.src}
                            data-href={item.href}
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                width: cardWidth,
                                height: cardHeight,
                                marginLeft: -cardWidth / 2,
                                marginTop: -cardHeight / 2,
                                borderRadius: cornerRadius,
                                overflow: "hidden",
                                background: "#111317",
                                boxShadow: cardShadow,
                                backfaceVisibility: "hidden",
                                willChange: "transform, opacity",
                                // cards never capture pointer input; clicks are
                                // hit-tested manually so the focal card wins
                                pointerEvents: "none",
                                transform: sp
                                    ? `translate3d(${sp.x}px, ${sp.y}px, ${sp.zPos}px)`
                                    : undefined,
                                opacity: sp ? sp.op : 0,
                            }}
                        >
                            <img
                                ref={(el) => {
                                    imgRefs.current[i] = el
                                }}
                                src={item.src}
                                alt={item.caption || ""}
                                draggable={false}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    willChange: "filter",
                                }}
                            />
                            {captionsOn && item.caption ? (
                                <div
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        padding: "28px 14px 12px",
                                        // defaults, overridden by the Font control below
                                        fontSize: 16,
                                        fontWeight: 600,
                                        letterSpacing: "0.01em",
                                        ...(captionFont || {}),
                                        color: captionColor,
                                        textAlign: captionAlign,
                                        background:
                                            "linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0))",
                                        pointerEvents: "none",
                                    }}
                                >
                                    {item.caption}
                                </div>
                            ) : null}
                        </div>
                    )
                })}
            </div>

            {/* Accessible, keyboard-focusable links for the navigable cards.
                The 3D cards are pointerEvents:none and clicked via geometric
                hit-testing (the focal card must win over huge fading ghosts),
                so mouse input can't use native anchors. This visually-hidden
                nav gives keyboard and screen-reader users a real <a> per linked
                card, with Framer routing preserved for CMS rows. */}
            {resolved.some((r) => r.href) && (
                <nav
                    aria-label="Tunnel cards"
                    style={{
                        position: "absolute",
                        width: 1,
                        height: 1,
                        margin: -1,
                        padding: 0,
                        border: 0,
                        overflow: "hidden",
                        clip: "rect(0 0 0 0)",
                        clipPath: "inset(50%)",
                        whiteSpace: "nowrap",
                    }}
                >
                    {resolved.map((r, i) =>
                        r.href ? (
                            <a
                                key={i}
                                href={r.href}
                                target={newTab ? "_blank" : undefined}
                                rel={newTab ? "noopener" : undefined}
                                onClick={(e) => {
                                    // route CMS links through the real slot anchor
                                    const a = anchorsRef.current.get(r.src)
                                    if (a) {
                                        e.preventDefault()
                                        a.click()
                                    }
                                }}
                            >
                                {r.caption || `Card ${i + 1}`}
                            </a>
                        ) : null
                    )}
                </nav>
            )}

            {/* vignette */}
            {vignette > 0 && (
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, ${background} 100%)`,
                        opacity: vignette / 100,
                    }}
                />
            )}

            {/* hidden CMS probe (rendered on canvas too so the design previews CMS) */}
            {source === "cms" && (
                <div
                    ref={probeRef}
                    aria-hidden
                    style={{
                        position: "absolute",
                        left: -99999,
                        top: 0,
                        width: 1200,
                        height: 1,
                        opacity: 0,
                        pointerEvents: "none",
                        overflow: "hidden",
                    }}
                >
                    {collectionSlot}
                </div>
            )}
        </div>
    )
}

InfiniteTunnel.displayName = "Infinite Tunnel"

// ---- property controls -------------------------------------------------

addPropertyControls(InfiniteTunnel, {
    source: {
        type: ControlType.Enum,
        title: "Source",
        options: ["manual", "cms"],
        optionTitles: ["Manual", "CMS"],
        defaultValue: "manual",
        displaySegmentedControl: true,
        description: "Hand-pick the cards, or pull images (and captions/links) from a Collection List dropped in the slot below.",
    },
    items: {
        type: ControlType.Array,
        title: "Cards",
        hidden: (p: Partial<Props>) => p.source === "cms",
        description: "The images that fly through the tunnel. They cycle to fill the chosen card count, so even a few will fill the depth.",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    description: "The card image.",
                },
                caption: {
                    type: ControlType.String,
                    title: "Caption",
                    defaultValue: "",
                    description: "Optional label shown on the card when Captions is on.",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    description: "Where this card goes when clicked.",
                },
            },
        },
        defaultValue: [],
    },
    collectionSlot: {
        type: ControlType.ComponentInstance,
        title: "Collection",
        hidden: (p: Partial<Props>) => p.source !== "cms",
        description: "Drop a Collection List with an image (and optional text + link) in its row. Image → card, first text → caption. Link the row (or its image) to a page and clicking the card follows it.",
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        description: "How the cards are arranged in 3D and how dense the tunnel is.",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Arrangement",
                options: ["spiral", "corridor", "scatter"],
                optionTitles: ["Spiral", "Corridor", "Scatter"],
                defaultValue: "spiral",
                description: "Spiral winds the cards on a helix that twists toward you. Corridor mounts them on the 4 walls of a hallway. Scatter floats them in a loose cloud.",
            },
            count: {
                type: ControlType.Number,
                title: "Cards in View",
                min: 4,
                max: 60,
                step: 1,
                defaultValue: 14,
                description: "How many card slots fill the tunnel depth. Your images cycle across them.",
            },
            cardWidth: {
                type: ControlType.Number,
                title: "Card Width",
                min: 40,
                max: 1000,
                step: 5,
                unit: "px",
                defaultValue: 240,
                description: "Base card width before perspective scaling.",
            },
            aspect: {
                type: ControlType.Number,
                title: "Aspect (H/W)",
                min: 0.2,
                max: 4,
                step: 0.05,
                defaultValue: 1.3,
                description: "Card height as a multiple of its width. 1 is square, 1.3 is portrait.",
            },
            spacing: {
                type: ControlType.Number,
                title: "Depth Gap",
                min: 40,
                max: 2000,
                step: 10,
                unit: "px",
                defaultValue: 300,
                description: "Distance between cards along the flight axis. Larger is sparser and longer.",
            },
            spread: {
                type: ControlType.Number,
                title: "Spread",
                min: 0,
                max: 2000,
                step: 10,
                unit: "px",
                defaultValue: 240,
                description: "How far cards sit off the center axis. The radius of the spiral, the width of the corridor, the size of the cloud.",
            },
            cornerRadius: {
                type: ControlType.Number,
                title: "Corner Radius",
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
                defaultValue: 14,
                description: "Rounding on the card corners.",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        description: "What drives the forward flight. Scroll, drag, and an optional constant drift can all be on at once.",
        controls: {
            wheel: {
                type: ControlType.Boolean,
                title: "Scroll to Fly",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: true,
                description: "Capture the wheel to fly through the tunnel. This traps page scroll while the cursor is over it, so use it on a full-screen section.",
            },
            drag: {
                type: ControlType.Boolean,
                title: "Drag to Fly",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: true,
                description: "Drag up and down to fly forward and back. A short press without moving counts as a click on the card.",
            },
            speed: {
                type: ControlType.Number,
                title: "Auto Fly",
                min: 0,
                max: 2000,
                step: 10,
                unit: "px/s",
                defaultValue: 60,
                description: "Constant flight speed so the tunnel keeps moving on its own. Set 0 for input-only.",
            },
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["forward", "back"],
                optionTitles: ["Forward", "Back"],
                defaultValue: "forward",
                displaySegmentedControl: true,
                description: "Which way the auto fly travels.",
            },
            newTab: {
                type: ControlType.Boolean,
                title: "Open in New Tab",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: false,
                description: "Open card links in a new tab. Applies to manual links and CMS rows without their own Framer link.",
            },
            cursor: {
                type: ControlType.Boolean,
                title: "Drag Cursor",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: false,
                description: "Show the grab / grabbing cursor while Drag to Fly is on. Leave off to keep your own Framer cursor.",
            },
        },
    },
    camera: {
        type: ControlType.Object,
        title: "Camera",
        description: "The lens and the swirl.",
        controls: {
            perspective: {
                type: ControlType.Number,
                title: "Depth",
                min: 200,
                max: 4000,
                step: 50,
                unit: "px",
                defaultValue: 1000,
                description: "The perspective strength. Lower is a wider, more dramatic lens; higher is flatter.",
            },
            spin: {
                type: ControlType.Number,
                title: "Twist",
                min: 0,
                max: 360,
                step: 5,
                defaultValue: 90,
                description: "In Spiral, how hard the helix twists as cards approach (the vortex). In Corridor and Scatter, a slow barrel roll of the whole field.",
            },
            sway: {
                type: ControlType.Number,
                title: "Mouse Sway",
                min: 0,
                max: 30,
                step: 1,
                unit: "°",
                defaultValue: 8,
                description: "How far the tunnel tilts toward the cursor for extra depth. 0 is locked.",
            },
        },
    },
    effects: {
        type: ControlType.Object,
        title: "Effects",
        description: "Atmosphere on top of the flight.",
        controls: {
            fog: {
                type: ControlType.Number,
                title: "Fog",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 60,
                description: "How much of the far distance fades into the background. Higher is deeper, mistier.",
            },
            motionBlur: {
                type: ControlType.Number,
                title: "Motion Blur",
                min: 0,
                max: 30,
                step: 1,
                unit: "px",
                defaultValue: 6,
                description: "Cards blur while you fly fast and sharpen when you slow down. 0 is off.",
            },
            vignette: {
                type: ControlType.Number,
                title: "Vignette",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 40,
                description: "Darkens the edges into the background to focus the center.",
            },
        },
    },
    caption: {
        type: ControlType.Object,
        title: "Caption",
        description: "The label on each card, and its typography. Off by default.",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Captions",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: false,
                description: "Show the caption label at the bottom of each card.",
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultValue: { fontSize: 16, variant: "Semibold", lineHeight: 1.2 },
                description: "Typeface, weight, size, line height, and letter spacing for the caption. Size is in px and scales with the card as it flies.",
                hidden: (p: { show?: boolean }) => !p.show,
            },
            align: {
                type: ControlType.Enum,
                title: "Align",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                defaultValue: "center",
                displaySegmentedControl: true,
                description: "Horizontal alignment of the caption text.",
                hidden: (p: { show?: boolean }) => !p.show,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#ffffff",
                description: "Caption text color.",
                hidden: (p: { show?: boolean }) => !p.show,
            },
        },
    },
    style: {
        type: ControlType.Object,
        title: "Style",
        description: "Made with 🖤 for [Framer](https://framer.link/harshupadhyay) by [Harsh](https://harsh.works/)",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#06070a",
                description: "The void the cards fly through. The fog and vignette fade to this color.",
            },
            shadow: {
                type: ControlType.Boolean,
                title: "Card Shadow",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: true,
                description: "Drop shadow under each card. Turn it off or lighten it on a white or pale background, where a dark shadow looks heavy.",
            },
            shadowColor: {
                type: ControlType.Color,
                title: "Shadow Color",
                defaultValue: "rgba(0,0,0,0.45)",
                description: "Colour and opacity of the card shadow. Lower the alpha for a subtler shadow on light backgrounds.",
                hidden: (p: { shadow?: boolean }) => p.shadow === false,
            },
            shadowSize: {
                type: ControlType.Number,
                title: "Shadow Size",
                min: 0,
                max: 200,
                step: 2,
                unit: "px",
                defaultValue: 60,
                description: "How large and soft the shadow is. Lower is tighter, higher spreads it further.",
                hidden: (p: { shadow?: boolean }) => p.shadow === false,
            },
        },
    },
})
