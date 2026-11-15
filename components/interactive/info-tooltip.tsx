import {
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
    type CSSProperties,
} from "react"
import { createPortal } from "react-dom"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Trigger = "icon" | "text"
type Side = "top" | "bottom" | "left" | "right"

interface IconProps {
    shape: "info" | "question"
    size: number
    color: string
}

interface TermProps {
    color: string
    underline: "dotted" | "dashed" | "solid" | "none"
}

interface BoxProps {
    fill: string
    color: string
    radius: number
    padding: number
    maxWidth: number
    arrow: boolean
    shadow: boolean
}

interface Props {
    trigger: Trigger
    term: string
    title: string
    text: string
    side: Side
    gap: number
    delay: number
    icon: Partial<IconProps>
    termStyle: Partial<TermProps>
    termFont: CSSProperties
    box: Partial<BoxProps>
    font: CSSProperties
    canvasPreview: boolean
    style?: CSSProperties
}

const MARGIN = 8
const ARROW = 6

const OPPOSITE: Record<Side, Side> = {
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left",
}

interface Placement {
    side: Side
    left: number
    top: number
    // 화살표가 말풍선의 가장자리를 따라 놓이는 자리. 말풍선이 밀려도 단추를 가리키게 한다
    arrow: number
}

// 단추 옆에 말풍선을 놓을 자리를 정한다. 고른 쪽에 자리가 없으면 반대쪽으로 넘긴다
function place(
    anchor: DOMRect,
    width: number,
    height: number,
    wanted: Side,
    gap: number
): Placement {
    const viewWidth = window.innerWidth
    const viewHeight = window.innerHeight
    const space: Record<Side, number> = {
        top: anchor.top,
        bottom: viewHeight - anchor.bottom,
        left: anchor.left,
        right: viewWidth - anchor.right,
    }
    const vertical = wanted === "top" || wanted === "bottom"
    const needed = (vertical ? height : width) + gap + MARGIN
    const side =
        space[wanted] < needed && space[OPPOSITE[wanted]] > space[wanted]
            ? OPPOSITE[wanted]
            : wanted

    const centerX = anchor.left + anchor.width / 2
    const centerY = anchor.top + anchor.height / 2
    let left: number
    let top: number
    if (side === "top" || side === "bottom") {
        left = centerX - width / 2
        top = side === "top" ? anchor.top - gap - height : anchor.bottom + gap
        left = Math.min(
            Math.max(left, MARGIN),
            Math.max(viewWidth - width - MARGIN, MARGIN)
        )
        return { side, left, top, arrow: centerX - left }
    }
    left = side === "left" ? anchor.left - gap - width : anchor.right + gap
    top = centerY - height / 2
    top = Math.min(
        Math.max(top, MARGIN),
        Math.max(viewHeight - height - MARGIN, MARGIN)
    )
    return { side, left, top, arrow: centerY - top }
}

function Glyph(props: { shape: IconProps["shape"]; size: number }) {
    return (
        <svg
            aria-hidden="true"
            width={props.size}
            height={props.size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ display: "block", flexShrink: 0 }}
        >
            <circle cx="12" cy="12" r="9.5" />
            {props.shape === "question" ? (
                <>
                    <path d="M9.4 9.3a2.7 2.7 0 0 1 5.2 1c0 1.8-2.6 2.2-2.6 3.9" />
                    <path d="M12 17.2h.01" />
                </>
            ) : (
                <>
                    <path d="M12 11v6" />
                    <path d="M12 7.2h.01" />
                </>
            )}
        </svg>
    )
}

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function HoverInfoTooltip(props: Props) {
    const {
        trigger = "icon",
        term = "API",
        title = "",
        text = "A short explanation that appears when visitors hover or tap.",
        side = "top",
        gap = 8,
        delay = 100,
        termFont,
        font,
        canvasPreview = false,
        style,
    } = props
    const icon: IconProps = {
        shape: "info",
        size: 18,
        color: "#6B6B76",
        ...props.icon,
    }
    const termStyle: TermProps = {
        color: "#111114",
        underline: "dotted",
        ...props.termStyle,
    }
    const box: BoxProps = {
        fill: "#111114",
        color: "#FFFFFF",
        radius: 10,
        padding: 12,
        maxWidth: 260,
        arrow: true,
        shadow: true,
        ...props.box,
    }

    const isStatic = useIsStaticRenderer()
    const id = useId()
    const buttonRef = useRef<HTMLButtonElement>(null)
    const bubbleRef = useRef<HTMLDivElement>(null)
    const timer = useRef(0)
    // 터치로 연 말풍선은 손가락을 떼도 닫히지 않게, 눌러서 연 상태를 따로 기억한다
    const pinned = useRef(false)
    const [open, setOpen] = useState(false)
    const [spot, setSpot] = useState<Placement | null>(null)

    const show = (wait: number) => {
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setOpen(true), wait)
    }
    const hide = () => {
        window.clearTimeout(timer.current)
        pinned.current = false
        setOpen(false)
    }

    useEffect(() => () => window.clearTimeout(timer.current), [])

    // 말풍선의 실제 크기를 잰 뒤에 자리를 정하고, 스크롤하거나 창 크기가 바뀌면 다시 맞춘다
    useLayoutEffect(() => {
        if (!open) {
            setSpot(null)
            return
        }
        const update = () => {
            const button = buttonRef.current
            const bubble = bubbleRef.current
            if (!button || !bubble) return
            setSpot(
                place(
                    button.getBoundingClientRect(),
                    bubble.offsetWidth,
                    bubble.offsetHeight,
                    side,
                    gap + (box.arrow ? ARROW : 0)
                )
            )
        }
        update()
        window.addEventListener("scroll", update, true)
        window.addEventListener("resize", update)
        return () => {
            window.removeEventListener("scroll", update, true)
            window.removeEventListener("resize", update)
        }
    }, [open, side, gap, box.arrow, text, title, box.maxWidth])

    useEffect(() => {
        if (!open) return
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") hide()
        }
        // 말풍선이 열린 채로 다른 곳을 누르면 닫는다
        const onDown = (event: PointerEvent) => {
            const target = event.target as Node
            if (buttonRef.current?.contains(target)) return
            if (bubbleRef.current?.contains(target)) return
            hide()
        }
        document.addEventListener("keydown", onKey)
        document.addEventListener("pointerdown", onDown)
        return () => {
            document.removeEventListener("keydown", onKey)
            document.removeEventListener("pointerdown", onDown)
        }
    }, [open])

    const content = (
        <>
            {title && (
                <strong
                    style={{
                        display: "block",
                        marginBottom: 4,
                        fontWeight: 600,
                    }}
                >
                    {title}
                </strong>
            )}
            {text}
        </>
    )
    const bubbleStyle: CSSProperties = {
        fontSize: 14,
        fontWeight: 400,
        lineHeight: 1.45,
        ...font,
        boxSizing: "border-box",
        width: "max-content",
        maxWidth: `min(${box.maxWidth}px, calc(100vw - ${MARGIN * 2}px))`,
        padding: box.padding,
        borderRadius: box.radius,
        background: box.fill,
        color: box.color,
        boxShadow: box.shadow ? "0px 8px 24px 0px rgba(0, 0, 0, 0.18)" : "none",
        textAlign: "left",
        whiteSpace: "pre-line",
        overflowWrap: "anywhere",
    }
    const arrowStyle = (
        placed: Side,
        along: number | string
    ): CSSProperties => {
        const base: CSSProperties = {
            position: "absolute",
            width: ARROW * 2,
            height: ARROW * 2,
            background: box.fill,
            transform: "rotate(45deg)",
        }
        if (placed === "top")
            return {
                ...base,
                bottom: -ARROW + 1,
                left: along,
                marginLeft: -ARROW,
            }
        if (placed === "bottom")
            return { ...base, top: -ARROW + 1, left: along, marginLeft: -ARROW }
        if (placed === "left")
            return { ...base, right: -ARROW + 1, top: along, marginTop: -ARROW }
        return { ...base, left: -ARROW + 1, top: along, marginTop: -ARROW }
    }

    const button = (
        <button
            ref={buttonRef}
            type="button"
            aria-describedby={open ? id : undefined}
            aria-label={
                trigger === "icon" ? title || "More information" : undefined
            }
            onPointerEnter={(event) => {
                if (event.pointerType === "mouse") show(delay)
            }}
            onPointerLeave={(event) => {
                if (event.pointerType === "mouse" && !pinned.current) hide()
            }}
            onFocus={() => show(0)}
            onBlur={hide}
            onClick={() => {
                // 터치 화면에서는 누를 때마다 열고 닫는다
                if (open && pinned.current) {
                    hide()
                    return
                }
                pinned.current = true
                show(0)
            }}
            style={{
                fontSize: 16,
                fontWeight: 500,
                lineHeight: 1.4,
                ...(trigger === "text" ? termFont : {}),
                display: "inline-flex",
                alignItems: "center",
                margin: 0,
                padding: 0,
                border: "none",
                background: "none",
                color: trigger === "text" ? termStyle.color : icon.color,
                cursor: "help",
                textDecorationLine:
                    trigger === "text" && termStyle.underline !== "none"
                        ? "underline"
                        : "none",
                textDecorationStyle:
                    termStyle.underline === "none"
                        ? undefined
                        : termStyle.underline,
                textUnderlineOffset: "0.25em",
                whiteSpace: "nowrap",
                WebkitTapHighlightColor: "transparent",
            }}
        >
            {trigger === "text" ? (
                term
            ) : (
                <Glyph shape={icon.shape} size={icon.size} />
            )}
        </button>
    )

    // 캔버스(편집 화면)에서는 말풍선을 단추 옆에 그대로 그려서 모양을 다듬을 수 있게 한다
    if (isStatic) {
        const offset = gap + (box.arrow ? ARROW : 0)
        const anchored: CSSProperties =
            side === "top"
                ? {
                      bottom: "100%",
                      left: "50%",
                      transform: "translateX(-50%)",
                      marginBottom: offset,
                  }
                : side === "bottom"
                  ? {
                        top: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        marginTop: offset,
                    }
                  : side === "left"
                    ? {
                          right: "100%",
                          top: "50%",
                          transform: "translateY(-50%)",
                          marginRight: offset,
                      }
                    : {
                          left: "100%",
                          top: "50%",
                          transform: "translateY(-50%)",
                          marginLeft: offset,
                      }
        return (
            <span
                style={{
                    ...style,
                    position: "relative",
                    display: "inline-flex",
                    width: "max-content",
                }}
            >
                {button}
                {canvasPreview && (
                    <span
                        style={{
                            ...bubbleStyle,
                            ...anchored,
                            position: "absolute",
                            maxWidth: box.maxWidth,
                            zIndex: 10,
                        }}
                    >
                        {content}
                        {box.arrow && <span style={arrowStyle(side, "50%")} />}
                    </span>
                )}
            </span>
        )
    }

    return (
        <span
            style={{
                ...style,
                display: "inline-flex",
                width: "max-content",
            }}
        >
            {button}
            {open &&
                // 부모 레이어가 내용을 잘라내도 말풍선은 보이도록 페이지 맨 위에 그린다
                createPortal(
                    <div
                        ref={bubbleRef}
                        id={id}
                        role="tooltip"
                        onPointerEnter={() =>
                            window.clearTimeout(timer.current)
                        }
                        style={{
                            ...bubbleStyle,
                            position: "fixed",
                            left: spot?.left ?? 0,
                            top: spot?.top ?? 0,
                            zIndex: 2147483000,
                            // 자리를 정하기 전의 한 번은 보이지 않게 그려서 크기만 잰다
                            opacity: spot ? 1 : 0,
                            transition: "opacity 0.12s ease",
                            pointerEvents: spot ? "auto" : "none",
                        }}
                    >
                        {content}
                        {box.arrow && spot && (
                            <span
                                style={arrowStyle(
                                    spot.side,
                                    Math.min(
                                        Math.max(
                                            spot.arrow,
                                            box.radius + ARROW
                                        ),
                                        (spot.side === "top" ||
                                        spot.side === "bottom"
                                            ? (bubbleRef.current?.offsetWidth ??
                                              0)
                                            : (bubbleRef.current
                                                  ?.offsetHeight ?? 0)) -
                                            box.radius -
                                            ARROW
                                    )
                                )}
                            />
                        )}
                    </div>,
                    document.body
                )}
        </span>
    )
}

const isIcon = (props: Props) => (props.trigger ?? "icon") === "icon"
const isText = (props: Props) => props.trigger === "text"

addPropertyControls(HoverInfoTooltip, {
    trigger: {
        type: ControlType.Enum,
        title: "Type",
        options: ["icon", "text"],
        optionTitles: ["Icon", "Text"],
        displaySegmentedControl: true,
        defaultValue: "icon",
    },
    term: {
        type: ControlType.String,
        title: "Word",
        defaultValue: "API",
        hidden: isIcon,
    },
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "",
        placeholder: "Optional",
    },
    text: {
        type: ControlType.String,
        title: "Text",
        displayTextArea: true,
        defaultValue:
            "A short explanation that appears when visitors hover or tap.",
        description:
            "Shown on hover, on tap and on keyboard focus.\n\nCreated by [Joviseo](https://joviseo.vercel.app)",
    },
    side: {
        type: ControlType.Enum,
        title: "Side",
        options: ["top", "bottom", "left", "right"],
        optionTitles: ["Top", "Bottom", "Left", "Right"],
        defaultValue: "top",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 8,
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        min: 0,
        max: 1000,
        step: 50,
        unit: "ms",
        defaultValue: 100,
    },
    icon: {
        type: ControlType.Object,
        title: "Icon",
        hidden: isText,
        controls: {
            shape: {
                type: ControlType.Enum,
                title: "Shape",
                options: ["info", "question"],
                optionTitles: ["Info", "Question"],
                displaySegmentedControl: true,
                defaultValue: "info",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                min: 10,
                max: 48,
                step: 1,
                defaultValue: 18,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#6B6B76",
            },
        },
    },
    termStyle: {
        type: ControlType.Object,
        title: "Word Style",
        hidden: isIcon,
        controls: {
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#111114",
            },
            underline: {
                type: ControlType.Enum,
                title: "Underline",
                options: ["dotted", "dashed", "solid", "none"],
                optionTitles: ["Dotted", "Dashed", "Solid", "None"],
                defaultValue: "dotted",
            },
        },
    },
    termFont: {
        type: ControlType.Font,
        title: "Word Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 16,
            variant: "Medium",
            lineHeight: "1.4em",
        },
        hidden: isIcon,
    },
    box: {
        type: ControlType.Object,
        title: "Tooltip",
        controls: {
            fill: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "#111114",
            },
            color: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#FFFFFF",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 30,
                step: 1,
                defaultValue: 10,
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                min: 4,
                max: 32,
                step: 1,
                defaultValue: 12,
            },
            maxWidth: {
                type: ControlType.Number,
                title: "Max Width",
                min: 120,
                max: 480,
                step: 10,
                defaultValue: 260,
            },
            arrow: {
                type: ControlType.Boolean,
                title: "Arrow",
                enabledTitle: "Show",
                disabledTitle: "Hide",
                defaultValue: true,
            },
            shadow: {
                type: ControlType.Boolean,
                title: "Shadow",
                enabledTitle: "Show",
                disabledTitle: "Hide",
                defaultValue: true,
            },
        },
    },
    font: {
        type: ControlType.Font,
        title: "Tooltip Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 14,
            variant: "Regular",
            lineHeight: "1.45em",
        },
    },
    canvasPreview: {
        type: ControlType.Boolean,
        title: "On Canvas",
        enabledTitle: "Open",
        disabledTitle: "Closed",
        defaultValue: false,
        description: "Shows the tooltip on the canvas so you can style it.",
    },
})
