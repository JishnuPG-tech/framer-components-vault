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


type RevealMode = "chars" | "words"

interface TextRevealScrollProps {
    textComponent?: React.ReactNode
    revealMode?: RevealMode
    startOffset?: number
    endOffset?: number
    dimOpacity?: number
    overrideFontSize?: boolean
    fontSize?: number
    style?: React.CSSProperties
}

function extractPlainText(node: React.ReactNode): string {
    if (node === null || node === undefined || typeof node === "boolean") {
        return ""
    }

    if (typeof node === "string" || typeof node === "number") {
        return String(node)
    }

    if (Array.isArray(node)) {
        return node.map(extractPlainText).join("")
    }

    if (React.isValidElement(node)) {
        return extractPlainText(
            (node.props as { children?: React.ReactNode }).children
        )
    }

    return ""
}

function normalizeTextComponent(textComponent?: React.ReactNode) {
    const instance = Array.isArray(textComponent)
        ? textComponent[0]
        : textComponent

    if (!React.isValidElement(instance)) return instance ?? null

    return React.cloneElement(instance as React.ReactElement<any>, {
        style: {
            ...(instance.props as { style?: React.CSSProperties }).style,
            width: "100%",
            height: "auto",
            minWidth: "unset",
            whiteSpace: "normal",
        },
    })
}

function createCharSpan(char: string, dimOpacity: number): HTMLElement {
    const span = document.createElement("span")
    span.textContent = char
    span.style.display = "inline"
    span.style.opacity = String(dimOpacity)
    span.style.willChange = "opacity"
    return span
}

function createWordSpan(word: string, dimOpacity: number): HTMLElement {
    const span = document.createElement("span")
    span.textContent = word
    span.style.display = "inline"
    span.style.opacity = String(dimOpacity)
    span.style.willChange = "opacity"
    return span
}

function processNodeRecursively(
    el: HTMLElement,
    revealMode: RevealMode,
    dimOpacity: number,
    segments: HTMLElement[]
) {
    const originalChildren = Array.from(el.childNodes)

    for (const node of originalChildren) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent || ""
            if (!text.length) continue

            const frag = document.createDocumentFragment()

            if (revealMode === "chars") {
                for (const char of text) {
                    if (char === " ") {
                        frag.appendChild(document.createTextNode(" "))
                    } else {
                        const span = createCharSpan(char, dimOpacity)
                        frag.appendChild(span)
                        segments.push(span)
                    }
                }
            } else {
                const parts = text.split(/(\s+)/)
                for (const part of parts) {
                    if (!part) continue

                    if (/^\s+$/.test(part)) {
                        frag.appendChild(document.createTextNode(part))
                    } else {
                        const span = createWordSpan(part, dimOpacity)
                        frag.appendChild(span)
                        segments.push(span)
                    }
                }
            }

            node.parentNode?.replaceChild(frag, node)
            continue
        }

        if (node.nodeType !== Node.ELEMENT_NODE) continue

        const childEl = node as HTMLElement

        if (childEl.tagName === "BR") {
            childEl.style.display = "inline"
            childEl.style.opacity = String(dimOpacity)
            childEl.style.willChange = "opacity"
            segments.push(childEl)
            continue
        }

        processNodeRecursively(childEl, revealMode, dimOpacity, segments)
    }
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 180
 * @framerDisableUnlink
 */
export default function TextRevealScroll({
    textComponent,
    revealMode = "chars",
    startOffset = 90,
    endOffset = 30,
    dimOpacity = 0.2,
    overrideFontSize = false,
    fontSize = 64,
    style,
}: TextRevealScrollProps) {
    const rootRef = React.useRef<HTMLDivElement>(null)
    const textRef = React.useRef<HTMLDivElement>(null)
    const segmentsRef = React.useRef<HTMLElement[]>([])
    const styleId = React.useId().replace(/:/g, "")

    const isVisibleRef = React.useRef(false)
    const rafRef = React.useRef<number>(0)

    const startOffsetRef = React.useRef(startOffset)
    const endOffsetRef = React.useRef(endOffset)
    const dimOpacityRef = React.useRef(dimOpacity)

    startOffsetRef.current = startOffset
    endOffsetRef.current = endOffset
    dimOpacityRef.current = dimOpacity

    const isCanvas = useIsStaticRenderer()
    const connectedText = React.useMemo(
        () => normalizeTextComponent(textComponent),
        [textComponent]
    )
    const textFingerprint = React.useMemo(
        () => extractPlainText(connectedText).replace(/\s+/g, " ").trim(),
        [connectedText]
    )

    const [isClient, setIsClient] = React.useState(false)
    React.useEffect(() => setIsClient(true), [])

    React.useEffect(() => {
        if (!isClient || isCanvas || !rootRef.current || !textRef.current) {
            return
        }

        let intersectionObserver: IntersectionObserver | null = null
        let mutationObserver: MutationObserver | null = null
        let scrollHandler: (() => void) | null = null
        let resizeHandler: (() => void) | null = null

        const root = rootRef.current
        const textRoot = textRef.current
        const allSegments: HTMLElement[] = []

        textRoot.style.visibility = "hidden"
        processNodeRecursively(
            textRoot,
            revealMode,
            dimOpacityRef.current,
            allSegments
        )

        if (allSegments.length === 0) {
            textRoot.style.visibility = "visible"
            return
        }

        segmentsRef.current = allSegments
        textRoot.style.visibility = "visible"

        const computeReveal = () => {
            if (!isVisibleRef.current) return

            const rect = root.getBoundingClientRect()
            const vh = window.innerHeight
            const startPx = vh * (startOffsetRef.current / 100)
            const endPx = vh * (endOffsetRef.current / 100)

            const totalRange = rect.height + (startPx - endPx)
            const scrolled = startPx - rect.top
            const progress = Math.min(Math.max(scrolled / totalRange, 0), 1)

            const total = segmentsRef.current.length
            const litCount = Math.floor(progress * total)

            segmentsRef.current.forEach((seg, i) => {
                if (i < litCount) {
                    seg.style.opacity = "1"
                } else if (i === litCount) {
                    const frac = progress * total - litCount
                    seg.style.opacity = String(
                        dimOpacityRef.current +
                            frac * (1 - dimOpacityRef.current)
                    )
                } else {
                    seg.style.opacity = String(dimOpacityRef.current)
                }
            })
        }

        const scheduleReveal = () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            rafRef.current = requestAnimationFrame(computeReveal)
        }

        intersectionObserver = new IntersectionObserver(
            (entries) => {
                isVisibleRef.current = entries[0].isIntersecting
                if (isVisibleRef.current) scheduleReveal()
            },
            {
                rootMargin: "200px 0px 200px 0px",
                threshold: 0,
            }
        )
        intersectionObserver.observe(root)

        scrollHandler = scheduleReveal
        resizeHandler = scheduleReveal

        window.addEventListener("scroll", scrollHandler, { passive: true })
        window.addEventListener("resize", resizeHandler, { passive: true })

        mutationObserver = new MutationObserver(() => {
            scheduleReveal()
        })
        mutationObserver.observe(root, {
            childList: true,
            subtree: true,
            characterData: true,
        })

        scheduleReveal()

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            if (scrollHandler) {
                window.removeEventListener("scroll", scrollHandler)
            }
            if (resizeHandler) {
                window.removeEventListener("resize", resizeHandler)
            }
            if (intersectionObserver) intersectionObserver.disconnect()
            if (mutationObserver) mutationObserver.disconnect()
            segmentsRef.current = []
        }
    }, [isClient, isCanvas, revealMode, textFingerprint])

    if (!connectedText) {
        return (
            <div
                style={{
                    width: 400,
                    minHeight: 180,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    border: "2px dashed rgba(99,102,241,0.5)",
                    borderRadius: 10,
                    color: "rgba(99,102,241,1)",
                    background: "rgba(99,102,241,0.08)",
                    fontFamily: "Inter",
                    textAlign: "center",
                    padding: 12,
                    gap: 16,
                    lineHeight: "1.6em",
                    ...style,
                }}
            >
                <div
                    style={{
                        fontSize: 24,
                        fontWeight: "500",
                    }}
                >
                    Connect a Text layer
                </div>
                <div
                    style={{
                        fontSize: 16,
                        maxWidth: 350,
                    }}
                >
                    Drop a Text layer outside the desktop breakpoint, wrap the
                    Text layer in a Stack, set the Text layer width to Fill, and
                    connect this component with the outside Text layer.
                </div>
            </div>
        )
    }

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: "auto",
                ...style,
            }}
        >
            {overrideFontSize && (
                <style>{`
                    #${styleId},
                    #${styleId} * {
                        font-size: ${fontSize}px !important;
                    }
                `}</style>
            )}
            <div
                id={styleId}
                key={`${revealMode}-${textFingerprint}`}
                ref={textRef}
                style={{
                    width: "100%",
                    height: "auto",
                    fontSize: overrideFontSize ? fontSize : undefined,
                }}
            >
                {connectedText}
            </div>
        </div>
    )
}

TextRevealScroll.displayName = "Text Reveal Scroll"

addPropertyControls(TextRevealScroll, {
    textComponent: {
        title: "Text",
        type: ControlType.ComponentInstance,
        description: "Connect a Text layer from the canvas.",
    },
    revealMode: {
        type: ControlType.Enum,
        title: "Reveal By",
        defaultValue: "chars",
        options: ["chars", "words"],
        optionTitles: ["Characters", "Words"],
        displaySegmentedControl: true,
        segmentedControlDirection: "vertical",
        description: "Reveal text character by character or word by word.",
    },
    overrideFontSize: {
        type: ControlType.Boolean,
        title: "Font Size",
        defaultValue: false,
        enabledTitle: "Custom",
        disabledTitle: "Global",
        description:
            "Toggle to 'Custom' if you want to set the text size here instead of using the global text style for font size.",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 64,
        min: 1,
        max: 300,
        step: 1,
        unit: "px",
        hidden: (props) => props.overrideFontSize === false,
        description: "Override the connected Text layer font size.",
    },
    startOffset: {
        type: ControlType.Number,
        title: "Start %",
        defaultValue: 90,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        description: "Viewport % from top where reveal begins.",
    },
    endOffset: {
        type: ControlType.Number,
        title: "End %",
        defaultValue: 30,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        description: "Viewport % from top where reveal completes.",
    },
    dimOpacity: {
        type: ControlType.Number,
        title: "Dim Opacity",
        defaultValue: 0.2,
        min: 0,
        max: 1,
        step: 0.05,
        description:
            "Opacity of unrevealed segments.\n\nMade with ❤️ by [Soyeb](https://framer.link/project)\n*Version:* 4.0.0",
    },
})
