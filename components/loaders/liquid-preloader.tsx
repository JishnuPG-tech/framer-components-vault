import {
    useEffect,
    useLayoutEffect,
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


type Kind = "number" | "logo" | "bar"
type Place = "bottomLeft" | "bottomRight" | "center"
type Exit = "slideUp" | "slideDown" | "fade" | "circle"
type Show = "load" | "session" | "first"

interface ImageValue {
    src: string
    srcSet?: string
    alt?: string
}

interface Props {
    kind: Kind
    logo?: ImageValue
    size: number
    logoSize: number
    place: Place
    percent: boolean
    show: Show
    minTime: number
    exit: Exit
    exitTime: number
    wave: number
    showStatus: boolean
    loadingText: string
    almostText: string
    background: string
    fill: string
    track: string
    statusColor: string
    font: CSSProperties
    canvas: "show" | "hide"
    canvasProgress: number
    style?: CSSProperties
}

interface EngineOptions {
    min: number
    exit: Exit
    exitTime: number
    loadingText: string
    almostText: string
}

const STORAGE_KEY = "joviseo-liquid-preloader"
// 상태 문구가 "거의 다 됨"으로 바뀌는 지점
const ALMOST_AT = 70
// 리액트가 뜨기 전 CSS만으로 최소 시간 동안 올라가는 지점. 그 뒤로는 97%까지 아주 천천히 오르고,
// 나머지는 엔진이 페이지 로드를 확인한 뒤 채운다
const CSS_LIMIT = 0.9
// 페이지가 끝까지 로드되지 않아도 최소 시간 뒤 이만큼 더 기다리면 닫는다
const MAX_WAIT = 6000
// 100%를 보여준 뒤 닫기 전까지 잠깐 멈추는 시간
const HOLD = 250
// 물결 한 칸이 옆으로 지나가는 시간
const WAVE_PERIOD = 1.8
const EASE = "cubic-bezier(0.76, 0, 0.24, 1)"

// Framer의 리액트는 게시된 페이지에서 몇 초 늦게 뜨므로, 그 전까지는 CSS만으로 움직인다.
// --liquid-n(정수)은 숫자로, --liquid-p(0~1)는 물결 높이와 막대 길이로, --liquid-shift는 물결 흐름으로 쓴다.
// 리액트가 뜨면 엔진이 CSS 애니메이션을 멈추고 같은 값을 이어서 직접 바꾼다
const BASE_CSS = `
@property --liquid-n { syntax: "<integer>"; inherits: true; initial-value: 0; }
@property --liquid-p { syntax: "<number>"; inherits: true; initial-value: 0; }
@property --liquid-shift { syntax: "<number>"; inherits: true; initial-value: 0; }
@keyframes liquidPreloaderCount { to { --liquid-n: ${CSS_LIMIT * 100}; --liquid-p: ${CSS_LIMIT}; } }
@keyframes liquidPreloaderCreep { from { --liquid-n: ${CSS_LIMIT * 100}; --liquid-p: ${CSS_LIMIT}; } to { --liquid-n: 97; --liquid-p: 0.97; } }
@keyframes liquidPreloaderWave { to { --liquid-shift: 1; } }
[data-liquid-number]::before { counter-reset: liquid var(--liquid-n); content: counter(liquid); }
[data-liquid-number][data-percent]::before { content: counter(liquid) "%"; }
`

// 자바스크립트가 끝내 실행되지 않아도 사이트가 가려진 채로 남지 않게, 10초 뒤 CSS만으로 사라지고 스크롤도 풀린다.
// 프리로더가 떠 있는 동안에는 뒤 페이지가 스크롤되지 않게 한다
const PAGE_CSS = `
@keyframes liquidPreloaderSafety { to { opacity: 0; visibility: hidden; } }
@keyframes liquidPreloaderUnlock { to { overflow: visible; } }
html:has([data-liquid-preloader]:not([data-done])) { overflow: hidden; animation: liquidPreloaderUnlock 0s linear 10.4s forwards; }
@media (prefers-reduced-motion: reduce) { [data-liquid-preloader] { --liquid-shift: 0 !important; } }
`

// 페이지를 옮겨 다닐 때는 모듈이 그대로 남으므로, 한 번 로드에 한 번만 보여주는 데 쓴다
let shownThisLoad = false

const useIsomorphicLayoutEffect =
    typeof window === "undefined" ? useEffect : useLayoutEffect

function storageFor(show: Show) {
    try {
        if (show === "session") return window.sessionStorage
        if (show === "first") return window.localStorage
    } catch {}
    return null
}

function seenBefore(show: Show) {
    if (shownThisLoad) return true
    try {
        return Boolean(storageFor(show)?.getItem(STORAGE_KEY))
    } catch {
        return false
    }
}

function remember(show: Show) {
    shownThisLoad = true
    try {
        storageFor(show)?.setItem(STORAGE_KEY, "1")
    } catch {}
}

const easeOut = (t: number) => 1 - (1 - t) * (1 - t)

// CSS가 올려 둔 값에서 이어받아, 페이지 로드를 확인하며 100%까지 채우고 퇴장시킨다
function runEngine(
    overlay: HTMLElement,
    options: EngineOptions,
    onDone: () => void
) {
    const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches
    const min = Math.max(options.min, 0.2) * 1000
    const exitTime = reduced ? 0.2 : options.exitTime
    const now = performance.now()
    // CSS 애니메이션이 지금 어디까지 왔는지 읽고 멈춘다
    const computed = getComputedStyle(overlay)
    let value = (parseFloat(computed.getPropertyValue("--liquid-p")) || 0) * 100
    let shift = parseFloat(computed.getPropertyValue("--liquid-shift")) || 0
    overlay.style.animation = "none"
    overlay.style.setProperty("--liquid-p", String(value / 100))
    overlay.style.setProperty("--liquid-n", String(Math.floor(value)))
    // 지금 값에 해당하는 시각부터 센다 (CSS와 같은 곡선)
    const reached = Math.min(value / (CSS_LIMIT * 100), 1)
    const begin = now - min * (1 - Math.sqrt(1 - reached))
    let loaded = document.readyState === "complete"
    const onLoad = () => {
        loaded = true
    }
    window.addEventListener("load", onLoad)
    if (options.exit === "circle" && !reduced) {
        overlay.style.clipPath = "circle(150% at 50% 50%)"
    }
    const status = overlay.querySelectorAll<HTMLElement>("[data-status]")

    let last = now
    let fullAt = 0
    let frame = 0
    let timer = 0
    let stopped = false

    const leave = () => {
        overlay.style.transition = ["transform", "opacity", "clip-path"]
            .map((property) => `${property} ${exitTime}s ${EASE}`)
            .join(", ")
        const content = overlay.firstElementChild as HTMLElement | null
        if (content) {
            content.style.transition = `opacity ${exitTime * 0.5}s ease`
            content.style.opacity = "0"
        }
        // 전환이 시작점부터 움직이도록 한 번 그린 뒤에 목표 상태로 바꾼다
        overlay.getBoundingClientRect()
        if (reduced || options.exit === "fade") overlay.style.opacity = "0"
        else if (options.exit === "slideUp")
            overlay.style.transform = "translateY(-100%)"
        else if (options.exit === "slideDown")
            overlay.style.transform = "translateY(100%)"
        else overlay.style.clipPath = "circle(0% at 50% 50%)"
        timer = window.setTimeout(() => {
            overlay.setAttribute("data-done", "")
            onDone()
        }, exitTime * 1000)
    }

    const step = (time: number) => {
        if (stopped) return
        const elapsed = time - begin
        const delta = time - last
        last = time
        if (elapsed > min + MAX_WAIT) loaded = true
        // 최소 시간 동안 0에서 100으로 가되, 아직 로드 중이면 90% 근처에서 천천히 기다린다
        let goal = 100 * easeOut(Math.min(elapsed / min, 1))
        if (!loaded) {
            const waiting = Math.max(0, elapsed - min)
            goal = Math.min(goal, 90 + 8 * (1 - Math.exp(-waiting / 3000)))
        }
        value = Math.max(
            value,
            value + (goal - value) * Math.min(1, delta / 90)
        )
        if (loaded && goal >= 100 && value > 99.4) value = 100

        if (!reduced) shift = (shift + delta / (WAVE_PERIOD * 1000)) % 1
        overlay.style.setProperty("--liquid-p", String(value / 100))
        overlay.style.setProperty("--liquid-n", String(Math.floor(value)))
        overlay.style.setProperty("--liquid-shift", String(shift))
        overlay.setAttribute("aria-valuenow", String(Math.floor(value)))
        const label =
            value >= ALMOST_AT ? options.almostText : options.loadingText
        // 화면에 보이는 문구가 바뀌면 화면 읽기 프로그램도 같은 문구와 진행률을 듣게 한다
        overlay.setAttribute("aria-valuetext", `${label} ${Math.floor(value)}%`)
        status.forEach((element) => {
            if (element.textContent !== label) element.textContent = label
        })

        if (value >= 100) {
            if (!fullAt) fullAt = time
            if (time - fullAt >= HOLD) {
                leave()
                return
            }
        }
        frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)

    return () => {
        stopped = true
        cancelAnimationFrame(frame)
        window.clearTimeout(timer)
        window.removeEventListener("load", onLoad)
    }
}

// 물결 윗면 아래만 보이게 하는 마스크. 가로 1em = 100 단위이고, 물결은 a에서 3a 사이를 오르내린다
function waveMask(wave: number) {
    const a = wave / 2
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 300" preserveAspectRatio="none"><path d="M0 ${2 * a} Q25 0 50 ${2 * a} T100 ${2 * a} V300 H0Z"/></svg>`
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

// 진행률(--liquid-p)에 따라 물결 높이를, --liquid-shift에 따라 물결 흐름을 정한다.
// top과 bottom은 채울 모양의 위아래 끝(em)이다
function maskPosition(wave: number, [top, bottom]: number[]) {
    const a = wave / 200
    const start = bottom + a
    const end = top - a - 0.02
    return `calc(var(--liquid-shift) * -1em) calc(${start - 2 * a}em + ${end - start}em * var(--liquid-p))`
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 * @framerDisableUnlink
 */
export default function LiquidPreloader(props: Props) {
    const {
        kind = "number",
        logo,
        size = 200,
        logoSize = 140,
        place = "bottomLeft",
        percent = true,
        show = "session",
        minTime = 1.5,
        exit = "slideUp",
        exitTime = 0.7,
        wave = 6,
        showStatus = true,
        loadingText = "Loading",
        almostText = "Almost there",
        background = "#FFFFFF",
        fill = "#111111",
        track = "#E6E6E6",
        statusColor = "#8A8A8A",
        font,
        canvas = "show",
        canvasProgress = 60,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const root = useRef<HTMLDivElement>(null)
    const overlay = useRef<HTMLDivElement>(null)
    const [done, setDone] = useState(false)

    // 로고를 고르지 않았으면 숫자로 보여준다
    const look = kind === "logo" && !logo?.src ? "number" : kind
    // 줄 높이 1에서 숫자 글자는 대략 위 0.13em부터 아래 0.87em까지 차지한다
    const span = look === "logo" ? [0, 1] : [0.13, 0.87]

    // 화면을 그리기 전에 정한다. 이미 본 방문자면 걷어내고, 아니면 CSS가 올려 둔 값에서 엔진이 이어받는다
    useIsomorphicLayoutEffect(() => {
        if (isStatic) return
        const element = overlay.current
        if (!element) return
        if (seenBefore(show)) {
            // 미리 그려진 화면에 잠깐 떠 있던 프리로더를 빠르게 걷어낸다
            element.style.transition = "opacity 0.25s ease"
            element.style.opacity = "0"
            const timer = window.setTimeout(() => setDone(true), 250)
            return () => window.clearTimeout(timer)
        }
        remember(show)
        return runEngine(
            element,
            { min: minTime, exit, exitTime, loadingText, almostText },
            () => setDone(true)
        )
    }, [])

    // Framer가 컴포넌트를 감싸는 상자는 클릭을 막으므로, 프리로더 화면만 클릭을 받게 한다
    useEffect(() => {
        if (isStatic) return
        const box = root.current?.parentElement
        if (box) box.style.pointerEvents = "none"
    }, [isStatic])

    if (isStatic && canvas === "hide") {
        return (
            <div
                style={{
                    width: 1200,
                    height: 800,
                    ...style,
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `2px dashed ${statusColor}`,
                    color: statusColor,
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: 14,
                }}
            >
                Liquid Preloader (hidden on canvas)
            </div>
        )
    }

    const mask = waveMask(wave)
    const position = maskPosition(wave, span)
    const liquid: CSSProperties = {
        WebkitMaskImage: mask,
        maskImage: mask,
        WebkitMaskSize: "1em 3em",
        maskSize: "1em 3em",
        WebkitMaskRepeat: "repeat-x",
        maskRepeat: "repeat-x",
        WebkitMaskPosition: position,
        maskPosition: position,
    }
    // 숫자는 CSS 카운터(--liquid-n)가 그린다
    const counter = (extra: CSSProperties) => (
        <span
            data-liquid-number=""
            data-percent={percent ? "" : undefined}
            style={extra}
        />
    )
    const label =
        isStatic && canvasProgress >= ALMOST_AT ? almostText : loadingText

    const status = showStatus && (
        <span
            style={{
                display: "flex",
                gap: 6,
                fontFamily: font?.fontFamily,
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "0.02em",
                color: statusColor,
                whiteSpace: "nowrap",
            }}
        >
            <span data-status="">{label}</span>
            {look === "logo" && counter({})}
        </span>
    )

    let content
    if (look === "number") {
        content = (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems:
                        place === "center"
                            ? "center"
                            : place === "bottomRight"
                              ? "flex-end"
                              : "flex-start",
                    gap: 12,
                }}
            >
                <div
                    aria-hidden="true"
                    style={{
                        position: "relative",
                        fontWeight: 700,
                        letterSpacing: "-0.04em",
                        ...font,
                        fontSize: `min(${size}px, 26vw)`,
                        lineHeight: 1,
                        whiteSpace: "nowrap",
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    {counter({ display: "block", color: track })}
                    {counter({
                        position: "absolute",
                        inset: 0,
                        display: "block",
                        color: fill,
                        ...liquid,
                    })}
                </div>
                {status}
            </div>
        )
    } else if (look === "logo") {
        const image = (extra: CSSProperties) => (
            <img
                src={logo!.src}
                srcSet={logo!.srcSet}
                alt=""
                draggable={false}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    ...extra,
                }}
            />
        )
        content = (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 16,
                }}
            >
                <div
                    aria-hidden="true"
                    style={{
                        position: "relative",
                        fontSize: `min(${logoSize}px, 50vw)`,
                        width: "1em",
                        height: "1em",
                    }}
                >
                    {image({ opacity: 0.15, filter: "grayscale(1)" })}
                    <div style={{ position: "absolute", inset: 0, ...liquid }}>
                        {image({})}
                    </div>
                </div>
                {status}
            </div>
        )
    } else {
        content = (
            <div
                style={{
                    width: "min(360px, 80vw)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    fontFamily: font?.fontFamily,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        color: statusColor,
                        fontSize: 13,
                        fontWeight: 500,
                    }}
                >
                    <span data-status="">{showStatus ? label : ""}</span>
                    {counter({
                        color: fill,
                        fontVariantNumeric: "tabular-nums",
                    })}
                </div>
                <div
                    style={{
                        height: 3,
                        borderRadius: 3,
                        background: track,
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            width: "calc(var(--liquid-p) * 100%)",
                            height: "100%",
                            borderRadius: 3,
                            background: fill,
                        }}
                    />
                </div>
            </div>
        )
    }

    const progress = isStatic ? canvasProgress : 0

    return (
        <div
            ref={root}
            style={{
                // 크기가 Fit으로 잡히면 Framer가 크기를 넘겨주지 않으므로, 0으로 접히지 않게 기본 크기를 둔다
                width: 1200,
                height: 800,
                ...style,
                position: "relative",
                pointerEvents: "none",
            }}
        >
            {/* BASE_CSS와 PAGE_CSS는 이 파일 안의 고정 문자열이고 속성 값이 들어가지 않는다.
                <style>의 자식 글자로 넣으면 미리 그린 HTML에서 < > " 가 문자 코드로 바뀌어 CSS가 깨지므로 그대로 넣는다 */}
            <style dangerouslySetInnerHTML={{ __html: BASE_CSS }} />
            {!isStatic && (
                <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
            )}
            {!done && (
                <div
                    ref={overlay}
                    role="progressbar"
                    aria-label={loadingText}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}
                    aria-valuetext={`${label} ${Math.floor(progress)}%`}
                    data-liquid-preloader=""
                    suppressHydrationWarning
                    style={
                        {
                            "--liquid-n": Math.floor(progress),
                            "--liquid-p": progress / 100,
                            "--liquid-shift": 0,
                            // 게시된 사이트에서는 창 전체를 덮고, 캔버스에서는 컴포넌트 상자 안에만 그린다
                            position: isStatic ? "absolute" : "fixed",
                            inset: 0,
                            zIndex: 2147483000,
                            boxSizing: "border-box",
                            display: "flex",
                            alignItems:
                                place === "center" ? "center" : "flex-end",
                            justifyContent:
                                place === "center"
                                    ? "center"
                                    : place === "bottomRight"
                                      ? "flex-end"
                                      : "flex-start",
                            padding: "clamp(20px, 4vw, 48px)",
                            background,
                            overflow: "hidden",
                            pointerEvents: "auto",
                            // 리액트가 뜨기 전까지 CSS로 숫자와 물결을 움직인다
                            animation: isStatic
                                ? "none"
                                : `liquidPreloaderCount ${Math.max(minTime, 0.2)}s cubic-bezier(0.5, 1, 0.89, 1) forwards, liquidPreloaderCreep 8s cubic-bezier(0, 0, 0.3, 1) ${Math.max(minTime, 0.2)}s forwards, liquidPreloaderWave ${WAVE_PERIOD}s linear infinite, liquidPreloaderSafety 0.4s linear 10s forwards`,
                        } as CSSProperties
                    }
                >
                    <div suppressHydrationWarning>{content}</div>
                </div>
            )}
        </div>
    )
}

addPropertyControls(LiquidPreloader, {
    kind: {
        type: ControlType.Enum,
        title: "Style",
        options: ["number", "logo", "bar"],
        optionTitles: ["Number", "Logo", "Bar"],
        defaultValue: "number",
    },
    logo: {
        type: ControlType.ResponsiveImage,
        title: "Logo",
        hidden: (props) => props.kind !== "logo",
    },
    logoSize: {
        type: ControlType.Number,
        title: "Logo Size",
        min: 40,
        max: 400,
        step: 4,
        unit: "px",
        defaultValue: 140,
        hidden: (props) => props.kind !== "logo",
    },
    size: {
        type: ControlType.Number,
        title: "Number Size",
        min: 40,
        max: 400,
        step: 4,
        unit: "px",
        defaultValue: 200,
        hidden: (props) => props.kind !== "number",
    },
    percent: {
        type: ControlType.Boolean,
        title: "% Sign",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },
    place: {
        type: ControlType.Enum,
        title: "Position",
        options: ["bottomLeft", "bottomRight", "center"],
        optionTitles: ["Bottom Left", "Bottom Right", "Center"],
        defaultValue: "bottomLeft",
    },
    wave: {
        type: ControlType.Number,
        title: "Wave",
        min: 0,
        max: 20,
        step: 1,
        defaultValue: 6,
        hidden: (props) => props.kind === "bar",
    },
    show: {
        type: ControlType.Enum,
        title: "Show",
        options: ["load", "session", "first"],
        optionTitles: ["Every Load", "Once per Visit", "First Visit Only"],
        defaultValue: "session",
    },
    minTime: {
        type: ControlType.Number,
        title: "Min Time",
        min: 0.5,
        max: 6,
        step: 0.1,
        unit: "s",
        defaultValue: 1.5,
    },
    exit: {
        type: ControlType.Enum,
        title: "Exit",
        options: ["slideUp", "slideDown", "fade", "circle"],
        optionTitles: ["Slide Up", "Slide Down", "Fade", "Circle"],
        defaultValue: "slideUp",
    },
    exitTime: {
        type: ControlType.Number,
        title: "Exit Time",
        min: 0.2,
        max: 2,
        step: 0.1,
        unit: "s",
        defaultValue: 0.7,
    },
    showStatus: {
        type: ControlType.Boolean,
        title: "Status Text",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },
    loadingText: {
        type: ControlType.String,
        title: "Loading",
        defaultValue: "Loading",
        hidden: (props) => !props.showStatus,
    },
    almostText: {
        type: ControlType.String,
        title: "Almost",
        defaultValue: "Almost there",
        hidden: (props) => !props.showStatus,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    fill: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: "#111111",
    },
    track: {
        type: ControlType.Color,
        title: "Empty",
        defaultValue: "#E6E6E6",
    },
    statusColor: {
        type: ControlType.Color,
        title: "Status",
        defaultValue: "#8A8A8A",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            variant: "Bold",
            letterSpacing: "-0.04em",
        },
    },
    canvas: {
        type: ControlType.Enum,
        title: "On Canvas",
        options: ["show", "hide"],
        optionTitles: ["Show", "Hide"],
        defaultValue: "show",
        displaySegmentedControl: true,
        description: "Created by [Joviseo](https://joviseo.vercel.app)",
    },
    canvasProgress: {
        type: ControlType.Number,
        title: "Canvas %",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 60,
        hidden: (props) => props.canvas === "hide",
    },
})
