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


interface GalleryImage { src: string; srcSet?: string; alt?: string }
interface GalleryItem { image?: GalleryImage | string; title?: string; alt?: string; link?: string; newTab?: boolean; accent?: string }
interface NavigationStyle {
    arrowStyle?: string
    iconSize?: number
    stroke?: number
    customPrevious?: GalleryImage | string
    customNext?: GalleryImage | string
    width?: number
    height?: number
    radius?: string | number
    gap?: string
    fill?: string
    color?: string
    border?: React.CSSProperties
    shadow?: string
    hoverFill?: string
    hoverColor?: string
    hoverBorder?: string
    hoverShift?: number
    showCounter?: boolean
    counterFont?: React.CSSProperties
    alignment?: string
    bottom?: number
}
const navigationDefaults: NavigationStyle = { arrowStyle: "Arrow", iconSize: 18, stroke: 1.5, width: 52, height: 46, radius: "8px", gap: "0px 18px", showCounter: true, hoverShift: 1, alignment: "Center", bottom: 54 }
interface Props {
    items?: GalleryItem[]
    cardWidth?: number
    aspectRatio?: number
    spread?: number
    depth?: number
    rearBlur?: number
    rearDim?: number
    navigation?: NavigationStyle
    twist?: number
    tilt?: number
    pitch?: number
    focusZoom?: number
    radius?: string | number
    padding?: string | number
    background?: string
    ink?: string
    focusColor?: string
    response?: number
    sensitivity?: number
    sound?: boolean
    showSoundControl?: boolean
    trail?: number
    volume?: number
    soundStyle?: string
    ambient?: boolean
    glow?: number
    showControls?: boolean
    style?: React.CSSProperties
}

const demoItems: GalleryItem[] = [{"image": {"src": "https://framerusercontent.com/images/EGUTQKQ5gq00rjuX6E1zPZZ5Q.png", "alt": "Sunlit terracotta circular pavilion overlooking a deep blue sea"}, "title": "Aperture Pavilion", "alt": "Sunlit terracotta circular pavilion overlooking a deep blue sea", "accent": "#CA7748", "link": "", "newTab": false}, {"image": {"src": "https://framerusercontent.com/images/Yq3KgsCz0ZS9vKS2bVBEa0iRI.png", "alt": "Sculptural travertine stairs descending into a turquoise reflecting pool"}, "title": "Travertine Descent", "alt": "Sculptural travertine stairs descending into a turquoise reflecting pool", "accent": "#7FADA5", "link": "", "newTab": false}, {"image": {"src": "https://framerusercontent.com/images/rHMJTsh7AKb6M5ikzLcdjMA8.png", "alt": "Polished chrome loop on a misty black volcanic shore"}, "title": "Chrome Tide", "alt": "Polished chrome loop on a misty black volcanic shore", "accent": "#718DAD", "link": "", "newTab": false}, {"image": {"src": "https://framerusercontent.com/images/pguZnuCajnkfROLRTHkLzr1XEY.png", "alt": "Coral red monolith framing blue water at dusk"}, "title": "Coral Frame", "alt": "Coral red monolith framing blue water at dusk", "accent": "#D37965", "link": "", "newTab": false}, {"image": {"src": "https://framerusercontent.com/images/tyeLiu7zM4ayZ3B7R0zPODsIzbY.png", "alt": "Circular concrete oculus above a still flooded interior"}, "title": "Flooded Oculus", "alt": "Circular concrete oculus above a still flooded interior", "accent": "#BCA483", "link": "", "newTab": false}, {"image": {"src": "https://framerusercontent.com/images/Se983mY4Fd5Ft8oyPhLmgWTc1eM.png", "alt": "Folded copper canopy suspended over dark water"}, "title": "Copper Canopy", "alt": "Folded copper canopy suspended over dark water", "accent": "#B7794F", "link": "", "newTab": false}, {"image": {"src": "https://framerusercontent.com/images/nP32oQqkRiDcznyU1eXjKLG8.png", "alt": "Sculptural ivory arches above a desert reflecting pool in late sunlight"}, "title": "Ivory Arches", "alt": "Sculptural ivory arches above a desert reflecting pool in late sunlight", "accent": "#CDB896", "link": "", "newTab": false}, {"image": {"src": "https://framerusercontent.com/images/7UMWLLucf2GeLOCCkthaABBb3HM.png", "alt": "Emerald glass corridor suspended above still water"}, "title": "Emerald Passage", "alt": "Emerald glass corridor suspended above still water", "accent": "#518C71", "link": "", "newTab": false}, {"image": {"src": "https://framerusercontent.com/images/3yxxOa3EApxtuzUpdvQXfSSo94.png", "alt": "Terracotta switchback staircase carved into a coastal cliff at dusk"}, "title": "Terracotta Switchback", "alt": "Terracotta switchback staircase carved into a coastal cliff at dusk", "accent": "#C67D58", "link": "", "newTab": false}, {"image": {"src": "https://framerusercontent.com/images/UOy8s2M8awB1JOi4mfDu19M2MyQ.png", "alt": "Black basalt cube with a narrow golden light slit over still water"}, "title": "Basalt Slit", "alt": "Black basalt cube with a narrow golden light slit over still water", "accent": "#9D8056", "link": "", "newTab": false}]
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
const mod = (n: number, length: number) => ((n % length) + length) % length
const Arrow = ({ direction = 1, kind = "Arrow", size = 18, stroke = 1.5, custom }: { direction?: number; kind?: string; size?: number; stroke?: number; custom?: GalleryImage | string }) => {
    const customImage = typeof custom === "string" ? { src: custom } : custom
    if (kind === "Custom" && customImage?.src) return <img src={customImage.src} srcSet={customImage.srcSet} width={size} height={size} alt="" aria-hidden="true" draggable={false} style={{ display: "block", objectFit: "contain" }} />
    const path = kind === "Chevron" ? "m9 5 7 7-7 7" : kind === "Long Arrow" ? "M2 12h20m-6-6 6 6-6 6" : "M5 12h14m-5-5 5 5-5 5"
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ transform: direction < 0 ? "rotate(180deg)" : undefined }}><path d={path} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" /></svg>
}
const Speaker = ({ on }: { on: boolean }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m11 5-5 4H3v6h3l5 4V5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />{on ? <><path d="M15 8.5a5 5 0 0 1 0 7m3-10a9 9 0 0 1 0 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></> : <path d="m16 9 6 6m0-6-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />}</svg>

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 * @framerDisableUnlink
 */
export default function Coil3DCarousel(props: Props) {
    const {
        items = demoItems, cardWidth = 560, aspectRatio = 1.5, spread = 1,
        depth = 1050, rearBlur = 3.5, rearDim = 0.55, navigation, twist = 36, tilt = -32, pitch = 66, focusZoom = 1.24,
        radius = "4px", padding = "24px", background = "#101114", ink = "#EEEAE2",
        focusColor = "#C6AC8E", response = 0.9, sensitivity = 1,
        sound = true, showSoundControl = true, trail = 18, volume = 0.5, soundStyle = "Layered", ambient = true, glow = 0.55, showControls = true, style,
    } = props
    const nav = { ...navigationDefaults, ...(navigation || {}) }
    const navColor = nav.color || ink
    const navFill = nav.fill ?? `color-mix(in srgb,${ink} 3%,${background})`
    const navHoverFill = nav.hoverFill ?? `color-mix(in srgb,${ink} 7%,${background})`
    const navHoverColor = nav.hoverColor || navColor
    const navHoverBorder = nav.hoverBorder || `color-mix(in srgb,${ink} 28%,transparent)`
    const staticRenderer = useIsStaticRenderer()
    const sourceItems = Array.isArray(items) ? items : []
    const count = sourceItems.length
    const rootRef = React.useRef<HTMLDivElement>(null)
    const sceneRef = React.useRef<HTMLDivElement>(null)
    const toolbarRef = React.useRef<HTMLDivElement>(null)
    const [toolbarMeasured, setToolbarMeasured] = React.useState(0)
    const [size, setSize] = React.useState({ width: 1200, height: 800, top: 24, right: 24, bottom: 24, left: 24 })
    const [position, setPosition] = React.useState(0)
    const [reducedMotion, setReducedMotion] = React.useState(false)
    const [audioOn, setAudioOn] = React.useState(false)
    const [isDragging, setIsDragging] = React.useState(false)
    const [announcement, setAnnouncement] = React.useState("")
    const uid = `hf-${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`
    const mounted = React.useRef(true)
    const motion = React.useRef({ x: 0, target: 0, velocity: 0, lastTime: 0, dragging: false, selected: 0, interacted: false })
    const cardsRef = React.useRef(new Map<number, HTMLDivElement>())
    const paintRef = React.useRef<(position: number) => void>(() => {})
    const renderedStep = React.useRef({ floor: 0, nearest: 0 })
    const frame = React.useRef<number | null>(null)
    const wheelTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const suppressClickTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const suppressClick = React.useRef(false)
    const audio = React.useRef<HelixCuelume | null>(null)
    const wheelBurst = React.useRef({ start: 0, travel: 0 })
    const lastReducedWheel = React.useRef(-Infinity)
    const audioActive = React.useRef(false)
    const audioMuted = React.useRef(false)
    const audioEpoch = React.useRef(0)
    const audioUnlocking = React.useRef(false)
    const drag = React.useRef<null | { id: number; x: number; y: number; position: number; previous: number; time: number; moved: boolean; axis: "x" | "y" | null; capture: Element | null }>(null)
    const settings = React.useRef({ count, reducedMotion, staticRenderer, response, sound, showSoundControl, volume, soundStyle, sourceItems })
    settings.current = { count, reducedMotion, staticRenderer, response, sound, showSoundControl, volume, soundStyle, sourceItems }

    const ensureAudio = React.useCallback(async () => {
        const s = settings.current
        if (!mounted.current || !s.sound || s.staticRenderer || audioMuted.current) return false
        if (audioActive.current) return true
        if (audioUnlocking.current) return false
        audioUnlocking.current = true
        const epoch = audioEpoch.current
        const cues = audio.current || (audio.current = createHelixCuelume())
        const ready = await cues.unlock()
        audioUnlocking.current = false
        if (!mounted.current || epoch !== audioEpoch.current || !settings.current.sound || audioMuted.current) return false
        audioActive.current = ready
        setAudioOn(ready)
        if (ready) cues.playSelect(1, 0.6, settings.current.volume)
        return ready
    }, [])

    const makeTick = React.useCallback((speed: number = 1) => {
        const s = settings.current
        if (!audioActive.current || !s.sound) return
        if (s.soundStyle === "Navigate") audio.current?.playNavigate(Math.sign(speed), s.volume)
        else audio.current?.playSelect(Math.sign(speed), clamp(Math.abs(speed) / 7, 0, 1), s.volume)
    }, [])

    const updatePosition = React.useCallback((next: number) => {
        if (!mounted.current) return
        paintRef.current(next)
        // Only reconcile the slot window and semantic state at a card boundary.
        // Continuous transforms stay on existing DOM layers, outside React renders.
        const floor = Math.floor(next), nearest = Math.round(next)
        if (floor !== renderedStep.current.floor || nearest !== renderedStep.current.nearest) {
            renderedStep.current = { floor, nearest }
            setPosition(next)
        }
        const m = motion.current
        const selected = Math.round(next)
        if (selected !== m.selected) {
            m.selected = selected
            if (m.interacted) makeTick(m.velocity)
        }
    }, [makeTick])

    const animate = React.useCallback((time: number) => {
        const m = motion.current
        const s = settings.current
        const dt = m.lastTime ? Math.min((time - m.lastTime) / 1000, 0.064) : 1 / 60
        m.lastTime = time
        if (s.staticRenderer || s.reducedMotion) {
            m.target = Math.round(m.target)
            m.x = m.target
            m.velocity = 0
        } else if (!m.dragging) {
            // Exact critically-damped spring: the same trajectory at 60/120 Hz,
            // preserving momentum when a wheel burst retargets the motion.
            const omega = 12 * Math.sqrt(clamp(s.response, 0.3, 2))
            const offset = m.x - m.target
            const c = m.velocity + omega * offset
            const decay = Math.exp(-omega * dt)
            m.x = m.target + (offset + c * dt) * decay
            m.velocity = (m.velocity - omega * c * dt) * decay
            if (Math.abs(m.target - m.x) < 0.0003 && Math.abs(m.velocity) < 0.003) {
                m.x = m.target
                m.velocity = 0
            }
        }
        updatePosition(m.x)
        if (m.dragging || Math.abs(m.target - m.x) > 0.0003 || Math.abs(m.velocity) > 0.003) {
            frame.current = requestAnimationFrame(animate)
        } else {
            frame.current = null
            m.lastTime = 0
            if (m.interacted && s.count) {
                const index = mod(Math.round(m.x), s.count)
                const label = s.sourceItems[index]?.title || `Image ${index + 1}`
                setAnnouncement(`${label}, ${index + 1} of ${s.count}`)
            }
        }
    }, [updatePosition])

    const startAnimation = React.useCallback(() => {
        if (frame.current === null) {
            motion.current.lastTime = performance.now()
            frame.current = requestAnimationFrame(animate)
        }
    }, [animate])

    const goTo = React.useCallback((target: number) => {
        const s = settings.current
        if (s.count < 2 || s.staticRenderer) return
        if (wheelTimer.current) { clearTimeout(wheelTimer.current); wheelTimer.current = null }
        if (audioActive.current && s.sound && s.soundStyle === "Layered") audio.current?.playNavigate(target - motion.current.x, s.volume * 0.72)
        motion.current.interacted = true
        motion.current.target = Math.round(target)
        if (s.reducedMotion) {
            motion.current.x = motion.current.target
            motion.current.velocity = 0
            updatePosition(motion.current.x)
            const index = mod(Math.round(motion.current.x), s.count)
            setAnnouncement(`${s.sourceItems[index]?.title || `Image ${index + 1}`}, ${index + 1} of ${s.count}`)
        } else startAnimation()
    }, [startAnimation, updatePosition])

    React.useEffect(() => {
        mounted.current = true
        const root = rootRef.current
        if (root) {
            const measure = () => {
                const r = root.getBoundingClientRect()
                const width = root.clientWidth || r.width
                const height = root.clientHeight || r.height
                const computed = sceneRef.current ? getComputedStyle(sceneRef.current) : null
                const top = parseFloat(computed?.paddingTop || "0") || 0
                const right = parseFloat(computed?.paddingRight || "0") || 0
                const bottom = parseFloat(computed?.paddingBottom || "0") || 0
                const left = parseFloat(computed?.paddingLeft || "0") || 0
                if (width > 0 && height > 0) setSize(previous => previous.width === width && previous.height === height && previous.top === top && previous.right === right && previous.bottom === bottom && previous.left === left ? previous : { width, height, top, right, bottom, left })
            }
            measure()
            const observer = new ResizeObserver(measure)
            observer.observe(root)
            return () => { observer.disconnect() }
        }
    }, [padding])

    React.useEffect(() => {
        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReducedMotion(query.matches)
        update()
        query.addEventListener("change", update)
        return () => query.removeEventListener("change", update)
    }, [])

    React.useEffect(() => {
        const m = motion.current
        const next = count ? mod(Math.round(m.x), count) : 0
        m.x = next; m.target = next; m.velocity = 0; m.selected = next; m.dragging = false
        drag.current = null
        setIsDragging(false)
        renderedStep.current = { floor: Math.floor(next), nearest: Math.round(next) }
        setPosition(next)
        paintRef.current(next)
    }, [count])

    React.useEffect(() => {
        if (!sound) {
            audioEpoch.current += 1
            audioActive.current = false
            audioMuted.current = false
            setAudioOn(false)
            audio.current?.mute()
        }
    }, [sound])

    React.useEffect(() => {
        const scene = sceneRef.current
        if (!scene || staticRenderer) return
        const wheel = (event: WheelEvent) => {
            if (settings.current.count < 2 || event.ctrlKey || motion.current.dragging) return
            const raw = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
            if (!raw) return
            if (event.isTrusted) void ensureAudio()
            event.preventDefault()
            const pixels = raw * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? size.height : 1)
            motion.current.interacted = true
            if (wheelTimer.current) { clearTimeout(wheelTimer.current); wheelTimer.current = null }
            else wheelBurst.current = { start: Math.round(motion.current.target), travel: 0 }
            wheelBurst.current.travel += pixels
            if (settings.current.reducedMotion) {
                // One discrete move per wheel burst avoids a high-speed reduced-motion slideshow.
                const now = performance.now()
                if (now - lastReducedWheel.current > 180) { lastReducedWheel.current = now; goTo(motion.current.target + Math.sign(pixels)) }
                return
            }
            motion.current.target += clamp(pixels, -180, 180) * 0.006 * sensitivity
            startAnimation()
            wheelTimer.current = setTimeout(() => {
                const burst = wheelBurst.current
                let next = Math.round(motion.current.target)
                if (next === burst.start && Math.abs(burst.travel) > 18) next += Math.sign(burst.travel)
                motion.current.target = next
                wheelTimer.current = null
                startAnimation()
            }, 115)
        }
        scene.addEventListener("wheel", wheel, { passive: false })
        return () => { scene.removeEventListener("wheel", wheel); if (wheelTimer.current) { clearTimeout(wheelTimer.current); wheelTimer.current = null } }
    }, [staticRenderer, sensitivity, size.height, goTo, startAnimation, ensureAudio])

    React.useEffect(() => () => {
        mounted.current = false
        audioEpoch.current += 1
        if (frame.current !== null) cancelAnimationFrame(frame.current)
        if (wheelTimer.current) { clearTimeout(wheelTimer.current); wheelTimer.current = null }
        if (suppressClickTimer.current) clearTimeout(suppressClickTimer.current)
        const cues = audio.current
        audio.current = null
        if (cues) void cues.dispose()
    }, [])

    const toggleAudio = async () => {
        if (!sound || !showSoundControl || staticRenderer) return
        if (audioActive.current || audioUnlocking.current) {
            audioEpoch.current += 1
            audioMuted.current = true
            audioActive.current = false
            setAudioOn(false)
            audio.current?.mute()
            return
        }
        audioMuted.current = false
        void ensureAudio()
    }
    const activateAudio = (event: React.SyntheticEvent) => {
        if (!event.isTrusted || (event.target as HTMLElement).closest('[data-hf-sound]')) return
        void ensureAudio()
    }

    const pad = typeof padding === "number" ? `${padding}px` : padding
    const phone = size.width < 700
    const compact = clamp((1000 - size.width) / 600, 0, 1)
    const width = Math.max(1, size.width - size.left - size.right)
    const height = Math.max(1, size.height - size.top - size.bottom)
    const cardW = Math.min(cardWidth, width * (0.36 + compact * 0.29), height * 0.43 * aspectRatio)
    const cardH = cardW / Math.max(0.4, aspectRatio)
    const scale = Math.max(0.48, cardW / 420)
    const perspective = 1500 * Math.max(0.62, scale)
    const helixDepth = depth * scale
    const focusLift = Math.min(perspective * 0.18, 230 * scale)
    const helixRadius = width * (0.54 - compact * 0.02) * spread
    const angle = twist * Math.PI / 180
    const phase = tilt * Math.PI / 180
    const centerX = size.left + width / 2
    const centerY = size.top + height * 0.45
    const nearest = Math.round(position)
    const currentIndex = count ? mod(nearest, count) : 0
    const trailLength = Math.round(clamp(trail, 8, 24))
    const slots = count <= 1 ? [0] : Array.from({ length: trailLength + 4 }, (_, i) => Math.floor(position) + i - Math.ceil(trailLength / 2) - 1)
    const toolbarBottom = clamp(nav.bottom ?? 54, 0, Math.max(0, size.height - 120)) + (phone ? 32 : 0)
    const navWidth = clamp(nav.width ?? 52, 32, 120)
    const navHeight = clamp(nav.height ?? 46, 32, 96)
    const navGap = nav.gap || "0px 18px"
    const navGapX = parseFloat(navGap.trim().split(/\s+/).pop() || "18") || 0
    const counterWidth = Math.max(48, (parseFloat(String(nav.counterFont?.fontSize || 11)) || 11) * 4.4)
    const toolbarWidth = (showControls ? navWidth * 2 + (nav.showCounter ? counterWidth + navGapX * 2 : navGapX) : 0) + (sound && showSoundControl ? navWidth + (showControls ? 12 : 0) : 0)
    const toolbarScale = Math.min(1, Math.max(1, width - 8) / Math.max(1, toolbarMeasured || toolbarWidth))
    React.useLayoutEffect(() => {
        const element = toolbarRef.current
        if (!element) { setToolbarMeasured(0); return }
        const measure = () => {
            const next = element.scrollWidth
            setToolbarMeasured(previous => Math.abs(previous - next) < 0.5 ? previous : next)
        }
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(element)
        for (const child of Array.from(element.children)) observer.observe(child)
        return () => observer.disconnect()
    }, [showControls, sound, showSoundControl, navigation, size.width])
    const toolbarPosition: React.CSSProperties = nav.alignment === "Left" ? { left: size.left, transform: `scale(${toolbarScale})`, transformOrigin: "left bottom" } : nav.alignment === "Right" ? { right: size.right, transform: `scale(${toolbarScale})`, transformOrigin: "right bottom" } : { left: "50%", transform: `translateX(-50%) scale(${toolbarScale})`, transformOrigin: "center bottom" }
    const accent = sourceItems[currentIndex]?.accent || focusColor
    const poseAt = (relative: number, velocity: number) => {
        const distance = Math.abs(relative)
        const incoming = distance
        const focus = Math.exp(-relative * relative * 2.8)
        // View the helix across its axis: its two halves wrap above and below
        // the hero, with a full depth wave on every turn rather than a flat ring.
        const theta = relative * angle
        const bank = phase * 0.12
        const orbit = helixRadius * (1 + 0.28 * compact)
        const recession = helixDepth * (1 - Math.cos(theta)) + helixDepth * 0.11 * distance
        const localX = orbit * Math.sin(theta)
        // Open the rear part of each winding around the hero while keeping
        // the projected vertical extent compact at every depth.
        const rise = Math.min(height * 0.32, cardH * 1.1) * Math.tanh(relative * pitch / 198)
        const localY = rise * (1 + recession / perspective)
        const x = localX * Math.cos(bank) - localY * Math.sin(bank)
        const y = localX * Math.sin(bank) + localY * Math.cos(bank)
        const z = focusLift * focus - recession
        const opacity = clamp((trailLength / 2 + 0.75 - distance) / 1.8, 0, 1)
        const energy = reducedMotion || staticRenderer ? 0 : clamp(velocity, -8, 8)
        const scaleCard = 0.78 + (focusZoom - 0.78) * focus
        const rotateY = -Math.sin(theta) * 55 * (1 - focus) - energy * 0.5 * focus
        const rotateX = Math.sin(theta) * 16 * (1 - focus)
        const rotateZ = Math.sin(theta) * 6 * (1 - focus) + energy * 0.14 * focus
        return {
            focus, opacity,
            blur: clamp(rearBlur, 0, 12) * Math.pow(1 - Math.exp(-incoming * 0.22), 1.4) * (1 + Math.max(0, -z) / perspective),
            brightness: 1 - clamp(rearDim, 0, 0.85) * (1 - Math.exp(-incoming * 0.24)),
            transform: `translate3d(${x}px,${y}px,${z}px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg) scale(${scaleCard})`,
            parallax: Math.cos(theta) * 2.4 * (1 - focus) + energy * 0.09 * focus,
            corners: Math.pow(focus, 1.4),
        }
    }
    paintRef.current = next => {
        for (const [slot, element] of cardsRef.current) {
            const pose = poseAt(count > 1 ? slot - next : 0, motion.current.velocity)
            element.style.transform = pose.transform
            element.style.opacity = String(pose.opacity)
            element.style.pointerEvents = pose.opacity > 0.08 ? "auto" : "none"
            element.style.setProperty("--hf-focus", String(pose.focus))
            element.style.setProperty("--hf-blur", `${pose.blur}px`)
            element.style.setProperty("--hf-brightness", String(pose.brightness))
            element.style.setProperty("--hf-parallax", String(pose.parallax))
            element.style.setProperty("--hf-corners", String(pose.corners))
        }
    }
    React.useLayoutEffect(() => { paintRef.current(motion.current.x) })
    const uiButton: React.CSSProperties = { width: navWidth, height: navHeight, border: `1px solid color-mix(in srgb, ${ink} 14%, transparent)`, ...nav.border, borderRadius: nav.radius, padding: 0, boxSizing: "border-box", background: navFill, boxShadow: nav.shadow ?? "inset 0 1px 0 rgba(255,255,255,.025)", color: navColor, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, WebkitTapHighlightColor: "transparent" }


    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (staticRenderer || count < 2 || (event.pointerType === "mouse" && event.button !== 0)) return
        if (wheelTimer.current) { clearTimeout(wheelTimer.current); wheelTimer.current = null }
        const m = motion.current
        m.target = m.x; m.velocity = 0; m.dragging = true; m.interacted = true
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, position: m.x, previous: m.x, time: performance.now(), moved: false, axis: null, capture: null }
        startAnimation()
    }
    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const d = drag.current
        if (!d || d.id !== event.pointerId) return
        const dx = event.clientX - d.x, dy = event.clientY - d.y
        if (!d.moved && Math.hypot(dx, dy) > 5) {
            d.moved = true
            d.axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y"
            d.capture = sceneRef.current
            try { d.capture?.setPointerCapture(event.pointerId) } catch {}
            setIsDragging(true)
        }
        if (!d.moved) return
        const now = performance.now()
        const distance = d.axis === "x" ? dx : dy
        const next = d.position - distance / Math.max(110, cardW * 0.63) * sensitivity
        motion.current.velocity = clamp((next - d.previous) / Math.max(0.008, (now - d.time) / 1000), -12, 12)
        motion.current.x = reducedMotion ? Math.round(next) : next
        motion.current.target = motion.current.x
        d.previous = next; d.time = now
        updatePosition(motion.current.x)
    }
    const finishDrag = (event: { pointerId: number }, cancelled = false) => {
        const d = drag.current
        if (!d || d.id !== event.pointerId) return
        drag.current = null
        try { if (d.capture?.hasPointerCapture(d.id)) d.capture.releasePointerCapture(d.id) } catch {}
        motion.current.dragging = false
        setIsDragging(false)
        if (d.moved) {
            suppressClick.current = true
            if (suppressClickTimer.current) clearTimeout(suppressClickTimer.current)
            suppressClickTimer.current = setTimeout(() => { suppressClick.current = false }, 100)
            const velocity = performance.now() - d.time < 100 && !cancelled ? motion.current.velocity : 0
            motion.current.velocity = velocity
            goTo(motion.current.x + clamp(velocity * 0.12, -1.5, 1.5))
        } else { motion.current.target = Math.round(motion.current.x); startAnimation() }
    }
    const finishDragRef = React.useRef(finishDrag)
    finishDragRef.current = finishDrag
    React.useEffect(() => {
        const end = (event: PointerEvent) => finishDragRef.current(event)
        const cancel = (event: PointerEvent) => finishDragRef.current(event, true)
        window.addEventListener("pointerup", end)
        window.addEventListener("pointercancel", cancel)
        return () => { window.removeEventListener("pointerup", end); window.removeEventListener("pointercancel", cancel) }
    }, [])
    const keyboard = (event: React.KeyboardEvent) => {
        if (event.altKey || event.metaKey || event.ctrlKey || count < 2) return
        const navigates = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)
        if (navigates || event.key === "Enter" || event.key === " ") activateAudio(event)
        if (navigates && (event.target as HTMLElement).closest("[data-hf-slot]")) sceneRef.current?.focus({ preventScroll: true })
        if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); goTo(Math.round(motion.current.target) + 1) }
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); goTo(Math.round(motion.current.target) - 1) }
        else if (event.key === "Home") { event.preventDefault(); goTo(Math.round(motion.current.target) - mod(Math.round(motion.current.target), count)) }
        else if (event.key === "End") { event.preventDefault(); goTo(Math.round(motion.current.target) - mod(Math.round(motion.current.target), count) + count - 1) }
    }

    return <div ref={rootRef} className={uid} role="region" aria-roledescription="carousel" aria-label="Image gallery" onKeyDown={keyboard} onPointerDownCapture={event => { if (event.pointerType === "mouse" && event.button === 0) activateAudio(event) }} onPointerUpCapture={event => { if (event.pointerType !== "mouse") activateAudio(event) }} style={{ width: 1200, position: "relative", overflow: "clip", background, color: ink, isolation: "isolate", ...style }}>
        <style>{`.${uid} button,.${uid} a{-webkit-tap-highlight-color:transparent} .${uid} button:focus-visible,.${uid} a:focus-visible,.${uid} [data-hf-scene]:focus-visible{outline:2px solid ${focusColor};outline-offset:5px} .${uid} [data-hf-scene]:focus-visible{outline-offset:-5px} .${uid} button:focus:not(:focus-visible),.${uid} a:focus:not(:focus-visible),.${uid} [data-hf-scene]:focus:not(:focus-visible){outline:none} .${uid} [data-hf-ui]{transition:background-color .3s ease,border-color .3s ease,color .3s ease,opacity .3s ease} .${uid} [data-hf-ui]:hover:not(:disabled){background:${navHoverFill}!important;color:${navHoverColor}!important;border-color:${navHoverBorder}!important} .${uid} [data-hf-ui]:active:not(:disabled){opacity:.65} .${uid} [data-hf-arrow]{display:flex;transition:transform .4s cubic-bezier(.2,.7,.2,1)} .${uid} [data-hf-nav="previous"]:hover:not(:disabled) [data-hf-arrow]{transform:translateX(-${nav.hoverShift ?? 1}px)} .${uid} [data-hf-nav="next"]:hover:not(:disabled) [data-hf-arrow]{transform:translateX(${nav.hoverShift ?? 1}px)} @media(prefers-reduced-motion:reduce){.${uid} [data-hf-ui],.${uid} [data-hf-arrow]{transition:none}}`}</style>
        <div aria-hidden="true" style={{ width: "100%", maxHeight: "100%", aspectRatio: "3 / 2", pointerEvents: "none" }} />
        {ambient && <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
            <div style={{ position: "absolute", left: "12%", right: "12%", top: "18%", height: "65%", borderRadius: "50%", backgroundColor: accent, opacity: glow * 0.25, filter: "blur(90px)", transition: reducedMotion ? "none" : "background-color 1.2s ease" }} />
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 105%, rgba(202,181,151,.13), transparent 56%), radial-gradient(ellipse at 50% 42%, transparent 25%, rgba(0,0,0,.4) 100%)" }} />
            <div style={{ position: "absolute", width: "80%", height: "16%", left: "10%", top: "66%", borderRadius: "50%", background: "rgba(0,0,0,.4)", filter: "blur(35px)" }} />
            <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.035 }}><filter id={`${uid}-grain`} x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" /></filter><rect width="100%" height="100%" filter={`url(#${uid}-grain)`} opacity="0.8" /></svg>
        </div>}
        <div ref={sceneRef} data-hf-scene tabIndex={showControls ? -1 : 0} aria-label="Drag or use arrow keys to browse images" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={event => finishDrag(event)} onPointerCancel={event => finishDrag(event, true)} onLostPointerCapture={event => { if (drag.current) finishDrag(event, true) }} onClickCapture={event => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation() } }} style={{ position: "absolute", inset: 0, padding: pad, overflow: "hidden", cursor: isDragging ? "grabbing" : count > 1 ? "grab" : "default", touchAction: "none", userSelect: "none", perspective, perspectiveOrigin: `${centerX}px ${centerY}px` }}>
            {count === 0 ? <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, opacity: 0.5, font: "12px Inter, sans-serif" }}>Add images</div> : <div style={{ position: "absolute", left: centerX, top: centerY, width: 0, height: 0, transformStyle: "preserve-3d" }}>
                {slots.map(slot => {
                    const index = mod(slot, count)
                    const item = sourceItems[index] || {}
                    const relative = count > 1 ? slot - motion.current.x : 0
                    const distance = Math.abs(relative)
                    const pose = poseAt(relative, motion.current.velocity)
                    const active = slot === nearest
                    const image = typeof item.image === "string" ? { src: item.image } : item.image
                    const src = image?.src || (typeof demoItems[index % demoItems.length].image === "object" ? (demoItems[index % demoItems.length].image as GalleryImage).src : "")
                    const hasLink = active && !!item.link
                    const hitStyle: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, borderRadius: radius, margin: 0, padding: 0, background: "transparent", color: "inherit", cursor: isDragging ? "grabbing" : "pointer", transform: "translateZ(2px)" }
                    return <div key={slot} ref={element => { if (element) cardsRef.current.set(slot, element); else cardsRef.current.delete(slot) }} data-hf-slot={slot} aria-hidden={!active ? true : undefined} role={active ? "group" : undefined} aria-roledescription={active ? "slide" : undefined} aria-label={active ? `${item.title || `Image ${index + 1}`}, ${index + 1} of ${count}` : undefined} onDragStart={(event: React.DragEvent) => event.preventDefault()} style={{ position: "absolute", left: -cardW / 2, top: -cardH / 2, width: cardW, height: cardH, borderRadius: radius, display: "block", transformStyle: "preserve-3d", transform: pose.transform, opacity: pose.opacity, pointerEvents: pose.opacity > 0.08 ? "auto" : "none", cursor: isDragging ? "grabbing" : "grab", willChange: staticRenderer ? undefined : "transform,opacity", backfaceVisibility: "hidden", "--hf-focus": pose.focus, "--hf-blur": `${pose.blur}px`, "--hf-brightness": pose.brightness, "--hf-parallax": pose.parallax, "--hf-corners": pose.corners } as React.CSSProperties}>
                        <div style={{ position: "absolute", inset: 0, borderRadius: radius, overflow: "hidden", background: "#202124", filter: "blur(var(--hf-blur)) brightness(var(--hf-brightness))", boxShadow: "0 32px 70px -16px rgba(0,0,0,.7)", pointerEvents: "none" }}>
                            {src && <img src={src} srcSet={image?.srcSet} alt={active ? item.alt || image?.alt || item.title || `Image ${index + 1}` : ""} draggable={false} loading={distance < 2 ? "eager" : "lazy"} decoding="async" style={{ width: "100%", height: "100%", display: "block", objectFit: "cover", objectPosition: "center", transform: "scale(calc(1.08 - var(--hf-focus) * .06)) translateX(calc(var(--hf-parallax) * 1%))", pointerEvents: "none" }} />}
                            <div style={{ position: "absolute", inset: 0, background: "#000", opacity: "calc((1 - var(--hf-focus)) * .27)" }} />
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg,rgba(255,255,255,.045),transparent 42%,rgba(0,0,0,.035))", border: "1px solid rgba(255,255,255,.14)", borderRadius: "inherit", boxSizing: "border-box" }} />
                        </div>
                        {[0, 1, 2, 3].map(corner => <span key={corner} aria-hidden="true" style={{ position: "absolute", width: 19, height: 19, left: corner % 2 === 0 ? "calc(-14px - (1 - var(--hf-focus)) * 28px)" : undefined, right: corner % 2 === 1 ? "calc(-14px - (1 - var(--hf-focus)) * 28px)" : undefined, top: corner < 2 ? "calc(-14px - (1 - var(--hf-focus)) * 28px)" : undefined, bottom: corner > 1 ? "calc(-14px - (1 - var(--hf-focus)) * 28px)" : undefined, borderTop: corner < 2 ? `1px solid ${focusColor}` : undefined, borderBottom: corner > 1 ? `1px solid ${focusColor}` : undefined, borderLeft: corner % 2 === 0 ? `1px solid ${focusColor}` : undefined, borderRight: corner % 2 === 1 ? `1px solid ${focusColor}` : undefined, opacity: "var(--hf-corners)", pointerEvents: "none", transform: "translateZ(1px)" }} />)}
                        {hasLink ? <a href={item.link} target={item.newTab ? "_blank" : undefined} rel={item.newTab ? "noopener noreferrer" : undefined} aria-label={`Open ${item.title || `image ${index + 1}`}`} style={hitStyle} /> : !active ? <button type="button" tabIndex={-1} aria-label={`Focus ${item.title || `image ${index + 1}`}`} onClick={() => goTo(slot)} style={hitStyle} /> : null}
                    </div>
                })}
            </div>}
        </div>
        {(showControls || (sound && showSoundControl)) && count > 0 && <div ref={toolbarRef} style={{ position: "absolute", bottom: toolbarBottom, ...toolbarPosition, display: "flex", alignItems: "center", gap: 12, zIndex: 2 }}>
            {showControls && <div style={{ display: "flex", alignItems: "center", gap: navGap }}>
                <button data-hf-ui data-hf-nav="previous" type="button" aria-label="Previous image" disabled={count < 2} onClick={() => goTo(Math.round(motion.current.target) - 1)} style={{ ...uiButton, opacity: count < 2 ? 0.3 : 1, cursor: count < 2 ? "default" : "pointer" }}><span data-hf-arrow><Arrow direction={-1} kind={nav.arrowStyle} size={clamp(nav.iconSize ?? 18, 10, Math.min(navWidth, navHeight) - 8)} stroke={nav.stroke} custom={nav.customPrevious} /></span></button>
                {nav.showCounter && <span aria-hidden="true" style={{ minWidth: counterWidth, whiteSpace: "nowrap", flexShrink: 0, textAlign: "center", color: navColor, fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 400, fontVariantNumeric: "tabular-nums", letterSpacing: "0.025em", lineHeight: 1, ...nav.counterFont }}><span style={{ opacity: 0.8 }}>{String(currentIndex + 1).padStart(2, "0")}</span><span style={{ padding: "0 6px", opacity: 0.2 }}>/</span><span style={{ opacity: 0.35 }}>{String(count).padStart(2, "0")}</span></span>}
                <button data-hf-ui data-hf-nav="next" type="button" aria-label="Next image" disabled={count < 2} onClick={() => goTo(Math.round(motion.current.target) + 1)} style={{ ...uiButton, opacity: count < 2 ? 0.3 : 1, cursor: count < 2 ? "default" : "pointer" }}><span data-hf-arrow><Arrow kind={nav.arrowStyle} size={clamp(nav.iconSize ?? 18, 10, Math.min(navWidth, navHeight) - 8)} stroke={nav.stroke} custom={nav.customNext} /></span></button>
            </div>}
            {sound && showSoundControl && <button data-hf-ui data-hf-sound type="button" aria-label={audioOn ? "Mute sound" : "Enable sound"} aria-pressed={audioOn} title={audioOn ? "Mute sound" : "Enable sound"} onClick={toggleAudio} style={{ ...uiButton, opacity: audioOn ? 1 : 0.6 }}><Speaker on={audioOn} /></button>}
        </div>}
        <span role="status" aria-live="polite" aria-atomic="true" style={{ position: "absolute", top: 0, left: 0, width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}>{announcement}</span>
    </div>
}

Coil3DCarousel.displayName = "Coil 3D Carousel"

addPropertyControls(Coil3DCarousel, {
    items: { type: ControlType.Array, title: "Images", maxCount: 40, defaultValue: demoItems, control: { type: ControlType.Object, controls: {
        image: { type: ControlType.ResponsiveImage, title: "Image" },
        title: { type: ControlType.String, title: "Name", defaultValue: "Image" },
        accent: { type: ControlType.Color, title: "Ambient Tint", defaultValue: "#C6AC8E" },
        alt: { type: ControlType.String, title: "Alt Text", defaultValue: "" },
        link: { type: ControlType.Link, title: "Link", defaultValue: "" },
        newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false },
    } } },
    cardWidth: { type: ControlType.Number, title: "Image Width", defaultValue: 560, min: 180, max: 800, step: 10, unit: "px" },
    aspectRatio: { type: ControlType.Number, title: "Image Ratio", defaultValue: 1.5, min: 0.6, max: 2.4, step: 0.05 },
    radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: "4px" },
    spread: { type: ControlType.Number, title: "Spread", defaultValue: 1, min: 0.5, max: 1.8, step: 0.05 },
    depth: { type: ControlType.Number, title: "Depth", defaultValue: 1050, min: 100, max: 1200, step: 10, unit: "px" },
    rearBlur: { type: ControlType.Number, title: "Rear Blur", defaultValue: 3.5, min: 0, max: 12, step: 0.5, unit: "px", description: "Gradual depth of field. The foreground image stays sharp." },
    rearDim: { type: ControlType.Number, title: "Rear Dim", defaultValue: 0.55, min: 0, max: 0.85, step: 0.05 },
    twist: { type: ControlType.Number, title: "Step Angle", defaultValue: 36, min: 20, max: 90, step: 1, unit: "°" },
    tilt: { type: ControlType.Number, title: "Orbit Angle", defaultValue: -32, min: -60, max: 60, step: 1, unit: "°" },
    pitch: { type: ControlType.Number, title: "Spiral Rise", defaultValue: 66, min: 15, max: 100, step: 1, unit: "px" },
    trail: { type: ControlType.Number, title: "Trail Length", defaultValue: 18, min: 8, max: 24, step: 1, displayStepper: true },
    focusZoom: { type: ControlType.Number, title: "Focus Scale", defaultValue: 1.24, min: 1, max: 1.5, step: 0.02 },
    padding: { type: ControlType.Padding, title: "Padding", defaultValue: "24px" },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#101114" },
    ambient: { type: ControlType.Boolean, title: "Ambient Light", defaultValue: true },
    glow: { type: ControlType.Number, title: "Glow", min: 0, max: 1, step: 0.05, defaultValue: 0.55, hidden: props => !props.ambient },
    ink: { type: ControlType.Color, title: "Controls Color", defaultValue: "#EEEAE2" },
    focusColor: { type: ControlType.Color, title: "Focus Color", defaultValue: "#C6AC8E" },
    response: { type: ControlType.Number, title: "Response", defaultValue: 0.9, min: 0.3, max: 2, step: 0.1 },
    sensitivity: { type: ControlType.Number, title: "Scroll Speed", defaultValue: 1, min: 0.3, max: 2.5, step: 0.1 },
    sound: { type: ControlType.Boolean, title: "Sound", defaultValue: true, description: "Cuelume sound starts after the first click, tap or navigation key. Turn off to mute all cues." },
    showSoundControl: { type: ControlType.Boolean, title: "Sound Button", defaultValue: true, hidden: props => !props.sound, description: "Show an optional mute button. Hiding it keeps sound enabled; use Sound to mute all cues." },
    soundStyle: { type: ControlType.Enum, title: "Sound Style", options: ["Layered", "Select", "Navigate"], defaultValue: "Layered", description: "Original Cuelume cues. Layered combines soft navigation with tactile scroll detents.", hidden: props => !props.sound },
    volume: { type: ControlType.Number, title: "Volume", defaultValue: 0.5, min: 0, max: 1, step: 0.01, hidden: props => !props.sound },
    navigation: { type: ControlType.Object, title: "Navigation", buttonTitle: "Customize", controls: {
        arrowStyle: { type: ControlType.Enum, title: "Arrow Style", options: ["Arrow", "Chevron", "Long Arrow", "Custom"], defaultValue: "Arrow" },
        iconSize: { type: ControlType.Number, title: "Icon Size", defaultValue: 18, min: 10, max: 64, step: 1, unit: "px" },
        stroke: { type: ControlType.Number, title: "Stroke", defaultValue: 1.5, min: 0.5, max: 4, step: 0.25 },
        customPrevious: { type: ControlType.ResponsiveImage, title: "Custom Prev" },
        customNext: { type: ControlType.ResponsiveImage, title: "Custom Next" },
        width: { type: ControlType.Number, title: "Width", defaultValue: 52, min: 32, max: 120, step: 1, unit: "px" },
        height: { type: ControlType.Number, title: "Height", defaultValue: 46, min: 32, max: 96, step: 1, unit: "px" },
        radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: "8px" },
        gap: { type: ControlType.Gap, title: "Gap", defaultValue: "0px 18px" },
        fill: { type: ControlType.Color, title: "Fill", optional: true },
        color: { type: ControlType.Color, title: "Icon Color", optional: true },
        border: { type: ControlType.Border, title: "Border", defaultValue: { borderWidth: 1, borderStyle: "solid", borderColor: "rgba(238,234,226,0.14)" } },
        shadow: { type: ControlType.BoxShadow, title: "Shadow", defaultValue: "inset 0 1px 0 rgba(255,255,255,.025)" },
        hoverFill: { type: ControlType.Color, title: "Hover Fill", optional: true },
        hoverColor: { type: ControlType.Color, title: "Hover Icon", optional: true },
        hoverBorder: { type: ControlType.Color, title: "Hover Border", optional: true },
        hoverShift: { type: ControlType.Number, title: "Hover Shift", defaultValue: 1, min: 0, max: 6, step: 0.5, unit: "px" },
        showCounter: { type: ControlType.Boolean, title: "Counter", defaultValue: true },
        counterFont: { type: ControlType.Font, title: "Counter Font", defaultFontType: "sans-serif", defaultValue: { fontSize: "11px" }, controls: "extended" },
        alignment: { type: ControlType.Enum, title: "Align", options: ["Left", "Center", "Right"], defaultValue: "Center", displaySegmentedControl: true },
        bottom: { type: ControlType.Number, title: "Bottom", defaultValue: 54, min: 0, max: 180, step: 1, unit: "px" },
    } },
    showControls: { type: ControlType.Boolean, title: "Controls", defaultValue: true, description: "Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)" },
})



/**
 * Cuelume 0.2.8 — original default select and navigate cues.
 * Upstream: https://github.com/danielwh2/cuelume
 * Pinned commit: 2a1ba4fc1b67e8371c9f37e37a51e61353166335
 * Package: https://registry.npmjs.org/cuelume/-/cuelume-0.2.8.tgz
 *
 * Original cue recipes, layer shaping, envelopes, output stage and room are
 * preserved. Integration changes: isolated instance, gesture unlock, bounded
 * trigger cadence, optional velocity level, tracked nodes/timers and disposal.
 * No external imports or downloaded audio are required: Cuelume itself is
 * synthesized live. Keep this notice with distributed component source.
 *
 * MIT License
 * 
 * Copyright (c) 2026 Daniel Belyi
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

type HelixCuelumeDirection = "forward" | "back" | number
interface HelixCuelume {
  /** Call directly inside a pointer/key gesture or the sound-toggle click. */
  unlock(): Promise<boolean>
  resume(): Promise<boolean>
  /** velocity is an optional 0–1 intensity; 1 preserves upstream volume. */
  playSelect(direction?: HelixCuelumeDirection, velocity?: number, volume?: number): boolean
  playNavigate(direction?: HelixCuelumeDirection, volume?: number): boolean
  mute(): void
  dispose(): Promise<void>
}

function createHelixCuelume(): HelixCuelume {
  // Instance ownership and lifecycle are integration additions.
  let audioContext: AudioContext | null = null
  let outputBus: OutputBus | null = null
  let disposed = false
  const trackedNodes = new Set<AudioNode>()
  const sources = new Set<AudioScheduledSourceNode>()
  const cleanupTimers = new Set<ReturnType<typeof setTimeout>>()
  const voices: Voices = new Map()
  const lastPlayedAt = new Map<SoundName, number>()
  let selectQuietUntil = -Infinity

  function trackNode<T extends AudioNode>(node: T): T {
    trackedNodes.add(node)
    return node
  }
  function releaseNode(node: AudioNode) {
    try { node.disconnect() } catch {}
    trackedNodes.delete(node)
  }
  function ownSource(source: AudioScheduledSourceNode, nodes: AudioNode[]) {
    sources.add(source)
    source.onended = () => {
      sources.delete(source)
      nodes.forEach(releaseNode)
      source.onended = null
    }
  }
  function scheduleCleanup(callback: () => void, milliseconds: number) {
    const timer = setTimeout(() => {
      cleanupTimers.delete(timer)
      if (!disposed) callback()
    }, milliseconds)
    cleanupTimers.add(timer)
  }

  type SoundName = "tap" | "type" | "select" | "toggle" | "open" | "close" | "success" | "error" | "navigate" | "warning" | "loading" | "ready" | "attention" | "count"
/**
 * Layers — the building blocks every cue is made of: one tone or one burst
 * of filtered noise, shaped by an attack/decay envelope. The builders below
 * (`knock`, `struck`, `click`, …) are how themes spell real materials —
 * a struck bar, a switch click, a breath of air — out of those layers.
 */

type BaseLayer = {
  /** Seconds after the trigger that this layer starts. */
  offset?: number;
  /** Fade-in time, in seconds. */
  attack: number;
  /** Ring time: the seconds the layer takes to fall 60 dB once the attack ends. */
  decay: number;
  /** Peak volume reached at the end of the attack. */
  peak: number;
  /** If set, the layer's pitch (a tone's frequency, a noise layer's filter) glides to this value. */
  glideTo?: number;
  /** How long the glide takes, in seconds. Defaults to attack + decay. */
  glideTime?: number;
  /**
   * The lowest emphasis this layer plays at. Unset plays at every level;
   * "normal" drops out of subtle; "strong" plays only when strong.
   */
  from?: "normal" | "strong";
  /** For `count`: this layer lasts as long as the count, not only starts in step with it. */
  stretch?: true;
  /** A pitched note: it moves with the cue's walk, and lets go slowly when the cue plays again. */
  note?: true;
};

/** A single note — the building block for chimes, arpeggios, and pads. */
type ToneLayer = BaseLayer & {
  kind: "tone";
  waveform: "sine" | "square" | "sawtooth" | "triangle";
  frequency: number;
  /** Detune in cents, for a gentle chorus/beating effect between layers. */
  detune?: number;
};

/** Filtered noise — clicks, knocks, and air. */
type NoiseLayer = BaseLayer & {
  kind: "noise";
  filterType: "lowpass" | "highpass" | "bandpass";
  filterFrequency: number;
  filterQ?: number;
};

type SoundLayer = ToneLayer | NoiseLayer;

/** Per-play randomness, as fractions: each layer's pitch and level move by up to ± these. */
type Variation = {
  pitch: number;
  level: number;
};

type SoundRecipe = {
  masterGain: number;
  layers: SoundLayer[];
  /**
   * How strongly this cue rings into the shared room, as a multiple of every
   * cue's faint send. Results that land ring in it more.
   */
  room?: number;
  vary?: Variation;
  /**
   * What the gesture sounds like as it lets go: pointer up, key up. A binding
   * plays these when the gesture lifts; `play()` plays them RELEASE_GAP after
   * the press. Outcomes have none: nothing was pressed.
   */
  release?: SoundLayer[];
  /**
   * Semitones above the note that quick repeats of the cue step through, on
   * its `note` layers only. A pause starts the walk again from the first.
   */
  walk?: number[];
};

/**
 * Success and ready ring into the room 6 dB more than the rest, about 16 dB
 * under the sound itself: a result lands in the space without sounding far.
 */
const LANDED = 2;

/** How far sharp a knock is struck, and how fast it drops to its pitch. */
const KNOCK_DROP = 1.6;
const KNOCK_DROP_TIME = 0.018;

/**
 * A knock's body: a sine struck sharp that drops to `frequency` in 18 ms, the
 * way a small hollow part answers a tap. Heard as a soft "tok", never as a
 * slide. Measured from the keycap sounds in DawoodUI's Artasaka preview.
 */
const knock = (frequency: number, decay: number, peak: number, more: Partial<ToneLayer> = {}): ToneLayer => ({
  kind: "tone", waveform: "sine", frequency: frequency * KNOCK_DROP, glideTo: frequency, glideTime: KNOCK_DROP_TIME,
  attack: 0.001, decay, peak, ...more,
});


const FLAT_Q = -3;

const RECIPES: Record<"select" | "navigate", SoundRecipe> = {
  select: {
    masterGain: 0.306,
    layers: [
      { from: "normal", kind: "noise", filterType: "bandpass", filterFrequency: 2800, filterQ: 2.2, attack: 0.001, decay: 0.00749, peak: 0.16 },
      knock(415, 0.0194, 0.03),
      knock(208, 0.0313, 0.025, { from: "strong" }),
    ],
  },
  navigate: {
    masterGain: 0.322,
    layers: [
      { kind: "noise", filterType: "bandpass", filterFrequency: 400, glideTo: 1100, glideTime: 0.21, filterQ: 1.2, attack: 0.12, decay: 0.111, peak: 0.18 },
      { from: "normal", kind: "noise", filterType: "lowpass", filterFrequency: 540, filterQ: 0.7, attack: 0.09, decay: 0.109, peak: 0.045 },
      { from: "strong", kind: "noise", filterType: "lowpass", filterFrequency: 230, filterQ: 0.7, attack: 0.1, decay: 0.144, peak: 0.1 },
    ],
  },
};

/**
 * Context-aware shaping: how a cue bends to the interaction that played it.
 *
 *   semantic cue + interaction context + emphasis = rendered sound
 *
 * A shape scales a recipe's pitch, level, and length, plus its bright layers
 * (centred at or above BRIGHT_HZ) and its tail (layers that start late). Every
 * factor is curated here and clamped, so a cue always stays recognisably itself
 * and context that is missing leaves the canonical sound untouched.
 */


type Emphasis = "subtle" | "normal" | "strong";
type InputMethod = "mouse" | "touch" | "pen" | "keyboard";
type KeyRole = "printable" | "space" | "delete" | "enter";
type Context = { input?: InputMethod; key?: KeyRole; direction?: 1 | -1; duration?: number };

/** `sweep` is 1, or -1 to play a cue's glides backwards. `time` moves when layers start. */
type Shape = { pitch: number; level: number; length: number; bright: number; tail: number; sweep: number; time: number };

const IDENTITY: Shape = { pitch: 1, level: 1, length: 1, bright: 1, tail: 1, sweep: 1, time: 1 };
const BRIGHT_HZ = 2500;

/**
 * How much the action matters. Most of the difference is the arrangement
 * (which layers play, see `arrangement`); this shape only leans on it.
 */
const EMPHASIS: Record<Emphasis, Partial<Shape>> = {
  subtle: { level: 0.8, length: 0.85, bright: 0.75 },
  normal: {},
  strong: { pitch: 0.98, level: 1.08, length: 1.2, bright: 1.1 },
};
const RANK: Record<Emphasis, number> = { subtle: 0, normal: 1, strong: 2 };

/** `type`: bigger keys sound bigger; deleting sits lower than writing. */
const KEYS: Record<KeyRole, Partial<Shape>> = {
  printable: {},
  space: { pitch: 0.86, level: 1.08, length: 1.15 },
  delete: { pitch: 0.92, level: 0.9, bright: 0.8 },
  enter: { pitch: 0.8, level: 1.12, length: 1.25 },
};

/** `tap`: the glass answers to what touched it. */
const INPUTS: Record<InputMethod, Partial<Shape>> = {
  mouse: {},
  touch: { pitch: 0.97, level: 0.92, bright: 0.45 },
  pen: { pitch: 1.02, bright: 1.3 },
  keyboard: { pitch: 0.94, length: 0.85, bright: 0.7 },
};

/** `select`: a later option rises, an earlier one falls. Perceptible, never melodic. */
const DIRECTION_STEP = 0.05;

/** Repeats closer than FAST_MS play fully lightened; slower than SLOW_MS, not at all. */
const FAST_MS = 70;
const SLOW_MS = 220;
const CADENCE_CUES: ReadonlySet<SoundName> = new Set(["type", "select", "tap", "toggle", "navigate"]);

/** `count` is written at COUNT_MS; `duration` stretches it within these bounds. */
const COUNT_MS = 800;
const COUNT_MIN_MS = 300;
const COUNT_MAX_MS = 2000;

/** Going back plays these cues' glides backwards, so they fall. */
const REVERSIBLE: ReadonlySet<SoundName> = new Set(["navigate", "toggle", "count"]);

/** The layers an emphasis plays: subtle strips ornament, strong adds its own layer. */
function arrangement(layers: SoundLayer[], emphasis: Emphasis): SoundLayer[] {
  return layers.filter((layer) => RANK[emphasis] >= RANK[layer.from ?? "subtle"]);
}

const own = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key);

function resolveEmphasis(value: unknown): Emphasis {
  return typeof value === "string" && own(EMPHASIS, value) ? (value as Emphasis) : "normal";
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const DIRECTIONS = { forward: 1, back: -1 } as const;

/**
 * The context a caller passed to `play()`, in the shape bindings produce.
 * Unknown values are left out, so the cue plays as it would with none.
 */
function contextFrom(
  options: { direction?: unknown; key?: unknown; input?: unknown; duration?: unknown } | null | undefined,
): Context {
  const context: Context = {};
  if (!options) return context;
  const { direction, key, input, duration } = options;
  if (typeof direction === "string" && own(DIRECTIONS, direction)) context.direction = DIRECTIONS[direction as keyof typeof DIRECTIONS];
  if (typeof key === "string" && own(KEYS, key)) context.key = key as KeyRole;
  if (typeof input === "string" && own(INPUTS, input)) context.input = input as InputMethod;
  if (typeof duration === "number" && Number.isFinite(duration)) context.duration = clamp(duration, COUNT_MIN_MS, COUNT_MAX_MS);
  return context;
}

function cadence(sinceLastMs: number): Partial<Shape> {
  const speed = Math.min(1, Math.max(0, (SLOW_MS - sinceLastMs) / (SLOW_MS - FAST_MS)));
  return { level: 1 - 0.22 * speed, length: 1 - 0.25 * speed, bright: 1 - 0.2 * speed, tail: 1 - 0.8 * speed };
}

/** The combined shape for one play of `sound`. */
function shapeFor(sound: SoundName, context: Context, emphasis: Emphasis, sinceLastMs: number): Shape {
  const parts = [EMPHASIS[emphasis]];
  if (CADENCE_CUES.has(sound)) parts.push(cadence(sinceLastMs));
  if (sound === "type" && context.key) parts.push(KEYS[context.key]);
  if (sound === "tap" && context.input) parts.push(INPUTS[context.input]);
  if (sound === "select" && context.direction) parts.push({ pitch: 1 + DIRECTION_STEP * context.direction });
  if (sound === "count" && context.duration) parts.push({ time: context.duration / COUNT_MS });
  if (REVERSIBLE.has(sound) && context.direction === -1) parts.push({ sweep: -1 });

  const shape = { ...IDENTITY };
  for (const part of parts) {
    for (const key of Object.keys(part) as (keyof Shape)[]) shape[key] *= part[key]!;
  }
  return shape;
}


/** What `shape` does to one layer, bounded so no context can run away with a cue. */
function layerFactors(layer: SoundLayer, shape: Shape): { pitch: number; gain: number; length: number } {
  const frequency = layer.kind === "tone" ? layer.frequency : layer.filterFrequency;
  const gain =
    shape.level * (frequency >= BRIGHT_HZ ? shape.bright : 1) * ((layer.offset ?? 0) > 0 ? shape.tail : 1);
  return {
    pitch: clamp(shape.pitch, 0.75, 1.25),
    gain: clamp(gain, 0, 1.5),
    length: clamp(shape.length, 0.6, 1.6),
  };
}

/**
 * The shared output stage: one boosted bus through a subsonic cut and a
 * soft clip, plus one faint stereo room every cue rings into. Built once per
 * AudioContext; also owns the shared noise buffer noise layers loop from.
 */


const OUTPUT_GAIN = 5.8;
const CLIP_KNEE = 0.7;
const CLIP_CURVE_POINTS = 1025;
/** Below this nothing is heard, but deep notes would still spend headroom on it. */
const SUBSONIC_HZ = 40;

/** Seconds of shared noise. Noise layers loop it from a random point, so none is made per play. */
const NOISE_SECONDS = 2;

/** One context's output bus, room send target, cached noise buffer, and the voices sounding on it. Owned by engine.ts. */
type OutputBus = { output: GainNode; room: AudioNode; noise: AudioBuffer | null; live: Set<GainNode> };

/** How long a silenced voice takes to fade: short enough to hear as at once, long enough not to click. */
const SILENCE_FADE = 0.015;

/**
 * Fades every voice sounding on `bus`, for a mute that should be heard at once.
 * ponytail: the room's own tail, a quarter of a second and 22 dB down, rings out; gate its return if that is ever heard
 */
function silence(context: AudioContext, bus: OutputBus): void {
  const now = context.currentTime;
  for (const { gain } of bus.live) {
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(0, now + SILENCE_FADE);
  }
  bus.live.clear();
}

const NOISE_SEED = 1;

function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 2 ** 32;
  };
}

function fillNoise(data: Float32Array): void {
  const random = seeded(NOISE_SEED);
  for (let i = 0; i < data.length; i++) data[i] = 2 * random() - 1;
}

function getNoise(context: AudioContext, bus: OutputBus): AudioBuffer {
  if (bus.noise) return bus.noise;
  const length = Math.max(1, Math.floor(NOISE_SECONDS * context.sampleRate));
  bus.noise = context.createBuffer(1, length, context.sampleRate);
  fillNoise(bus.noise.getChannelData(0));
  return bus.noise;
}

/**
 * The shared room: a short, dense burst of reflections that dies away over
 * ROOM_SECONDS. Reflections within the first 80 ms or so are what move a sound
 * out of the listener's head (Begault); a longer tail only adds distance. Its
 * two channels are independent noise, so the room is wide while the sound
 * itself stays centred.
 */
const ROOM_SECONDS = 0.25;
/** The gap before the first reflection: a small room's nearest wall. */
const ROOM_PREDELAY = 0.008;
/** Reflections are low-passed here: walls swallow the highs first. */
const ROOM_LOWPASS = 3500;
/** How much of every cue reaches the room: about 22 dB down, faint enough to feel rather than hear. */
const ROOM_SEND = 0.08;
/** 60 dB of decay, the conventional end of a room's tail. */
const ROOM_DECAY_DB = 60;

const ROOM_SEEDS = [3110, 5639] as const;
const ROOM_REFLECTIONS_PER_SECOND = 48000;

function fillRoom(data: Float32Array, rate: number, seed: number): void {
  const random = seeded(seed);
  const fall = (ROOM_DECAY_DB / 20) * Math.LN10;
  const reflections = new Float32Array(Math.floor(ROOM_SECONDS * ROOM_REFLECTIONS_PER_SECOND));
  let energy = 0;
  for (let i = 0; i < reflections.length; i++) {
    const t = i / ROOM_REFLECTIONS_PER_SECOND;
    reflections[i] = t < ROOM_PREDELAY ? 0 : (2 * random() - 1) * Math.exp((-fall * t) / ROOM_SECONDS);
    energy += reflections[i] * reflections[i];
  }
  const scale = 1 / Math.sqrt(energy);
  for (let i = 0; i < reflections.length; i++) {
    const at = (i / ROOM_REFLECTIONS_PER_SECOND) * rate;
    const sample = Math.floor(at);
    const late = at - sample;
    if (sample < data.length) data[sample] += reflections[i] * scale * (1 - late);
    if (sample + 1 < data.length) data[sample + 1] += reflections[i] * scale * late;
  }
}

/** Builds the room once, feeding `output`; returns the node sends connect to. */
function buildRoom(context: AudioContext, output: AudioNode): AudioNode {
  const rate = context.sampleRate;
  const length = Math.max(1, Math.floor(ROOM_SECONDS * rate));
  const impulse = context.createBuffer(2, length, rate);
  ROOM_SEEDS.forEach((seed, channel) => fillRoom(impulse.getChannelData(channel), rate, seed));
  const convolver = trackNode(context.createConvolver());
  convolver.normalize = false;
  convolver.buffer = impulse;

  const walls = trackNode(context.createBiquadFilter());
  walls.type = "lowpass";
  walls.frequency.value = ROOM_LOWPASS;
  walls.Q.value = FLAT_Q;

  walls.connect(convolver).connect(output);
  return walls;
}

function softClip(level: number): number {
  const over = Math.abs(level) - CLIP_KNEE;
  if (over <= 0) return level;
  const shoulder = 1 - CLIP_KNEE;
  return Math.sign(level) * (CLIP_KNEE + over - (over * over) / (2 * shoulder));
}

/** Builds one context's output bus and room. Engine owns the result and builds it once. */
function createOutput(context: AudioContext): OutputBus {
  const output = trackNode(context.createGain());
  output.gain.value = OUTPUT_GAIN;

  const clip = trackNode(context.createWaveShaper());
  clip.curve = Float32Array.from({ length: CLIP_CURVE_POINTS }, (_, i) => softClip((2 * i) / (CLIP_CURVE_POINTS - 1) - 1));

  const subsonic = trackNode(context.createBiquadFilter());
  subsonic.type = "highpass";
  subsonic.frequency.value = SUBSONIC_HZ;
  subsonic.Q.value = FLAT_Q;

  output.connect(subsonic).connect(clip).connect(context.destination);
  return { output, room: buildRoom(context, output), noise: null, live: new Set() };
}

/**
 * Rendering: turns one shaped recipe into Web Audio nodes — an oscillator
 * or filtered-noise source per layer, each swelling in along a straight line
 * and dying away exponentially. Every sound rings faintly into the shared
 * room (see output.ts), so it sounds placed in a space.
 *
 * A straight swell is heard from its first moment; an exponential one stays
 * silent for most of its length and then jumps in, heard as a late second hit.
 */


const SOURCE_STOP_PADDING = 0.05;
const DECAY_DB = 60;
const fallTime = (decay: number) => decay / ((DECAY_DB / 20) * Math.LN10);
const CLEANUP_MARGIN = 0.05;

/** Holds `param` at `from`, then glides it toward the layer's `glideTo`, if any. */
function glide(param: AudioParam, from: number, layer: SoundLayer, startTime: number): void {
  param.setValueAtTime(from, startTime);
  if (layer.glideTo === undefined) return;
  param.exponentialRampToValueAtTime(layer.glideTo, startTime + (layer.glideTime ?? layer.attack + layer.decay));
}

/** Swells `param` to the layer's peak along a straight line, then lets it die away. */
function envelope(param: AudioParam, layer: SoundLayer, startTime: number): void {
  param.setValueAtTime(0, startTime);
  param.linearRampToValueAtTime(layer.peak, startTime + layer.attack);
  param.setTargetAtTime(0, startTime + layer.attack, fallTime(layer.decay));
}

function renderTone(
  context: AudioContext,
  destination: AudioNode,
  layer: ToneLayer,
  startTime: number,
): void {
  const oscillator = trackNode(context.createOscillator());
  oscillator.type = layer.waveform;
  glide(oscillator.frequency, layer.frequency, layer, startTime);
  if (layer.detune) oscillator.detune.value = layer.detune;

  const gain = trackNode(context.createGain());
  envelope(gain.gain, layer, startTime);

  oscillator.connect(gain).connect(destination);
  ownSource(oscillator, [oscillator, gain]);
  oscillator.start(startTime);
  oscillator.stop(startTime + layer.attack + layer.decay + SOURCE_STOP_PADDING);
}

function renderNoise(
  context: AudioContext,
  bus: OutputBus,
  destination: AudioNode,
  layer: NoiseLayer,
  startTime: number,
): void {
  const duration = layer.attack + layer.decay + SOURCE_STOP_PADDING;
  const source = trackNode(context.createBufferSource());
  source.buffer = getNoise(context, bus);
  source.loop = true;

  const filter = trackNode(context.createBiquadFilter());
  filter.type = layer.filterType;
  glide(filter.frequency, layer.filterFrequency, layer, startTime);
  if (layer.filterQ !== undefined) filter.Q.value = layer.filterQ;

  const gain = trackNode(context.createGain());
  envelope(gain.gain, layer, startTime);

  source.connect(filter).connect(gain).connect(destination);
  // a different stretch of the same noise every time
  ownSource(source, [source, filter, gain]);
  source.start(startTime, Math.random() * NOISE_SECONDS);
  source.stop(startTime + duration);
}

function sourceEnd(layers: SoundLayer[]): number {
  return Math.max(
    ...layers.map(
      (layer) => (layer.offset ?? 0) + layer.attack + layer.decay + SOURCE_STOP_PADDING,
    ),
  );
}

const nudge = (amount: number) => 1 + (Math.random() * 2 - 1) * amount;

/**
 * One play's strike: how high the object sounds and how hard it was hit. Every
 * layer shares it, so a harder strike is louder and brighter at once, as a
 * real one is, rather than each layer drifting on its own.
 */
type Strike = { pitch: number; force: number };
const STEADY_STRIKE: Strike = { pitch: 1, force: 1 };

/** Within one strike, each layer's ring length moves by up to this: same object, a slightly different hit. */
const DECAY_JITTER = 0.1;
/** And each tone's pitch by up to this, about 9 cents: the object's modes never sit exactly the same twice. */
const MODE_JITTER = 0.005;

/** How long a cue's last play takes to fade when the same cue plays again, in seconds. */
const HANDOFF_TIME = 0.08;
/**
 * A cue with notes lets its last play go slower, so a walk overlaps: in the
 * Artasaka press the old note falls about twice as fast once the next lands.
 */
const NOTE_HANDOFF_TIME = 0.4;
/**
 * Each cue's latest voice and how fast it lets go. A cue plays one voice at a
 * time, like one key under one finger: playing it again releases the last play
 * instead of stacking on it. Other cues ring on. Owned by engine.ts.
 */
type Voices = Map<SoundName, { gain: GainNode; fade: number }>;

/** The Artasaka press lets go 85–95 ms after it presses; a play with no real let-go waits this long. */
const RELEASE_GAP = 0.09;

/**
 * Which part of a gesture to play: the press, the release as it lets go, or
 * both, the release RELEASE_GAP later.
 */
type Part = "press" | "release" | "both";

/** Everything one press decided, so its release sounds like the same press. */
type Played = { recipe: SoundRecipe; volume: number; emphasis: Emphasis; shape: Shape; step: number };

/**
 * A copy of `layer` bent by the play's context shape and its strike. A cue
 * with `vary` also moves each layer's ring and tone a little on its own, so no
 * two plays match; one without plays exactly. A harder strike raises a noise
 * layer's filter with its level: louder is brighter. A reversed sweep starts
 * where it would have ended. `time` moves every layer's start, and a
 * `stretch` layer lasts as long as the count.
 */
function shaped(layer: SoundLayer, shape: Shape, strike: Strike, vary: Variation | undefined, walk: number): SoundLayer {
  const factors = layerFactors(layer, shape);
  const tune = layer.kind === "tone" ? (vary ? nudge(MODE_JITTER) : 1) : strike.force;
  const pitch = factors.pitch * strike.pitch * tune * (layer.note ? walk : 1);
  const peak = layer.peak * factors.gain * strike.force;
  const stretch = layer.stretch ? shape.time : 1;
  const decay = layer.decay * factors.length * stretch * (vary ? nudge(DECAY_JITTER) : 1);
  const start = layer.kind === "tone" ? layer.frequency : layer.filterFrequency;
  const [from, to] = shape.sweep < 0 && layer.glideTo !== undefined ? [layer.glideTo, start] : [start, layer.glideTo];
  const glideTo = to === undefined ? undefined : to * pitch;
  const timing = {
    offset: (layer.offset ?? 0) * shape.time,
    attack: layer.attack * stretch,
    glideTime: layer.glideTime === undefined ? undefined : layer.glideTime * stretch,
  };
  return layer.kind === "tone"
    ? { ...layer, ...timing, frequency: from * pitch, glideTo, peak, decay }
    : { ...layer, ...timing, filterFrequency: from * pitch, glideTo, peak, decay };
}

/**
 * The layers `part` of one play sounds: arranged for its emphasis, bent by its
 * shape, strike and walk, the release starting as the gesture lets go. No Web
 * Audio here, so scripts/sound.mjs renders the same layers offline.
 */
function layersFor({ recipe, emphasis, shape, step }: Pick<Played, "recipe" | "emphasis" | "shape" | "step">, part: Part): SoundLayer[] {
  const parts: [layers: SoundLayer[], delay: number][] = [];
  if (part !== "release") parts.push([recipe.layers, 0]);
  if (part !== "press" && recipe.release) parts.push([recipe.release, part === "both" ? RELEASE_GAP : 0]);
  const walk = 2 ** ((recipe.walk?.[step] ?? 0) / 12);
  const { vary } = recipe;
  const strike = vary ? { pitch: nudge(vary.pitch), force: nudge(vary.level) } : STEADY_STRIKE;
  return parts.flatMap(([partLayers, delay]) =>
    arrangement(partLayers, emphasis).map((layer) => {
      const bent = shaped(layer, shape, strike, vary, walk);
      return { ...bent, offset: (bent.offset ?? 0) + delay };
    }),
  );
}

function renderRecipe(context: AudioContext, getBus: () => OutputBus, voices: Voices, sound: SoundName, played: Played, part: Part): void {
  const { recipe, volume } = played;
  const layers = layersFor(played, part);
  if (layers.length === 0) return;

  const now = context.currentTime;
  const bus = getBus();
  const { output, room } = bus;
  const master = trackNode(context.createGain());
  master.gain.value = recipe.masterGain * volume;
  master.connect(output);
  const send = trackNode(context.createGain());
  send.gain.value = ROOM_SEND * (recipe.room ?? 1);
  master.connect(send).connect(room);
  bus.live.add(master);

  // a release rings with its press rather than replacing it
  if (part !== "release") {
    const last = voices.get(sound);
    if (last) {
      last.gain.gain.setValueAtTime(last.gain.gain.value, now);
      last.gain.gain.exponentialRampToValueAtTime(0.0001, now + last.fade);
    }
    const fade = recipe.layers.some((layer) => layer.note) ? NOTE_HANDOFF_TIME : HANDOFF_TIME;
    voices.set(sound, { gain: master, fade });
  }

  for (const layer of layers) {
    const startTime = now + (layer.offset ?? 0);
    if (layer.kind === "tone") renderTone(context, master, layer, startTime);
    else renderNoise(context, bus, master, layer, startTime);
  }

  // the room rings on by itself once the last source has fed it
  const cleanupAfterMs = (sourceEnd(layers) + CLEANUP_MARGIN) * 1000;
  scheduleCleanup(() => {
    if (voices.get(sound)?.gain === master) voices.delete(sound);
    bus.live.delete(master);
    releaseNode(master);
    releaseNode(send);
  }, cleanupAfterMs);
}

  // Integration API: same upstream renderer, deliberately no DOM-wide binding.
  const level = (value: number, fallback = 1) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback
  const directionName = (direction: HelixCuelumeDirection) => direction === "back" || (typeof direction === "number" && direction < 0) ? "back" : "forward"

  async function unlock(): Promise<boolean> {
    if (disposed || typeof window === "undefined") return false
    // The same activation guard as the official Cuelume engine.
    if (typeof navigator !== "undefined" && navigator.userActivation?.hasBeenActive === false) return false
    try {
      if (!audioContext) {
        const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!AudioCtor) return false
        audioContext = new AudioCtor()
      }
      const context = audioContext
      if (context.state !== "running") await context.resume()
      return !disposed && context.state === "running"
    } catch { return false }
  }

  function play(name: "select" | "navigate", direction: HelixCuelumeDirection, volume: number): boolean {
    const context = audioContext
    if (disposed || !context || context.state !== "running") return false
    const gain = level(volume)
    if (gain === 0) return false
    const now = performance.now()
    const previous = lastPlayedAt.get(name) ?? -Infinity
    // Avoid a queue of late sounds or simultaneous click/whoosh on one jump.
    if (name === "select" && (now < selectQuietUntil || now - previous < 60)) return false
    if (name === "navigate" && now - previous < 200) return false
    const emphasis: Emphasis = "normal"
    const played: Played = {
      recipe: RECIPES[name], volume: gain, emphasis, step: 0,
      shape: shapeFor(name, contextFrom({ direction: directionName(direction) }), emphasis, now - previous),
    }
    lastPlayedAt.set(name, now)
    if (name === "navigate") selectQuietUntil = now + 240
    try {
      renderRecipe(context, () => outputBus ?? (outputBus = createOutput(context)), voices, name, played, "both")
      return true
    } catch { return false }
  }

  function mute() {
    if (audioContext && outputBus && audioContext.state !== "closed") silence(audioContext, outputBus)
    voices.clear()
  }

  async function dispose(): Promise<void> {
    if (disposed) return
    disposed = true
    for (const timer of cleanupTimers) clearTimeout(timer)
    cleanupTimers.clear()
    for (const source of sources) {
      source.onended = null
      try { source.stop() } catch {}
    }
    sources.clear()
    for (const node of trackedNodes) releaseNode(node)
    trackedNodes.clear()
    voices.clear()
    lastPlayedAt.clear()
    if (outputBus) {
      outputBus.live.clear()
      outputBus.noise = null
    }
    outputBus = null
    const context = audioContext
    audioContext = null
    if (context && context.state !== "closed") {
      try { await context.close() } catch {}
    }
  }

  return {
    unlock,
    resume: unlock,
    playSelect(direction = "forward", velocity = 1, volume = 0.5) {
      // Velocity only changes level, never the original frequencies/envelope.
      return play("select", direction, level(volume) * (0.78 + 0.22 * level(Math.abs(velocity))))
    },
    playNavigate(direction = "forward", volume = 0.35) {
      return play("navigate", direction, volume)
    },
    mute,
    dispose,
  }
}


