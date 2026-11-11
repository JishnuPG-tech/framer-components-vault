// @ts-ignore
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useEffect, useRef } from "react"

/**
 * PROJECT CARD
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 480
 * @framerIntrinsicHeight 540
 */

const EASING = "cubic-bezier(0.23, 1, 0.32, 1)"

// Framer passes connected color styles/variables as { value: "rgb(...)" }.
// Unwrap so they work as CSS instead of breaking gradients / fills.
const parseToken = (v: any) =>
    v && typeof v === "object" && "value" in v ? v.value : v

const getReducedMotion = () =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

export default function ProjectCard(props) {
    const {
        style,
        image,
        title,
        category,
        tag,
        showTag,
        showViewPill,
        viewPillLabel,
        titleTag,
        titleFont,
        categoryFont,
        tagFont,
        pillFont,
        textColor,
        mutedTextColor,
        tagBgColor,
        tagTextColor,
        pillBgColor,
        pillTextColor,
        overlayColor,
        bgColor,
        borderRadius,
        contentPadding,
        shadow,
        link,
        openInNewTab,
    } = props

    const isStatic =
        typeof useIsStaticRenderer === "function"
            ? useIsStaticRenderer()
            : false

    const [reducedMotion, setReducedMotion] = useState(getReducedMotion)
    const [isActive, setIsActive] = useState(false) // hover OR keyboard focus
    const noAnim = isStatic || reducedMotion

    useEffect(() => {
        if (
            typeof window === "undefined" ||
            typeof window.matchMedia !== "function"
        )
            return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReducedMotion(mq.matches)
        update()
        mq.addEventListener?.("change", update)
        return () => mq.removeEventListener?.("change", update)
    }, [])

    const uid = useRef(`pc-${Math.random().toString(36).slice(2, 9)}`).current

    // Unwrap color tokens once.
    const _bg = parseToken(bgColor)
    const _overlay = parseToken(overlayColor)
    const _text = parseToken(textColor)
    const _muted = parseToken(mutedTextColor)
    const _tagBg = parseToken(tagBgColor)
    const _tagText = parseToken(tagTextColor)
    const _pillBg = parseToken(pillBgColor)
    const _pillText = parseToken(pillTextColor)

    const overlayBackground = isActive
        ? `linear-gradient(180deg, transparent 28%, ${_overlay} 100%)`
        : `linear-gradient(180deg, transparent 52%, ${_overlay} 100%)`

    const imageSrc = typeof image === "string" ? image : image?.src
    const imageSrcSet = typeof image === "object" ? image?.srcSet : undefined
    const imageAlt = (typeof image === "object" && image?.alt) || ""

    const isLink = !!link
    const Tag: any = isLink ? "a" : "div"
    const linkProps = isLink
        ? {
              href: link,
              target: openInNewTab ? "_blank" : undefined,
              rel: openInNewTab ? "noopener noreferrer" : undefined,
              "aria-label":
                  [showTag && tag, title, category]
                      .filter(Boolean)
                      .join(", ") ||
                  viewPillLabel ||
                  "Project",
          }
        : {}

    // Elevation: hairline ring for definition + optional drop shadow.
    const shadows = ["inset 0 0 0 1px rgba(255,255,255,0.07)"]
    if (shadow) {
        shadows.push(
            !noAnim && isActive
                ? "0 24px 50px -18px rgba(0,0,0,0.5)"
                : "0 6px 22px -12px rgba(0,0,0,0.35)"
        )
    }

    const rootTransition =
        [style?.transition, noAnim ? null : `box-shadow 500ms ${EASING}`]
            .filter(Boolean)
            .join(", ") || undefined

    const TitleTag: any = titleTag || "h3"

    return (
        <Tag
            {...linkProps}
            className={uid}
            onMouseEnter={() => setIsActive(true)}
            onMouseLeave={() => setIsActive(false)}
            onFocus={() => setIsActive(true)}
            onBlur={() => setIsActive(false)}
            style={{
                ...style,
                position: "relative",
                display: "block",
                textDecoration: "none",
                color: "inherit",
                width: style?.width || "100%",
                height: style?.height || "100%",
                minHeight: 240,
                aspectRatio: "480 / 540",
                background: _bg,
                borderRadius,
                overflow: "hidden",
                cursor: isLink ? "pointer" : "default",
                isolation: "isolate",
                boxShadow: shadows.join(", "),
                transition: rootTransition,
                WebkitTapHighlightColor: "transparent",
            }}
        >
            {!isStatic && (
                <style>{`
                    .${uid} { outline: none; }
                    .${uid}:focus-visible {
                        outline: 3px solid #4DA3FF;
                        outline-offset: 3px;
                    }
                `}</style>
            )}

            {/* Image */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    overflow: "hidden",
                    borderRadius,
                }}
            >
                {imageSrc ? (
                    <img
                        src={imageSrc}
                        srcSet={imageSrcSet}
                        sizes="(max-width: 800px) 100vw, 50vw"
                        alt={imageAlt}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                            transform: noAnim
                                ? "none"
                                : isActive
                                  ? "scale(1.06)"
                                  : "scale(1)",
                            transition: noAnim
                                ? "none"
                                : `transform 900ms ${EASING}`,
                            willChange: noAnim ? "auto" : "transform",
                        }}
                    />
                ) : null}
            </div>

            {/* Overlay */}
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    background: overlayBackground,
                    pointerEvents: "none",
                    transition: noAnim ? "none" : `background 500ms ${EASING}`,
                }}
            />

            {/* Tag */}
            {showTag && tag ? (
                <div
                    style={{
                        position: "absolute",
                        top: contentPadding,
                        left: contentPadding,
                        background: _tagBg,
                        color: _tagText,
                        padding: "6px 12px",
                        borderRadius: 100,
                        border: "1px solid rgba(255,255,255,0.18)",
                        ...tagFont,
                        letterSpacing: "0.04em",
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                    }}
                >
                    {tag}
                </div>
            ) : null}

            {/* View pill */}
            {showViewPill ? (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        background: _pillBg,
                        color: _pillText,
                        padding: "12px 22px",
                        borderRadius: 100,
                        ...pillFont,
                        letterSpacing: "-0.01em",
                        whiteSpace: "nowrap",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        opacity: isActive ? 1 : 0,
                        transform: isActive
                            ? "translate(-50%, -50%) scale(1)"
                            : "translate(-50%, -42%) scale(0.96)",
                        transition: noAnim
                            ? "none"
                            : `opacity 350ms ${EASING}, transform 450ms ${EASING}`,
                        pointerEvents: "none",
                        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.35)",
                    }}
                >
                    <span>{viewPillLabel}</span>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path
                            d="M5 3L11 8L5 13"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            ) : null}

            {/* Caption */}
            <div
                style={{
                    position: "absolute",
                    left: contentPadding,
                    right: contentPadding,
                    bottom: contentPadding,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    transform: noAnim
                        ? "none"
                        : isActive
                          ? "translateY(-4px)"
                          : "translateY(0)",
                    transition: noAnim ? "none" : `transform 500ms ${EASING}`,
                }}
            >
                {title ? (
                    <TitleTag
                        style={{
                            margin: 0,
                            color: _text,
                            letterSpacing: "-0.02em",
                            lineHeight: 1.2,
                            ...titleFont,
                            textShadow: "0 1px 10px rgba(0,0,0,0.22)",
                        }}
                    >
                        {title}
                    </TitleTag>
                ) : null}

                {category ? (
                    <div
                        style={{
                            color: _muted,
                            lineHeight: 1.3,
                            ...categoryFont,
                            textShadow: "0 1px 8px rgba(0,0,0,0.22)",
                        }}
                    >
                        {category}
                    </div>
                ) : null}
            </div>
        </Tag>
    )
}

ProjectCard.defaultProps = {
    title: "Atrium Capital",
    category: "Brand identity · Web",
    tag: "2025",
    showTag: true,
    showViewPill: true,
    viewPillLabel: "View project",
    titleTag: "h3",
    textColor: "#FFFFFF",
    mutedTextColor: "rgba(255,255,255,0.78)",
    tagBgColor: "rgba(255,255,255,0.18)",
    tagTextColor: "#FFFFFF",
    pillBgColor: "#FFFFFF",
    pillTextColor: "#0A0A0A",
    overlayColor: "rgba(10,10,10,0.65)",
    bgColor: "#1A1A1A",
    borderRadius: 16,
    contentPadding: 24,
    shadow: true,
    openInNewTab: false,
}

addPropertyControls(ProjectCard, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Atrium Capital",
    },
    titleTag: {
        type: ControlType.Enum,
        title: "Title Tag",
        options: ["h2", "h3", "h4", "p", "div"],
        optionTitles: ["H2", "H3", "H4", "P", "Div"],
        defaultValue: "h3",
        description: "Heading level for the title (SEO / a11y).",
    },
    category: {
        type: ControlType.String,
        title: "Category",
        defaultValue: "Brand identity · Web",
        placeholder: "Service, role, etc.",
    },
    showTag: {
        type: ControlType.Boolean,
        title: "Tag",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    tag: {
        type: ControlType.String,
        title: "Tag Text",
        defaultValue: "2025",
        placeholder: "Year, sector, etc.",
        hidden: (p) => !p.showTag,
    },
    showViewPill: {
        type: ControlType.Boolean,
        title: "View Pill",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    viewPillLabel: {
        type: ControlType.String,
        title: "Pill Label",
        defaultValue: "View project",
        hidden: (p) => !p.showViewPill,
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: (p) => !p.link,
    },
    titleFont: {
        // @ts-ignore
        type: ControlType.Font,
        title: "Title Font",
        controls: "basic",
        displayFontSize: true,
        displayTextAlignment: false,
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 24 },
    },
    categoryFont: {
        // @ts-ignore
        type: ControlType.Font,
        title: "Category Font",
        controls: "basic",
        displayFontSize: true,
        displayTextAlignment: false,
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 14 },
    },
    tagFont: {
        // @ts-ignore
        type: ControlType.Font,
        title: "Tag Font",
        controls: "basic",
        displayFontSize: true,
        displayTextAlignment: false,
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 11 },
        hidden: (p) => !p.showTag,
    },
    pillFont: {
        // @ts-ignore
        type: ControlType.Font,
        title: "Pill Font",
        controls: "basic",
        displayFontSize: true,
        displayTextAlignment: false,
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 14 },
        hidden: (p) => !p.showViewPill,
    },
    textColor: {
        type: ControlType.Color,
        title: "Title",
        defaultValue: "#FFFFFF",
    },
    mutedTextColor: {
        type: ControlType.Color,
        title: "Category",
        defaultValue: "rgba(255,255,255,0.78)",
    },
    tagBgColor: {
        type: ControlType.Color,
        title: "Tag BG",
        defaultValue: "rgba(255,255,255,0.18)",
        hidden: (p) => !p.showTag,
    },
    tagTextColor: {
        type: ControlType.Color,
        title: "Tag Text",
        defaultValue: "#FFFFFF",
        hidden: (p) => !p.showTag,
    },
    pillBgColor: {
        type: ControlType.Color,
        title: "Pill BG",
        defaultValue: "#FFFFFF",
        hidden: (p) => !p.showViewPill,
    },
    pillTextColor: {
        type: ControlType.Color,
        title: "Pill Text",
        defaultValue: "#0A0A0A",
        hidden: (p) => !p.showViewPill,
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay",
        defaultValue: "rgba(10,10,10,0.65)",
        description: "Bottom gradient anchor controls caption legibility.",
    },
    bgColor: {
        type: ControlType.Color,
        title: "Fallback BG",
        defaultValue: "#1A1A1A",
        description: "Shown while the image loads.",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 48,
        step: 1,
        defaultValue: 16,
        unit: "px",
    },
    contentPadding: {
        type: ControlType.Number,
        title: "Padding",
        min: 8,
        max: 48,
        step: 1,
        defaultValue: 24,
        unit: "px",
    },
    shadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
