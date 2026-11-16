import { useId } from "react"
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
export function StaggerButton({
    text,
    font,
    bgColor,
    bgHoverColor,
    textColor,
    iconBg,
    iconColor,
    link,
    paddingTop = 6,
    paddingBottom = 6,
    paddingLeft = 15,
    paddingRight = 6,
    gap = 23,
    borderRadius = 6,
    iconSize = 34,
    style,
    ...rest
}) {
    const router = useRouter()
    const isStatic = useIsStaticRenderer()

    // Unique, CSS-safe id so multiple instances never collide on the page.
    const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
    const cls = `sb-${uid}`
    const nudge = `sb-nudge-${uid}`

    const parseRoute = (routes: any, targetPath: string) => {
        if (!targetPath) return null
        const [routePath, anchorName] = targetPath.split("#")
        for (const [routeId, routeInfo] of Object.entries(routes || {})) {
            const pattern = (routeInfo as any).path
            if (!pattern) continue
            const paramNames: string[] = []
            const regexPattern = pattern.replace(
                /:(\w+)/g,
                (_: any, name: string) => {
                    paramNames.push(name)
                    return "([^/]+)"
                }
            )
            const match = routePath.match(new RegExp(`^${regexPattern}$`))
            if (match) {
                const params = paramNames.reduce(
                    (acc: any, name: string, i: number) => {
                        acc[name] = match[i + 1]
                        return acc
                    },
                    {}
                )
                let anchorId
                if (anchorName && (routeInfo as any).elements) {
                    const entry = Object.entries(
                        (routeInfo as any).elements
                    ).find(([, v]) => v === anchorName)
                    if (entry) anchorId = entry[0]
                }
                return { routeId, params, anchorId }
            }
        }
        return null
    }

    const handleClick = () => {
        if (!link) return

        const isExternal =
            link.startsWith("http://") ||
            link.startsWith("https://") ||
            link.startsWith("//") ||
            link.startsWith("mailto:") ||
            link.startsWith("tel:")

        if (isExternal) {
            window.open(link, "_blank", "noopener noreferrer")
        } else {
            const result = parseRoute(router?.routes, link)
            if (result) {
                router.navigate(
                    result.routeId,
                    result.anchorId ?? "",
                    result.params
                )
            } else {
                window.location.href = link
            }
        }
    }

    const charWrapStyle: React.CSSProperties = {
        position: "relative",
        display: "inline-block",
        overflow: "hidden",
        lineHeight: 1.2,
    }

    const charStyle: React.CSSProperties = {
        display: "inline-block",
        willChange: "transform",
    }

    const cloneStyle: React.CSSProperties = {
        ...charStyle,
        position: "absolute",
        left: 0,
        top: "100%",
    }

    const baseTransition = "transform 0.4s cubic-bezier(0.65, 0, 0.35, 1)"

    // Build characters. Spaces become spacers; letters get a staggered delay.
    let letterIndex = 0
    const chars = (text ?? "").split("").map((char: string, i: number) => {
        if (char === " ") {
            return (
                <span
                    key={i}
                    style={{ display: "inline-block", width: "0.35em" }}
                />
            )
        }

        const delay = letterIndex * 0.02
        letterIndex++

        // Static fallback: plain text, no clones, no transitions.
        if (isStatic) {
            return (
                <span key={i} style={charWrapStyle}>
                    <span style={{ display: "inline-block" }}>{char}</span>
                </span>
            )
        }

        const charTransition = `${baseTransition} ${delay}s`

        return (
            <span key={i} style={charWrapStyle}>
                <span
                    className="sb-char"
                    style={{ ...charStyle, transition: charTransition }}
                >
                    {char}
                </span>
                <span
                    className="sb-char"
                    style={{ ...cloneStyle, transition: charTransition }}
                >
                    {char}
                </span>
            </span>
        )
    })

    const buttonStyle: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        backgroundColor: bgColor,
        border: "none",
        paddingTop,
        paddingBottom,
        paddingLeft,
        paddingRight,
        borderRadius,
        cursor: link ? "pointer" : "default",
        gap,
        transition: "background-color 0.3s ease",
        width: "100%",
        height: "100%",
        justifyContent: "space-between",
    }
    // CSS custom property consumed by the scoped :hover rule below.
    ;(buttonStyle as any)["--sb-bgh"] = bgHoverColor

    const css = `
.${cls}:hover { background-color: var(--sb-bgh); }
.${cls}:hover .sb-char { transform: translateY(-100%); }
.${cls}:hover .sb-icon { animation: ${nudge} 0.4s ease; }
@keyframes ${nudge} {
    0% { transform: translateX(0); }
    50% { transform: translateX(-4px); }
    100% { transform: translateX(0); }
}
@media (prefers-reduced-motion: reduce) {
    .${cls}:hover .sb-char { transform: none; }
    .${cls}:hover .sb-icon { animation: none; }
}
`.trim()

    return (
        // ─── Outer wrapper: owns the Framer frame (gets style/width/height) ───
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                ...style,
            }}
            {...rest}
        >
            {/* Scoped styles — only needed in the interactive renderer. */}
            {!isStatic && <style dangerouslySetInnerHTML={{ __html: css }} />}

            {/* ─── Button: naturally sized, never stretched by Framer ─── */}
            <button onClick={handleClick} className={cls} style={buttonStyle}>
                {/* Text */}
                <div
                    aria-label={text}
                    style={{
                        display: "flex",
                        ...font,
                        color: textColor,
                        letterSpacing: "0.5px",
                        userSelect: "none",
                    }}
                >
                    {chars}
                </div>

                {/* Icon */}
                <div
                    className="sb-icon"
                    style={{
                        backgroundColor: iconBg,
                        width: iconSize,
                        height: iconSize,
                        borderRadius: 4,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        flexShrink: 0,
                        willChange: "transform",
                    }}
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={iconColor}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ width: 18, height: 18 }}
                    >
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </div>
            </button>
        </div>
    )
}

StaggerButton.defaultProps = {
    text: "REQUEST OFFER",
    font: {
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 14,
        fontWeight: 700,
    },
    bgColor: "#8c9b83",
    bgHoverColor: "#9aa991",
    textColor: "#1a251c",
    iconBg: "#1a251c",
    iconColor: "#8c9b83",
    link: "",
}

addPropertyControls(StaggerButton, {
    text: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "REQUEST OFFER",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    link: {
        type: ControlType.Link,
        title: "Link To",
    },
    bgColor: {
        type: ControlType.Color,
        title: "BG",
        defaultValue: "#8c9b83",
    },
    bgHoverColor: {
        type: ControlType.Color,
        title: "BG Hover",
        defaultValue: "#9aa991",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#1a251c",
    },
    iconBg: {
        type: ControlType.Color,
        title: "Icon BG",
        defaultValue: "#1a251c",
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        defaultValue: "#8c9b83",
    },
    paddingTop: {
        type: ControlType.Number,
        title: "Pad Top",
        defaultValue: 6,
        min: 0,
        max: 80,
        step: 1,
        displayStepper: true,
    },
    paddingBottom: {
        type: ControlType.Number,
        title: "Pad Bottom",
        defaultValue: 6,
        min: 0,
        max: 80,
        step: 1,
        displayStepper: true,
    },
    paddingLeft: {
        type: ControlType.Number,
        title: "Pad Left",
        defaultValue: 15,
        min: 0,
        max: 120,
        step: 1,
        displayStepper: true,
    },
    paddingRight: {
        type: ControlType.Number,
        title: "Pad Right",
        defaultValue: 6,
        min: 0,
        max: 120,
        step: 1,
        displayStepper: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 23,
        min: 0,
        max: 80,
        step: 1,
        displayStepper: true,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 6,
        min: 0,
        max: 999,
        step: 1,
        displayStepper: true,
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 34,
        min: 20,
        max: 80,
        step: 1,
        displayStepper: true,
    },
})
