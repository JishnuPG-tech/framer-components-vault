// Discovery Call Button with animated text, shoot-in reveal, overlapping avatar/label, and background zoom on hover.
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useRef, useEffect, startTransition } from "react"

const defaultImage = {
    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
    alt: "Designer avatar"
}

/**
 * Discovery Call Button
 * Button with animated text slide, avatar/label/hint reveal, and animated hover background zoom
 * @framerIntrinsicWidth 260
 * @framerIntrinsicHeight 60
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function DiscoveryCallButton(props) {
    const {
        buttonText,
        bgColor,
        hoverBgColor,
        avatar,
        circleText,
        hintText,
        textColor,
        hoverTextColor,
        hintFont,
        buttonFont,
        bgRadius,
        buttonPadding,
        buttonStrokeColor,
        buttonStrokeWidth,
        linkUrl,
        openInNewTab // add new prop
    } = props

    const [hover, setHover] = useState(false)
    const isStatic = useIsStaticRenderer()
    // For shooting effect
    const [revealCount, setRevealCount] = useState(0)
    const prevHover = useRef(false)

    // Reveal shoot animation for hintText
    useEffect(() => {
        if (hover && !prevHover.current && !isStatic) {
            setRevealCount(0)
            let t = 0
            const run = () => {
                if (t <= hintText.length) {
                    setTimeout(() => {
                        startTransition(() => setRevealCount(t))
                        t++
                        run()
                    }, 26)
                }
            }
            run()
        } else if (!hover) {
            setRevealCount(0)
        }
        prevHover.current = hover
    }, [hover, hintText, isStatic])

    // For CSS transitions
    const transition = "all 0.36s cubic-bezier(.77,0,.18,1)"

    // Used for avatar and youText stacking
    const overlap = -56
    const avatarSize = 40
    const youSize = 40
    const hintGap = typeof props.hintGap === 'number' ? props.hintGap : 1

    return (
        linkUrl ? (
            <a
                href={linkUrl}
                style={{ display: "block", width: "100%", height: "100%", textDecoration: "none" }}
                target={typeof openInNewTab === "boolean" ? (openInNewTab ? "_blank" : undefined) : undefined}
                rel={typeof openInNewTab === "boolean" ? (openInNewTab ? "noopener noreferrer" : undefined) : undefined}
                tabIndex={-1}
            >
                <button
                    type="button"
                    aria-label="Discovery Call"
                    style={Object.assign({
                        width: props.style && (props.style.width === "fit-content" || props.style.width === "max-content" || props.style.width === "min-content") ? "max-content" : "100%",
                        height: 60,
                        border: buttonStrokeWidth > 0 ? `${buttonStrokeWidth}px solid ${buttonStrokeColor}` : "none",
                        padding: 0,
                        background: "none",
                        cursor: "pointer",
                        position: "relative",
                        borderRadius: bgRadius,
                        overflow: "hidden",
                        display: props.style && (props.style.width === "fit-content" || props.style.width === "max-content" || props.style.width === "min-content") ? "inline-flex" : undefined,
                        minWidth: 180
                    }, props.style)}
                    onMouseEnter={() => !isStatic && setHover(true)}
                    onMouseLeave={() => !isStatic && setHover(false)}
                    tabIndex={0}
                >
                    {/* Default bg */}
                    <div
                        style={{
                            background: bgColor,
                            borderRadius: bgRadius,
                            width: "100%",
                            height: "100%",
                            position: "absolute",
                            left: 0,
                            top: 0,
                            transition,
                            zIndex: 1,
                            opacity: 1,
                        }}
                    />
                    {/* Animated hover background */}
                    <div
                        style={{
                            background: hoverBgColor,
                            borderRadius: bgRadius,
                            width: hover ? "100%" : "70%",
                            height: hover ? "100%" : "70%",
                            left: "50%",
                            top: "50%",
                            position: "absolute",
                            transform: hover ? "translate(-50%, -50%) scale(1)" : "translate(-50%, -50%) scale(0.7)",
                            transition,
                            zIndex: 2,
                            opacity: hover ? 1 : 0,
                            pointerEvents: "none", // don't block pointer
                        }}
                    />
                    {/* Content row */}
                    <div
                        style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            zIndex: 3,
                            width: "100%",
                            gap: 0,
                        }}
                    >
                        {/* Button text - slides out to left */}
                        <span
                            aria-hidden={hover}
                            style={{
                                ...buttonFont,
                                color: textColor,
                                minWidth: 0,
                                whiteSpace: "nowrap",
                                position: "absolute",
                                left: "50%",
                                transform: hover
                                    ? "translate(-150%,-50%)"
                                    : "translate(-50%,-50%)",
                                top: "50%",
                                opacity: hover ? 0 : 1,
                                transition,
                                pointerEvents: hover ? "none" : "auto",
                            }}
                        >
                            {buttonText}
                        </span>
                        {/* Hover content: avatar, You circle, and text - slides in from right */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: overlap + 3, // reduce negative gap from -8 to -5 for closer overlap
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                transform: hover
                                    ? "translate(-50%,-50%)"
                                    : "translate(80%,-50%)",
                                opacity: hover ? 1 : 0,
                                pointerEvents: hover ? "auto" : "none",
                                transition,
                            }}
                            aria-hidden={!hover}
                            onMouseEnter={() => !isStatic && setHover(true)}
                        >
                            {/* Side-by-side: Avatar and YouCircle */}
                            <div 
                                style={{ 
                                    display: "flex", 
                                    alignItems: "center", 
                                    gap: overlap,
                                    transition,
                                    /* REMOVE ROLL-IN TRANSFORMS and OPACITY anim, just leave as side by side with no entry rotate */
                                    transform: "none",
                                    opacity: 1
                                }}
                            >
                                <img
                                    {...(avatar?.src ? avatar : defaultImage)}
                                    width={avatarSize}
                                    height={avatarSize}
                                    style={{
                                        width: avatarSize,
                                        height: avatarSize,
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                        border: `2px solid ${hoverTextColor}`,
                                        boxSizing: "border-box",
                                        background: "#eee",
                                        position: "relative",
                                        transition,
                                        marginRight: -3 // add negative margin to create slight overlap with the circle
                                    }}
                                    alt="Avatar"
                                />
                                {/* YouCircle */}
                                <div
                                    style={{
                                        width: youSize,
                                        height: youSize,
                                        borderRadius: "50%",
                                        background: hoverTextColor,
                                        color: props.circleTextColor,
                                        fontWeight: 700,
                                        fontSize: 18,
                                        border: `2px solid ${hoverBgColor}`,
                                        marginLeft: 0, // remove gap, now they're side by side
                                        marginRight: 8,
                                        position: "relative",
                                        boxSizing: "border-box",
                                        ...props.circleTextFont,
                                        transition,
                                        /* REMOVE ROLL-IN TRANSFORMS and OPACITY anim, just leave as side by side with no entry rotate */
                                        transform: "none",
                                        opacity: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}
                                >
                                    <span style={{
                                        ...props.circleTextFont,
                                        color: props.circleTextColor,
                                        fontWeight: props.circleTextFont?.variant && typeof props.circleTextFont.variant === "string" ? getFontWeightFromVariant(props.circleTextFont.variant) : props.circleTextFont.fontWeight || 400,
                                        fontStyle: props.circleTextFont?.variant && typeof props.circleTextFont.variant === "string" ? getFontStyleFromVariant(props.circleTextFont.variant) : props.circleTextFont.fontStyle || "normal",
                                        fontSize: props.circleTextFont?.fontSize || 18,
                                        lineHeight: props.circleTextFont?.lineHeight || 1,
                                        letterSpacing: props.circleTextFont?.letterSpacing || "-0.01em",
                                        width: "max-content"
                                    }}>{circleText}</span>
                                </div>
                            </div>
                            {/* Shoot-in text */}
                            <span
                                style={{
                                    ...hintFont,
                                    color: hoverTextColor,
                                    whiteSpace: "nowrap",
                                    fontWeight: hintFont?.variant && typeof hintFont.variant === "string" ? getFontWeightFromVariant(hintFont.variant) : hintFont.fontWeight || 400,
                                    fontStyle: hintFont?.variant && typeof hintFont.variant === "string" ? getFontStyleFromVariant(hintFont.variant) : hintFont.fontStyle || "normal",
                                    marginLeft: hintGap,
                                    width: "max-content",
                                    display: "inline-block",
                                    letterSpacing: hintFont.letterSpacing || "-0.01em",
                                    textShadow: "0 1px 6px rgba(0,0,0,0.08)",
                                    fontSize: hintFont.fontSize,
                                    lineHeight: hintFont.lineHeight || 1,
                                    transition,
                                }}
                                aria-live="polite"
                            >
                                {/* Reveal hintText up to revealCount for shoot animation */}
                                {Array.from(hintText).map((char, i) => (
                                    <span
                                        key={i}
                                        style={{
                                            opacity: i < revealCount ? 1 : 0,
                                            display: "inline-block",
                                            transform: i < revealCount
                                                ? "translateX(0px)"
                                                : `translateX(22px)` , // fixed - horizontal only
                                            transition: hover ? `opacity 0.22s cubic-bezier(.6,0,.25,1) ${(i * 0.035).toFixed(3)}s, transform 0.3s cubic-bezier(.8,0,.2,1) ${(i * 0.035).toFixed(3)}s` : "none",
                                            marginRight: char === ' ' ? '0.35em' : undefined // Add space for spaces
                                        }}
                                        aria-hidden={i >= revealCount}
                                    >
                                        {String(char)}
                                    </span>
                                ))}
                                <span style={{ opacity: 0 }}>{ hintText.substring(revealCount) }</span>
                            </span>
                        </div>
                    </div>
                </button>
            </a>
        ) : (
            <button
                type="button"
                aria-label="Discovery Call"
                style={Object.assign({
                    width: props.style && (props.style.width === "fit-content" || props.style.width === "max-content" || props.style.width === "min-content") ? "max-content" : "100%",
                    height: 60,
                    border: buttonStrokeWidth > 0 ? `${buttonStrokeWidth}px solid ${buttonStrokeColor}` : "none",
                    padding: 0,
                    background: "none",
                    cursor: "pointer",
                    position: "relative",
                    borderRadius: bgRadius,
                    overflow: "hidden",
                    display: props.style && (props.style.width === "fit-content" || props.style.width === "max-content" || props.style.width === "min-content") ? "inline-flex" : undefined,
                    minWidth: 180
                }, props.style)}
                onMouseEnter={() => !isStatic && setHover(true)}
                onMouseLeave={() => !isStatic && setHover(false)}
                tabIndex={0}
            >
                {/* Default bg */}
                <div
                    style={{
                        background: bgColor,
                        borderRadius: bgRadius,
                        width: "100%",
                        height: "100%",
                        position: "absolute",
                        left: 0,
                        top: 0,
                        transition,
                        zIndex: 1,
                        opacity: 1,
                    }}
                />
                {/* Animated hover background */}
                <div
                    style={{
                        background: hoverBgColor,
                        borderRadius: bgRadius,
                        width: hover ? "100%" : "70%",
                        height: hover ? "100%" : "70%",
                        left: "50%",
                        top: "50%",
                        position: "absolute",
                        transform: hover ? "translate(-50%, -50%) scale(1)" : "translate(-50%, -50%) scale(0.7)",
                        transition,
                        zIndex: 2,
                        opacity: hover ? 1 : 0,
                        pointerEvents: "none", // don't block pointer
                    }}
                />
                {/* Content row */}
                <div
                    style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        zIndex: 3,
                        width: "100%",
                        gap: 0,
                    }}
                >
                    {/* Button text - slides out to left */}
                    <span
                        aria-hidden={hover}
                        style={{
                            ...buttonFont,
                            color: textColor,
                            minWidth: 0,
                            whiteSpace: "nowrap",
                            position: "absolute",
                            left: "50%",
                            transform: hover
                                ? "translate(-150%,-50%)"
                                : "translate(-50%,-50%)",
                            top: "50%",
                            opacity: hover ? 0 : 1,
                            transition,
                            pointerEvents: hover ? "none" : "auto",
                        }}
                    >
                        {buttonText}
                    </span>
                    {/* Hover content: avatar, You circle, and text - slides in from right */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: overlap + 3, // reduce negative gap from -8 to -5 for closer overlap
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            transform: hover
                                ? "translate(-50%,-50%)"
                                : "translate(80%,-50%)",
                            opacity: hover ? 1 : 0,
                            pointerEvents: hover ? "auto" : "none",
                            transition,
                        }}
                        aria-hidden={!hover}
                        onMouseEnter={() => !isStatic && setHover(true)}
                    >
                        {/* Side-by-side: Avatar and YouCircle */}
                        <div 
                            style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                gap: overlap,
                                transition,
                                /* REMOVE ROLL-IN TRANSFORMS and OPACITY anim, just leave as side by side with no entry rotate */
                                transform: "none",
                                opacity: 1
                            }}
                        >
                            <img
                                {...(avatar?.src ? avatar : defaultImage)}
                                width={avatarSize}
                                height={avatarSize}
                                style={{
                                    width: avatarSize,
                                    height: avatarSize,
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    border: `2px solid ${hoverTextColor}`,
                                    boxSizing: "border-box",
                                    background: "#eee",
                                    position: "relative",
                                    transition,
                                    marginRight: -3 // add negative margin to create slight overlap with the circle
                                }}
                                alt="Avatar"
                            />
                            {/* YouCircle */}
                            <div
                                style={{
                                    width: youSize,
                                    height: youSize,
                                    borderRadius: "50%",
                                    background: hoverTextColor,
                                    color: props.circleTextColor,
                                    fontWeight: 700,
                                    fontSize: 18,
                                    border: `2px solid ${hoverBgColor}`,
                                    marginLeft: 0, // remove gap, now they're side by side
                                    marginRight: 8,
                                    position: "relative",
                                    boxSizing: "border-box",
                                    ...props.circleTextFont,
                                    transition,
                                    /* REMOVE ROLL-IN TRANSFORMS and OPACITY anim, just leave as side by side with no entry rotate */
                                    transform: "none",
                                    opacity: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}
                            >
                                <span style={{
                                    ...props.circleTextFont,
                                    color: props.circleTextColor,
                                    fontWeight: props.circleTextFont?.variant && typeof props.circleTextFont.variant === "string" ? getFontWeightFromVariant(props.circleTextFont.variant) : props.circleTextFont.fontWeight || 400,
                                    fontStyle: props.circleTextFont?.variant && typeof props.circleTextFont.variant === "string" ? getFontStyleFromVariant(props.circleTextFont.variant) : props.circleTextFont.fontStyle || "normal",
                                    fontSize: props.circleTextFont?.fontSize || 18,
                                    lineHeight: props.circleTextFont?.lineHeight || 1,
                                    letterSpacing: props.circleTextFont?.letterSpacing || "-0.01em",
                                    width: "max-content"
                                }}>{circleText}</span>
                            </div>
                        </div>
                        {/* Shoot-in text */}
                        <span
                            style={{
                                ...hintFont,
                                color: hoverTextColor,
                                whiteSpace: "nowrap",
                                fontWeight: hintFont?.variant && typeof hintFont.variant === "string" ? getFontWeightFromVariant(hintFont.variant) : hintFont.fontWeight || 400,
                                fontStyle: hintFont?.variant && typeof hintFont.variant === "string" ? getFontStyleFromVariant(hintFont.variant) : hintFont.fontStyle || "normal",
                                marginLeft: hintGap,
                                width: "max-content",
                                display: "inline-block",
                                letterSpacing: hintFont.letterSpacing || "-0.01em",
                                textShadow: "0 1px 6px rgba(0,0,0,0.08)",
                                fontSize: hintFont.fontSize,
                                lineHeight: hintFont.lineHeight || 1,
                                transition,
                            }}
                            aria-live="polite"
                        >
                            {/* Reveal hintText up to revealCount for shoot animation */}
                            {Array.from(hintText).map((char, i) => (
                                <span
                                    key={i}
                                    style={{
                                        opacity: i < revealCount ? 1 : 0,
                                        display: "inline-block",
                                        transform: i < revealCount
                                            ? "translateX(0px)"
                                            : `translateX(22px)` , // fixed - horizontal only
                                        transition: hover ? `opacity 0.22s cubic-bezier(.6,0,.25,1) ${(i * 0.035).toFixed(3)}s, transform 0.3s cubic-bezier(.8,0,.2,1) ${(i * 0.035).toFixed(3)}s` : "none",
                                        marginRight: char === ' ' ? '0.35em' : undefined // Add space for spaces
                                    }}
                                    aria-hidden={i >= revealCount}
                                >
                                    {String(char)}
                                </span>
                            ))}
                            <span style={{ opacity: 0 }}>{ hintText.substring(revealCount) }</span>
                        </span>
                    </div>
                </div>
            </button>
        )
    )
}

function getFontWeight(variant) {
    if (!variant) return 400
    const v = variant.toLowerCase()
    if (v.includes("thin")) return 100
    if (v.includes("extra light")) return 200
    if (v.includes("light") && !v.includes("extra light")) return 300
    if (v.includes("medium")) return 500
    if (v.includes("semibold")) return 600
    if (v.includes("bold") && !v.includes("semibold") && !v.includes("extra bold")) return 700
    if (v.includes("extra bold")) return 800
    if (v.includes("black")) return 900
    return 400
}

function getFontStyle(variant) {
    if (!variant) return "normal"
    return variant.toLowerCase().includes("italic") ? "italic" : "normal"
}

// New helpers for hintFont robust variants
type VariantMap = { [key: string]: { weight: number, style: string } }
const hintFontVariants: VariantMap = {
    "regular": { weight: 400, style: "normal" },
    "thin": { weight: 100, style: "normal" },
    "extra light": { weight: 200, style: "normal" },
    "light": { weight: 300, style: "normal" },
    "medium": { weight: 500, style: "normal" },
    "semibold": { weight: 600, style: "normal" },
    "bold": { weight: 700, style: "normal" },
    "extra bold": { weight: 800, style: "normal" },
    "black": { weight: 900, style: "normal" },
    "thin italic": { weight: 100, style: "italic" },
    "extra light italic": { weight: 200, style: "italic" },
    "light italic": { weight: 300, style: "italic" },
    "italic": { weight: 400, style: "italic" },
    "medium italic": { weight: 500, style: "italic" },
    "semibold italic": { weight: 600, style: "italic" },
    "bold italic": { weight: 700, style: "italic" },
    "extra bold italic": { weight: 800, style: "italic" },
    "black italic": { weight: 900, style: "italic" },
    "regular italic": { weight: 400, style: "italic" },
    "variable": { weight: 400, style: "normal" },
    "variable italic": { weight: 400, style: "italic" },
}

function getFontWeightFromVariant(variant) {
    const v = String(variant).toLowerCase()
    const entry = hintFontVariants[v]
    return entry ? entry.weight : 400
}
function getFontStyleFromVariant(variant) {
    const v = String(variant).toLowerCase()
    const entry = hintFontVariants[v]
    return entry ? entry.style : "normal"
}

addPropertyControls(DiscoveryCallButton, {
    buttonText: {
        type: ControlType.String,
        title: "Button Text",
        defaultValue: "Discovery Call"
    },
    bgColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#2222ee"
    },
    hoverBgColor: {
        type: ControlType.Color,
        title: "Hover BG",
        defaultValue: "#00C9A7"
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#fff"
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Text",
        defaultValue: "#fff"
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        defaultValue: {
            fontSize: "20px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1em"
        },
        controls: "extended",
        defaultFontType: "sans-serif"
    },
    hintFont: {
        type: ControlType.Font,
        title: "Hint Font",
        defaultValue: {
            fontSize: "20px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1em"
        },
        controls: "extended",
        defaultFontType: "sans-serif"
    },
    avatar: {
        type: ControlType.ResponsiveImage,
        title: "Avatar"
    },
    circleText: {
        type: ControlType.String,
        title: 'Circle Text',
        defaultValue: 'You',
    },
    circleTextFont: {
        type: ControlType.Font,
        title: "Circle Text Font",
        defaultValue: {
            fontSize: "18px",
            variant: "Bold",
            letterSpacing: "-0.01em",
            lineHeight: "1em"
        },
        controls: "extended",
        defaultFontType: "sans-serif"
    },
    circleTextColor: {
        type: ControlType.Color,
        title: "Circle Text Color",
        defaultValue: "#fff"
    },
    hintText: {
        type: ControlType.String,
        title: 'Hint Text',
        defaultValue: "Let's talk"
    },
    bgRadius: {
        type: ControlType.Number,
        title: 'Radius',
        min: 0,
        max: 50,
        defaultValue: 30
    },
    buttonPadding: {
        type: ControlType.String,
        title: "Button Padding",
        defaultValue: "0 28px",
        hidden: () => true
    },
    buttonStrokeColor: {
        type: ControlType.Color,
        title: "Stroke Color",
        defaultValue: "#2222ee"
    },
    buttonStrokeWidth: {
        type: ControlType.Number,
        title: "Stroke Width",
        min: 0,
        max: 8,
        step: 1,
        defaultValue: 0
    },
    hintGap: {
        type: ControlType.Number,
        title: "Hint Gap",
        defaultValue: 1,
        min: -16,
        max: 24,
        step: 1
    },
    linkUrl: {
        type: ControlType.Link,
        title: "Link URL",
        defaultValue: "",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "Open in New Tab",
        defaultValue: true,
        hidden: ({ linkUrl }) => !linkUrl || linkUrl === ""
    }
})
