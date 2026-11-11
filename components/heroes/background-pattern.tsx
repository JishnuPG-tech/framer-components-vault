// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"
import { useMemo } from "react"

interface BackgroundPatternProps {
    patternType?:
        | "cross"
        | "grid"
        | "dots"
        | "plus"
        | "zigzag"
        | "waves"
        | "triangles"
        | "hexagons"
        | "bricks"
        | "diagonalGrid"
        | "diagonal"
        | "diagonalDots"
        | "diamonds"
        | "circles"
        | "overlapping"
        | "signal"
        | "architect"
        | "stars"
        | "xo"
        | "texture"
        | "checkerboard"
        | "hideout"
    patternSize?: number
    patternColor?: string
    backgroundColor?: string
    patternOpacity?: number
    strokeWidth?: number
    dotSize?: number
    gap?: number
    fade?: boolean
    fadeIntensity?: number
    fadeShape?: "circle" | "ellipse"
    style?: React.CSSProperties
}

// Check if we're in Canvas mode for static rendering
const renderContext = RenderTarget.current()
const isCanvasMode = renderContext === RenderTarget.canvas

/**
 * BackgroundPattern Component
 * A comprehensive background pattern component supporting 21 different pattern types
 * with optional radial fade effect. Patterns are generated using SVG data URLs for optimal performance
 * All patterns sourced from Hero Patterns (heropatterns.com) by Steve Schoger
 * @framerDisableUnlink
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 600
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function BackgroundPattern(props: BackgroundPatternProps) {
    const {
        patternType = "cross",
        patternColor = "#0540E3",
        backgroundColor = "transparent",
        patternSize = 40,
        patternOpacity = 0.4,
        strokeWidth = 3,
        dotSize = 1.2,
        gap = 15,
        fade = true,
        fadeIntensity = 90,
        fadeShape = "circle",
        style,
    } = props

    // Encode the color for use in SVG data URL
    // This ensures special characters in color values don't break the URL
    const encodedPatternColor = useMemo(
        () => encodeURIComponent(patternColor),
        [patternColor]
    )

    // Generate mask style for radial fade effect
    // Uses both standard and webkit prefixed properties for browser compatibility
    const maskStyle: React.CSSProperties = useMemo(() => {
        if (!fade) return {}

        const gradientShape =
            fadeShape === "ellipse" ? "ellipse at top" : "circle"

        return {
            maskImage: `radial-gradient(${gradientShape}, white 10%, transparent ${fadeIntensity}%)`,
            WebkitMaskImage: `radial-gradient(${gradientShape}, white 10%, transparent ${fadeIntensity}%)`,
        }
    }, [fade, fadeIntensity, fadeShape])

    // 1. Generate Cross pattern SVG
    const crossPatternSVG = useMemo(
        () =>
            `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${patternSize}' height='${patternSize}' viewBox='0 0 40 40'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='${encodedPatternColor}' fill-opacity='${patternOpacity}'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        [patternSize, encodedPatternColor, patternOpacity]
    )

    // 2. Generate Grid pattern SVG
    const gridPatternSVG = useMemo(() => {
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' stroke='${patternColor}' stroke-width='${strokeWidth}' fill-opacity='${patternOpacity}'><path d='M 100 0 L 100 200'/><path d='M 0 100 L 200 100'/></svg>`
        return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`
    }, [patternColor, strokeWidth, patternOpacity])

    // 3. Generate Dots pattern SVG
    const dotsPatternSVG = useMemo(
        () =>
            `url("data:image/svg+xml,%3Csvg width='${gap}' height='${gap}' viewBox='0 0 ${gap} ${gap}' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='${encodedPatternColor}' fill-opacity='${patternOpacity}' fill-rule='evenodd'%3E%3Ccircle cx='${dotSize}' cy='${dotSize}' r='${dotSize}'/%3E%3C/g%3E%3C/svg%3E")`,
        [gap, dotSize, encodedPatternColor, patternOpacity]
    )

    // 4. Generate Plus pattern SVG
    const plusPatternSVG = useMemo(
        () =>
            `url("data:image/svg+xml,%3Csvg width='${patternSize}' height='${patternSize}' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='${encodedPatternColor}' fill-opacity='${patternOpacity}'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        [patternSize, encodedPatternColor, patternOpacity]
    )

    // 5. Generate Zigzag pattern SVG
    const zigzagPatternSVG = useMemo(
        () =>
            `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${patternSize}' height='${
                patternSize / 2
            }' viewBox='0 0 20 12'%3E%3Cg fill-rule='evenodd'%3E%3Cg id='charlie-brown' fill='${encodedPatternColor}' fill-opacity='${patternOpacity}'%3E%3Cpath d='M9.8 12L0 2.2V.8l10 10 10-10v1.4L10.2 12h-.4zm-4 0L0 6.2V4.8L7.2 12H5.8zm8.4 0L20 6.2V4.8L12.8 12h1.4zM9.8 0l.2.2.2-.2h-.4zm-4 0L10 4.2 14.2 0h-1.4L10 2.8 7.2 0H5.8z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        [patternSize, encodedPatternColor, patternOpacity]
    )

    // 6. Generate Waves pattern SVG
    const wavesPatternSVG = useMemo(
        () =>
            `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${patternSize}' height='${
                patternSize / 2
            }' viewBox='0 0 52 26'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='${encodedPatternColor}' fill-opacity='${patternOpacity}'%3E%3Cpath d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        [patternSize, encodedPatternColor, patternOpacity]
    )

    // 7. Generate Triangles pattern SVG
    const trianglesPatternSVG = useMemo(
        () =>
            `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${patternSize}' height='${
                patternSize * 0.866
            }' viewBox='0 0 12 16'%3E%3Cpath fill='${encodedPatternColor}' fill-opacity='${patternOpacity}' d='M4 .99L0 8h8l-4-7.01zM12 15L8 8h8l-4 7z'/%3E%3C/svg%3E")`,
        [patternSize, encodedPatternColor, patternOpacity]
    )

    // 8. Generate Hexagons pattern SVG
    const hexagonsPatternSVG = useMemo(
        () =>
            `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${
                patternSize * 1.4
            }' height='${
                patternSize * 1.4
            }' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg id='hexagons' fill='${encodedPatternColor}' fill-opacity='${patternOpacity}' fill-rule='nonzero'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        [patternSize, encodedPatternColor, patternOpacity]
    )

    // 9. Generate Bricks pattern SVG (MOVED HERE after Hexagons)
    const bricksPatternSVG = useMemo(
        () =>
            `url("data:image/svg+xml,%3Csvg width='${patternSize}' height='${patternSize * 1.05}' viewBox='0 0 42 44' xmlns='http://www.w3.org/2000/svg'%3E%3Cg id='Page-1' fill='none' fill-rule='evenodd'%3E%3Cg id='brick-wall' fill='${encodedPatternColor}' fill-opacity='${patternOpacity}'%3E%3Cpath d='M0 0h42v44H0V0zm1 1h40v20H1V1zM0 23h20v20H0V23zm22 0h20v20H22V23z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        [patternSize, encodedPatternColor, patternOpacity] // Add patternSize to dependencies
    )

    // 10. Generate Diagonal Grid Lines pattern SVG (WITH STROKE WIDTH CONTROL)
    const diagonalGridPatternSVG = useMemo(() => {
        const svg = `<svg width='${patternSize}' height='${patternSize}' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'><g fill='none' stroke='${patternColor}' stroke-width='${strokeWidth}' stroke-opacity='${patternOpacity}' stroke-linecap='square'><path d='M0 40L40 0'/><path d='M0 0L40 40'/></g></svg>`
        return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`
    }, [patternSize, patternColor, strokeWidth, patternOpacity])

    // 11. Generate Diagonal Line pattern SVG (NEW - Single diagonal with stroke width)
    const diagonalPatternSVG = useMemo(() => {
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${patternSize}' height='${patternSize}' viewBox='0 0 ${patternSize} ${patternSize}' fill='none'><line x1='0' y1='${patternSize}' x2='${patternSize}' y2='0' stroke='${patternColor}' stroke-width='${strokeWidth}' stroke-opacity='${patternOpacity}' stroke-linecap='square'/><line x1='-${patternSize}' y1='${patternSize}' x2='0' y2='0' stroke='${patternColor}' stroke-width='${strokeWidth}' stroke-opacity='${patternOpacity}' stroke-linecap='square'/><line x1='${patternSize}' y1='${patternSize}' x2='${patternSize * 2}' y2='0' stroke='${patternColor}' stroke-width='${strokeWidth}' stroke-opacity='${patternOpacity}' stroke-linecap='square'/></svg>`
        return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`
    }, [patternSize, patternColor, strokeWidth, patternOpacity])

    // 12. Generate Diagonal Dots pattern SVG (NEW - Dotted diagonal effect)
    const diagonalDotsPatternSVG = useMemo(() => {
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${patternSize}' height='${patternSize}' fill='none' overflow='visible'><path d='M 0 ${patternSize} L ${patternSize} 0' fill='transparent' stroke-width='${strokeWidth}' stroke='${patternColor}' stroke-linecap='square' stroke-miterlimit='10' stroke-opacity='${patternOpacity}' stroke-dasharray=''></path></svg>`
        return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`
    }, [patternSize, patternColor, strokeWidth, patternOpacity])

    // 13. Generate Diamonds pattern SVG
    const diamondsPatternSVG = useMemo(
        () =>
            `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${patternSize}' height='${patternSize}' viewBox='0 0 20 20'%3E%3Cg fill='${encodedPatternColor}' fill-opacity='${patternOpacity}'%3E%3Cpath d='M10 0l10 10-10 10L0 10 10 0zm0 2.828L2.828 10 10 17.172 17.172 10 10 2.828z'/%3E%3C/g%3E%3C/svg%3E")`,
        [patternSize, encodedPatternColor, patternOpacity]
    )

    // 14. Generate Circles pattern SVG
    const circlesPatternSVG = useMemo(
        () =>
            `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${patternSize}' height='${patternSize}' viewBox='0 0 80 80'%3E%3Cg fill='${encodedPatternColor}' fill-opacity='${patternOpacity}'%3E%3Ccircle cx='40' cy='40' r='20'/%3E%3Ccircle cx='0' cy='0' r='20'/%3E%3Ccircle cx='0' cy='80' r='20'/%3E%3Ccircle cx='80' cy='0' r='20'/%3E%3Ccircle cx='80' cy='80' r='20'/%3E%3C/g%3E%3C/svg%3E")`,
        [patternSize, encodedPatternColor, patternOpacity]
    )

    // 15. Generate Overlapping Circles pattern SVG
    const overlappingPatternSVG = useMemo(
        () =>
            `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${patternSize}' height='${patternSize}' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='${encodedPatternColor}' stroke-opacity='${patternOpacity}' stroke-width='${strokeWidth}'%3E%3Ccircle cx='40' cy='40' r='40'/%3E%3Ccircle cx='0' cy='40' r='40'/%3E%3Ccircle cx='80' cy='40' r='40'/%3E%3C/g%3E%3C/svg%3E")`,
        [patternSize, encodedPatternColor, patternOpacity, strokeWidth] // Add strokeWidth to dependencies
    )

    // 16. Generate Signal pattern SVG
    const signalPatternSVG = useMemo(
        () =>
            `url("data:image/svg+xml,%3Csvg width='${patternSize}' height='${patternSize}' viewBox='0 0 84 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h12v6H0V0zm28 8h12v6H28V8zm14-8h12v6H42V0zm14 0h12v6H56V0zm0 8h12v6H56V8zM42 8h12v6H42V8zm0 16h12v6H42v-6zm14-8h12v6H56v-6zm14 0h12v6H70v-6zm0-16h12v6H70V0zM28 32h12v6H28v-6zM14 16h12v6H14v-6zM0 24h12v6H0v-6zm0 8h12v6H0v-6zm14 0h12v6H14v-6zm14 8h12v6H28v-6zm-14 0h12v6H14v-6zm28 0h12v6H42v-6zm14-8h12v6H56v-6zm0-8h12v6H56v-6zm14 8h12v6H70v-6zm0 8h12v6H70v-6zM14 24h12v6H14v-6zm14-8h12v6H28v-6zM14 8h12v6H14V8zM0 8h12v6H0V8z' fill='${encodedPatternColor}' fill-opacity='${patternOpacity}' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        [patternSize, encodedPatternColor, patternOpacity]
    )

    // 17. Generate Architect pattern SVG
    const architectPatternSVG = useMemo(
        () =>
            `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${patternSize}' height='${patternSize}' viewBox='0 0 20 20'%3E%3Cg fill='${encodedPatternColor}' fill-opacity='${patternOpacity}'%3E%3Cpath d='M0 0h20L0 20z'/%3E%3C/g%3E%3C/svg%3E")`,
        [patternSize, encodedPatternColor, patternOpacity]
    )

    // 18. Generate Stars pattern SVG
    const starsPatternSVG = useMemo(
        () =>
            `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${patternSize}' height='${patternSize}' viewBox='0 0 80 80'%3E%3Cg fill='${encodedPatternColor}' fill-opacity='${patternOpacity}'%3E%3Cpath d='M20 10l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6l2-6zm40 0l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6l2-6zM0 50l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6l2-6zm40 0l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6l2-6zm40 0l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6l2-6z'/%3E%3C/g%3E%3C/svg%3E")`,
        [patternSize, encodedPatternColor, patternOpacity]
    )

    // 19. Generate XO pattern SVG (MOVED HERE after Stars)
    const xoPatternSVG = useMemo(
        () =>
            `url("data:image/svg+xml,%3Csvg width='${patternSize}' height='${patternSize}' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8 16c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm0-2c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6zm33.414-6l5.95-5.95L45.95.636 40 6.586 34.05.636 32.636 2.05 38.586 8l-5.95 5.95 1.414 1.414L40 9.414l5.95 5.95 1.414-1.414L41.414 8zM40 48c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm0-2c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6zM9.414 40l5.95-5.95-1.414-1.414L8 38.586l-5.95-5.95L.636 34.05 6.586 40l-5.95 5.95 1.414 1.414L8 41.414l5.95 5.95 1.414-1.414L9.414 40z' fill='${encodedPatternColor}' fill-opacity='${patternOpacity}' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        [patternSize, encodedPatternColor, patternOpacity]
    )

    // 20. Generate Texture pattern SVG
    const texturePatternSVG = useMemo(
        () =>
            `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${
                patternSize / 2
            }' height='${
                patternSize / 2
            }' viewBox='0 0 4 4'%3E%3Cpath fill='${encodedPatternColor}' fill-opacity='${patternOpacity}' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'/%3E%3C/svg%3E")`,
        [patternSize, encodedPatternColor, patternOpacity]
    )

    // 21. Generate Checkerboard pattern SVG
    const checkerboardPatternSVG = useMemo(
        () =>
            `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${patternSize}' height='${patternSize}' viewBox='0 0 8 8'%3E%3Cg fill='${encodedPatternColor}' fill-opacity='${patternOpacity}'%3E%3Cpath fill-rule='evenodd' d='M0 0h4v4H0V0zm4 4h4v4H4V4z'/%3E%3C/g%3E%3C/svg%3E")`,
        [patternSize, encodedPatternColor, patternOpacity]
    )

    // 22. Generate Hideout pattern SVG
    const hideoutPatternSVG = useMemo(
        () =>
            `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${patternSize}' height='${
                patternSize * 0.866
            }' viewBox='0 0 12 16'%3E%3Cpath fill='${encodedPatternColor}' fill-opacity='${patternOpacity}' d='M4 .99C4 .445 4.444 0 5 0c.552 0 1 .45 1 .99v4.02C6 5.555 5.556 6 5 6c-.552 0-1-.45-1-.99V.99zm6 8c0-.546.444-.99 1-.99.552 0 1 .45 1 .99v4.02c0 .546-.444.99-1 .99-.552 0-1-.45-1-.99V8.99z'/%3E%3C/svg%3E")`,
        [patternSize, encodedPatternColor, patternOpacity]
    )

    // Select the appropriate pattern based on patternType
    const getPatternImage = useMemo(() => {
        switch (patternType) {
            case "grid":
                return gridPatternSVG
            case "dots":
                return dotsPatternSVG
            case "bricks":
                return bricksPatternSVG
            case "plus":
                return plusPatternSVG
            case "xo":
                return xoPatternSVG
            case "zigzag":
                return zigzagPatternSVG
            case "waves":
                return wavesPatternSVG
            case "triangles":
                return trianglesPatternSVG
            case "hexagons":
                return hexagonsPatternSVG
            case "diagonalGrid":
                return diagonalGridPatternSVG
            case "diagonal":
                return diagonalPatternSVG
            case "diagonalDots":
                return diagonalDotsPatternSVG
            case "diamonds":
                return diamondsPatternSVG
            case "circles":
                return circlesPatternSVG
            case "overlapping":
                return overlappingPatternSVG
            case "signal":
                return signalPatternSVG
            case "architect":
                return architectPatternSVG
            case "stars":
                return starsPatternSVG
            case "texture":
                return texturePatternSVG
            case "checkerboard":
                return checkerboardPatternSVG
            case "hideout":
                return hideoutPatternSVG
            case "cross":
            default:
                return crossPatternSVG
        }
    }, [
        patternType,
        crossPatternSVG,
        gridPatternSVG,
        dotsPatternSVG,
        bricksPatternSVG,
        plusPatternSVG,
        xoPatternSVG,
        zigzagPatternSVG,
        wavesPatternSVG,
        trianglesPatternSVG,
        hexagonsPatternSVG,
        diagonalGridPatternSVG,
        diagonalPatternSVG,
        diamondsPatternSVG,
        circlesPatternSVG,
        overlappingPatternSVG,
        signalPatternSVG,
        architectPatternSVG,
        starsPatternSVG,
        texturePatternSVG,
        checkerboardPatternSVG,
        hideoutPatternSVG,
    ])

    // Determine background size based on pattern type
    const getBackgroundSize = useMemo(() => {
        if (patternType === "grid") {
            return `${patternSize}px`
        }
        return undefined
    }, [patternType, patternSize])

    // Generate the complete background style with SVG pattern
    const backgroundStyle: React.CSSProperties = useMemo(
        () => ({
            backgroundColor,
            backgroundImage: getPatternImage,
            backgroundRepeat: "repeat",
            backgroundSize: getBackgroundSize,
            ...maskStyle,
        }),
        [backgroundColor, getPatternImage, getBackgroundSize, maskStyle, style]
    )

    // Render as a motion.div for potential animation support
    return (
        <motion.div
            style={{
                position: "relative",
                inset: 0,
                width: style?.width || 600,
                height: style?.height || 600,
                pointerEvents: "none",
                ...backgroundStyle,
                ...style,
            }}
        />
    )
}

// Set display name for better debugging in React DevTools
BackgroundPattern.displayName = "Background Pattern"

// Default props ensure component works out of the box
BackgroundPattern.defaultProps = {
    patternType: "cross",
    patternColor: "#0540E3",
    backgroundColor: "transparent",
    patternSize: 40,
    patternOpacity: 0.4,
    strokeWidth: 3,
    dotSize: 1.2,
    gap: 15,
    fade: true,
    fadeIntensity: 90,
    fadeShape: "circle",
} as Partial<BackgroundPatternProps>

/**
 * Property Controls define the UI in Framer's properties panel
 * Organized into logical groups for better UX
 */
addPropertyControls(BackgroundPattern, {
    // Pattern type selection
    patternType: {
        type: ControlType.Enum,
        title: "Pattern Type",
        options: [
            "cross",
            "grid",
            "dots",
            "plus",
            "zigzag",
            "waves",
            "triangles",
            "hexagons",
            "bricks",
            "diagonalGrid",
            "diagonal",
            "diagonalDots",
            "diamonds",
            "circles",
            "overlapping",
            "signal",
            "architect",
            "stars",
            "xo",
            "texture",
            "checkerboard",
            "hideout",
        ],
        optionTitles: [
            "Cross",
            "Grid",
            "Dots",
            "Plus",
            "Zigzag",
            "Waves",
            "Triangles",
            "Hexagons",
            "Bricks",
            "Diagonal Grid",
            "Diagonal",
            "Diagonal Dots",
            "Diamonds",
            "Circles",
            "Overlapping",
            "Signal",
            "Architect",
            "Stars",
            "X & O",
            "Texture",
            "Checkerboard",
            "Hideout",
        ],
        defaultValue: "cross",
        displaySegmentedControl: false,
    },

    // Pattern appearance controls
    patternColor: {
        type: ControlType.Color,
        title: "Pattern Color",
        defaultValue: "#0540E3",
    },
    patternOpacity: {
        type: ControlType.Number,
        title: "Pattern Opacity",
        defaultValue: 0.4,
        min: 0,
        max: 1,
        step: 0.05,
        displayStepper: true,
    },
    patternSize: {
        type: ControlType.Number,
        title: "Pattern Size",
        defaultValue: 40,
        min: 10,
        max: 200,
        step: 5,
        unit: "px",
        displayStepper: true,
        description: "Controls the overall size of the pattern",
    },

    // Stroke width control for Grid, Diagonal Grid, and Diagonal patterns
    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke Width",
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 0.5,
        unit: "px",
        displayStepper: true,
        hidden: (props) =>
            props.patternType !== "grid" &&
            props.patternType !== "diagonalGrid" &&
            props.patternType !== "diagonal" &&
            props.patternType !== "diagonalDots" &&
            props.patternType !== "overlapping",
        description: "Controls the thickness of lines",
    },

    // Dots-specific controls
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        defaultValue: 1.2,
        min: 0.5,
        max: 10,
        step: 0.1,
        unit: "px",
        displayStepper: true,
        hidden: (props) => props.patternType !== "dots",
        description: "Controls the radius of each dot",
    },
    gap: {
        type: ControlType.Number,
        title: "Dot Gap",
        defaultValue: 15,
        min: 5,
        max: 50,
        step: 1,
        unit: "px",
        displayStepper: true,
        hidden: (props) => props.patternType !== "dots",
        description: "Controls spacing between dots",
    },

    // Background controls
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "transparent",
    },

    // Fade effect controls
    fade: {
        type: ControlType.Boolean,
        title: "Fade Effect",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Made with ❤️ by [Soyeb](https://framer.link/MBYIDPK)",
    },
    fadeShape: {
        type: ControlType.Enum,
        title: "Fade Shape",
        options: ["circle", "ellipse"],
        optionTitles: ["Circle", "Ellipse"],
        defaultValue: "circle",
        displaySegmentedControl: true,
        hidden: (props) => props.fade === false,
    },
    fadeIntensity: {
        type: ControlType.Number,
        title: "Fade Intensity",
        defaultValue: 90,
        min: 50,
        max: 100,
        step: 5,
        unit: "%",
        displayStepper: true,
        hidden: (props) => props.fade === false,
        description: "Controls how far the fade extends from center.",
    },
})
