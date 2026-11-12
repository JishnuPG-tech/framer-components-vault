// Create a glass surface component with chromatic aberration effects
// Works cross-browser including Safari/Firefox and Framer preview

import {
    useEffect,
    useRef,
    useState,
    useId,
    startTransition,
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


interface GlassSurfaceProps {
    children?: React.ReactNode
    width?: number | string
    height?: number | string
    borderRadius?: number
    borderWidth?: number
    brightness?: number
    opacity?: number
    blur?: number
    displace?: number
    backgroundOpacity?: number
    saturation?: number
    distortionScale?: number
    redOffset?: number
    greenOffset?: number
    blueOffset?: number
    xChannel?: "R" | "G" | "B"
    yChannel?: "R" | "G" | "B"
    aberrationIntensity?: number
    mixBlendMode?:
        | "normal"
        | "multiply"
        | "screen"
        | "overlay"
        | "darken"
        | "lighten"
        | "color-dodge"
        | "color-burn"
        | "hard-light"
        | "soft-light"
        | "difference"
        | "exclusion"
        | "hue"
        | "saturation"
        | "color"
        | "luminosity"
        | "plus-darker"
        | "plus-lighter"
    style?: CSSProperties
}

const useDarkMode = () => {
    const [isDark, setIsDark] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined") return

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
        startTransition(() => setIsDark(mediaQuery.matches))

        const handler = (e: MediaQueryListEvent) =>
            startTransition(() => setIsDark(e.matches))
        mediaQuery.addEventListener("change", handler)
        return () => mediaQuery.removeEventListener("change", handler)
    }, [])

    return isDark
}

// Check if SVG filters in backdrop-filter are supported (only Chromium)
const useSVGFilterSupport = () => {
    const [supported, setSupported] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined") return

        const isWebkit =
            /Safari/.test(navigator.userAgent) &&
            !/Chrome/.test(navigator.userAgent)
        const isFirefox = /Firefox/.test(navigator.userAgent)

        if (isWebkit || isFirefox) {
            setSupported(false)
            return
        }

        const div = document.createElement("div")
        div.style.backdropFilter = "url(#test-filter)"
        setSupported(div.style.backdropFilter !== "")
    }, [])

    return supported
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function GlassSurface(props: GlassSurfaceProps) {
    const {
        children,
        borderRadius = 20,
        borderWidth = 0.07,
        brightness = 50,
        opacity = 0.93,
        blur = 11,
        displace = 0,
        backgroundOpacity = 0,
        saturation = 1,
        distortionScale = -180,
        redOffset = 0,
        greenOffset = 10,
        blueOffset = 20,
        xChannel = "R",
        yChannel = "G",
        aberrationIntensity = 1,
        mixBlendMode = "difference",
        style = {},
    } = props

    const uniqueId = useId().replace(/:/g, "-")
    const filterId = `glass-filter-${uniqueId}`
    const redGradId = `red-grad-${uniqueId}`
    const blueGradId = `blue-grad-${uniqueId}`

    const containerRef = useRef<HTMLDivElement>(null)
    const feImageRef = useRef<SVGFEImageElement>(null)
    const redChannelRef = useRef<SVGFEDisplacementMapElement>(null)
    const greenChannelRef = useRef<SVGFEDisplacementMapElement>(null)
    const blueChannelRef = useRef<SVGFEDisplacementMapElement>(null)
    const gaussianBlurRef = useRef<SVGFEGaussianBlurElement>(null)

    const isDarkMode = useDarkMode()
    const svgFiltersSupported = useSVGFilterSupport()

    const generateDisplacementMap = () => {
        const rect = containerRef.current?.getBoundingClientRect()
        const actualWidth = rect?.width || 400
        const actualHeight = rect?.height || 200
        const edgeSize =
            Math.min(actualWidth, actualHeight) * (borderWidth * 0.5)

        const svgContent = `
      <svg viewBox="0 0 ${actualWidth} ${actualHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" fill="black"></rect>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${redGradId})" />
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode: ${mixBlendMode}" />
        <rect x="${edgeSize}" y="${edgeSize}" width="${actualWidth - edgeSize * 2}" height="${actualHeight - edgeSize * 2}" rx="${borderRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" style="filter:blur(${blur}px)" />
      </svg>
    `

        return `data:image/svg+xml,${encodeURIComponent(svgContent)}`
    }

    const updateDisplacementMap = () => {
        feImageRef.current?.setAttribute("href", generateDisplacementMap())
    }

    useEffect(() => {
        updateDisplacementMap()
        ;[
            { ref: redChannelRef, offset: redOffset },
            { ref: greenChannelRef, offset: greenOffset },
            { ref: blueChannelRef, offset: blueOffset },
        ].forEach(({ ref, offset }) => {
            if (ref.current) {
                ref.current.setAttribute(
                    "scale",
                    (distortionScale + offset).toString()
                )
                ref.current.setAttribute("xChannelSelector", xChannel)
                ref.current.setAttribute("yChannelSelector", yChannel)
            }
        })

        gaussianBlurRef.current?.setAttribute(
            "stdDeviation",
            displace.toString()
        )
    }, [
        borderRadius,
        borderWidth,
        brightness,
        opacity,
        blur,
        displace,
        distortionScale,
        redOffset,
        greenOffset,
        blueOffset,
        xChannel,
        yChannel,
        mixBlendMode,
    ])

    useEffect(() => {
        if (!containerRef.current) return

        const resizeObserver = new ResizeObserver(() => {
            setTimeout(updateDisplacementMap, 0)
        })

        resizeObserver.observe(containerRef.current)

        return () => {
            resizeObserver.disconnect()
        }
    }, [])

    // Calculate edge size for chromatic aberration effect
    const edgeSize =
        Math.max(8, borderRadius * borderWidth * 0.5) * aberrationIntensity

    const getContainerStyles = (): CSSProperties => {
        const baseStyles: CSSProperties = {
            ...style,
            width: "100%",
            height: "100%",
            borderRadius: `${borderRadius}px`,
        }

        if (svgFiltersSupported) {
            // Use SVG filters for Chromium browsers (best quality)
            return {
                ...baseStyles,
                background: isDarkMode
                    ? `hsl(0 0% 0% / ${backgroundOpacity})`
                    : `hsl(0 0% 100% / ${backgroundOpacity})`,
                backdropFilter: `url(#${filterId}) saturate(${saturation})`,
                boxShadow: isDarkMode
                    ? `0 0 2px 1px color-mix(in oklch, white, transparent 65%) inset,
             0 0 10px 4px color-mix(in oklch, white, transparent 85%) inset,
             0px 4px 16px rgba(17, 17, 26, 0.05),
             0px 8px 24px rgba(17, 17, 26, 0.05),
             0px 16px 56px rgba(17, 17, 26, 0.05),
             0px 4px 16px rgba(17, 17, 26, 0.05) inset,
             0px 8px 24px rgba(17, 17, 26, 0.05) inset,
             0px 16px 56px rgba(17, 17, 26, 0.05) inset`
                    : `0 0 2px 1px color-mix(in oklch, black, transparent 85%) inset,
             0 0 10px 4px color-mix(in oklch, black, transparent 90%) inset,
             0px 4px 16px rgba(17, 17, 26, 0.05),
             0px 8px 24px rgba(17, 17, 26, 0.05),
             0px 16px 56px rgba(17, 17, 26, 0.05),
             0px 4px 16px rgba(17, 17, 26, 0.05) inset,
             0px 8px 24px rgba(17, 17, 26, 0.05) inset,
             0px 16px 56px rgba(17, 17, 26, 0.05) inset`,
            }
        }

        // CSS fallback for Safari/Firefox/Framer preview
        return {
            ...baseStyles,
            background: isDarkMode
                ? `hsl(0 0% 0% / ${backgroundOpacity})`
                : `hsl(0 0% 100% / ${backgroundOpacity})`,
            backdropFilter: `blur(${blur}px) saturate(${saturation}) brightness(${brightness / 50})`,
            WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation}) brightness(${brightness / 50})`,
            boxShadow: isDarkMode
                ? `0 0 2px 1px rgba(255, 255, 255, 0.15) inset,
           0 0 10px 4px rgba(255, 255, 255, 0.05) inset,
           0px 4px 16px rgba(17, 17, 26, 0.1),
           0px 8px 24px rgba(17, 17, 26, 0.1)`
                : `0 0 2px 1px rgba(0, 0, 0, 0.08) inset,
           0 0 10px 4px rgba(0, 0, 0, 0.03) inset,
           0px 4px 16px rgba(17, 17, 26, 0.08),
           0px 8px 24px rgba(17, 17, 26, 0.08)`,
        }
    }

    // CSS-based chromatic aberration colors
    const aberrationOpacity = aberrationIntensity * 0.4

    return (
        <div
            ref={containerRef}
            style={{
                ...getContainerStyles(),
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                transition: "opacity 260ms ease-out",
                outline: isDarkMode
                    ? "2px solid transparent"
                    : "2px solid transparent",
                outlineOffset: "2px",
            }}
        >
            {/* SVG filter for Chromium browsers */}
            <svg
                style={{
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    position: "absolute",
                    inset: 0,
                    opacity: 0,
                    zIndex: -10,
                }}
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <filter
                        id={filterId}
                        colorInterpolationFilters="sRGB"
                        x="0%"
                        y="0%"
                        width="100%"
                        height="100%"
                    >
                        <feImage
                            ref={feImageRef}
                            x="0"
                            y="0"
                            width="100%"
                            height="100%"
                            preserveAspectRatio="none"
                            result="map"
                        />

                        <feDisplacementMap
                            ref={redChannelRef}
                            in="SourceGraphic"
                            in2="map"
                            id="redchannel"
                            result="dispRed"
                        />
                        <feColorMatrix
                            in="dispRed"
                            type="matrix"
                            values="1 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
                            result="red"
                        />

                        <feDisplacementMap
                            ref={greenChannelRef}
                            in="SourceGraphic"
                            in2="map"
                            id="greenchannel"
                            result="dispGreen"
                        />
                        <feColorMatrix
                            in="dispGreen"
                            type="matrix"
                            values="0 0 0 0 0
                      0 1 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
                            result="green"
                        />

                        <feDisplacementMap
                            ref={blueChannelRef}
                            in="SourceGraphic"
                            in2="map"
                            id="bluechannel"
                            result="dispBlue"
                        />
                        <feColorMatrix
                            in="dispBlue"
                            type="matrix"
                            values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 1 0 0
                      0 0 0 1 0"
                            result="blue"
                        />

                        <feBlend
                            in="red"
                            in2="green"
                            mode="screen"
                            result="rg"
                        />
                        <feBlend
                            in="rg"
                            in2="blue"
                            mode="screen"
                            result="output"
                        />
                        <feGaussianBlur
                            ref={gaussianBlurRef}
                            in="output"
                            stdDeviation="0.7"
                        />
                    </filter>
                </defs>
            </svg>

            {/* CSS-based chromatic aberration for Safari/Firefox/Framer */}
            {!svgFiltersSupported && (
                <>
                    {/* Red/Orange edge - left side */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "inherit",
                            pointerEvents: "none",
                            background: `linear-gradient(90deg,
                                rgba(255, 50, 50, ${aberrationOpacity}) 0%,
                                rgba(255, 100, 50, ${aberrationOpacity * 0.5}) ${edgeSize}px,
                                transparent ${edgeSize * 2}px)`,
                            mixBlendMode: "screen",
                            zIndex: 1,
                        }}
                    />
                    {/* Cyan/Blue edge - right side */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "inherit",
                            pointerEvents: "none",
                            background: `linear-gradient(270deg,
                                rgba(50, 150, 255, ${aberrationOpacity}) 0%,
                                rgba(100, 200, 255, ${aberrationOpacity * 0.5}) ${edgeSize}px,
                                transparent ${edgeSize * 2}px)`,
                            mixBlendMode: "screen",
                            zIndex: 1,
                        }}
                    />
                    {/* Yellow/Green edge - top */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "inherit",
                            pointerEvents: "none",
                            background: `linear-gradient(180deg,
                                rgba(200, 255, 50, ${aberrationOpacity * 0.6}) 0%,
                                rgba(150, 255, 100, ${aberrationOpacity * 0.3}) ${edgeSize}px,
                                transparent ${edgeSize * 2}px)`,
                            mixBlendMode: "screen",
                            zIndex: 1,
                        }}
                    />
                    {/* Magenta/Purple edge - bottom */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "inherit",
                            pointerEvents: "none",
                            background: `linear-gradient(0deg,
                                rgba(255, 50, 200, ${aberrationOpacity * 0.6}) 0%,
                                rgba(200, 100, 255, ${aberrationOpacity * 0.3}) ${edgeSize}px,
                                transparent ${edgeSize * 2}px)`,
                            mixBlendMode: "screen",
                            zIndex: 1,
                        }}
                    />
                    {/* Rainbow corner accents */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "inherit",
                            pointerEvents: "none",
                            background: `
                                radial-gradient(ellipse at 0% 0%, rgba(255, 100, 50, ${aberrationOpacity * 0.8}) 0%, transparent ${edgeSize * 3}px),
                                radial-gradient(ellipse at 100% 0%, rgba(50, 255, 150, ${aberrationOpacity * 0.6}) 0%, transparent ${edgeSize * 3}px),
                                radial-gradient(ellipse at 100% 100%, rgba(50, 150, 255, ${aberrationOpacity * 0.8}) 0%, transparent ${edgeSize * 3}px),
                                radial-gradient(ellipse at 0% 100%, rgba(255, 50, 200, ${aberrationOpacity * 0.6}) 0%, transparent ${edgeSize * 3}px)
                            `,
                            mixBlendMode: "screen",
                            zIndex: 1,
                        }}
                    />
                    {/* Inner glow for depth */}
                    <div
                        style={{
                            position: "absolute",
                            inset: edgeSize,
                            borderRadius: `${Math.max(0, borderRadius - edgeSize)}px`,
                            pointerEvents: "none",
                            boxShadow: isDarkMode
                                ? `0 0 ${edgeSize * 2}px ${edgeSize}px rgba(255, 255, 255, 0.03) inset`
                                : `0 0 ${edgeSize * 2}px ${edgeSize}px rgba(0, 0, 0, 0.02) inset`,
                            zIndex: 1,
                        }}
                    />
                </>
            )}

            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 8,
                    borderRadius: "inherit",
                    position: "relative",
                    zIndex: 10,
                }}
            >
                {children}
            </div>
        </div>
    )
}

addPropertyControls(GlassSurface, {
    children: {
        type: ControlType.ComponentInstance,
        title: "Content",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 0.07,
        min: 0,
        max: 1,
        step: 0.01,
    },
    brightness: {
        type: ControlType.Number,
        title: "Brightness",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 0.93,
        min: 0,
        max: 1,
        step: 0.01,
    },
    blur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 11,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    displace: {
        type: ControlType.Number,
        title: "Displace",
        defaultValue: 0,
        min: 0,
        max: 10,
        step: 0.1,
    },
    backgroundOpacity: {
        type: ControlType.Number,
        title: "Background Opacity",
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.01,
    },
    saturation: {
        type: ControlType.Number,
        title: "Saturation",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.1,
    },
    distortionScale: {
        type: ControlType.Number,
        title: "Distortion Scale",
        defaultValue: -180,
        min: -500,
        max: 500,
        step: 1,
    },
    redOffset: {
        type: ControlType.Number,
        title: "Red Offset",
        defaultValue: 0,
        min: -100,
        max: 100,
        step: 1,
    },
    greenOffset: {
        type: ControlType.Number,
        title: "Green Offset",
        defaultValue: 10,
        min: -100,
        max: 100,
        step: 1,
    },
    blueOffset: {
        type: ControlType.Number,
        title: "Blue Offset",
        defaultValue: 20,
        min: -100,
        max: 100,
        step: 1,
    },
    aberrationIntensity: {
        type: ControlType.Number,
        title: "Aberration Intensity",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.1,
    },
    xChannel: {
        type: ControlType.Enum,
        title: "X Channel",
        options: ["R", "G", "B"],
        defaultValue: "R",
        displaySegmentedControl: true,
    },
    yChannel: {
        type: ControlType.Enum,
        title: "Y Channel",
        options: ["R", "G", "B"],
        defaultValue: "G",
        displaySegmentedControl: true,
    },
    mixBlendMode: {
        type: ControlType.Enum,
        title: "Mix Blend Mode",
        options: [
            "normal",
            "multiply",
            "screen",
            "overlay",
            "darken",
            "lighten",
            "color-dodge",
            "color-burn",
            "hard-light",
            "soft-light",
            "difference",
            "exclusion",
            "hue",
            "saturation",
            "color",
            "luminosity",
            "plus-darker",
            "plus-lighter",
        ],
        defaultValue: "difference",
    },
})
