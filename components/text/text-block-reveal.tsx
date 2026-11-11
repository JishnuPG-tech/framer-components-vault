import { useEffect, useRef, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type SemanticTag =
    | "div"
    | "span"
    | "p"
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6"

interface Props {
    text: string
    semanticTag?: SemanticTag
    trigger?: "appear" | "hover" | "Appear" | "Hover"
    link?: string
    font?: CSSProperties
    textColor?: string
    verticalPadding: number
    blockColor: string
    style?: CSSProperties
}

const defaultFont: CSSProperties = {
    fontFamily: "Inter, sans-serif",
    fontSize: 32,
    fontWeight: 400,
    lineHeight: "1.2em",
    letterSpacing: "0em",
    textAlign: "left",
}

/**
 * @framerDisableUnlink
 * Standalone version of the gallery's text reveal.
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 320
 * @framerIntrinsicHeight 80
 */
export default function TextBlockReveal({
    text = "Reveal your text",
    semanticTag = "div",
    trigger = "appear",
    link = "",
    font = defaultFont,
    textColor = "#111111",
    verticalPadding = 20,
    blockColor = "#111111",
    style,
}: Props) {
    const rootRef = useRef<HTMLElement | null>(null)
    const blockRef = useRef<HTMLSpanElement>(null)
    const isStatic = useIsStaticRenderer()
    const triggerMode = trigger.toLowerCase() === "hover" ? "hover" : "appear"
    const textStyle = { ...defaultFont, ...font }
    const TextTag = semanticTag.toLowerCase() as SemanticTag
    const paddingY = Number.isFinite(verticalPadding)
        ? Math.max(0, verticalPadding)
        : 20
    const href = triggerMode === "hover" && link.trim() ? link : undefined
    const RootTag = href ? "a" : "div"
    const setRootRef = (node: HTMLElement | null) => {
        rootRef.current = node
    }

    useEffect(() => {
        const root = rootRef.current
        const block = blockRef.current
        if (isStatic || !root || !block || !text.trim()) return
        const motionPreference = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        )
        let animation: Animation | null = null
        let observer: IntersectionObserver | null = null
        let started = false
        let playing = false
        let disposed = false
        let generation = 0

        const play = async () => {
            if (
                disposed ||
                playing ||
                motionPreference.matches ||
                (triggerMode === "appear" && started)
            )
                return
            playing = true
            const run = ++generation
            if (triggerMode === "appear") {
                started = true
                observer?.disconnect()
            }
            // Wait for this style's font so both copies keep identical line breaks.
            try {
                await document.fonts.ready
            } catch {
                /* The fallback font remains usable if the font cannot load. */
            }
            if (
                disposed ||
                run !== generation ||
                motionPreference.matches ||
                !block.animate
            ) {
                if (run === generation) playing = false
                return
            }
            const easing = "cubic-bezier(.76,0,.24,1)"
            const currentAnimation = block.animate(
                [
                    { clipPath: "inset(0 100% 0 0)", offset: 0, easing },
                    { clipPath: "inset(0 0% 0 0)", offset: 620 / 1390 },
                    { clipPath: "inset(0 0% 0 0)", offset: 770 / 1390, easing },
                    { clipPath: "inset(0 0 0 100%)", offset: 1 },
                ],
                { duration: 1390, fill: "both" }
            )
            animation = currentAnimation
            currentAnimation.onfinish = () => {
                if (animation === currentAnimation) {
                    currentAnimation.cancel()
                    animation = null
                }
                playing = false
            }
        }

        const watch = () => {
            if (
                triggerMode !== "appear" ||
                disposed ||
                motionPreference.matches ||
                started
            )
                return
            if (typeof IntersectionObserver === "undefined") {
                void play()
                return
            }
            observer = new IntersectionObserver(
                (entries) => {
                    if (entries.some((entry) => entry.isIntersecting))
                        void play()
                },
                { threshold: 0 }
            )
            observer.observe(root)
        }
        const onPointerEnter = (event: PointerEvent) => {
            if (triggerMode === "hover" && event.pointerType !== "touch")
                void play()
        }
        const onMotionPreferenceChange = () => {
            generation++
            observer?.disconnect()
            observer = null
            animation?.cancel()
            animation = null
            playing = false
            if (triggerMode === "appear") {
                started = false
                watch()
            }
        }
        motionPreference.addEventListener("change", onMotionPreferenceChange)
        if (triggerMode === "hover")
            root.addEventListener("pointerenter", onPointerEnter)
        else watch()
        return () => {
            disposed = true
            generation++
            observer?.disconnect()
            animation?.cancel()
            motionPreference.removeEventListener(
                "change",
                onMotionPreferenceChange
            )
            root.removeEventListener("pointerenter", onPointerEnter)
        }
    }, [isStatic, text, font, blockColor, triggerMode, href])

    return (
        <RootTag
            ref={setRootRef}
            href={href}
            style={{
                ...style,
                ...(triggerMode === "hover" && !isStatic
                    ? { pointerEvents: "auto" }
                    : {}),
                textDecoration: href ? "none" : undefined,
                cursor: href ? "pointer" : undefined,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent:
                    textStyle.textAlign === "center"
                        ? "center"
                        : textStyle.textAlign === "right"
                          ? "flex-end"
                          : "flex-start",
                padding: `${paddingY}px 6px`,
                boxSizing: "border-box",
                overflow: "visible",
                userSelect: "none",
                WebkitUserSelect: "none",
            }}
        >
            <TextTag
                style={{
                    ...textStyle,
                    color: textColor,
                    position: "relative",
                    display: "block",
                    width: "max-content",
                    maxWidth: "100%",
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    isolation: "isolate",
                    clipPath: `inset(-${paddingY}px -6px)`,
                }}
            >
                <span
                    style={{
                        position: "relative",
                        display: "block",
                        zIndex: 2,
                    }}
                >
                    {text}
                </span>
                <span
                    ref={blockRef}
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        zIndex: 3,
                        left: -6,
                        right: -6,
                        top: -paddingY,
                        bottom: -paddingY,
                        background: blockColor,
                        isolation: "isolate",
                        display: "flex",
                        alignItems: "center",
                        clipPath: "inset(0 0 0 100%)",
                        pointerEvents: "none",
                    }}
                >
                    <span
                        style={{
                            display: "block",
                            width: "100%",
                            padding: "0 6px",
                            boxSizing: "border-box",
                            color: "#FFFFFF",
                            mixBlendMode: "difference",
                        }}
                    >
                        {text}
                    </span>
                </span>
            </TextTag>
        </RootTag>
    )
}

addPropertyControls(TextBlockReveal, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Reveal your text",
        displayTextArea: true,
    },
    semanticTag: {
        type: ControlType.Enum,
        title: "HTML Tag",
        description: "Semantic tag for accessibility and SEO",
        options: ["div", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6"],
        optionTitles: [
            "Div",
            "Span",
            "Paragraph",
            "H1",
            "H2",
            "H3",
            "H4",
            "H5",
            "H6",
        ],
        defaultValue: "div",
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        description:
            "Appear plays once when the text enters view. Hover plays each time the pointer enters.",
        options: ["appear", "hover"],
        optionTitles: ["Appear", "Hover"],
        defaultValue: "appear",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
        defaultValue: "",
        hidden: (props) =>
            (props.trigger ?? "appear").toLowerCase() !== "hover",
    },
    font: {
        type: ControlType.Font,
        title: "Text Style",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 32,
            variant: "Regular",
            lineHeight: "1.2em",
            letterSpacing: "0em",
            textAlign: "left",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#111111",
    },
    verticalPadding: {
        type: ControlType.Number,
        title: "Vertical Padding",
        defaultValue: 20,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    blockColor: {
        type: ControlType.Color,
        title: "Block Color",
        defaultValue: "#111111",
        description: "[View Setup Example](https://framer.link/oZot07T)",
    },
})
