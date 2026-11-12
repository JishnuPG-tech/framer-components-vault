// Ferrofluids
//
// Named after the liquid that takes its shape from a magnetic field, which is
// what this does twice over: a set of logos that answer to the cursor, and
// behind them a headline whose words melt from one into the next.
//
// Move the pointer near the field and everything on the card answers it. The
// closest marks drift toward the cursor and elongate along the line pointing at
// it, holding that stretch while you rest and springing back when you leave.
// The headline is in the same field: its letters gather toward the cursor and,
// because they share one threshold filter, they touch, neck and weld into a
// single mass -- then unpeel back into letterforms as you move away. Left alone,
// the words go on melting from one into the next.
//
// Getting started
//
//   1. Replace the placeholder marks in Logos. Each one carries its own
//      position, optical size and mass.
//   2. Marks ship in grayscale for a light card. On a dark background, set
//      Logo Color to Invert and darken Fill and Word Color to match.
//   3. Turn Card off to remove the frame and run the field straight on your
//      own background.
//   4. For a right-to-left script, set Word Pull to 0: the letter effect splits
//      the word per character, which breaks contextual letter joining.
//
// Every size here is a percentage of the component's own width, so the whole
// composition scales as one piece at any frame size and across breakpoints.
// Motion is disabled automatically for visitors who ask for reduced motion; the
// composition stays in place and stays legible.

import {
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
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


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LogoImage {
    src?: string
    srcSet?: string
    alt?: string
}

interface LogoItem {
    /** Alt text for this mark. */
    name: string
    image: LogoImage
    /**
     * Optical size. Two marks set to the same height rarely look the same size:
     * a dense, tightly drawn mark reads larger than an open script, and marks
     * with descenders lose height to empty space. Use this to even them out.
     */
    scale: number
    /** Position across the component, measured from the centre of the mark. */
    x: number
    y: number
    /**
     * How strongly this mark answers the cursor. Vary it across the set so the
     * marks read as separate objects rather than one sheet moving together.
     */
    mass: number
}

interface PhysicsConfig {
    /** How close the cursor comes, in pixels, before a mark responds. */
    radius: number
    /** How far a mark travels toward the cursor, as a fraction of the gap. */
    pullStrength: number
    /** How quickly a mark settles: the fraction of the gap closed each frame. */
    ease: number
    /** How much a mark stretches for a given speed. */
    squash: number
    /** Upper limit on stretch, so a fast flick cannot flatten a mark. */
    maxSquash: number
    /** How far a mark elongates toward the cursor. 0 turns it off. */
    spike: number
    /** How eagerly that elongation chases the cursor. */
    spikeEase: number
    /** How far it overshoots before settling. 0 is a plain ease. */
    spikeSpring: number
    /** Idle movement in pixels while the cursor is away. */
    floatAmplitude: number
    /** Rate of that idle movement, in radians per second. */
    floatSpeed: number
}

interface FontValue {
    fontFamily?: string
    fontWeight?: number | string
    fontStyle?: string
    letterSpacing?: string | number
    lineHeight?: string | number
    textAlign?: CSSProperties["textAlign"]
}

interface BorderValue {
    borderColor?: string
    borderStyle?: string
    borderWidth?: number
    borderTopWidth?: number
    borderLeftWidth?: number
    borderRightWidth?: number
    borderBottomWidth?: number
}

interface FerrofluidsProps {
    logos?: LogoItem[]
    logoHeight?: number
    logoColor?: "none" | "grayscale" | "invert"

    words?: string[]
    headingLabel?: string
    holdDuration?: number
    headlineSize?: number
    headlineColor?: string
    headlineFont?: FontValue
    morphBlur?: number
    wordPull?: number

    physics?: PhysicsConfig

    showCard?: boolean
    cardFill?: string
    cardBorder?: BorderValue
    cardRadius?: string
    cardShadow?: string

    style?: CSSProperties
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

/**
 * Six placeholder marks. Replace them in the Logos control; the field takes
 * however many entries it is given.
 *
 * These are hosted rather than inlined. An earlier version embedded each SVG in
 * this file as a data URI, which made the component wholly self-contained but
 * put ninety-odd kilobytes of path data between the header and the first line
 * of real code. Anyone opening the file met the blob before the component.
 *
 * The trade is honest: a hosted URL can 404 if the asset is removed from the
 * project, where an inlined one could not. Every entry falls back by index to
 * this list anyway, so a missing image degrades to a gap rather than a crash.
 */
const PLACEHOLDER_LOGOS: LogoItem[] = [
    {
        name: "Logo 1",
        image: {
            src: "https://framerusercontent.com/images/spo8txrssei4sQwp57sMqSd4CY.svg",
            alt: "Logo 1",
        },
        scale: 0.79,
        x: 31,
        y: 28,
        mass: 1.15,
    },
    {
        name: "Logo 2",
        image: {
            src: "https://framerusercontent.com/images/oHBb5rCbVrXdGimGVz170kUXLQI.svg",
            alt: "Logo 2",
        },
        scale: 1.02,
        x: 63,
        y: 32,
        mass: 0.9,
    },
    {
        name: "Logo 3",
        image: {
            src: "https://framerusercontent.com/images/lwDBtqkw31U9ZzHsfQgc2MU9GiQ.svg",
            alt: "Logo 3",
        },
        scale: 0.95,
        x: 25,
        y: 49,
        mass: 0.82,
    },
    {
        name: "Logo 4",
        image: {
            src: "https://framerusercontent.com/images/3wbldBBQ8peGVSJDGb94yqmiFg.svg",
            alt: "Logo 4",
        },
        scale: 0.79,
        x: 76,
        y: 50,
        mass: 0.95,
    },
    {
        name: "Logo 5",
        image: {
            src: "https://framerusercontent.com/images/JZou6ZXwukM1ns9vFrqFFcmV8.svg",
            alt: "Logo 5",
        },
        scale: 0.95,
        x: 44,
        y: 66,
        mass: 1.25,
    },
    {
        name: "Logo 6",
        image: {
            src: "https://framerusercontent.com/images/te8V17ObYvOTtG6VxJCECY94XVo.svg",
            alt: "Logo 6",
        },
        scale: 0.91,
        x: 69,
        y: 74,
        mass: 1.1,
    },
]

const DEFAULT_WORDS = ["TRUSTED", "CHOSEN", "BACKED"]

const DEFAULT_PHYSICS: PhysicsConfig = {
    // Generous, because the marks are small and spread apart. A tight radius
    // makes the field feel like six separate hover targets rather than one
    // continuous surface.
    radius: 190,
    // Restrained. Neighbouring marks overlap, and a strong pull sends them into
    // one another.
    pullStrength: 0.28,
    // Settles in roughly a quarter of a second. Much slower feels broken; much
    // faster and the stretch never has time to show.
    ease: 0.13,
    squash: 0.016,
    // Stretch is judged relative to the size of the mark on screen. Beyond this
    // it stops reading as elastic.
    maxSquash: 0.11,
    // The field-line stretch. Real ferrofluid spikes ALONG the field, not just
    // toward it, and unlike the stretch above this one persists while the
    // cursor rests: the mark looks magnetised rather than merely shoved.
    spike: 0.11,
    spikeEase: 0.14,
    spikeSpring: 0.62,
    floatAmplitude: 5,
    // A fifteen-second cycle. Slow enough that you notice it only once you stop
    // looking directly at it.
    floatSpeed: 0.4,
}

/** How each Logo Color option is rendered. */
const MARK_FILTERS: Record<string, string | undefined> = {
    none: undefined,
    grayscale: "grayscale(1) contrast(1.08)",
    invert: "grayscale(1) contrast(1.08) invert(1) brightness(0.88)",
}

/** Used when no font is chosen in the panel. */
const SYSTEM_STACK =
    "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, Helvetica, Arial, sans-serif"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** The point a fraction `t` of the way from `a` to `b`. */
function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
}

/** Live position of a single mark. One of these exists per logo. */
interface MarkState {
    pos: { x: number; y: number }
    prev: { x: number; y: number }
    restX: number
    restY: number
    /** Offset that staggers the idle drift, so the marks never pulse in unison. */
    phase: number
    /** Field-line stretch, carried as a vector so direction eases too. */
    spike: { x: number; y: number }
    spikeV: { x: number; y: number }
}

/**
 * FERROFLUIDS
 *
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 500
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function Ferrofluids(props: FerrofluidsProps) {
    const {
        logos = PLACEHOLDER_LOGOS,
        logoHeight = 6.9,
        logoColor = "grayscale",
        words = DEFAULT_WORDS,
        headingLabel = "Trusted by",
        holdDuration = 2600,
        headlineSize = 19,
        headlineColor = "#c4c4c4",
        headlineFont = {},
        morphBlur = 2.4,
        wordPull = 0.13,
        physics = DEFAULT_PHYSICS,
        showCard = true,
        cardFill = "#efefef",
        cardBorder,
        cardRadius = "20px",
        cardShadow = "0 30px 70px -30px rgba(0, 0, 0, 0.5)",
        style,
    } = props

    // Nothing animates on the canvas. What you see there is the composition at
    // rest, which is the useful thing to design against. Motion begins in
    // Preview and on the published site.
    const isStatic = useIsStaticRenderer()

    // A unique suffix for this instance. It keeps the filter and the animation
    // class names separate, so two Ferrofluids can share a page safely.
    const rawId = useId()
    const uid = rawId.replace(/[^a-zA-Z0-9]/g, "")
    const gooId = `ff-goo-${uid}`
    const headingId = `ff-heading-${uid}`

    const cardRef = useRef<HTMLElement | null>(null)
    // A single animation loop drives every mark. Six independent components
    // would mean six loops and six sets of listeners for what is really one
    // field following one cursor.
    const slotRefs = useRef<Array<HTMLLIElement | null>>([])
    const markRefs = useRef<Array<HTMLDivElement | null>>([])

    // Positions are held outside React. They change with every frame and
    // nothing on screen is rebuilt from them: the only thing they produce is a
    // transform written straight to each element.
    const pointer = useRef({ x: 0, y: 0, inside: false })
    const marks = useRef<MarkState[]>([])
    const frameRef = useRef<number | null>(null)

    // Letter state is keyed to the element itself rather than to an index.
    // The words remount every cycle, and a Map keyed by element means a new
    // word arriving never disturbs the one still leaving.
    const letters = useRef(
        new WeakMap<
            Element,
            { restX: number; restY: number; pos: { x: number; y: number } }
        >()
    )
    const cardW = useRef(1000)
    const wordPullRef = useRef(wordPull)
    wordPullRef.current = wordPull

    // The same width again, but as state rather than a ref, because the goo
    // filter has to be re-rendered when it changes. The loop reads cardW every
    // frame and must not trigger React; this one changes only on resize.
    const [cardPx, setCardPx] = useState(1000)

    // Settings the loop reads each frame. Holding them this way means adjusting
    // a slider in the panel retunes the field immediately, rather than
    // restarting the animation.
    const cfgRef = useRef<PhysicsConfig>(DEFAULT_PHYSICS)
    cfgRef.current = { ...DEFAULT_PHYSICS, ...physics }
    const massRef = useRef<number[]>([])
    massRef.current = logos.map((logo) => logo?.mass ?? 1)

    // How hard the goo filter blurs, in pixels.
    //
    // This has to be computed rather than fixed. An SVG filter takes its
    // stdDeviation in user-space pixels, and there is no unit that tracks a
    // container query -- so a constant blur stays put while the type it is
    // welding scales with the card. Past about half the design width the blur
    // is wide relative to the letterforms, the alpha threshold swallows them,
    // and the headline degrades into blobs.
    //
    // Tying it to the rendered cap height instead keeps the ratio of blur to
    // glyph fixed, which is the thing the effect actually depends on. The
    // constant is the ratio the effect was tuned at: a 1000px card, 19cqw type,
    // stdDeviation 10. The floor keeps the weld alive at very small sizes,
    // where a sub-pixel blur would stop merging anything at all.
    const headlinePx = (headlineSize / 100) * cardPx
    const gooBlur = Math.max(1.6, headlinePx * (10 / 190))

    const wordList = useMemo(() => {
        const cleaned = (words ?? []).filter(
            (word) => typeof word === "string" && word.length > 0
        )
        return cleaned.length > 0 ? cleaned : DEFAULT_WORDS
    }, [words])

    // Which word is showing, and which one is leaving. The two are kept
    // together deliberately: as separate values they could fall out of step and
    // the wrong word would animate away.
    const [{ current, previous }, setCycle] = useState<{
        current: number
        previous: number | null
    }>({ current: 0, previous: null })

    // --- Viewport gating ---------------------------------------------------
    // Nothing below should run while the component is off screen. The field is
    // a per-frame integrator with a set of global listeners behind it, and the
    // headline cycles on a timer that rebuilds its letters on every change --
    // all of it invisible once the component has scrolled away, and all of it
    // paid for several times over on a page carrying more than one instance.
    //
    // The margin starts it a little before it arrives, so the marks are already
    // measured and at rest by the time anyone can see them, rather than
    // visibly settling in front of the reader.
    const [inView, setInView] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined") return
        const card = cardRef.current
        if (!card) return

        // With no IntersectionObserver there is nothing to gate on, so run
        // unconditionally rather than never.
        if (typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) setInView(entry.isIntersecting)
            },
            { rootMargin: "200px" }
        )
        observer.observe(card)
        return () => observer.disconnect()
    }, [])

    // --- Word cycle --------------------------------------------------------
    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return
        // Off screen the cycle is paused rather than run and ignored: every
        // change sets state and rebuilds the headline's letters.
        if (!inView) return
        // With reduced motion the headline is simply a word. No cycle, no melt.
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return
        if (wordList.length < 2) return

        const id = window.setInterval(
            () => {
                setCycle((c) => ({
                    current: (c.current + 1) % wordList.length,
                    previous: c.current,
                }))
            },
            Math.max(holdDuration, 200)
        )

        return () => window.clearInterval(id)
    }, [isStatic, inView, wordList, holdDuration])

    // Shortening the word list can leave the cycle pointing past the end.
    useEffect(() => {
        setCycle((c) =>
            c.current < wordList.length ? c : { current: 0, previous: null }
        )
    }, [wordList])

    // --- Live width ----------------------------------------------------
    // gooBlur (below) is computed from cardPx, and has to track the card's
    // real rendered width wherever the component appears -- including the
    // canvas, where it is dragged to new sizes constantly but the pointer
    // field below never runs. Measuring width inside that field's effect
    // left cardPx frozen at its initial 1000 on canvas, since that effect
    // returns immediately for a static renderer: the blur stayed tuned for
    // a ~1000px card while the frame shrank underneath it, and eventually
    // swallowed the much smaller type into a blob instead of melting it.
    // This effect has no such early return, so the measurement -- and the
    // blur it drives -- stays correct at any size, static or not.
    useEffect(() => {
        if (typeof window === "undefined") return
        const card = cardRef.current
        if (!card) return

        const measureWidth = (): void => {
            const width = card.getBoundingClientRect().width || 1000
            cardW.current = width
            // Rounded before comparing so a sub-pixel reflow cannot bounce
            // the component between two states while the observer watches.
            setCardPx((prev) =>
                Math.round(prev) === Math.round(width) ? prev : width
            )
        }
        measureWidth()

        const observer =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(measureWidth)
                : null
        observer?.observe(card)
        window.addEventListener("resize", measureWidth, { passive: true })

        return () => {
            observer?.disconnect()
            window.removeEventListener("resize", measureWidth)
        }
    }, [])

    // --- Magnetic field ----------------------------------------------------
    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return
        // Everything below -- the frame loop, the global listeners and the
        // resize observer -- is created on entering the viewport and torn down
        // again on leaving, so an off-screen instance costs nothing.
        if (!inView) return
        const card = cardRef.current
        if (!card) return

        // Reduced motion is honoured before anything starts. The marks stay
        // exactly where the layout placed them.
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return

        marks.current = logos.map((_, i) => ({
            pos: { x: 0, y: 0 },
            prev: { x: 0, y: 0 },
            restX: 0,
            restY: 0,
            // An uneven stride, so opposite marks never fall into step.
            phase: i * 2.399,
            spike: { x: 0, y: 0 },
            spikeV: { x: 0, y: 0 },
        }))

        // Resting positions are read from the slots rather than the marks. A
        // slot never moves, so its position is a stable reference; measuring a
        // mark would feed its own displacement back into its target. The
        // measurement is cached, because taking it every frame would cost the
        // browser a full layout pass six times over.
        const measure = (): void => {
            for (let i = 0; i < marks.current.length; i++) {
                const slot = slotRefs.current[i]
                if (!slot) continue
                const rect = slot.getBoundingClientRect()
                marks.current[i].restX = rect.left + rect.width / 2
                marks.current[i].restY = rect.top + rect.height / 2
            }
        }
        measure()

        const onPointerMove = (event: MouseEvent): void => {
            pointer.current.x = event.clientX
            pointer.current.y = event.clientY
            pointer.current.inside = true
        }
        const onPointerLeave = (): void => {
            pointer.current.inside = false
        }

        const tick = (now: number): void => {
            const cfg = cfgRef.current
            const p = pointer.current
            const t = now / 1000

            for (let i = 0; i < marks.current.length; i++) {
                const mark = marks.current[i]
                const node = markRefs.current[i]
                if (!node) continue

                const mass = massRef.current[i] ?? 1
                const dx = p.x - mark.restX
                const dy = p.y - mark.restY
                const dist = Math.hypot(dx, dy)

                let targetX = 0
                let targetY = 0

                if (p.inside && dist < cfg.radius) {
                    // The pull is strongest at the centre and fades to nothing
                    // exactly at the edge of the radius. Without that fade a
                    // mark would jump the moment the cursor crossed the line;
                    // with it, and with the radii overlapping, the whole field
                    // responds as one surface.
                    const strength = 1 - dist / cfg.radius
                    targetX = dx * strength * cfg.pullStrength * mass
                    targetY = dy * strength * cfg.pullStrength * mass
                }
                // Otherwise the target is the resting position, and the same
                // easing below carries the mark home. Returning needs no
                // separate branch.

                // Each frame covers a fraction of the remaining distance rather
                // than a fixed step: long strides far away, shorter ones on
                // approach. That is what makes the movement feel elastic, and
                // it keeps every mark slightly behind its target, which is the
                // lag the stretch below is built on.
                mark.pos.x = lerp(mark.pos.x, targetX, cfg.ease)
                mark.pos.y = lerp(mark.pos.y, targetY, cfg.ease)

                // Idle drift is taken from the clock and added at the last
                // moment. Keeping it out of the stored position means it never
                // counts as speed, so a resting mark does not sit there
                // stretching itself.
                const driftX =
                    Math.sin(t * cfg.floatSpeed + mark.phase) *
                    cfg.floatAmplitude
                const driftY =
                    Math.cos(t * cfg.floatSpeed * 0.78 + mark.phase * 1.4) *
                    cfg.floatAmplitude

                // The stretch follows the mark's own speed, not the cursor's.
                // It therefore always matches movement you can see, and it
                // relaxes by itself: speed reaches zero at rest and the shape
                // returns to normal with no separate release.
                const vx = mark.pos.x - mark.prev.x
                const vy = mark.pos.y - mark.prev.y
                const speed = Math.hypot(vx, vy)

                let transform = `translate3d(${(mark.pos.x + driftX).toFixed(
                    2
                )}px, ${(mark.pos.y + driftY).toFixed(2)}px, 0)`

                // Field-line spike. The stretch is carried as a VECTOR rather
                // than as an angle plus a magnitude, and that choice is visible:
                // easing a magnitude alone still lets the axis snap round when
                // the cursor crosses near a mark's centre, and easing an angle
                // has to cope with the wrap at +/-PI. One vector solves both --
                // it swells, turns and relaxes smoothly, and passes through zero
                // cleanly instead of spinning.
                //
                // It is driven by a spring, not an ease. Easing only decelerates
                // into place, which still reads as a value being animated; a
                // spring gives the stretch mass, so it runs a little past its
                // target and settles back. Damping stays below 1, so it always
                // comes to rest.
                if (cfg.spike > 0) {
                    let tsx = 0
                    let tsy = 0
                    if (p.inside && dist < cfg.radius && dist > 1) {
                        const amt = (1 - dist / cfg.radius) * cfg.spike * mass
                        tsx = (dx / dist) * amt
                        tsy = (dy / dist) * amt
                    }
                    const damp = 0.55 + cfg.spikeSpring * 0.4
                    mark.spikeV.x =
                        (mark.spikeV.x + (tsx - mark.spike.x) * cfg.spikeEase) *
                        damp
                    mark.spikeV.y =
                        (mark.spikeV.y + (tsy - mark.spike.y) * cfg.spikeEase) *
                        damp
                    mark.spike.x += mark.spikeV.x
                    mark.spike.y += mark.spikeV.y
                    const sp = Math.hypot(mark.spike.x, mark.spike.y)
                    if (sp > 0.001) {
                        const sa = Math.atan2(mark.spike.y, mark.spike.x)
                        transform +=
                            ` rotate(${sa}rad)` +
                            ` scale(${(1 + sp).toFixed(4)}, ${(1 - sp * 0.6).toFixed(4)})` +
                            ` rotate(${-sa}rad)`
                    }
                }

                // Below a pixel of movement the direction is unreliable, and a
                // resting mark would shimmer.
                if (speed > 0.05) {
                    const amount = Math.min(speed * cfg.squash, cfg.maxSquash)
                    const angle = Math.atan2(vy, vx)
                    // Turn the mark onto its direction of travel, stretch it
                    // along that line, turn it back. The two rotations cancel,
                    // so a wordmark can stretch at any angle without ever
                    // appearing tilted.
                    transform +=
                        ` rotate(${angle}rad)` +
                        ` scale(${(1 + amount).toFixed(4)}, ${(
                            1 - amount
                        ).toFixed(4)})` +
                        ` rotate(${-angle}rad)`
                }

                // One write per mark per frame, on a property the browser can
                // move without redrawing anything.
                node.style.transform = transform

                mark.prev.x = mark.pos.x
                mark.prev.y = mark.pos.y
            }

            // --- the headline is in the same field ----------------------
            // Nudging these letters does not simply move type. They sit inside
            // the threshold filter, so as they gather toward the cursor they
            // touch, neck and weld into one mass, then unpeel back into
            // letterforms as it leaves. The response is deliberately weaker and
            // shorter-range than the marks': the word should be drawn together
            // by the cursor, not scattered by it.
            const wp = wordPullRef.current
            if (wp > 0) {
                // Range scales with the card, like every other size here, so
                // the effect holds its proportions at any width.
                const lr = cardW.current * 0.17
                const els = card.querySelectorAll("[data-ff-letter]")
                for (let i = 0; i < els.length; i++) {
                    const el = els[i] as HTMLElement
                    let L = letters.current.get(el)
                    if (!L) {
                        // First sight of this letter: it carries no transform
                        // yet, so this is the only moment its true rest
                        // position can be read.
                        const r = el.getBoundingClientRect()
                        L = {
                            restX: r.left + r.width / 2,
                            restY: r.top + r.height / 2,
                            pos: { x: 0, y: 0 },
                        }
                        letters.current.set(el, L)
                    }
                    const ldx = p.x - L.restX
                    const ldy = p.y - L.restY
                    const ld = Math.hypot(ldx, ldy)
                    let tx = 0
                    let ty = 0
                    if (p.inside && ld < lr) {
                        const st = 1 - ld / lr
                        tx = ldx * st * wp
                        ty = ldy * st * wp
                    }
                    L.pos.x = lerp(L.pos.x, tx, 0.16)
                    L.pos.y = lerp(L.pos.y, ty, 0.16)
                    el.style.transform = `translate3d(${L.pos.x.toFixed(2)}px, ${L.pos.y.toFixed(2)}px, 0)`
                }
            }

            frameRef.current = window.requestAnimationFrame(tick)
        }

        frameRef.current = window.requestAnimationFrame(tick)

        // The listeners sit on the window rather than the component, so the
        // field engages as the cursor approaches from outside. A listener bound
        // to the component would go quiet the moment you crossed its edge.
        window.addEventListener("mousemove", onPointerMove, { passive: true })
        document.addEventListener("mouseleave", onPointerLeave)
        window.addEventListener("resize", measure, { passive: true })
        window.addEventListener("scroll", measure, { passive: true })

        // The component can also change size without the window changing:
        // resizing the frame, switching breakpoint, or a shift in the layout
        // around it.
        const observer =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(measure)
                : null
        observer?.observe(card)

        return () => {
            if (frameRef.current !== null) {
                window.cancelAnimationFrame(frameRef.current)
                frameRef.current = null
            }
            window.removeEventListener("mousemove", onPointerMove)
            document.removeEventListener("mouseleave", onPointerLeave)
            window.removeEventListener("resize", measure)
            window.removeEventListener("scroll", measure)
            observer?.disconnect()

            // Letter rest positions are viewport coordinates, read once on
            // first sight. Leaving the viewport almost always means the page
            // scrolled, which invalidates every one of them, so the cache is
            // dropped here rather than carried into the next entry.
            //
            // The transforms have to go with it. A rest position is only
            // readable from an element that is not currently displaced, so a
            // letter left mid-pull would have its own offset baked into the
            // position it settles back to on the next entry.
            const held = card.querySelectorAll("[data-ff-letter]")
            for (let i = 0; i < held.length; i++) {
                const el = held[i] as HTMLElement
                el.style.transform = ""
            }
            letters.current = new WeakMap()
        }
    }, [isStatic, inView, logos])

    // --- Styles ------------------------------------------------------------

    // The word animations are the one thing that cannot be expressed inline.
    // Every name carries this instance's suffix, so two Ferrofluids on the
    // same page never interfere with one another.
    const css = `
@keyframes ff-in-${uid} {
    from { filter: blur(${morphBlur}cqw); opacity: 0; }
    to   { filter: blur(0); opacity: 1; }
}
@keyframes ff-out-${uid} {
    from { filter: blur(0); opacity: 1; }
    to   { filter: blur(${morphBlur}cqw); opacity: 0; }
}
.ff-in-${uid}  { animation: ff-in-${uid} 1100ms cubic-bezier(0.33, 0, 0.2, 1) both; }
.ff-out-${uid} { animation: ff-out-${uid} 950ms cubic-bezier(0.6, 0, 0.7, 1) both; }
@media (prefers-reduced-motion: reduce) {
    .ff-in-${uid}, .ff-out-${uid} { animation: none; }
    .ff-word-${uid}, .ff-mark-${uid} { will-change: auto; }
}`

    const borderStyle: CSSProperties = showCard
        ? {
              background: cardFill,
              borderStyle: cardBorder?.borderStyle ?? "solid",
              borderColor: cardBorder?.borderColor ?? "#d8d8d8",
              borderTopWidth:
                  cardBorder?.borderTopWidth ?? cardBorder?.borderWidth ?? 0,
              borderRightWidth:
                  cardBorder?.borderRightWidth ?? cardBorder?.borderWidth ?? 0,
              borderBottomWidth:
                  cardBorder?.borderBottomWidth ?? cardBorder?.borderWidth ?? 0,
              borderLeftWidth:
                  cardBorder?.borderLeftWidth ?? cardBorder?.borderWidth ?? 0,
              borderRadius: cardRadius,
              boxShadow: cardShadow,
          }
        : { background: "transparent", border: "none", borderRadius: 0 }

    const activeWords =
        isStatic || wordList.length < 2
            ? [{ key: "static", word: wordList[0], cls: "" }]
            : [
                  ...(previous !== null && previous !== current
                      ? [
                            {
                                key: `out-${previous}`,
                                word: wordList[previous],
                                cls: `ff-out-${uid}`,
                            },
                        ]
                      : []),
                  {
                      key: `in-${current}`,
                      word: wordList[current],
                      cls: `ff-in-${uid}`,
                  },
              ]

    return (
        <section
            ref={cardRef}
            aria-labelledby={headingId}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                // Crops the headline where it runs past the edge, which is part
                // of the look, along with any mark drawn toward a border.
                overflow: "hidden",
                // Establishes this component as the reference for every size
                // inside it. Because those sizes are percentages of this width,
                // the whole composition scales as one piece at any frame size
                // instead of drifting out of proportion.
                //
                // Written through a cast because container queries are newer
                // than the style typings bundled here. The browser reads it
                // normally.
                ...({ containerType: "inline-size" } as CSSProperties),
                fontFamily: headlineFont?.fontFamily ?? SYSTEM_STACK,
                ...borderStyle,
                ...style,
            }}
        >
            <style>{css}</style>

            {/* The filter behind the melt. It draws nothing itself and takes up
                no space, but it has to be present for the headline to reference
                it.

                Each word carries its own blur. Blurring softens a shape and
                lowers its opacity at the edges; the matrix below then pushes
                opacity back to its extremes, cutting away anything that has
                softened past roughly half and restoring a hard edge to
                everything still solid. A word on its way out therefore does not
                fade: it draws in, rounds off and disappears, while the word
                arriving swells out of rounded shapes into letters. Where the
                two overlap their blurs add together, cross the threshold as one
                and fuse. That fusing is the whole effect.

                The sRGB setting is required. Without it the filter would shift
                the colour of the type the moment it applied. */}
            <svg
                aria-hidden="true"
                focusable="false"
                style={{ position: "absolute", width: 0, height: 0 }}
            >
                <defs>
                    <filter id={gooId} colorInterpolationFilters="sRGB">
                        <feGaussianBlur
                            in="SourceGraphic"
                            stdDeviation={gooBlur}
                            result="soften"
                        />
                        <feColorMatrix
                            in="soften"
                            type="matrix"
                            values="1 0 0 0 0
                                    0 1 0 0 0
                                    0 0 1 0 0
                                    0 0 0 22 -10"
                        />
                    </filter>
                </defs>
            </svg>

            {/* The headline is a real heading, not decoration. It is set large
                and allowed to run past both edges, but it still names this
                section for assistive technology. */}
            <h2
                id={headingId}
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    margin: 0,
                    // A backdrop should never catch the cursor or become
                    // selectable when someone drags across the component.
                    pointerEvents: "none",
                    userSelect: "none",
                }}
            >
                {/* A heading that renames itself every few seconds is announced
                    over and over. Screen readers are given this fixed label
                    instead, set in the Screen Reader control, and the moving
                    type is treated as decoration. */}
                <span
                    style={{
                        position: "absolute",
                        width: 1,
                        height: 1,
                        overflow: "hidden",
                        clipPath: "inset(50%)",
                        whiteSpace: "nowrap",
                    }}
                >
                    {headingLabel}
                </span>

                {/* Where the filter is applied. Both words are drawn first and
                    the threshold is applied to the result, which is what welds
                    them into a single mass instead of showing one fading
                    through the other. */}
                <span
                    aria-hidden="true"
                    style={{ display: "grid", filter: `url(#${gooId})` }}
                >
                    {/* Two layers at most, each rebuilt as the cycle turns.
                        That rebuild is what restarts the animation. */}
                    {activeWords.map(({ key, word, cls }) => (
                        <span
                            key={key}
                            className={`ff-word-${uid} ${cls}`}
                            style={{
                                // Both words share one cell, so they overlap
                                // exactly and the headline never resizes as the
                                // word changes length.
                                gridArea: "1 / 1",
                                textAlign: "center",
                                // Pinned left-to-right on purpose. With Word
                                // Pull on, the headline is split into one
                                // inline-block per character, and inline-block
                                // order reverses under `direction: rtl` -- so a
                                // site with right-to-left layout enabled would
                                // render the word backwards. The words here are
                                // decorative Latin wordmarks, so their reading
                                // order is fixed regardless of the page around
                                // them.
                                //
                                // For an actual right-to-left script, set Word
                                // Pull to 0. Splitting a word into per-character
                                // spans breaks the contextual joining that
                                // Arabic and similar scripts rely on, so the
                                // unsplit path is the correct one there.
                                direction: "ltr",
                                // Set so the longest word reaches roughly the
                                // full width. Shorter words sit narrower, and
                                // centred, that reads as one mass breathing.
                                fontSize: `${headlineSize}cqw`,
                                fontWeight: headlineFont?.fontWeight ?? 700,
                                fontStyle: headlineFont?.fontStyle,
                                letterSpacing:
                                    headlineFont?.letterSpacing ?? "-0.02em",
                                lineHeight: headlineFont?.lineHeight ?? 1,
                                whiteSpace: "nowrap",
                                // Set darker than a watermark on purpose, so the
                                // type and the marks share the composition. Any
                                // darker and the marks stop being the subject.
                                color: headlineColor,
                                willChange: "filter, opacity",
                            }}
                        >
                            {wordPull > 0
                                ? Array.from(word).map((ch, li) => (
                                      <span
                                          key={li}
                                          data-ff-letter=""
                                          style={{
                                              display: "inline-block",
                                              willChange: "transform",
                                          }}
                                      >
                                          {ch}
                                      </span>
                                  ))
                                : word}
                        </span>
                    ))}
                </span>
            </h2>

            <ul
                style={{
                    position: "absolute",
                    inset: 0,
                    margin: 0,
                    padding: 0,
                    listStyle: "none",
                    zIndex: 1,
                }}
            >
                {logos.map((logo, i) => {
                    const fallback =
                        PLACEHOLDER_LOGOS[i % PLACEHOLDER_LOGOS.length]
                    const src = logo?.image?.src ?? fallback.image.src
                    const alt = logo?.name ?? logo?.image?.alt ?? ""
                    return (
                        // The slot holds the resting position and never moves;
                        // it is the reference every measurement is taken from.
                        // The mark inside it is the only part that animates.
                        <li
                            key={`${alt}-${i}`}
                            ref={(el) => {
                                slotRefs.current[i] = el
                            }}
                            style={{
                                position: "absolute",
                                left: `${logo?.x ?? 50}%`,
                                top: `${logo?.y ?? 50}%`,
                                // Positions describe the centre of a mark, not
                                // its corner, so the numbers in the panel read
                                // as "put it here".
                                transform: "translate(-50%, -50%)",
                            }}
                        >
                            {/* This wrapper is what moves, not the image. The
                                stretch would otherwise fight the image's own
                                proportions; a plain box carries the mark and
                                deforms predictably. */}
                            <div
                                className={`ff-mark-${uid}`}
                                ref={(el) => {
                                    markRefs.current[i] = el
                                }}
                                style={{
                                    // Stretch has to radiate from the middle, or
                                    // the mark slides off centre as it deforms.
                                    transformOrigin: "center center",
                                    willChange: "transform",
                                    // A mark must never catch the cursor, or
                                    // passing over one would interrupt the
                                    // field.
                                    pointerEvents: "none",
                                }}
                            >
                                <img
                                    src={src}
                                    srcSet={logo?.image?.srcSet}
                                    alt={alt}
                                    draggable={false}
                                    style={{
                                        // Marks are matched by height and take
                                        // their width from their own
                                        // proportions. Matching heights, rather
                                        // than widths, is what makes a set of
                                        // unrelated logos look deliberate.
                                        height: `${
                                            logoHeight * (logo?.scale ?? 1)
                                        }cqw`,
                                        width: "auto",
                                        display: "block",
                                        // Logos arrive in whatever colours their
                                        // owners use, and side by side those
                                        // differences read as a mistake rather
                                        // than as branding. Grayscale settles
                                        // them onto one tone while leaving
                                        // knocked-out shapes intact, which a
                                        // flat colour would destroy.
                                        //
                                        // Invert then carries the set across to
                                        // a dark ground: dark strokes turn
                                        // light and knocked-out counters turn
                                        // dark, so the detail inside the
                                        // heavier marks survives instead of
                                        // filling in. Brightness holds them
                                        // just under white, where they stop
                                        // out-shouting the headline.
                                        filter: MARK_FILTERS[logoColor],
                                        userSelect: "none",
                                    }}
                                />
                            </div>
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}

addPropertyControls(Ferrofluids, {
    logos: {
        type: ControlType.Array,
        title: "Logos",
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Logo",
                    description: "Alt text for this mark.",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Logo",
                    description:
                        "Leave empty to show the placeholder mark for this slot.",
                },
                scale: {
                    type: ControlType.Number,
                    title: "Optical Size",
                    defaultValue: 1,
                    min: 0.4,
                    max: 2,
                    step: 0.01,
                    description:
                        "Two marks at the same height rarely look the same size. Use this to even them out.",
                },
                x: {
                    type: ControlType.Number,
                    title: "X",
                    defaultValue: 50,
                    min: 0,
                    max: 100,
                    step: 0.5,
                    unit: "%",
                },
                y: {
                    type: ControlType.Number,
                    title: "Y",
                    defaultValue: 50,
                    min: 0,
                    max: 100,
                    step: 0.5,
                    unit: "%",
                },
                mass: {
                    type: ControlType.Number,
                    title: "Mass",
                    defaultValue: 1,
                    min: 0,
                    max: 2,
                    step: 0.01,
                    description:
                        "How strongly this mark responds to the cursor. Vary it across the set so the marks feel separate.",
                },
            },
        },
        defaultValue: PLACEHOLDER_LOGOS,
    },
    logoHeight: {
        type: ControlType.Number,
        title: "Logo Size",
        defaultValue: 6.9,
        min: 2,
        max: 20,
        step: 0.1,
        description: "Base height, as a percentage of the component's width.",
    },
    logoColor: {
        type: ControlType.Enum,
        title: "Logo Color",
        defaultValue: "grayscale",
        options: ["grayscale", "invert", "none"],
        optionTitles: ["Grayscale", "Invert", "Original"],
        description:
            "Grayscale suits a light card; Invert suits a dark one. Original leaves your logos in their own colours.",
    },

    words: {
        type: ControlType.Array,
        title: "Words",
        control: { type: ControlType.String, defaultValue: "TRUSTED" },
        defaultValue: DEFAULT_WORDS,
        description:
            "Short uppercase words of similar length melt into one another best.",
    },
    headingLabel: {
        type: ControlType.String,
        title: "Screen Reader",
        defaultValue: "Trusted by",
        description:
            "The heading read by assistive technology, in place of the changing word.",
    },
    holdDuration: {
        type: ControlType.Number,
        title: "Hold",
        defaultValue: 2600,
        min: 1200,
        max: 8000,
        step: 100,
        unit: "ms",
        description: "How long each word stays before the next arrives.",
    },
    headlineSize: {
        type: ControlType.Number,
        title: "Word Size",
        defaultValue: 19,
        min: 5,
        max: 40,
        step: 0.5,
        description: "Size as a percentage of the component's width.",
    },
    headlineColor: {
        type: ControlType.Color,
        title: "Word Color",
        defaultValue: "#c4c4c4",
    },
    headlineFont: {
        type: ControlType.Font,
        title: "Word Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        displayFontSize: false,
        displayTextAlignment: false,
        defaultValue: {
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
    },
    morphBlur: {
        type: ControlType.Number,
        title: "Melt",
        defaultValue: 2.4,
        min: 0.5,
        max: 6,
        step: 0.1,
        description: "How far the words soften as they melt into one another.",
    },
    wordPull: {
        type: ControlType.Number,
        title: "Word Pull",
        defaultValue: 0.13,
        min: 0,
        max: 0.35,
        step: 0.01,
        description:
            "How strongly the headline letters gather toward the cursor. They weld together as they meet. 0 holds the word still.",
    },

    physics: {
        type: ControlType.Object,
        title: "Magnetism",
        icon: "effect",
        controls: {
            radius: {
                type: ControlType.Number,
                title: "Range",
                defaultValue: 190,
                min: 40,
                max: 500,
                step: 5,
                unit: "px",
                description:
                    "How close the cursor comes before a mark responds.",
            },
            pullStrength: {
                type: ControlType.Number,
                title: "Pull",
                defaultValue: 0.28,
                min: 0,
                max: 1,
                step: 0.01,
                description: "How far a mark travels toward the cursor.",
            },
            ease: {
                type: ControlType.Number,
                title: "Ease",
                defaultValue: 0.13,
                min: 0.02,
                max: 0.5,
                step: 0.01,
                description: "How quickly a mark settles.",
            },
            squash: {
                type: ControlType.Number,
                title: "Stretch",
                defaultValue: 0.016,
                min: 0,
                max: 0.06,
                step: 0.001,
                description: "How much a mark stretches as it moves.",
            },
            maxSquash: {
                type: ControlType.Number,
                title: "Max Stretch",
                defaultValue: 0.11,
                min: 0,
                max: 0.4,
                step: 0.01,
                description:
                    "Upper limit, so a fast flick cannot flatten a mark.",
            },
            spike: {
                type: ControlType.Number,
                title: "Spike",
                defaultValue: 0.11,
                min: 0,
                max: 0.3,
                step: 0.01,
                description:
                    "How far a mark elongates toward the cursor, and holds while you rest there. 0 turns it off.",
            },
            spikeEase: {
                type: ControlType.Number,
                title: "Spike Ease",
                defaultValue: 0.14,
                min: 0.02,
                max: 0.4,
                step: 0.01,
                description: "How eagerly that elongation chases the cursor.",
            },
            spikeSpring: {
                type: ControlType.Number,
                title: "Spike Spring",
                defaultValue: 0.62,
                min: 0,
                max: 0.9,
                step: 0.01,
                description:
                    "How far the stretch overshoots before settling. 0 is a plain ease with no bounce.",
            },
            floatAmplitude: {
                type: ControlType.Number,
                title: "Drift",
                defaultValue: 5,
                min: 0,
                max: 30,
                step: 0.5,
                unit: "px",
                description: "Idle movement while the cursor is away.",
            },
            floatSpeed: {
                type: ControlType.Number,
                title: "Drift Speed",
                defaultValue: 0.4,
                min: 0,
                max: 2,
                step: 0.05,
                description: "How fast that idle movement cycles.",
            },
        },
        defaultValue: DEFAULT_PHYSICS,
    },

    showCard: {
        type: ControlType.Boolean,
        title: "Card",
        defaultValue: true,
        description:
            "Turn off to remove the frame and run the field on your own background.",
    },
    cardFill: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: "#efefef",
        hidden: ({ showCard }) => !showCard,
    },
    cardBorder: {
        type: ControlType.Border,
        title: "Border",
        defaultValue: {
            borderWidth: 0,
            borderStyle: "solid",
            borderColor: "#d8d8d8",
        },
        hidden: ({ showCard }) => !showCard,
    },
    cardRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "20px",
        hidden: ({ showCard }) => !showCard,
    },
    cardShadow: {
        type: ControlType.BoxShadow,
        title: "Shadow",
        defaultValue: "0 30px 70px -30px rgba(0, 0, 0, 0.5)",
        hidden: ({ showCard }) => !showCard,
    },
})

Ferrofluids.displayName = "Ferrofluids"
