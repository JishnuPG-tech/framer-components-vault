/**
 * USER REQUEST:
 * "create a transitioning card with stats and image just as shown in the video, give it that
 * shape and design and ability to choose other shapes. use the video to recreate the transitions
 * maybe on hover or appear. include necessary presets to change and design the content like
 * color typography. also organize cleanly the right presets for quick understanding of what
 * presets do what task."
 * FOLLOW-UP 1: "for the badge allow the little icon to be an image someone can change, but with
 * that bubble glass around it just as it is right now"
 * FOLLOW-UP 2: "the tiles content can change with each image transition, so someone can add as much
 * content for the tiles as they can add for the image. also make sure not to interfere with framer
 * code and make sure to make the component responsive so nothing is cut off in other screen sizes"
 *
 * HOW IT WORKS
 * - The image is masked by an SVG mask: a full rectangle minus "cutout" rectangles.
 *   A blur + threshold step rounds every corner (outer and notch) so shapes stay soft while moving.
 * - Tiles sit inside the cutouts. Each shape preset has 3 states; moving between states
 *   glides the tiles across the grid and the image shape reflows around them.
 * - Every slide holds one image and the content of the 3 tiles. When the image changes,
 *   the tile content changes with it.
 * - Content scales with the card, and each tile's content is also fitted to its smallest cutout,
 *   so nothing is clipped at any size.
 * - Self-contained: no global styles, no document listeners, unique ids per instance.
 * - Panel groups: Slides / Shape / Motion / Colors / Typography.
 */
import {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { animate, AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion"

/* ----------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------- */

type Rect = [number, number, number, number] // x, y, w, h as fractions of the card
type ShapeKey = "staggered" | "corners" | "steps" | "strip" | "windows"
type IntroKey = "rise" | "notch" | "fade" | "none"
type TriggerKey = "auto" | "hover" | "cycleHover" | "click" | "none"
type ImageEffectKey = "fade" | "zoom" | "slide" | "none"

interface ImageValue {
    src: string
    alt?: string
}

interface TileContent {
    kind?: "stat" | "brand" | "empty"
    prefix?: string
    value?: string
    label?: string
    heading?: string
    extras?: string
    showBadge?: boolean
    badgeImage?: ImageValue
    badgeIconSize?: number
}

interface SlideItem {
    image?: ImageValue
    tile1?: TileContent
    tile2?: TileContent
    tile3?: TileContent
}

interface Slide {
    src: string
    alt: string
    tiles: TileContent[]
}

interface ShapeSettings {
    preset: ShapeKey
    radius: number
    tilePadding: number
    previewState: number
}

interface MotionSettings {
    trigger: TriggerKey
    interval: number
    intro: IntroKey
    transition: any
    stagger: number
    imageEffect: ImageEffectKey
    imageDuration: number
}

interface ColorSettings {
    textColor: string
    mutedColor: string
    tileFill?: string
    overlay?: string
}

interface TypeSettings {
    valueFont: CSSProperties
    labelFont: CSSProperties
    headingFont: CSSProperties
    extrasFont: CSSProperties
    uppercase: boolean
}

interface ShapeTransitionCardProps {
    slides?: SlideItem[]
    /** legacy props from the first version, still honoured if present */
    images?: ImageValue[]
    tiles?: TileContent[]
    shapeSettings?: Partial<ShapeSettings>
    motionSettings?: Partial<MotionSettings>
    colorSettings?: Partial<ColorSettings>
    typeSettings?: Partial<TypeSettings>
    style?: CSSProperties
}

/* ----------------------------------------------------------------------------
 * Shape presets. Grid is 12 columns x 8 rows. Every preset has 3 states, and every
 * state places 5 slots: slot 0-2 hold the content tiles, slot 3-4 are empty "ghost"
 * cutouts that only add shape. Z collapses a slot to nothing.
 * ------------------------------------------------------------------------- */

const G = (c: number, r: number, w: number, h: number): Rect => [c / 12, r / 8, w / 12, h / 8]
const Z: Rect = [0.5, 0.5, 0, 0]

const PRESETS: Record<ShapeKey, Rect[][]> = {
    // The shape from the video: staggered notches that hop around the image
    staggered: [
        [G(8, 0, 4, 3), G(5, 5, 3, 3), G(0, 5, 5, 3), Z, Z],
        [G(8, 0, 2, 3), G(6, 5, 2, 3), G(2, 5, 4, 3), G(0, 0, 2, 3), G(10, 5, 2, 3)],
        [G(8, 5, 2, 3), G(6, 0, 2, 3), G(2, 5, 4, 3), G(0, 0, 2, 3), G(10, 0, 2, 3)],
    ],
    // One notch in each corner
    corners: [
        [G(0, 0, 3, 3), G(9, 5, 3, 3), G(0, 5, 5, 3), G(10, 0, 2, 2), Z],
        [G(9, 0, 3, 3), G(0, 5, 3, 3), G(7, 5, 5, 3), G(0, 0, 2, 2), Z],
        [G(0, 5, 3, 3), G(9, 0, 3, 3), G(0, 0, 5, 3), G(10, 6, 2, 2), Z],
    ],
    // A staircase of notches running corner to corner
    steps: [
        [G(9, 0, 3, 3), G(6, 3, 3, 3), G(0, 5, 6, 3), Z, Z],
        [G(0, 0, 3, 3), G(3, 3, 3, 3), G(6, 5, 6, 3), Z, Z],
        [G(8, 5, 4, 3), G(5, 3, 3, 3), G(0, 0, 5, 3), Z, Z],
    ],
    // A banner with a bar of tiles that slides along the top and bottom edges
    strip: [
        [G(6, 5, 3, 3), G(9, 5, 3, 3), G(0, 5, 6, 3), Z, Z],
        [G(6, 0, 3, 3), G(9, 0, 3, 3), G(0, 0, 6, 3), Z, Z],
        [G(6, 0, 3, 3), G(9, 5, 3, 3), G(0, 5, 6, 3), Z, Z],
    ],
    // Cutouts floating inside the image, like windows
    windows: [
        [G(1, 1, 3, 3), G(8, 1, 3, 3), G(3, 5, 6, 2), Z, Z],
        [G(8, 1, 3, 3), G(1, 4, 3, 3), G(1, 1, 6, 2), Z, Z],
        [G(4, 1, 3, 3), G(8, 4, 3, 3), G(1, 5, 5, 2), Z, Z],
    ],
}

// Cutouts that touch the card edge extend past it, so the notch opens cleanly to the outside
function edgesOf(r: Rect): Rect {
    const [x, y, w, h] = r
    if (w <= 0 || h <= 0) return [x, y, x, y]
    const e = 0.002
    return [
        x <= e ? -1 : x,
        y <= e ? -1 : y,
        x + w >= 1 - e ? 2 : x + w,
        y + h >= 1 - e ? 2 : y + h,
    ]
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const lerp4 = (a: Rect, b: Rect, t: number): Rect => [
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t),
    lerp(a[2], b[2], t),
    lerp(a[3], b[3], t),
]
const mod = (a: number, n: number) => ((a % n) + n) % n
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

interface Slot {
    boxFrom: Rect
    boxTo: Rect
    edgeFrom: Rect
    edgeTo: Rect
    t: number
    appear: number
}

const SLOT_COUNT = 5
const TILE_COUNT = 3
const STATE_COUNT = 3
const THRESHOLD_SLOPE = 20
const SIGMA_PER_RADIUS = 0.5
const DESIGN_W = 640 // size the content was designed at
const DESIGN_H = 260
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]

const DEFAULT_IMAGES: ImageValue[] = [
    { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Gradient 1 - Blue" },
    { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Gradient 2 - Purple" },
    { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Gradient 3 - Orange" },
]

const T = (o: TileContent): TileContent => ({
    kind: "stat",
    prefix: "",
    value: "",
    label: "",
    heading: "",
    extras: "",
    showBadge: true,
    ...o,
})

const DEFAULT_SLIDES: SlideItem[] = [
    {
        image: DEFAULT_IMAGES[0],
        tile1: T({ prefix: "+", value: "1K", label: "Artboards" }),
        tile2: T({ prefix: "+", value: "15", label: "Projects" }),
        tile3: T({ kind: "brand", heading: "Pro's Choice", extras: "Forbes   intel   citi" }),
    },
    {
        image: DEFAULT_IMAGES[1],
        tile1: T({ prefix: "+", value: "3.2M", label: "Downloads" }),
        tile2: T({ prefix: "+", value: "48", label: "Countries" }),
        tile3: T({ kind: "brand", heading: "Top Rated", extras: "Aero   Nova   Orbit" }),
    },
    {
        image: DEFAULT_IMAGES[2],
        tile1: T({ prefix: "+", value: "120", label: "Clients" }),
        tile2: T({ prefix: "+", value: "9", label: "Awards" }),
        tile3: T({ kind: "brand", heading: "Trusted By", extras: "Pixel   Loop   Arc" }),
    },
]

function normalizeSlides(props: ShapeTransitionCardProps): Slide[] {
    let list: SlideItem[] = DEFAULT_SLIDES
    if (props.slides && props.slides.length) {
        list = props.slides
    } else if ((props.images && props.images.length) || (props.tiles && props.tiles.length)) {
        // Legacy shape of the component: one image list + one shared tile list
        const imgs = props.images && props.images.length ? props.images : DEFAULT_IMAGES
        const base = DEFAULT_SLIDES[0]
        const tl = props.tiles && props.tiles.length ? props.tiles : [base.tile1!, base.tile2!, base.tile3!]
        list = imgs.map((image) => ({ image, tile1: tl[0], tile2: tl[1], tile3: tl[2] }))
    }
    return list.slice(0, 5).map((s, i) => {
        const fb = DEFAULT_IMAGES[i % DEFAULT_IMAGES.length]
        const defaults = DEFAULT_SLIDES[i % DEFAULT_SLIDES.length]
        const pick = (t: TileContent | undefined, d: TileContent | undefined): TileContent => (t ? { kind: "stat", ...t } : d || { kind: "empty" })
        return {
            src: s.image && s.image.src ? s.image.src : fb.src,
            alt: (s.image && s.image.alt) || "",
            tiles: [pick(s.tile1, defaults.tile1), pick(s.tile2, defaults.tile2), pick(s.tile3, defaults.tile3)],
        }
    })
}

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

/* ----------------------------------------------------------------------------
 * Component
 * ------------------------------------------------------------------------- */

/**
 * Shape Transition Card
 *
 * An image card cut into a shape. Tiles sit in the cutouts and glide between
 * positions, and the image shape reflows around them. Every slide brings its own image
 * and its own tile content. Plays on appear, on hover, on click or in a loop.
 *
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 260
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ShapeTransitionCard(props: ShapeTransitionCardProps) {
    const { style } = props
    const slides = useMemo(() => normalizeSlides(props), [props.slides, props.images, props.tiles])
    const slideCount = slides.length

    const shape: ShapeSettings = {
        preset: "staggered",
        radius: 16,
        tilePadding: 14,
        previewState: 1,
        ...(props.shapeSettings || {}),
    }
    const mo: MotionSettings = {
        trigger: "auto",
        interval: 3,
        intro: "rise",
        transition: { type: "spring", duration: 0.9, bounce: 0.12 },
        stagger: 0.08,
        imageEffect: "zoom",
        imageDuration: 0.9,
        ...(props.motionSettings || {}),
    }
    const col: ColorSettings = {
        textColor: "#1B1B20",
        mutedColor: "#B4B4BC",
        ...(props.colorSettings || {}),
    }
    const ty: TypeSettings = {
        valueFont: {},
        labelFont: {},
        headingFont: {},
        extrasFont: {},
        uppercase: true,
        ...(props.typeSettings || {}),
    }

    const preset: ShapeKey = PRESETS[shape.preset] ? shape.preset : "staggered"
    const isStatic = useIsStaticRenderer()
    const reduce = useReducedMotion()

    const wrapRef = useRef<HTMLDivElement>(null)
    const inView = useInView(wrapRef, { amount: 0.2 })
    const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
    const maskId = `stc-m-${uid}`
    const filterId = `stc-f-${uid}`

    const [size, setSize] = useState({ w: 0, h: 0 })
    const sizeRef = useRef(size)
    sizeRef.current = size

    // DOM handles
    const maskRects = useRef<(SVGRectElement | null)[]>([])
    const curtainRect = useRef<SVGRectElement | null>(null)
    const imageEls = useRef<(SVGImageElement | null)[]>([])
    const tileEls = useRef<(HTMLDivElement | null)[]>([])
    const innerEls = useRef<(HTMLDivElement | null)[]>([])
    const fadeRoot = useRef<SVGSVGElement | null>(null)
    const measureEls = useRef<(HTMLDivElement | null)[]>([])

    // Animation state
    const slots = useRef<Slot[]>([])
    const targetStep = useRef(0) // counts up forever: shape state = step % 3, slide = step % slideCount
    const anims = useRef<({ stop: () => void } | null)[]>([])
    const curtain = useRef(0) // 1 = image fully covered, 0 = fully revealed
    const fadeP = useRef(1)
    const introRan = useRef(false)
    const curImg = useRef(0)
    const prevImg = useRef(-1)
    const imgQ = useRef(1)
    const imgAnim = useRef<{ stop: () => void } | null>(null)
    const [slideIdx, setSlideIdx] = useState(0)
    const [naturals, setNaturals] = useState<number[][][]>([])

    // Always-current config for callbacks
    const cfg = useRef({ preset, mo, reduce: false, imageCount: slideCount, introKey: mo.intro })
    cfg.current = { preset, mo, reduce: !!reduce, imageCount: slideCount, introKey: reduce ? "none" : mo.intro }

    const introKey = cfg.current.introKey

    const { w, h } = size

    // Responsive scale: 1 at the design size, smaller on phones, larger (capped) on wide cards
    const k = w > 0 && h > 0 ? clamp(Math.min(w / DESIGN_W, h / DESIGN_H), 0.3, 1.6) : 1
    const kc = clamp(k, 0.5, 1.5) // for radius and padding, which should not shrink as hard
    const radiusEff = shape.radius * kc
    const padPx = shape.tilePadding * kc
    const sigma = Math.max(0.3, radiusEff * SIGMA_PER_RADIUS)
    const pad = Math.ceil(sigma * 4)

    /* ---------------- render: write current animation state into the DOM ---------------- */

    const render = useCallback(() => {
        const { w, h } = sizeRef.current
        if (!w || !h) return
        const intro = cfg.current.introKey

        for (let i = 0; i < SLOT_COUNT; i++) {
            const s = slots.current[i]
            if (!s) continue
            let box = lerp4(s.boxFrom, s.boxTo, s.t)
            let edge = lerp4(s.edgeFrom, s.edgeTo, s.t)
            const ap = s.appear
            if (intro === "notch" && ap < 1) {
                const cx = box[0] + box[2] / 2
                const cy = box[1] + box[3] / 2
                box = lerp4([cx, cy, 0, 0], box, Math.max(0, ap))
                edge = lerp4([cx, cy, cx, cy], edge, Math.max(0, ap))
            }

            const m = maskRects.current[i]
            if (m) {
                m.setAttribute("x", String(edge[0] * w))
                m.setAttribute("y", String(edge[1] * h))
                m.setAttribute("width", String(Math.max(0, (edge[2] - edge[0]) * w)))
                m.setAttribute("height", String(Math.max(0, (edge[3] - edge[1]) * h)))
            }

            const el = tileEls.current[i]
            if (el) {
                el.style.transform = `translate3d(${box[0] * w}px, ${box[1] * h}px, 0)`
                el.style.width = `${Math.max(0, box[2] * w)}px`
                el.style.height = `${Math.max(0, box[3] * h)}px`
                el.style.opacity = String(Math.min(1, Math.max(0, ap)))
                const inner = innerEls.current[i]
                if (inner) inner.style.transform = `translate3d(0, ${(1 - Math.min(1, Math.max(0, ap))) * 10}px, 0)`
            }
        }

        // Curtain hole used by the "rise" intro
        const c = curtainRect.current
        if (c) {
            c.setAttribute("x", String(-w))
            c.setAttribute("y", String(-h))
            c.setAttribute("width", String(w * 3))
            c.setAttribute("height", String(Math.max(0, h * (1 + curtain.current))))
        }

        // Images
        const effect = cfg.current.mo.imageEffect
        const q = imgQ.current
        const cx = w / 2
        const cy = h / 2
        for (let k = 0; k < cfg.current.imageCount; k++) {
            const el = imageEls.current[k]
            if (!el) continue
            let o = 0
            let sc = 1
            let tx = 0
            if (k === curImg.current) {
                o = 1
                if (effect === "fade") o = q
                if (effect === "zoom") {
                    o = Math.min(1, q * 1.7)
                    sc = 1.16 - 0.16 * q
                }
                if (effect === "slide") tx = (1 - q) * w * 0.9
            } else if (k === prevImg.current && q < 1 && effect !== "none") {
                o = 1
                if (effect === "zoom") sc = 1 + 0.05 * q
                if (effect === "slide") tx = -q * w * 0.25
            }
            el.setAttribute("opacity", String(o))
            el.setAttribute("transform", `translate(${tx} 0) translate(${cx} ${cy}) scale(${sc}) translate(${-cx} ${-cy})`)
        }

        const f = fadeRoot.current
        if (f) f.style.opacity = String(fadeP.current)
    }, [])

    /* ---------------- slot setup ---------------- */

    const resetSlots = useCallback((stateIdx: number, shown: boolean) => {
        const st = PRESETS[cfg.current.preset][stateIdx]
        slots.current = st.map((r) => ({
            boxFrom: r,
            boxTo: r,
            edgeFrom: edgesOf(r),
            edgeTo: edgesOf(r),
            t: 1,
            appear: shown ? 1 : 0,
        }))
    }, [])

    /* ---------------- move to another step: shape state + image + tile content ---------------- */

    const goTo = useCallback(
        (next: number, instant = false) => {
            if (next === targetStep.current && slots.current.length) return
            targetStep.current = next
            const idx = mod(next, STATE_COUNT)
            const st = PRESETS[cfg.current.preset][idx]
            const { transition, stagger, imageDuration } = cfg.current.mo
            const snap = instant || cfg.current.reduce

            slots.current.forEach((s, i) => {
                s.boxFrom = lerp4(s.boxFrom, s.boxTo, s.t)
                s.edgeFrom = lerp4(s.edgeFrom, s.edgeTo, s.t)
                s.boxTo = st[i]
                s.edgeTo = edgesOf(st[i])
                s.t = 0
                anims.current[i]?.stop()
                if (snap) {
                    s.t = 1
                } else {
                    anims.current[i] = animate(0, 1, {
                        ...(transition || {}),
                        delay: i * (stagger || 0),
                        onUpdate: (v: number) => {
                            s.t = v
                            render()
                        },
                        onComplete: () => {
                            s.t = 1
                            render()
                        },
                    })
                }
            })

            // The slide (image + tile content) follows the step
            const count = cfg.current.imageCount
            const nextImg = mod(next, count)
            if (nextImg !== curImg.current) {
                imgAnim.current?.stop()
                prevImg.current = curImg.current
                curImg.current = nextImg
                imgQ.current = snap ? 1 : 0
                startTransition(() => setSlideIdx(nextImg))
                if (!snap) {
                    imgAnim.current = animate(0, 1, {
                        duration: imageDuration,
                        ease: EASE_OUT,
                        onUpdate: (v: number) => {
                            imgQ.current = v
                            render()
                        },
                        onComplete: () => {
                            imgQ.current = 1
                            prevImg.current = -1
                            render()
                        },
                    })
                } else {
                    prevImg.current = -1
                }
            }
            render()
        },
        [render]
    )

    /* ---------------- measure the card ---------------- */

    useEffect(() => {
        const wrap = wrapRef.current
        if (!wrap || typeof ResizeObserver === "undefined") return
        const measure = () => {
            const w = Math.round(wrap.clientWidth)
            const h = Math.round(wrap.clientHeight)
            if (w !== sizeRef.current.w || h !== sizeRef.current.h) {
                sizeRef.current = { w, h }
                startTransition(() => setSize({ w, h }))
            }
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(wrap)
        return () => ro.disconnect()
    }, [])

    /* ---------------- measure the natural size of every tile's content (for auto-fit) ---------------- */

    const contentKey = useMemo(
        () => JSON.stringify([slides.map((s) => s.tiles), ty.valueFont, ty.labelFont, ty.headingFont, ty.extrasFont, ty.uppercase]),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [slides, props.typeSettings]
    )

    useEffect(() => {
        const read = () => {
            const next: number[][][] = slides.map((_, si) =>
                Array.from({ length: TILE_COUNT }).map((__, ti) => {
                    const el = measureEls.current[si * TILE_COUNT + ti]
                    return el ? [el.offsetWidth, el.offsetHeight] : [0, 0]
                })
            )
            startTransition(() =>
                setNaturals((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
            )
        }
        read()
        let ro: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(read)
            measureEls.current.forEach((el) => el && ro!.observe(el))
        }
        // Fonts can arrive after first paint and change the natural size
        if (typeof document !== "undefined" && (document as any).fonts && (document as any).fonts.ready) {
            ;(document as any).fonts.ready.then(read).catch(() => {})
        }
        return () => ro?.disconnect()
    }, [contentKey, slides])

    // Scale of each tile's content: the card scale, shrunk further only if it would not fit
    // inside that tile's smallest cutout across the 3 shape states
    const scales = useMemo(() => {
        return slides.map((_, si) =>
            Array.from({ length: TILE_COUNT }).map((__, ti) => {
                const nat = naturals[si] && naturals[si][ti]
                if (!nat || !nat[0] || !nat[1] || !w || !h) return k
                let minW = Infinity
                let minH = Infinity
                PRESETS[preset].forEach((state) => {
                    const r = state[ti]
                    if (r[2] > 0 && r[3] > 0) {
                        minW = Math.min(minW, r[2] * w)
                        minH = Math.min(minH, r[3] * h)
                    }
                })
                const availW = Math.max(8, minW - 2 * padPx)
                const availH = Math.max(8, minH - 2 * padPx)
                const f = Math.min(1, availW / (nat[0] * k), availH / (nat[1] * k))
                return k * f
            })
        )
    }, [slides, naturals, preset, w, h, k, padPx])

    /* ---------------- (re)initialise when shape, intro mode or canvas preview changes ---------------- */

    useIsoLayoutEffect(() => {
        const step = isStatic ? clamp(Math.round(Number(shape.previewState) || 1), 1, 5) - 1 : introRan.current ? targetStep.current : 0
        const intro = cfg.current.introKey
        const hidden = !isStatic && !introRan.current && intro !== "none"

        anims.current.forEach((a) => a?.stop())
        targetStep.current = step
        resetSlots(mod(step, STATE_COUNT), !hidden || intro === "rise" ? true : false)
        if (hidden && intro === "rise") {
            slots.current.forEach((s) => (s.appear = 0))
            curtain.current = 1
        } else {
            curtain.current = 0
        }
        fadeP.current = hidden && intro === "fade" ? 0 : 1
        if (hidden && intro === "notch") slots.current.forEach((s) => (s.appear = 0))
        if (!hidden) slots.current.forEach((s) => (s.appear = 1))

        curImg.current = mod(step, slideCount)
        prevImg.current = -1
        imgQ.current = 1
        startTransition(() => setSlideIdx(curImg.current))
        render()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preset, isStatic, shape.previewState, introKey, slideCount, size.w, size.h])

    /* ---------------- intro (on appear) ---------------- */

    useEffect(() => {
        if (isStatic || !inView || introRan.current) return
        introRan.current = true
        const intro = cfg.current.introKey
        const { transition, stagger } = cfg.current.mo

        if (intro === "none") return

        if (intro === "rise") {
            animate(1, 0, {
                duration: 1.15,
                ease: EASE_OUT,
                onUpdate: (v: number) => {
                    curtain.current = v
                    render()
                },
                onComplete: () => {
                    curtain.current = 0
                    render()
                },
            })
        }
        if (intro === "fade") {
            animate(0, 1, {
                duration: 0.9,
                ease: "easeOut",
                onUpdate: (v: number) => {
                    fadeP.current = v
                    render()
                },
            })
        }
        slots.current.forEach((s, i) => {
            animate(0, 1, {
                ...(intro === "notch" ? transition || {} : { duration: 0.7, ease: EASE_OUT }),
                delay: (intro === "notch" ? 0.05 : 0.45) + i * (stagger || 0),
                onUpdate: (v: number) => {
                    s.appear = v
                    render()
                },
                onComplete: () => {
                    s.appear = 1
                    render()
                },
            })
        })
    }, [inView, isStatic, render])

    /* ---------------- auto loop ---------------- */

    useEffect(() => {
        if (isStatic || reduce || mo.trigger !== "auto" || !inView) return
        const ms = Math.max(0.8, mo.interval || 3) * 1000
        const id = window.setInterval(() => goTo(targetStep.current + 1), ms)
        return () => window.clearInterval(id)
    }, [isStatic, reduce, mo.trigger, mo.interval, inView, goTo])

    /* ---------------- pointer triggers ---------------- */

    const onEnter = () => {
        if (isStatic) return
        if (mo.trigger === "hover") goTo(1)
        if (mo.trigger === "cycleHover") goTo(targetStep.current + 1)
    }
    const onLeave = () => {
        if (isStatic) return
        if (mo.trigger === "hover") goTo(0)
    }
    const onClick = () => {
        if (isStatic) return
        if (mo.trigger === "click") goTo(targetStep.current + 1)
    }

    /* ---------------- layers ---------------- */

    const order = useMemo(() => {
        const idx = slides.map((_, i) => i)
        return idx.sort((a, b) => Number(a === slideIdx) - Number(b === slideIdx))
    }, [slides, slideIdx])

    const upper = ty.uppercase ? "uppercase" : "none"

    // measure = true renders the tile at its natural size, without the flexible logo strip
    const renderTile = (t: TileContent, measure: boolean) => {
        const kind = t.kind || "stat"
        if (kind === "empty") return null
        if (kind === "brand") {
            return (
                <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, width: measure ? "auto" : "100%" }}>
                    <span
                        style={{
                            ...ty.headingFont,
                            color: col.textColor,
                            textTransform: upper,
                            whiteSpace: "normal",
                            maxWidth: "6em",
                            flexShrink: 0,
                        }}
                    >
                        {t.heading}
                    </span>
                    {t.showBadge !== false && (
                        <div style={{ position: "relative", width: 30, height: 30, flexShrink: 0 }}>
                            <svg width={30} height={30} viewBox="0 0 30 30" style={{ display: "block" }} aria-hidden="true">
                                <circle cx={15} cy={15} r={14} fill="none" stroke={col.mutedColor} strokeOpacity={0.55} />
                                <path d="M15 15 L15 1 A14 14 0 0 1 29 15 Z" fill={col.mutedColor} fillOpacity={0.35} />
                                {!(t.badgeImage && t.badgeImage.src) && (
                                    <path d="M15 9.5v11M9.9 12.2l10.2 5.6M20.1 12.2L9.9 17.8" stroke={col.textColor} strokeWidth={1.4} strokeLinecap="round" />
                                )}
                            </svg>
                            {t.badgeImage && t.badgeImage.src && (
                                <img
                                    src={t.badgeImage.src}
                                    alt={t.badgeImage.alt || ""}
                                    draggable={false}
                                    style={{
                                        position: "absolute",
                                        left: "50%",
                                        top: "50%",
                                        width: t.badgeIconSize ?? 16,
                                        height: t.badgeIconSize ?? 16,
                                        transform: "translate(-50%, -50%)",
                                        objectFit: "contain",
                                        display: "block",
                                    }}
                                />
                            )}
                        </div>
                    )}
                    {!measure && t.extras && (
                        <span
                            style={{
                                ...ty.extrasFont,
                                color: col.mutedColor,
                                whiteSpace: "pre",
                                overflow: "hidden",
                                minWidth: 0,
                                flex: "1 1 0",
                                WebkitMaskImage: "linear-gradient(90deg, #000 55%, transparent 100%)",
                                maskImage: "linear-gradient(90deg, #000 55%, transparent 100%)",
                            }}
                        >
                            {t.extras}
                        </span>
                    )}
                </div>
            )
        }
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <div style={{ ...ty.valueFont, color: col.textColor, whiteSpace: "nowrap", display: "flex", alignItems: "baseline" }}>
                    {t.prefix && <span style={{ color: col.mutedColor, fontSize: "0.7em", marginRight: "0.06em" }}>{t.prefix}</span>}
                    <span>{t.value}</span>
                </div>
                <span style={{ ...ty.labelFont, color: col.textColor, textTransform: upper, whiteSpace: "nowrap" }}>{t.label}</span>
            </div>
        )
    }

    const current = slides[Math.min(slideIdx, slideCount - 1)]
    const stagger = mo.stagger || 0

    return (
        <div
            ref={wrapRef}
            role="group"
            onPointerEnter={onEnter}
            onPointerLeave={onLeave}
            onClick={onClick}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                // If the parent has no fixed height, the card keeps its proportions instead of collapsing
                aspectRatio: `${DESIGN_W} / ${DESIGN_H}`,
                overflow: "hidden",
                cursor: mo.trigger === "click" ? "pointer" : "default",
                WebkitTapHighlightColor: "transparent",
            }}
        >
            {w > 0 && h > 0 && (
                <svg
                    ref={fadeRoot}
                    width={w}
                    height={h}
                    viewBox={`0 0 ${w} ${h}`}
                    aria-hidden="true"
                    style={{ position: "absolute", inset: 0, display: "block", overflow: "hidden" }}
                >
                    <defs>
                        <filter
                            id={filterId}
                            filterUnits="userSpaceOnUse"
                            x={-pad}
                            y={-pad}
                            width={w + pad * 2}
                            height={h + pad * 2}
                            colorInterpolationFilters="sRGB"
                        >
                            <feGaussianBlur stdDeviation={sigma} />
                            <feComponentTransfer>
                                <feFuncR type="linear" slope={THRESHOLD_SLOPE} intercept={(1 - THRESHOLD_SLOPE) / 2} />
                                <feFuncG type="linear" slope={THRESHOLD_SLOPE} intercept={(1 - THRESHOLD_SLOPE) / 2} />
                                <feFuncB type="linear" slope={THRESHOLD_SLOPE} intercept={(1 - THRESHOLD_SLOPE) / 2} />
                                <feFuncA type="linear" slope={THRESHOLD_SLOPE} intercept={(1 - THRESHOLD_SLOPE) / 2} />
                            </feComponentTransfer>
                        </filter>
                        <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
                            <g filter={`url(#${filterId})`}>
                                <rect x={0} y={0} width={w} height={h} fill="#fff" />
                                {Array.from({ length: SLOT_COUNT }).map((_, i) => (
                                    <rect key={i} ref={(el) => { maskRects.current[i] = el }} fill="#000" />
                                ))}
                                <rect ref={curtainRect} fill="#000" />
                            </g>
                        </mask>
                    </defs>
                    <g mask={`url(#${maskId})`}>
                        {order.map((idx) => (
                            <image
                                key={idx}
                                ref={(el) => { imageEls.current[idx] = el }}
                                href={slides[idx].src}
                                x={0}
                                y={0}
                                width={w}
                                height={h}
                                preserveAspectRatio="xMidYMid slice"
                            />
                        ))}
                        {col.overlay && <rect x={0} y={0} width={w} height={h} fill={col.overlay} />}
                    </g>
                </svg>
            )}

            {/* Tiles that sit inside the cutouts. Content changes with the slide. */}
            {w > 0 &&
                Array.from({ length: TILE_COUNT }).map((_, i) => {
                    const sc = (scales[slideIdx] && scales[slideIdx][i]) || k
                    return (
                        <div
                            key={i}
                            ref={(el) => { tileEls.current[i] = el }}
                            style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                boxSizing: "border-box",
                                padding: padPx,
                                display: "flex",
                                alignItems: "center",
                                overflow: "hidden",
                                background: col.tileFill || "transparent",
                                borderRadius: radiusEff,
                                opacity: 0,
                                willChange: "transform, width, height",
                            }}
                        >
                            <div
                                ref={(el) => { innerEls.current[i] = el }}
                                style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", width: "100%", minWidth: 0 }}
                            >
                                <AnimatePresence initial={false}>
                                    <motion.div
                                        key={slideIdx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                            transition: { duration: reduce ? 0 : 0.55, delay: reduce ? 0 : i * stagger + 0.1, ease: EASE_OUT },
                                        }}
                                        exit={{
                                            opacity: 0,
                                            y: -10,
                                            transition: { duration: reduce ? 0 : 0.28, delay: reduce ? 0 : i * stagger * 0.5, ease: "easeIn" },
                                        }}
                                        style={{
                                            gridArea: "1 / 1",
                                            width: `${100 / sc}%`,
                                            originX: 0,
                                            originY: 0.5,
                                            scale: sc,
                                        }}
                                    >
                                        {renderTile(current.tiles[i], false)}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    )
                })}

            {/* Hidden: natural size of every tile's content, used to fit it inside its cutout */}
            <div
                aria-hidden="true"
                style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, overflow: "hidden", visibility: "hidden", pointerEvents: "none" }}
            >
                {slides.map((sl, si) =>
                    sl.tiles.map((t, ti) => (
                        <div
                            key={`${si}-${ti}`}
                            ref={(el) => { measureEls.current[si * TILE_COUNT + ti] = el }}
                            style={{ position: "absolute", left: 0, top: 0, width: "max-content" }}
                        >
                            {renderTile(t, true)}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

ShapeTransitionCard.displayName = "Shape Transition Card"

/* ----------------------------------------------------------------------------
 * Property controls, grouped so each section does one job:
 *   Slides              one image + the content of 3 tiles, per slide
 *   Shape               the silhouette, its corner radius and tile padding
 *   Motion              what triggers the transition and how it moves
 *   Colors              text, muted text, tile fill and image tint
 *   Typography          fonts for numbers, captions, heading and logos
 * ------------------------------------------------------------------------- */

const TILE_CONTROLS: any = {
    kind: {
        type: ControlType.Enum,
        title: "Type",
        options: ["stat", "brand", "empty"],
        optionTitles: ["Stat (number + caption)", "Brand (heading + logos)", "Empty (shape only)"],
        defaultValue: "stat",
    },
    prefix: { type: ControlType.String, title: "Prefix", defaultValue: "+", hidden: (p: any) => p.kind !== "stat" },
    value: { type: ControlType.String, title: "Number", defaultValue: "1K", hidden: (p: any) => p.kind !== "stat" },
    label: { type: ControlType.String, title: "Caption", defaultValue: "Artboards", hidden: (p: any) => p.kind !== "stat" },
    heading: { type: ControlType.String, title: "Heading", defaultValue: "Pro's Choice", hidden: (p: any) => p.kind !== "brand" },
    extras: { type: ControlType.String, title: "Logos", defaultValue: "Forbes   intel   citi", hidden: (p: any) => p.kind !== "brand" },
    showBadge: { type: ControlType.Boolean, title: "Badge", defaultValue: true, hidden: (p: any) => p.kind !== "brand" },
    badgeImage: {
        type: ControlType.ResponsiveImage,
        title: "Badge Icon",
        description: "Replaces the asterisk inside the glass bubble. Leave empty for the default.",
        hidden: (p: any) => p.kind !== "brand" || !p.showBadge,
    },
    badgeIconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 16,
        min: 8,
        max: 26,
        step: 1,
        unit: "px",
        hidden: (p: any) => p.kind !== "brand" || !p.showBadge || !p.badgeImage,
    },
}

const tileControl = (title: string): any => ({
    type: ControlType.Object,
    title,
    controls: TILE_CONTROLS,
})

addPropertyControls(ShapeTransitionCard, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        description: "Each slide = one image + the content of the 3 tiles. They change together on every transition.",
        maxCount: 5,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                tile1: tileControl("Tile 1"),
                tile2: tileControl("Tile 2"),
                tile3: tileControl("Tile 3"),
            },
        },
        defaultValue: DEFAULT_SLIDES as any,
    },
    shapeSettings: {
        type: ControlType.Object,
        title: "Shape",
        icon: "object",
        buttonTitle: "Shape",
        controls: {
            preset: {
                type: ControlType.Enum,
                title: "Shape",
                options: ["staggered", "corners", "steps", "strip", "windows"],
                optionTitles: ["Staggered (video)", "Corners", "Steps", "Strip", "Windows"],
                defaultValue: "staggered",
            },
            radius: { type: ControlType.Number, title: "Corner Radius", defaultValue: 16, min: 0, max: 40, step: 1, unit: "px" },
            tilePadding: { type: ControlType.Number, title: "Tile Padding", defaultValue: 14, min: 0, max: 40, step: 1, unit: "px" },
            previewState: {
                type: ControlType.Enum,
                title: "Canvas Preview",
                description: "Which step shows on the Framer canvas (shape state + slide)",
                options: [1, 2, 3, 4, 5],
                optionTitles: ["1", "2", "3", "4", "5"],
                displaySegmentedControl: true,
                defaultValue: 1,
            },
        },
        defaultValue: { preset: "staggered", radius: 16, tilePadding: 14, previewState: 1 },
    },
    motionSettings: {
        type: ControlType.Object,
        title: "Motion",
        icon: "interaction",
        buttonTitle: "Motion",
        controls: {
            intro: {
                type: ControlType.Enum,
                title: "On Appear",
                options: ["rise", "notch", "fade", "none"],
                optionTitles: ["Rise from bottom", "Notches grow in", "Fade in", "None"],
                defaultValue: "rise",
            },
            trigger: {
                type: ControlType.Enum,
                title: "Shape Change",
                options: ["auto", "hover", "cycleHover", "click", "none"],
                optionTitles: ["Auto loop", "Hover (toggle)", "Hover (next shape)", "Click (next shape)", "Off"],
                defaultValue: "auto",
            },
            interval: {
                type: ControlType.Number,
                title: "Loop Every",
                defaultValue: 3,
                min: 1,
                max: 10,
                step: 0.5,
                unit: "s",
                hidden: (p: any) => p.trigger !== "auto",
            },
            transition: {
                type: ControlType.Transition,
                title: "Morph Easing",
                defaultValue: { type: "spring", duration: 0.9, bounce: 0.12 },
            },
            stagger: { type: ControlType.Number, title: "Tile Stagger", defaultValue: 0.08, min: 0, max: 0.5, step: 0.01, unit: "s" },
            imageEffect: {
                type: ControlType.Enum,
                title: "Image Change",
                options: ["zoom", "fade", "slide", "none"],
                optionTitles: ["Zoom", "Crossfade", "Slide", "None"],
                defaultValue: "zoom",
            },
            imageDuration: { type: ControlType.Number, title: "Image Time", defaultValue: 0.9, min: 0.2, max: 2, step: 0.05, unit: "s" },
        },
        defaultValue: {
            intro: "rise",
            trigger: "auto",
            interval: 3,
            transition: { type: "spring", duration: 0.9, bounce: 0.12 },
            stagger: 0.08,
            imageEffect: "zoom",
            imageDuration: 0.9,
        },
    },
    colorSettings: {
        type: ControlType.Object,
        title: "Colors",
        icon: "color",
        buttonTitle: "Colors",
        controls: {
            textColor: { type: ControlType.Color, title: "Text", defaultValue: "#1B1B20" },
            mutedColor: { type: ControlType.Color, title: "Muted Text", defaultValue: "#B4B4BC" },
            tileFill: { type: ControlType.Color, title: "Tile Fill", optional: true },
            overlay: { type: ControlType.Color, title: "Image Tint", optional: true },
        },
        defaultValue: { textColor: "#1B1B20", mutedColor: "#B4B4BC" },
    },
    typeSettings: {
        type: ControlType.Object,
        title: "Typography",
        icon: "object",
        buttonTitle: "Typography",
        controls: {
            valueFont: {
                type: ControlType.Font,
                title: "Numbers",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: "34px", variant: "Light", letterSpacing: "-0.04em", lineHeight: "1em" },
            },
            labelFont: {
                type: ControlType.Font,
                title: "Captions",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: "9px", variant: "Regular", letterSpacing: "0.04em", lineHeight: "1.2em" },
            },
            headingFont: {
                type: ControlType.Font,
                title: "Heading",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: "20px", variant: "Light", letterSpacing: "-0.01em", lineHeight: "1.05em" },
            },
            extrasFont: {
                type: ControlType.Font,
                title: "Logos",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: "11px", variant: "Regular", letterSpacing: "0em", lineHeight: "1em" },
            },
            uppercase: { type: ControlType.Boolean, title: "Uppercase", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
        },
        defaultValue: {
            valueFont: { fontSize: "34px", variant: "Light", letterSpacing: "-0.04em", lineHeight: "1em" },
            labelFont: { fontSize: "9px", variant: "Regular", letterSpacing: "0.04em", lineHeight: "1.2em" },
            headingFont: { fontSize: "20px", variant: "Light", letterSpacing: "-0.01em", lineHeight: "1.05em" },
            extrasFont: { fontSize: "11px", variant: "Regular", letterSpacing: "0em", lineHeight: "1em" },
            uppercase: true,
        },
    },
})
