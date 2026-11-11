import { useEffect, useId, useMemo, useRef, useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// User request: Keep circular dual-material fluffy icon architecture and Squish & Bounce hover, but bake in the built-in fur texture (no custom texture uploads), while keeping all other tuning controls and adding credits in the last control description.

interface MyComponentProps {
    style?: CSSProperties
    iconSvg?: string
    link?: string
    newTab: boolean
    iconColor: string
    iconTextureScale: number
    iconTextureContrast: number
    discColor: string
    discTextureScale: number
    discTextureContrast: number
    iconSize: number
    furAmount: number
    furSoftness: number
    edgeFluff: number
    iconElevation: number
    contactShadowStrength: number
    contactShadowBlur: number
    iconHighlight: number
    puffiness: number
    edgeFibers: number
    discShadow: number
    hoverMotion: boolean
    motionIntensity: number
}

const DEFAULT_TEXTURE = {
    src: "https://framerusercontent.com/images/D8TLtJRQ9Ecx5irCegftn4XOPE.png",
    alt: "Realistic neutral short plush fur texture",
}

const ICON_TEXTURE = {
    src: "https://framerusercontent.com/images/4G1SUS66iIBDvE35UBPMRQkwWr4.png",
    alt: "Neutral seamless short fur texture for icon surfaces",
}

const DEFAULT_ICON_SVG = "https://framerusercontent.com/images/YnOCzlIaa7B8rL0RyclewTpXo.svg"

function getColorLuminance(color: string): number {
    const value = color.trim()

    let r = 128
    let g = 128
    let b = 128

    if (/^#[0-9a-fA-F]{3}$/.test(value)) {
        r = parseInt(value[1] + value[1], 16)
        g = parseInt(value[2] + value[2], 16)
        b = parseInt(value[3] + value[3], 16)
    } else if (/^#[0-9a-fA-F]{6}$/.test(value)) {
        r = parseInt(value.slice(1, 3), 16)
        g = parseInt(value.slice(3, 5), 16)
        b = parseInt(value.slice(5, 7), 16)
    } else {
        const rgbMatch = value.match(/^rgba?\(([^)]+)\)$/i)
        if (rgbMatch) {
            const parts = rgbMatch[1].split(",").map((part) => Number(part.trim()))
            if (parts.length >= 3 && parts.slice(0, 3).every((part) => Number.isFinite(part))) {
                r = Math.max(0, Math.min(255, parts[0]))
                g = Math.max(0, Math.min(255, parts[1]))
                b = Math.max(0, Math.min(255, parts[2]))
            } else {
                return 0.5
            }
        } else {
            return 0.5
        }
    }

    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 75
 * @framerIntrinsicHeight 75
 */
export default function FluffyIcon(props: MyComponentProps) {
    const {
        style,
        iconSvg = "",
        link = "",
        newTab = false,
        iconColor = "#FFFFFF",
        iconTextureScale = 100,
        iconTextureContrast = 105,
        discColor = "#E94732",
        discTextureScale = 100,
        discTextureContrast = 135,
        iconSize = 68,
        furAmount = 45,
        furSoftness = 7,
        edgeFluff = 10,
        iconElevation = 4,
        contactShadowStrength = 32,
        contactShadowBlur = 8,
        iconHighlight = 28,
        puffiness = 50,
        edgeFibers = 14,
        discShadow = 40,
        hoverMotion = true,
        motionIntensity = 50,
    } = props

    const [hovered, setHovered] = useState(false)
    const [pressed, setPressed] = useState(false)
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
    const [stageSize, setStageSize] = useState(75)
    const stageRef = useRef<HTMLDivElement | null>(null)
    const isStaticRenderer = useIsStaticRenderer()

    const instanceId = useId().replace(/[:]/g, "")
    const discOuterFilterId = `discOuter${instanceId}`
    const iconOuterFilterId = `iconOuter${instanceId}`
    const iconMainFilterId = `iconMain${instanceId}`

    const maskUrl = iconSvg || DEFAULT_ICON_SVG
    const maskImageValue = `url("${maskUrl}")`

    useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") return
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
        startTransition(() => setPrefersReducedMotion(mediaQuery.matches))

        const onChange = (event: MediaQueryListEvent) => {
            startTransition(() => setPrefersReducedMotion(event.matches))
        }

        if (typeof mediaQuery.addEventListener === "function") {
            mediaQuery.addEventListener("change", onChange)
            return () => mediaQuery.removeEventListener("change", onChange)
        }
        mediaQuery.addListener(onChange)
        return () => mediaQuery.removeListener(onChange)
    }, [])

    useEffect(() => {
        const stageElement = stageRef.current
        if (!stageElement) return

        const updateSize = (width: number) => {
            const roundedWidth = Math.round(width)
            if (!Number.isFinite(roundedWidth) || roundedWidth <= 0) return
            startTransition(() => {
                setStageSize((previous) => (previous === roundedWidth ? previous : roundedWidth))
            })
        }

        if (typeof window === "undefined") return

        if (typeof ResizeObserver === "undefined") {
            const rect = stageElement.getBoundingClientRect()
            updateSize(rect.width)
            return
        }

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (!entry) return
            updateSize(entry.contentRect.width)
        })
        observer.observe(stageElement)

        return () => observer.disconnect()
    }, [])

    const computed = useMemo(() => {
        const sizeFactor = Math.max(0.1, Math.min(8, stageSize / 75))
        const effectScale = Math.max(0.65, Math.sqrt(sizeFactor))
        const clampedIconSize = Math.max(0, Math.min(100, iconSize))
        const clampedIconTextureScale = Math.max(50, Math.min(200, iconTextureScale))
        const clampedIconTextureContrast = Math.max(50, Math.min(200, iconTextureContrast))
        const clampedDiscTextureScale = Math.max(50, Math.min(200, discTextureScale))
        const clampedDiscTextureContrast = Math.max(50, Math.min(200, discTextureContrast))
        const effectiveIconTextureScale = (clampedIconTextureScale / 100) * 100
        const effectiveIconTextureContrast = (clampedIconTextureContrast / 100) * 100
        const effectiveDiscTextureScale = (clampedDiscTextureScale / 100) * 100
        const effectiveDiscTextureContrast = (clampedDiscTextureContrast / 100) * 100
        const iconLuminance = getColorLuminance(iconColor)
        const discLuminance = getColorLuminance(discColor)
        const iconBrightness = 100 + iconLuminance * 3
        const discBrightness = 100
        const clampedFurAmount = Math.max(0, Math.min(100, furAmount))
        const clampedFurSoftness = Math.max(0, Math.min(30, furSoftness))
        const clampedEdgeFluff = Math.max(0, Math.min(30, edgeFluff))
        const clampedIconElevation = Math.max(0, Math.min(20, iconElevation))
        const clampedContactShadowStrength = Math.max(0, Math.min(100, contactShadowStrength))
        const clampedContactShadowBlur = Math.max(0, Math.min(30, contactShadowBlur))
        const clampedIconHighlight = Math.max(0, Math.min(100, iconHighlight))
        const clampedPuffiness = Math.max(0, Math.min(100, puffiness))
        const clampedEdgeFibers = Math.max(0, Math.min(30, edgeFibers))
        const clampedDiscShadow = Math.max(0, Math.min(100, discShadow))

        const iconScaleFactor = clampedIconSize / 68

        const discOuterScale = 1 + clampedEdgeFibers * 0.0045
        const discOuterOpacity = 0.14 + clampedEdgeFibers / 200
        const discOuterBlur = (0.9 + clampedEdgeFibers * 0.07) * effectScale
        const discOuterDisplacement = clampedEdgeFibers * 0.45 * effectScale

        const discHighlightAlpha = 0.11 + clampedPuffiness / 1100
        const discShadeAlpha = 0.04 + clampedPuffiness / 750

        const discShadowScale = clampedDiscShadow / 50
        const discShadowY = 8 * discShadowScale * effectScale
        const discShadowBlur = 18 * discShadowScale * effectScale
        const discShadowAlpha = 0.16 * discShadowScale
        const discBoxShadow = clampedDiscShadow <= 0 ? "none" : `0 ${discShadowY}px ${discShadowBlur}px rgba(25, 15, 10, ${discShadowAlpha})`

        const haloScale = 1 + clampedEdgeFluff * 0.012 + clampedFurAmount * 0.0015
        const haloBlur = (clampedFurSoftness * 0.8 + clampedEdgeFluff * 0.2 + clampedFurAmount * 0.02) * effectScale
        const haloOpacity = 0.12 + clampedEdgeFluff / 190 + clampedFurAmount / 500
        const midOpacity = 0.28 + clampedFurAmount / 250

        const iconOuterDisplacement = clampedFurAmount * 0.5 * effectScale
        const iconMainDisplacement = clampedFurAmount * 0.14 * effectScale

        const scaledElevation = clampedIconElevation * iconScaleFactor * effectScale
        const scaledContactBlur = clampedContactShadowBlur * iconScaleFactor * effectScale
        const iconLiftY = scaledElevation * 0.5
        const contactOffsetX = scaledElevation * 0.18
        const contactOffsetY = scaledElevation * 0.95
        const contactOpacity = clampedContactShadowStrength / 200
        const contactDropOpacity = clampedContactShadowStrength / 170
        const iconHighlightOpacity = clampedIconHighlight / 350
        const highlightOffset = 1.5 * effectScale

        const hasDiscHalo = clampedEdgeFibers > 0
        const hasIconDisplacement = clampedFurAmount > 0
        const hasContactShadow = clampedContactShadowStrength > 0
        const clampedMotionIntensity = Math.max(0, Math.min(100, motionIntensity))
        const motionFactor = clampedMotionIntensity / 50
        const hoverScaleX = 1 + 0.07 * motionFactor
        const hoverScaleY = 1 - 0.07 * motionFactor
        const pressScaleX = 1 + 0.12 * motionFactor
        const pressScaleY = 1 - 0.16 * motionFactor

        return {
            clampedIconSize,
            clampedIconTextureScale,
            clampedIconTextureContrast,
            clampedDiscTextureScale,
            clampedDiscTextureContrast,
            effectiveIconTextureScale,
            effectiveIconTextureContrast,
            effectiveDiscTextureScale,
            effectiveDiscTextureContrast,
            iconBrightness,
            discBrightness,
            discOuterScale,
            discOuterOpacity,
            discOuterBlur,
            discOuterDisplacement,
            discHighlightAlpha,
            discShadeAlpha,
            discBoxShadow,
            haloScale,
            haloBlur,
            haloOpacity,
            midOpacity,
            iconOuterDisplacement,
            iconMainDisplacement,
            scaledElevation,
            scaledContactBlur,
            iconLiftY,
            contactOffsetX,
            contactOffsetY,
            contactOpacity,
            contactDropOpacity,
            iconHighlightOpacity,
            highlightOffset,
            hasDiscHalo,
            hasIconDisplacement,
            hasContactShadow,
            hoverScaleX,
            hoverScaleY,
            pressScaleX,
            pressScaleY,
        }
    }, [
        iconSize,
        iconTextureScale,
        iconTextureContrast,
        iconColor,
        discTextureScale,
        discTextureContrast,
        discColor,
        furAmount,
        furSoftness,
        edgeFluff,
        iconElevation,
        contactShadowStrength,
        contactShadowBlur,
        iconHighlight,
        puffiness,
        edgeFibers,
        discShadow,
        motionIntensity,
        stageSize,
    ])

    // Framer canvas/export must always receive the complete, motion-free preview.
    const canAnimate = hoverMotion && !prefersReducedMotion && !isStaticRenderer
    const hasLink = typeof link === "string" && link.trim().length > 0
    const styleWidth = style?.width
    const styleHeight = style?.height
    const isAutoSized = styleWidth === "auto" || styleHeight === "auto"
    const wrapperTransform = canAnimate
        ? pressed
            ? `scale(${computed.pressScaleX}, ${computed.pressScaleY})`
            : hovered
              ? `scale(${computed.hoverScaleX}, ${computed.hoverScaleY})`
              : "scale(1, 1)"
        : "scale(1, 1)"
    const wrapperTransition = canAnimate
        ? pressed
            ? "transform 0.2s cubic-bezier(0.2, 0.9, 0.25, 1.2)"
            : "transform 0.45s cubic-bezier(0.34, 1.8, 0.4, 1)"
        : "none"
    const rootStyle: CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
        ...(hasLink
            ? {
                  cursor: "pointer",
                  textDecoration: "none",
              }
            : null),
        ...style,
    }

    const content = (
        <>
            <svg aria-hidden="true" style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}>
                <filter id={discOuterFilterId} x="-35%" y="-35%" width="170%" height="170%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={1} seed={7} result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale={computed.discOuterDisplacement} xChannelSelector="R" yChannelSelector="G" />
                </filter>
                <filter id={iconOuterFilterId} x="-35%" y="-35%" width="170%" height="170%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves={1} seed={5} result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale={computed.iconOuterDisplacement} xChannelSelector="R" yChannelSelector="G" />
                </filter>
                <filter id={iconMainFilterId} x="-18%" y="-18%" width="136%" height="136%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves={1} seed={19} result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale={computed.iconMainDisplacement} xChannelSelector="R" yChannelSelector="G" />
                </filter>
            </svg>

            <div
                ref={stageRef}
                style={{
                    position: "relative",
                    width: "100%",
                    minWidth: isAutoSized ? 75 : undefined,
                    minHeight: isAutoSized ? 75 : undefined,
                    maxWidth: "100%",
                    maxHeight: "100%",
                    aspectRatio: "1 / 1",
                    overflow: "visible",
                }}
            >
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        overflow: "visible",
                        transformOrigin: "50% 85%",
                        transform: wrapperTransform,
                        transition: wrapperTransition,
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            overflow: "visible",
                        }}
                    >
                        {computed.hasDiscHalo ? (
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    filter: `url(#${discOuterFilterId})`,
                                    transform: `scale(${computed.discOuterScale})`,
                                    transformOrigin: "center",
                                    opacity: computed.discOuterOpacity,
                                    overflow: "visible",
                                }}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        borderRadius: "50%",
                                        overflow: "hidden",
                                        backgroundColor: discColor,
                                        backgroundImage: `url(${DEFAULT_TEXTURE.src})`,
                                        backgroundBlendMode: "multiply",
                                        backgroundPosition: "center",
                                        backgroundRepeat: "no-repeat",
                                        backgroundSize: `${computed.effectiveDiscTextureScale}%`,
                                        maskImage: `url(${DEFAULT_TEXTURE.src})`,
                                        WebkitMaskImage: `url(${DEFAULT_TEXTURE.src})`,
                                        maskRepeat: "no-repeat",
                                        WebkitMaskRepeat: "no-repeat",
                                        maskPosition: "center",
                                        WebkitMaskPosition: "center",
                                        maskSize: "100% 100%",
                                        WebkitMaskSize: "100% 100%",
                                        filter: `blur(${computed.discOuterBlur}px) brightness(${computed.discBrightness}%) saturate(140%) contrast(${computed.effectiveDiscTextureContrast}%)`,
                                    }}
                                />
                            </div>
                        ) : null}

                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                overflow: "visible",
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    borderRadius: "50%",
                                    overflow: "hidden",
                                    boxShadow: computed.discBoxShadow,
                                    backgroundColor: discColor,
                                        backgroundImage: `url(${DEFAULT_TEXTURE.src})`,
                                    backgroundBlendMode: "multiply",
                                    backgroundPosition: "center",
                                    backgroundRepeat: "no-repeat",
                                    backgroundSize: `${computed.effectiveDiscTextureScale}%`,
                                        maskImage: `url(${DEFAULT_TEXTURE.src})`,
                                        WebkitMaskImage: `url(${DEFAULT_TEXTURE.src})`,
                                        maskRepeat: "no-repeat",
                                        WebkitMaskRepeat: "no-repeat",
                                        maskPosition: "center",
                                        WebkitMaskPosition: "center",
                                        maskSize: "100% 100%",
                                        WebkitMaskSize: "100% 100%",
                                    filter: `brightness(${computed.discBrightness}%) saturate(140%) contrast(${computed.effectiveDiscTextureContrast}%)`,
                                }}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        borderRadius: "50%",
                                        background: `radial-gradient(circle at 32% 30%, rgba(255,255,255,${computed.discHighlightAlpha}) 0%, rgba(255,255,255,0) 52%), radial-gradient(circle at 70% 72%, rgba(0,0,0,${computed.discShadeAlpha}) 0%, rgba(0,0,0,0) 62%)`,
                                        pointerEvents: "none",
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            width: `${computed.clampedIconSize}%`,
                            height: `${computed.clampedIconSize}%`,
                            left: "50%",
                            top: "50%",
                            transform: "translate(-50%, -50%)",
                            overflow: "visible",
                        }}
                    >
                        {computed.hasContactShadow ? (
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    transform: `translate(${computed.contactOffsetX}px, ${computed.contactOffsetY}px)`,
                                    opacity: computed.contactOpacity,
                                }}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        maskImage: maskImageValue,
                                        WebkitMaskImage: maskImageValue,
                                        maskRepeat: "no-repeat",
                                        WebkitMaskRepeat: "no-repeat",
                                        maskPosition: "center",
                                        WebkitMaskPosition: "center",
                                        maskSize: "contain",
                                        WebkitMaskSize: "contain",
                                        background: "#101010",
                                        filter: `blur(${computed.scaledContactBlur}px)`,
                                    }}
                                />
                            </div>
                        ) : null}

                        {computed.hasIconDisplacement ? (
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    transform: `scale(${computed.haloScale})`,
                                    transformOrigin: "center",
                                    opacity: computed.haloOpacity,
                                    filter: `url(#${iconOuterFilterId})`,
                                }}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        maskImage: maskImageValue,
                                        WebkitMaskImage: maskImageValue,
                                        maskRepeat: "no-repeat",
                                        WebkitMaskRepeat: "no-repeat",
                                        maskPosition: "center",
                                        WebkitMaskPosition: "center",
                                        maskSize: "contain",
                                        WebkitMaskSize: "contain",
                                        backgroundColor: iconColor,
                                        filter: `blur(${computed.haloBlur}px) brightness(${computed.iconBrightness}%) saturate(140%) contrast(${computed.effectiveIconTextureContrast}%)`,
                                    }}
                                />
                            </div>
                        ) : null}

                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                opacity: computed.midOpacity,
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    maskImage: maskImageValue,
                                    WebkitMaskImage: maskImageValue,
                                    maskRepeat: "no-repeat",
                                    WebkitMaskRepeat: "no-repeat",
                                    maskPosition: "center",
                                    WebkitMaskPosition: "center",
                                    maskSize: "contain",
                                    WebkitMaskSize: "contain",
                                    backgroundColor: iconColor,
                                    filter: `brightness(${computed.iconBrightness}%) saturate(140%) contrast(${computed.effectiveIconTextureContrast}%)`,
                                }}
                            />
                        </div>

                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                transform: `translateY(${-computed.iconLiftY}px)`,
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    transform: `translate(${-computed.highlightOffset}px, ${-computed.highlightOffset}px)`,
                                    opacity: computed.iconHighlightOpacity,
                                }}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        maskImage: maskImageValue,
                                        WebkitMaskImage: maskImageValue,
                                        maskRepeat: "no-repeat",
                                        WebkitMaskRepeat: "no-repeat",
                                        maskPosition: "center",
                                        WebkitMaskPosition: "center",
                                        maskSize: "contain",
                                        WebkitMaskSize: "contain",
                                        background: "#FFFFFF",
                                    }}
                                />
                            </div>

                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    filter: `drop-shadow(0 ${computed.scaledElevation}px ${computed.scaledContactBlur}px rgba(0, 0, 0, ${computed.contactDropOpacity}))`,
                                }}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                    }}
                                >
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            maskImage: maskImageValue,
                                            WebkitMaskImage: maskImageValue,
                                            maskRepeat: "no-repeat",
                                            WebkitMaskRepeat: "no-repeat",
                                            maskPosition: "center",
                                            WebkitMaskPosition: "center",
                                            maskSize: "contain",
                                            WebkitMaskSize: "contain",
                                            backgroundColor: iconColor,
                                        backgroundImage: `url(${ICON_TEXTURE.src})`,
                                            backgroundBlendMode: "multiply",
                                            backgroundPosition: "center",
                                            backgroundRepeat: "no-repeat",
                                            backgroundSize: `${computed.effectiveIconTextureScale}%`,
                                            filter: `${computed.hasIconDisplacement ? `url(#${iconMainFilterId}) ` : ""}brightness(${computed.iconBrightness}%) saturate(140%) contrast(${computed.effectiveIconTextureContrast}%)`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )

    const eventHandlers = isStaticRenderer
        ? {}
        : {
              onMouseEnter: () => {
                  startTransition(() => setHovered(true))
              },
              onMouseLeave: () => {
                  startTransition(() => {
                      setHovered(false)
                      setPressed(false)
                  })
              },
              onPointerDown: () => {
                  startTransition(() => setPressed(true))
              },
              onPointerUp: () => {
                  startTransition(() => setPressed(false))
              },
              onPointerCancel: () => {
                  startTransition(() => setPressed(false))
              },
          }

    return hasLink ? (
        <a href={link} target={newTab ? "_blank" : undefined} rel={newTab ? "noopener noreferrer" : undefined} style={rootStyle} {...eventHandlers}>
            {content}
        </a>
    ) : (
        <div style={rootStyle} {...eventHandlers}>
            {content}
        </div>
    )
}

FluffyIcon.displayName = "Fluffy Icon"

addPropertyControls(FluffyIcon, {
    iconSvg: {
        type: ControlType.File,
        title: "Icon SVG",
        allowedFileTypes: ["svg"],
        description: "SVG used as a silhouette — colors are ignored.",
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        defaultValue: "#FFFFFF",
    },
    discColor: {
        type: ControlType.Color,
        title: "Disc Color",
        defaultValue: "#E94732",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        min: 0,
        max: 100,
        unit: "%",
        defaultValue: 68,
    },
    iconTextureScale: {
        type: ControlType.Number,
        title: "Icon Texture Scale",
        min: 50,
        max: 200,
        unit: "%",
        defaultValue: 100,
    },
    iconTextureContrast: {
        type: ControlType.Number,
        title: "Icon Texture Contrast",
        min: 50,
        max: 200,
        unit: "%",
        defaultValue: 105,
    },
    discTextureScale: {
        type: ControlType.Number,
        title: "Disc Texture Scale",
        min: 50,
        max: 200,
        unit: "%",
        defaultValue: 100,
    },
    discTextureContrast: {
        type: ControlType.Number,
        title: "Disc Texture Contrast",
        min: 50,
        max: 200,
        unit: "%",
        defaultValue: 135,
    },
    furAmount: {
        type: ControlType.Number,
        title: "Fur Amount",
        min: 0,
        max: 100,
        defaultValue: 45,
        description: "Roughness of the symbol's fuzzy edges.",
    },
    furSoftness: {
        type: ControlType.Number,
        title: "Fur Softness",
        min: 0,
        max: 30,
        defaultValue: 7,
    },
    edgeFluff: {
        type: ControlType.Number,
        title: "Edge Fluff",
        min: 0,
        max: 30,
        defaultValue: 10,
        description: "Fiber halo spread around the symbol.",
    },
    edgeFibers: {
        type: ControlType.Number,
        title: "Edge Fibers",
        min: 0,
        max: 30,
        defaultValue: 14,
        description: "Fine fibers poking past the ball's rim.",
    },
    puffiness: {
        type: ControlType.Number,
        title: "Puffiness",
        min: 0,
        max: 100,
        defaultValue: 50,
        description: "Domed, padded lighting on the ball.",
    },
    iconElevation: {
        type: ControlType.Number,
        title: "Icon Elevation",
        min: 0,
        max: 20,
        defaultValue: 4,
    },
    contactShadowStrength: {
        type: ControlType.Number,
        title: "Contact Shadow Strength",
        min: 0,
        max: 100,
        defaultValue: 32,
    },
    contactShadowBlur: {
        type: ControlType.Number,
        title: "Contact Shadow Blur",
        min: 0,
        max: 30,
        defaultValue: 8,
    },
    iconHighlight: {
        type: ControlType.Number,
        title: "Icon Highlight",
        min: 0,
        max: 100,
        defaultValue: 28,
        description: "Top-left highlight rim on the symbol.",
    },
    hoverMotion: {
        type: ControlType.Boolean,
        title: "Hover Motion",
        defaultValue: true,
        description: "Squish & bounce on hover and press.",
    },
    motionIntensity: {
        type: ControlType.Number,
        title: "Motion Intensity",
        min: 0,
        max: 100,
        defaultValue: 50,
        hidden: (props) => !props.hoverMotion,
    },
    discShadow: {
        type: ControlType.Number,
        title: "Disc Shadow",
        min: 0,
        max: 100,
        defaultValue: 40,
        description: "Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)",
    },
})