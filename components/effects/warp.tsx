import * as React from "react"
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
 * WARP
 *
 * Interactive image distortion + X-Ray lens.
 *
 * The component itself is the image frame.
 * The canvas fills the entire component.
 *
 * Modes:
 * - Warp
 * - X-Ray
 * - Warp + X-Ray
 */

interface ImageValue {
    src?: string
    srcSet?: string
    alt?: string
}

interface Props {
    image?: ImageValue

    aspectRatio?: "Portrait" | "Landscape" | "Square" | "Custom"

    customAspectRatio?: number

    borderRadius?: number

    distortionStrength?: number
    influenceRadius?: number
    velocitySensitivity?: number
    recoverySpeed?: number
    smoothness?: number
    enableOnHover?: boolean

    interactionMode?: "Warp" | "X-Ray" | "Warp + X-Ray"

    lensSize?: number
    lensSoftness?: number
    xRayIntensity?: number

    xRayStyle?: "Inverted" | "Monochrome" | "Edge" | "Custom"
}

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value))

const lerp = (a: number, b: number, amount: number) => a + (b - a) * amount

function getAspectRatio(mode: Props["aspectRatio"], custom: number): number {
    switch (mode) {
        case "Portrait":
            return 4 / 5

        case "Landscape":
            return 16 / 9

        case "Square":
            return 1

        case "Custom":
            return custom > 0 ? custom : 1

        default:
            return 4 / 5
    }
}

function getImageSource(image?: ImageValue): string {
    return image?.src || ""
}

function getAltText(image?: ImageValue): string {
    if (image?.alt?.trim()) {
        return image.alt.trim()
    }

    return "Interactive image"
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function WARP(props: Props) {
    const {
        image,

        aspectRatio = "Portrait",
        customAspectRatio = 0.8,
        borderRadius = 20,

        distortionStrength = 10,
        influenceRadius = 58,
        velocitySensitivity = 1,
        recoverySpeed = 0.7,
        smoothness = 0.72,
        enableOnHover = true,

        interactionMode = "Warp + X-Ray",

        lensSize = 58,
        lensSoftness = 10,
        xRayIntensity = 0.58,
        xRayStyle = "Monochrome",
    } = props

    const rootRef = React.useRef<HTMLDivElement>(null)

    const canvasRef = React.useRef<HTMLCanvasElement>(null)

    const imageRef = React.useRef<HTMLImageElement | null>(null)

    const animationRef = React.useRef<number | null>(null)
    const observerRef = React.useRef<IntersectionObserver | null>(null)
    const isVisibleRef = React.useRef(true)

    const loadedRef = React.useRef(false)

    /**
     * Pointer state
     */
    const pointerRef = React.useRef({
        x: 0,
        y: 0,
        inside: false,
    })

    /**
     * Smoothed pointer position.
     */
    const smoothPointerRef = React.useRef({
        x: 0,
        y: 0,
    })

    /**
     * Cursor velocity.
     */
    const velocityRef = React.useRef({
        x: 0,
        y: 0,
    })

    const previousPointerRef = React.useRef({
        x: 0,
        y: 0,
        time: 0,
    })

    /**
     * Smoothed velocity.
     */
    const smoothVelocityRef = React.useRef({
        x: 0,
        y: 0,
    })

    /**
     * Lens opacity.
     */
    const lensOpacityRef = React.useRef(0)

    /**
     * Lens canvas.
     */
    const lensCanvasRef = React.useRef<HTMLCanvasElement | null>(null)

    const isStatic = useIsStaticRenderer()

    const warpEnabled =
        interactionMode === "Warp" || interactionMode === "Warp + X-Ray"

    const xRayEnabled =
        interactionMode === "X-Ray" || interactionMode === "Warp + X-Ray"

    const ratio = getAspectRatio(aspectRatio, customAspectRatio)

    /**
     * Detect mouse capability once.
     */
    const canUsePointer = React.useRef(true)
    const reducedMotionRef = React.useRef(false)

    React.useEffect(() => {
        if (typeof window === "undefined") {
            canUsePointer.current = false
            reducedMotionRef.current = true
            return
        }

        canUsePointer.current = window.matchMedia(
            "(hover: hover) and (pointer: fine)"
        ).matches
        reducedMotionRef.current = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches
    }, [])

    /**
     * ---------------------------------------------------------
     * IMAGE LOADING
     *
     * IMPORTANT:
     * This effect ONLY depends on image.src.
     *
     * Changing X-Ray style, intensity, warp strength, etc.
     * does NOT reload the image.
     * ---------------------------------------------------------
     */
    React.useEffect(() => {
        const src = getImageSource(image)

        if (!src) {
            imageRef.current = null
            loadedRef.current = false
            return
        }

        const img = new Image()

        img.crossOrigin = "anonymous"

        img.onload = () => {
            imageRef.current = img
            loadedRef.current = true
        }

        img.onerror = () => {
            imageRef.current = null
            loadedRef.current = false
        }

        img.src = src

        return () => {
            loadedRef.current = false
            imageRef.current = null
        }
    }, [getImageSource(image)])

    /**
     * ---------------------------------------------------------
     * DRAW
     * ---------------------------------------------------------
     */
    const draw = React.useCallback(() => {
        const root = rootRef.current
        const canvas = canvasRef.current
        const img = imageRef.current

        if (!root || !canvas || !img || !loadedRef.current) {
            return
        }

        const rect = root.getBoundingClientRect()

        const width = Math.max(1, rect.width)

        const height = Math.max(1, rect.height)

        const dpr =
            typeof window !== "undefined"
                ? Math.min(window.devicePixelRatio || 1, 2)
                : 1

        const pixelWidth = Math.max(1, Math.round(width * dpr))

        const pixelHeight = Math.max(1, Math.round(height * dpr))

        if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
            canvas.width = pixelWidth
            canvas.height = pixelHeight
        }

        const ctx = canvas.getContext("2d")

        if (!ctx) return

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        ctx.clearRect(0, 0, width, height)

        /**
         * -----------------------------------------------------
         * OBJECT-FIT: COVER
         * -----------------------------------------------------
         */
        const imageRatio = img.naturalWidth / Math.max(1, img.naturalHeight)

        const frameRatio = width / Math.max(1, height)

        let sourceX = 0
        let sourceY = 0
        let sourceWidth = img.naturalWidth
        let sourceHeight = img.naturalHeight

        if (imageRatio > frameRatio) {
            sourceWidth = img.naturalHeight * frameRatio

            sourceX = (img.naturalWidth - sourceWidth) / 2
        } else {
            sourceHeight = img.naturalWidth / frameRatio

            sourceY = (img.naturalHeight - sourceHeight) / 2
        }

        /**
         * -----------------------------------------------------
         * BASE IMAGE
         * -----------------------------------------------------
         */
        ctx.drawImage(
            img,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            width,
            height
        )

        const pointer = pointerRef.current

        const smoothPointer = smoothPointerRef.current

        const velocity = smoothVelocityRef.current

        /**
         * -----------------------------------------------------
         * WARP
         * -----------------------------------------------------
         */
        if (
            warpEnabled &&
            enableOnHover &&
            pointer.inside &&
            canUsePointer.current &&
            !isStatic &&
            !reducedMotionRef.current
        ) {
            const radius = clamp(influenceRadius, 20, 150)

            const speed = Math.hypot(velocity.x, velocity.y)

            /**
             * Velocity increases deformation
             * without making the radius larger.
             */
            const velocityBoost = clamp(
                0.35 + speed * velocitySensitivity * 2,
                0.35,
                2
            )

            const strength = distortionStrength * velocityBoost

            /**
             * Keep the warp localized.
             */
            const gridSize = clamp(14 - smoothness * 6, 8, 14)

            const startX = Math.max(
                0,
                Math.floor((smoothPointer.x - radius) / gridSize) * gridSize
            )

            const endX = Math.min(
                width,
                Math.ceil((smoothPointer.x + radius) / gridSize) * gridSize
            )

            const startY = Math.max(
                0,
                Math.floor((smoothPointer.y - radius) / gridSize) * gridSize
            )

            const endY = Math.min(
                height,
                Math.ceil((smoothPointer.y + radius) / gridSize) * gridSize
            )

            /**
             * Redraw only the local region.
             */
            for (let y = startY; y < endY; y += gridSize) {
                for (let x = startX; x < endX; x += gridSize) {
                    const centerX = x + gridSize / 2

                    const centerY = y + gridSize / 2

                    const dx = centerX - smoothPointer.x

                    const dy = centerY - smoothPointer.y

                    const distance = Math.sqrt(dx * dx + dy * dy)

                    if (distance > radius) {
                        continue
                    }

                    /**
                     * Soft localized falloff.
                     */
                    const falloff = Math.pow(
                        Math.max(0, 1 - distance / radius),
                        2.4
                    )

                    /**
                     * Direction of cursor travel.
                     */
                    const directionX = velocity.x

                    const directionY = velocity.y

                    /**
                     * Slight radial displacement
                     * makes the image feel elastic.
                     */
                    const radialLength = Math.max(
                        0.001,
                        Math.sqrt(dx * dx + dy * dy)
                    )

                    const radialX = dx / radialLength

                    const radialY = dy / radialLength

                    const displacement = strength * falloff

                    const offsetX =
                        directionX * displacement +
                        radialX * displacement * 0.35

                    const offsetY =
                        directionY * displacement +
                        radialY * displacement * 0.35

                    /**
                     * Source coordinates.
                     */
                    const srcX = sourceX + (x / width) * sourceWidth

                    const srcY = sourceY + (y / height) * sourceHeight

                    const srcW = (gridSize / width) * sourceWidth

                    const srcH = (gridSize / height) * sourceHeight

                    ctx.drawImage(
                        img,
                        srcX,
                        srcY,
                        srcW,
                        srcH,
                        x + offsetX,
                        y + offsetY,
                        gridSize + 1,
                        gridSize + 1
                    )
                }
            }
        }

        /**
         * -----------------------------------------------------
         * X-RAY
         * -----------------------------------------------------
         */
        if (
            xRayEnabled &&
            enableOnHover &&
            pointer.inside &&
            canUsePointer.current &&
            !isStatic &&
            !reducedMotionRef.current
        ) {
            const diameter = Math.round(clamp(lensSize, 28, 140))

            const radius = diameter / 2

            if (!lensCanvasRef.current) {
                lensCanvasRef.current = document.createElement("canvas")
            }

            const lensCanvas = lensCanvasRef.current

            if (!lensCanvas) return

            if (
                lensCanvas.width !== diameter ||
                lensCanvas.height !== diameter
            ) {
                lensCanvas.width = diameter

                lensCanvas.height = diameter
            }

            const lensCtx = lensCanvas.getContext("2d")

            if (!lensCtx) return

            lensCtx.clearRect(0, 0, diameter, diameter)

            const lensX = smoothPointer.x - radius

            const lensY = smoothPointer.y - radius

            /**
             * Draw the exact section
             * underneath the lens.
             */
            lensCtx.drawImage(
                img,
                sourceX,
                sourceY,
                sourceWidth,
                sourceHeight,
                -lensX,
                -lensY,
                width,
                height
            )

            /**
             * Optional local warp inside
             * the X-Ray lens.
             */
            if (warpEnabled && Math.hypot(velocity.x, velocity.y) > 0.01) {
                const localStrength =
                    distortionStrength *
                    clamp(Math.hypot(velocity.x, velocity.y) * 2, 0.2, 1.5)

                const localRadius = Math.min(influenceRadius, radius * 1.5)

                const tempCanvas = document.createElement("canvas")

                tempCanvas.width = diameter

                tempCanvas.height = diameter

                const tempCtx = tempCanvas.getContext("2d")

                if (tempCtx) {
                    tempCtx.drawImage(lensCanvas, 0, 0)

                    lensCtx.clearRect(0, 0, diameter, diameter)

                    const localGrid = 8

                    for (let y = 0; y < diameter; y += localGrid) {
                        for (let x = 0; x < diameter; x += localGrid) {
                            const cx = x + localGrid / 2

                            const cy = y + localGrid / 2

                            const dx = cx - radius

                            const dy = cy - radius

                            const distance = Math.sqrt(dx * dx + dy * dy)

                            if (distance > localRadius) {
                                continue
                            }

                            const falloff = Math.pow(
                                Math.max(0, 1 - distance / localRadius),
                                2
                            )

                            const ox = velocity.x * localStrength * falloff

                            const oy = velocity.y * localStrength * falloff

                            lensCtx.drawImage(
                                tempCanvas,
                                x,
                                y,
                                localGrid,
                                localGrid,
                                x + ox,
                                y + oy,
                                localGrid + 1,
                                localGrid + 1
                            )
                        }
                    }
                }
            }

            /**
             * -------------------------------------------------
             * X-RAY COLOR TREATMENT
             * -------------------------------------------------
             */
            let imageData: ImageData

            try {
                imageData = lensCtx.getImageData(0, 0, diameter, diameter)
            } catch {
                return
            }

            const data = imageData.data

            /**
             * Store luminance for Edge mode.
             */
            let luminance: Float32Array | null = null

            if (xRayStyle === "Edge") {
                luminance = new Float32Array(diameter * diameter)

                for (let i = 0; i < data.length; i += 4) {
                    luminance[i / 4] =
                        data[i] * 0.2126 +
                        data[i + 1] * 0.7152 +
                        data[i + 2] * 0.0722
                }
            }

            for (let y = 0; y < diameter; y++) {
                for (let x = 0; x < diameter; x++) {
                    const i = (y * diameter + x) * 4

                    const r = data[i]

                    const g = data[i + 1]

                    const b = data[i + 2]

                    const lum = r * 0.2126 + g * 0.7152 + b * 0.0722

                    let targetR = r
                    let targetG = g
                    let targetB = b

                    if (xRayStyle === "Inverted") {
                        targetR = 255 - r
                        targetG = 255 - g
                        targetB = 255 - b
                    }

                    if (xRayStyle === "Monochrome") {
                        const contrast = clamp((lum - 128) * 1.35 + 128, 0, 255)

                        targetR = contrast

                        targetG = contrast

                        targetB = contrast
                    }

                    if (xRayStyle === "Edge" && luminance) {
                        const left =
                            luminance[y * diameter + Math.max(0, x - 1)]

                        const right =
                            luminance[
                                y * diameter + Math.min(diameter - 1, x + 1)
                            ]

                        const top = luminance[Math.max(0, y - 1) * diameter + x]

                        const bottom =
                            luminance[
                                Math.min(diameter - 1, y + 1) * diameter + x
                            ]

                        const edge = clamp(
                            Math.hypot(right - left, bottom - top) * 2,
                            0,
                            255
                        )

                        targetR = edge

                        targetG = edge

                        targetB = edge
                    }

                    /**
                     * Custom = subtle
                     * cool-toned inspection effect.
                     */
                    if (xRayStyle === "Custom") {
                        const contrast = clamp((lum - 124) * 1.2 + 124, 0, 255)

                        targetR = contrast * 0.82

                        targetG = contrast

                        targetB = clamp(contrast * 1.08 + 8, 0, 255)
                    }

                    data[i] = lerp(r, targetR, xRayIntensity)

                    data[i + 1] = lerp(g, targetG, xRayIntensity)

                    data[i + 2] = lerp(b, targetB, xRayIntensity)
                }
            }

            lensCtx.putImageData(imageData, 0, 0)

            /**
             * -------------------------------------------------
             * SOFT CIRCULAR MASK
             * -------------------------------------------------
             */
            const softness = clamp(lensSoftness, 0, radius)

            const gradient = lensCtx.createRadialGradient(
                radius,
                radius,
                Math.max(0, radius - softness),
                radius,
                radius,
                radius
            )

            gradient.addColorStop(0, "rgba(0,0,0,1)")

            gradient.addColorStop(1, "rgba(0,0,0,0)")

            lensCtx.globalCompositeOperation = "destination-in"

            lensCtx.fillStyle = gradient

            lensCtx.fillRect(0, 0, diameter, diameter)

            lensCtx.globalCompositeOperation = "source-over"

            /**
             * Draw lens.
             */
            ctx.save()

            ctx.globalAlpha = lensOpacityRef.current

            ctx.drawImage(lensCanvas, lensX, lensY)

            ctx.restore()
        }
    }, [
        distortionStrength,
        influenceRadius,
        velocitySensitivity,
        smoothness,
        warpEnabled,
        xRayEnabled,
        lensSize,
        lensSoftness,
        xRayIntensity,
        xRayStyle,
        isStatic,
    ])

    /**
     * ---------------------------------------------------------
     * POINTER ENTER
     * ---------------------------------------------------------
     */
    const handlePointerEnter = React.useCallback(() => {
        if (
            !enableOnHover ||
            !canUsePointer.current ||
            isStatic ||
            reducedMotionRef.current
        ) {
            return
        }

        pointerRef.current.inside = true

        if (xRayEnabled) {
            lensOpacityRef.current = 1
        }
    }, [enableOnHover, xRayEnabled, isStatic])

    /**
     * ---------------------------------------------------------
     * POINTER MOVE
     * ---------------------------------------------------------
     */
    const handlePointerMove = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (
                !enableOnHover ||
                !canUsePointer.current ||
                isStatic ||
                reducedMotionRef.current
            ) {
                return
            }

            const root = rootRef.current

            if (!root) return

            const rect = root.getBoundingClientRect()

            const x = event.clientX - rect.left

            const y = event.clientY - rect.top

            const now =
                typeof performance !== "undefined"
                    ? performance.now()
                    : Date.now()

            const previous = previousPointerRef.current

            const dt = Math.max(8, now - (previous.time || now))

            const dx = x - previous.x

            const dy = y - previous.y

            const rawVX = dx / dt

            const rawVY = dy / dt

            /**
             * Keep velocity controlled.
             */
            velocityRef.current.x = clamp(rawVX, -2, 2)

            velocityRef.current.y = clamp(rawVY, -2, 2)

            previousPointerRef.current = {
                x,
                y,
                time: now,
            }

            pointerRef.current.x = x

            pointerRef.current.y = y

            /**
             * Smooth velocity.
             */
            smoothVelocityRef.current.x = lerp(
                smoothVelocityRef.current.x,
                velocityRef.current.x,
                0.35
            )

            smoothVelocityRef.current.y = lerp(
                smoothVelocityRef.current.y,
                velocityRef.current.y,
                0.35
            )
        },
        [enableOnHover, isStatic]
    )

    /**
     * ---------------------------------------------------------
     * POINTER LEAVE
     * ---------------------------------------------------------
     */
    const handlePointerLeave = React.useCallback(() => {
        pointerRef.current.inside = false

        lensOpacityRef.current = 0

        velocityRef.current.x = 0
        velocityRef.current.y = 0

        previousPointerRef.current.time = 0
    }, [])

    React.useEffect(() => {
        if (enableOnHover) return
        pointerRef.current.inside = false
        lensOpacityRef.current = 0
        velocityRef.current.x = 0
        velocityRef.current.y = 0
        smoothVelocityRef.current.x = 0
        smoothVelocityRef.current.y = 0
    }, [enableOnHover])

    /**
     * ---------------------------------------------------------
     * ANIMATION LOOP
     * ---------------------------------------------------------
     */
    const tick = React.useCallback(() => {
        if (typeof window === "undefined") return
        if (
            !isVisibleRef.current ||
            isStatic ||
            reducedMotionRef.current ||
            !enableOnHover
        ) {
            animationRef.current = null
            return
        }

        const pointer = pointerRef.current

        const smoothPointer = smoothPointerRef.current

        const velocity = smoothVelocityRef.current

        /**
         * Pointer follows smoothly.
         */
        const follow = clamp(smoothness * 0.25 + 0.06, 0.04, 0.32)

        smoothPointer.x = lerp(smoothPointer.x, pointer.x, follow)

        smoothPointer.y = lerp(smoothPointer.y, pointer.y, follow)

        /**
         * Velocity fades when cursor stops.
         */
        velocity.x *= pointer.inside ? 0.9 : 0.72

        velocity.y *= pointer.inside ? 0.9 : 0.72

        /**
         * X-Ray fades smoothly.
         */
        const targetOpacity =
            xRayEnabled && pointer.inside && canUsePointer.current ? 1 : 0

        const opacityFollow = pointer.inside
            ? 0.22
            : clamp(recoverySpeed * 0.25 + 0.04, 0.04, 0.28)

        lensOpacityRef.current = lerp(
            lensOpacityRef.current,
            targetOpacity,
            opacityFollow
        )

        draw()

        if (
            isVisibleRef.current &&
            !isStatic &&
            !reducedMotionRef.current &&
            enableOnHover
        ) {
            animationRef.current = window.requestAnimationFrame(tick)
        } else {
            pointer.inside = false
            animationRef.current = null
        }
    }, [draw, enableOnHover, isStatic, recoverySpeed, smoothness, xRayEnabled])

    const stopAnimation = React.useCallback(() => {
        if (typeof window === "undefined") return
        if (animationRef.current !== null) {
            window.cancelAnimationFrame(animationRef.current)
            animationRef.current = null
        }
    }, [])

    const startAnimation = React.useCallback(() => {
        if (typeof window === "undefined") return
        if (
            animationRef.current !== null ||
            !isVisibleRef.current ||
            isStatic ||
            reducedMotionRef.current ||
            !enableOnHover
        ) {
            return
        }
        animationRef.current = window.requestAnimationFrame(tick)
    }, [enableOnHover, isStatic, tick])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const root = rootRef.current
        if (!root) return

        observerRef.current?.disconnect()
        observerRef.current = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                const nowVisible = Boolean(
                    entry && entry.isIntersecting && entry.intersectionRatio > 0
                )
                isVisibleRef.current = nowVisible
                if (!nowVisible) {
                    stopAnimation()
                    draw()
                    return
                }
                draw()
                startAnimation()
            },
            {
                threshold: [0, 0.01, 0.1],
            }
        )
        observerRef.current.observe(root)

        return () => {
            observerRef.current?.disconnect()
            observerRef.current = null
            stopAnimation()
        }
    }, [draw, startAnimation, stopAnimation])

    React.useEffect(() => {
        if (!enableOnHover) {
            stopAnimation()
            draw()
            return
        }
        startAnimation()
        return () => {
            stopAnimation()
        }
    }, [draw, enableOnHover, startAnimation, stopAnimation])

    /**
     * Redraw when component dimensions
     * change.
     */
    React.useEffect(() => {
        if (typeof window === "undefined") {
            return
        }

        const root = rootRef.current

        if (!root) return

        const observer = new ResizeObserver(() => {
            draw()
        })

        observer.observe(root)

        window.addEventListener("resize", draw)

        return () => {
            observer.disconnect()

            window.removeEventListener("resize", draw)
        }
    }, [draw])

    /**
     * Redraw when image or visual
     * settings change.
     *
     * This does NOT reload the image.
     */
    React.useEffect(() => {
        draw()
    }, [draw, image?.src, aspectRatio, customAspectRatio])

    const altText = getAltText(image)

    /**
     * ---------------------------------------------------------
     * ROOT FRAME
     *
     * The root IS the image.
     *
     * No inner image container.
     * No extra padding.
     * No fixed internal canvas size.
     * ---------------------------------------------------------
     */
    return (
        <div
            ref={rootRef}
            onPointerEnter={handlePointerEnter}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            role="img"
            aria-label={altText}
            style={{
                position: "relative",

                width: "100%",

                /**
                 * Let the selected ratio
                 * define the frame.
                 */
                aspectRatio: ratio,

                height: "auto",

                overflow: "hidden",

                borderRadius: borderRadius,

                margin: 0,

                padding: 0,

                boxSizing: "border-box",

                display: "block",

                background: "#eeeeee",

                isolation: "isolate",

                touchAction: "pan-y",

                cursor: canUsePointer.current ? "none" : "default",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",

                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,

                    width: "100%",
                    height: "100%",

                    display: "block",

                    margin: 0,
                    padding: 0,

                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

WARP.displayName = "WARP"

addPropertyControls(WARP, {
    /**
     * ---------------------------------------------------------
     * IMAGE
     * ---------------------------------------------------------
     */
    image: {
        type: ControlType.ResponsiveImage,

        title: "Image",
    },

    /**
     * ---------------------------------------------------------
     * FRAME
     * ---------------------------------------------------------
     */
    aspectRatio: {
        type: ControlType.Enum,

        title: "Aspect Ratio",

        options: ["Portrait", "Landscape", "Square", "Custom"],

        optionTitles: ["Portrait", "Landscape", "Square", "Custom"],

        defaultValue: "Portrait",
    },

    customAspectRatio: {
        type: ControlType.Number,

        title: "Custom Ratio",

        defaultValue: 0.8,

        min: 0.2,
        max: 4,

        step: 0.01,

        hidden: (props) => props.aspectRatio !== "Custom",
    },

    borderRadius: {
        type: ControlType.Number,

        title: "Radius",

        defaultValue: 20,

        min: 0,
        max: 100,

        step: 1,
    },

    /**
     * ---------------------------------------------------------
     * WARP
     * ---------------------------------------------------------
     */
    distortionStrength: {
        type: ControlType.Number,

        title: "Strength",

        defaultValue: 10,

        min: 0,
        max: 30,

        step: 0.5,
    },

    influenceRadius: {
        type: ControlType.Number,

        title: "Radius",

        defaultValue: 58,

        min: 20,
        max: 160,

        step: 1,
    },

    velocitySensitivity: {
        type: ControlType.Number,

        title: "Velocity",

        defaultValue: 1,

        min: 0,
        max: 3,

        step: 0.05,
    },

    recoverySpeed: {
        type: ControlType.Number,

        title: "Recovery",

        defaultValue: 0.7,

        min: 0,
        max: 1,

        step: 0.01,
    },

    smoothness: {
        type: ControlType.Number,

        title: "Smoothness",

        defaultValue: 0.72,

        min: 0,
        max: 1,

        step: 0.01,
    },

    enableOnHover: {
        type: ControlType.Boolean,

        title: "Hover",

        defaultValue: true,

        enabledTitle: "On",
        disabledTitle: "Off",
    },

    /**
     * ---------------------------------------------------------
     * X-RAY
     * ---------------------------------------------------------
     */
    interactionMode: {
        type: ControlType.Enum,

        title: "Mode",

        options: ["Warp", "X-Ray", "Warp + X-Ray"],

        optionTitles: ["Warp", "X-Ray", "Warp + X-Ray"],

        defaultValue: "Warp + X-Ray",
    },

    lensSize: {
        type: ControlType.Number,

        title: "Lens Size",

        defaultValue: 58,

        min: 28,
        max: 140,

        step: 1,
    },

    lensSoftness: {
        type: ControlType.Number,

        title: "Lens Softness",

        defaultValue: 10,

        min: 0,
        max: 60,

        step: 1,
    },

    xRayIntensity: {
        type: ControlType.Number,

        title: "X-Ray",

        defaultValue: 0.58,

        min: 0,
        max: 1,

        step: 0.01,
    },

    xRayStyle: {
        type: ControlType.Enum,

        title: "X-Ray Style",

        options: ["Inverted", "Monochrome", "Edge", "Custom"],

        optionTitles: ["Inverted", "Monochrome", "Edge", "Custom"],

        defaultValue: "Monochrome",
    },
})
