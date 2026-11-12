import React, { useId, useLayoutEffect } from "react"
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
 * @framerIntrinsicHeight 52
 */
export default function JellyButton(props) {
    const {
        text,
        primaryColor,
        hoverColor,
        textColor,
        font,
        padding,
        borderRadius,
        link,
        openInNewTab,
        ariaLabel,
        gooBlur,
        gooStrength,
        gooThreshold,
        blobCount,
        blobColor,
        blobDelay,
        blob1,
        blob2,
        blob3,
        blob4,
        blob5,
    } = props

    const isStatic = useIsStaticRenderer()
    const filterId = useId()
    const cleanFilterId = filterId.replace(/:/g, "")

    // Skip DOM style injection entirely in static rendering mode
    useGlobalCSS(isStatic)

    const handleClick = (e: React.MouseEvent) => {
        if (props.onTap) {
            props.onTap(e)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (link && (e.key === " " || e.key === "Enter")) {
            e.preventDefault()
            ;(e.currentTarget as HTMLElement).click()
        }
    }

    const style: React.CSSProperties = {
        "--jelly-bg": primaryColor,
        "--jelly-hover": hoverColor,
        "--jelly-text": textColor,
        "--blob-color": blobColor || hoverColor,
        "--blob-delay": `${blobDelay}s`,
        "--blob1-size": `${blob1?.size ?? 26}px`,
        "--blob1-x": `${blob1?.x ?? -160}%`,
        "--blob1-y": `${blob1?.y ?? -120}%`,
        "--blob2-size": `${blob2?.size ?? 20}px`,
        "--blob2-x": `${blob2?.x ?? 120}%`,
        "--blob2-y": `${blob2?.y ?? -100}%`,
        "--blob3-size": `${blob3?.size ?? 14}px`,
        "--blob3-x": `${blob3?.x ?? -80}%`,
        "--blob3-y": `${blob3?.y ?? 130}%`,
        "--blob4-size": `${blob4?.size ?? 18}px`,
        "--blob4-x": `${blob4?.x ?? 140}%`,
        "--blob4-y": `${blob4?.y ?? 110}%`,
        "--blob5-size": `${blob5?.size ?? 12}px`,
        "--blob5-x": `${blob5?.x ?? -150}%`,
        "--blob5-y": `${blob5?.y ?? 80}%`,
        padding: `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`,
        borderRadius: `${borderRadius}px`,
        fontFamily: font?.fontFamily || "inherit",
        fontSize: font?.fontSize ? `${font.fontSize}px` : "16px",
        fontWeight: font?.fontWeight || 600,
        fontStyle: font?.fontStyle || "normal",
        filter: isStatic ? "none" : `url(#${cleanFilterId})`,
    }

    const innerContent = (
        <>
            <span className="jelly-btn__text">{text}</span>
            {!isStatic && (
                <>
                    {blobCount >= 1 && (
                        <span className="jelly-btn__blob jelly-btn__blob--1" />
                    )}
                    {blobCount >= 2 && (
                        <span className="jelly-btn__blob jelly-btn__blob--2" />
                    )}
                    {blobCount >= 3 && (
                        <span className="jelly-btn__blob jelly-btn__blob--3" />
                    )}
                    {blobCount >= 4 && (
                        <span className="jelly-btn__blob jelly-btn__blob--4" />
                    )}
                    {blobCount >= 5 && (
                        <span className="jelly-btn__blob jelly-btn__blob--5" />
                    )}
                    <span className="jelly-btn__gloss" />
                    <svg
                        className="jelly-btn__svg"
                        aria-hidden="true"
                        focusable="false"
                        xmlns="http://www.w3.org/2000/svg"
                        version="1.1"
                        style={{
                            position: "absolute",
                            width: 0,
                            height: 0,
                            visibility: "hidden",
                        }}
                    >
                        <defs>
                            <filter
                                id={cleanFilterId}
                                x="-50%"
                                y="-50%"
                                width="200%"
                                height="200%"
                                colorInterpolationFilters="sRGB"
                            >
                                <feGaussianBlur
                                    in="SourceGraphic"
                                    stdDeviation={gooBlur}
                                    result="blur"
                                />
                                <feColorMatrix
                                    in="blur"
                                    mode="matrix"
                                    values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${gooStrength} -${gooThreshold}`}
                                    result="goo"
                                />
                                <feComposite
                                    in="SourceGraphic"
                                    in2="goo"
                                    operator="atop"
                                />
                            </filter>
                        </defs>
                    </svg>
                </>
            )}
        </>
    )

    if (link) {
        return (
            <a
                className={`jelly-btn ${isStatic ? "jelly-btn--static" : ""}`}
                aria-label={ariaLabel || text}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                href={link}
                target={openInNewTab ? "_blank" : undefined}
                rel={openInNewTab ? "noopener noreferrer" : undefined}
                style={style}
            >
                {innerContent}
            </a>
        )
    }

    return (
        <button
            type="button"
            className={`jelly-btn ${isStatic ? "jelly-btn--static" : ""}`}
            aria-label={ariaLabel || text}
            onClick={handleClick}
            style={style}
        >
            {innerContent}
        </button>
    )
}

const STYLE_ID = "jelly-button-styles"
const CSS_TEXT = `
    .jelly-btn {
        --jelly-shadow: rgba(0, 0, 0, 0.15);

        position: relative;
        border: none;
        background: var(--jelly-bg);
        color: var(--jelly-text);
        cursor: pointer;
        overflow: visible;
        appearance: none;
        -webkit-appearance: none;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
        user-select: none;
        -webkit-user-select: none;
        white-space: nowrap;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        transition:
            transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 0.4s ease,
            background 0.25s ease;
        box-shadow: 0 0.2em 0.8em var(--jelly-shadow);
    }

    .jelly-btn__text {
        position: relative;
        z-index: 3;
        display: block;
        pointer-events: none;
        transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .jelly-btn__blob {
        position: absolute;
        border-radius: 50%;
        background: var(--blob-color, var(--jelly-hover));
        transition:
            transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
            background 0.25s ease;
        z-index: 1;
        top: 50%;
        left: 50%;
        pointer-events: none;
    }

    .jelly-btn__blob--1 {
        width: var(--blob1-size, 26px);
        height: var(--blob1-size, 26px);
        transform: translate(-50%, -50%) scale(0);
        transition-delay: 0s;
    }

    .jelly-btn__blob--2 {
        width: var(--blob2-size, 20px);
        height: var(--blob2-size, 20px);
        transform: translate(-50%, -50%) scale(0);
        transition-delay: calc(var(--blob-delay, 0.05s) * 1);
    }

    .jelly-btn__blob--3 {
        width: var(--blob3-size, 14px);
        height: var(--blob3-size, 14px);
        transform: translate(-50%, -50%) scale(0);
        transition-delay: calc(var(--blob-delay, 0.05s) * 2);
    }

    .jelly-btn__blob--4 {
        width: var(--blob4-size, 18px);
        height: var(--blob4-size, 18px);
        transform: translate(-50%, -50%) scale(0);
        transition-delay: calc(var(--blob-delay, 0.05s) * 3);
    }

    .jelly-btn__blob--5 {
        width: var(--blob5-size, 12px);
        height: var(--blob5-size, 12px);
        transform: translate(-50%, -50%) scale(0);
        transition-delay: calc(var(--blob-delay, 0.05s) * 4);
    }

    .jelly-btn__gloss {
        position: absolute;
        top: 0.1em;
        left: 10%;
        right: 10%;
        height: 40%;
        border-radius: 1em 1em 50% 50%;
        background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.25) 0%,
            rgba(255, 255, 255, 0.05) 100%
        );
        pointer-events: none;
        transition: opacity 0.3s ease;
        z-index: 2;
    }

    .jelly-btn__svg {
        position: absolute;
        pointer-events: none;
    }

    @media (hover: hover) {
        .jelly-btn:not(.jelly-btn--static):hover {
            transform: scaleX(1.06) scaleY(0.94);
            box-shadow: 0 0.3em 1.2em var(--jelly-shadow);
            background: var(--jelly-hover);
        }

        .jelly-btn:not(.jelly-btn--static):hover .jelly-btn__blob {
            background: var(--blob-color, var(--jelly-hover));
        }

        .jelly-btn:not(.jelly-btn--static):hover .jelly-btn__text {
            transform: scaleX(0.94) scaleY(1.06);
        }

        .jelly-btn:not(.jelly-btn--static):hover .jelly-btn__blob--1 {
            transform: translate(var(--blob1-x, -160%), var(--blob1-y, -120%)) scale(1);
        }

        .jelly-btn:not(.jelly-btn--static):hover .jelly-btn__blob--2 {
            transform: translate(var(--blob2-x, 120%), var(--blob2-y, -100%)) scale(1);
        }

        .jelly-btn:not(.jelly-btn--static):hover .jelly-btn__blob--3 {
            transform: translate(var(--blob3-x, -80%), var(--blob3-y, 130%)) scale(1);
        }

        .jelly-btn:not(.jelly-btn--static):hover .jelly-btn__blob--4 {
            transform: translate(var(--blob4-x, 140%), var(--blob4-y, 110%)) scale(1);
        }

        .jelly-btn:not(.jelly-btn--static):hover .jelly-btn__blob--5 {
            transform: translate(var(--blob5-x, -150%), var(--blob5-y, 80%)) scale(1);
        }

        .jelly-btn:not(.jelly-btn--static):hover .jelly-btn__gloss {
            opacity: 0.7;
        }
    }

    .jelly-btn:not(.jelly-btn--static):active {
        transform: scaleX(0.94) scaleY(1.06);
        transition-duration: 0.1s;
        box-shadow: 0 0.15em 0.5em var(--jelly-shadow);
    }

    .jelly-btn:not(.jelly-btn--static):active .jelly-btn__text {
        transform: scaleX(1.06) scaleY(0.94);
        transition-duration: 0.1s;
    }

    .jelly-btn:not(.jelly-btn--static):active .jelly-btn__blob {
        transform: translate(-50%, -50%) scale(0) !important;
        transition-duration: 0.15s;
    }

    .jelly-btn:not(.jelly-btn--static):active .jelly-btn__gloss {
        opacity: 0.3;
    }

    .jelly-btn:focus {
        outline: none;
    }

    .jelly-btn:focus-visible {
        outline: 0.15em solid var(--jelly-hover);
        outline-offset: 0.25em;
    }

    .jelly-btn--static {
        filter: none !important;
        transform: none !important;
        transition: none !important;
    }
`

function useGlobalCSS(disabled: boolean) {
    useLayoutEffect(() => {
        if (disabled || typeof document === "undefined") return

        let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement

        if (!styleEl) {
            styleEl = document.createElement("style")
            styleEl.id = STYLE_ID
            styleEl.textContent = CSS_TEXT
            styleEl.setAttribute("data-count", "1")
            document.head.appendChild(styleEl)
        } else {
            const count = parseInt(
                styleEl.getAttribute("data-count") || "0",
                10
            )
            styleEl.setAttribute("data-count", (count + 1).toString())
        }

        return () => {
            const el = document.getElementById(STYLE_ID)
            if (!el) return
            const count = parseInt(el.getAttribute("data-count") || "1", 10)
            if (count <= 1) {
                el.remove()
            } else {
                el.setAttribute("data-count", (count - 1).toString())
            }
        }
    }, [disabled])
}

JellyButton.defaultProps = {
    text: "Click me",
    primaryColor: "#6C63FF",
    hoverColor: "#7D75FF",
    textColor: "#FFFFFF",
    borderRadius: 20,
    padding: { top: 14, right: 32, bottom: 14, left: 32 },
    ariaLabel: "Jelly Button",
    gooBlur: 8,
    gooStrength: 22,
    gooThreshold: 9,
    blobCount: 3,
    blobColor: "#7D75FF",
    blobDelay: 0.05,
    blob1: { size: 26, x: -160, y: -120 },
    blob2: { size: 20, x: 120, y: -100 },
    blob3: { size: 14, x: -80, y: 130 },
    blob4: { size: 18, x: 140, y: 110 },
    blob5: { size: 12, x: -150, y: 80 },
}

addPropertyControls(JellyButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Click me",
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
    primaryColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#6C63FF",
    },
    hoverColor: {
        type: ControlType.Color,
        title: "Hover Color",
        defaultValue: "#7D75FF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    padding: {
        type: ControlType.FusedNumber,
        title: "Padding",
        defaultValue: { top: 14, right: 32, bottom: 14, left: 32 },
        valueControls: {
            paddingTop: { title: "Top" },
            paddingRight: { title: "Right" },
            paddingBottom: { title: "Bottom" },
            paddingLeft: { title: "Left" },
        },
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 20,
        min: 0,
        max: 100,
        unit: "px",
    },
    gooBlur: {
        type: ControlType.Number,
        title: "Goo Blur",
        min: 0,
        max: 20,
        unit: "px",
        defaultValue: 8,
    },
    gooStrength: {
        type: ControlType.Number,
        title: "Goo Strength",
        min: 1,
        max: 40,
        defaultValue: 22,
    },
    gooThreshold: {
        type: ControlType.Number,
        title: "Goo Cutoff",
        min: 1,
        max: 20,
        defaultValue: 9,
    },
    blobCount: {
        type: ControlType.Enum,
        title: "Blob Count",
        options: [1, 2, 3, 4, 5],
        optionTitles: ["1", "2", "3", "4", "5"],
        defaultValue: 3,
    },
    blobColor: {
        type: ControlType.Color,
        title: "Blob Color",
        defaultValue: "#7D75FF",
    },
    blobDelay: {
        type: ControlType.Number,
        title: "Blob Delay",
        min: 0,
        max: 0.3,
        step: 0.01,
        unit: "s",
        defaultValue: 0.05,
    },
    blob1: {
        type: ControlType.Object,
        title: "Blob 1",
        controls: {
            size: {
                type: ControlType.Number,
                title: "Size",
                min: 8,
                max: 80,
                unit: "px",
            },
            x: {
                type: ControlType.Number,
                title: "X Position",
                min: -300,
                max: 300,
                unit: "%",
            },
            y: {
                type: ControlType.Number,
                title: "Y Position",
                min: -300,
                max: 300,
                unit: "%",
            },
        },
        hidden: (props) => props.blobCount < 1,
    },
    blob2: {
        type: ControlType.Object,
        title: "Blob 2",
        controls: {
            size: {
                type: ControlType.Number,
                title: "Size",
                min: 8,
                max: 80,
                unit: "px",
            },
            x: {
                type: ControlType.Number,
                title: "X Position",
                min: -300,
                max: 300,
                unit: "%",
            },
            y: {
                type: ControlType.Number,
                title: "Y Position",
                min: -300,
                max: 300,
                unit: "%",
            },
        },
        hidden: (props) => props.blobCount < 2,
    },
    blob3: {
        type: ControlType.Object,
        title: "Blob 3",
        controls: {
            size: {
                type: ControlType.Number,
                title: "Size",
                min: 8,
                max: 80,
                unit: "px",
            },
            x: {
                type: ControlType.Number,
                title: "X Position",
                min: -300,
                max: 300,
                unit: "%",
            },
            y: {
                type: ControlType.Number,
                title: "Y Position",
                min: -300,
                max: 300,
                unit: "%",
            },
        },
        hidden: (props) => props.blobCount < 3,
    },
    blob4: {
        type: ControlType.Object,
        title: "Blob 4",
        controls: {
            size: {
                type: ControlType.Number,
                title: "Size",
                min: 8,
                max: 80,
                unit: "px",
            },
            x: {
                type: ControlType.Number,
                title: "X Position",
                min: -300,
                max: 300,
                unit: "%",
            },
            y: {
                type: ControlType.Number,
                title: "Y Position",
                min: -300,
                max: 300,
                unit: "%",
            },
        },
        hidden: (props) => props.blobCount < 4,
    },
    blob5: {
        type: ControlType.Object,
        title: "Blob 5",
        controls: {
            size: {
                type: ControlType.Number,
                title: "Size",
                min: 8,
                max: 80,
                unit: "px",
            },
            x: {
                type: ControlType.Number,
                title: "X Position",
                min: -300,
                max: 300,
                unit: "%",
            },
            y: {
                type: ControlType.Number,
                title: "Y Position",
                min: -300,
                max: 300,
                unit: "%",
            },
        },
        hidden: (props) => props.blobCount < 5,
    },
    onTap: {
        type: ControlType.EventHandler,
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "Jelly Button",
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})
