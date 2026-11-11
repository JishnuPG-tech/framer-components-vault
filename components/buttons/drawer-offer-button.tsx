import React, { useState, useEffect, useMemo, CSSProperties } from "react"
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
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 180
 * @framerIntrinsicHeight 56
 */

type FramerFont = {
    fontFamily?: string
    fontSize?: number | string
    fontWeight?: number | string
    fontStyle?: string
    letterSpacing?: number | string
    lineHeight?: number | string
}

export interface DrawerOfferButtonProps {
    mainText?: string
    drawerTopText?: string
    drawerBottomText?: string
    fontFamily?: FramerFont
    buttonColor?: string
    drawerColor?: string
    mainTextColor?: string
    drawerTextColor?: string
    cornerColor?: string
    cornerDistance?: number
    minWidth?: number
    borderRadius?: number
    paddingX?: number
    paddingY?: number
    disabled?: boolean
    link?: string
    openInNewTab?: boolean
    ariaLabel?: string
    hoverScale?: number
    drawerOffset?: number
    fullWidth?: boolean
    enableAnimation?: boolean
    duration?: number
    shadowOpacity?: number
    cornerSize?: number
    cornerSpread?: number
    focusColor?: string
}

type CustomCSSVariables = CSSProperties & {
    "--btn-color"?: string
    "--drawer-color"?: string
    "--corner-color"?: string
    "--corner-dist"?: string
    "--corner-multiplier"?: number
    "--hover-scale"?: number
    "--drawer-offset"?: string
    "--duration"?: string
    "--shadow-op"?: number
}

const STYLE_ELEMENT_ID = "drawer-offer-button-framer-style"

const injectStyles = () => {
    if (
        typeof document === "undefined" ||
        document.getElementById(STYLE_ELEMENT_ID)
    )
        return

    const styleEl = document.createElement("style")
    styleEl.id = STYLE_ELEMENT_ID
    styleEl.innerHTML = `
        .drawer-btn-wrapper {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
        }

        .btn-container {
            --timing-function: cubic-bezier(0, 0, 0, 2.5);
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }

        .btn {
            position: relative;
            min-height: calc(var(--corner-dist) * 2);
            border: none;
            background: linear-gradient(#fff2, #0001), var(--btn-color);
            box-shadow:
                1px 1px 2px -1px #fff inset,
                0 2px 1px rgba(0, 0, 0, var(--shadow-op)),
                0 4px 2px rgba(0, 0, 0, var(--shadow-op)),
                0 8px 4px rgba(0, 0, 0, var(--shadow-op)),
                0 16px 8px rgba(0, 0, 0, var(--shadow-op)),
                0 32px 16px rgba(0, 0, 0, var(--shadow-op));
            transition: 
                transform var(--duration) var(--timing-function), 
                filter var(--duration) var(--timing-function),
                box-shadow var(--duration) var(--timing-function);
            -webkit-transition: 
                transform var(--duration) var(--timing-function), 
                -webkit-filter var(--duration) var(--timing-function),
                box-shadow var(--duration) var(--timing-function);
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            box-sizing: border-box;
        }

        .btn:focus-visible {
            outline: 2px solid var(--focus-color, #0066ff);
            outline-offset: 4px;
        }

        .btn-disabled {
            cursor: not-allowed !important;
            opacity: 0.6 !important;
            pointer-events: none !important;
        }

        .btn-drawer {
            position: absolute;
            display: flex;
            justify-content: center;
            min-height: 32px;
            border: none;
            padding: 0.25em 1em;
            font-size: 0.8em;
            font-weight: 600;
            font-family: inherit;
            background: linear-gradient(#fff2, #0001), var(--drawer-color);
            opacity: 0;
            transition: transform calc(0.5 * var(--duration)) ease, opacity calc(0.5 * var(--duration)) ease;
            -webkit-transition: transform calc(0.5 * var(--duration)) ease, opacity calc(0.5 * var(--duration)) ease;
            white-space: nowrap;
        }

        .transition-top {
            top: 0;
            left: 0;
            align-items: flex-start;
        }

        .transition-bottom {
            bottom: 0;
            right: 0;
            align-items: flex-end;
        }

        .btn-text {
            display: inline-block;
            color: transparent;
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            transition: transform var(--duration) var(--timing-function), filter var(--duration) var(--timing-function);
            -webkit-transition: transform var(--duration) var(--timing-function), -webkit-filter var(--duration) var(--timing-function);
            filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.4)) drop-shadow(0 -1px 0 rgba(0, 0, 0, 0.4));
            -webkit-filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.4)) drop-shadow(0 -1px 0 rgba(0, 0, 0, 0.4));
        }

        .btn-corner {
            position: absolute;
            fill: none;
            transition: transform var(--duration) var(--timing-function), filter var(--duration) var(--timing-function);
            -webkit-transition: transform var(--duration) var(--timing-function), -webkit-filter var(--duration) var(--timing-function);
            pointer-events: none;
        }

        /* Default Corner Transforms */
        .btn-corner-0 {
            top: 0; left: 0;
            transform: translate(calc(-1 * var(--corner-dist)), calc(-1 * var(--corner-dist))) rotate(90deg);
        }
        .btn-corner-1 {
            top: 0; right: 0;
            transform: translate(var(--corner-dist), calc(-1 * var(--corner-dist))) rotate(180deg);
        }
        .btn-corner-2 {
            bottom: 0; right: 0;
            transform: translate(var(--corner-dist), var(--corner-dist)) rotate(-90deg);
        }
        .btn-corner-3 {
            bottom: 0; left: 0;
            transform: translate(calc(-1 * var(--corner-dist)), var(--corner-dist)) rotate(0deg);
        }

        /* Hover States (Class-Based) */
        .btn-container.hover .btn {
            transform: scale(var(--hover-scale, 1.05));
            box-shadow:
                1px 1px 2px -1px #fff inset,
                0 4px 2px rgba(0, 0, 0, var(--shadow-op)),
                0 8px 4px rgba(0, 0, 0, var(--shadow-op)),
                0 16px 8px rgba(0, 0, 0, var(--shadow-op)),
                0 24px 12px rgba(0, 0, 0, var(--shadow-op)),
                0 40px 20px rgba(0, 0, 0, var(--shadow-op));
        }

        .btn-container.hover .transition-top {
            transform: translateY(calc(-1 * var(--drawer-offset))) rotateZ(4deg);
            opacity: 1;
        }

        .btn-container.hover .transition-bottom {
            transform: translateY(var(--drawer-offset)) rotateZ(4deg);
            opacity: 1;
        }

        .btn-container.hover .btn-text {
            transform: scale(var(--hover-scale, 1.05));
            filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.4)) 
                    drop-shadow(0 -1px 0 rgba(0, 0, 0, 0.4))
                    drop-shadow(0px 6px 2px rgba(0, 0, 0, 0.2));
            -webkit-filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.4)) 
                            drop-shadow(0 -1px 0 rgba(0, 0, 0, 0.4))
                            drop-shadow(0px 6px 2px rgba(0, 0, 0, 0.2));
        }

        .btn-container.hover .btn-corner-0 {
            transform: translate(calc(-1 * var(--corner-multiplier) * var(--corner-dist)), calc(-1 * var(--corner-multiplier) * var(--corner-dist))) rotate(90deg);
            filter: drop-shadow(-10px 10px 1px var(--corner-color)) drop-shadow(-20px 20px 2px var(--corner-color));
            -webkit-filter: drop-shadow(-10px 10px 1px var(--corner-color)) drop-shadow(-20px 20px 2px var(--corner-color));
        }
        .btn-container.hover .btn-corner-1 {
            transform: translate(calc(var(--corner-multiplier) * var(--corner-dist)), calc(-1 * var(--corner-multiplier) * var(--corner-dist))) rotate(180deg);
            filter: drop-shadow(-10px 10px 1px var(--corner-color)) drop-shadow(-20px 20px 2px var(--corner-color));
            -webkit-filter: drop-shadow(-10px 10px 1px var(--corner-color)) drop-shadow(-20px 20px 2px var(--corner-color));
        }
        .btn-container.hover .btn-corner-2 {
            transform: translate(calc(var(--corner-multiplier) * var(--corner-dist)), calc(var(--corner-multiplier) * var(--corner-dist))) rotate(-90deg);
            filter: drop-shadow(-10px 10px 1px var(--corner-color)) drop-shadow(-20px 20px 2px var(--corner-color));
            -webkit-filter: drop-shadow(-10px 10px 1px var(--corner-color)) drop-shadow(-20px 20px 2px var(--corner-color));
        }
        .btn-container.hover .btn-corner-3 {
            transform: translate(calc(-1 * var(--corner-multiplier) * var(--corner-dist)), calc(var(--corner-multiplier) * var(--corner-dist))) rotate(0deg);
            filter: drop-shadow(-10px 10px 1px var(--corner-color)) drop-shadow(-20px 20px 2px var(--corner-color));
            -webkit-filter: drop-shadow(-10px 10px 1px var(--corner-color)) drop-shadow(-20px 20px 2px var(--corner-color));
        }

        /* Active / Pressed States */
        .btn-container.active .btn {
            transform: scale(0.95);
            box-shadow:
                1px 1px 1px -1px #fff inset,
                0 1px 1px rgba(0, 0, 0, var(--shadow-op)),
                0 2px 1px rgba(0, 0, 0, var(--shadow-op));
        }

        .btn-container.active .transition-top,
        .btn-container.active .transition-bottom {
            transform: translateY(0px) scale(0.5);
        }

        .btn-container.active .btn-text {
            transform: scale(1);
        }

        .btn-container.active .btn-corner-0 {
            transform: translate(calc(-1 * 0.95 * var(--corner-dist)), calc(-1 * 0.95 * var(--corner-dist))) rotate(90deg);
        }
        .btn-container.active .btn-corner-1 {
            transform: translate(calc(0.95 * var(--corner-dist)), calc(-1 * 0.95 * var(--corner-dist))) rotate(180deg);
        }
        .btn-container.active .btn-corner-2 {
            transform: translate(calc(0.95 * var(--corner-dist)), calc(0.95 * var(--corner-dist))) rotate(-90deg);
        }
        .btn-container.active .btn-corner-3 {
            transform: translate(calc(-1 * 0.95 * var(--corner-dist)), calc(0.95 * var(--corner-dist))) rotate(0deg);
        }
    `
    document.head.appendChild(styleEl)
}

const CORNER_INDEXES = [0, 1, 2, 3]

export default function DrawerOfferButton(props: DrawerOfferButtonProps) {
    const {
        mainText = "Get Offer",
        drawerTopText = "expires in...",
        drawerBottomText = "...8 hours",
        fontFamily,
        buttonColor = "#d8ff7c",
        drawerColor = "#fbff13",
        mainTextColor = "#444444",
        drawerTextColor = "rgba(0, 0, 0, 0.6)",
        cornerColor = "rgba(0, 0, 0, 0.12)",
        cornerDistance = 24,
        minWidth = 160,
        borderRadius = 16,
        paddingX = 16,
        paddingY = 8,
        disabled = false,
        link = "",
        openInNewTab = false,
        ariaLabel = "Get Offer Button",
        hoverScale = 1.05,
        drawerOffset = 24,
        fullWidth = false,
        enableAnimation = true,
        duration = 250,
        shadowOpacity = 0.06,
        cornerSize = 32,
        cornerSpread = 1.5,
        focusColor = "#0066ff",
    } = props

    const isStatic = useIsStaticRenderer()
    const [hovered, setHovered] = useState(false)
    const [active, setActive] = useState(false)

    useEffect(() => {
        injectStyles()
    }, [])

    const allowHover = !isStatic && !disabled && enableAnimation

    const containerStyle = useMemo<CustomCSSVariables>(
        () => ({
            width: fullWidth ? "100%" : "auto",
            "--btn-color": buttonColor,
            "--drawer-color": drawerColor,
            "--corner-color": cornerColor,
            "--corner-dist": `${cornerDistance}px`,
            "--corner-multiplier": cornerSpread,
            "--hover-scale": hoverScale,
            "--drawer-offset": `${drawerOffset}px`,
            "--duration": `${duration}ms`,
            "--shadow-op": shadowOpacity,
            "--focus-color": focusColor,
        }),
        [
            fullWidth,
            buttonColor,
            drawerColor,
            cornerColor,
            cornerDistance,
            cornerSpread,
            hoverScale,
            drawerOffset,
            duration,
            shadowOpacity,
            focusColor,
        ]
    )

    const stateClasses =
        `btn-container ${hovered && allowHover ? "hover" : ""} ${active && allowHover ? "active" : ""}`.trim()

    const Tag = disabled ? "button" : link ? "a" : "button"

    const drawerRadius = Math.max(Math.round(borderRadius * 0.75), 0)

    const elementProps = useMemo(() => {
        const baseProps = {
            "aria-label": ariaLabel || mainText,
            "aria-disabled": disabled,
            className: `btn ${disabled ? "btn-disabled" : ""}`,
            style: {
                ...(fontFamily as CSSProperties),
                width: fullWidth ? "100%" : "auto",
                minWidth: fullWidth ? "unset" : `${minWidth}px`,
                borderRadius: `${borderRadius}px`,
                padding: `${paddingY}px ${paddingX}px`,
            },
        }

        if (Tag === "button") {
            return {
                ...baseProps,
                type: "button" as const,
                disabled,
            }
        }

        return {
            ...baseProps,
            href: link,
            target: openInNewTab ? "_blank" : "_self",
            rel: openInNewTab ? "noopener noreferrer" : undefined,
        }
    }, [
        Tag,
        ariaLabel,
        mainText,
        disabled,
        fontFamily,
        fullWidth,
        minWidth,
        borderRadius,
        paddingY,
        paddingX,
        link,
        openInNewTab,
    ])

    return (
        <div
            className="drawer-btn-wrapper"
            style={{ width: fullWidth ? "100%" : "auto" }}
        >
            <div
                className={stateClasses}
                onMouseEnter={allowHover ? () => setHovered(true) : undefined}
                onMouseLeave={
                    allowHover
                        ? () => {
                              setHovered(false)
                              setActive(false)
                          }
                        : undefined
                }
                onMouseDown={allowHover ? () => setActive(true) : undefined}
                onMouseUp={allowHover ? () => setActive(false) : undefined}
                onTouchStart={allowHover ? () => setActive(true) : undefined}
                onTouchEnd={
                    allowHover
                        ? () => {
                              setActive(false)
                              setHovered(false)
                          }
                        : undefined
                }
                onFocus={allowHover ? () => setHovered(true) : undefined}
                onBlur={
                    allowHover
                        ? () => {
                              setHovered(false)
                              setActive(false)
                          }
                        : undefined
                }
                style={containerStyle}
            >
                {/* Top Drawer */}
                <div
                    className="btn-drawer transition-top"
                    style={{
                        color: drawerTextColor,
                        borderRadius: `${drawerRadius}px ${drawerRadius}px 0 0`,
                    }}
                >
                    {drawerTopText}
                </div>

                {/* Bottom Drawer */}
                <div
                    className="btn-drawer transition-bottom"
                    style={{
                        color: drawerTextColor,
                        borderRadius: `0 0 ${drawerRadius}px ${drawerRadius}px`,
                    }}
                >
                    {drawerBottomText}
                </div>

                {/* Main Action Button / Link */}
                <Tag {...elementProps}>
                    <span
                        className="btn-text"
                        style={{
                            backgroundImage: `linear-gradient(${mainTextColor}, rgba(0,0,0,0.67))`,
                        }}
                    >
                        {mainText}
                    </span>
                </Tag>

                {/* Corner SVG Decorators */}
                {CORNER_INDEXES.map((i) => (
                    <svg
                        key={i}
                        className={`btn-corner btn-corner-${i}`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="-1 1 32 32"
                        style={{
                            stroke: cornerColor,
                            width: `${cornerSize}px`,
                        }}
                    >
                        <path d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z" />
                    </svg>
                ))}
            </div>
        </div>
    )
}

// --- Framer Controls Panel ---
addPropertyControls(DrawerOfferButton, {
    mainText: {
        type: ControlType.String,
        title: "Main Text",
        defaultValue: "Get Offer",
    },
    drawerTopText: {
        type: ControlType.String,
        title: "Top Drawer",
        defaultValue: "expires in...",
    },
    drawerBottomText: {
        type: ControlType.String,
        title: "Bottom Drawer",
        defaultValue: "...8 hours",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        hidden: (props) => !props.link,
    },
    fontFamily: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Button Color",
        defaultValue: "#d8ff7c",
    },
    drawerColor: {
        type: ControlType.Color,
        title: "Drawer Color",
        defaultValue: "#fbff13",
    },
    mainTextColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#444444",
    },
    drawerTextColor: {
        type: ControlType.Color,
        title: "Drawer Text",
        defaultValue: "rgba(0, 0, 0, 0.6)",
    },
    cornerColor: {
        type: ControlType.Color,
        title: "Corner Color",
        defaultValue: "rgba(0, 0, 0, 0.12)",
    },
    focusColor: {
        type: ControlType.Color,
        title: "Focus Ring",
        defaultValue: "#0066ff",
    },
    paddingX: {
        type: ControlType.Number,
        title: "Padding X",
        defaultValue: 16,
        min: 0,
        max: 60,
        step: 1,
    },
    paddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        defaultValue: 8,
        min: 0,
        max: 40,
        step: 1,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 16,
        min: 0,
        max: 40,
        step: 1,
    },
    cornerDistance: {
        type: ControlType.Number,
        title: "Corner Offset",
        defaultValue: 24,
        min: 10,
        max: 50,
        step: 1,
    },
    cornerSpread: {
        type: ControlType.Number,
        title: "Corner Spread",
        defaultValue: 1.5,
        min: 1,
        max: 3,
        step: 0.1,
    },
    cornerSize: {
        type: ControlType.Number,
        title: "Corner Size",
        defaultValue: 32,
        min: 16,
        max: 64,
        step: 1,
    },
    drawerOffset: {
        type: ControlType.Number,
        title: "Drawer Offset",
        defaultValue: 24,
        min: 10,
        max: 60,
        step: 1,
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.05,
        min: 0.9,
        max: 1.3,
        step: 0.01,
    },
    shadowOpacity: {
        type: ControlType.Number,
        title: "Shadow Opacity",
        defaultValue: 0.06,
        min: 0,
        max: 0.3,
        step: 0.01,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration (ms)",
        defaultValue: 250,
        min: 50,
        max: 1000,
        step: 10,
    },
    fullWidth: {
        type: ControlType.Boolean,
        title: "Full Width",
        defaultValue: false,
    },
    disabled: {
        type: ControlType.Boolean,
        title: "Disabled",
        defaultValue: false,
    },
    enableAnimation: {
        type: ControlType.Boolean,
        title: "Animation",
        defaultValue: true,
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "Get Offer Button",
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})
