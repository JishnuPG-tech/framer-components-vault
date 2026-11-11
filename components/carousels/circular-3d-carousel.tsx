// 3D card carousel with 3 modes for Framer
//
// Created by Tanel Kaarel Sepp / Give OÜ
// https://give.ee
//
// Concept, interaction design, product direction, and final implementation
// by Tanel Kaarel Sepp. Developed with AI-assisted coding.
//
// © 2026 Give OÜ. All rights reserved.
//
// AUTHOR ATTRIBUTION NOTICE
// This attribution notice is part of the component and must not be removed,
// obscured, or altered when the component or its source code is shared,
// redistributed, modified, or incorporated into another distributable asset.
//
// Use of this component is subject to the applicable Framer Marketplace
// license terms. The component may not be resold, republished, redistributed,
// or presented as another creator's original component except where expressly
// permitted by those terms.

import React, {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type ReactNode,
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


type OrientationMode = "faceViewer" | "torus" | "plane"
type SnapMode = "snap" | "freeform"
type ResponsiveMode = "adaptive" | "fit" | "fixed"
type GestureIntent = "horizontal" | "vertical" | null

interface Carousel3DProps {
    children?: ReactNode | ReactNode[]
    backgroundColor?: string
    cardBackgroundColor?: string
    cardBorderRadius?: number
    cardScaleFront?: number
    cardScaleBack?: number
    radius?: number
    cardSpacing?: number
    perspective?: number
    verticalTilt?: number
    cardTiltIntensity?: number
    dragSensitivity?: number
    inertiaFriction?: number
    maxInertiaSpeed?: number
    fadeBackside?: boolean
    fadeStrength?: number
    showBackHalf?: boolean
    mode?: OrientationMode
    snapMode?: SnapMode
    snapSpeed?: number
    responsiveMode?: ResponsiveMode
    fitPadding?: number
    minFitScale?: number
    ariaLabel?: string
    cardShadow?: {
        enabled: boolean
        distance: number
        blur: number
        opacity: number
    }
    cardDepth?: {
        enabled: boolean
        thickness: number
        color: string
    }
    style?: CSSProperties
}

interface SceneConfig {
    cardCount: number
    anchorIndex: number
    angleStep: number
    centeredThreshold: number
    effectiveRadius: number
    cardScaleFront: number
    cardScaleBack: number
    fadeBackside: boolean
    fadeStrength: number
    mode: OrientationMode
    sceneScale: number
    verticalTilt: number
    cardTiltIntensity: number
    perspectiveValue: number
    snapMode: SnapMode
    snapSpeed: number
    dragSensitivity: number
    inertiaFriction: number
    maxInertiaSpeed: number
    prefersReducedMotion: boolean
    cardShadow: NonNullable<Carousel3DProps["cardShadow"]>
    cardDepth: NonNullable<Carousel3DProps["cardDepth"]>
}

interface CardPose {
    transform: string
    opacity: number
    positionFactor: number
    active: boolean
    interactable: boolean
}

const DRAG_THRESHOLD = 8
const CLICK_SUPPRESSION_MS = 250
const TOUCH_DIRECTION_RATIO = 1.35
const INTERACTABLE_ANGLE = 105

const DEFAULT_SHADOW = {
    enabled: true,
    distance: 10,
    blur: 30,
    opacity: 0.15,
}

const DEFAULT_DEPTH = {
    enabled: true,
    thickness: 3,
    color: "#222222",
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

function normalizeAngle(angle: number) {
    return ((((angle + 180) % 360) + 360) % 360) - 180
}

function nowMs() {
    return typeof performance !== "undefined" ? performance.now() : Date.now()
}

function getCardPose(
    index: number,
    rotation: number,
    config: SceneConfig,
    mouseX = 0,
    mouseY = 0
): CardPose {
    const angle = rotation + (index - config.anchorIndex) * config.angleStep
    const normalizedAngle = normalizeAngle(angle)
    const radians = (angle * Math.PI) / 180
    const positionFactor = (Math.cos(radians) + 1) / 2

    const scale =
        config.cardScaleBack +
        (config.cardScaleFront - config.cardScaleBack) * positionFactor

    const fadeDistance = Math.min(90, Math.abs(normalizedAngle))

    const opacity = config.fadeBackside
        ? clamp(
              1 - clamp(config.fadeStrength, 0, 1) * (fadeDistance / 90),
              0,
              1
          )
        : 1

    const translateX = config.effectiveRadius * Math.sin(radians)

    const translateZ =
        config.effectiveRadius * Math.cos(radians) - config.effectiveRadius

    let rotationY = 0

    if (config.mode === "faceViewer") rotationY = -angle
    if (config.mode === "torus") rotationY = angle

    const ringMouseX = config.prefersReducedMotion ? 0 : mouseX
    const ringMouseY = config.prefersReducedMotion ? 0 : mouseY

    const activeLimit =
        config.snapMode === "freeform"
            ? Math.max(config.centeredThreshold, config.angleStep / 2 - 0.001)
            : config.centeredThreshold

    return {
        transform: `scale(${config.sceneScale}) rotateX(${config.verticalTilt - ringMouseY * config.cardTiltIntensity}deg) rotateY(${ringMouseX * config.cardTiltIntensity}deg) translate3d(${translateX}px, 0px, ${translateZ}px) rotateY(${rotationY}deg) scale(${scale}) translate(-50%, -50%)`,
        opacity,
        positionFactor,
        active: Math.abs(normalizedAngle) <= activeLimit,
        interactable:
            Math.abs(normalizedAngle) < INTERACTABLE_ANGLE && opacity > 0.02,
    }
}

function getCardBoxShadow(
    shadow: NonNullable<Carousel3DProps["cardShadow"]>,
    depth: NonNullable<Carousel3DProps["cardDepth"]>
) {
    const layers: string[] = []

    if (depth.enabled && depth.thickness > 0) {
        const layerCount = clamp(Math.ceil(depth.thickness), 1, 8)

        for (let index = 1; index <= layerCount; index++) {
            const offset = (index / layerCount) * depth.thickness
            layers.push(`0 ${offset}px 0 ${depth.color}`)
        }
    }

    if (shadow.enabled) {
        layers.push(
            `0 ${shadow.distance}px ${shadow.blur}px rgba(0, 0, 0, ${clamp(
                shadow.opacity,
                0,
                1
            )})`
        )
    }

    return layers.length ? layers.join(", ") : "none"
}

function estimateSceneBounds({
    radius,
    perspective,
    verticalTilt,
    cardWidth,
    cardHeight,
    cardScaleFront,
    cardScaleBack,
}: {
    radius: number
    perspective: number
    verticalTilt: number
    cardWidth: number
    cardHeight: number
    cardScaleFront: number
    cardScaleBack: number
}) {
    if (radius <= 0) {
        return {
            width: cardWidth * cardScaleFront,
            height: cardHeight * cardScaleFront,
        }
    }

    const tilt = (verticalTilt * Math.PI) / 180
    const cosTilt = Math.cos(tilt)
    const sinTilt = Math.sin(tilt)

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (let index = 0; index < 72; index++) {
        const angle = (index / 72) * Math.PI * 2
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)

        const x = radius * sin
        const z = radius * cos - radius

        const rotatedY = -z * sinTilt
        const rotatedZ = z * cosTilt

        const perspectiveFactor =
            perspective / Math.max(1, perspective - rotatedZ)

        const screenX = x * perspectiveFactor
        const screenY = rotatedY * perspectiveFactor

        const positionFactor = (cos + 1) / 2

        const cardScale =
            cardScaleBack + (cardScaleFront - cardScaleBack) * positionFactor

        const visibleScale = cardScale * perspectiveFactor

        const halfWidth = (cardWidth * visibleScale) / 2
        const halfHeight = (cardHeight * visibleScale) / 2

        minX = Math.min(minX, screenX - halfWidth)
        maxX = Math.max(maxX, screenX + halfWidth)
        minY = Math.min(minY, screenY - halfHeight)
        maxY = Math.max(maxY, screenY + halfHeight)
    }

    return {
        width: Math.max(1, maxX - minX),
        height: Math.max(1, maxY - minY),
    }
}

function usePrefersReducedMotion() {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return

        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")

        const update = () => {
            setPrefersReducedMotion(mediaQuery.matches)
        }

        update()

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", update)

            return () => {
                mediaQuery.removeEventListener("change", update)
            }
        }

        mediaQuery.addListener(update)

        return () => {
            mediaQuery.removeListener(update)
        }
    }, [])

    return prefersReducedMotion
}

function getCarouselChildren(children?: ReactNode | ReactNode[]) {
    const connected = React.Children.toArray(children)

    if (connected.length) return connected

    return Array.from({ length: 5 }, (_, index) => (
        <div
            key={`placeholder-${index}`}
            style={{
                width: 220,
                height: 280,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 16,
                background: "#17171F",
                color: "#FFFFFF",
                fontFamily: "Inter, sans-serif",
                fontSize: 32,
                fontWeight: 500,
            }}
        >
            {index + 1}
        </div>
    ))
}

function StaticCarouselPreview(props: Carousel3DProps) {
    const {
        children,
        backgroundColor = "#FFFFFF",
        cardBackgroundColor = "#11111A",
        cardBorderRadius = 8,
        cardScaleFront = 1,
        cardScaleBack = 0.7,
        radius = 260,
        perspective = 900,
        verticalTilt = -10,
        fadeBackside = true,
        fadeStrength = 0,
        showBackHalf = false,
        mode = "faceViewer",
        snapMode = "snap",
        snapSpeed = 450,
        dragSensitivity = 0.4,
        inertiaFriction = 0.96,
        maxInertiaSpeed = 2,
        cardShadow = DEFAULT_SHADOW,
        cardDepth = DEFAULT_DEPTH,
        style,
    } = props

    const carouselChildren = getCarouselChildren(children)

    const cardCount = carouselChildren.length
    const angleStep = cardCount <= 1 ? 360 : 360 / cardCount
    const anchorIndex = cardCount <= 1 ? 0 : Math.floor((cardCount - 1) / 2)

    const centeredThreshold =
        cardCount === 1 ? 180 : Math.max(2, Math.min(6, angleStep * 0.08))

    const staticConfig: SceneConfig = {
        cardCount,
        anchorIndex,
        angleStep,
        centeredThreshold,
        effectiveRadius: radius,
        cardScaleFront,
        cardScaleBack,
        fadeBackside,
        fadeStrength,
        mode,
        sceneScale: 1,
        verticalTilt,
        cardTiltIntensity: 0,
        perspectiveValue: Math.max(180, perspective),
        snapMode,
        snapSpeed,
        dragSensitivity,
        inertiaFriction,
        maxInertiaSpeed,
        prefersReducedMotion: true,
        cardShadow,
        cardDepth,
    }

    const staticInactiveProps: any = {
        inert: "",
    }

    return (
        <div
            data-carousel-3d-static=""
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "visible",
                backgroundColor,
                pointerEvents: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
            }}
            aria-hidden="true"
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    perspective: `${staticConfig.perspectiveValue}px`,
                    perspectiveOrigin: "50% 50%",
                    transformStyle: "preserve-3d",
                    overflow: "visible",
                    pointerEvents: "none",
                }}
            >
                {carouselChildren.map((child, index) => {
                    const pose = getCardPose(index, 0, staticConfig, 0, 0)

                    const stableKey =
                        React.isValidElement(child) && child.key !== null
                            ? String(child.key)
                            : `card-${index}`

                    return (
                        <div
                            key={stableKey}
                            {...staticInactiveProps}
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                display: "inline-grid",
                                width: "max-content",
                                height: "max-content",
                                overflow: "visible",
                                transform: pose.transform,
                                transformOrigin: "0 0",
                                transformStyle: showBackHalf
                                    ? "preserve-3d"
                                    : "flat",
                                opacity: pose.opacity,
                                zIndex: Math.round(pose.positionFactor * 1000),
                                pointerEvents: "none",
                                userSelect: "none",
                                WebkitUserSelect: "none",
                            }}
                        >
                            <div
                                style={{
                                    position: "relative",
                                    display: "grid",
                                    width: "max-content",
                                    height: "max-content",
                                    minWidth: 0,
                                    minHeight: 0,
                                    overflow: "hidden",
                                    borderRadius: cardBorderRadius,
                                    background: cardBackgroundColor,
                                    backfaceVisibility: "hidden",
                                    pointerEvents: "none",
                                    boxShadow: getCardBoxShadow(
                                        cardShadow,
                                        cardDepth
                                    ),
                                }}
                            >
                                {child}
                            </div>

                            {showBackHalf && (
                                <div
                                    aria-hidden="true"
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        borderRadius: cardBorderRadius,
                                        background: cardBackgroundColor,
                                        transform: `translateZ(${-Math.max(
                                            cardDepth.thickness,
                                            1
                                        )}px) rotateY(180deg)`,
                                        backfaceVisibility: "hidden",
                                        pointerEvents: "none",
                                    }}
                                />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function InteractiveCarousel(props: Carousel3DProps) {
    const {
        children,
        backgroundColor = "#FFFFFF",
        cardBackgroundColor = "#11111A",
        cardBorderRadius = 8,
        cardScaleFront = 1,
        cardScaleBack = 0.7,
        radius = 260,
        cardSpacing = 20,
        perspective = 900,
        verticalTilt = -10,
        cardTiltIntensity = 8,
        dragSensitivity = 0.4,
        inertiaFriction = 0.96,
        maxInertiaSpeed = 2,
        fadeBackside = true,
        fadeStrength = 0,
        showBackHalf = false,
        mode = "faceViewer",
        snapMode = "snap",
        snapSpeed = 450,
        responsiveMode = "adaptive",
        fitPadding = 24,
        minFitScale = 0.65,
        ariaLabel = "3D card carousel",
        cardShadow = DEFAULT_SHADOW,
        cardDepth = DEFAULT_DEPTH,
        style,
    } = props

    const prefersReducedMotion = usePrefersReducedMotion()

    const rootRef = useRef<HTMLDivElement | null>(null)
    const cardRefs = useRef<Array<HTMLDivElement | null>>([])
    const faceRefs = useRef<Array<HTMLDivElement | null>>([])
    const rotationRef = useRef(0)
    const containerRectRef = useRef<DOMRect | null>(null)

    const [containerSize, setContainerSize] = useState({
        width: 800,
        height: 400,
    })

    const [cardDimensions, setCardDimensions] = useState({
        width: 220,
        height: 280,
    })

    const gestureRef = useRef({
        pointerId: null as number | null,
        pointerType: "mouse",
        startX: 0,
        startY: 0,
        lastX: 0,
        lastTime: 0,
        velocity: 0,
        intent: null as GestureIntent,
        dragged: false,
        pressedTarget: null as Element | null,
        delegatingClick: false,
        suppressClickUntil: 0,
    })

    const inertiaRef = useRef({
        id: null as number | null,
        running: false,
    })

    const snapRef = useRef({
        id: null as number | null,
        running: false,
        from: 0,
        to: 0,
        startTime: 0,
        duration: 0,
    })

    const mouseTiltRef = useRef({
        id: null as number | null,
        targetX: 0,
        targetY: 0,
        currentX: 0,
        currentY: 0,
    })

    const carouselChildren = useMemo(
        () => getCarouselChildren(children),
        [children]
    )

    const cardCount = carouselChildren.length
    const angleStep = cardCount <= 1 ? 360 : 360 / cardCount
    const anchorIndex = cardCount <= 1 ? 0 : Math.floor((cardCount - 1) / 2)

    const centeredThreshold =
        cardCount === 1 ? 180 : Math.max(2, Math.min(6, angleStep * 0.08))

    const minimumSpacingRadius = useMemo(() => {
        if (cardCount <= 2) return 0

        const stepRadians = (angleStep * Math.PI) / 180
        const sinStep = Math.abs(Math.sin(stepRadians))
        const cosStep = Math.cos(stepRadians)

        if (sinStep < 0.001) return 0

        const adjacentPositionFactor = (cosStep + 1) / 2

        const adjacentScale =
            cardScaleBack +
            (cardScaleFront - cardScaleBack) * adjacentPositionFactor

        const required = Math.max(
            1,
            (cardDimensions.width * cardScaleFront) / 2 +
                (cardDimensions.width * adjacentScale) / 2 +
                cardSpacing
        )

        const depthFactor = 1 - cosStep
        const denominator = sinStep * perspective - required * depthFactor

        const calculated =
            denominator > 1
                ? (required * perspective) / denominator
                : (required / sinStep) * 1.35

        return clamp(calculated, 0, 5000)
    }, [
        cardCount,
        angleStep,
        cardDimensions.width,
        cardScaleFront,
        cardScaleBack,
        cardSpacing,
        perspective,
    ])

    const effectiveRadius =
        responsiveMode === "fixed"
            ? radius
            : Math.max(radius, minimumSpacingRadius)

    const fitScale = useMemo(() => {
        if (responsiveMode !== "fit") return 1

        const availableWidth = Math.max(1, containerSize.width - fitPadding * 2)

        const availableHeight = Math.max(
            1,
            containerSize.height - fitPadding * 2
        )

        const bounds = estimateSceneBounds({
            radius: cardCount > 1 ? effectiveRadius : 0,
            perspective,
            verticalTilt,
            cardWidth: cardDimensions.width,
            cardHeight: cardDimensions.height,
            cardScaleFront,
            cardScaleBack,
        })

        return clamp(
            Math.min(
                1,
                availableWidth / bounds.width,
                availableHeight / bounds.height
            ),
            clamp(minFitScale, 0.1, 1),
            1
        )
    }, [
        responsiveMode,
        containerSize,
        fitPadding,
        minFitScale,
        cardCount,
        effectiveRadius,
        perspective,
        verticalTilt,
        cardDimensions,
        cardScaleFront,
        cardScaleBack,
    ])

    const sceneConfig = useMemo<SceneConfig>(
        () => ({
            cardCount,
            anchorIndex,
            angleStep,
            centeredThreshold,
            effectiveRadius,
            cardScaleFront,
            cardScaleBack,
            fadeBackside,
            fadeStrength,
            mode,
            sceneScale: responsiveMode === "fit" ? fitScale : 1,
            verticalTilt,
            cardTiltIntensity,
            perspectiveValue: Math.max(
                180,
                responsiveMode === "fit" ? perspective * fitScale : perspective
            ),
            snapMode,
            snapSpeed,
            dragSensitivity,
            inertiaFriction,
            maxInertiaSpeed,
            prefersReducedMotion,
            cardShadow,
            cardDepth,
        }),
        [
            cardCount,
            anchorIndex,
            angleStep,
            centeredThreshold,
            effectiveRadius,
            cardScaleFront,
            cardScaleBack,
            fadeBackside,
            fadeStrength,
            mode,
            responsiveMode,
            fitScale,
            verticalTilt,
            cardTiltIntensity,
            perspective,
            snapMode,
            snapSpeed,
            dragSensitivity,
            inertiaFriction,
            maxInertiaSpeed,
            prefersReducedMotion,
            cardShadow,
            cardDepth,
        ]
    )

    const configRef = useRef(sceneConfig)
    configRef.current = sceneConfig

    const renderScene = useCallback(() => {
        const config = configRef.current
        const root = rootRef.current
        const tilt = mouseTiltRef.current

        for (let index = 0; index < config.cardCount; index++) {
            const card = cardRefs.current[index]
            const face = faceRefs.current[index]

            if (!card || !face) continue

            const pose = getCardPose(
                index,
                rotationRef.current,
                config,
                tilt.currentX,
                tilt.currentY
            )

            card.style.transform = pose.transform
            card.style.opacity = String(pose.opacity)
            card.style.pointerEvents = pose.active ? "auto" : "none"
            card.style.userSelect = pose.active ? "auto" : "none"
            card.style.webkitUserSelect = pose.active ? "auto" : "none"
            card.style.zIndex = String(Math.round(pose.positionFactor * 1000))

            card.style.cursor = gestureRef.current.dragged
                ? "grabbing"
                : pose.active
                  ? "auto"
                  : "grab"

            card.dataset.carouselActive = pose.active ? "true" : "false"
            card.dataset.carouselInteractable = pose.interactable
                ? "true"
                : "false"

            face.style.pointerEvents = pose.active ? "auto" : "none"

            const inertFace = face as HTMLDivElement & {
                inert: boolean
            }

            inertFace.inert = !pose.active

            if (pose.active) {
                card.removeAttribute("aria-hidden")

                card.setAttribute(
                    "aria-label",
                    `Slide ${index + 1} of ${config.cardCount}`
                )
            } else {
                card.setAttribute("aria-hidden", "true")
                card.removeAttribute("aria-label")

                if (
                    typeof document !== "undefined" &&
                    document.activeElement instanceof Node &&
                    face.contains(document.activeElement)
                ) {
                    root?.focus({
                        preventScroll: true,
                    })
                }
            }

            face.style.boxShadow = getCardBoxShadow(
                config.cardShadow,
                config.cardDepth
            )
        }

        if (root) {
            root.style.cursor = gestureRef.current.dragged ? "grabbing" : "grab"
        }
    }, [])

    const cancelSnap = useCallback(() => {
        if (snapRef.current.id !== null && typeof window !== "undefined") {
            window.cancelAnimationFrame(snapRef.current.id)
        }

        snapRef.current.id = null
        snapRef.current.running = false
    }, [])

    const cancelInertia = useCallback(() => {
        if (inertiaRef.current.id !== null && typeof window !== "undefined") {
            window.cancelAnimationFrame(inertiaRef.current.id)
        }

        inertiaRef.current.id = null
        inertiaRef.current.running = false
    }, [])

    const cancelMouseTilt = useCallback(() => {
        if (mouseTiltRef.current.id !== null && typeof window !== "undefined") {
            window.cancelAnimationFrame(mouseTiltRef.current.id)
        }

        mouseTiltRef.current.id = null
    }, [])

    const setRotationValue = useCallback(
        (rotation: number) => {
            rotationRef.current = rotation
            renderScene()
        },
        [renderScene]
    )

    const animateRotationTo = useCallback(
        (target: number) => {
            cancelInertia()
            cancelSnap()

            const config = configRef.current
            const from = rotationRef.current

            if (
                typeof window === "undefined" ||
                config.prefersReducedMotion ||
                Math.abs(target - from) < 0.001
            ) {
                setRotationValue(target)
                return
            }

            snapRef.current = {
                id: null,
                running: true,
                from,
                to: target,
                startTime: nowMs(),
                duration: clamp(config.snapSpeed, 100, 2000),
            }

            const step = (time: number) => {
                const animation = snapRef.current

                if (!animation.running) return

                const progress = clamp(
                    (time - animation.startTime) / animation.duration,
                    0,
                    1
                )

                const eased = 1 - Math.pow(1 - progress, 3)

                setRotationValue(
                    animation.from + (animation.to - animation.from) * eased
                )

                if (progress < 1) {
                    animation.id = window.requestAnimationFrame(step)
                } else {
                    animation.id = null
                    animation.running = false

                    setRotationValue(animation.to)
                }
            }

            snapRef.current.id = window.requestAnimationFrame(step)
        },
        [cancelInertia, cancelSnap, setRotationValue]
    )

    const centerCard = useCallback(
        (index: number) => {
            const config = configRef.current

            if (!config.cardCount) return

            const current = rotationRef.current

            const cardAngle =
                current + (index - config.anchorIndex) * config.angleStep

            animateRotationTo(current - normalizeAngle(cardAngle))
        },
        [animateRotationTo]
    )

    const getNearestCardIndex = useCallback(() => {
        const config = configRef.current

        let nearestIndex = 0
        let nearestDistance = Infinity

        for (let index = 0; index < config.cardCount; index++) {
            const angle =
                rotationRef.current +
                (index - config.anchorIndex) * config.angleStep

            const distance = Math.abs(normalizeAngle(angle))

            if (distance < nearestDistance) {
                nearestDistance = distance
                nearestIndex = index
            }
        }

        return nearestIndex
    }, [])

    const snapToNearestCard = useCallback(() => {
        const config = configRef.current

        if (config.snapMode === "snap" && config.cardCount) {
            centerCard(getNearestCardIndex())
        }
    }, [centerCard, getNearestCardIndex])

    const startInertia = useCallback(() => {
        if (typeof window === "undefined") return

        cancelSnap()
        cancelInertia()

        const config = configRef.current

        if (config.prefersReducedMotion) {
            snapToNearestCard()
            return
        }

        let velocity = clamp(
            gestureRef.current.velocity,
            -config.maxInertiaSpeed,
            config.maxInertiaSpeed
        )

        if (Math.abs(velocity) < 0.0001) {
            snapToNearestCard()
            return
        }

        const friction = clamp(config.inertiaFriction, 0.8, 0.995)

        let previousTime = nowMs()

        inertiaRef.current.running = true

        const step = (time: number) => {
            if (!inertiaRef.current.running) return

            const frameDelta = clamp((time - previousTime) / 16.67, 0, 3)

            previousTime = time

            setRotationValue(rotationRef.current + velocity * frameDelta)

            velocity *= Math.pow(friction, frameDelta)

            if (Math.abs(velocity) < 0.01) {
                inertiaRef.current.running = false
                inertiaRef.current.id = null

                snapToNearestCard()
                return
            }

            inertiaRef.current.id = window.requestAnimationFrame(step)
        }

        inertiaRef.current.id = window.requestAnimationFrame(step)
    }, [cancelInertia, cancelSnap, setRotationValue, snapToNearestCard])

    const startMouseTilt = useCallback(() => {
        if (
            typeof window === "undefined" ||
            mouseTiltRef.current.id !== null ||
            configRef.current.prefersReducedMotion
        ) {
            return
        }

        const step = () => {
            const tilt = mouseTiltRef.current

            tilt.currentX += (tilt.targetX - tilt.currentX) * 0.14
            tilt.currentY += (tilt.targetY - tilt.currentY) * 0.14

            renderScene()

            if (
                Math.abs(tilt.targetX - tilt.currentX) > 0.001 ||
                Math.abs(tilt.targetY - tilt.currentY) > 0.001
            ) {
                tilt.id = window.requestAnimationFrame(step)
            } else {
                tilt.currentX = tilt.targetX
                tilt.currentY = tilt.targetY
                tilt.id = null

                renderScene()
            }
        }

        mouseTiltRef.current.id = window.requestAnimationFrame(step)
    }, [renderScene])

    const delegateCardClick = useCallback((target: Element | null) => {
        if (!target) return

        const interactive = target.closest<HTMLElement>(
            'a, button, [role="button"], input, select, textarea, summary'
        )

        const clickTarget =
            interactive ?? (target instanceof HTMLElement ? target : null)

        if (!clickTarget) return

        gestureRef.current.delegatingClick = true

        try {
            clickTarget.click()
        } finally {
            gestureRef.current.delegatingClick = false
        }
    }, [])

    const handlePointerDownCapture = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (!event.isPrimary) return

            if (event.pointerType === "mouse" && event.button !== 0) {
                return
            }

            if (gestureRef.current.pointerId !== null) {
                return
            }

            cancelInertia()
            cancelSnap()

            const gesture = gestureRef.current

            gesture.pointerId = event.pointerId
            gesture.pointerType = event.pointerType || "mouse"

            gesture.startX = event.clientX
            gesture.startY = event.clientY

            gesture.lastX = event.clientX
            gesture.lastTime = nowMs()

            gesture.velocity = 0
            gesture.intent = null
            gesture.dragged = false

            gesture.pressedTarget =
                event.target instanceof Element ? event.target : null

            try {
                event.currentTarget.setPointerCapture(event.pointerId)
            } catch {
                // Ignore unsupported pointer-capture cases.
            }
        },
        [cancelInertia, cancelSnap]
    )

    const handleGlobalPointerMove = useCallback(
        (event: PointerEvent) => {
            const gesture = gestureRef.current

            if (
                gesture.pointerId === null ||
                gesture.pointerId !== event.pointerId
            ) {
                return
            }

            const totalX = event.clientX - gesture.startX
            const totalY = event.clientY - gesture.startY

            if (gesture.intent === null) {
                const absX = Math.abs(totalX)
                const absY = Math.abs(totalY)

                if (absX < DRAG_THRESHOLD && absY < DRAG_THRESHOLD) {
                    return
                }

                const ratio =
                    gesture.pointerType === "mouse" ? 1 : TOUCH_DIRECTION_RATIO

                const horizontal = absX > absY * ratio
                const vertical = absY > absX * ratio

                if (!horizontal && !vertical) return

                gesture.intent = horizontal ? "horizontal" : "vertical"

                if (!horizontal) return

                gesture.dragged = true
                renderScene()
            }

            if (gesture.intent !== "horizontal") return

            if (event.cancelable) {
                event.preventDefault()
            }

            const time = nowMs()
            const deltaX = event.clientX - gesture.lastX
            const deltaTime = Math.max(time - gesture.lastTime, 1)

            const deltaAngle = (deltaX * configRef.current.dragSensitivity) / 2

            gesture.lastX = event.clientX
            gesture.lastTime = time

            gesture.velocity = (deltaAngle / deltaTime) * 16.67

            if (deltaAngle !== 0) {
                setRotationValue(rotationRef.current + deltaAngle)
            }
        },
        [renderScene, setRotationValue]
    )

    const finishPointerInteraction = useCallback(
        (event: PointerEvent, cancelled: boolean) => {
            const gesture = gestureRef.current

            if (
                gesture.pointerId === null ||
                gesture.pointerId !== event.pointerId
            ) {
                return
            }

            const intent = gesture.intent
            const horizontalDrag = intent === "horizontal" && gesture.dragged
            const releaseVelocity = gesture.velocity
            const pressedTarget = gesture.pressedTarget

            try {
                const root = rootRef.current

                if (root && root.hasPointerCapture(event.pointerId)) {
                    root.releasePointerCapture(event.pointerId)
                }
            } catch {
                // Ignore unsupported pointer-capture cases.
            }

            gesture.pointerId = null
            gesture.intent = null
            gesture.dragged = false
            gesture.velocity = 0
            gesture.pressedTarget = null

            renderScene()

            if (cancelled) {
                if (horizontalDrag) {
                    snapToNearestCard()
                }

                return
            }

            if (intent === "vertical") {
                gesture.suppressClickUntil = nowMs() + CLICK_SUPPRESSION_MS
                return
            }

            if (!horizontalDrag) {
                delegateCardClick(pressedTarget)

                gesture.suppressClickUntil = nowMs() + CLICK_SUPPRESSION_MS
                return
            }

            gesture.suppressClickUntil = nowMs() + CLICK_SUPPRESSION_MS

            if (Math.abs(releaseVelocity) < 0.05) {
                snapToNearestCard()
                return
            }

            gesture.velocity = releaseVelocity
            startInertia()
        },
        [delegateCardClick, renderScene, snapToNearestCard, startInertia]
    )

    useEffect(() => {
        if (typeof window === "undefined") return

        const pointerUp = (event: PointerEvent) =>
            finishPointerInteraction(event, false)

        const pointerCancel = (event: PointerEvent) =>
            finishPointerInteraction(event, true)

        const preventNativeDrag = (event: DragEvent) => {
            const root = rootRef.current
            const target = event.target

            if (root && target instanceof Node && root.contains(target)) {
                event.preventDefault()
            }
        }

        window.addEventListener("pointermove", handleGlobalPointerMove, {
            passive: false,
            capture: true,
        })

        window.addEventListener("pointerup", pointerUp, true)
        window.addEventListener("pointercancel", pointerCancel, true)
        window.addEventListener("dragstart", preventNativeDrag, true)

        return () => {
            window.removeEventListener(
                "pointermove",
                handleGlobalPointerMove,
                true
            )

            window.removeEventListener("pointerup", pointerUp, true)
            window.removeEventListener("pointercancel", pointerCancel, true)
            window.removeEventListener("dragstart", preventNativeDrag, true)
        }
    }, [finishPointerInteraction, handleGlobalPointerMove])

    const handleClickCapture = useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            if (gestureRef.current.delegatingClick) {
                return
            }

            if (nowMs() <= gestureRef.current.suppressClickUntil) {
                event.preventDefault()
                event.stopPropagation()
                return
            }

            const target = event.target

            const card =
                target instanceof Element
                    ? target.closest<HTMLElement>("[data-carousel-card]")
                    : null

            if (
                card &&
                event.currentTarget.contains(card) &&
                card.dataset.carouselActive === "true"
            ) {
                return
            }

            let index: number | null = null

            if (card && event.currentTarget.contains(card)) {
                const parsedIndex = Number(card.dataset.carouselCard)

                if (Number.isInteger(parsedIndex)) {
                    index = parsedIndex
                }
            } else {
                let bestScore = -Infinity

                for (
                    let candidate = 0;
                    candidate < configRef.current.cardCount;
                    candidate++
                ) {
                    const candidateCard = cardRefs.current[candidate]
                    const candidateFace = faceRefs.current[candidate]

                    if (
                        !candidateCard ||
                        !candidateFace ||
                        candidateCard.dataset.carouselActive === "true" ||
                        candidateCard.dataset.carouselInteractable !== "true"
                    ) {
                        continue
                    }

                    const rect = candidateFace.getBoundingClientRect()

                    if (
                        event.clientX < rect.left ||
                        event.clientX > rect.right ||
                        event.clientY < rect.top ||
                        event.clientY > rect.bottom
                    ) {
                        continue
                    }

                    const distance = Math.hypot(
                        event.clientX - (rect.left + rect.right) / 2,
                        event.clientY - (rect.top + rect.bottom) / 2
                    )

                    const depth = Number(candidateCard.style.zIndex) || 0
                    const score = depth * 10000 - distance

                    if (score > bestScore) {
                        bestScore = score
                        index = candidate
                    }
                }
            }

            if (index === null) return

            event.preventDefault()
            event.stopPropagation()

            centerCard(index)
        },
        [centerCard]
    )

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (
                event.target !== event.currentTarget ||
                !configRef.current.cardCount
            ) {
                return
            }

            const count = configRef.current.cardCount
            const current = getNearestCardIndex()

            let next: number | null = null

            if (event.key === "ArrowRight") {
                next = (current + 1) % count
            }

            if (event.key === "ArrowLeft") {
                next = (current - 1 + count) % count
            }

            if (event.key === "Home") next = 0
            if (event.key === "End") next = count - 1

            if (next === null) return

            event.preventDefault()
            centerCard(next)
        },
        [centerCard, getNearestCardIndex]
    )

    const handlePointerEnter = useCallback(() => {
        containerRectRef.current =
            rootRef.current?.getBoundingClientRect() ?? null
    }, [])

    const handleLocalPointerMove = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            const config = configRef.current

            if (
                event.pointerType !== "mouse" ||
                gestureRef.current.pointerId !== null ||
                config.prefersReducedMotion ||
                config.cardTiltIntensity === 0
            ) {
                return
            }

            const rect = containerRectRef.current

            if (!rect || rect.width <= 0 || rect.height <= 0) {
                return
            }

            mouseTiltRef.current.targetX = clamp(
                ((event.clientX - rect.left) / rect.width) * 2 - 1,
                -1,
                1
            )

            mouseTiltRef.current.targetY = clamp(
                (1 - (event.clientY - rect.top) / rect.height) * 2 - 1,
                -1,
                1
            )

            startMouseTilt()
        },
        [startMouseTilt]
    )

    const handlePointerLeave = useCallback(() => {
        mouseTiltRef.current.targetX = 0
        mouseTiltRef.current.targetY = 0

        startMouseTilt()
    }, [startMouseTilt])

    useLayoutEffect(() => {
        if (typeof window === "undefined" || !rootRef.current) return

        const root = rootRef.current

        const measure = () => {
            const rect = root.getBoundingClientRect()

            containerRectRef.current = rect

            if (rect.width <= 0 || rect.height <= 0) return

            setContainerSize((previous) =>
                Math.abs(previous.width - rect.width) < 0.5 &&
                Math.abs(previous.height - rect.height) < 0.5
                    ? previous
                    : {
                          width: rect.width,
                          height: rect.height,
                      }
            )
        }

        measure()

        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", measure)

            return () => {
                window.removeEventListener("resize", measure)
            }
        }

        const observer = new ResizeObserver(measure)

        observer.observe(root)

        return () => {
            observer.disconnect()
        }
    }, [])

    useLayoutEffect(() => {
        if (typeof window === "undefined") return

        let frameId: number | null = null

        const measure = () => {
            let width = 0
            let height = 0

            for (let index = 0; index < cardCount; index++) {
                const face = faceRefs.current[index]

                if (!face) continue

                width = Math.max(width, face.offsetWidth)
                height = Math.max(height, face.offsetHeight)
            }

            if (width <= 0 || height <= 0) return

            setCardDimensions((previous) =>
                Math.abs(previous.width - width) < 0.5 &&
                Math.abs(previous.height - height) < 0.5
                    ? previous
                    : {
                          width,
                          height,
                      }
            )
        }

        const schedule = () => {
            if (frameId !== null) {
                window.cancelAnimationFrame(frameId)
            }

            frameId = window.requestAnimationFrame(measure)
        }

        schedule()

        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", schedule)

            return () => {
                if (frameId !== null) {
                    window.cancelAnimationFrame(frameId)
                }

                window.removeEventListener("resize", schedule)
            }
        }

        const observer = new ResizeObserver(schedule)

        faceRefs.current.slice(0, cardCount).forEach((face) => {
            if (face) observer.observe(face)
        })

        return () => {
            if (frameId !== null) {
                window.cancelAnimationFrame(frameId)
            }

            observer.disconnect()
        }
    }, [cardCount, carouselChildren])

    useLayoutEffect(() => {
        cardRefs.current = cardRefs.current.slice(0, cardCount)
        faceRefs.current = faceRefs.current.slice(0, cardCount)

        renderScene()
    }, [cardCount, sceneConfig, renderScene])

    useEffect(() => {
        cancelInertia()
        cancelSnap()

        rotationRef.current = 0

        renderScene()
    }, [cardCount, cancelInertia, cancelSnap, renderScene])

    useEffect(() => {
        if (!prefersReducedMotion) return

        cancelInertia()
        cancelSnap()
        cancelMouseTilt()

        mouseTiltRef.current.targetX = 0
        mouseTiltRef.current.targetY = 0
        mouseTiltRef.current.currentX = 0
        mouseTiltRef.current.currentY = 0

        renderScene()
        snapToNearestCard()
    }, [
        prefersReducedMotion,
        cancelInertia,
        cancelSnap,
        cancelMouseTilt,
        renderScene,
        snapToNearestCard,
    ])

    useEffect(
        () => () => {
            cancelInertia()
            cancelSnap()
            cancelMouseTilt()
        },
        [cancelInertia, cancelSnap, cancelMouseTilt]
    )

    const outerStyle: CSSProperties = {
        ...style,
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "visible",
        backgroundColor,
        touchAction: "pan-y",
        overscrollBehaviorX: "contain",
        cursor: "grab",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTapHighlightColor: "transparent",
    }

    return (
        <div
            ref={rootRef}
            data-carousel-3d-root=""
            style={outerStyle}
            onPointerDownCapture={handlePointerDownCapture}
            onPointerEnter={handlePointerEnter}
            onPointerMove={handleLocalPointerMove}
            onPointerLeave={handlePointerLeave}
            onClickCapture={handleClickCapture}
            onDragStartCapture={(event) => {
                event.preventDefault()
            }}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="region"
            aria-label={ariaLabel}
            aria-roledescription="carousel"
        >
            <style>{`
                [data-carousel-3d-root] img,
                [data-carousel-3d-root] a,
                [data-carousel-3d-root] [draggable="true"] {
                    -webkit-user-drag: none !important;
                }

                [data-carousel-3d-root] [data-carousel-card][data-carousel-active="false"] [data-carousel-face],
                [data-carousel-3d-root] [data-carousel-card][data-carousel-active="false"] [data-carousel-face] * {
                    pointer-events: none !important;
                }

                [data-carousel-3d-root] [data-carousel-card][data-carousel-interactable="false"],
                [data-carousel-3d-root] [data-carousel-card][data-carousel-interactable="false"] * {
                    pointer-events: none !important;
                }
            `}</style>

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    perspective: `${sceneConfig.perspectiveValue}px`,
                    perspectiveOrigin: "50% 50%",
                    transformStyle: "preserve-3d",
                    overflow: "visible",
                    pointerEvents: "none",
                    touchAction: "pan-y",
                }}
            >
                {carouselChildren.map((child, index) => {
                    const pose = getCardPose(
                        index,
                        rotationRef.current,
                        sceneConfig,
                        mouseTiltRef.current.currentX,
                        mouseTiltRef.current.currentY
                    )

                    const inactiveProps: any = pose.active ? {} : { inert: "" }

                    const stableKey =
                        React.isValidElement(child) && child.key !== null
                            ? String(child.key)
                            : `card-${index}`

                    return (
                        <div
                            key={stableKey}
                            ref={(node) => {
                                cardRefs.current[index] = node
                            }}
                            data-carousel-card={index}
                            data-carousel-active={
                                pose.active ? "true" : "false"
                            }
                            data-carousel-interactable={
                                pose.interactable ? "true" : "false"
                            }
                            role="group"
                            aria-roledescription="slide"
                            aria-label={
                                pose.active
                                    ? `Slide ${index + 1} of ${cardCount}`
                                    : undefined
                            }
                            aria-hidden={pose.active ? undefined : true}
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                display: "inline-grid",
                                width: "max-content",
                                height: "max-content",
                                overflow: "visible",
                                transform: pose.transform,
                                transformOrigin: "0 0",
                                transformStyle: showBackHalf
                                    ? "preserve-3d"
                                    : "flat",
                                opacity: pose.opacity,
                                pointerEvents: pose.active ? "auto" : "none",
                                zIndex: Math.round(pose.positionFactor * 1000),
                                cursor: pose.active ? "auto" : "grab",
                                touchAction: "pan-y",
                                userSelect: pose.active ? "auto" : "none",
                                WebkitUserSelect: pose.active ? "auto" : "none",
                            }}
                        >
                            <div
                                ref={(node) => {
                                    faceRefs.current[index] = node
                                }}
                                {...inactiveProps}
                                data-carousel-face=""
                                style={{
                                    position: "relative",
                                    display: "grid",
                                    width: "max-content",
                                    height: "max-content",
                                    minWidth: 0,
                                    minHeight: 0,
                                    overflow: "hidden",
                                    borderRadius: cardBorderRadius,
                                    background: cardBackgroundColor,
                                    backfaceVisibility: "hidden",
                                    pointerEvents: pose.active
                                        ? "auto"
                                        : "none",
                                    boxShadow: getCardBoxShadow(
                                        cardShadow,
                                        cardDepth
                                    ),
                                }}
                            >
                                {child}
                            </div>

                            {showBackHalf && (
                                <div
                                    aria-hidden="true"
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        borderRadius: cardBorderRadius,
                                        background: cardBackgroundColor,
                                        transform: `translateZ(${-Math.max(
                                            cardDepth.thickness,
                                            1
                                        )}px) rotateY(180deg)`,
                                        backfaceVisibility: "hidden",
                                        pointerEvents: "none",
                                    }}
                                />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

/**
 * 3D Card Carousel
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 400
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
function Carouselw3DModes(props: Carousel3DProps) {
    const isStaticRenderer = useIsStaticRenderer()

    return isStaticRenderer ? (
        <StaticCarouselPreview {...props} />
    ) : (
        <InteractiveCarousel {...props} />
    )
}

Carouselw3DModes.defaultProps = {
    backgroundColor: "#FFFFFF",
    cardBackgroundColor: "#11111A",
    cardBorderRadius: 8,
    cardScaleFront: 1,
    cardScaleBack: 0.7,
    radius: 260,
    cardSpacing: 20,
    perspective: 900,
    verticalTilt: -10,
    cardTiltIntensity: 8,
    dragSensitivity: 0.4,
    inertiaFriction: 0.96,
    maxInertiaSpeed: 2,
    fadeBackside: true,
    fadeStrength: 0,
    showBackHalf: false,
    mode: "faceViewer",
    snapMode: "snap",
    snapSpeed: 450,
    responsiveMode: "adaptive",
    fitPadding: 24,
    minFitScale: 0.65,
    ariaLabel: "3D card carousel",
    cardShadow: DEFAULT_SHADOW,
    cardDepth: DEFAULT_DEPTH,
} as Partial<Carousel3DProps>

addPropertyControls(Carouselw3DModes, {
    children: {
        type: ControlType.Array,
        title: "Cards",
        control: { type: ControlType.ComponentInstance },
        maxCount: 20,
    },

    responsiveMode: {
        type: ControlType.Enum,
        title: "Responsive",
        options: ["adaptive", "fit", "fixed"],
        optionTitles: ["Adaptive", "Fit", "Fixed"],
        defaultValue: "adaptive",
        displaySegmentedControl: true,
    },

    mode: {
        type: ControlType.Enum,
        title: "Orientation",
        options: ["faceViewer", "torus", "plane"],
        optionTitles: ["Face", "Torus", "Plane"],
        defaultValue: "faceViewer",
        displaySegmentedControl: true,
    },

    radius: {
        type: ControlType.Number,
        title: "Ring Radius",
        defaultValue: 260,
        min: 50,
        max: 1500,
        step: 10,
        unit: "px",
        displayStepper: true,
    },

    cardSpacing: {
        type: ControlType.Number,
        title: "Card Spacing",
        defaultValue: 20,
        min: -150,
        max: 400,
        step: 5,
        unit: "px",
        displayStepper: true,
        hidden: ({ responsiveMode }) => responsiveMode === "fixed",
    },

    fitPadding: {
        type: ControlType.Number,
        title: "Fit Padding",
        defaultValue: 24,
        min: 0,
        max: 200,
        step: 4,
        unit: "px",
        displayStepper: true,
        hidden: ({ responsiveMode }) => responsiveMode !== "fit",
    },

    minFitScale: {
        type: ControlType.Number,
        title: "Min Scale",
        defaultValue: 0.65,
        min: 0.2,
        max: 1,
        step: 0.05,
        displayStepper: true,
        hidden: ({ responsiveMode }) => responsiveMode !== "fit",
    },

    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 900,
        min: 200,
        max: 2500,
        step: 50,
        unit: "px",
        displayStepper: true,
    },

    verticalTilt: {
        type: ControlType.Number,
        title: "Ring Tilt",
        defaultValue: -10,
        min: -45,
        max: 45,
        step: 1,
        unit: "deg",
        displayStepper: true,
    },

    cardScaleFront: {
        type: ControlType.Number,
        title: "Front Scale",
        defaultValue: 1,
        min: 0.5,
        max: 1.5,
        step: 0.05,
        displayStepper: true,
    },

    cardScaleBack: {
        type: ControlType.Number,
        title: "Back Scale",
        defaultValue: 0.7,
        min: 0.3,
        max: 1.2,
        step: 0.05,
        displayStepper: true,
    },

    snapMode: {
        type: ControlType.Enum,
        title: "Movement",
        options: ["snap", "freeform"],
        optionTitles: ["Snap", "Free"],
        defaultValue: "snap",
        displaySegmentedControl: true,
    },

    snapSpeed: {
        type: ControlType.Number,
        title: "Snap Speed",
        defaultValue: 450,
        min: 100,
        max: 1200,
        step: 50,
        unit: "ms",
        displayStepper: true,
        hidden: ({ snapMode }) => snapMode === "freeform",
    },

    dragSensitivity: {
        type: ControlType.Number,
        title: "Drag Speed",
        defaultValue: 0.4,
        min: 0.1,
        max: 2,
        step: 0.05,
    },

    inertiaFriction: {
        type: ControlType.Number,
        title: "Momentum",
        defaultValue: 0.96,
        min: 0.85,
        max: 0.99,
        step: 0.01,
    },

    maxInertiaSpeed: {
        type: ControlType.Number,
        title: "Max Speed",
        defaultValue: 2,
        min: 0.25,
        max: 10,
        step: 0.25,
    },

    cardTiltIntensity: {
        type: ControlType.Number,
        title: "Mouse Tilt",
        defaultValue: 8,
        min: 0,
        max: 25,
        step: 0.5,
        unit: "deg",
        displayStepper: true,
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },

    cardBackgroundColor: {
        type: ControlType.Color,
        title: "Card BG",
        defaultValue: "#11111A",
    },

    cardBorderRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 8,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        displayStepper: true,
    },

    cardShadow: {
        type: ControlType.Object,
        title: "Shadow",
        icon: "effect",
        defaultValue: DEFAULT_SHADOW,

        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },

            distance: {
                type: ControlType.Number,
                title: "Distance",
                defaultValue: 10,
                min: -60,
                max: 60,
                step: 1,
                unit: "px",
            },

            blur: {
                type: ControlType.Number,
                title: "Blur",
                defaultValue: 30,
                min: 0,
                max: 120,
                step: 1,
                unit: "px",
            },

            opacity: {
                type: ControlType.Number,
                title: "Opacity",
                defaultValue: 0.15,
                min: 0,
                max: 1,
                step: 0.05,
            },
        },
    },

    cardDepth: {
        type: ControlType.Object,
        title: "Depth",
        icon: "effect",
        defaultValue: DEFAULT_DEPTH,

        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },

            thickness: {
                type: ControlType.Number,
                title: "Thickness",
                defaultValue: 3,
                min: 0,
                max: 20,
                step: 1,
                unit: "px",
            },

            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#222222",
            },
        },
    },

    fadeBackside: {
        type: ControlType.Boolean,
        title: "Fade Sides",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    fadeStrength: {
        type: ControlType.Number,
        title: "Fade Amount",
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: ({ fadeBackside }) => !fadeBackside,
    },

    showBackHalf: {
        type: ControlType.Boolean,
        title: "Back Faces",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    ariaLabel: {
        type: ControlType.String,
        title: "ARIA Label",
        defaultValue: "3D card carousel",
    },
})

export default Carouselw3DModes
