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

import { motion, useMotionValue, useSpring, useReducedMotion, useTransform, type Transition } from "framer-motion"

type ImageValue = { src: string; srcSet?: string; alt?: string }
type LinkValue = string | { type?: string; url?: string; href?: string; path?: string } | null
type Collection = {
    name?: string; color?: string
    image1?: ImageValue; image2?: ImageValue; image3?: ImageValue
    link1?: LinkValue; link1NewTab?: boolean
    link2?: LinkValue; link2NewTab?: boolean
    link3?: LinkValue; link3NewTab?: boolean
}
interface RealFolderProps {
    forms?: Collection
    spaces?: Collection
    fragments?: Collection
    background?: string
    startOpen?: boolean
    enableTilt?: boolean
    speed?: number
    style?: React.CSSProperties
}

const defaults = [
    { name: "Forms", color: "#CB5037" },
    { name: "Spaces", color: "#4568A7" },
    { name: "Fragments", color: "#386451" },
]
const titles = [
    ["Counterbalance", "Soft geometry", "In good company"],
    ["An open door", "Another dimension", "A quieter place"],
    ["Cut from nature", "A little rhythm", "Pieces of a whole"],
]
const css = `
.real-folder,.real-folder *{box-sizing:border-box}
.real-folder button,.real-folder a{-webkit-tap-highlight-color:transparent;touch-action:manipulation;appearance:none}
.real-folder button:focus-visible,.real-folder a:focus-visible{outline:2px solid #252A26;outline-offset:5px}
.real-folder .real-folder-tab:focus-visible{outline-color:#fff;outline-offset:-3px}
@media(prefers-reduced-motion:reduce){.real-folder *{transition:none!important;scroll-behavior:auto!important}}
`

// Nine original vector compositions; no imported marketplace artwork or code.
function Artwork({ collection, index }: { collection: number; index: number }) {
    const cream = "#F2EFDF", red = "#E86042", ink = "#262B29"
    const blue = "#456BBD", powder = "#ADC9DB", forest = "#315F50", citron = "#D9E6A5"
    let art: React.ReactNode
    switch (((collection % 3) * 3 + (index % 3) + 9) % 9) {
        case 0:
            art = <>
                <rect width="300" height="360" fill={cream} />
                <circle cx="150" cy="155" r="109" fill={red} />
                <circle cx="150" cy="155" r="62" fill={cream} />
                <path d="M41 155a109 109 0 0 0 218 0" fill="none" stroke={ink} strokeWidth="28" />
                <rect x="122" y="142" width="56" height="164" rx="28" fill={red} />
                <circle cx="150" cy="302" r="28" fill={ink} />
                <path d="M22 326h57m-57 7h35" stroke={ink} strokeWidth="2" />
            </>
            break
        case 1:
            art = <>
                <rect width="300" height="360" fill={red} />
                <circle cx="246" cy="45" r="80" fill={ink} />
                <circle cx="246" cy="45" r="31" fill={red} />
                {[38, 52, 66, 80, 94, 108, 122, 136].map(r => <path key={r} d={`M${146 - r} 253a${r} ${r} 0 0 1 ${r * 2} 0v107`} fill="none" stroke={cream} strokeWidth="6" />)}
                <rect x="129" y="231" width="34" height="129" rx="17" fill={ink} />
                <circle cx="35" cy="39" r="9" fill={cream} />
            </>
            break
        case 2:
            art = <>
                <rect width="300" height="360" fill={cream} />
                <path d="M33 30h102v102H33z" fill={ink} />
                <path d="M33 132a102 102 0 0 0 102 102V132Z" fill={red} />
                <path d="M165 30a102 102 0 0 1 102 102H165Z" fill={red} />
                <path d="M165 162h102v102H165z" fill={ink} />
                <circle cx="216" cy="213" r="29" fill={cream} />
                <path d="M33 265h102v63H33z" fill={red} />
                {[276, 287, 298, 309, 320].map(y => <path key={y} d={`M33 ${y}h102`} stroke={cream} strokeWidth="3" />)}
                <circle cx="216" cy="311" r="18" fill={ink} />
            </>
            break
        case 3:
            art = <>
                <rect width="300" height="360" fill={powder} />
                <circle cx="239" cy="54" r="28" fill={cream} />
                <path d="M29 360V151a110 110 0 0 1 220 0v209Z" fill={cream} />
                <path d="M61 360V155a78 78 0 0 1 156 0v205Z" fill={blue} />
                <path d="M97 360V163a42 42 0 0 1 84 0v197Z" fill="#284980" />
                <path d="m139 212 78 72v76H61v-76Z" fill={powder} />
                {[237, 256, 280, 309, 344].map((y, i) => <path key={y} d={`M${139 - (y - 212) * .55} ${y}H${139 + (y - 212) * .55}`} stroke={cream} strokeWidth={2 + i * .2} />)}
                <path d="M29 360h220" stroke={cream} strokeWidth="16" />
            </>
            break
        case 4:
            art = <>
                <rect width="300" height="360" fill={blue} />
                <path d="m33 322 90-230 144-49-90 230Z" fill={cream} />
                <path d="m177 273 90-230v106l-90 211Z" fill={powder} />
                <path d="m88 283 54-142c15-39 64-32 49 7l-46 116Z" fill={blue} />
                <path d="m108 275 45-120c7-19 26-18 18 3l-42 111Z" fill="#294A80" />
                <path d="M33 322h36v-12h36v-12h36v-12h36v74H33Z" fill={powder} />
                <path d="M33 340h36m0-12h36m0-12h36m0-12h36" stroke={blue} strokeWidth="2" />
                <circle cx="47" cy="53" r="18" fill={powder} />
            </>
            break
        case 5:
            art = <>
                <rect width="300" height="360" fill={cream} />
                <circle cx="228" cy="84" r="103" fill={powder} />
                {[0, 1, 2, 3, 4, 5].map(i => <path key={i} d={`M${25 + i * 38} 320V${83 + i * 16}l20-20v237Z`} fill={blue} />)}
                <path d="M0 360v-29h48v-22h48v-22h48v-22h48v-22h48v-22h60v139Z" fill={cream} />
                <path d="M0 331h48v-22h48v-22h48v-22h48v-22h48v-22h60" fill="none" stroke={blue} strokeWidth="2" />
                <circle cx="39" cy="41" r="7" fill={blue} />
            </>
            break
        case 6:
            art = <>
                <rect width="300" height="360" fill={forest} />
                <circle cx="51" cy="64" r="28" fill={cream} />
                <path d="M144 325V92" stroke={citron} strokeWidth="7" />
                {[0, 1, 2].map(i => <React.Fragment key={i}>
                    <path d={`M145 ${143 + i * 65}q-88 4-88-62 78-3 88 62Z`} fill={i === 1 ? cream : citron} />
                    <path d={`M145 ${177 + i * 65}q91 1 91-63-77-1-91 63Z`} fill={i === 1 ? citron : cream} />
                </React.Fragment>)}
                <path d="M116 332h57" stroke={citron} strokeWidth="3" />
            </>
            break
        case 7:
            art = <>
                <rect width="300" height="360" fill={cream} />
                <path d="M24 177c0-85 54-148 153-148v148Z" fill={forest} />
                <path d="M177 29v148h99c0-82-29-148-99-148Z" fill={citron} />
                <path d="M24 199h111v130c-79 0-111-50-111-130Z" fill={citron} />
                <path d="M157 199h119c0 78-40 130-119 130Z" fill={forest} />
                <ellipse cx="153" cy="177" rx="39" ry="71" transform="rotate(35 153 177)" fill={cream} />
                <path d="m125 218 56-82" stroke={forest} strokeWidth="3" />
                <circle cx="265" cy="31" r="7" fill={forest} />
            </>
            break
        default:
            art = <>
                <rect width="300" height="360" fill={citron} />
                <path d="M-26 63c89-59 170-25 204 50-61 43-151 39-204-50Z" fill={forest} />
                <path d="M119 166c12-86 100-121 204-65-24 70-117 99-204 65Z" fill={cream} />
                <path d="M-19 252c15-89 102-124 209-71-20 75-118 100-209 71Z" fill={forest} />
                <path d="M120 292c4-87 100-129 203-81-17 83-123 112-203 81Z" fill={forest} />
                <path d="m39 332 215-281" stroke={citron} strokeWidth="7" />
                <circle cx="246" cy="300" r="22" fill={cream} />
            </>
    }
    return <svg viewBox="0 0 300 360" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ display: "block" }}>{art}</svg>
}


interface PaperCardProps {
    index: number
    active: number
    open: boolean
    peek: boolean
    compact: boolean
    still: boolean
    tilt: boolean
    speed: number
    href?: LinkValue
    label: string
    newTab: boolean
    children: React.ReactNode
}

// C2-continuous geometry: one reversible spring drives the entire flight.
function smoothUnit(value: number) {
    const t = Math.max(0, Math.min(1, value))
    return t * t * t * (t * (t * 6 - 15) + 10)
}
function paperFlight(value: number, index: number, compact: boolean, peekAmount: number) {
    const p = Math.max(0, Math.min(1, value))
    const side = index - 1
    const u = smoothUnit(p)
    const delay = [.09, 0, .15][index]
    const spread = smoothUnit((p - delay) / (1 - delay))
    const arc = 64 * p ** 3 * (1 - p) ** 3
    const restingX = compact ? [-99, 0, 100][index] : [-174, 8, 178][index]
    const restingY = compact ? [248, 203, 265][index] : [215, 166, 236][index]
    const closedY = 310 + Math.abs(side) * 7
    const peek = peekAmount * (1 - u)
    return {
        x: side * 20 + (restingX - side * 20) * spread + side * 6 * peek,
        y: closedY - 121 + (restingY - closedY) * u - [24, 29, 24][index] * (compact ? .8 : 1) * arc - 23 * peek,
        z: [34, 52, 42][index] * (compact ? .7 : 1) * arc,
        rotate: side * 7 - 3 + ([-9, 2, 8][index] - (side * 7 - 3)) * u + side * 1.7 * arc,
        rotateX: -13 * arc + 5 * peek,
        rotateY: (side === 0 ? -7 : -side * 20) * arc + side * 9 * peek,
        scale: .89 + ((compact ? .86 : 1) - .89) * u,
        light: arc * .55,
    }
}

function resolveHref(value?: LinkValue) {
    const candidate = typeof value === "string"
        ? value
        : value?.url ?? value?.href ?? value?.path
    const href = typeof candidate === "string" ? candidate.trim() : ""
    return href || undefined
}

function PaperCard({ index, active, open, peek, compact, still, tilt, speed, href, label, newTab, children }: PaperCardProps) {
    const resolvedHref = resolveHref(href)
    const centerX = compact ? 230 : 380
    const restingAngle = [-9, 2, 8][index]
    // Updating a spring target preserves its current velocity on reversals.
    const progress = useSpring(open ? 1 : 0, {
        stiffness: 90 * speed ** 2, damping: 23 * speed, mass: 1,
        restDelta: .0002, restSpeed: .002,
    })
    const peekProgress = useSpring(0, { stiffness: 130, damping: 25 })
    // Canvas subscribes to MotionValue changes with React state. Object-valued
    // transforms create a new identity during every render and trigger a loop.
    // Only stable scalar values may cross this reactive boundary.
    const flightPose = ([p, k]: number[]) =>
        paperFlight(still ? (open ? 1 : 0) : p, index, compact, still ? 0 : k)
    const x = useTransform([progress, peekProgress], (values: number[]) => flightPose(values).x)
    const y = useTransform([progress, peekProgress], (values: number[]) => flightPose(values).y)
    const z = useTransform([progress, peekProgress], (values: number[]) => flightPose(values).z)
    const rotate = useTransform([progress, peekProgress], (values: number[]) => flightPose(values).rotate)
    const rotateX = useTransform([progress, peekProgress], (values: number[]) => flightPose(values).rotateX)
    const rotateY = useTransform([progress, peekProgress], (values: number[]) => flightPose(values).rotateY)
    const cardScale = useTransform([progress, peekProgress], (values: number[]) => flightPose(values).scale)
    const flightLight = useTransform([progress, peekProgress], (values: number[]) => flightPose(values).light)
    const surface = React.useRef<HTMLDivElement>(null)
    const [pointerOver, setPointerOver] = React.useState(false)
    const hover = open && !still && pointerOver
    const pitch = useMotionValue(0)
    const yaw = useMotionValue(0)
    const light = useMotionValue(0)
    const smoothPitch = useSpring(pitch, { stiffness: 140, damping: 26 })
    const smoothYaw = useSpring(yaw, { stiffness: 140, damping: 26 })
    const smoothLight = useSpring(light, { stiffness: 110, damping: 25 })
    const settle: Transition = still ? { duration: 0 } : {
        type: "spring", stiffness: 150 * speed ** 2, damping: 26 * speed,
    }

    React.useEffect(() => {
        if (still) progress.jump(open ? 1 : 0)
        else progress.set(open ? 1 : 0)
    }, [open, still, progress])
    React.useEffect(() => {
        if (still) peekProgress.jump(0)
        else peekProgress.set(!open && peek ? 1 : 0)
    }, [open, peek, still, peekProgress])

    function resetSurface() {
        pitch.set(0); yaw.set(0); light.set(0)
    }
    React.useEffect(() => {
        if (!open || still || !tilt) resetSurface()
        if (!open) setPointerOver(false)
    }, [open, still, tilt])

    function onMove(event: React.PointerEvent<HTMLAnchorElement>) {
        if (!open || still || !tilt || event.pointerType !== "mouse" || !surface.current) return
        const rect = surface.current.getBoundingClientRect()
        const px = Math.max(-.5, Math.min(.5, (event.clientX - rect.left) / Math.max(1, rect.width) - .5))
        const py = Math.max(-.5, Math.min(.5, (event.clientY - rect.top) / Math.max(1, rect.height) - .5))
        pitch.set(-py * 9)
        yaw.set(px * 12)
        light.set(px * 58)
    }

    return <motion.a data-paper={index} data-card={index}
        href={resolvedHref}
        target={resolvedHref && newTab ? "_blank" : undefined}
        rel={resolvedHref && newTab ? "noopener noreferrer" : undefined}
        role={resolvedHref ? undefined : "img"} aria-label={label} aria-hidden={!open}
        tabIndex={open && resolvedHref ? 0 : -1} draggable={false}
        onPointerEnter={event => { if (event.pointerType === "mouse" && open) setPointerOver(true) }}
        onPointerLeave={() => { setPointerOver(false); resetSurface() }}
        onPointerMove={onMove}
        style={{ position: "absolute", display: "block", left: centerX - 100, top: -10, width: 200, height: 252,
            x, y, z, rotate, rotateX, rotateY, scale: cardScale,
            transformOrigin: "50% 167px", transformStyle: "preserve-3d", borderRadius: 8,
            zIndex: hover ? 5 : index === 1 ? 4 : 3, pointerEvents: open ? "auto" : "none",
            cursor: resolvedHref ? "pointer" : "default", textDecoration: "none", color: "inherit",
            touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}>
        <motion.div ref={surface} data-paper-surface={index} aria-hidden="true"
            initial={false}
            animate={{ y: hover ? -9 : 0, rotate: hover ? -restingAngle * .17 : 0,
                boxShadow: hover
                    ? "0 4px 7px -3px rgba(42,39,30,.12), 0 22px 34px -15px rgba(42,39,30,.29)"
                    : "0 2px 3px rgba(42,39,30,.07), 0 12px 24px -8px rgba(42,39,30,.2)" }}
            transition={settle}
            style={{ position: "absolute", display: "block", left: 0, top: 10, width: "100%", height: 242, borderRadius: 8,
                rotateX: still ? 0 : smoothPitch, rotateY: still ? 0 : smoothYaw,
                transformOrigin: "50% 65%", transformStyle: "preserve-3d",
                pointerEvents: "none" }}>
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: 8,
                background: "#D8D3C5", border: "1px solid #C9C4B7", transform: "translateZ(-1.6px)", pointerEvents: "none" }} />
            <div
                style={{ position: "relative", display: "block", width: "100%", height: "100%",
                    padding: 7, background: "#FCFBF7", border: "1px solid #DEDCD4", borderRadius: 8,
                    overflow: "hidden", transform: "translateZ(.2px)", backfaceVisibility: "hidden",
                    pointerEvents: "none" }}>
                {/* Artwork and destination change atomically. */}
                <motion.div key={active} initial={{ opacity: still ? 1 : .4 }} animate={{ opacity: 1 }}
                    transition={{ duration: still ? 0 : .28 }}
                    style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: 3 }}>
                    {children}
                </motion.div>
                <motion.span aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none",
                    opacity: flightLight, background: "linear-gradient(120deg,rgba(255,255,255,.32),transparent 55%,rgba(39,35,28,.055))" }} />
                <motion.span aria-hidden="true" initial={false} animate={{ opacity: hover ? 1 : 0 }} transition={still ? { duration: 0 } : { duration: .45 }}
                    style={{ position: "absolute", inset: "-30% -45%", x: still ? 0 : smoothLight, pointerEvents: "none",
                        background: "linear-gradient(115deg,transparent 34%,rgba(255,255,255,.025) 42%,rgba(255,255,255,.17) 50%,rgba(255,255,255,.025) 58%,transparent 66%)" }} />
            </div>
        </motion.div>
    </motion.a>
}


/**
 * Real Folder — text-free, link-ready paper choreography.
 * @framerDisableUnlink
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 652
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function RealFolder({
    forms, spaces, fragments, background = "rgba(0,0,0,0)",
    startOpen = false, enableTilt = true, speed = 1, style,
}: RealFolderProps) {
    const collections = [forms, spaces, fragments].map((item, i) => ({ ...defaults[i], ...item }))
    const [active, setActive] = React.useState(0)
    const [opened, setOpened] = React.useState(startOpen)
    const [peek, setPeek] = React.useState(false)
    const [size, setSize] = React.useState({ width: 800, height: 652 })
    const root = React.useRef<HTMLDivElement>(null)
    const trigger = React.useRef<HTMLButtonElement>(null)
    const isStatic = useIsStaticRenderer()
    const reduced = !!useReducedMotion()
    const still = isStatic || reduced
    const uid = React.useId()
    const panelId = `real-folder-cards-${uid}`
    const compact = size.width < 600
    const sceneW = compact ? 460 : 760
    const sceneH = compact ? 640 : 620
    const scale = Math.max(.01, Math.min(size.width / sceneW, size.height / sceneH, 1.15))
    const centerX = sceneW / 2
    const fan = opened || isStatic
    const collection = collections[active]
    const actualSpeed = Math.max(.5, Math.min(1.8, speed))
    const tiltX = useMotionValue(0)
    const tiltY = useMotionValue(0)
    const rx = useSpring(tiltX, { stiffness: 110, damping: 23 })
    const ry = useSpring(tiltY, { stiffness: 110, damping: 23 })
    const spring: Transition = still ? { duration: 0 } : {
        type: "spring", stiffness: 110 * actualSpeed ** 2, damping: 23 * actualSpeed,
    }
    const folderY = fan ? (compact ? 441 : 431) : 354
    const folderScale = compact ? .9 : 1

    React.useEffect(() => {
        const node = root.current
        if (!node || typeof window === "undefined") return
        const update = () => {
            const next = { width: node.clientWidth, height: node.clientHeight }
            setSize(previous => previous.width === next.width && previous.height === next.height ? previous : next)
        }
        update()
        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", update)
            return () => window.removeEventListener("resize", update)
        }
        const observer = new ResizeObserver(update)
        observer.observe(node)
        return () => observer.disconnect()
    }, [])
    React.useEffect(() => { setOpened(startOpen) }, [startOpen])
    React.useEffect(() => {
        if (!enableTilt || still) { tiltX.set(0); tiltY.set(0) }
    }, [enableTilt, still, tiltX, tiltY])

    function resetTilt() { tiltX.set(0); tiltY.set(0) }
    function onMove(event: React.PointerEvent<HTMLDivElement>) {
        // Local card lighting/tilt takes over after opening.
        if (still || !enableTilt || fan || event.pointerType !== "mouse" || !root.current) return
        const r = root.current.getBoundingClientRect()
        tiltX.set(Math.max(-2, Math.min(2, -(event.clientY - r.top - r.height / 2) / Math.max(1, r.height) * 4)))
        tiltY.set(Math.max(-3, Math.min(3, (event.clientX - r.left - r.width / 2) / Math.max(1, r.width) * 6)))
    }
    function toggleFolder(keyboard = false) {
        resetTilt()
        setPeek(false)
        setOpened(!fan)
        if (!fan && keyboard && typeof window !== "undefined") {
            window.requestAnimationFrame(() => root.current?.querySelector<HTMLAnchorElement>("[data-card][href]")?.focus({ preventScroll: true }))
        }
    }
    function changeCollection(index: number) {
        setActive(index)
        resetTilt()
    }
    function onKey(event: React.KeyboardEvent<HTMLDivElement>) {
        if (event.key !== "Escape" || !fan) return
        event.preventDefault()
        event.stopPropagation()
        setOpened(false)
        setPeek(false)
        trigger.current?.focus({ preventScroll: true })
    }
    function print(index: number) {
        const image = [collection.image1, collection.image2, collection.image3][index]
        return image?.src
            ? <img src={image.src} srcSet={image.srcSet} sizes={`${Math.ceil(210 * scale)}px`} alt="" draggable={false}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : <Artwork collection={active} index={index} />
    }

    return <div ref={root} className="real-folder" role="group" aria-label="Real Folder"
        onKeyDown={onKey} onPointerMove={onMove} onPointerLeave={() => { resetTilt(); setPeek(false) }}
        style={{ width: "100%", aspectRatio: compact ? "460 / 640" : "760 / 620", background, ...style, position: "relative", overflow: "hidden", isolation: "isolate" }}>
        <style>{css}</style>
        <div style={{ width: sceneW, height: sceneH, position: "absolute", left: "50%", top: "50%", marginLeft: -sceneW / 2, marginTop: -sceneH / 2, transform: `scale(${scale})`, transformOrigin: "center", perspective: 1400 }}>
            <motion.div style={{ width: "100%", height: "100%", position: "relative", rotateX: still ? 0 : rx, rotateY: still ? 0 : ry }}>
                <motion.div aria-hidden="true" initial={false}
                    animate={{ y: fan ? 76 : 0, scaleX: fan ? 1.1 : 1, opacity: fan ? .12 : .15 }}
                    transition={spring}
                    style={{ position: "absolute", left: centerX - 174, top: 465, width: 348, height: 20, borderRadius: "50%", background: "#24291F", filter: "blur(15px)", pointerEvents: "none" }} />

                <motion.div initial={false}
                    animate={{ y: folderY - 100, scale: folderScale, rotate: fan ? -2 : -4 }}
                    transition={spring}
                    style={{ position: "absolute", left: centerX - 174, top: 0, width: 348, height: 206, zIndex: 1 }}>
                    <motion.div data-folder-back="body" aria-hidden="true" initial={false}
                        animate={{ backgroundColor: collection.color }} transition={spring}
                        style={{ position: "absolute", inset: "0 7px 0", borderRadius: 13, backgroundColor: collection.color,
                            filter: "brightness(.82)", boxShadow: "inset 0 1px 1px rgba(255,255,255,.25)" }} />
                    <motion.div data-folder-back="tab" aria-hidden="true" initial={false}
                        animate={{ backgroundColor: collection.color }} transition={spring}
                        style={{ position: "absolute", left: 7, top: -25, width: 110, height: 42, borderRadius: "11px 16px 0 0", backgroundColor: collection.color,
                            filter: "brightness(.82)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.2)" }} />
                </motion.div>

                <div id={panelId} role="group" aria-label={`${collection.name} prints`}
                    style={{ position: "absolute", inset: 0, zIndex: 3, perspective: 1100, perspectiveOrigin: "50% 47%", transformStyle: "flat", pointerEvents: "none" }}>
                    {[0, 1, 2].map(index => {
                        const image = [collection.image1, collection.image2, collection.image3][index]
                        const href = [collection.link1, collection.link2, collection.link3][index]
                        const newTab = [collection.link1NewTab, collection.link2NewTab, collection.link3NewTab][index] ?? false
                        return <PaperCard key={index} index={index} active={active}
                            open={fan} peek={peek} compact={compact} still={still} tilt={enableTilt} speed={actualSpeed}
                            href={href} newTab={newTab} label={image?.alt || titles[active][index]}>
                            {print(index)}
                        </PaperCard>
                    })}
                </div>

                <motion.div initial={false}
                    animate={{ y: folderY - 100, scale: folderScale, rotate: fan ? -2 : -4 }}
                    transition={spring}
                    style={{ position: "absolute", left: centerX - 174, top: 0, width: 348, height: 206, perspective: 1000, zIndex: 6, pointerEvents: "none" }}>
                    <motion.div
                        onPointerEnter={event => { if (event.pointerType === "mouse") setPeek(true) }}
                        onPointerLeave={() => setPeek(false)}
                        initial={false}
                        animate={{ rotateX: fan ? -29 : peek && !still ? -12 : 0, backgroundColor: collection.color }}
                        transition={spring}
                        style={{ position: "absolute", left: 0, top: 30, width: 348, height: 176,
                            transformOrigin: "50% 100%", border: "1px solid rgba(255,255,255,.2)", borderRadius: "11px 11px 15px 15px",
                            padding: 0, pointerEvents: "auto",
                            backgroundImage: "linear-gradient(165deg,rgba(255,255,255,.055),rgba(0,0,0,.09))",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,.2), inset 0 -2px 2px rgba(0,0,0,.045), 0 8px 12px -8px rgba(30,30,24,.22)" }}>
                        <button ref={trigger} type="button"
                            aria-label={`${fan ? "Close" : "Open"} ${collection.name} folder`}
                            aria-expanded={fan} aria-controls={panelId}
                            onClick={event => toggleFolder(event.detail === 0)}
                            onFocus={event => { if (event.currentTarget.matches(":focus-visible")) setPeek(true) }}
                            onBlur={() => setPeek(false)}
                            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", padding: 0, border: 0, borderRadius: "inherit", background: "transparent", cursor: "pointer" }}>
                            <span aria-hidden="true" style={{ position: "absolute", top: 15, left: "50%", marginLeft: -14, width: 28, height: 3, borderRadius: 4, background: "rgba(75,29,16,.14)", boxShadow: "0 1px 0 rgba(255,255,255,.18)" }} />
                        </button>
                        <div role="group" aria-label="Choose a collection" style={{ position: "absolute", left: 13, bottom: 8, display: "flex", pointerEvents: "auto" }}>
                            {collections.map((item, index) => <button key={index} type="button" className="real-folder-tab"
                                aria-label={`Choose ${item.name} collection`} aria-pressed={active === index}
                                onClick={() => changeCollection(index)}
                                style={{ width: 48, height: 48, border: 0, borderRadius: 8, background: "transparent", cursor: "pointer", padding: 16, display: "grid", placeItems: "center" }}>
                                <motion.span aria-hidden="true" initial={false}
                                    animate={{ scale: active === index ? 1 : .72, opacity: active === index ? 1 : .65, backgroundColor: item.color }}
                                    transition={spring}
                                    style={{ display: "block", width: 12, height: 12, borderRadius: "50%", border: "1px solid rgba(255,255,255,.4)", boxShadow: active === index ? "0 0 0 3px rgba(255,255,255,.15)" : "0 1px 1px rgba(0,0,0,.1)" }} />
                            </button>)}
                        </div>
                    </motion.div>
                </motion.div>
            </motion.div>
        </div>
    </div>
}

RealFolder.displayName = "Real Folder"

const collectionControls = (index: number) => ({
    type: ControlType.Object,
    title: defaults[index].name,
    controls: {
        name: { type: ControlType.String, title: "Accessible name", defaultValue: defaults[index].name, description: "Screen-reader label only. No text is displayed." },
        color: { type: ControlType.Color, title: "Folder", defaultValue: defaults[index].color },
        image1: { type: ControlType.ResponsiveImage, title: "Print 1" },
        link1: { type: ControlType.Link, title: "Link 1", defaultValue: "" },
        link1NewTab: { type: ControlType.Boolean, title: "New tab", defaultValue: false },
        image2: { type: ControlType.ResponsiveImage, title: "Print 2" },
        link2: { type: ControlType.Link, title: "Link 2", defaultValue: "" },
        link2NewTab: { type: ControlType.Boolean, title: "New tab", defaultValue: false },
        image3: { type: ControlType.ResponsiveImage, title: "Print 3" },
        link3: { type: ControlType.Link, title: "Link 3", defaultValue: "" },
        link3NewTab: { type: ControlType.Boolean, title: "New tab", defaultValue: false },
    },
})
addPropertyControls(RealFolder, {
    forms: collectionControls(0),
    spaces: collectionControls(1),
    fragments: collectionControls(2),
    background: { type: ControlType.Color, title: "Background", defaultValue: "rgba(0,0,0,0)" },
    startOpen: { type: ControlType.Boolean, title: "Start open", defaultValue: false },
    enableTilt: { type: ControlType.Boolean, title: "Pointer tilt", defaultValue: true },
    speed: { type: ControlType.Number, title: "Motion speed", defaultValue: 1, min: .5, max: 1.8, step: .1,
        description: "Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)" },
} as any)
