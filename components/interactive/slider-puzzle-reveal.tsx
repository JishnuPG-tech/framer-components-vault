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


/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

type StartMode = "scrambled" | "image"
type GridMode = "manual" | "auto"
type AutoDensity = "roomy" | "balanced" | "dense" | "custom"
type LayoutMode = "coverSquare" | "squareTiles" | "fillFrame"
type ImageFit = "cover" | "contain" | "stretch"
type RevealMode = "fade" | "none"

type Props = {
    image?: string

    startMode: StartMode
    gridMode: GridMode
    autoDensity: AutoDensity
    autoTileSize: number
    autoMaxColumns: number
    autoMaxRows: number
    columns: number
    rows: number
    lockGrid: boolean
    scrambleMoves: number
    shuffleSeed: number

    layoutMode: LayoutMode
    imageFit: ImageFit

    gap: number
    radius: number
    slideMs: number
    hoverLift: number
    hoverScale: number

    ghostEnabled: boolean
    ghostMs: number
    ghostOpacity: number
    ghostBlur: number
    ghostColor: string
    ghostColorAmount: number

    revealMode: RevealMode
    revealLabel: string
    revealMessage: string
    revealCode: string
    copyLabel: string
    copiedLabel: string
    revealLinkLabel: string
    revealLink: string

    revealFontFamily: string
    messageSize: number
    messageLineHeight: number
    messageWeight: number
    messageLetterSpacing: number
    messageMaxWidth: number
    labelSize: number
    actionSize: number
    contentGap: number

    completionHold: number
    fadeDelayMax: number
    fadeDurationMin: number
    fadeDurationMax: number
    fadeJitter: number
    rewardDelay: number

    imageOpacity: number
    tintOpacity: number
    seamOpacity: number
    blankOpacity: number
    shadowOpacity: number

    background: string
    revealSurface: string
    revealText: string
    revealMuted: string
    revealAction: string
    tint: string
    seam: string
    blank: string
    text: string

    showLaunchButton: boolean
    launchLabel: string
    showControls: boolean
    showStatus: boolean
    showNumbers: boolean
    previewControlsBottom: number
    previewControlsInset: number
    previewControlsScale: number
    rememberSolved: boolean
    storageKey: string

    advanced: boolean
    puzzlePlus: boolean
    motionPlus: boolean
    contentPlus: boolean
    textPlus: boolean
    colorPlus: boolean
    previewPlus: boolean

    reduceMotion: boolean
    style?: React.CSSProperties
}

type BoardMetrics = {
    boardX: number
    boardY: number
    boardW: number
    boardH: number
    cellW: number
    cellH: number
}

type FadeSpec = {
    delay: number
    duration: number
}

type Ghost = {
    id: number
    tileIndex: number
    position: number
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value))
}

function numberOr(value: unknown, fallback: number) {
    return typeof value === "number" && Number.isFinite(value)
        ? value
        : fallback
}

function stringOr(value: unknown, fallback: string) {
    return typeof value === "string" && value.length > 0 ? value : fallback
}

function normalizeHref(value: unknown) {
    const raw = stringOr(value, "").trim()

    if (!raw) return ""

    const lower = raw.toLowerCase()

    if (lower === "home" || lower === "index") return "/"

    if (/^(https?:|mailto:|tel:|sms:|ftp:|#|\/)/i.test(raw)) {
        return raw
    }

    if (/^www\./i.test(raw)) {
        return `https://${raw}`
    }

    if (/^[a-z0-9.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(raw)) {
        return `https://${raw}`
    }

    return `/${raw.replace(/^\/+/, "")}`
}

function isExternalHref(href: string) {
    return /^https?:\/\//i.test(href)
}

function mixColor(color: string, amount: number) {
    return `color-mix(in srgb, ${color} ${clamp(amount, 0, 1) * 100}%, transparent)`
}

function mulberry32(seed: number) {
    let value = seed || 1

    return function random() {
        value |= 0
        value = (value + 0x6d2b79f5) | 0

        let t = Math.imul(value ^ (value >>> 15), 1 | value)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function shuffleNumbers(count: number, random: () => number) {
    const values = Array.from({ length: count }, (_, index) => index)

    for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1))
        const temp = values[i]
        values[i] = values[j]
        values[j] = temp
    }

    return values
}

function makeSolvedBoard(total: number) {
    const board = new Array(total)

    for (let i = 0; i < total - 1; i++) {
        board[i] = i
    }

    board[total - 1] = -1

    return board
}

function getAdjacentPositions(position: number, columns: number, rows: number) {
    const adjacent: number[] = []

    const column = position % columns
    const row = Math.floor(position / columns)

    if (row > 0) adjacent.push(position - columns)
    if (row < rows - 1) adjacent.push(position + columns)
    if (column > 0) adjacent.push(position - 1)
    if (column < columns - 1) adjacent.push(position + 1)

    return adjacent
}

function areAdjacent(a: number, b: number, columns: number) {
    const ax = a % columns
    const ay = Math.floor(a / columns)

    const bx = b % columns
    const by = Math.floor(b / columns)

    return Math.abs(ax - bx) + Math.abs(ay - by) === 1
}

function isSolved(board: number[]) {
    if (board.length <= 1) return true

    for (let i = 0; i < board.length - 1; i++) {
        if (board[i] !== i) return false
    }

    return board[board.length - 1] === -1
}

function makeScrambledBoard(
    columns: number,
    rows: number,
    scrambleMoves: number,
    seed: number
) {
    const total = columns * rows
    const board = makeSolvedBoard(total)
    const random = mulberry32(seed)

    let blankPosition = total - 1
    let previousBlank = -1

    const moves = Math.max(0, Math.round(scrambleMoves))

    for (let i = 0; i < moves; i++) {
        let options = getAdjacentPositions(blankPosition, columns, rows)

        if (options.length > 1) {
            options = options.filter((position) => position !== previousBlank)
        }

        const next =
            options[Math.floor(random() * options.length)] ?? options[0]

        board[blankPosition] = board[next]
        board[next] = -1

        previousBlank = blankPosition
        blankPosition = next
    }

    if (moves > 0 && isSolved(board)) {
        const options = getAdjacentPositions(blankPosition, columns, rows)
        const next = options[0]

        if (typeof next === "number") {
            board[blankPosition] = board[next]
            board[next] = -1
        }
    }

    return board
}

function getManhattanDistance(a: number, b: number, columns: number) {
    const ax = a % columns
    const ay = Math.floor(a / columns)

    const bx = b % columns
    const by = Math.floor(b / columns)

    return Math.abs(ax - bx) + Math.abs(ay - by)
}

function getPosition(column: number, row: number, columns: number) {
    return row * columns + column
}

function getCoverageTargets(
    columns: number,
    rows: number,
    startPosition: number,
    random: () => number
) {
    const maxColumn = columns - 1
    const maxRow = rows - 1

    const rawTargets = [
        getPosition(
            Math.round(maxColumn * 0.16),
            Math.round(maxRow * 0.16),
            columns
        ),
        getPosition(
            Math.round(maxColumn * 0.84),
            Math.round(maxRow * 0.16),
            columns
        ),
        getPosition(
            Math.round(maxColumn * 0.16),
            Math.round(maxRow * 0.84),
            columns
        ),
        getPosition(
            Math.round(maxColumn * 0.84),
            Math.round(maxRow * 0.84),
            columns
        ),
        getPosition(
            Math.round(maxColumn * 0.5),
            Math.round(maxRow * 0.5),
            columns
        ),
    ]

    const uniqueTargets = Array.from(new Set(rawTargets)).filter(
        (position) => position !== startPosition
    )

    const orderedTargets: number[] = []
    let currentPosition = startPosition
    const remainingTargets = [...uniqueTargets]

    while (remainingTargets.length > 0) {
        let bestIndex = 0
        let bestScore = -Infinity

        for (let i = 0; i < remainingTargets.length; i++) {
            const target = remainingTargets[i]
            const distance = getManhattanDistance(
                currentPosition,
                target,
                columns
            )

            const score = distance + random() * 1.2

            if (score > bestScore) {
                bestScore = score
                bestIndex = i
            }
        }

        const nextTarget = remainingTargets.splice(bestIndex, 1)[0]
        orderedTargets.push(nextTarget)
        currentPosition = nextTarget
    }

    return orderedTargets
}

function getStepTowardTarget(
    blankPosition: number,
    targetPosition: number,
    columns: number,
    rows: number,
    previousBlank: number,
    random: () => number
) {
    const blankColumn = blankPosition % columns
    const blankRow = Math.floor(blankPosition / columns)

    const targetColumn = targetPosition % columns
    const targetRow = Math.floor(targetPosition / columns)

    const horizontalStep =
        targetColumn > blankColumn
            ? blankPosition + 1
            : targetColumn < blankColumn
              ? blankPosition - 1
              : null

    const verticalStep =
        targetRow > blankRow
            ? blankPosition + columns
            : targetRow < blankRow
              ? blankPosition - columns
              : null

    const candidates: number[] = []
    const preferHorizontal = random() > 0.5

    if (preferHorizontal) {
        if (horizontalStep !== null) candidates.push(horizontalStep)
        if (verticalStep !== null) candidates.push(verticalStep)
    } else {
        if (verticalStep !== null) candidates.push(verticalStep)
        if (horizontalStep !== null) candidates.push(horizontalStep)
    }

    const adjacent = getAdjacentPositions(blankPosition, columns, rows)
    const legalCandidates = candidates.filter((position) => {
        if (!adjacent.includes(position)) return false
        if (position === previousBlank && candidates.length > 1) return false
        return true
    })

    return legalCandidates[0] ?? candidates[0] ?? blankPosition
}

function buildScrambleSequence(
    startBoard: number[],
    columns: number,
    rows: number,
    moves: number,
    seed: number
) {
    const random = mulberry32(seed)
    const boards: number[][] = []

    let current = [...startBoard]
    let blankPosition = current.indexOf(-1)
    let previousBlank = -1

    if (blankPosition < 0) return boards

    const totalMoves = Math.max(0, Math.round(moves))
    const coverageBudget = Math.max(0, Math.round(totalMoves * 0.82))

    function pushMove(nextBlank: number) {
        if (nextBlank === blankPosition) return
        if (!areAdjacent(blankPosition, nextBlank, columns)) return

        const nextBoard = [...current]
        nextBoard[blankPosition] = nextBoard[nextBlank]
        nextBoard[nextBlank] = -1

        boards.push(nextBoard)

        previousBlank = blankPosition
        blankPosition = nextBlank
        current = nextBoard
    }

    function pushRandomMove() {
        let options = getAdjacentPositions(blankPosition, columns, rows)

        if (options.length > 1) {
            options = options.filter((position) => position !== previousBlank)
        }

        const next =
            options[Math.floor(random() * options.length)] ?? options[0]

        if (typeof next === "number") pushMove(next)
    }

    const targets = getCoverageTargets(columns, rows, blankPosition, random)

    for (const target of targets) {
        while (blankPosition !== target && boards.length < coverageBudget) {
            const next = getStepTowardTarget(
                blankPosition,
                target,
                columns,
                rows,
                previousBlank,
                random
            )

            pushMove(next)
        }

        const smallWander = Math.floor(1 + random() * 3)

        for (
            let i = 0;
            i < smallWander && boards.length < coverageBudget;
            i++
        ) {
            pushRandomMove()
        }
    }

    while (boards.length < totalMoves) {
        pushRandomMove()
    }

    if (boards.length > 0 && isSolved(boards[boards.length - 1])) {
        pushRandomMove()
    }

    return boards
}

function getLaunchScrambleMoves(columns: number, rows: number) {
    const total = columns * rows
    return clamp(Math.round(total * 0.55), 28, 72)
}

function getLaunchDuration(columns: number, rows: number) {
    const total = columns * rows

    if (total <= 16) return 1800
    if (total <= 36) return 2200
    if (total <= 81) return 2600

    return 3000
}

function getControlScrambleDuration(moves: number) {
    if (moves <= 1) return 420
    return clamp(Math.round(moves * 42), 1000, 3600)
}

function getStepTransition(duration: number, steps: number) {
    const interval = duration / Math.max(1, steps)
    return clamp(Math.round(interval * 1.75), 88, 165)
}

function getAutoTileSize(density: AutoDensity, customTileSize: number) {
    if (density === "roomy") return 112
    if (density === "dense") return 64
    if (density === "custom") {
        return clamp(Math.round(numberOr(customTileSize, 88)), 48, 240)
    }

    return 88
}

function getRuntimeAutoTileSize(baseTileSize: number, densityStep: number) {
    const safeBase = clamp(Math.round(numberOr(baseTileSize, 88)), 48, 240)
    const safeStep = clamp(Math.round(numberOr(densityStep, 0)), -5, 6)

    return clamp(Math.round(safeBase * Math.pow(0.86, safeStep)), 44, 220)
}

function getAutoGrid(
    width: number,
    height: number,
    targetTileSize: number,
    maxColumns: number,
    maxRows: number
) {
    const safeWidth = Math.max(1, width)
    const safeHeight = Math.max(1, height)
    const target = clamp(Math.round(numberOr(targetTileSize, 88)), 48, 240)
    const columnLimit = clamp(Math.round(numberOr(maxColumns, 16)), 2, 24)
    const rowLimit = clamp(Math.round(numberOr(maxRows, 10)), 2, 24)

    const desiredColumns = clamp(Math.round(safeWidth / target), 2, columnLimit)
    const desiredRows = clamp(Math.round(safeHeight / target), 2, rowLimit)
    const aspect = safeWidth / safeHeight

    let best = {
        columns: desiredColumns,
        rows: desiredRows,
        score: -Infinity,
    }

    const minColumns = Math.max(2, desiredColumns - 3)
    const maxColumnsSafe = Math.min(columnLimit, desiredColumns + 3)
    const minRows = Math.max(2, desiredRows - 3)
    const maxRowsSafe = Math.min(rowLimit, desiredRows + 3)

    for (let c = minColumns; c <= maxColumnsSafe; c++) {
        for (let r = minRows; r <= maxRowsSafe; r++) {
            const tileSize = Math.min(safeWidth / c, safeHeight / r)
            const boardW = c * tileSize
            const boardH = r * tileSize
            const areaFill = (boardW * boardH) / (safeWidth * safeHeight)
            const tileError = Math.abs(tileSize - target) / target
            const aspectError = Math.abs(boardW / boardH - aspect) / aspect
            const countPenalty =
                Math.abs(c - desiredColumns) * 0.01 +
                Math.abs(r - desiredRows) * 0.01
            const score =
                areaFill * 4 -
                tileError * 0.9 -
                aspectError * 0.35 -
                countPenalty

            if (score > best.score) {
                best = { columns: c, rows: r, score }
            }
        }
    }

    return { columns: best.columns, rows: best.rows }
}

function getBoardMetrics(
    width: number,
    height: number,
    columns: number,
    rows: number,
    layoutMode: LayoutMode
): BoardMetrics {
    if (layoutMode === "fillFrame") {
        return {
            boardX: 0,
            boardY: 0,
            boardW: width,
            boardH: height,
            cellW: width / columns,
            cellH: height / rows,
        }
    }

    const tileSize = Math.max(
        1,
        layoutMode === "coverSquare"
            ? Math.max(width / columns, height / rows)
            : Math.min(width / columns, height / rows)
    )

    const boardW = tileSize * columns
    const boardH = tileSize * rows

    return {
        boardX: (width - boardW) / 2,
        boardY: (height - boardH) / 2,
        boardW,
        boardH,
        cellW: tileSize,
        cellH: tileSize,
    }
}

function getBackgroundSize(imageFit: ImageFit, boardW: number, boardH: number) {
    if (imageFit === "stretch") return `${boardW}px ${boardH}px`
    return imageFit
}

function buildFadeSpecs(
    total: number,
    seed: number,
    delayMax: number,
    durationMin: number,
    durationMax: number,
    jitterAmount: number
) {
    const random = mulberry32(seed * 997 + total * 131)
    const specs: FadeSpec[] = Array.from({ length: total }, () => ({
        delay: 0,
        duration: 0,
    }))

    const order = shuffleNumbers(total, random)
    const spread = Math.max(0, delayMax)
    const slot = total > 1 ? spread / (total - 1) : 0
    const jitter = clamp(jitterAmount, 0, 1)

    const minDuration = Math.max(0, durationMin)
    const maxDuration = Math.max(minDuration, durationMax)
    const durationRange = maxDuration - minDuration

    for (let orderIndex = 0; orderIndex < total; orderIndex++) {
        const position = order[orderIndex]
        const baseDelay = total > 1 ? orderIndex * slot : 0
        const jitterOffset = (random() - 0.5) * slot * jitter
        const delay = Math.round(clamp(baseDelay + jitterOffset, 0, spread))
        const duration = Math.round(minDuration + random() * durationRange)

        specs[position] = { delay, duration }
    }

    return specs
}

function CloseIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
                d="M3.25 3.25L10.75 10.75M10.75 3.25L3.25 10.75"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
            />
        </svg>
    )
}

function RedoIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path
                d="M11.9 5.1H14V3"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M13.15 5.25A5.45 5.45 0 1 0 14 8.15"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
            />
        </svg>
    )
}

const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

export default function HiddenPuzzleImage(rawProps: Partial<Props>) {
    const props = {
        ...HiddenPuzzleImage.defaultProps,
        ...rawProps,
    } as Props

    const isStaticRenderer = useIsStaticRenderer()

    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const timersRef = React.useRef<number[]>([])
    const ghostIdRef = React.useRef(0)
    const previousStartModeRef = React.useRef(props.startMode)

    const [size, setSize] = React.useState({ width: 800, height: 500 })
    const [runtimeGridMode, setRuntimeGridMode] =
        React.useState<GridMode | null>(null)
    const [runtimeManualGrid, setRuntimeManualGrid] = React.useState<{
        columns: number
        rows: number
    } | null>(null)
    const [runtimeAutoStep, setRuntimeAutoStep] = React.useState(0)

    const gridMode = runtimeGridMode ?? props.gridMode
    const manualColumns =
        runtimeManualGrid?.columns ??
        clamp(Math.round(numberOr(props.columns, 4)), 2, 12)
    const manualRows =
        runtimeManualGrid?.rows ??
        (props.lockGrid
            ? manualColumns
            : clamp(Math.round(numberOr(props.rows, 4)), 2, 12))

    const resolvedAutoTileSize = getAutoTileSize(
        props.autoDensity,
        props.autoTileSize
    )
    const effectiveAutoTileSize = getRuntimeAutoTileSize(
        resolvedAutoTileSize,
        runtimeAutoStep
    )

    const autoGrid = getAutoGrid(
        size.width,
        size.height,
        effectiveAutoTileSize,
        props.autoMaxColumns,
        props.autoMaxRows
    )

    const columns = gridMode === "auto" ? autoGrid.columns : manualColumns
    const rows = gridMode === "auto" ? autoGrid.rows : manualRows
    const total = columns * rows

    const initialSeed = Math.round(numberOr(props.shuffleSeed, 7))
    const initialMoves = numberOr(props.scrambleMoves, 90)

    const [internalSeed, setInternalSeed] = React.useState(initialSeed)
    const [isLaunched, setIsLaunched] = React.useState(
        props.startMode === "scrambled"
    )
    const [isAutoScrambling, setIsAutoScrambling] = React.useState(false)
    const [autoStepMs, setAutoStepMs] = React.useState(96)
    const [introCoverVisible, setIntroCoverVisible] = React.useState(
        props.startMode === "image"
    )
    const [forcedImageVisible, setForcedImageVisible] = React.useState(
        props.startMode === "image"
    )
    const [board, setBoard] = React.useState<number[]>(() =>
        isStaticRenderer
            ? makeSolvedBoard(total)
            : makeScrambledBoard(columns, rows, initialMoves, initialSeed)
    )
    const [moveCount, setMoveCount] = React.useState(0)
    const [hoveredPosition, setHoveredPosition] = React.useState<number | null>(
        null
    )
    const [copied, setCopied] = React.useState(false)
    const [hasSolved, setHasSolved] = React.useState(false)
    const [revealStarted, setRevealStarted] = React.useState(false)
    const [rewardVisible, setRewardVisible] = React.useState(false)
    const [imageModeVisible, setImageModeVisible] = React.useState(false)
    const [fadeSpecs, setFadeSpecs] = React.useState<FadeSpec[]>([])
    const [ghosts, setGhosts] = React.useState<Ghost[]>([])

    const prefersReducedMotion =
        !isStaticRenderer &&
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const reduceMotion =
        isStaticRenderer || (!!props.reduceMotion && prefersReducedMotion)

    const storageKey = stringOr(
        props.storageKey,
        "rule-form-hidden-puzzle-image"
    )

    React.useEffect(() => {
        if (isStaticRenderer) return

        setRuntimeGridMode(null)
        setRuntimeManualGrid(null)
    }, [
        isStaticRenderer,
        props.gridMode,
        props.autoDensity,
        props.autoTileSize,
        props.autoMaxColumns,
        props.autoMaxRows,
        props.columns,
        props.rows,
        props.lockGrid,
    ])

    const solved = !isStaticRenderer && isSolved(board)
    const blankPosition = board.indexOf(-1)
    const imagePreviewActive = isStaticRenderer
        ? true
        : forcedImageVisible && !isAutoScrambling
    const puzzleActive =
        !isStaticRenderer &&
        !imagePreviewActive &&
        (props.startMode === "scrambled" || isLaunched || solved)
    const introVisible = imagePreviewActive

    const background = stringOr(props.background, "#080A0D")
    const revealSurface = stringOr(props.revealSurface, "#050608")
    const revealText = stringOr(props.revealText, "#F4F4F2")
    const revealMuted = stringOr(props.revealMuted, "#8F949B")
    const revealAction = stringOr(props.revealAction, "#D8D2C2")
    const tint = stringOr(props.tint, "#000000")
    const seam = stringOr(props.seam, "#FFFFFF")
    const blank = stringOr(props.blank, "#050608")
    const text = stringOr(props.text, "#FFFFFF")

    const fontFamily = stringOr(props.revealFontFamily, "")
    const contentGap = Math.max(0, numberOr(props.contentGap, 18))

    const messageSize = Math.max(8, numberOr(props.messageSize, 17))
    const messageLineHeight = Math.max(8, numberOr(props.messageLineHeight, 25))
    const messageWeight = clamp(
        Math.round(numberOr(props.messageWeight, 430)),
        100,
        900
    )
    const messageLetterSpacing = numberOr(props.messageLetterSpacing, -0.012)
    const messageMaxWidth = Math.max(120, numberOr(props.messageMaxWidth, 360))
    const labelSize = Math.max(8, numberOr(props.labelSize, 9))
    const actionSize = Math.max(8, numberOr(props.actionSize, 12))

    const gap = Math.max(0, numberOr(props.gap, 2))
    const radius = Math.max(0, numberOr(props.radius, 8))
    const slideMs = reduceMotion ? 0 : Math.max(0, numberOr(props.slideMs, 220))
    const activeSlideMs = isStaticRenderer
        ? 0
        : isAutoScrambling
          ? autoStepMs
          : slideMs

    const hoverLift = reduceMotion
        ? 0
        : Math.max(0, numberOr(props.hoverLift, 4))
    const hoverScale = reduceMotion
        ? 1
        : 1 + clamp(numberOr(props.hoverScale, 0.012), 0, 0.08)

    const ghostEnabled =
        !isStaticRenderer && !!props.ghostEnabled && !reduceMotion
    const ghostMs = Math.max(80, numberOr(props.ghostMs, 420))
    const ghostOpacity = clamp(numberOr(props.ghostOpacity, 0.42), 0, 1)
    const ghostBlur = Math.max(0, numberOr(props.ghostBlur, 2))
    const ghostColor = stringOr(props.ghostColor, revealSurface)
    const ghostColorAmount = clamp(numberOr(props.ghostColorAmount, 0.18), 0, 1)

    const completionHold = reduceMotion
        ? 0
        : Math.max(0, numberOr(props.completionHold, 280))
    const fadeDelayMax = reduceMotion
        ? 0
        : Math.max(0, numberOr(props.fadeDelayMax, 1400))
    const fadeDurationMin = reduceMotion
        ? 0
        : Math.max(0, numberOr(props.fadeDurationMin, 620))
    const fadeDurationMax = reduceMotion
        ? 0
        : Math.max(fadeDurationMin, numberOr(props.fadeDurationMax, 1050))
    const fadeJitter = reduceMotion
        ? 0
        : clamp(numberOr(props.fadeJitter, 0.32), 0, 1)
    const rewardDelay = reduceMotion
        ? 0
        : Math.max(0, numberOr(props.rewardDelay, 40))

    const imageOpacity = clamp(numberOr(props.imageOpacity, 1), 0, 1)
    const tintOpacity = clamp(numberOr(props.tintOpacity, 0.08), 0, 1)
    const seamOpacity = clamp(numberOr(props.seamOpacity, 0.14), 0, 1)
    const blankOpacity = clamp(numberOr(props.blankOpacity, 0.24), 0, 1)
    const shadowOpacity = clamp(numberOr(props.shadowOpacity, 0.16), 0, 1)

    const previewControlsBottom = Math.max(
        0,
        numberOr(props.previewControlsBottom, 56)
    )
    const previewControlsInset = Math.max(
        0,
        numberOr(props.previewControlsInset, 12)
    )
    const previewControlsLeftInset = 12
    const previewControlsScale = clamp(
        numberOr(props.previewControlsScale, 1),
        0.7,
        1.2
    )

    const effectiveLayoutMode =
        gridMode === "auto" ? "squareTiles" : props.layoutMode

    const metrics = getBoardMetrics(
        size.width,
        size.height,
        columns,
        rows,
        effectiveLayoutMode
    )

    const bgSize = getBackgroundSize(
        props.imageFit,
        metrics.boardW,
        metrics.boardH
    )

    const imageToggleMs = reduceMotion ? 0 : 460

    const pillBase: React.CSSProperties = {
        height: 30,
        padding: "0 12px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.2)",
        background: "rgba(0, 0, 0, 0.74)",
        color: "#FFFFFF",
        cursor: "pointer",
        backdropFilter: "blur(14px) saturate(1.12)",
        boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
        fontSize: 10.5,
        fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        fontWeight: 560,
        letterSpacing: "0.045em",
        textTransform: "uppercase",
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        whiteSpace: "nowrap",
    }

    function clearTimers() {
        if (typeof window === "undefined") return

        for (const timer of timersRef.current) {
            window.clearTimeout(timer)
        }

        timersRef.current = []
    }

    function schedule(callback: () => void, delay: number) {
        if (isStaticRenderer || typeof window === "undefined") return

        const id = window.setTimeout(callback, delay)
        timersRef.current.push(id)
    }

    function addGhost(tileIndex: number, position: number) {
        if (
            isStaticRenderer ||
            !ghostEnabled ||
            tileIndex < 0 ||
            isAutoScrambling
        )
            return

        const id = ghostIdRef.current++
        setGhosts((current) => [...current, { id, tileIndex, position }])

        schedule(() => {
            setGhosts((current) => current.filter((item) => item.id !== id))
        }, ghostMs + 120)
    }

    function beginReveal(instant = false) {
        clearTimers()
        setGhosts([])
        setCopied(false)
        setImageModeVisible(false)

        if (isStaticRenderer) {
            setRevealStarted(false)
            setRewardVisible(false)
            setFadeSpecs([])
            return
        }

        if (props.revealMode !== "fade") {
            setRevealStarted(false)
            setRewardVisible(false)
            setFadeSpecs([])
            return
        }

        const specs = instant
            ? Array.from({ length: total }, () => ({ delay: 0, duration: 0 }))
            : buildFadeSpecs(
                  total,
                  internalSeed + moveCount + 17,
                  fadeDelayMax,
                  fadeDurationMin,
                  fadeDurationMax,
                  fadeJitter
              )

        setFadeSpecs(specs)

        if (instant || reduceMotion) {
            setRevealStarted(true)
            setRewardVisible(true)
            return
        }

        setRevealStarted(false)
        setRewardVisible(false)

        const latestFinish = specs.reduce((max, spec) => {
            return Math.max(max, spec.delay + spec.duration)
        }, 0)

        schedule(() => setRevealStarted(true), completionHold)
        schedule(
            () => setRewardVisible(true),
            completionHold + latestFinish + rewardDelay
        )
    }

    function clearSolvedMemory() {
        if (isStaticRenderer) return

        if (
            props.rememberSolved &&
            typeof window !== "undefined" &&
            storageKey
        ) {
            try {
                window.localStorage.removeItem(storageKey)
            } catch {
                // Ignore storage failures.
            }
        }
    }

    function resetPuzzleState() {
        setMoveCount(0)
        setHoveredPosition(null)
        setCopied(false)
        setHasSolved(false)
        setRevealStarted(false)
        setRewardVisible(false)
        setImageModeVisible(false)
        setFadeSpecs([])
        setGhosts([])
    }

    function runRealScramble(options: {
        fromSolved: boolean
        moves: number
        duration: number
        fadeIntroCover: boolean
    }) {
        if (isStaticRenderer) return

        clearSolvedMemory()
        clearTimers()

        const nextSeed = internalSeed + 1
        const baseBoard = options.fromSolved
            ? makeSolvedBoard(total)
            : [...board]
        const safeMoves = Math.max(1, Math.round(options.moves))
        const sequence = buildScrambleSequence(
            baseBoard,
            columns,
            rows,
            safeMoves,
            nextSeed + 411
        )

        const safeDuration = Math.max(300, options.duration)
        const interval = safeDuration / Math.max(1, sequence.length)
        const stepTransition = getStepTransition(safeDuration, sequence.length)
        const startDelay = options.fadeIntroCover ? 260 : 60

        setInternalSeed(nextSeed)
        setIsLaunched(true)
        setIsAutoScrambling(true)
        setAutoStepMs(stepTransition)
        setIntroCoverVisible(options.fadeIntroCover)
        setForcedImageVisible(options.fadeIntroCover)
        setBoard(baseBoard)
        resetPuzzleState()

        if (options.fadeIntroCover) {
            schedule(() => {
                setIntroCoverVisible(false)
                setForcedImageVisible(false)
            }, 80)
        } else {
            setIntroCoverVisible(false)
            setForcedImageVisible(false)
        }

        sequence.forEach((nextBoard, index) => {
            schedule(
                () => {
                    setBoard(nextBoard)
                },
                startDelay + index * interval
            )
        })

        schedule(
            () => {
                setIsAutoScrambling(false)
                setAutoStepMs(96)
                setMoveCount(0)
                setHoveredPosition(null)
            },
            startDelay + sequence.length * interval + stepTransition + 80
        )
    }

    function launchFromImage() {
        if (isStaticRenderer) return

        runRealScramble({
            fromSolved: true,
            moves: getLaunchScrambleMoves(columns, rows),
            duration: getLaunchDuration(columns, rows),
            fadeIntroCover: true,
        })
    }

    function scrambleBoardFromControls() {
        if (isStaticRenderer) return

        const configuredMoves = Math.round(numberOr(props.scrambleMoves, 90))
        const effectiveMoves = Math.max(1, configuredMoves)

        if (introVisible) {
            launchFromImage()
            return
        }

        runRealScramble({
            fromSolved: false,
            moves: effectiveMoves,
            duration: getControlScrambleDuration(effectiveMoves),
            fadeIntroCover: false,
        })
    }

    function showImageOnly() {
        if (isStaticRenderer) return

        clearTimers()
        clearSolvedMemory()

        setIsLaunched(false)
        setIsAutoScrambling(false)
        setAutoStepMs(96)
        setIntroCoverVisible(true)
        setForcedImageVisible(true)
        setImageModeVisible(false)
        setRevealStarted(false)
        setRewardVisible(false)
        setCopied(false)
        setGhosts([])
        setHoveredPosition(null)
    }

    function showPuzzleBoard() {
        if (isStaticRenderer) return

        clearTimers()
        clearSolvedMemory()

        const nextSeed = internalSeed + 1
        const moves = Math.max(1, Math.round(numberOr(props.scrambleMoves, 90)))

        setInternalSeed(nextSeed)
        setIsLaunched(true)
        setIsAutoScrambling(false)
        setAutoStepMs(96)
        setIntroCoverVisible(false)
        setForcedImageVisible(false)
        setBoard(makeScrambledBoard(columns, rows, moves, nextSeed))
        resetPuzzleState()
    }

    function adjustAutoDensity(delta: number) {
        if (isStaticRenderer) return

        clearTimers()
        clearSolvedMemory()

        const nextStep = clamp(runtimeAutoStep + Math.round(delta), -5, 6)
        const nextTileSize = getRuntimeAutoTileSize(
            resolvedAutoTileSize,
            nextStep
        )
        const nextAutoGrid = getAutoGrid(
            size.width,
            size.height,
            nextTileSize,
            props.autoMaxColumns,
            props.autoMaxRows
        )
        const nextSeed = internalSeed + 1
        const moves = Math.max(1, Math.round(numberOr(props.scrambleMoves, 90)))

        setRuntimeAutoStep(nextStep)
        setRuntimeGridMode("auto")
        setRuntimeManualGrid(null)
        setInternalSeed(nextSeed)
        setIsLaunched(true)
        setIsAutoScrambling(false)
        setAutoStepMs(96)
        setIntroCoverVisible(false)
        setForcedImageVisible(false)
        setBoard(
            makeScrambledBoard(
                nextAutoGrid.columns,
                nextAutoGrid.rows,
                moves,
                nextSeed
            )
        )
        resetPuzzleState()
    }

    React.useEffect(() => {
        if (isStaticRenderer) return

        const nextSeed = Math.round(numberOr(props.shuffleSeed, 7))
        const nextMoves = numberOr(props.scrambleMoves, 90)

        let shouldUseSolvedMemory = false

        if (
            props.rememberSolved &&
            typeof window !== "undefined" &&
            storageKey
        ) {
            try {
                shouldUseSolvedMemory =
                    window.localStorage.getItem(storageKey) === "solved"
            } catch {
                shouldUseSolvedMemory = false
            }
        }

        const startModeChanged =
            previousStartModeRef.current !== props.startMode
        previousStartModeRef.current = props.startMode

        clearTimers()
        setGhosts([])
        setImageModeVisible(false)
        setIsAutoScrambling(false)
        setAutoStepMs(96)
        setInternalSeed(nextSeed)

        if (startModeChanged) {
            setIntroCoverVisible(props.startMode === "image")
            setForcedImageVisible(props.startMode === "image")
            setIsLaunched(props.startMode === "scrambled")
        }

        if (shouldUseSolvedMemory) {
            setIsLaunched(true)
            setIntroCoverVisible(false)
            setForcedImageVisible(false)
            setBoard(makeSolvedBoard(total))
            setHasSolved(true)
            setMoveCount(0)
            setHoveredPosition(null)
            beginReveal(true)
        } else {
            setBoard(makeScrambledBoard(columns, rows, nextMoves, nextSeed))
            setHasSolved(false)
            setRevealStarted(false)
            setRewardVisible(false)
            setFadeSpecs([])
            setMoveCount(0)
            setHoveredPosition(null)
            setCopied(false)
        }
    }, [
        isStaticRenderer,
        columns,
        rows,
        props.startMode,
        props.scrambleMoves,
        props.shuffleSeed,
        props.rememberSolved,
        props.revealMode,
        storageKey,
        total,
    ])

    React.useEffect(() => {
        return () => clearTimers()
    }, [])

    useIsomorphicLayoutEffect(() => {
        if (isStaticRenderer) return

        const root = rootRef.current
        if (!root) return

        let frame = 0

        function readSize(entry?: ResizeObserverEntry) {
            const contentWidth = entry?.contentRect?.width
            const contentHeight = entry?.contentRect?.height

            const width = Math.max(
                1,
                Math.round(
                    contentWidth || root.clientWidth || root.offsetWidth || 1
                )
            )
            const height = Math.max(
                1,
                Math.round(
                    contentHeight || root.clientHeight || root.offsetHeight || 1
                )
            )

            setSize((current) => {
                if (current.width === width && current.height === height) {
                    return current
                }

                return { width, height }
            })
        }

        function measure(entry?: ResizeObserverEntry) {
            if (frame) cancelAnimationFrame(frame)
            frame = requestAnimationFrame(() => readSize(entry))
        }

        readSize()

        const observer =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver((entries) => measure(entries[0]))
                : null

        observer?.observe(root)

        const handleResize = () => measure()
        window.addEventListener("resize", handleResize)

        return () => {
            if (frame) cancelAnimationFrame(frame)
            observer?.disconnect()
            window.removeEventListener("resize", handleResize)
        }
    }, [isStaticRenderer])

    React.useEffect(() => {
        if (isStaticRenderer) return
        if (!solved || hasSolved || isAutoScrambling) return

        setHasSolved(true)
        beginReveal(false)

        if (
            props.rememberSolved &&
            typeof window !== "undefined" &&
            storageKey
        ) {
            try {
                window.localStorage.setItem(storageKey, "solved")
            } catch {
                // Ignore storage failures.
            }
        }
    }, [
        isStaticRenderer,
        solved,
        hasSolved,
        isAutoScrambling,
        props.rememberSolved,
        props.revealMode,
        storageKey,
    ])

    function moveTile(position: number) {
        if (isStaticRenderer || !puzzleActive || solved || isAutoScrambling)
            return
        if (!areAdjacent(position, blankPosition, columns)) return

        const movingTile = board[position]
        addGhost(movingTile, position)

        setBoard((current) => {
            const next = [...current]
            const currentBlank = next.indexOf(-1)

            if (!areAdjacent(position, currentBlank, columns)) return current

            next[currentBlank] = next[position]
            next[position] = -1

            return next
        })

        setMoveCount((count) => count + 1)
        setHoveredPosition(null)
    }

    function resetSolved() {
        if (isStaticRenderer) return

        clearTimers()

        setIsLaunched(true)
        setIsAutoScrambling(false)
        setIntroCoverVisible(false)
        setBoard(makeSolvedBoard(total))
        resetPuzzleState()
    }

    function dismissReward() {
        if (isStaticRenderer) return

        clearTimers()
        setCopied(false)
        setRewardVisible(false)
        setImageModeVisible(true)
    }

    function reopenReward() {
        if (isStaticRenderer || !solved || props.revealMode !== "fade") return

        clearTimers()
        setCopied(false)
        setRevealStarted(true)
        setImageModeVisible(false)

        schedule(() => setRewardVisible(true), imageToggleMs + 40)
    }

    async function copyRevealCode() {
        if (isStaticRenderer) return

        const code = stringOr(props.revealCode, "")
        if (!code || typeof navigator === "undefined" || !navigator.clipboard) {
            return
        }

        try {
            await navigator.clipboard.writeText(code)
            setCopied(true)

            if (typeof window !== "undefined") {
                window.setTimeout(() => setCopied(false), 1200)
            }
        } catch {
            setCopied(false)
        }
    }

    function getCell(position: number) {
        const column = position % columns
        const row = Math.floor(position / columns)

        return {
            x: column * metrics.cellW + gap / 2,
            y: row * metrics.cellH + gap / 2,
            w: Math.max(0.5, metrics.cellW - gap),
            h: Math.max(0.5, metrics.cellH - gap),
        }
    }

    function renderFullImage(opacity: number, zIndex: number) {
        return (
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex,
                    borderRadius: radius,
                    overflow: "hidden",
                    opacity,
                    transition: reduceMotion
                        ? "none"
                        : `opacity ${imageToggleMs}ms cubic-bezier(0.16, 1, 0.3, 1)`,
                    pointerEvents: "none",
                    backgroundImage: props.image
                        ? `url(${props.image})`
                        : "linear-gradient(135deg, #2B3140, #090B10)",
                    backgroundSize: bgSize,
                    backgroundPosition: "center center",
                    backgroundRepeat: "no-repeat",
                }}
            />
        )
    }

    function renderTileImage(
        tileIndex: number,
        mode: "tile" | "ghost" = "tile"
    ) {
        const sourceColumn = tileIndex % columns
        const sourceRow = Math.floor(tileIndex / columns)

        const sourceX = sourceColumn * metrics.cellW
        const sourceY = sourceRow * metrics.cellH

        const localTintOpacity =
            mode === "ghost" ? tintOpacity * 0.55 : tintOpacity
        const localSeamOpacity =
            mode === "ghost" ? seamOpacity * 0.45 : seamOpacity
        const localShadowOpacity =
            mode === "ghost" ? shadowOpacity * 0.35 : shadowOpacity

        return (
            <>
                <div
                    style={{
                        position: "absolute",
                        left: -sourceX - gap / 2,
                        top: -sourceY - gap / 2,
                        width: metrics.boardW,
                        height: metrics.boardH,
                        backgroundImage: props.image
                            ? `url(${props.image})`
                            : "linear-gradient(135deg, #2B3140, #090B10)",
                        backgroundSize: bgSize,
                        backgroundPosition: "center center",
                        backgroundRepeat: "no-repeat",
                        opacity: imageOpacity,
                        pointerEvents: "none",
                    }}
                />

                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: `linear-gradient(135deg, rgba(255,255,255,${
                            localSeamOpacity * 0.22
                        }), rgba(255,255,255,0) 42%, rgba(0,0,0,${
                            localShadowOpacity * 0.52
                        }))`,
                        pointerEvents: "none",
                    }}
                />

                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: tint,
                        opacity: localTintOpacity,
                        pointerEvents: "none",
                    }}
                />

                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        boxShadow: `inset 0 0 0 1px ${mixColor(
                            seam,
                            localSeamOpacity
                        )}`,
                        pointerEvents: "none",
                    }}
                />
            </>
        )
    }

    if (isStaticRenderer) {
        const staticBackgroundSize =
            props.imageFit === "stretch" ? "100% 100%" : props.imageFit

        return (
            <div
                ref={rootRef}
                style={{
                    ...props.style,
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    overflow: "hidden",
                    background,
                    borderRadius: radius,
                    userSelect: "none",
                    isolation: "isolate",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: `radial-gradient(circle at 35% 20%, rgba(255,255,255,0.08), transparent 34%), ${background}`,
                        pointerEvents: "none",
                    }}
                />

                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: radius,
                        overflow: "hidden",
                        backgroundImage: props.image
                            ? `url(${props.image})`
                            : "linear-gradient(135deg, #2B3140, #090B10)",
                        backgroundSize: staticBackgroundSize,
                        backgroundPosition: "center center",
                        backgroundRepeat: "no-repeat",
                        opacity: imageOpacity,
                        pointerEvents: "none",
                    }}
                />

                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: `linear-gradient(135deg, rgba(255,255,255,${seamOpacity * 0.08}), rgba(255,255,255,0) 42%, rgba(0,0,0,${shadowOpacity * 0.32}))`,
                        pointerEvents: "none",
                    }}
                />

                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: tint,
                        opacity: tintOpacity,
                        pointerEvents: "none",
                    }}
                />

                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "radial-gradient(circle at center, rgba(0,0,0,0) 48%, rgba(0,0,0,0.2) 100%)",
                        pointerEvents: "none",
                    }}
                />
            </div>
        )
    }

    const ghostElements =
        puzzleActive &&
        !isAutoScrambling &&
        ghosts.map((ghost) => {
            const cell = getCell(ghost.position)

            return (
                <div
                    key={ghost.id}
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: cell.w,
                        height: cell.h,
                        borderRadius: radius,
                        overflow: "hidden",
                        transform: `translate3d(${cell.x}px, ${cell.y}px, 0)`,
                        opacity: ghostOpacity,
                        animation: `rfp-ghost-fade ${ghostMs}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
                        pointerEvents: "none",
                        zIndex: 1,
                        willChange: "opacity, filter",
                        filter: "brightness(1.08) blur(0px)",
                        background: ghostColor,
                        ["--ghost-blur" as string]: `${ghostBlur}px`,
                    }}
                >
                    {renderTileImage(ghost.tileIndex, "ghost")}

                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: ghostColor,
                            opacity: ghostColorAmount,
                            pointerEvents: "none",
                        }}
                    />
                </div>
            )
        })

    const tileElements: React.ReactNode[] = []

    if (puzzleActive) {
        for (let position = 0; position < total; position++) {
            const rawTileIndex = board[position]
            const isBlank = rawTileIndex === -1

            if (!solved && isBlank) continue

            const visibleTileIndex = solved ? position : rawTileIndex
            const cell = getCell(position)

            const movable =
                !solved &&
                !isAutoScrambling &&
                areAdjacent(position, blankPosition, columns)

            const hovered = hoveredPosition === position && movable
            const translateZ = hovered ? hoverLift : 0
            const scale = hovered ? hoverScale : 1

            const spec = fadeSpecs[position] ?? {
                delay: 0,
                duration: 0,
            }

            const tileIsRevealing =
                props.revealMode === "fade" && solved && revealStarted
            const tileOpacity = tileIsRevealing ? 0 : 1
            const overlayOpacity = 0

            tileElements.push(
                <div
                    key={visibleTileIndex}
                    role="button"
                    aria-label={
                        movable
                            ? `Move tile ${visibleTileIndex + 1}`
                            : `Tile ${visibleTileIndex + 1}`
                    }
                    tabIndex={movable ? 0 : -1}
                    onClick={() => moveTile(position)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            moveTile(position)
                        }
                    }}
                    onPointerEnter={() => setHoveredPosition(position)}
                    onPointerLeave={() => setHoveredPosition(null)}
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: cell.w,
                        height: cell.h,
                        borderRadius: radius,
                        overflow: "hidden",
                        cursor: movable ? "pointer" : "default",
                        opacity: tileOpacity,
                        pointerEvents: tileIsRevealing ? "none" : "auto",
                        transform: `translate3d(${cell.x}px, ${cell.y}px, ${translateZ}px) scale(${scale})`,
                        transformOrigin: "center center",
                        transition: `opacity ${spec.duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${spec.delay}ms, transform ${activeSlideMs}ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow ${slideMs}ms cubic-bezier(0.22, 1, 0.36, 1), filter ${slideMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                        willChange:
                            movable || isAutoScrambling || tileIsRevealing
                                ? "opacity, transform"
                                : "auto",
                        contain: "layout paint style",
                        zIndex: hovered ? 8 : movable ? 5 : 2,
                        boxShadow: tileIsRevealing
                            ? "none"
                            : hovered
                              ? `0 12px 28px rgba(0, 0, 0, ${shadowOpacity})`
                              : `0 1px 0 ${mixColor(seam, seamOpacity * 0.24)}`,
                        filter: movable ? "brightness(1.035)" : "brightness(1)",
                        outline: "none",
                    }}
                >
                    {renderTileImage(visibleTileIndex)}

                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: revealSurface,
                            opacity: overlayOpacity,
                            transition: `opacity ${spec.duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${spec.delay}ms`,
                            pointerEvents: "none",
                        }}
                    />

                    {props.showNumbers && !solved && !isAutoScrambling && (
                        <div
                            style={{
                                position: "absolute",
                                left: 8,
                                top: 7,
                                minWidth: 22,
                                height: 22,
                                padding: "0 6px",
                                borderRadius: 999,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 11,
                                lineHeight: 1,
                                fontFamily:
                                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                color: text,
                                background: "rgba(0, 0, 0, 0.45)",
                                pointerEvents: "none",
                            }}
                        >
                            {visibleTileIndex + 1}
                        </div>
                    )}
                </div>
            )
        }
    }

    const blankCell = getCell(Math.max(0, blankPosition))

    const hasLabel = !!stringOr(props.revealLabel, "")
    const hasMessage = !!stringOr(props.revealMessage, "")
    const hasCode = !!stringOr(props.revealCode, "")
    const normalizedRevealLink = normalizeHref(props.revealLink)
    const revealLinkText = stringOr(props.revealLinkLabel, "Open")
    const hasLink = !!normalizedRevealLink
    const revealLinkIsExternal = isExternalHref(normalizedRevealLink)

    const revealFontStyle: React.CSSProperties = fontFamily
        ? { fontFamily }
        : {}

    const rewardContent =
        props.revealMode === "fade" ? (
            <div
                key={rewardVisible ? "visible" : "hidden"}
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "clamp(22px, 6vw, 48px)",
                    color: revealText,
                    opacity: rewardVisible ? 1 : 0,
                    transform: rewardVisible
                        ? "translateY(0px)"
                        : "translateY(4px)",
                    filter: rewardVisible ? "blur(0px)" : "blur(7px)",
                    transition: reduceMotion
                        ? "none"
                        : "opacity 500ms cubic-bezier(0.16, 1, 0.3, 1), transform 500ms cubic-bezier(0.16, 1, 0.3, 1), filter 500ms cubic-bezier(0.16, 1, 0.3, 1)",
                    pointerEvents: rewardVisible ? "auto" : "none",
                }}
            >
                <div
                    style={{
                        width: `min(${messageMaxWidth}px, 100%)`,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: hasCode || hasLink ? contentGap : 0,
                        textAlign: "center",
                        animation:
                            rewardVisible && !reduceMotion
                                ? "rfp-message-in 700ms cubic-bezier(0.16, 1, 0.3, 1) both"
                                : "none",
                        ...revealFontStyle,
                    }}
                >
                    {(hasLabel || hasMessage) && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: hasLabel && hasMessage ? 10 : 0,
                            }}
                        >
                            {hasLabel && (
                                <div
                                    style={{
                                        maxWidth: messageMaxWidth,
                                        fontSize: labelSize,
                                        lineHeight: `${labelSize + 5}px`,
                                        letterSpacing: "0.22em",
                                        textTransform: "uppercase",
                                        fontFamily:
                                            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                        fontWeight: 520,
                                        color: revealMuted,
                                        opacity: 0.82,
                                    }}
                                >
                                    {props.revealLabel}
                                </div>
                            )}

                            {hasMessage && (
                                <div
                                    style={{
                                        maxWidth: messageMaxWidth,
                                        fontSize: messageSize,
                                        lineHeight: `${messageLineHeight}px`,
                                        letterSpacing: `${messageLetterSpacing}em`,
                                        fontWeight: messageWeight,
                                        color: revealText,
                                        textWrap: "balance",
                                    }}
                                >
                                    {props.revealMessage}
                                </div>
                            )}
                        </div>
                    )}

                    {(hasCode || hasLink) && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: hasCode && hasLink ? 10 : 0,
                                fontFamily:
                                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                            }}
                        >
                            {hasCode && (
                                <button
                                    type="button"
                                    onClick={copyRevealCode}
                                    aria-label="Copy code"
                                    style={{
                                        appearance: "none",
                                        minHeight: 34,
                                        borderRadius: 10,
                                        border: `1px solid ${mixColor(
                                            revealText,
                                            0.13
                                        )}`,
                                        background: mixColor(revealText, 0.045),
                                        color: revealText,
                                        cursor: "pointer",
                                        padding: "8px 12px 8px 13px",
                                        margin: 0,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 10,
                                        fontFamily: "inherit",
                                        boxShadow: `0 16px 40px ${mixColor(
                                            "#000000",
                                            0.2
                                        )}`,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: actionSize,
                                            lineHeight: 1,
                                            letterSpacing: "0.12em",
                                            color: revealText,
                                            fontWeight: 520,
                                        }}
                                    >
                                        {props.revealCode}
                                    </span>

                                    <span
                                        aria-hidden="true"
                                        style={{
                                            width: 1,
                                            height: 14,
                                            background: mixColor(
                                                revealText,
                                                0.16
                                            ),
                                        }}
                                    />

                                    <span
                                        style={{
                                            fontSize: Math.max(
                                                8,
                                                actionSize - 1
                                            ),
                                            lineHeight: 1,
                                            letterSpacing: "0.04em",
                                            color: revealAction,
                                            fontWeight: 560,
                                        }}
                                    >
                                        {copied
                                            ? props.copiedLabel
                                            : props.copyLabel}
                                    </span>
                                </button>
                            )}

                            {hasLink && (
                                <a
                                    href={normalizedRevealLink}
                                    target={
                                        revealLinkIsExternal
                                            ? "_blank"
                                            : undefined
                                    }
                                    rel={
                                        revealLinkIsExternal
                                            ? "noopener noreferrer"
                                            : undefined
                                    }
                                    style={{
                                        color: revealAction,
                                        textDecoration: "none",
                                        fontSize: actionSize,
                                        lineHeight: 1.2,
                                        letterSpacing: "0.01em",
                                        borderBottom: `1px solid ${mixColor(
                                            revealAction,
                                            0.38
                                        )}`,
                                        padding: "1px 1px 3px",
                                        fontFamily:
                                            fontFamily ||
                                            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
                                    }}
                                >
                                    {revealLinkText}
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        ) : null

    const solvedActionVisible =
        solved &&
        props.revealMode === "fade" &&
        (rewardVisible || imageModeVisible)

    const gridLabel =
        gridMode === "auto" ? `AUTO · ${columns}×${rows}` : `${columns}×${rows}`

    function getPillStyle(active = false): React.CSSProperties {
        return {
            ...pillBase,
            pointerEvents: "auto",
            border: active
                ? `1px solid ${mixColor("#FFFFFF", 0.42)}`
                : pillBase.border,
            background: active
                ? "rgba(255, 255, 255, 0.92)"
                : pillBase.background,
            color: active ? "#050608" : "#FFFFFF",
        }
    }

    return (
        <div
            ref={rootRef}
            style={{
                ...props.style,
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                background,
                borderRadius: radius,
                userSelect: "none",
                touchAction: "manipulation",
                isolation: "isolate",
            }}
        >
            {!isStaticRenderer && (
                <style>{`
                @keyframes rfp-ghost-fade {
                    0% {
                        opacity: ${ghostOpacity};
                        filter: brightness(1.08) blur(0px);
                    }
                    62% {
                        opacity: ${ghostOpacity * 0.34};
                        filter: brightness(1.03) blur(calc(var(--ghost-blur) * 0.55));
                    }
                    100% {
                        opacity: 0;
                        filter: brightness(1) blur(var(--ghost-blur));
                    }
                }

                @keyframes rfp-message-in {
                    0% {
                        opacity: 0;
                        transform: translateY(5px) scale(0.995);
                        filter: blur(8px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0px) scale(1);
                        filter: blur(0px);
                    }
                }
            `}</style>
            )}

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: `radial-gradient(circle at 35% 20%, rgba(255,255,255,0.08), transparent 34%), ${background}`,
                    pointerEvents: "none",
                }}
            />

            <div
                style={{
                    position: "absolute",
                    left: metrics.boardX,
                    top: metrics.boardY,
                    width: metrics.boardW,
                    height: metrics.boardH,
                    background:
                        revealStarted && props.revealMode === "fade"
                            ? revealSurface
                            : "transparent",
                    transition: reduceMotion
                        ? "none"
                        : `background ${fadeDurationMin}ms cubic-bezier(0.16, 1, 0.3, 1)`,
                    transformStyle: "preserve-3d",
                    perspective: 900,
                    zIndex: 2,
                }}
            >
                {puzzleActive && !solved && (
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: blankCell.w,
                            height: blankCell.h,
                            borderRadius: radius,
                            background: blank,
                            opacity: blankOpacity,
                            transform: `translate3d(${blankCell.x}px, ${blankCell.y}px, 0)`,
                            boxShadow: `inset 0 0 0 1px ${mixColor(
                                seam,
                                seamOpacity * 0.72
                            )}, inset 0 12px 28px rgba(0,0,0,${
                                shadowOpacity * 0.85
                            })`,
                            pointerEvents: "none",
                            zIndex: 0,
                            transition: "opacity 280ms ease",
                        }}
                    />
                )}

                {ghostElements}
                {tileElements}

                {renderFullImage(
                    forcedImageVisible || introCoverVisible ? 1 : 0,
                    30
                )}

                {solved &&
                    props.revealMode === "fade" &&
                    renderFullImage(imageModeVisible ? 1 : 0, 24)}
            </div>

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "radial-gradient(circle at center, rgba(0,0,0,0) 48%, rgba(0,0,0,0.2) 100%)",
                    pointerEvents: "none",
                    zIndex: 12,
                    opacity: rewardVisible ? 0.32 : 0.68,
                    transition: reduceMotion
                        ? "none"
                        : "opacity 420ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
            />

            {rewardContent}

            {!isStaticRenderer &&
                introVisible &&
                !isAutoScrambling &&
                props.showLaunchButton && (
                    <button
                        type="button"
                        aria-label="Scramble image"
                        onClick={launchFromImage}
                        style={{
                            ...pillBase,
                            position: "absolute",
                            left: 12,
                            bottom: 12,
                            zIndex: 46,
                            textTransform: "uppercase",
                        }}
                    >
                        {props.launchLabel}
                    </button>
                )}

            {!isStaticRenderer && solvedActionVisible && (
                <button
                    type="button"
                    aria-label={
                        rewardVisible
                            ? "Hide hidden message"
                            : "Show hidden message"
                    }
                    onClick={rewardVisible ? dismissReward : reopenReward}
                    style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        zIndex: 46,
                        width: 32,
                        height: 32,
                        borderRadius: 999,
                        border: `1px solid ${mixColor(revealText, 0.14)}`,
                        background: "rgba(0,0,0,0.22)",
                        color: imageModeVisible ? revealAction : revealMuted,
                        backdropFilter: "blur(10px)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                        transition:
                            "opacity 220ms ease, color 220ms ease, border-color 220ms ease, background 220ms ease, transform 220ms ease",
                    }}
                >
                    {rewardVisible ? <CloseIcon /> : <RedoIcon />}
                </button>
            )}

            {!isStaticRenderer && props.showControls && (
                <div
                    style={{
                        position: "absolute",
                        left: previewControlsLeftInset,
                        right: previewControlsInset,
                        bottom: previewControlsBottom,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        zIndex: 42,
                        pointerEvents: "none",
                        flexWrap: "wrap",
                    }}
                >
                    {props.showStatus && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                pointerEvents: "auto",
                                transform: `scale(${previewControlsScale})`,
                                transformOrigin: "left bottom",
                            }}
                        >
                            <div
                                style={{
                                    ...getPillStyle(true),
                                    cursor: "default",
                                }}
                            >
                                {gridLabel}
                            </div>

                            {!introVisible && (
                                <div
                                    style={{
                                        ...getPillStyle(false),
                                        cursor: "default",
                                    }}
                                >
                                    {isAutoScrambling
                                        ? "SCRAMBLING"
                                        : solved
                                          ? "SOLVED"
                                          : `${moveCount} MOVES`}
                                </div>
                            )}
                        </div>
                    )}

                    <div
                        style={{
                            marginLeft: "auto",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: 6,
                            pointerEvents: "auto",
                            flexWrap: "wrap",
                            transform: `scale(${previewControlsScale})`,
                            transformOrigin: "right bottom",
                        }}
                    >
                        <button
                            type="button"
                            onClick={showImageOnly}
                            style={getPillStyle(introVisible)}
                        >
                            IMAGE
                        </button>

                        <button
                            type="button"
                            onClick={showPuzzleBoard}
                            style={getPillStyle(
                                puzzleActive && !solved && !isAutoScrambling
                            )}
                        >
                            PUZZLE
                        </button>

                        <button
                            type="button"
                            onClick={scrambleBoardFromControls}
                            style={getPillStyle(isAutoScrambling)}
                        >
                            SCRAMBLE
                        </button>

                        <button
                            type="button"
                            onClick={resetSolved}
                            style={getPillStyle(solved)}
                        >
                            SOLVE
                        </button>

                        <button
                            type="button"
                            aria-label="Show fewer puzzle tiles"
                            onClick={() => adjustAutoDensity(-1)}
                            style={{
                                ...getPillStyle(false),
                                minWidth: 32,
                                padding: "0 9px",
                                fontSize: 14,
                            }}
                        >
                            −
                        </button>

                        <div
                            aria-label="Current puzzle grid"
                            style={{
                                ...getPillStyle(gridMode === "auto"),
                                minWidth: 54,
                                cursor: "default",
                                padding: "0 9px",
                            }}
                        >
                            {columns}×{rows}
                        </div>

                        <button
                            type="button"
                            aria-label="Show more puzzle tiles"
                            onClick={() => adjustAutoDensity(1)}
                            style={{
                                ...getPillStyle(false),
                                minWidth: 32,
                                padding: "0 9px",
                                fontSize: 14,
                            }}
                        >
                            +
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

HiddenPuzzleImage.defaultProps = {
    image: "",

    startMode: "image",
    gridMode: "auto",
    autoDensity: "balanced",
    autoTileSize: 88,
    autoMaxColumns: 16,
    autoMaxRows: 10,
    columns: 5,
    rows: 5,
    lockGrid: true,
    scrambleMoves: 90,
    shuffleSeed: 7,

    layoutMode: "squareTiles",
    imageFit: "cover",

    gap: 2,
    radius: 8,
    slideMs: 220,
    hoverLift: 4,
    hoverScale: 0.012,

    ghostEnabled: true,
    ghostMs: 420,
    ghostOpacity: 0.42,
    ghostBlur: 2,
    ghostColor: "#050608",
    ghostColorAmount: 0.18,

    revealMode: "fade",
    revealLabel: "CONGRATS.",
    revealMessage: "You found the quiet layer.",
    revealCode: "",
    copyLabel: "Copy",
    copiedLabel: "Copied",
    revealLinkLabel: "",
    revealLink: "",

    revealFontFamily: "",
    messageSize: 17,
    messageLineHeight: 25,
    messageWeight: 430,
    messageLetterSpacing: -0.012,
    messageMaxWidth: 360,
    labelSize: 9,
    actionSize: 12,
    contentGap: 18,

    completionHold: 280,
    fadeDelayMax: 1400,
    fadeDurationMin: 620,
    fadeDurationMax: 1050,
    fadeJitter: 0.32,
    rewardDelay: 40,

    imageOpacity: 1,
    tintOpacity: 0.08,
    seamOpacity: 0.14,
    blankOpacity: 0.24,
    shadowOpacity: 0.16,

    background: "#080A0D",
    revealSurface: "#050608",
    revealText: "#F4F4F2",
    revealMuted: "#8F949B",
    revealAction: "#D8D2C2",
    tint: "#000000",
    seam: "#FFFFFF",
    blank: "#050608",
    text: "#FFFFFF",

    showLaunchButton: true,
    launchLabel: "SCRAMBLE",
    showControls: false,
    showStatus: false,
    showNumbers: false,
    previewControlsBottom: 56,
    previewControlsInset: 12,
    previewControlsScale: 1,
    rememberSolved: false,
    storageKey: "rule-form-hidden-puzzle-image",

    advanced: false,
    puzzlePlus: false,
    motionPlus: false,
    contentPlus: false,
    textPlus: false,
    colorPlus: false,
    previewPlus: false,

    reduceMotion: true,
}

addPropertyControls(HiddenPuzzleImage, {
    image: {
        type: ControlType.Image,
        title: "Image",
    },

    startMode: {
        type: ControlType.Enum,
        title: "Start",
        options: ["image", "scrambled"],
        optionTitles: ["Image", "Puzzle"],
        defaultValue: "image",
    },

    gridMode: {
        type: ControlType.Enum,
        title: "Board",
        options: ["auto", "manual"],
        optionTitles: ["Auto", "Manual"],
        defaultValue: "auto",
    },

    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["cover", "contain", "stretch"],
        optionTitles: ["Cover", "Contain", "Stretch"],
        defaultValue: "cover",
    },

    autoDensity: {
        type: ControlType.Enum,
        title: "Auto Size",
        options: ["roomy", "balanced", "dense", "custom"],
        optionTitles: ["Roomy", "Balanced", "Dense", "Custom"],
        defaultValue: "balanced",
        hidden: (props) => props.gridMode !== "auto",
    },

    columns: {
        type: ControlType.Number,
        title: "Grid Size",
        min: 2,
        max: 12,
        step: 1,
        defaultValue: 5,
        hidden: (props) => props.gridMode === "auto",
    },

    scrambleMoves: {
        type: ControlType.Number,
        title: "Scramble",
        min: 0,
        max: 300,
        step: 1,
        defaultValue: 90,
    },

    showLaunchButton: {
        type: ControlType.Boolean,
        title: "Launch Button",
        defaultValue: true,
        hidden: (props) => props.startMode !== "image",
    },

    launchLabel: {
        type: ControlType.String,
        title: "Launch Label",
        defaultValue: "SCRAMBLE",
        hidden: (props) =>
            props.startMode !== "image" || !props.showLaunchButton,
    },

    showControls: {
        type: ControlType.Boolean,
        title: "Demo Controls",
        defaultValue: false,
    },

    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#080A0D",
    },

    contentPlus: {
        type: ControlType.Boolean,
        title: "Reveal Content",
        defaultValue: false,
    },

    revealMode: {
        type: ControlType.Enum,
        title: "Reveal Type",
        options: ["fade", "none"],
        optionTitles: ["Fade", "None"],
        defaultValue: "fade",
        hidden: (props) => !props.contentPlus,
    },

    revealMessage: {
        type: ControlType.String,
        title: "Message",
        defaultValue: "You found the quiet layer.",
        displayTextArea: true,
        hidden: (props) => !props.contentPlus || props.revealMode === "none",
    },

    revealCode: {
        type: ControlType.String,
        title: "Coupon Code",
        defaultValue: "",
        placeholder: "LAUNCH20",
        hidden: (props) => !props.contentPlus || props.revealMode === "none",
    },

    copyLabel: {
        type: ControlType.String,
        title: "Copy Text",
        defaultValue: "Copy",
        hidden: (props) =>
            !props.contentPlus ||
            props.revealMode === "none" ||
            !props.revealCode,
    },

    copiedLabel: {
        type: ControlType.String,
        title: "Copied Text",
        defaultValue: "Copied",
        hidden: (props) =>
            !props.contentPlus ||
            props.revealMode === "none" ||
            !props.revealCode,
    },

    revealLinkLabel: {
        type: ControlType.String,
        title: "Link Text",
        defaultValue: "",
        placeholder: "Open",
        hidden: (props) => !props.contentPlus || props.revealMode === "none",
    },

    revealLink: {
        type: ControlType.Link,
        title: "Link URL",
        defaultValue: "",
        hidden: (props) => !props.contentPlus || props.revealMode === "none",
    },

    revealLabel: {
        type: ControlType.String,
        title: "Small Label",
        defaultValue: "CONGRATS.",
        placeholder: "Optional",
        hidden: (props) => !props.contentPlus || props.revealMode === "none",
    },

    revealSurface: {
        type: ControlType.Color,
        title: "Reveal BG",
        defaultValue: "#050608",
        hidden: (props) => !props.contentPlus || props.revealMode === "none",
    },

    advanced: {
        type: ControlType.Boolean,
        title: "Advanced",
        defaultValue: false,
    },

    puzzlePlus: {
        type: ControlType.Boolean,
        title: "Layout+",
        defaultValue: false,
        hidden: (props) => !props.advanced,
    },

    autoTileSize: {
        type: ControlType.Number,
        title: "Custom Tile",
        min: 48,
        max: 240,
        step: 1,
        defaultValue: 88,
        hidden: (props) =>
            !props.advanced ||
            !props.puzzlePlus ||
            props.gridMode !== "auto" ||
            props.autoDensity !== "custom",
    },

    autoMaxColumns: {
        type: ControlType.Number,
        title: "Max Columns",
        min: 2,
        max: 24,
        step: 1,
        defaultValue: 16,
        hidden: (props) =>
            !props.advanced || !props.puzzlePlus || props.gridMode !== "auto",
    },

    autoMaxRows: {
        type: ControlType.Number,
        title: "Max Rows",
        min: 2,
        max: 24,
        step: 1,
        defaultValue: 10,
        hidden: (props) =>
            !props.advanced || !props.puzzlePlus || props.gridMode !== "auto",
    },

    lockGrid: {
        type: ControlType.Boolean,
        title: "Square Grid",
        defaultValue: true,
        hidden: (props) =>
            !props.advanced || !props.puzzlePlus || props.gridMode === "auto",
    },

    rows: {
        type: ControlType.Number,
        title: "Rows",
        min: 2,
        max: 12,
        step: 1,
        defaultValue: 5,
        hidden: (props) =>
            !props.advanced ||
            !props.puzzlePlus ||
            props.gridMode === "auto" ||
            props.lockGrid,
    },

    layoutMode: {
        type: ControlType.Enum,
        title: "Manual Layout",
        options: ["squareTiles", "coverSquare", "fillFrame"],
        optionTitles: ["Fit", "Cover", "Stretch"],
        defaultValue: "squareTiles",
        hidden: (props) =>
            !props.advanced || !props.puzzlePlus || props.gridMode === "auto",
    },

    gap: {
        type: ControlType.Number,
        title: "Tile Gap",
        min: 0,
        max: 12,
        step: 0.25,
        defaultValue: 2,
        hidden: (props) => !props.advanced || !props.puzzlePlus,
    },

    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 32,
        step: 0.5,
        defaultValue: 8,
        hidden: (props) => !props.advanced || !props.puzzlePlus,
    },

    shuffleSeed: {
        type: ControlType.Number,
        title: "Pattern",
        min: 1,
        max: 9999,
        step: 1,
        defaultValue: 7,
        hidden: (props) => !props.advanced || !props.puzzlePlus,
    },

    motionPlus: {
        type: ControlType.Boolean,
        title: "Motion+",
        defaultValue: false,
        hidden: (props) => !props.advanced,
    },

    slideMs: {
        type: ControlType.Number,
        title: "Slide",
        min: 0,
        max: 800,
        step: 10,
        defaultValue: 220,
        hidden: (props) => !props.advanced || !props.motionPlus,
    },

    hoverLift: {
        type: ControlType.Number,
        title: "Hover Lift",
        min: 0,
        max: 20,
        step: 0.5,
        defaultValue: 4,
        hidden: (props) => !props.advanced || !props.motionPlus,
    },

    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        min: 0,
        max: 0.08,
        step: 0.001,
        defaultValue: 0.012,
        hidden: (props) => !props.advanced || !props.motionPlus,
    },

    ghostEnabled: {
        type: ControlType.Boolean,
        title: "Ghost Trail",
        defaultValue: true,
        hidden: (props) => !props.advanced || !props.motionPlus,
    },

    ghostMs: {
        type: ControlType.Number,
        title: "Ghost Time",
        min: 80,
        max: 1200,
        step: 10,
        defaultValue: 420,
        hidden: (props) =>
            !props.advanced || !props.motionPlus || !props.ghostEnabled,
    },

    ghostOpacity: {
        type: ControlType.Number,
        title: "Ghost Opacity",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.42,
        hidden: (props) =>
            !props.advanced || !props.motionPlus || !props.ghostEnabled,
    },

    ghostBlur: {
        type: ControlType.Number,
        title: "Ghost Blur",
        min: 0,
        max: 12,
        step: 0.5,
        defaultValue: 2,
        hidden: (props) =>
            !props.advanced || !props.motionPlus || !props.ghostEnabled,
    },

    completionHold: {
        type: ControlType.Number,
        title: "Reveal Hold",
        min: 0,
        max: 1600,
        step: 20,
        defaultValue: 280,
        hidden: (props) =>
            !props.advanced || !props.motionPlus || props.revealMode === "none",
    },

    fadeDelayMax: {
        type: ControlType.Number,
        title: "Fade Spread",
        min: 0,
        max: 3000,
        step: 20,
        defaultValue: 1400,
        hidden: (props) =>
            !props.advanced || !props.motionPlus || props.revealMode === "none",
    },

    fadeJitter: {
        type: ControlType.Number,
        title: "Fade Jitter",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.32,
        hidden: (props) =>
            !props.advanced || !props.motionPlus || props.revealMode === "none",
    },

    fadeDurationMin: {
        type: ControlType.Number,
        title: "Fade Min",
        min: 0,
        max: 4000,
        step: 20,
        defaultValue: 620,
        hidden: (props) =>
            !props.advanced || !props.motionPlus || props.revealMode === "none",
    },

    fadeDurationMax: {
        type: ControlType.Number,
        title: "Fade Max",
        min: 0,
        max: 6000,
        step: 20,
        defaultValue: 1050,
        hidden: (props) =>
            !props.advanced || !props.motionPlus || props.revealMode === "none",
    },

    rewardDelay: {
        type: ControlType.Number,
        title: "Text Delay",
        min: 0,
        max: 2000,
        step: 20,
        defaultValue: 40,
        hidden: (props) =>
            !props.advanced || !props.motionPlus || props.revealMode === "none",
    },

    textPlus: {
        type: ControlType.Boolean,
        title: "Text+",
        defaultValue: false,
        hidden: (props) => !props.advanced,
    },

    revealFontFamily: {
        type: ControlType.String,
        title: "Font Family",
        defaultValue: "",
        placeholder: "inherit",
        hidden: (props) => !props.advanced || !props.textPlus,
    },

    messageSize: {
        type: ControlType.Number,
        title: "Message Size",
        min: 8,
        max: 48,
        step: 1,
        defaultValue: 17,
        hidden: (props) => !props.advanced || !props.textPlus,
    },

    messageLineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        min: 8,
        max: 72,
        step: 1,
        defaultValue: 25,
        hidden: (props) => !props.advanced || !props.textPlus,
    },

    messageWeight: {
        type: ControlType.Number,
        title: "Weight",
        min: 100,
        max: 900,
        step: 100,
        defaultValue: 430,
        hidden: (props) => !props.advanced || !props.textPlus,
    },

    messageLetterSpacing: {
        type: ControlType.Number,
        title: "Tracking",
        min: -0.08,
        max: 0.12,
        step: 0.001,
        defaultValue: -0.012,
        hidden: (props) => !props.advanced || !props.textPlus,
    },

    messageMaxWidth: {
        type: ControlType.Number,
        title: "Text Width",
        min: 120,
        max: 700,
        step: 10,
        defaultValue: 360,
        hidden: (props) => !props.advanced || !props.textPlus,
    },

    labelSize: {
        type: ControlType.Number,
        title: "Label Size",
        min: 8,
        max: 24,
        step: 1,
        defaultValue: 9,
        hidden: (props) => !props.advanced || !props.textPlus,
    },

    actionSize: {
        type: ControlType.Number,
        title: "Action Size",
        min: 8,
        max: 24,
        step: 1,
        defaultValue: 12,
        hidden: (props) => !props.advanced || !props.textPlus,
    },

    contentGap: {
        type: ControlType.Number,
        title: "Text Gap",
        min: 0,
        max: 48,
        step: 1,
        defaultValue: 18,
        hidden: (props) => !props.advanced || !props.textPlus,
    },

    colorPlus: {
        type: ControlType.Boolean,
        title: "Colors+",
        defaultValue: false,
        hidden: (props) => !props.advanced,
    },

    revealText: {
        type: ControlType.Color,
        title: "Reveal Text",
        defaultValue: "#F4F4F2",
        hidden: (props) => !props.advanced || !props.colorPlus,
    },

    revealMuted: {
        type: ControlType.Color,
        title: "Reveal Muted",
        defaultValue: "#8F949B",
        hidden: (props) => !props.advanced || !props.colorPlus,
    },

    revealAction: {
        type: ControlType.Color,
        title: "Action Color",
        defaultValue: "#D8D2C2",
        hidden: (props) => !props.advanced || !props.colorPlus,
    },

    tint: {
        type: ControlType.Color,
        title: "Image Tint",
        defaultValue: "#000000",
        hidden: (props) => !props.advanced || !props.colorPlus,
    },

    tintOpacity: {
        type: ControlType.Number,
        title: "Tint Opacity",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.08,
        hidden: (props) => !props.advanced || !props.colorPlus,
    },

    imageOpacity: {
        type: ControlType.Number,
        title: "Image Opacity",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 1,
        hidden: (props) => !props.advanced || !props.colorPlus,
    },

    seam: {
        type: ControlType.Color,
        title: "Seam",
        defaultValue: "#FFFFFF",
        hidden: (props) => !props.advanced || !props.colorPlus,
    },

    seamOpacity: {
        type: ControlType.Number,
        title: "Seam Opacity",
        min: 0,
        max: 0.8,
        step: 0.01,
        defaultValue: 0.14,
        hidden: (props) => !props.advanced || !props.colorPlus,
    },

    blank: {
        type: ControlType.Color,
        title: "Blank Tile",
        defaultValue: "#050608",
        hidden: (props) => !props.advanced || !props.colorPlus,
    },

    blankOpacity: {
        type: ControlType.Number,
        title: "Blank Opacity",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.24,
        hidden: (props) => !props.advanced || !props.colorPlus,
    },

    shadowOpacity: {
        type: ControlType.Number,
        title: "Shadow",
        min: 0,
        max: 0.8,
        step: 0.01,
        defaultValue: 0.16,
        hidden: (props) => !props.advanced || !props.colorPlus,
    },

    ghostColor: {
        type: ControlType.Color,
        title: "Ghost Color",
        defaultValue: "#050608",
        hidden: (props) =>
            !props.advanced || !props.colorPlus || !props.ghostEnabled,
    },

    ghostColorAmount: {
        type: ControlType.Number,
        title: "Ghost Tint",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.18,
        hidden: (props) =>
            !props.advanced || !props.colorPlus || !props.ghostEnabled,
    },

    text: {
        type: ControlType.Color,
        title: "UI Text",
        defaultValue: "#FFFFFF",
        hidden: (props) => !props.advanced || !props.colorPlus,
    },

    previewPlus: {
        type: ControlType.Boolean,
        title: "Preview+",
        defaultValue: false,
        hidden: (props) => !props.advanced,
    },

    showStatus: {
        type: ControlType.Boolean,
        title: "Grid Status",
        defaultValue: false,
        hidden: (props) =>
            !props.advanced || !props.previewPlus || !props.showControls,
    },

    showNumbers: {
        type: ControlType.Boolean,
        title: "Tile Numbers",
        defaultValue: false,
        hidden: (props) =>
            !props.advanced || !props.previewPlus || !props.showControls,
    },

    previewControlsBottom: {
        type: ControlType.Number,
        title: "Demo Bottom",
        min: 0,
        max: 240,
        step: 1,
        defaultValue: 56,
        hidden: (props) =>
            !props.advanced || !props.previewPlus || !props.showControls,
    },

    previewControlsInset: {
        type: ControlType.Number,
        title: "Demo Right Gap",
        min: 0,
        max: 360,
        step: 1,
        defaultValue: 12,
        hidden: (props) =>
            !props.advanced || !props.previewPlus || !props.showControls,
    },

    previewControlsScale: {
        type: ControlType.Number,
        title: "Demo Scale",
        min: 0.55,
        max: 1.2,
        step: 0.01,
        defaultValue: 1,
        hidden: (props) =>
            !props.advanced || !props.previewPlus || !props.showControls,
    },

    rememberSolved: {
        type: ControlType.Boolean,
        title: "Remember Solved",
        defaultValue: false,
        hidden: (props) => !props.advanced,
    },

    storageKey: {
        type: ControlType.String,
        title: "Storage Key",
        defaultValue: "rule-form-hidden-puzzle-image",
        hidden: (props) => !props.advanced || !props.rememberSolved,
    },

    reduceMotion: {
        type: ControlType.Boolean,
        title: "Respect Reduce Motion",
        defaultValue: true,
        hidden: (props) => !props.advanced || !props.motionPlus,
    },
})
