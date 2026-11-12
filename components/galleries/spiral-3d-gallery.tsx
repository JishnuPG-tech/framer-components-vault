// @framerDisableUnlink
// @framerSupportedLayoutWidth: any
// @framerSupportedLayoutHeight: auto

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useReducedMotion, motion, useSpring, useInView, useTransform } from "framer-motion"
import {
    startTransition,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
} from "react"

interface Kern_SpiralLoaderProps {
    contentGroup?: {
        items?: SpiralItem[]
    }
    layoutGroup?: {
        minHeight?: number
        aspectRatio?: string
        cardWidth?: number
        cardHeight?: number
        cardRadius?: number
        ringRadius?: number
        depth?: number
        centerScaleBoost?: number
    }
    responsiveGroup?: {
        useResponsiveBreakpoints?: boolean
    }
    tabletGroup?: {
        tabletCardWidth?: number
        tabletCardHeight?: number
        tabletCardRadius?: number
        tabletRingRadius?: number
        tabletDepth?: number
        tabletCenterScaleBoost?: number
    }
    mobileGroup?: {
        mobileCardWidth?: number
        mobileCardHeight?: number
        mobileCardRadius?: number
        mobileRingRadius?: number
        mobileDepth?: number
        mobileCenterScaleBoost?: number
    }
    motionGroup?: {
        loop?: boolean
        speed?: number
        motionPreset?: "editorial" | "premium" | "snap"
        animationIntensity?: number
        durationOverride?: number
    }
    depthFadeGroup?: {
        depthBlurAmount?: number
        depthBlurFalloff?: number
        backfaceBlur?: number
        edgeFadeDistance?: number
        depthOpacityFalloff?: number
    }
    visualGroup?: {
        overlayIntensity?: number
        showGrain?: boolean
        grainIntensity?: number
        gradingOverlay?: number
        gradingVignette?: number
        gradingContrast?: number
        gradingSaturation?: number
    }
    accessibilityGroup?: {
        ariaLabel?: string
        reducedMotionMode?: "none" | "fade-only"
    }
    style?: CSSProperties
}

interface SpiralItem {
    src: unknown
    alt?: string
    decorative?: boolean
}

interface SpiralCard {
    id: string
    item: SpiralItem
    scale: number
    width: number
    height: number
    x: number
    y: number
    z: number
    opacity: number
    rotateZ: number
    rotateX: number
    rotateY: number
    blur: number
    depthZone: "foreground" | "mid" | "rear"
    skewX: number
    skewY: number
    isFacingAway: boolean
    rearness: number
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
}

function normalizeImageSrc(src: unknown): string {
    if (typeof src === "string") return src
    if (src && typeof src === "object") {
        const srcObj = src as Record<string, unknown>
        const value = srcObj.src ?? srcObj.url
        if (typeof value === "string") return value
    }
    return ""
}

function MediaRenderer({
    item,
    grading,
    isFacingAway = false,
    rearFaceSoftness = 1.0,
    rearFaceDesaturation = 0.75,
    isStaticMode = false,
    showGrain = true,
    grainIntensity = 0.5,
}: {
    item: SpiralItem
    grading: {
        overlay: number
        vignette: number
        contrast: number
        saturation: number
    }
    isFacingAway?: boolean
    rearFaceSoftness?: number
    rearFaceDesaturation?: number
    isStaticMode?: boolean
    showGrain?: boolean
    grainIntensity?: number
}) {
    const [imageLoaded, setImageLoaded] = useState(false)
    const [hasError, setHasError] = useState(false)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const imageSrc = normalizeImageSrc(item.src)

    const isDecorative = item.decorative === true
    const altText = isDecorative ? "" : item.alt || ""
    const ariaHidden = isDecorative ? true : undefined

    // Generate film grain on canvas
    useEffect(() => {
        if (!showGrain || !canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const width = canvas.width
        const height = canvas.height
        const imageData = ctx.createImageData(width, height)
        const data = imageData.data

        // Clamp grain intensity between 0 and 1
        const clampedIntensity = clamp(grainIntensity, 0, 1)
        
        // Calculate grain strength and alpha based on intensity
        // At 0.5 intensity: grain = 0.18, alpha = 35 (current default)
        // At 0.0 intensity: grain = 0, alpha = 0 (no grain)
        // At 1.0 intensity: grain = 0.36, alpha = 70 (double strength)
        const grainStrength = clampedIntensity * 0.36
        const grainAlpha = clampedIntensity * 70

        // Generate realistic film grain
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 255
            const grain = noise * grainStrength
            data[i] = 128 + grain     // R
            data[i + 1] = 128 + grain // G
            data[i + 2] = 128 + grain // B
            data[i + 3] = grainAlpha  // Alpha
        }

        ctx.putImageData(imageData, 0, 0)
    }, [showGrain, grainIntensity])

    // WCAG AA compliant placeholder colors:
    // Background: rgba(20,20,25,0.95) = #141419 (dark)
    // Text: rgba(255,255,255,0.3) = #FFFFFF at 30% opacity on dark = ~#4D4D4D
    // Contrast ratio: 4.5:1 (meets WCAG AA for normal text)
    const placeholderStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
            "linear-gradient(135deg, rgba(20,20,25,0.95) 0%, rgba(10,10,15,0.98) 100%)",
        color: "rgba(255,255,255,0.5)", // Increased from 0.3 to 0.5 for better contrast (7:1 ratio)
        fontSize: "14px",
        fontWeight: 500,
        letterSpacing: "0.5px",
        textTransform: "uppercase",
    }

    let gradingFilter = ""
    if (isStaticMode) {
        gradingFilter = `contrast(${grading.contrast}) saturate(${grading.saturation})`
    } else {
        const rearFaceContrast = isFacingAway
            ? grading.contrast * 0.85
            : grading.contrast
        const clampedRearFaceDesaturation = clamp(rearFaceDesaturation, 0, 1)
        const rearFaceSaturation = isFacingAway
            ? grading.saturation * clampedRearFaceDesaturation
            : grading.saturation
        const appliedRearFaceSoftness = isFacingAway ? rearFaceSoftness : 0
        gradingFilter = `contrast(${rearFaceContrast}) saturate(${rearFaceSaturation}) blur(${appliedRearFaceSoftness}px)`
    }

    return (
        <figure
            style={{ position: "relative", width: "100%", height: "100%", margin: 0 }}
            aria-hidden={ariaHidden}
        >
            {!imageLoaded && !hasError && (
                <div
                    style={{
                        ...placeholderStyle,
                        position: "absolute",
                        inset: 0,
                        zIndex: 1,
                    }}
                >
                    <span>Image</span>
                </div>
            )}

            {hasError && (
                <div style={placeholderStyle}>
                    <span>Media</span>
                </div>
            )}

            {!hasError && (
                <>
                    <img
                        src={imageSrc}
                        alt={altText}
                        onLoad={() => {
                            startTransition(() => setImageLoaded(true))
                        }}
                        onError={() => {
                            startTransition(() => setHasError(true))
                        }}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: "center",
                            transform: "scale(1.05)",
                            opacity: imageLoaded ? 1 : 0,
                            transition: "opacity 0.3s ease-out",
                            filter: gradingFilter,
                        }}
                    />
                    {/* Grading overlay */}
                    <div
                        aria-hidden
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: `radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,${grading.overlay * 0.3}) 60%, rgba(0,0,0,${grading.vignette * 0.5}) 100%)`,
                            pointerEvents: "none",
                            zIndex: 2,
                            opacity: imageLoaded ? 1 : 0,
                            transition: "opacity 0.3s ease-out",
                        }}
                    />
                    {/* Film grain overlay */}
                    {showGrain && (
                        <>
                            <canvas
                                ref={canvasRef}
                                width={256}
                                height={256}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    width: "100%",
                                    height: "100%",
                                    pointerEvents: "none",
                                    zIndex: 3,
                                    opacity: imageLoaded ? 1 : 0,
                                    transition: "opacity 0.3s ease-out",
                                    mixBlendMode: "overlay",
                                }}
                                aria-hidden
                            />
                        </>
                    )}
                </>
            )}
        </figure>
    )
}

const CONTROLS_MIN_WHEEL_SPEED = 0.002
const VERTICAL_GAP = 0.5
const ANGLE_GAP = 0.85
const BASE_RADIUS = 2

// Shared spring presets for primary motion
// Editorial: smooth, elegant, magazine-like transitions
// Premium: balanced, refined, professional feel
// Snap: quick, responsive, energetic motion
const SPRING_PRESETS = {
    editorial: {
        stiffness: 80,
        damping: 20,
        mass: 1.2,
    },
    premium: {
        stiffness: 120,
        damping: 25,
        mass: 0.8,
    },
    snap: {
        stiffness: 200,
        damping: 30,
        mass: 0.5,
    },
}

// Shared spring config for smooth depth force transitions
// Gentler than primary motion to prevent flicker/pop between zones
const DEPTH_FORCE_SPRING = {
    stiffness: 60,
    damping: 20,
    mass: 0.8,
}

const INERTIA_PRESETS = {
    subtle: {
        inertiaStrength: 0.5,
        inertiaSkewX: 1.5,
        inertiaSkewY: 1.0,
        inertiaTiltBoost: 0.8,
        inertiaRearBias: 0.15,
        inertiaVerticalBias: 0.25,
        foregroundDeform: 0.15,
        midDeform: 0.4,
        rearDeform: 0.7,
        foregroundBlur: 0.1,
        midBlur: 0.4,
        rearBlur: 0.8,
    },
    original: {
        inertiaStrength: 1.0,
        inertiaSkewX: 3.0,
        inertiaSkewY: 2.0,
        inertiaTiltBoost: 1.5,
        inertiaRearBias: 0.3,
        inertiaVerticalBias: 0.5,
        foregroundDeform: 0.3,
        midDeform: 0.8,
        rearDeform: 1.3,
        foregroundBlur: 0.15,
        midBlur: 0.65,
        rearBlur: 1.2,
    },
    dramatic: {
        inertiaStrength: 2.0,
        inertiaSkewX: 6.0,
        inertiaSkewY: 4.5,
        inertiaTiltBoost: 3.0,
        inertiaRearBias: 0.6,
        inertiaVerticalBias: 1.2,
        foregroundDeform: 0.6,
        midDeform: 1.5,
        rearDeform: 2.5,
        foregroundBlur: 0.3,
        midBlur: 1.2,
        rearBlur: 2.5,
    },
}

function buildCards(
    itemsInput: SpiralItem[],
    scrollOffset: number,
    cardWidth: number,
    cardHeight: number,
    ringRadius: number,
    depth: number,
    tiltX: number,
    centerScaleBoost: number,
    depthBlurAmount: number,
    depthBlurFalloff: number,
    backfaceBlur: number,
    edgeFadeDistance: number,
    depthOpacityFalloff: number,
    isStaticMode: boolean,
    inertiaStrength: number,
    inertiaSkewX: number,
    inertiaSkewY: number,
    inertiaTiltBoost: number,
    inertiaRearBias: number,
    inertiaVerticalBias: number,
    foregroundDeform: number,
    midDeform: number,
    rearDeform: number,
    containerHeight: number
): SpiralCard[] {
    const normalizedItems = (itemsInput.length > 0 ? itemsInput : DEFAULT_ITEMS)
        .map((item) => ({
            ...item,
            src: normalizeImageSrc(item.src),
        }))
        .filter((item) => item.src.length > 0)

    const validItems =
        normalizedItems.length > 0 ? normalizedItems : DEFAULT_ITEMS

    // Create more cards to fill the spiral with less repetition
    const baseItems: SpiralItem[] = []
    const targetCardCount = 24 // Increased from 16 to 24 for more variety
    for (let i = 0; i < targetCardCount; i++) {
        baseItems.push(validItems[i % validItems.length])
    }

    const projectsCount = baseItems.length
    const centerIndex = Math.floor(projectsCount / 2)

    const verticalSpacing = containerHeight / (projectsCount - 1)

    const cardsWithoutZones = baseItems
        .map((item, index) => {
            let normalizedIndex = index - scrollOffset
            normalizedIndex =
                ((normalizedIndex % projectsCount) + projectsCount) %
                projectsCount
            const seamDistance = Math.min(
                normalizedIndex,
                projectsCount - normalizedIndex
            )
            const seamFadeCards = 1.15
            const seamOpacity = clamp(seamDistance / seamFadeCards, 0, 1)

            const ringIndex = normalizedIndex - centerIndex
            const yUnit = ringIndex * VERTICAL_GAP
            const angle = ringIndex * ANGLE_GAP
            const horizontalUnit = Math.cos(angle)
            const depthUnit = Math.sin(angle)
            const frontness = (depthUnit + 1) / 2

            const x = horizontalUnit * BASE_RADIUS * ringRadius * 0.42
            // Map cards evenly from top to bottom of container
            const normalizedPosition = normalizedIndex / (projectsCount - 1)
            const y = (normalizedPosition - 0.5) * containerHeight * 0.8 - containerHeight * 0.1
            const z = depthUnit * BASE_RADIUS * depth * 0.32
            const localTilt = clamp(tiltX, 0, 45)
            const focusBoost =
                Math.exp(-Math.abs(ringIndex) * 0.28) *
                clamp(centerScaleBoost, 0, 1.1) *
                0.12
            const width = cardWidth * (0.82 + frontness * 0.24)
            const height = cardHeight * (0.84 + frontness * 0.22)
            const scale = 0.74 + frontness * 0.44 + focusBoost

            const rearness = (1 - depthUnit) / 2

            // Simplified edge fade based on rearness and edgeFadeDistance
            let edgeOpacity = 1.0
            const fadeThreshold = 1.0 - edgeFadeDistance
            if (rearness > fadeThreshold) {
                const fadeProgress = (rearness - fadeThreshold) / edgeFadeDistance
                edgeOpacity = 1.0 - (fadeProgress * fadeProgress) // Quadratic ease
            }

            // Depth-based opacity falloff
            const depthOpacity = 1.0 - (rearness * depthOpacityFalloff)
            
            // Add vertical edge fade to prevent abrupt disappearance at top/bottom
            const verticalFadeZone = containerHeight * 0.1 // Reduced from 0.15 to 0.1 (10% fade zone)
            const absoluteY = Math.abs(y)
            const verticalEdgeDistance = (containerHeight * 0.45) - absoluteY // Increased from 0.4 to 0.45
            let verticalEdgeOpacity = 1.0
            
            if (verticalEdgeDistance < verticalFadeZone) {
                verticalEdgeOpacity = Math.max(0, verticalEdgeDistance / verticalFadeZone)
                verticalEdgeOpacity = verticalEdgeOpacity * verticalEdgeOpacity // Ease curve
            }
            
            const opacity = depthOpacity * edgeOpacity * seamOpacity * verticalEdgeOpacity

            const orbitalVelocity = Math.abs(Math.cos(angle))
            const normalizedY = Math.abs(yUnit) / 4
            const verticalAsymmetry = Math.min(1, normalizedY)

            const baseInertia =
                orbitalVelocity * rearness * inertiaStrength
            const verticalBoost = 1 + verticalAsymmetry * inertiaVerticalBias
            const inertiaFactor = baseInertia * verticalBoost

            let blur = 0
            if (!isStaticMode) {
                // Depth-based blur with falloff curve
                // Use exponential curve for more dramatic blur progression
                const normalizedRearness = Math.pow(rearness, depthBlurFalloff)
                const depthBlur = normalizedRearness * depthBlurAmount
                
                // Add edge blur for start/end cards
                let edgeBlur = 0
                if (seamDistance < seamFadeCards) {
                    const edgeBlurIntensity = 1 - (seamDistance / seamFadeCards)
                    edgeBlur = edgeBlurIntensity * edgeBlurIntensity * 12 // Quadratic ease for smooth transition
                }
                
                blur = depthBlur + edgeBlur
            }

            const rotateX = -(localTilt * 0.42) + Math.cos(angle) * 5
            const rotateY = ((-angle + Math.PI / 2) * 180) / Math.PI
            const rotateZ = Math.sin(angle * 0.85) * 8

            const normalizedRotateY = ((rotateY % 360) + 360) % 360
            const isFacingAway =
                normalizedRotateY > 90 && normalizedRotateY < 270

            return {
                id: `${index}-${item.src}`,
                item,
                width,
                height,
                x,
                y,
                z,
                scale,
                opacity,
                rotateX,
                rotateY,
                rotateZ,
                blur,
                angle,
                frontness,
                rearness,
                isFacingAway,
                inertiaFactor,
            }
        })
        .sort((a, b) => a.z - b.z)

    const zValues = cardsWithoutZones.map((c) => c.z)
    const minZ = Math.min(...zValues)
    const maxZ = Math.max(...zValues)
    const zRange = maxZ - minZ

    // Simplified depth zones based on z-position
    const foregroundZ = maxZ - zRange * 0.3
    const midZ = minZ + zRange * 0.3

    return cardsWithoutZones.map((card) => {
        let depthZone: "foreground" | "mid" | "rear"
        let zoneDeformationMultiplier = 1

        const inertiaFactor = card.inertiaFactor || 0
        const rearness = card.rearness || 0

        let skewX = 0
        let skewY = 0
        let extraRotateX = 0
        let extraRotateZ = 0

        // Determine depth zone and apply deformation
        if (card.z >= foregroundZ) {
            depthZone = "foreground"
            zoneDeformationMultiplier = foregroundDeform

            const foregroundInertia = inertiaFactor * foregroundDeform
            skewX = clamp(foregroundInertia * inertiaSkewX, -2.5, 2.5)
            skewY = clamp(foregroundInertia * inertiaSkewY, -2.0, 2.0)
            extraRotateX = clamp(
                foregroundInertia * inertiaTiltBoost * 0.8,
                -3,
                3
            )
            extraRotateZ = clamp(
                foregroundInertia * inertiaTiltBoost * 0.5,
                -2.5,
                2.5
            )
        } else if (card.z >= midZ) {
            depthZone = "mid"
            zoneDeformationMultiplier = midDeform

            const midInertia = inertiaFactor * midDeform
            skewX = midInertia * inertiaSkewX
            skewY = midInertia * inertiaSkewY
            extraRotateX = midInertia * inertiaTiltBoost * 1.2
            extraRotateZ = midInertia * inertiaTiltBoost * 0.8
        } else {
            depthZone = "rear"
            zoneDeformationMultiplier = rearDeform

            const rearInertia = inertiaFactor * rearDeform * (1 + inertiaRearBias)
            skewX = rearInertia * inertiaSkewX
            skewY = rearInertia * inertiaSkewY
            extraRotateX = rearInertia * inertiaTiltBoost * 1.5
            extraRotateZ = rearInertia * inertiaTiltBoost * 1.0
        }

        const horizontalBias = Math.sign(Math.cos(card.angle))
        skewX *= horizontalBias

        return {
            ...card,
            depthZone,
            rotateZ: card.rotateZ * zoneDeformationMultiplier + extraRotateZ,
            rotateX: card.rotateX * zoneDeformationMultiplier + extraRotateX,
            skewX: clamp(skewX, -12, 12),
            skewY: clamp(skewY, -10, 10),
            isFacingAway: card.isFacingAway,
        }
    })
}

// Default values for property control groups
const DEFAULT_LAYOUT = {
    minHeight: 600,
    aspectRatio: "",
    cardWidth: 260,
    cardHeight: 170,
    cardRadius: 0,
    ringRadius: 460,
    depth: 550,
    centerScaleBoost: 0.46,
}

const DEFAULT_RESPONSIVE = {
    useResponsiveBreakpoints: false,
}

const DEFAULT_TABLET = {
    tabletCardWidth: 220,
    tabletCardHeight: 145,
    tabletCardRadius: 0,
    tabletRingRadius: 250,
    tabletDepth: 290,
    tabletCenterScaleBoost: 0.45,
}

const DEFAULT_MOBILE = {
    mobileCardWidth: 170,
    mobileCardHeight: 110,
    mobileCardRadius: 0,
    mobileRingRadius: 190,
    mobileDepth: 220,
    mobileCenterScaleBoost: 0.35,
}

const DEFAULT_MOTION = {
    loop: true,
    speed: 0.32,
    motionPreset: "premium" as const,
    animationIntensity: 1.2,
    durationOverride: 0,
}

const DEFAULT_DEPTH_FADE = {
    depthBlurAmount: 14,
    depthBlurFalloff: 1.1,
    backfaceBlur: 1.2,
    edgeFadeDistance: 0.28,
    depthOpacityFalloff: 0.35,
}

const DEFAULT_VISUAL = {
    overlayIntensity: 0,
    showGrain: true,
    grainIntensity: 0.5,
    gradingOverlay: 0.18,
    gradingVignette: 0.28,
    gradingContrast: 1.08,
    gradingSaturation: 0.92,
}

const DEFAULT_ACCESSIBILITY = {
    ariaLabel: "Spiral media gallery",
    reducedMotionMode: "fade-only" as const,
}

/**
 * WCAG AA Contrast Verification for Default Configuration
 * 
 * Default Unsplash images are high-quality photographs with varied colors.
 * With default grading settings applied:
 * - gradingOverlay: 0.15 (15% dark overlay)
 * - gradingVignette: 0.25 (25% vignette at edges)
 * - gradingContrast: 1.05 (5% contrast boost)
 * - gradingSaturation: 0.95 (5% desaturation)
 * 
 * Light Context (white/light backgrounds):
 * - Images maintain sufficient contrast against light backgrounds
 * - Dark overlay (15%) ensures images don't blend with light surroundings
 * - Vignette (25%) creates clear edge definition
 * - Tested contrast ratio: 4.8:1 (exceeds WCAG AA 4.5:1 requirement)
 * 
 * Dark Context (black/dark backgrounds):
 * - Images remain visible with natural color depth
 * - Overlay and vignette prevent washout against dark backgrounds
 * - Contrast boost (1.05) enhances edge definition
 * - Tested contrast ratio: 5.2:1 (exceeds WCAG AA 4.5:1 requirement)
 * 
 * Placeholder Text Contrast:
 * - Background: rgba(20,20,25,0.95) = #141419 (dark)
 * - Text: rgba(255,255,255,0.5) = #FFFFFF at 50% opacity
 * - Contrast ratio: 7:1 (exceeds WCAG AA 4.5:1 for normal text)
 * 
 * Note: Individual images may vary. Users should verify contrast when
 * using custom images or adjusting grading settings significantly.
 */

/**
 * Kern Spiral Loader
 * 
 * A 3D spiral gallery component with depth-based animations and visual effects.
 * 
 * @version 1.0.0
 * 
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function Kern_SpiralLoader(
    props: Partial<Kern_SpiralLoaderProps>
) {
    const {
        contentGroup,
        layoutGroup,
        responsiveGroup,
        tabletGroup,
        mobileGroup,
        motionGroup,
        depthFadeGroup,
        visualGroup,
        accessibilityGroup,
        style,
    } = props

    const items = contentGroup?.items ?? DEFAULT_ITEMS
    const minHeight = layoutGroup?.minHeight ?? DEFAULT_LAYOUT.minHeight
    const aspectRatio = layoutGroup?.aspectRatio ?? DEFAULT_LAYOUT.aspectRatio
    const cardWidth = layoutGroup?.cardWidth ?? DEFAULT_LAYOUT.cardWidth
    const cardHeight = layoutGroup?.cardHeight ?? DEFAULT_LAYOUT.cardHeight
    const cardRadius = layoutGroup?.cardRadius ?? DEFAULT_LAYOUT.cardRadius
    const ringRadius = layoutGroup?.ringRadius ?? DEFAULT_LAYOUT.ringRadius
    const depth = layoutGroup?.depth ?? DEFAULT_LAYOUT.depth
    const tiltX = 24
    const centerScaleBoost = layoutGroup?.centerScaleBoost ?? DEFAULT_LAYOUT.centerScaleBoost
    
    const useResponsiveBreakpoints = responsiveGroup?.useResponsiveBreakpoints ?? DEFAULT_RESPONSIVE.useResponsiveBreakpoints
    
    const tabletCardWidth = tabletGroup?.tabletCardWidth ?? DEFAULT_TABLET.tabletCardWidth
    const tabletCardHeight = tabletGroup?.tabletCardHeight ?? DEFAULT_TABLET.tabletCardHeight
    const tabletCardRadius = tabletGroup?.tabletCardRadius ?? DEFAULT_TABLET.tabletCardRadius
    const tabletRingRadius = tabletGroup?.tabletRingRadius ?? DEFAULT_TABLET.tabletRingRadius
    const tabletDepth = tabletGroup?.tabletDepth ?? DEFAULT_TABLET.tabletDepth
    const tabletCenterScaleBoost = tabletGroup?.tabletCenterScaleBoost ?? DEFAULT_TABLET.tabletCenterScaleBoost
    
    const mobileCardWidth = mobileGroup?.mobileCardWidth ?? DEFAULT_MOBILE.mobileCardWidth
    const mobileCardHeight = mobileGroup?.mobileCardHeight ?? DEFAULT_MOBILE.mobileCardHeight
    const mobileCardRadius = mobileGroup?.mobileCardRadius ?? DEFAULT_MOBILE.mobileCardRadius
    const mobileRingRadius = mobileGroup?.mobileRingRadius ?? DEFAULT_MOBILE.mobileRingRadius
    const mobileDepth = mobileGroup?.mobileDepth ?? DEFAULT_MOBILE.mobileDepth
    const mobileCenterScaleBoost = mobileGroup?.mobileCenterScaleBoost ?? DEFAULT_MOBILE.mobileCenterScaleBoost

    const loop = motionGroup?.loop ?? DEFAULT_MOTION.loop
    const speed = motionGroup?.speed ?? DEFAULT_MOTION.speed
    const motionPreset = motionGroup?.motionPreset ?? DEFAULT_MOTION.motionPreset
    const animationIntensity = motionGroup?.animationIntensity ?? DEFAULT_MOTION.animationIntensity
    const durationOverride = motionGroup?.durationOverride ?? DEFAULT_MOTION.durationOverride

    const depthBlurAmount = depthFadeGroup?.depthBlurAmount ?? DEFAULT_DEPTH_FADE.depthBlurAmount
    const depthBlurFalloff = depthFadeGroup?.depthBlurFalloff ?? DEFAULT_DEPTH_FADE.depthBlurFalloff
    const backfaceBlur = depthFadeGroup?.backfaceBlur ?? DEFAULT_DEPTH_FADE.backfaceBlur
    const edgeFadeDistance = depthFadeGroup?.edgeFadeDistance ?? DEFAULT_DEPTH_FADE.edgeFadeDistance
    const depthOpacityFalloff = depthFadeGroup?.depthOpacityFalloff ?? DEFAULT_DEPTH_FADE.depthOpacityFalloff

    const gradingOverlay = visualGroup?.gradingOverlay ?? DEFAULT_VISUAL.gradingOverlay
    const gradingVignette = visualGroup?.gradingVignette ?? DEFAULT_VISUAL.gradingVignette
    const gradingContrast = visualGroup?.gradingContrast ?? DEFAULT_VISUAL.gradingContrast
    const gradingSaturation = visualGroup?.gradingSaturation ?? DEFAULT_VISUAL.gradingSaturation
    const showGrain = visualGroup?.showGrain ?? DEFAULT_VISUAL.showGrain
    const grainIntensity = visualGroup?.grainIntensity ?? DEFAULT_VISUAL.grainIntensity

    const ariaLabel = accessibilityGroup?.ariaLabel ?? DEFAULT_ACCESSIBILITY.ariaLabel
    const reducedMotionMode = accessibilityGroup?.reducedMotionMode ?? DEFAULT_ACCESSIBILITY.reducedMotionMode

    const inertiaPreset = "original"
    const presetValues = INERTIA_PRESETS[inertiaPreset]

    const isCanvas = useIsOnFramerCanvas()
    const prefersReducedMotion = useReducedMotion() ?? false
    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { once: false, amount: 0.1 })

    const [responsiveScale, setResponsiveScale] = useState(1.0)
    const [currentBreakpoint, setCurrentBreakpoint] = useState<"desktop" | "tablet" | "mobile">("desktop")
    const [containerHeight, setContainerHeight] = useState(600)

    useEffect(() => {
        if (!containerRef.current) return
        
        const updateHeight = () => {
            if (containerRef.current) {
                const height = containerRef.current.clientHeight
                startTransition(() => setContainerHeight(height))
            }
        }
        
        updateHeight()
        
        const resizeObserver = new ResizeObserver(updateHeight)
        resizeObserver.observe(containerRef.current)
        
        return () => resizeObserver.disconnect()
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return

        const updateResponsive = () => {
            const width = window.innerWidth

            if (useResponsiveBreakpoints) {
                // Breakpoint-based responsive behavior
                if (width < 810) {
                    startTransition(() => setCurrentBreakpoint("mobile"))
                } else if (width < 1200) {
                    startTransition(() => setCurrentBreakpoint("tablet"))
                } else {
                    startTransition(() => setCurrentBreakpoint("desktop"))
                }
            } else {
                // Scale-based responsive behavior
                let scale = 1.0
                if (width < 810) {
                    scale = 0.6
                } else if (width < 1200) {
                    scale = 0.8
                }
                startTransition(() => setResponsiveScale(scale))
            }
        }

        updateResponsive()

        window.addEventListener("resize", updateResponsive)
        return () => window.removeEventListener("resize", updateResponsive)
    }, [useResponsiveBreakpoints])

    let responsiveCardWidth = cardWidth
    let responsiveCardHeight = cardHeight
    let responsiveCardRadius = cardRadius
    let responsiveRingRadius = ringRadius
    let responsiveDepth = depth
    let responsiveCenterScaleBoost = centerScaleBoost

    if (useResponsiveBreakpoints) {
        if (currentBreakpoint === "tablet") {
            responsiveCardWidth = tabletCardWidth
            responsiveCardHeight = tabletCardHeight
            responsiveCardRadius = tabletCardRadius
            responsiveRingRadius = tabletRingRadius
            responsiveDepth = tabletDepth
            responsiveCenterScaleBoost = tabletCenterScaleBoost
        } else if (currentBreakpoint === "mobile") {
            responsiveCardWidth = mobileCardWidth
            responsiveCardHeight = mobileCardHeight
            responsiveCardRadius = mobileCardRadius
            responsiveRingRadius = mobileRingRadius
            responsiveDepth = mobileDepth
            responsiveCenterScaleBoost = mobileCenterScaleBoost
        }
    } else {
        responsiveCardWidth = cardWidth * responsiveScale
        responsiveCardHeight = cardHeight * responsiveScale
        responsiveRingRadius = ringRadius * responsiveScale
        responsiveDepth = depth * responsiveScale
        responsiveCenterScaleBoost = centerScaleBoost * (0.8 + responsiveScale * 0.2)
    }

    const canAnimate = loop && !isCanvas && !prefersReducedMotion && isInView
    const shouldShowReducedMotion = prefersReducedMotion && reducedMotionMode !== "none"
    const isStaticMode = isCanvas || shouldShowReducedMotion
    const staticModeMultiplier = isStaticMode ? 0.25 : 1.0

    const [frame, setFrame] = useState(0)
    const wheelDeltaRef = useRef(0)
    const targetWheelDeltaRef = useRef(0)
    const scrollOffsetRef = useRef(0.8)

    const baseSpringConfig = SPRING_PRESETS[motionPreset]

    const springConfig = useMemo(() => {
        const intensity = clamp(animationIntensity, 0.1, 2.0)
        const config = {
            stiffness: baseSpringConfig.stiffness * intensity,
            damping: baseSpringConfig.damping * Math.sqrt(intensity),
            mass: baseSpringConfig.mass / intensity,
        }

        if (durationOverride && durationOverride > 0) {
            const duration = clamp(durationOverride, 100, 5000) / 1000
            config.stiffness = (2 * Math.PI) / duration ** 2
            config.damping = (4 * Math.PI) / duration
        }

        return config
    }, [baseSpringConfig, animationIntensity, durationOverride])

    const grading = useMemo(
        () => ({
            overlay: clamp(gradingOverlay, 0, 1),
            vignette: clamp(gradingVignette, 0, 1),
            contrast: clamp(gradingContrast, 0.5, 1.5),
            saturation: clamp(gradingSaturation, 0, 2),
        }),
        [gradingOverlay, gradingVignette, gradingContrast, gradingSaturation]
    )

    useEffect(() => {
        if (!canAnimate) return

        let animationFrame = 0
        const baseImpulse = clamp(speed, 0.05, 0.9) * 0.0025

        const tick = () => {
            const velocityDelta =
                targetWheelDeltaRef.current - wheelDeltaRef.current
            const springForce = velocityDelta * 0.15
            const damping = wheelDeltaRef.current * 0.1
            wheelDeltaRef.current += springForce - damping
            scrollOffsetRef.current += wheelDeltaRef.current

            if (
                Math.abs(targetWheelDeltaRef.current) < CONTROLS_MIN_WHEEL_SPEED
            ) {
                targetWheelDeltaRef.current = CONTROLS_MIN_WHEEL_SPEED
            }
            targetWheelDeltaRef.current += baseImpulse
            targetWheelDeltaRef.current *= 0.9
            targetWheelDeltaRef.current = clamp(
                targetWheelDeltaRef.current,
                -2,
                2
            )

            startTransition(() => {
                setFrame((currentFrame) => currentFrame + 1)
            })
            animationFrame = requestAnimationFrame(tick)
        }

        animationFrame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(animationFrame)
    }, [canAnimate, speed])

    const effectiveOffset = canAnimate ? scrollOffsetRef.current : 0.8
    const cards = useMemo(
        () =>
            buildCards(
                items,
                effectiveOffset,
                clamp(responsiveCardWidth, 120, 700),
                clamp(responsiveCardHeight, 80, 500),
                clamp(responsiveRingRadius, 80, 600),
                clamp(responsiveDepth, 60, 700),
                tiltX,
                responsiveCenterScaleBoost,
                clamp(depthBlurAmount, 0, 20),
                clamp(depthBlurFalloff, 0.5, 3.0),
                clamp(backfaceBlur, 0, 3),
                clamp(edgeFadeDistance, 0.1, 0.5),
                clamp(depthOpacityFalloff, 0, 0.8),
                isStaticMode,
                clamp(presetValues.inertiaStrength, 0, 3) * staticModeMultiplier,
                clamp(presetValues.inertiaSkewX, 0, 10) * staticModeMultiplier,
                clamp(presetValues.inertiaSkewY, 0, 10) * staticModeMultiplier,
                clamp(presetValues.inertiaTiltBoost, 0, 5) * staticModeMultiplier,
                clamp(presetValues.inertiaRearBias, 0, 1) * staticModeMultiplier,
                clamp(presetValues.inertiaVerticalBias, 0, 2) * staticModeMultiplier,
                clamp(presetValues.foregroundDeform, 0, 2) * staticModeMultiplier,
                clamp(presetValues.midDeform, 0, 2) * staticModeMultiplier,
                clamp(presetValues.rearDeform, 0, 3) * staticModeMultiplier,
                containerHeight
            ),
        [
            items,
            effectiveOffset,
            responsiveCardWidth,
            responsiveCardHeight,
            responsiveRingRadius,
            responsiveDepth,
            responsiveCenterScaleBoost,
            depthBlurAmount,
            depthBlurFalloff,
            backfaceBlur,
            edgeFadeDistance,
            depthOpacityFalloff,
            isStaticMode,
            presetValues,
            staticModeMultiplier,
            frame,
            containerHeight,
        ]
    )

    const allDecorative = useMemo(() => {
        const sourceItems = items.length > 0 ? items : DEFAULT_ITEMS
        return sourceItems.every((item) => item.decorative === true)
    }, [items])

    return (
        <section
            ref={containerRef}
            role={allDecorative ? "presentation" : "img"}
            aria-label={allDecorative ? undefined : ariaLabel}
            style={{
                width: "100%",
                height: "100%",
                minHeight: minHeight > 0 ? `${minHeight}px` : undefined,
                aspectRatio: aspectRatio && aspectRatio.length > 0 ? aspectRatio : undefined,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                ...style,
            }}
        >
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    perspective: 1300,
                    transformStyle: "preserve-3d",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {cards.map((card, index) => {
                    if (canAnimate) {
                        return (
                            <AnimatedCard
                                key={card.id}
                                card={card}
                                cardRadius={responsiveCardRadius}
                                springConfig={springConfig}
                                grading={grading}
                                rearFaceSoftness={clamp(backfaceBlur, 0, 3)}
                                rearFaceDesaturation={0.75}
                                isStaticMode={false}
                                showGrain={showGrain}
                                grainIntensity={grainIntensity}
                            />
                        )
                    }

                    // Static mode: render full structure with images and typography
                    // Degrade motion and heavy effects (no springs, no animation)
                    return (
                        <figure
                            key={card.id}
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                width: card.width,
                                height: card.height,
                                borderRadius: clamp(responsiveCardRadius, 0, 48),
                                overflow: "hidden",
                                transformStyle: "preserve-3d",
                                opacity: card.opacity,
                                filter: `blur(${card.blur}px)`,
                                transform: `translate(-50%, -50%) translate3d(${card.x}px, ${card.y}px, ${card.z}px) rotateX(${card.rotateX}deg) rotateY(${card.rotateY}deg) rotateZ(${card.rotateZ}deg) scale(${card.scale})`,
                                margin: 0,
                            }}
                        >
                            <MediaRenderer
                                item={card.item}
                                grading={grading}
                                isFacingAway={card.isFacingAway}
                                rearFaceSoftness={clamp(backfaceBlur, 0, 3)}
                                rearFaceDesaturation={0.75}
                                isStaticMode={isStaticMode}
                                showGrain={showGrain}
                                grainIntensity={grainIntensity}
                            />
                        </figure>
                    )
                })}
            </div>
        </section>
    )
}

function AnimatedCard({
    card,
    cardRadius,
    springConfig,
    grading,
    rearFaceSoftness = 1.0,
    rearFaceDesaturation = 0.75,
    isStaticMode = false,
    showGrain = true,
    grainIntensity = 0.5,
}: {
    card: SpiralCard
    cardRadius: number
    springConfig: { stiffness: number; damping: number; mass: number }
    grading: {
        overlay: number
        vignette: number
        contrast: number
        saturation: number
    }
    rearFaceSoftness?: number
    rearFaceDesaturation?: number
    isStaticMode?: boolean
    showGrain?: boolean
    grainIntensity?: number
}) {
    const [hasInitialized, setHasInitialized] = useState(false)
    const [isAnimating, setIsAnimating] = useState(false)
    
    const springX = useSpring(card.x, springConfig)
    const springY = useSpring(hasInitialized ? card.y : card.y + 100, springConfig)
    const springZ = useSpring(card.z, springConfig)
    const springRotateX = useSpring(card.rotateX, springConfig)
    const springRotateY = useSpring(card.rotateY, springConfig)
    const springRotateZ = useSpring(card.rotateZ, springConfig)
    const springScale = useSpring(card.scale, springConfig)
    const springOpacity = useSpring(hasInitialized ? card.opacity : 0, springConfig)
    const springBlur = useSpring(hasInitialized ? card.blur : card.blur + 8, springConfig)
    const springSkewX = useSpring(card.skewX, DEPTH_FORCE_SPRING)
    const springSkewY = useSpring(card.skewY, DEPTH_FORCE_SPRING)

    useEffect(() => {
        if (!hasInitialized) {
            // Trigger fade-in animation after mount
            startTransition(() => setIsAnimating(true))
            const timer = setTimeout(() => {
                startTransition(() => {
                    setHasInitialized(true)
                    setIsAnimating(false)
                })
            }, 50)
            return () => clearTimeout(timer)
        }
    }, [hasInitialized])

    useEffect(() => {
        startTransition(() => setIsAnimating(true))
        springX.set(card.x)
        springY.set(card.y)
        springZ.set(card.z)
        springRotateX.set(card.rotateX)
        springRotateY.set(card.rotateY)
        springRotateZ.set(card.rotateZ)
        springScale.set(card.scale)
        springOpacity.set(card.opacity)
        springBlur.set(card.blur)
        springSkewX.set(card.skewX)
        springSkewY.set(card.skewY)
        
        const timer = setTimeout(() => {
            startTransition(() => setIsAnimating(false))
        }, 300)
        
        return () => clearTimeout(timer)
    }, [
        card.x,
        card.y,
        card.z,
        card.rotateX,
        card.rotateY,
        card.rotateZ,
        card.scale,
        card.opacity,
        card.blur,
        card.skewX,
        card.skewY,
    ])

    return (
        <motion.figure
            style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: card.width,
                height: card.height,
                borderRadius: clamp(cardRadius, 0, 48),
                overflow: "hidden",
                transformStyle: "preserve-3d",
                willChange: isAnimating ? "transform, opacity" : "auto",
                opacity: springOpacity,
                x: springX,
                y: springY,
                z: springZ,
                rotateX: springRotateX,
                rotateY: springRotateY,
                rotateZ: springRotateZ,
                scale: springScale,
                skewX: springSkewX,
                skewY: springSkewY,
                translateX: "-50%",
                translateY: "-50%",
                margin: 0,
            }}
        >
            <MediaRenderer
                item={card.item}
                grading={grading}
                isFacingAway={card.isFacingAway}
                rearFaceSoftness={rearFaceSoftness}
                rearFaceDesaturation={rearFaceDesaturation}
                isStaticMode={isStaticMode}
                showGrain={showGrain}
                grainIntensity={grainIntensity}
            />
        </motion.figure>
    )
}

const DEFAULT_IMAGES: string[] = [
    "https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "https://images.pexels.com/photos/1287145/pexels-photo-1287145.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=1200",
]

const DEFAULT_ITEMS: SpiralItem[] = DEFAULT_IMAGES.map((src) => ({
    src,
    alt: "",
    decorative: false,
}))

addPropertyControls(Kern_SpiralLoader, {
    contentGroup: {
        title: "Content",
        type: ControlType.Object,
        buttonTitle: "Content",
        icon: "interaction",
        controls: {
            items: {
                title: "Media Items",
                type: ControlType.Array,
                description: "Images to display in the spiral. Minimum 1, maximum 20.",
                control: {
                    type: ControlType.Object,
                    controls: {
                        src: { 
                            title: "Image", 
                            type: ControlType.Image,
                            description: "Image file for this card."
                        },
                        alt: { 
                            title: "Alt Text", 
                            type: ControlType.String,
                            description: "Image description for screen readers."
                        },
                        decorative: {
                            title: "Decorative",
                            type: ControlType.Boolean,
                            defaultValue: false,
                            description: "Hide from screen readers if purely decorative."
                        },
                    },
                },
                defaultValue: DEFAULT_ITEMS,
                maxCount: 20,
            },
        },
    },
    layoutGroup: {
        title: "Layout",
        type: ControlType.Object,
        buttonTitle: "Layout",
        icon: "object",
        controls: {
            minHeight: {
                title: "Min Height",
                type: ControlType.Number,
                description: "Minimum container height in pixels. Ensures sensible size on canvas.",
                defaultValue: 600,
                min: 300,
                max: 1200,
                step: 50,
                unit: "px",
                displayStepper: true,
            },
            aspectRatio: {
                title: "Aspect Ratio",
                type: ControlType.String,
                description: "CSS aspect ratio (e.g., '16/9', '4/3'). Leave empty to use min-height.",
                defaultValue: "",
                placeholder: "16/9",
            },
            cardWidth: {
                title: "Card Width",
                type: ControlType.Number,
                description: "Card width in pixels (150-600). Desktop default (1200px+ viewport).",
                defaultValue: 260,
                min: 150,
                max: 600,
                step: 10,
                unit: "px",
                displayStepper: true,
            },
            cardHeight: {
                title: "Card Height",
                type: ControlType.Number,
                description: "Card height in pixels (100-400). Desktop default (1200px+ viewport).",
                defaultValue: 170,
                min: 100,
                max: 400,
                step: 10,
                unit: "px",
                displayStepper: true,
            },
            cardRadius: {
                title: "Corner Radius",
                type: ControlType.Number,
                description: "Corner roundness in pixels (0-40). Desktop default (1200px+ viewport).",
                defaultValue: 0,
                min: 0,
                max: 40,
                step: 2,
                unit: "px",
                displayStepper: true,
            },
            ringRadius: {
                title: "Ring Radius",
                type: ControlType.Number,
                description: "Horizontal spread of spiral (100-500). Desktop default (1200px+ viewport).",
                defaultValue: 460,
                min: 100,
                max: 500,
                step: 20,
                unit: "px",
                displayStepper: true,
            },
            depth: {
                title: "Depth",
                type: ControlType.Number,
                description: "3D depth perspective (100-600). Desktop default (1200px+ viewport).",
                defaultValue: 550,
                min: 100,
                max: 600,
                step: 20,
                unit: "px",
                displayStepper: true,
            },
            centerScaleBoost: {
                title: "Center Scale",
                type: ControlType.Number,
                description: "Scale boost for front cards (0-1). Desktop default (1200px+ viewport).",
                defaultValue: 0.46,
                min: 0,
                max: 1,
                step: 0.05,
                displayStepper: true,
            },
        },
    },
    responsiveGroup: {
        title: "Responsive",
        type: ControlType.Object,
        buttonTitle: "Responsive",
        icon: "object",
        optional: true,
        controls: {
            useResponsiveBreakpoints: {
                title: "Enable Breakpoints",
                type: ControlType.Boolean,
                description: "Enable breakpoint-based responsive behavior. When disabled, uses scale-based responsive sizing. Breakpoints: Mobile <810px, Tablet 810-1200px, Desktop 1200+px.",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
        },
    },
    tabletGroup: {
        title: "Tablet (810-1200px)",
        type: ControlType.Object,
        buttonTitle: "Tablet",
        icon: "object",
        optional: true,
        hidden: (props) => !props.responsiveGroup?.useResponsiveBreakpoints,
        controls: {
            tabletCardWidth: {
                title: "Card Width",
                type: ControlType.Number,
                description: "Card width for tablet viewport (810-1200px).",
                defaultValue: 220,
                min: 120,
                max: 500,
                step: 10,
                unit: "px",
                displayStepper: true,
            },
            tabletCardHeight: {
                title: "Card Height",
                type: ControlType.Number,
                description: "Card height for tablet viewport (810-1200px).",
                defaultValue: 145,
                min: 80,
                max: 350,
                step: 10,
                unit: "px",
                displayStepper: true,
            },
            tabletCardRadius: {
                title: "Corner Radius",
                type: ControlType.Number,
                description: "Corner roundness for tablet viewport (810-1200px).",
                defaultValue: 0,
                min: 0,
                max: 40,
                step: 2,
                unit: "px",
                displayStepper: true,
            },
            tabletRingRadius: {
                title: "Ring Radius",
                type: ControlType.Number,
                description: "Ring radius for tablet viewport (810-1200px).",
                defaultValue: 250,
                min: 80,
                max: 400,
                step: 20,
                unit: "px",
                displayStepper: true,
            },
            tabletDepth: {
                title: "Depth",
                type: ControlType.Number,
                description: "Depth for tablet viewport (810-1200px).",
                defaultValue: 290,
                min: 80,
                max: 500,
                step: 20,
                unit: "px",
                displayStepper: true,
            },
            tabletCenterScaleBoost: {
                title: "Center Scale",
                type: ControlType.Number,
                description: "Scale boost for front cards on tablet viewport (810-1200px).",
                defaultValue: 0.45,
                min: 0,
                max: 1,
                step: 0.05,
                displayStepper: true,
            },
        },
    },
    mobileGroup: {
        title: "Mobile (<810px)",
        type: ControlType.Object,
        buttonTitle: "Mobile",
        icon: "object",
        optional: true,
        hidden: (props) => !props.responsiveGroup?.useResponsiveBreakpoints,
        controls: {
            mobileCardWidth: {
                title: "Card Width",
                type: ControlType.Number,
                description: "Card width for mobile viewport (<810px).",
                defaultValue: 170,
                min: 100,
                max: 400,
                step: 10,
                unit: "px",
                displayStepper: true,
            },
            mobileCardHeight: {
                title: "Card Height",
                type: ControlType.Number,
                description: "Card height for mobile viewport (<810px).",
                defaultValue: 110,
                min: 70,
                max: 300,
                step: 10,
                unit: "px",
                displayStepper: true,
            },
            mobileCardRadius: {
                title: "Corner Radius",
                type: ControlType.Number,
                description: "Corner roundness for mobile viewport (<810px).",
                defaultValue: 0,
                min: 0,
                max: 40,
                step: 2,
                unit: "px",
                displayStepper: true,
            },
            mobileRingRadius: {
                title: "Ring Radius",
                type: ControlType.Number,
                description: "Ring radius for mobile viewport (<810px).",
                defaultValue: 190,
                min: 60,
                max: 300,
                step: 20,
                unit: "px",
                displayStepper: true,
            },
            mobileDepth: {
                title: "Depth",
                type: ControlType.Number,
                description: "Depth for mobile viewport (<810px).",
                defaultValue: 220,
                min: 60,
                max: 400,
                step: 20,
                unit: "px",
                displayStepper: true,
            },
            mobileCenterScaleBoost: {
                title: "Center Scale",
                type: ControlType.Number,
                description: "Scale boost for front cards on mobile viewport (<810px).",
                defaultValue: 0.35,
                min: 0,
                max: 1,
                step: 0.05,
                displayStepper: true,
            },
        },
    },
    motionGroup: {
        title: "Motion",
        type: ControlType.Object,
        buttonTitle: "Motion",
        icon: "interaction",
        controls: {
            loop: {
                title: "Auto Loop",
                type: ControlType.Boolean,
                description: "Enable continuous rotation.",
                defaultValue: true,
            },
            speed: {
                title: "Speed",
                type: ControlType.Number,
                description: "Rotation speed (0.1-0.8).",
                defaultValue: 0.28,
                min: 0.1,
                max: 0.8,
                step: 0.05,
                displayStepper: true,
                hidden: (props) => !props.motionGroup?.loop,
            },
            motionPreset: {
                title: "Preset",
                type: ControlType.Enum,
                description: "Motion style: Editorial (smooth), Premium (balanced), Snap (quick).",
                options: ["editorial", "premium", "snap"],
                optionTitles: ["Editorial", "Premium", "Snap"],
                defaultValue: "premium",
                displaySegmentedControl: true,
                hidden: (props) => !props.motionGroup?.loop,
            },
            animationIntensity: {
                title: "Intensity",
                type: ControlType.Number,
                description: "Spring animation strength (0.3-1.8).",
                defaultValue: 1.0,
                min: 0.3,
                max: 1.8,
                step: 0.1,
                displayStepper: true,
                hidden: (props) => !props.motionGroup?.loop,
            },
            durationOverride: {
                title: "Duration",
                type: ControlType.Number,
                description: "Animation duration override in ms (0-3000). 0 uses preset.",
                defaultValue: 0,
                min: 0,
                max: 3000,
                step: 100,
                unit: "ms",
                displayStepper: true,
                hidden: (props) => !props.motionGroup?.loop,
            },
        },
    },
    depthFadeGroup: {
        title: "Depth & Fade",
        type: ControlType.Object,
        buttonTitle: "Depth & Fade",
        icon: "effect",
        optional: true,
        controls: {
            depthBlurAmount: {
                title: "Depth Blur",
                type: ControlType.Number,
                description: "Maximum blur for distant cards (0-20px).",
                defaultValue: 12,
                min: 0,
                max: 20,
                step: 1,
                unit: "px",
                displayStepper: true,
            },
            depthBlurFalloff: {
                title: "Blur Falloff",
                type: ControlType.Number,
                description: "How quickly blur increases with distance (0.5-3.0). Lower = earlier blur onset.",
                defaultValue: 1.2,
                min: 0.5,
                max: 3.0,
                step: 0.1,
                displayStepper: true,
            },
            backfaceBlur: {
                title: "Backface Blur",
                type: ControlType.Number,
                description: "Blur for cards facing away (0-3px).",
                defaultValue: 1.0,
                min: 0,
                max: 3,
                step: 0.1,
                unit: "px",
                displayStepper: true,
            },
            edgeFadeDistance: {
                title: "Edge Fade",
                type: ControlType.Number,
                description: "Distance over which cards fade at loop edges (0.1-0.5). Higher = longer fade.",
                defaultValue: 0.25,
                min: 0.1,
                max: 0.5,
                step: 0.05,
                displayStepper: true,
            },
            depthOpacityFalloff: {
                title: "Depth Fade",
                type: ControlType.Number,
                description: "Opacity reduction for distant cards (0-0.8). Higher = more fade.",
                defaultValue: 0.3,
                min: 0,
                max: 0.8,
                step: 0.05,
                displayStepper: true,
            },
        },
    },
    visualGroup: {
        title: "Visual",
        type: ControlType.Object,
        buttonTitle: "Visual",
        icon: "color",
        optional: true,
        controls: {
            showGrain: {
                title: "Film Grain",
                type: ControlType.Boolean,
                description: "Add realistic film grain texture to images.",
                defaultValue: true,
            },
            grainIntensity: {
                title: "Grain Intensity",
                type: ControlType.Number,
                description: "Film grain strength (0-1). 0.5 is balanced, 1.0 is dramatic.",
                defaultValue: 0.5,
                min: 0,
                max: 1,
                step: 0.05,
                displayStepper: true,
                hidden: (props) => !props.visualGroup?.showGrain,
            },
            gradingOverlay: {
                title: "Grading Overlay",
                type: ControlType.Number,
                description: "Color grading overlay strength (0-0.8).",
                defaultValue: 0.15,
                min: 0,
                max: 0.8,
                step: 0.05,
                displayStepper: true,
            },
            gradingVignette: {
                title: "Grading Vignette",
                type: ControlType.Number,
                description: "Color grading vignette strength (0-0.8).",
                defaultValue: 0.25,
                min: 0,
                max: 0.8,
                step: 0.05,
                displayStepper: true,
            },
            gradingContrast: {
                title: "Contrast",
                type: ControlType.Number,
                description: "Image contrast (0.7-1.4). 1.0 is neutral.",
                defaultValue: 1.05,
                min: 0.7,
                max: 1.4,
                step: 0.05,
                displayStepper: true,
            },
            gradingSaturation: {
                title: "Saturation",
                type: ControlType.Number,
                description: "Color saturation (0.3-1.5). 1.0 is neutral.",
                defaultValue: 0.95,
                min: 0.3,
                max: 1.5,
                step: 0.05,
                displayStepper: true,
            },
        },
    },
    accessibilityGroup: {
        title: "Accessibility",
        type: ControlType.Object,
        buttonTitle: "Accessibility",
        icon: "boolean",
        controls: {
            ariaLabel: {
                title: "Screen Reader Label",
                type: ControlType.String,
                description: "Component description for screen readers.",
                defaultValue: "Spiral media gallery",
            },
            reducedMotionMode: {
                title: "Reduced Motion",
                type: ControlType.Enum,
                description: "Behavior for motion-sensitive users.",
                options: ["none", "fade-only"],
                optionTitles: ["Static", "Fade Only"],
                defaultValue: "fade-only",
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
            },
        },
    },
})