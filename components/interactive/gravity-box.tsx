/**
 * Gravity Box
 * Drops the items you add into a box with real gravity. Visitors can grab and throw them.
 * Version 1.0.0
 *
 * Quick start
 * 1. Give the Gravity Box layer a size, for example Fill width and 600px height.
 * 2. Connect layers in the Items list. Give each item a fixed size.
 * 3. Open Preview. The items fall, and you can grab and throw them.
 * 4. Turn on Float for items that drift with no gravity.
 * 5. Turn on Show Physics to see the collision shapes while you tune it.
 *
 * How it works
 * - Matter.js (MIT licensed physics engine) simulates one body per item.
 * - With Shape set to Outline, each body follows the visible pixels of the images inside the item.
 *   Physics bodies must be convex, so a curved or hollow shape uses its outer outline (like a rubber band around it).
 * - With Shape set to Box, each body is the item's rectangle.
 * - Each frame, every item's DOM element is moved with a CSS transform to match its body.
 * - The simulation runs at a fixed 60 steps per second, so it feels the same on 60Hz and 120Hz screens.
 * - It pauses when off screen and when everything has stopped moving.
 *
 * License
 * - Matter.js is loaded as a package (MIT license, copyright Liam Brummitt). Its license travels with the package.
 * - Other components may rely on the "physics-body" class on each item. Sticker Curl uses it.
 */
import { Children, isValidElement, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { createPortal } from "react-dom"
import Matter from "matter-js"
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

interface WallOptions {
    top?: boolean
    bottom?: boolean
    right?: boolean
    left?: boolean
}

interface MouseOptions {
    enable?: boolean
    angularStiffness?: number
    stiffness?: number
}

interface FrictionOptions {
    friction?: number
    frictionAir?: number
}

interface DensityOptions {
    enable?: boolean
    density?: number
}

interface PhysicsProps {
    /** The items that fall. Each one should have a fixed size. */
    children?: ReactNode
    gravX?: number
    gravY?: number
    wallOptions?: WallOptions
    /** How far the walls sit inside the box, in px. 0 = items reach the edges. 80 matches the original look. */
    wallInset?: number
    mouseOptions?: MouseOptions
    frictionOptions?: FrictionOptions
    densityOptions?: DensityOptions
    /** Draws the physics shapes behind the items. */
    debug?: boolean
    /** Items drift around on their own, with no gravity. */
    float?: boolean
    lightbox?: boolean
    /** Respect the visitor's "reduce motion" system setting (items then stay still). Off by default. */
    respectReducedMotion?: boolean
    /** Drift speed while floating. 1 is calm, higher is faster. */
    floatSpeed?: number
    /** While floating: items bump into each other (on) or pass through each other (off). */
    collide?: boolean
    /** "outline" follows the visible pixels of images inside each item. "box" uses the item's frame. */
    collisionShape?: "outline" | "box"
    style?: CSSProperties
}

interface Size {
    width: number
    height: number
}

interface Point {
    x: number
    y: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_WALLS: Required<WallOptions> = { top: true, bottom: true, right: true, left: true }
const DEFAULT_MOUSE: Required<MouseOptions> = { enable: true, angularStiffness: 0, stiffness: 0.2 }
const DEFAULT_FRICTION: Required<FrictionOptions> = { friction: 0.1, frictionAir: 0.01 }
const DEFAULT_DENSITY: Required<DensityOptions> = { enable: true, density: 0.001 }

// Walls are static and a bit grippy. Same values as the original version.
const WALL_BODY_OPTIONS = { isStatic: true, friction: 2 }

// Thick walls stop fast items from passing through them between two steps.
const WALL_THICKNESS = 100

// The original version placed 100px walls 30px inside the edges, so items stopped 80px from each edge.
// That invisible gap felt like a bug, so walls now sit right on the edges by default.
// "Wall Inset" can bring the old gap back (80 matches the original).
const DEFAULT_WALL_INSET = 0

// One physics step = 1/60 s, whatever the screen's refresh rate.
const STEP_MS = 1000 / 60

// After a long pause (slow device, background tab) skip ahead instead of running many steps at once.
const MAX_STEPS_PER_FRAME = 5

// A press that moves less than this (px) still counts as a click, so links inside items keep working.
const DRAG_CLICK_THRESHOLD = 6

// With "reduce motion" on, the items are settled ahead of time with this many steps (10 s of physics).
const SETTLE_STEPS = 600

// ----- Float mode -----
// Drift speed at "Float Speed" 1, in px per physics step (about 36 px per second).
const FLOAT_BASE_SPEED = 0.6
// How quickly an item eases toward its drift speed each step. Small values feel calm and floaty.
const FLOAT_STEER = 0.03
// Largest random turn per step, in radians. Makes the paths wander instead of going straight.
const FLOAT_TURN = 0.2
// Bounciness while floating, so items push off walls instead of sliding along them.
const FLOAT_BOUNCE = 0.6
// Items that share a negative group never collide with each other, but still hit the walls.
const NO_COLLIDE_GROUP = -1

// ----- Outline shapes -----
// Longest side (px) of the small copy read to find an image's outline.
const SHAPE_SAMPLE_SIZE = 128
// Opacity (0 to 255) below which a pixel counts as empty. About 10%, to skip near-invisible haze.
const SHAPE_ALPHA = 24
// Most corners an outline keeps. More is more exact but slower.
const SHAPE_MAX_POINTS = 32

// Fine-grained visibility steps, so the start check runs often enough while scrolling.
const VISIBILITY_THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Size of an element without any zoom or transforms applied. */
function layoutSize(element: HTMLElement): Size {
    return { width: element.offsetWidth, height: element.offsetHeight }
}

/** Turns whatever Framer passes as children into a plain list of items. */
function toItems(children: ReactNode): ReactNode[] {
    if (Array.isArray(children)) return Children.toArray(children)
    return isValidElement(children) ? [children] : []
}

/** A random center for an item between two edges. Falls back to the middle when the item does not fit. */
function randomCenter(itemSize: number, start: number, end: number) {
    const min = start + itemSize / 2
    const max = end - itemSize / 2
    return max > min ? min + Math.random() * (max - min) : (start + end) / 2
}

function clamp(value: number, min: number, max: number) {
    return max < min ? (min + max) / 2 : Math.min(Math.max(value, min), max)
}

/** The inner area items can use, after the walls that are switched on. */
function innerArea(box: Size, walls: Required<WallOptions>, inset: number) {
    return {
        left: walls.left ? inset : 0,
        right: box.width - (walls.right ? inset : 0),
        top: walls.top ? inset : 0,
        bottom: box.height - (walls.bottom ? inset : 0),
    }
}

/** Builds the static walls. Their inner faces sit "inset" px inside the box edges. */
function buildWalls(box: Size, walls: Required<WallOptions>, inset: number): Matter.Body[] {
    const half = WALL_THICKNESS / 2
    // Walls are longer than the box so the corners stay closed.
    const longX = box.width + WALL_THICKNESS * 2
    const longY = box.height + WALL_THICKNESS * 2
    const list: Matter.Body[] = []
    if (walls.bottom) {
        list.push(
            Matter.Bodies.rectangle(box.width / 2, box.height - inset + half, longX, WALL_THICKNESS, WALL_BODY_OPTIONS),
        )
    }
    if (walls.top) {
        list.push(Matter.Bodies.rectangle(box.width / 2, inset - half, longX, WALL_THICKNESS, WALL_BODY_OPTIONS))
    }
    if (walls.right) {
        list.push(
            Matter.Bodies.rectangle(box.width - inset + half, box.height / 2, WALL_THICKNESS, longY, WALL_BODY_OPTIONS),
        )
    }
    if (walls.left) {
        list.push(Matter.Bodies.rectangle(inset - half, box.height / 2, WALL_THICKNESS, longY, WALL_BODY_OPTIONS))
    }
    return list
}

/**
 * Float mode: gently steers one item along a wandering path.
 * The heading follows the item's current direction plus a small random turn,
 * so after bouncing off a wall or another item it simply carries on the new way.
 */
function steerFloating(body: Matter.Body, speed: number) {
    const { x: vx, y: vy } = body.velocity
    const moving = Math.hypot(vx, vy) > 0.01
    const heading = (moving ? Math.atan2(vy, vx) : Math.random() * Math.PI * 2) + (Math.random() - 0.5) * 2 * FLOAT_TURN
    const targetX = Math.cos(heading) * speed
    const targetY = Math.sin(heading) * speed
    Matter.Body.setVelocity(body, {
        x: vx + (targetX - vx) * FLOAT_STEER,
        y: vy + (targetY - vy) * FLOAT_STEER,
    })
}

// ---------------------------------------------------------------------------
// Outline shapes
// Collision shapes that follow the visible pixels of the images inside an item,
// instead of the item's rectangular frame.
// ---------------------------------------------------------------------------

/** Outlines per image URL, so each image is only read once per page. */
const outlineCache = new Map<string, Promise<Point[] | null>>()

/** Returns the outline of an image's visible pixels, as fractions (0 to 1) of the image. */
function imageOutline(url: string): Promise<Point[] | null> {
    let cached = outlineCache.get(url)
    if (!cached) {
        cached = readImageOutline(url)
        outlineCache.set(url, cached)
    }
    return cached
}

/**
 * Reads a small copy of the image and wraps its visible pixels in a convex outline
 * (like a rubber band stretched around the artwork). Null when the image host blocks reading pixels.
 */
async function readImageOutline(url: string): Promise<Point[] | null> {
    const probe = new Image()
    // Needed to read pixels from another site. Framer's image host allows it.
    probe.crossOrigin = "anonymous"
    probe.src = url
    try {
        await probe.decode()
    } catch {
        return null
    }

    const scale = Math.min(1, SHAPE_SAMPLE_SIZE / Math.max(probe.naturalWidth, probe.naturalHeight, 1))
    const width = Math.max(1, Math.round(probe.naturalWidth * scale))
    const height = Math.max(1, Math.round(probe.naturalHeight * scale))
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d", { willReadFrequently: true })
    if (!context) return null
    context.drawImage(probe, 0, 0, width, height)

    let pixels: Uint8ClampedArray
    try {
        pixels = context.getImageData(0, 0, width, height).data
    } catch {
        // The image host blocked pixel reading.
        return null
    }

    // The outermost visible pixel on each row is enough to build a convex outline.
    const edge: Point[] = []
    for (let y = 0; y < height; y++) {
        let first = -1
        let last = -1
        for (let x = 0; x < width; x++) {
            if (pixels[(y * width + x) * 4 + 3] <= SHAPE_ALPHA) continue
            if (first < 0) first = x
            last = x
        }
        if (first < 0) continue
        // Both the top and bottom of the pixel row, so the outline covers whole pixels.
        edge.push({ x: first / width, y: y / height }, { x: first / width, y: (y + 1) / height })
        edge.push({ x: (last + 1) / width, y: y / height }, { x: (last + 1) / width, y: (y + 1) / height })
    }
    if (edge.length < 3) return null
    return simplifyOutline(convexHull(edge), SHAPE_MAX_POINTS)
}

/** Smallest convex polygon around the points (monotone chain method). */
function convexHull(points: Point[]): Point[] {
    const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y)
    const cross = (o: Point, a: Point, b: Point) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
    const lower: Point[] = []
    for (const point of sorted) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) lower.pop()
        lower.push(point)
    }
    const upper: Point[] = []
    for (let i = sorted.length - 1; i >= 0; i--) {
        const point = sorted[i]
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) upper.pop()
        upper.push(point)
    }
    lower.pop()
    upper.pop()
    return lower.concat(upper)
}

/** Drops the least important corners until the outline has at most maxPoints. Keeps physics fast. */
function simplifyOutline(points: Point[], maxPoints: number): Point[] {
    const result = [...points]
    const area = (a: Point, b: Point, c: Point) => Math.abs((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y))
    while (result.length > maxPoints) {
        let smallest = 0
        let smallestArea = Infinity
        for (let i = 0; i < result.length; i++) {
            const before = result[(i - 1 + result.length) % result.length]
            const after = result[(i + 1) % result.length]
            const value = area(before, result[i], after)
            if (value < smallestArea) {
                smallestArea = value
                smallest = i
            }
        }
        result.splice(smallest, 1)
    }
    return result
}

/** Cuts a convex polygon to a rectangle (Sutherland-Hodgman), so cropped image parts never collide. */
function clipToRect(points: Point[], left: number, top: number, right: number, bottom: number): Point[] {
    const edges: [(p: Point) => boolean, (a: Point, b: Point) => Point][] = [
        [(p) => p.x >= left, (a, b) => ({ x: left, y: a.y + ((b.y - a.y) * (left - a.x)) / (b.x - a.x) })],
        [(p) => p.x <= right, (a, b) => ({ x: right, y: a.y + ((b.y - a.y) * (right - a.x)) / (b.x - a.x) })],
        [(p) => p.y >= top, (a, b) => ({ x: a.x + ((b.x - a.x) * (top - a.y)) / (b.y - a.y), y: top })],
        [(p) => p.y <= bottom, (a, b) => ({ x: a.x + ((b.x - a.x) * (bottom - a.y)) / (b.y - a.y), y: bottom })],
    ]
    let output = points
    for (const [inside, cut] of edges) {
        const input = output
        output = []
        for (let i = 0; i < input.length; i++) {
            const current = input[i]
            const previous = input[(i - 1 + input.length) % input.length]
            if (inside(current)) {
                if (!inside(previous)) output.push(cut(previous, current))
                output.push(current)
            } else if (inside(previous)) {
                output.push(cut(previous, current))
            }
        }
        if (output.length === 0) break
    }
    return output
}

/** Waits until an image has finished loading (or failed). */
function whenLoaded(image: HTMLImageElement): Promise<void> {
    if (image.complete) return Promise.resolve()
    return new Promise((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true })
        image.addEventListener("error", () => resolve(), { once: true })
    })
}

/**
 * Where the picture inside an <img> is drawn, relative to the item's top-left corner.
 * Follows the image's object-fit (contain, cover or fill), assuming it is centered.
 */
function imageContentRect(item: HTMLElement, image: HTMLImageElement) {
    // Add up layout offsets until the item is reached. Layout offsets ignore zoom and transforms.
    let x = 0
    let y = 0
    let node: HTMLElement | null = image
    while (node && node !== item) {
        x += node.offsetLeft
        y += node.offsetTop
        node = node.offsetParent as HTMLElement | null
    }
    if (node !== item) return null

    const boxWidth = image.offsetWidth
    const boxHeight = image.offsetHeight
    const naturalWidth = image.naturalWidth
    const naturalHeight = image.naturalHeight
    if (!boxWidth || !boxHeight || !naturalWidth || !naturalHeight) return null

    const fit = getComputedStyle(image).objectFit
    if (fit === "contain" || fit === "cover" || fit === "scale-down") {
        const pick = fit === "cover" ? Math.max : Math.min
        const scale = pick(boxWidth / naturalWidth, boxHeight / naturalHeight)
        const width = naturalWidth * scale
        const height = naturalHeight * scale
        return { x: x + (boxWidth - width) / 2, y: y + (boxHeight - height) / 2, width, height }
    }
    return { x, y, width: boxWidth, height: boxHeight }
}

/**
 * The outline of everything visible in an item, around the item's center (px).
 * Null when the item has no readable images: it then keeps its rectangle.
 */
async function itemOutline(item: HTMLElement, size: Size): Promise<Point[] | null> {
    const images = Array.from(item.querySelectorAll("img"))
    if (images.length === 0) return null
    const points: Point[] = []
    for (const image of images) {
        await whenLoaded(image)
        const rect = imageContentRect(item, image)
        const url = image.currentSrc || image.src
        if (!rect || !url) continue
        const outline = await imageOutline(url)
        if (!outline) continue
        for (const point of outline) {
            points.push({
                x: rect.x + point.x * rect.width - size.width / 2,
                y: rect.y + point.y * rect.height - size.height / 2,
            })
        }
    }
    if (points.length < 3) return null
    const halfWidth = size.width / 2
    const halfHeight = size.height / 2
    const outline = clipToRect(convexHull(points), -halfWidth, -halfHeight, halfWidth, halfHeight)
    return outline.length >= 3 ? outline : null
}

/** A plain rectangle around the item's center (px). */
function boxOutline(size: Size): Point[] {
    const halfWidth = size.width / 2
    const halfHeight = size.height / 2
    return [
        { x: -halfWidth, y: -halfHeight },
        { x: halfWidth, y: -halfHeight },
        { x: halfWidth, y: halfHeight },
        { x: -halfWidth, y: halfHeight },
    ]
}

/** True when the visitor asked their system for less motion. */
function usePrefersReducedMotion() {
    const [reduced, setReduced] = useState(false)
    useEffect(() => {
        const query = typeof window !== "undefined" ? window.matchMedia?.("(prefers-reduced-motion: reduce)") : null
        if (!query) return
        const update = () => setReduced(query.matches)
        update()
        query.addEventListener?.("change", update)
        return () => query.removeEventListener?.("change", update)
    }, [])
    return reduced
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 */
export default function GravityBox(props: PhysicsProps) {
    const {
        children,
        gravX = 0,
        gravY = 1,
        wallOptions,
        wallInset = DEFAULT_WALL_INSET,
        mouseOptions,
        frictionOptions,
        densityOptions,
        debug = false,
        float: floatProp = false,
        respectReducedMotion = false,
        lightbox = false,
        floatSpeed = 1,
        collide = true,
        collisionShape = "outline",
        style,
    } = props

    // A layer of yours can switch Float on or off (see GravityBoxControls.tsx). Changing the Float control takes over again.
    // Static rendering (thumbnails, static export) skips the physics and shows a plain layout instead.
    const isStatic = useIsStaticRenderer()
    const [floatOverride, setFloatOverride] = useState<boolean | null>(null)
    useEffect(() => setFloatOverride(null), [floatProp])
    useEffect(() => {
        if (isStatic) return
        const on = (e: Event) => {
            const mode = (e as CustomEvent).detail?.mode
            setFloatOverride((cur) => (mode === "float" ? true : mode === "gravity" ? false : !(cur ?? floatProp)))
        }
        window.addEventListener("gravitybox:mode", on)
        return () => window.removeEventListener("gravitybox:mode", on)
    }, [floatProp, isStatic])
    const float = floatOverride ?? floatProp

    // Fill in any missing nested settings, so a partly set instance never crashes.
    const walls = { ...DEFAULT_WALLS, ...wallOptions }
    const mouseSettings = { ...DEFAULT_MOUSE, ...mouseOptions }
    const friction = { ...DEFAULT_FRICTION, ...frictionOptions }
    const density = { ...DEFAULT_DENSITY, ...densityOptions }
    const inset = Math.max(0, wallInset)

    // Lightbox: clicking an item (not dragging it) shows it large, unless the item holds a link of its own.
    const [boxed, setBoxed] = useState<{ index: number; w: number; h: number } | null>(null)
    const dialogRef = useRef<HTMLDivElement>(null)
    const isOpen = boxed !== null
    useEffect(() => {
        if (!isOpen) return
        // Focus moves into the dialog and comes back to where it was when the dialog closes.
        const previous = document.activeElement as HTMLElement | null
        dialogRef.current?.focus()
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setBoxed(null)
            // Nothing inside the dialog is interactive, so Tab keeps the focus on the dialog itself.
            else if (e.key === "Tab") {
                e.preventDefault()
                dialogRef.current?.focus()
            }
        }
        window.addEventListener("keydown", onKey)
        return () => {
            window.removeEventListener("keydown", onKey)
            previous?.focus?.()
        }
    }, [isOpen])
    const openBox = (i: number, e: { target: EventTarget | null }) => {
        const node = itemRefs.current[i]
        if (!lightbox || !node || (e.target as HTMLElement | null)?.closest?.("a[href]")) return
        setBoxed({ index: i, w: node.offsetWidth, h: node.offsetHeight })
    }

    const items = toItems(children)
    const itemCount = items.length
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const reducedMotion = usePrefersReducedMotion() && respectReducedMotion

    // Grabbing items is off on the canvas, so clicks there select layers instead.
    const grabEnabled = mouseSettings.enable && !isCanvas

    // "Collisions" only applies while floating. With gravity, items always stack on each other.
    const itemsCollide = !float || collide

    const containerRef = useRef<HTMLDivElement>(null)
    const debugLayerRef = useRef<HTMLDivElement>(null)
    const itemRefs = useRef<(HTMLDivElement | null)[]>([])
    const engineRef = useRef<Matter.Engine | null>(null)
    // Restarts the animation loop. Replaced by each new physics world.
    const kickRef = useRef<() => void>(() => {})
    // Gravity changes are applied live, without rebuilding the world.
    const gravityRef = useRef({ x: gravX, y: gravY })
    // Float speed is applied live too.
    const floatSpeedRef = useRef(floatSpeed)
    floatSpeedRef.current = floatSpeed

    // The physics starts once the component is on screen, so visitors see the items fall.
    const [started, setStarted] = useState(false)

    // -----------------------------------------------------------------------
    // Start when visible
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (started || isStatic) return
        const container = containerRef.current
        if (!container) return

        // The canvas starts right away, so designers see the result without scrolling.
        if (isCanvas || typeof IntersectionObserver === "undefined") {
            setStarted(true)
            return
        }

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    // Start when half of the component is visible.
                    // A component taller than the screen can never be half visible,
                    // so for those, half of the screen being covered is enough.
                    const needed = Math.min(entry.boundingClientRect.height, window.innerHeight) * 0.5
                    if (entry.isIntersecting && entry.intersectionRect.height >= needed) setStarted(true)
                }
            },
            { threshold: VISIBILITY_THRESHOLDS },
        )
        observer.observe(container)
        return () => observer.disconnect()
    }, [started, isCanvas, isStatic])

    // -----------------------------------------------------------------------
    // Physics world
    // Rebuilt when a setting changes (except gravity), so every panel change shows up right away.
    // -----------------------------------------------------------------------
    useEffect(() => {
        const container = containerRef.current
        if (!started || !container) return

        // Floating items never rest, so "sleeping" (pausing still items) is off, and so is gravity.
        // With "reduce motion" on, floating items simply stay where they appear.
        const drifting = float && !reducedMotion
        const engine = Matter.Engine.create({
            enableSleeping: !float,
            gravity: float ? { x: 0, y: 0 } : { x: gravityRef.current.x, y: gravityRef.current.y },
        })
        engineRef.current = engine

        // Real layout size, not the zoomed screen size. getBoundingClientRect shrinks when the
        // Framer canvas is zoomed out, which made the physics world only fill part of the box.
        let box = layoutSize(container)

        // ----- Walls -----
        // Falling mode: items start stacked above the box and drop in. The top wall waits until they are all inside.
        const dropIn = !float && !reducedMotion && gravityRef.current.y > 0
        let topPending = dropIn && walls.top
        let wallBodies = buildWalls(box, topPending ? { ...walls, top: false } : walls, inset)
        Matter.Composite.add(engine.world, wallBodies)

        // ----- Items -----
        // Each item gets a rectangle of its own size, dropped at a random spot inside the walls.
        const elements = itemRefs.current.slice(0, itemCount)
        const sizes = elements.map((element): Size => {
            const size = element ? layoutSize(element) : { width: 0, height: 0 }
            // Zero-size rectangles break the physics. Items set to "Fill" have no size here.
            return { width: Math.max(1, size.width), height: Math.max(1, size.height) }
        })
        const area = innerArea(box, walls, inset)
        let stackTop = area.top - 20
        const bodies = elements.map((element, i) => {
            if (!element) return null
            const { width, height } = sizes[i]
            let y = randomCenter(height, area.top, area.bottom)
            if (dropIn) {
                y = stackTop - height / 2
                stackTop -= height + 20
            }
            return Matter.Bodies.rectangle(
                randomCenter(width, area.left, area.right),
                y,
                width,
                height,
                {
                    density: density.enable ? density.density : 0.001,
                    friction: friction.friction,
                    frictionAir: friction.frictionAir,
                    restitution: float ? FLOAT_BOUNCE : 0,
                    // Group 0 is Matter's normal "collide with everything" setting.
                    collisionFilter: { group: itemsCollide ? 0 : NO_COLLIDE_GROUP },
                },
            )
        })
        const liveBodies = bodies.filter((body): body is Matter.Body => body !== null)
        Matter.Composite.add(engine.world, liveBodies)

        // Floating items start off in a random direction, at their drift speed.
        if (drifting) {
            for (const body of liveBodies) {
                const angle = Math.random() * Math.PI * 2
                const speed = FLOAT_BASE_SPEED * floatSpeedRef.current
                Matter.Body.setVelocity(body, { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed })
            }
        }

        // A physics shape is centered on its center of mass, which for an outline is not the middle
        // of the item. This is that difference per item (px, item space), used to place the element.
        const massOffsets: Point[] = bodies.map(() => ({ x: 0, y: 0 }))

        /** Where the middle of item i is right now, in box coordinates. */
        const itemCenter = (i: number): Point => {
            const body = bodies[i]!
            const offset = massOffsets[i]
            const cos = Math.cos(body.angle)
            const sin = Math.sin(body.angle)
            return {
                x: body.position.x - (offset.x * cos - offset.y * sin),
                y: body.position.y - (offset.x * sin + offset.y * cos),
            }
        }

        // Moves every item's element to match its shape. Transform only, so the browser never re-lays out.
        const paint = () => {
            bodies.forEach((body, i) => {
                const element = elements[i]
                if (!body || !element) return
                const center = itemCenter(i)
                const left = center.x - sizes[i].width / 2
                const top = center.y - sizes[i].height / 2
                element.style.transform = `translate(${left.toFixed(2)}px, ${top.toFixed(2)}px) rotate(${body.angle.toFixed(4)}rad)`
                element.style.visibility = "visible"
                element.style.opacity = "1"
            })
        }

        // ----- Debug drawing -----
        // Drawn on its own layer behind the items, so it never becomes one of the falling items.
        let render: Matter.Render | null = null
        if (debug && debugLayerRef.current) {
            render = Matter.Render.create({
                element: debugLayerRef.current,
                engine,
                options: {
                    width: box.width,
                    height: box.height,
                    showAngleIndicator: true,
                    showVelocity: true,
                    wireframes: false,
                    background: "transparent",
                },
            })
            Matter.Render.run(render)
        }

        // ----- Grabbing with mouse or finger -----
        // Matter's own mouse listeners are attached to a detached element, so they never fire.
        // Pointer events below drive it instead: one code path for mouse, pen and touch.
        let mouse: Matter.Mouse | null = null
        let mouseConstraint: Matter.MouseConstraint | null = null
        if (grabEnabled) {
            mouse = Matter.Mouse.create(document.createElement("div"))
            mouseConstraint = Matter.MouseConstraint.create(engine, {
                mouse,
                // angularStiffness is supported by Matter.js but missing from its type definitions.
                constraint: {
                    stiffness: mouseSettings.stiffness,
                    angularStiffness: mouseSettings.angularStiffness,
                } as Matter.IConstraintDefinition,
            })
            Matter.Composite.add(engine.world, mouseConstraint)
        }

        // ----- Float mode: steer every item before each physics step -----
        // The item being held is left alone, so the visitor's hand always wins.
        const steerAll = () => {
            const speed = FLOAT_BASE_SPEED * Math.max(0, floatSpeedRef.current)
            const held = mouseConstraint?.body
            for (const body of liveBodies) if (body !== held) steerFloating(body, speed)
        }
        if (drifting) Matter.Events.on(engine, "beforeUpdate", steerAll)

        // Close the top wall once every item has come in through it.
        const closeTop = () => {
            if (!liveBodies.every((body) => body.bounds.min.y >= area.top)) return
            topPending = false
            Matter.Events.off(engine, "beforeUpdate", closeTop)
            Matter.Composite.remove(engine.world, wallBodies)
            wallBodies = buildWalls(box, walls, inset)
            Matter.Composite.add(engine.world, wallBodies)
        }
        if (topPending) Matter.Events.on(engine, "beforeUpdate", closeTop)

        // ----- Animation loop -----
        let frame = 0
        let lastTime = 0
        let leftover = 0
        let onScreen = true
        let pressed = false

        const tick = (now: number) => {
            frame = 0
            // Run as many fixed 1/60 s steps as real time has passed.
            const elapsed = lastTime ? Math.min(now - lastTime, 100) : STEP_MS
            lastTime = now
            leftover += elapsed
            let steps = 0
            while (leftover >= STEP_MS && steps < MAX_STEPS_PER_FRAME) {
                Matter.Engine.update(engine, STEP_MS)
                leftover -= STEP_MS
                steps++
            }
            if (steps === MAX_STEPS_PER_FRAME) leftover = 0
            paint()

            // Stop once everything rests. Any interaction, resize or gravity change restarts it.
            // Floating items never rest, so the loop keeps going (it still pauses off screen).
            const settled = !pressed && !drifting && liveBodies.every((body) => body.isSleeping)
            if (onScreen && !settled) frame = requestAnimationFrame(tick)
            else lastTime = 0
        }

        const kick = () => {
            if (frame || !onScreen) return
            lastTime = 0
            frame = requestAnimationFrame(tick)
        }
        kickRef.current = kick

        // With "reduce motion" on, items appear already settled instead of falling.
        if (reducedMotion) {
            for (let i = 0; i < SETTLE_STEPS; i++) Matter.Engine.update(engine, STEP_MS)
            paint()
        } else {
            kick()
        }

        // ----- Pause while off screen -----
        let visibilityObserver: IntersectionObserver | null = null
        if (typeof IntersectionObserver !== "undefined") {
            visibilityObserver = new IntersectionObserver(([entry]) => {
                onScreen = entry.isIntersecting
                if (onScreen) {
                    kick()
                } else if (frame) {
                    cancelAnimationFrame(frame)
                    frame = 0
                }
            })
            visibilityObserver.observe(container)
        }

        // ----- Resize: move the walls and pull stray items back in -----
        let resizeObserver: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(() => {
                const next = layoutSize(container)
                if (next.width === box.width && next.height === box.height) return
                box = next
                Matter.Composite.remove(engine.world, wallBodies)
                wallBodies = buildWalls(box, topPending ? { ...walls, top: false } : walls, inset)
                Matter.Composite.add(engine.world, wallBodies)

                const nextArea = innerArea(box, walls, inset)
                bodies.forEach((body, i) => {
                    if (!body) return
                    const x = clamp(
                        body.position.x,
                        nextArea.left + sizes[i].width / 2,
                        nextArea.right - sizes[i].width / 2,
                    )
                    const y = clamp(
                        body.position.y,
                        nextArea.top + sizes[i].height / 2,
                        nextArea.bottom - sizes[i].height / 2,
                    )
                    if (x !== body.position.x || y !== body.position.y) Matter.Body.setPosition(body, { x, y })
                    Matter.Sleeping.set(body, false)
                })
                kick()
            })
            resizeObserver.observe(container)
        }

        // ----- Collision shapes -----
        let disposed = false
        // Bumped for every new shape request, so a slow, outdated outline never replaces a newer one.
        const shapeVersions = bodies.map(() => 0)

        /** Swaps item i's physics shape for new corner points (px, around the item's middle). */
        const setShape = (i: number, points: Point[]) => {
            const body = bodies[i]
            if (!body) return
            const center = itemCenter(i)
            const angle = body.angle
            // Build the new shape upright, then turn it back to the item's current angle.
            Matter.Body.setAngle(body, 0)
            Matter.Body.setVertices(body, points)
            const massCenter = Matter.Vertices.centre(points)
            massOffsets[i] = massCenter
            Matter.Body.setPosition(body, { x: center.x + massCenter.x, y: center.y + massCenter.y })
            Matter.Body.setAngle(body, angle)
            Matter.Sleeping.set(body, false)
        }

        /** Shows the latest shapes right away (settled first when "reduce motion" is on). */
        const afterShapeChange = () => {
            if (reducedMotion) {
                for (let i = 0; i < SETTLE_STEPS; i++) Matter.Engine.update(engine, STEP_MS)
            }
            paint()
            kick()
        }

        /**
         * Updates item i's shape. A resized item gets its new rectangle right away; with "Outline",
         * the outline follows once the images are read (the old shape stays until then, so nothing pops).
         */
        const refreshShape = (i: number, resized: boolean) => {
            const element = elements[i]
            if (!element || !bodies[i]) return
            if (resized) setShape(i, boxOutline(sizes[i]))
            if (collisionShape !== "outline") return
            const version = ++shapeVersions[i]
            itemOutline(element, sizes[i]).then((outline) => {
                if (disposed || !outline || version !== shapeVersions[i]) return
                setShape(i, outline)
                afterShapeChange()
            })
        }

        // Items start as rectangles (created above); swap in the outlines as soon as they are known.
        if (collisionShape === "outline") elements.forEach((_, i) => refreshShape(i, false))

        // ----- Item size changes: rebuild its physics shape to match -----
        // Items can change size after the start, for example a sticker that only knows its
        // proportions once its image has loaded. Without this, the shape keeps the old size.
        // Images inside are watched too: they can change size or crop while the item stays the same.
        let itemObserver: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            itemObserver = new ResizeObserver(() => {
                let changed = false
                elements.forEach((element, i) => {
                    if (!element || !bodies[i]) return
                    const next = layoutSize(element)
                    const width = Math.max(1, next.width)
                    const height = Math.max(1, next.height)
                    const old = sizes[i]
                    const resized = Math.abs(width - old.width) >= 0.5 || Math.abs(height - old.height) >= 0.5
                    sizes[i] = { width, height }
                    // Outlines are re-read on any change inside the item; rectangles only when the item resizes.
                    if (resized || collisionShape === "outline") {
                        refreshShape(i, resized)
                        changed = true
                    }
                })
                if (changed) afterShapeChange()
            })
            for (const element of elements) {
                if (!element) continue
                itemObserver.observe(element)
                if (collisionShape === "outline") {
                    for (const image of Array.from(element.querySelectorAll("img"))) itemObserver.observe(image)
                }
            }
        }

        // ----- Pointer handling -----
        let downX = 0
        let downY = 0
        let dragged = false

        // Converts a screen position into the box's own coordinates (handles canvas zoom and scaling).
        const moveMouse = (event: PointerEvent) => {
            if (!mouse) return
            const rect = container.getBoundingClientRect()
            const scaleX = rect.width ? container.offsetWidth / rect.width : 1
            const scaleY = rect.height ? container.offsetHeight / rect.height : 1
            const x = (event.clientX - rect.left) * scaleX
            const y = (event.clientY - rect.top) * scaleY
            mouse.absolute.x = x
            mouse.absolute.y = y
            mouse.position.x = x
            mouse.position.y = y
        }

        const handlePointerDown = (event: PointerEvent) => {
            if (!mouse) return
            if (event.pointerType === "mouse" && event.button !== 0) return
            moveMouse(event)
            mouse.button = 0
            pressed = true
            dragged = false
            downX = event.clientX
            downY = event.clientY
            kick()
        }

        const handlePointerMove = (event: PointerEvent) => {
            if (!pressed) return
            moveMouse(event)
            if (Math.hypot(event.clientX - downX, event.clientY - downY) > DRAG_CLICK_THRESHOLD) dragged = true
            kick()
        }

        // Letting go, or leaving the box, drops the item (so it is never pulled through a wall).
        const handlePointerUp = () => {
            if (!mouse || !pressed) return
            mouse.button = -1
            pressed = false
            kick()
        }

        // A drag must never count as a click on a link inside an item.
        const handleClick = (event: MouseEvent) => {
            if (!dragged) return
            event.preventDefault()
            event.stopPropagation()
            dragged = false
        }

        // Stops the browser's own image dragging, which would fight with grabbing.
        const handleDragStart = (event: DragEvent) => event.preventDefault()

        if (mouse) {
            container.addEventListener("pointerdown", handlePointerDown)
            container.addEventListener("pointermove", handlePointerMove)
            container.addEventListener("pointerup", handlePointerUp)
            container.addEventListener("pointercancel", handlePointerUp)
            container.addEventListener("pointerleave", handlePointerUp)
            container.addEventListener("click", handleClick, true)
        }
        container.addEventListener("dragstart", handleDragStart)

        // ----- Cleanup: remove everything this world added -----
        return () => {
            if (frame) cancelAnimationFrame(frame)
            visibilityObserver?.disconnect()
            resizeObserver?.disconnect()
            itemObserver?.disconnect()
            disposed = true
            container.removeEventListener("pointerdown", handlePointerDown)
            container.removeEventListener("pointermove", handlePointerMove)
            container.removeEventListener("pointerup", handlePointerUp)
            container.removeEventListener("pointercancel", handlePointerUp)
            container.removeEventListener("pointerleave", handlePointerUp)
            container.removeEventListener("click", handleClick, true)
            container.removeEventListener("dragstart", handleDragStart)
            if (render) {
                Matter.Render.stop(render)
                render.canvas.remove()
            }
            Matter.Composite.clear(engine.world, false)
            if (drifting) Matter.Events.off(engine, "beforeUpdate", steerAll)
            Matter.Engine.clear(engine)
            engineRef.current = null
            kickRef.current = () => {}
        }
        // The nested settings are listed one by one, because their objects are new on every render.
    }, [
        started,
        itemCount,
        walls.top,
        walls.bottom,
        walls.left,
        walls.right,
        inset,
        grabEnabled,
        mouseSettings.stiffness,
        mouseSettings.angularStiffness,
        friction.friction,
        friction.frictionAir,
        density.enable,
        density.density,
        debug,
        reducedMotion,
        float,
        itemsCollide,
        collisionShape,
    ])

    // -----------------------------------------------------------------------
    // Live gravity
    // -----------------------------------------------------------------------
    useEffect(() => {
        gravityRef.current = { x: gravX, y: gravY }
        const engine = engineRef.current
        // Floating items ignore gravity, so there is nothing to update.
        if (!engine || float) return
        engine.gravity.x = gravX
        engine.gravity.y = gravY
        // Sleeping items ignore gravity, so wake them up to feel the change.
        for (const body of Matter.Composite.allBodies(engine.world)) {
            if (!body.isStatic) Matter.Sleeping.set(body, false)
        }
        kickRef.current()
    }, [gravX, gravY, float])

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    // Static fallback: items sit in a simple row-wrap along the bottom, no physics.
    const staticItemStyle: CSSProperties = { position: "relative", flex: "none" }
    const itemStyle: CSSProperties = isStatic
        ? staticItemStyle
        : {
        position: "absolute",
        left: 0,
        top: 0,
        // Hidden until the physics places it, so items never flash in the corner.
        visibility: "hidden",
        // Fades in, so floating items never pop into place.
        opacity: 0,
        transition: "opacity 0.5s ease-out",
        willChange: "transform",
        // A finger on an item grabs it. A finger on empty space still scrolls the page.
        touchAction: grabEnabled ? "none" : "auto",
        userSelect: grabEnabled ? "none" : undefined,
        WebkitUserSelect: grabEnabled ? "none" : undefined,
          }

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                ...(isStatic && { display: "flex", flexWrap: "wrap", alignItems: "flex-end", alignContent: "flex-end", gap: 8, padding: 8 }),
                ...style,
            }}
        >
            <div ref={debugLayerRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

            {items.map((item, i) => (
                <div
                    key={i}
                    ref={(node) => void (itemRefs.current[i] = node)}
                    // Keep this class name: StickerCurl looks for it to switch its own dragging off in here.
                    className="physics-body"
                    draggable={false}
                    onClick={(e) => openBox(i, e)}
                    style={itemStyle}
                >
                    {item}
                </div>
            ))}

            {boxed &&
                createPortal(
                    <div
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Enlarged item. Press Escape to close."
                        tabIndex={-1}
                        onClick={() => setBoxed(null)}
                        style={{
                            outline: "none",
                            position: "fixed",
                            inset: 0,
                            zIndex: 2147483000,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(0, 0, 0, 0.72)",
                            cursor: "zoom-out",
                            animation: "gravitybox-fade 0.2s ease-out",
                        }}
                    >
                        <style>{"@keyframes gravitybox-fade{from{opacity:0}to{opacity:1}}"}</style>
                        <div
                            style={{
                                width: boxed.w,
                                height: boxed.h,
                                flex: "none",
                                transform: `scale(${Math.min(6, (window.innerWidth * 0.86) / boxed.w, (window.innerHeight * 0.86) / boxed.h)})`,
                                pointerEvents: "none",
                            }}
                        >
                            {items[boxed.index]}
                        </div>
                    </div>,
                    document.body
                )}

            {/* Canvas-only hint when no items are added yet */}
            {isCanvas && itemCount === 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 16,
                        textAlign: "center",
                        font: "500 13px/1.4 Inter, system-ui, sans-serif",
                        color: "rgba(0, 0, 0, 0.45)",
                        background: "rgba(0, 0, 0, 0.04)",
                        pointerEvents: "none",
                    }}
                >
                    Add items in the panel. Give each one a fixed size.
                </div>
            )}
        </div>
    )
}

// ---------------------------------------------------------------------------
// Property controls
// Order follows how a designer works: items, motion, walls, grabbing, then fine tuning.
// Titles are in English. The prop names (keys) are unchanged, so existing instances keep their settings.
// Settings that do nothing in the current setup are hidden.
// ---------------------------------------------------------------------------

/** True when every wall is switched off, so the inset has nothing to move. */
const noWalls = (props: PhysicsProps) => {
    const walls = { ...DEFAULT_WALLS, ...props.wallOptions }
    return !walls.top && !walls.bottom && !walls.left && !walls.right
}

addPropertyControls(GravityBox, {
    // ----- Items -----
    children: {
        type: ControlType.Array,
        control: {
            type: ControlType.ComponentInstance,
        },
        title: "Items",
        description: "Give each item a fixed size. Items set to Fill have no size to simulate.",
    },
    collisionShape: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["outline", "box"],
        optionTitles: ["Outline", "Box"],
        defaultValue: "outline",
        displaySegmentedControl: true,
        description:
            "Outline follows the visible pixels of images in each item, wrapped like a rubber band. Box uses the item's frame.",
    },

    lightbox: {
        type: ControlType.Boolean,
        title: "Lightbox",
        defaultValue: false,
        description: "Clicking an item shows it large. Items that hold a link keep their link. Click or press Esc to close.",
    },

    // ----- Motion -----
    float: {
        type: ControlType.Boolean,
        title: "Float",
        defaultValue: false,
        description: "Items drift around on their own, with no gravity.",
    },
    floatSpeed: {
        type: ControlType.Number,
        title: "Float Speed",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
        displayStepper: true,
        description: "1 is calm. Higher is faster.",
        hidden: (props: PhysicsProps) => !props.float,
    },
    collide: {
        type: ControlType.Boolean,
        title: "Collisions",
        defaultValue: true,
        description: "Off lets items pass through each other. They still bounce off the walls.",
        hidden: (props: PhysicsProps) => !props.float,
    },
    gravY: {
        type: ControlType.Number,
        defaultValue: 1,
        max: 5,
        min: -5,
        // Small steps, because floaty values like 0.05 look great.
        step: 0.05,
        title: "Gravity Y",
        description: "Positive pulls down, negative pulls up.",
        displayStepper: true,
        hidden: (props: PhysicsProps) => props.float === true,
    },
    gravX: {
        type: ControlType.Number,
        defaultValue: 0,
        max: 5,
        min: -5,
        step: 0.05,
        title: "Gravity X",
        description: "Positive pulls right, negative pulls left.",
        displayStepper: true,
        hidden: (props: PhysicsProps) => props.float === true,
    },

    // ----- Walls -----
    wallOptions: {
        title: "Walls",
        type: ControlType.Object,
        controls: {
            top: {
                type: ControlType.Boolean,
                defaultValue: true,
                title: "Top",
            },
            bottom: {
                type: ControlType.Boolean,
                defaultValue: true,
                title: "Bottom",
            },
            right: {
                type: ControlType.Boolean,
                defaultValue: true,
                title: "Right",
            },
            left: {
                type: ControlType.Boolean,
                defaultValue: true,
                title: "Left",
            },
        },
    },
    wallInset: {
        type: ControlType.Number,
        title: "Wall Inset",
        defaultValue: DEFAULT_WALL_INSET,
        min: 0,
        max: 300,
        step: 5,
        unit: "px",
        description: "How far the walls sit inside the edges. 0 lets items reach the edges.",
        hidden: noWalls,
    },
    // ----- Grabbing -----
    // Inside an Object control, "hidden" receives that object's own values first.
    mouseOptions: {
        title: "Grab",
        type: ControlType.Object,
        controls: {
            enable: {
                title: "Enable",
                type: ControlType.Boolean,
                defaultValue: true,
                description: "Visitors can grab and throw items with a mouse or finger.",
            },
            stiffness: {
                title: "Strength",
                description: "How tightly a held item follows. Low values feel springy.",
                type: ControlType.Number,
                defaultValue: 0.2,
                min: 0.001,
                max: 1,
                step: 0.01,
                displayStepper: true,
                hidden: (value: MouseOptions) => value?.enable === false,
            },
            angularStiffness: {
                title: "Rotation Lock",
                description: "0 lets items swing while held. 1 stops them from turning.",
                type: ControlType.Number,
                defaultValue: 0,
                min: 0,
                max: 1,
                step: 0.01,
                displayStepper: true,
                hidden: (value: MouseOptions) => value?.enable === false,
            },
        },
    },

    // ----- Fine tuning -----
    frictionOptions: {
        title: "Friction",
        type: ControlType.Object,
        controls: {
            friction: {
                title: "Surface",
                description: "How much items grip each other and the walls.",
                type: ControlType.Number,
                min: 0,
                max: 1,
                defaultValue: 0.1,
                step: 0.01,
                displayStepper: true,
            },
            frictionAir: {
                title: "Air",
                description: "Higher values slow items down, like moving through water.",
                type: ControlType.Number,
                min: 0,
                max: 1,
                defaultValue: 0.01,
                step: 0.01,
                displayStepper: true,
            },
        },
    },
    densityOptions: {
        title: "Weight",
        type: ControlType.Object,
        controls: {
            enable: {
                type: ControlType.Boolean,
                defaultValue: true,
                title: "Custom",
                description: "Off uses the standard weight. Bigger items are always heavier.",
            },
            density: {
                title: "Density",
                description: "Heavier items push lighter ones around more.",
                type: ControlType.Number,
                defaultValue: 0.001,
                min: 0.001,
                max: 1,
                // Fine steps, because useful values are small (0.001 to 0.05).
                step: 0.001,
                displayStepper: true,
                hidden: (value: DensityOptions) => value?.enable === false,
            },
        },
    },
    respectReducedMotion: {
        type: ControlType.Boolean,
        title: "Reduced Motion",
        enabledTitle: "Respect",
        disabledTitle: "Ignore",
        defaultValue: false,
        description: "Respect: if the visitor's system asks for less motion, items stay still. Ignore: they always move.",
    },
    debug: {
        type: ControlType.Boolean,
        title: "Show Physics",
        defaultValue: false,
        description: "Draws the physics shapes and walls behind the items. Turn off before publishing.\n\nCrafted and developed by [REFROC](https://www.refrocdsg.com/)",
    },
})
