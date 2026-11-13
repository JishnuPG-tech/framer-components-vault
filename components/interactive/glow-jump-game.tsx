// Glow Jump Game - Framer Platformer Widget
import {
    useState,
    useEffect,
    useRef,
    type KeyboardEvent,
    type PointerEvent,
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


type PopupPosition = "bottom-right" | "bottom-left"

interface GlowJumpGameProps {
    width?: number
    height?: number
    position?: PopupPosition
    defaultOpen?: boolean
}

type Keys = { left: boolean; up: boolean; right: boolean }
type FieldType = "wall" | "lava"

const LEVELS = [
    // Level 1 - Başlangıç
    [
        "                                                                 ",
        "                                                                 ",
        "                                                                 ",
        "                                                                 ",
        "                                                                 ",
        "                    o          o                                 ",
        "                                                                 ",
        "                 xxxxx      xxxxx                                ",
        "                                                                 ",
        "                                                                 ",
        "        o                                                        ",
        "      xxxxx                                                      ",
        "                                                                 ",
        "  @                                                              ",
        "xxxxx                    xxxxxxxxxxxxxxxxxxxxx                   ",
        "                                                                 ",
    ],

    // Level 2 - Zıplama parkuru
    [
        "                                                                 ",
        "                                                                 ",
        "                                              o                  ",
        "                                           xxxxx                 ",
        "                                                                 ",
        "                                    o                            ",
        "                                 xxxxx                           ",
        "                                                                 ",
        "                          o                                      ",
        "                       xxxxx                                     ",
        "                                                                 ",
        "                o                                                ",
        "             xxxxx                                               ",
        "  @                                                              ",
        "xxxxx     xxxxx     xxxxx     xxxxx     xxxxx                    ",
        "                                                                 ",
    ],

    // Level 3 - Düzgün tasarlanmış
    [
        "                                                                 ",
        "                                                                 ",
        "                                                                 ",
        "                                                                 ",
        "         o                                      o                ",
        "      xxxxx                                  xxxxx               ",
        "                                                                 ",
        "                                                                 ",
        "                   o                                o             ",
        "                xxxxx                             xxxx           ",
        "                                                                 ",
        "  @           =                                                  ",
        "xxxxx     xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx     xxxxx      ",
        "                                                                 ",
        "                                                                 ",
        "                                                                 ",
    ],

    // Level 4 - Final
    [
        "                                                                 ",
        "                                                                 ",
        "                                                                 ",
        "         o     o     o     o     o     o     o                   ",
        "       xxxxx xxxxx xxxxx x  x     xx  xx     xx                  ",
        "                                                                 ",
        "                                                   xx            ",
        "                                                                 ",
        "              =           =           =                          ",
        "                                                       xx        ",
        "                                                                 ",
        "   o                                                         o   ",
        "x  xx                                                       xxxxx",
        "  @                                                              ",
        "xxxxx     xxxxx     xxxxx     xxxxx     xxxxx     xxxxx     xxxxx",
        "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!",
    ],
]

class Vector {
    x: number
    y: number
    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }
    plus(other: Vector) {
        return new Vector(this.x + other.x, this.y + other.y)
    }
    times(scale: number) {
        return new Vector(this.x * scale, this.y * scale)
    }
}

class Player {
    pos: Vector
    size: Vector
    speed: Vector
    type = "player" as const
    constructor(pos: Vector) {
        this.pos = pos.plus(new Vector(0, -0.5))
        this.size = new Vector(0.6, 0.9)
        this.speed = new Vector(0, 0)
    }
}
// Methods are attached to the prototype further below (Eloquent JS style).
// Declared via interface merging, not class fields, so no `undefined` own
// property is created on the instance that would shadow the prototype method.
interface Player {
    act: (step: number, level: Level, keys: Keys) => void
    moveX: (step: number, level: Level, keys: Keys) => void
    moveY: (step: number, level: Level, keys: Keys) => void
}

class Lava {
    pos: Vector
    size: Vector
    speed: Vector
    repeatPos?: Vector
    type = "lava" as const
    constructor(pos: Vector, ch: string) {
        this.pos = pos
        this.size = new Vector(1, 1)
        if (ch === "=") this.speed = new Vector(2.2, 0)
        else if (ch === "|") this.speed = new Vector(0, 2.2)
        else {
            this.speed = new Vector(0, 3)
            this.repeatPos = pos
        }
    }
}
interface Lava {
    act: (step: number, level: Level, keys: Keys) => void
}

class Coin {
    pos: Vector
    basePos: Vector
    size: Vector
    wobble: number
    type = "coin" as const
    constructor(pos: Vector) {
        this.basePos = this.pos = pos.plus(new Vector(0, 0))
        this.size = new Vector(1, 1)
        this.wobble = Math.random() * Math.PI * 2
    }
}
interface Coin {
    act: (step: number, level: Level, keys: Keys) => void
}

type ActorType = Player | Lava | Coin

const actorChars: Record<string, new (pos: Vector, ch: string) => ActorType> = {
    "@": Player,
    o: Coin,
    "=": Lava,
    "|": Lava,
    v: Lava,
}

class Level {
    width: number
    height: number
    grid: (FieldType | null)[][]
    actors: ActorType[]
    player: Player
    status: string | null = null
    finishDelay: number | null = null

    constructor(plan: string[]) {
        this.width = plan[0].length
        this.height = plan.length
        this.grid = []
        this.actors = []

        for (let y = 0; y < this.height; y++) {
            const line = plan[y]
            const gridLine: (FieldType | null)[] = []
            for (let x = 0; x < this.width; x++) {
                const ch = line[x]
                let fieldType: FieldType | null = null
                const Actor = actorChars[ch]
                if (Actor) {
                    this.actors.push(new Actor(new Vector(x, y), ch))
                } else if (ch === "x") {
                    fieldType = "wall"
                } else if (ch === "!") {
                    fieldType = "lava"
                }
                gridLine.push(fieldType)
            }
            this.grid.push(gridLine)
        }
        this.player = this.actors.find((a) => a.type === "player") as Player
    }

    isFinished() {
        return this.status != null && this.finishDelay! < 0
    }
}
interface Level {
    obstacleAt: (pos: Vector, size: Vector) => FieldType | undefined
    actorAt: (actor: ActorType) => ActorType | undefined
    animate: (step: number, keys: Keys) => void
    playerTouched: (type: string, actor?: ActorType) => void
}

const scale = 18

function createElement(name: string, className?: string) {
    const el = document.createElement(name)
    if (className) el.className = className
    return el
}

class DOMDisplay {
    wrap: HTMLElement
    level: Level
    actorLayer: HTMLElement | null = null

    constructor(parent: HTMLElement, level: Level) {
        this.wrap = parent.appendChild(
            createElement("div", "stage")
        ) as HTMLElement
        this.level = level
        this.wrap.appendChild(this.drawBackground())
        this.drawFrame()
    }

    drawBackground() {
        const table = createElement("table", "background") as HTMLTableElement
        table.style.width = this.level.width * scale + "px"
        table.style.height = this.level.height * scale + "px"
        this.level.grid.forEach((row) => {
            const rowEl = table.appendChild(
                createElement("tr")
            ) as HTMLTableRowElement
            rowEl.style.height = scale + "px"
            row.forEach((type) => {
                rowEl.appendChild(createElement("td", type || undefined))
            })
        })
        return table
    }

    drawActors() {
        const wrap = createElement("div")
        this.level.actors.forEach((actor) => {
            const rect = wrap.appendChild(
                createElement("div", "actor " + actor.type)
            ) as HTMLElement
            rect.style.width = actor.size.x * scale + "px"
            rect.style.height = actor.size.y * scale + "px"
            rect.style.left = actor.pos.x * scale + "px"
            rect.style.top = actor.pos.y * scale + "px"
        })
        return wrap
    }

    drawFrame() {
        if (this.actorLayer) this.wrap.removeChild(this.actorLayer)
        this.actorLayer = this.wrap.appendChild(
            this.drawActors()
        ) as HTMLElement
        this.wrap.className = "stage " + (this.level.status || "")
        this.scrollPlayerIntoView()
    }

    scrollPlayerIntoView() {
        const width = this.wrap.clientWidth
        const height = this.wrap.clientHeight
        const margin = width / 3
        const left = this.wrap.scrollLeft
        const right = left + width
        const top = this.wrap.scrollTop
        const bottom = top + height

        const player = this.level.player
        const center = player.pos.plus(player.size.times(0.5)).times(scale)

        if (center.x < left + margin) this.wrap.scrollLeft = center.x - margin
        else if (center.x > right - margin)
            this.wrap.scrollLeft = center.x + margin - width
        if (center.y < top + margin) this.wrap.scrollTop = center.y - margin
        else if (center.y > bottom - margin)
            this.wrap.scrollTop = center.y + margin - height
    }

    clear() {
        if (this.wrap.parentNode) this.wrap.parentNode.removeChild(this.wrap)
    }
}

// ==================== OYUN MANTIĞI ====================

Level.prototype.obstacleAt = function (
    this: Level,
    pos: Vector,
    size: Vector
): FieldType | undefined {
    const xStart = Math.floor(pos.x)
    const xEnd = Math.ceil(pos.x + size.x)
    const yStart = Math.floor(pos.y)
    const yEnd = Math.ceil(pos.y + size.y)

    if (xStart < 0 || xEnd > this.width || yStart < 0) return "wall"
    if (yEnd > this.height) return "lava"

    for (let y = yStart; y < yEnd; y++) {
        for (let x = xStart; x < xEnd; x++) {
            const fieldType = this.grid[y][x]
            if (fieldType) return fieldType
        }
    }
    return undefined
}

Level.prototype.actorAt = function (
    this: Level,
    actor: ActorType
): ActorType | undefined {
    for (const other of this.actors) {
        if (
            other !== actor &&
            actor.pos.x + actor.size.x > other.pos.x &&
            actor.pos.x < other.pos.x + other.size.x &&
            actor.pos.y + actor.size.y > other.pos.y &&
            actor.pos.y < other.pos.y + other.size.y
        ) {
            return other
        }
    }
    return undefined
}

Level.prototype.animate = function (this: Level, step: number, keys: Keys) {
    if (this.status != null) this.finishDelay! -= step

    while (step > 0) {
        const thisStep = Math.min(step, 0.05)
        this.actors.forEach((actor) => actor.act(thisStep, this, keys))
        step -= thisStep
    }
}

Lava.prototype.act = function (this: Lava, step: number, level: Level) {
    const newPos = this.pos.plus(this.speed.times(step))
    if (!level.obstacleAt(newPos, this.size)) {
        this.pos = newPos
    } else if (this.repeatPos) {
        this.pos = this.repeatPos
    } else {
        this.speed = this.speed.times(-1)
    }
}

Coin.prototype.act = function (this: Coin, step: number) {
    this.wobble += step * 9
    const wobblePos = Math.sin(this.wobble) * 0.08
    this.pos = this.basePos.plus(new Vector(0, wobblePos))
}

Player.prototype.moveX = function (
    this: Player,
    step: number,
    level: Level,
    keys: Keys
) {
    this.speed.x = 0
    if (keys.left) this.speed.x -= 11
    if (keys.right) this.speed.x += 11

    const motion = new Vector(this.speed.x * step, 0)
    const newPos = this.pos.plus(motion)
    const obstacle = level.obstacleAt(newPos, this.size)
    if (obstacle) level.playerTouched(obstacle)
    else this.pos = newPos
}

Player.prototype.moveY = function (
    this: Player,
    step: number,
    level: Level,
    keys: Keys
) {
    this.speed.y += step * 32
    const motion = new Vector(0, this.speed.y * step)
    const newPos = this.pos.plus(motion)
    const obstacle = level.obstacleAt(newPos, this.size)
    if (obstacle) {
        level.playerTouched(obstacle)
        if (keys.up && this.speed.y > 0) this.speed.y = -18
        else this.speed.y = 0
    } else {
        this.pos = newPos
    }
}

Player.prototype.act = function (
    this: Player,
    step: number,
    level: Level,
    keys: Keys
) {
    this.moveX(step, level, keys)
    this.moveY(step, level, keys)

    const otherActor = level.actorAt(this)
    if (otherActor) level.playerTouched(otherActor.type, otherActor)

    if (level.status === "lost") {
        this.pos.y += step
        this.size.y -= step
    }
}

Level.prototype.playerTouched = function (
    this: Level,
    type: string,
    actor?: ActorType
) {
    if (type === "lava" && this.status == null) {
        this.status = "lost"
        this.finishDelay = 1
    } else if (type === "coin") {
        this.actors = this.actors.filter((other) => other !== actor)
        if (!this.actors.some((a) => a.type === "coin")) {
            this.status = "won"
            this.finishDelay = 1
        }
    }
}

const ARROW_KEYS: Record<string, keyof Keys> = {
    ArrowLeft: "left",
    ArrowUp: "up",
    ArrowRight: "right",
}

const JumpIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect
            x="4"
            y="13"
            width="7"
            height="7"
            rx="2"
            fill="white"
            fillOpacity="0.9"
        />
        <path
            d="M13 17L20 10M20 10H14M20 10V16"
            stroke="white"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

/**
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 480
 */
export default function glowJumpGame(props: GlowJumpGameProps) {
    const {
        width,
        height,
        position = "bottom-right",
        defaultOpen = false,
    } = props

    const isStatic = useIsStaticRenderer()

    const [isOpen, setIsOpen] = useState(defaultOpen)
    const [levelNumber, setLevelNumber] = useState(1)
    const [statusText, setStatusText] = useState("")

    const rootRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const keysRef = useRef<Keys>({ left: false, up: false, right: false })
    const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (isStatic || !isOpen || !containerRef.current) return

        const container = containerRef.current
        let stopAnimation: number | null = null
        let currentDisplay: DOMDisplay | null = null

        function runLevel(level: Level, andThen: (status: string) => void) {
            currentDisplay = new DOMDisplay(container, level)

            let lastTime: number | null = null
            function frame(time: number) {
                if (lastTime !== null) {
                    const step = Math.min(time - lastTime, 100) / 1000
                    level.animate(step, keysRef.current)
                    currentDisplay!.drawFrame()

                    if (level.isFinished()) {
                        currentDisplay!.clear()
                        currentDisplay = null
                        andThen(level.status!)
                        return
                    }
                }
                lastTime = time
                stopAnimation = requestAnimationFrame(frame)
            }
            stopAnimation = requestAnimationFrame(frame)
        }

        function startLevel(n: number) {
            setLevelNumber(n + 1)
            runLevel(new Level(LEVELS[n]), (status) => {
                if (status === "lost") {
                    startLevel(n)
                } else if (n < LEVELS.length - 1) {
                    startLevel(n + 1)
                } else {
                    setStatusText("Tüm bölümler tamamlandı!")
                    if (statusTimerRef.current)
                        clearTimeout(statusTimerRef.current)
                    statusTimerRef.current = setTimeout(
                        () => setStatusText(""),
                        2000
                    )
                    startLevel(0)
                }
            })
        }

        startLevel(0)
        const focusFrame = requestAnimationFrame(() => {
            panelRef.current?.focus({ preventScroll: true })
        })

        return () => {
            cancelAnimationFrame(focusFrame)
            if (stopAnimation) cancelAnimationFrame(stopAnimation)
            if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
            if (currentDisplay) currentDisplay.clear()
            container.innerHTML = ""
            keysRef.current = { left: false, up: false, right: false }
        }
    }, [isOpen, isStatic])

    const refocusPanel = () => {
        panelRef.current?.focus({ preventScroll: true })
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        const dir = ARROW_KEYS[e.key]
        if (dir) {
            keysRef.current[dir] = true
            e.preventDefault()
        }
    }

    const handleKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
        const dir = ARROW_KEYS[e.key]
        if (dir) {
            keysRef.current[dir] = false
            e.preventDefault()
        }
    }

    const setTouchKey =
        (dir: keyof Keys, value: boolean) =>
        (e: PointerEvent<HTMLButtonElement>) => {
            e.preventDefault()
            keysRef.current[dir] = value
        }

    return (
        <div
            className={`widget-root ${isStatic ? "is-static" : ""}`}
            style={{ width, height }}
            ref={rootRef}
        >
            <style>{`
                * { box-sizing: border-box; }

                .widget-root {
                    position: relative;
                    overflow: visible;
                    font-family: Inter, system-ui, sans-serif;
                }

                .widget-root.is-static,
                .widget-root.is-static * {
                    transition: none !important;
                    animation: none !important;
                }

                .fab {
                    position: absolute;
                    bottom: 0;
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    border: none;
                    cursor: pointer;
                    background: linear-gradient(135deg, #00e5ff, #7b61ff);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.35), 0 0 16px rgba(0,229,255,0.5);
                    transition: ${isStatic ? "none" : "transform 0.2s ease, opacity 0.2s ease"};
                    z-index: 10;
                }
                .fab.bottom-right { right: 0; }
                .fab.bottom-left { left: 0; }
                .fab:hover { transform: scale(1.06); }
                .fab.is-hidden {
                    opacity: 0;
                    pointer-events: none;
                    transform: scale(0.8);
                }

                .panel {
                    position: absolute;
                    bottom: 0;
                    width: 100%;
                    height: 100%;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                    opacity: 0;
                    transform: scale(0.85) translateY(12px);
                    pointer-events: none;
                    transition: ${isStatic ? "none" : "transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease"};
                    z-index: 20;
                    background: #0b0b12;
                    color: white;
                    display: flex;
                    flex-direction: column;
                    outline: none;
                }
                .panel.bottom-right { right: 0; transform-origin: bottom right; }
                .panel.bottom-left { left: 0; transform-origin: bottom left; }
                .panel.is-open {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                    pointer-events: auto;
                }

                .header {
                    flex-shrink: 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 14px;
                    background: rgba(255,255,255,0.06);
                    font-size: 13px;
                    font-weight: 600;
                    gap: 12px;
                }

                .title {
                    background: linear-gradient(90deg, #00e5ff, #7b61ff);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .header-right {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .close-btn {
                    background: rgba(255,255,255,0.12);
                    border: none;
                    color: white;
                    width: 26px;
                    height: 26px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 15px;
                    line-height: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .close-btn:hover {
                    background: rgba(255,255,255,0.2);
                }

                .status-banner {
                    position: absolute;
                    top: 46px;
                    left: 0;
                    right: 0;
                    text-align: center;
                    font-size: 12px;
                    font-weight: 600;
                    color: #ffd600;
                    z-index: 30;
                    pointer-events: none;
                }

                .game-area {
                    flex: 1;
                    min-height: 0;
                    position: relative;
                }

                .game-canvas {
                    width: 100%;
                    height: 100%;
                    position: relative;
                }

                .touch-controls {
                    display: none;
                    position: absolute;
                    left: 0;
                    right: 0;
                    bottom: 10px;
                    padding: 0 12px;
                    align-items: flex-end;
                    justify-content: space-between;
                    z-index: 40;
                    pointer-events: none;
                }

                @media (pointer: coarse) {
                    .touch-controls {
                        display: flex;
                    }
                }

                .touch-group {
                    display: flex;
                    gap: 10px;
                    pointer-events: auto;
                }

                .touch-btn {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    border: none;
                    background: rgba(255,255,255,0.14);
                    color: white;
                    font-size: 22px;
                    line-height: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    touch-action: none;
                    user-select: none;
                    pointer-events: auto;
                }
                .touch-btn:active {
                    background: rgba(255,255,255,0.28);
                }
                .touch-jump {
                    width: 56px;
                    height: 56px;
                    background: linear-gradient(135deg, #00e5ff, #7b61ff);
                    box-shadow: 0 0 16px rgba(0,229,255,0.5);
                }

                .stage {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    background: linear-gradient(180deg, #0b0b12 0%, #12121f 100%);
                }
                .background {
                    table-layout: fixed;
                    border-spacing: 0;
                }
                .background td {
                    padding: 0;
                }
                .wall {
                    background: linear-gradient(145deg, #2a2a3d, #1e1e2f);
                    border: 2px solid #3d3d55;
                    box-sizing: border-box;
                    border-radius: 4px;
                }
                .lava {
                    background: linear-gradient(180deg, #ff2d55, #ff6b00);
                    box-shadow: 0 0 12px #ff2d55;
                }
                .actor {
                    position: absolute;
                    border-radius: 6px;
                }
                .player {
                    background: linear-gradient(135deg, #00e5ff, #7b61ff);
                    box-shadow: 0 0 16px #00e5ff;
                    border-radius: 8px;
                }
                .coin {
                    background: radial-gradient(circle at 30% 30%, #fffde7, #ffd600 60%, #ffb300);
                    box-shadow: 0 0 22px 4px #ffd600, 0 0 40px 8px rgba(255, 214, 0, 0.5);
                    -webkit-mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140"><path d="M44.6484 33.9922H95.3484V59.3412H69.9984L44.6484 33.9922ZM44.6484 59.3412H69.9984L95.3484 84.6912H44.6484V59.3412ZM44.6484 84.6912H69.9984V110.041L44.6484 84.6912Z" fill="white"/></svg>');
                    mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140"><path d="M44.6484 33.9922H95.3484V59.3412H69.9984L44.6484 33.9922ZM44.6484 59.3412H69.9984L95.3484 84.6912H44.6484V59.3412ZM44.6484 84.6912H69.9984V110.041L44.6484 84.6912Z" fill="white"/></svg>');
                    -webkit-mask-size: contain;
                    mask-size: contain;
                    -webkit-mask-repeat: no-repeat;
                    mask-repeat: no-repeat;
                    -webkit-mask-position: center;
                    mask-position: center;
                }
                .lost .player {
                    background: linear-gradient(135deg, #ff2d55, #ff6b6b);
                    box-shadow: 0 0 20px #ff2d55;
                }
                .won .player {
                    background: linear-gradient(135deg, #00e676, #00c853);
                    box-shadow: 0 0 20px #00e676;
                }
            `}</style>

            {/* Floating trigger button */}
            <button
                className={`fab ${position} ${isOpen ? "is-hidden" : ""}`}
                onClick={() => setIsOpen(true)}
                aria-label="Open Glow Jump game"
            >
                <JumpIcon />
            </button>

            {/* Popup panel */}
            <div
                className={`panel ${position} ${isOpen ? "is-open" : ""}`}
                ref={panelRef}
                tabIndex={0}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                onMouseDown={refocusPanel}
            >
                <div className="header">
                    <span className="title">
                        Glow Jump · Level {levelNumber}/{LEVELS.length}
                    </span>
                    <div className="header-right">
                        <button
                            className="close-btn"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close Glow Jump game"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {statusText && (
                    <div className="status-banner">{statusText}</div>
                )}

                <div className="game-area">
                    <div className="game-canvas" ref={containerRef} />

                    <div className="touch-controls">
                        <div className="touch-group">
                            <button
                                className="touch-btn"
                                aria-label="Move left"
                                onPointerDown={setTouchKey("left", true)}
                                onPointerUp={setTouchKey("left", false)}
                                onPointerLeave={setTouchKey("left", false)}
                                onPointerCancel={setTouchKey("left", false)}
                            >
                                ‹
                            </button>
                            <button
                                className="touch-btn"
                                aria-label="Move right"
                                onPointerDown={setTouchKey("right", true)}
                                onPointerUp={setTouchKey("right", false)}
                                onPointerLeave={setTouchKey("right", false)}
                                onPointerCancel={setTouchKey("right", false)}
                            >
                                ›
                            </button>
                        </div>
                        <button
                            className="touch-btn touch-jump"
                            aria-label="Jump"
                            onPointerDown={setTouchKey("up", true)}
                            onPointerUp={setTouchKey("up", false)}
                            onPointerLeave={setTouchKey("up", false)}
                            onPointerCancel={setTouchKey("up", false)}
                        >
                            ▲
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(glowJumpGame, {
    position: {
        type: ControlType.Enum,
        title: "Popup Side",
        description: "Corner the toggle button and popup panel anchor to.",
        options: ["bottom-right", "bottom-left"],
        optionTitles: ["Bottom Right", "Bottom Left"],
        defaultValue: "bottom-right",
    },
    defaultOpen: {
        type: ControlType.Boolean,
        title: "Open by Default",
        description:
            "Show the game panel expanded instead of collapsed to the button.",
        defaultValue: false,
    },
})
