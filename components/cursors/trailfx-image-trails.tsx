import * as React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { gsap } from "gsap"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

// Based on https://tympanus.net
/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerDisableUnlink
 */
export default function ImageTrail(props) {
    const {
        images,
        threshold,
        smoothing,
        desktopFrame,
        tabletFrame,
        phoneFrame,
        frameMode,
        mobileBreakpoint,
        tabletBreakpoint,
        children,
        background,
        backgroundImage,
        enableTrail,
        trailEffect,
        imageWidth,
        imageHeight,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const mousePos = useRef({ x: 0, y: 0 })
    const cacheMousePos = useRef({ x: 0, y: 0 })
    const lastMousePos = useRef({ x: 0, y: 0 })
    const imgIndex = useRef(0)
    const zIndex = useRef(1)
    const containerRef = useRef(null)
    const imageRefs = useRef([])
    const trail1PoolRefs = useRef([])
    const trail1PoolIndex = useRef(0)
    const activeCount = useRef(0)
    const isIdle = useRef(true)
    const warmedUp = useRef(false)
    const lastAngle = useRef(0)
    const visibleCount = useRef(0)

    // For Trail 9
    const rotation = useRef({ x: 0, y: 0 })
    const cachedRotation = useRef({ x: 0, y: 0 })
    const zValue = useRef(0)
    const cachedZValue = useRef(0)
    const winsize = useRef({
        width: typeof window !== "undefined" ? window.innerWidth : 0,
        height: typeof window !== "undefined" ? window.innerHeight : 0,
    })

    const [isVisible, setIsVisible] = useState(false)
    const [imagesLoaded, setImagesLoaded] = useState(false)
    const [containerWidth, setContainerWidth] = useState(null)

    const thresholdSq = useRef(threshold * threshold)
    const containerRect = useRef({ left: 0, top: 0 })
    const trailPoolSize = Math.max((images?.length || 0) * 2, 12)
    const visibleImagesTotal = 9

    useEffect(() => {
        imageRefs.current = images.map(() => null)
    }, [images])

    useEffect(() => {
        thresholdSq.current = threshold * threshold
    }, [threshold])

    useEffect(() => {
        const node = containerRef.current
        if (!node) return

        const updateWidth = () => {
            setContainerWidth(node.getBoundingClientRect().width)
        }

        updateWidth()

        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", updateWidth, { passive: true })
            return () => window.removeEventListener("resize", updateWidth)
        }

        const resizeObserver = new ResizeObserver(updateWidth)
        resizeObserver.observe(node)

        return () => resizeObserver.disconnect()
    }, [])

    useEffect(() => {
        if (isStatic) return

        const updateRect = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                containerRect.current.left = rect.left
                containerRect.current.top = rect.top
            }
            winsize.current = {
                width: window.innerWidth,
                height: window.innerHeight,
            }
        }
        updateRect()
        window.addEventListener("resize", updateRect, { passive: true })
        window.addEventListener("scroll", updateRect, {
            passive: true,
            capture: true,
        })
        return () => {
            window.removeEventListener("resize", updateRect)
            window.removeEventListener("scroll", updateRect, true)
        }
    }, [isStatic])

    const handleMouseMove = useCallback((e) => {
        mousePos.current = { x: e.clientX, y: e.clientY }
    }, [])

    const handleTouchMove = useCallback((e) => {
        if (e.touches.length > 0) {
            mousePos.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            }
        }
    }, [])

    useEffect(() => {
        if (isStatic) return

        const node = containerRef.current
        if (!node) return

        node.addEventListener("mousemove", handleMouseMove, { passive: true })
        node.addEventListener("touchmove", handleTouchMove, { passive: true })

        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { threshold: 0 }
        )
        observer.observe(node)

        return () => {
            node.removeEventListener("mousemove", handleMouseMove)
            node.removeEventListener("touchmove", handleTouchMove)
            observer.disconnect()
        }
    }, [isStatic, handleMouseMove, handleTouchMove])

    useEffect(() => {
        if (isStatic) {
            // Skip preload work entirely in canvas/export; nothing will animate.
            setImagesLoaded(true)
            return
        }

        if (!images || images.length === 0) {
            setImagesLoaded(true)
            return
        }

        setImagesLoaded(false)
        const promises = images.map(
            (src) =>
                new Promise((resolve) => {
                    const img = new window.Image()
                    img.src = src
                    if (img.decode) {
                        img.decode().then(
                            () => resolve(true),
                            () => resolve(true)
                        )
                    } else {
                        img.onload = () => resolve(true)
                        img.onerror = () => resolve(true)
                    }
                })
        )
        Promise.all(promises).then(() => setImagesLoaded(true))
    }, [isStatic, images])

    useEffect(() => {
        if (isStatic) return
        return () => {
            gsap.killTweensOf(imageRefs.current)
            gsap.killTweensOf(
                trail1PoolRefs.current.flatMap((p) =>
                    p ? [p.wrapper, ...(p.inners || [])] : []
                )
            )
        }
    }, [isStatic])

    useEffect(() => {
        // Never run continuous rAF/GSAP animation loops on the Framer canvas
        // or during static export -- this avoids editor perf issues and
        // export artifacts (stray mid-animation frames baked into images).
        if (isStatic) return
        if (!isVisible || !imagesLoaded) return

        cacheMousePos.current = { ...mousePos.current }
        lastMousePos.current = { ...mousePos.current }

        const showNextImageRecycle = () => {
            imgIndex.current =
                imgIndex.current < images.length - 1 ? imgIndex.current + 1 : 0
            zIndex.current++

            const imgEl = imageRefs.current[imgIndex.current]
            if (!imgEl) return

            const offsetX = containerRect.current.left
            const offsetY = containerRect.current.top

            const xStart = cacheMousePos.current.x - offsetX - imageWidth / 2
            const yStart = cacheMousePos.current.y - offsetY - imageHeight / 2
            const xEnd = mousePos.current.x - offsetX - imageWidth / 2
            const yEnd = mousePos.current.y - offsetY - imageHeight / 2

            gsap.killTweensOf(imgEl)
            gsap.set(imgEl, {
                opacity: 1,
                scale: 1,
                x: xStart,
                y: yStart,
                zIndex: zIndex.current,
                force3D: true,
            })

            const tl = gsap.timeline({
                onComplete: () => {
                    activeCount.current--
                    if (activeCount.current === 0) isIdle.current = true
                    if (zIndex.current !== 1 && isIdle.current)
                        zIndex.current = 1
                },
            })
            tl.to(imgEl, {
                x: xEnd,
                y: yEnd,
                duration: 0.4,
                ease: "power2.out",
            })
            tl.to(
                imgEl,
                { opacity: 0, scale: 0.2, duration: 0.4, ease: "power2.in" },
                ">"
            )
        }

        const showNextImageDynamic = () => {
            const pool = trail1PoolRefs.current
            if (!pool.length) return

            trail1PoolIndex.current =
                trail1PoolIndex.current < pool.length - 1
                    ? trail1PoolIndex.current + 1
                    : 0
            const slot = pool[trail1PoolIndex.current]
            if (!slot || !slot.wrapper || !slot.inner) return

            const imgSrc = images[imgIndex.current % images.length]
            imgIndex.current++
            zIndex.current++

            const offsetX = containerRect.current.left
            const offsetY = containerRect.current.top

            const startX = cacheMousePos.current.x - offsetX - imageWidth / 2
            const startY = cacheMousePos.current.y - offsetY - imageHeight / 2
            const endX = mousePos.current.x - offsetX - imageWidth / 2
            const endY = mousePos.current.y - offsetY - imageHeight / 2

            gsap.killTweensOf([slot.wrapper, slot.inner])

            if (slot.inner.style.backgroundImage !== `url(${imgSrc})`) {
                slot.inner.style.backgroundImage = `url(${imgSrc})`
            }
            slot.wrapper.style.zIndex = zIndex.current

            gsap.set(slot.wrapper, {
                x: startX,
                y: startY,
                xPercent: 0,
                yPercent: 0,
                rotation: 0,
                opacity: 1,
                scale: 1,
                force3D: true,
            })
            gsap.set(slot.inner, {
                scale: 2.8,
                filter: "brightness(250%)",
                force3D: true,
            })

            gsap.to(slot.wrapper, {
                x: endX,
                y: endY,
                duration: 0.4,
                ease: "power2.out",
            })
            gsap.to(slot.inner, {
                scale: 1,
                filter: "brightness(100%)",
                duration: 0.4,
                ease: "power2.out",
            })

            gsap.delayedCall(0.45, () => {
                if (!slot.wrapper) return
                gsap.to(slot.wrapper, {
                    opacity: 0,
                    scale: 0.2,
                    duration: 0.4,
                    ease: "power2.in",
                })
            })
        }

        const showNextImageFlyAway = () => {
            const pool = trail1PoolRefs.current
            if (!pool.length) return

            trail1PoolIndex.current =
                trail1PoolIndex.current < pool.length - 1
                    ? trail1PoolIndex.current + 1
                    : 0
            const slot = pool[trail1PoolIndex.current]
            if (!slot || !slot.wrapper || !slot.inner) return

            const imgSrc = images[imgIndex.current % images.length]
            imgIndex.current++
            zIndex.current++

            const offsetX = containerRect.current.left
            const offsetY = containerRect.current.top

            const imgWidth = imageWidth
            const imgHeight = imageHeight

            const currentX = mousePos.current.x - offsetX - imgWidth / 2
            const currentY = mousePos.current.y - offsetY - imgHeight / 2

            gsap.killTweensOf([slot.wrapper, slot.inner])

            if (slot.inner.style.backgroundImage !== `url(${imgSrc})`) {
                slot.inner.style.backgroundImage = `url(${imgSrc})`
            }
            slot.wrapper.style.zIndex = zIndex.current

            const tl = gsap
                .timeline({
                    onStart: () => {
                        activeCount.current++
                        isIdle.current = false
                    },
                    onComplete: () => {
                        activeCount.current--
                        if (activeCount.current === 0) isIdle.current = true
                        if (zIndex.current !== 1 && isIdle.current)
                            zIndex.current = 1
                    },
                })
                .fromTo(
                    slot.wrapper,
                    {
                        opacity: 1,
                        scale: 0,
                        x: currentX,
                        y: currentY,
                        xPercent: 0,
                        yPercent: 0,
                        rotation: 0,
                        force3D: true,
                    },
                    {
                        duration: 0.4,
                        ease: "power1",
                        scale: 1,
                        x: currentX,
                        y: currentY,
                    },
                    0
                )
                .fromTo(
                    slot.inner,
                    {
                        scale: 1.2,
                        force3D: true,
                    },
                    {
                        duration: 0.4,
                        ease: "power1",
                        scale: 1,
                    },
                    0
                )
                .to(
                    slot.wrapper,
                    {
                        duration: 0.6,
                        ease: "power2",
                        opacity: 0,
                        scale: 0.2,
                        xPercent: () => gsap.utils.random(-30, 30),
                        yPercent: -200,
                    },
                    0.6
                )
        }

        const showNextImageMomentum = () => {
            const pool = trail1PoolRefs.current
            if (!pool.length) return

            trail1PoolIndex.current =
                trail1PoolIndex.current < pool.length - 1
                    ? trail1PoolIndex.current + 1
                    : 0
            const slot = pool[trail1PoolIndex.current]
            if (!slot || !slot.wrapper || !slot.inner) return

            const imgSrc = images[imgIndex.current % images.length]
            imgIndex.current++
            zIndex.current++

            const offsetX = containerRect.current.left
            const offsetY = containerRect.current.top

            const imgWidth = imageWidth
            const imgHeight = imageHeight

            let dx = mousePos.current.x - cacheMousePos.current.x
            let dy = mousePos.current.y - cacheMousePos.current.y
            let distance = Math.sqrt(dx * dx + dy * dy)

            if (distance !== 0) {
                dx /= distance
                dy /= distance
            }
            dx *= distance / 100
            dy *= distance / 100

            gsap.killTweensOf([slot.wrapper, slot.inner])

            if (slot.inner.style.backgroundImage !== `url(${imgSrc})`) {
                slot.inner.style.backgroundImage = `url(${imgSrc})`
            }
            slot.wrapper.style.zIndex = zIndex.current

            const tl = gsap
                .timeline({
                    onStart: () => {
                        activeCount.current++
                        isIdle.current = false
                    },
                    onComplete: () => {
                        activeCount.current--
                        if (activeCount.current === 0) isIdle.current = true
                        if (zIndex.current !== 1 && isIdle.current)
                            zIndex.current = 1
                    },
                })
                .fromTo(
                    slot.wrapper,
                    {
                        opacity: 1,
                        scale: 0,
                        x: cacheMousePos.current.x - offsetX - imgWidth / 2,
                        y: cacheMousePos.current.y - offsetY - imgHeight / 2,
                        xPercent: 0,
                        yPercent: 0,
                        rotation: 0,
                        force3D: true,
                    },
                    {
                        duration: 0.4,
                        ease: "power3",
                        scale: 1,
                        x: mousePos.current.x - offsetX - imgWidth / 2,
                        y: mousePos.current.y - offsetY - imgHeight / 2,
                    },
                    0
                )
                .fromTo(
                    slot.inner,
                    {
                        scale: 1.2,
                        force3D: true,
                    },
                    {
                        duration: 0.4,
                        ease: "power3",
                        scale: 1,
                    },
                    0
                )
                .to(
                    slot.wrapper,
                    {
                        duration: 0.6,
                        ease: "power2",
                        opacity: 0,
                        scale: 0.2,
                        x: "+=" + dx * 100,
                        y: "+=" + dy * 100,
                        rotation: () => gsap.utils.random(-20, 20),
                    },
                    0.2
                )
        }

        const showNextImageRotation = () => {
            const pool = trail1PoolRefs.current
            if (!pool.length) return

            trail1PoolIndex.current =
                trail1PoolIndex.current < pool.length - 1
                    ? trail1PoolIndex.current + 1
                    : 0
            const slot = pool[trail1PoolIndex.current]
            if (!slot || !slot.wrapper || !slot.inner) return

            const imgSrc = images[imgIndex.current % images.length]
            imgIndex.current++
            zIndex.current++

            const offsetX = containerRect.current.left
            const offsetY = containerRect.current.top

            const imgWidth = imageWidth
            const imgHeight = imageHeight

            // Fixed Logic:
            let dx = mousePos.current.x - cacheMousePos.current.x
            let dy = mousePos.current.y - cacheMousePos.current.y
            let distance = Math.hypot(dx, dy)
            let angle = Math.atan2(dy, dx) * (180 / Math.PI)

            let velocity = Math.min(distance / 10, 15)
            let nx = distance !== 0 ? dx / distance : 0
            let ny = distance !== 0 ? dy / distance : 0

            if (slot.inner.style.backgroundImage !== `url(${imgSrc})`) {
                slot.inner.style.backgroundImage = `url(${imgSrc})`
            }
            slot.wrapper.style.zIndex = zIndex.current

            gsap.killTweensOf([slot.wrapper, slot.inner])

            const tl = gsap.timeline({
                onStart: () => {
                    activeCount.current++
                    isIdle.current = false
                },
                onComplete: () => {
                    activeCount.current--
                    if (activeCount.current === 0) isIdle.current = true
                    if (zIndex.current !== 1 && isIdle.current)
                        zIndex.current = 1
                },
            })

            // Initial appearance and drift
            tl.fromTo(
                slot.wrapper,
                {
                    opacity: 1,
                    scale: 0.2,
                    x: mousePos.current.x - offsetX - imgWidth / 2,
                    y: mousePos.current.y - offsetY - imgHeight / 2,
                    rotation: angle - 15,
                    xPercent: 0,
                    yPercent: 0,
                    force3D: true,
                },
                {
                    duration: 0.8,
                    ease: "power2.out",
                    scale: 1,
                    x:
                        mousePos.current.x -
                        offsetX -
                        imgWidth / 2 +
                        nx * velocity * 5,
                    y:
                        mousePos.current.y -
                        offsetY -
                        imgHeight / 2 +
                        ny * velocity * 5,
                    rotation: angle,
                }
            )

            // Momentum fade out
            tl.to(
                slot.wrapper,
                {
                    duration: 1.2,
                    ease: "power1.out",
                    opacity: 0,
                    scale: 0.8,
                    x: "+=" + nx * velocity * 20,
                    y: "+=" + ny * velocity * 20,
                    rotation: angle + nx * 10,
                },
                0.3
            )
        }

        const showNextImageSpeedReactive = () => {
            const pool = trail1PoolRefs.current
            if (!pool.length) return

            trail1PoolIndex.current =
                trail1PoolIndex.current < pool.length - 1
                    ? trail1PoolIndex.current + 1
                    : 0
            const slot = pool[trail1PoolIndex.current]
            if (!slot || !slot.wrapper || !slot.inner) return

            const imgSrc = images[imgIndex.current % images.length]
            imgIndex.current++
            zIndex.current++

            const offsetX = containerRect.current.left
            const offsetY = containerRect.current.top

            const imgWidth = imageWidth
            const imgHeight = imageHeight

            let dx = mousePos.current.x - cacheMousePos.current.x
            let dy = mousePos.current.y - cacheMousePos.current.y
            let speed = Math.sqrt(dx * dx + dy * dy)

            const mapSpeed = (val, max, minRange, maxRange) =>
                minRange + (maxRange - minRange) * Math.min(val / max, 1)

            let scaleFactor = mapSpeed(speed, 200, 0.3, 2)
            let brightnessValue = mapSpeed(speed, 70, 0, 1.3)
            let blurValue = mapSpeed(speed, 90, 20, 0)
            // Updated to match the exact 600 starting value from your HTML fix
            let grayscaleValue = mapSpeed(speed, 90, 600, 0)

            gsap.killTweensOf([slot.wrapper, slot.inner])

            if (slot.inner.style.backgroundImage !== `url(${imgSrc})`) {
                slot.inner.style.backgroundImage = `url(${imgSrc})`
            }
            slot.wrapper.style.zIndex = zIndex.current

            const tl = gsap
                .timeline({
                    onStart: () => {
                        activeCount.current++
                        isIdle.current = false
                    },
                    onComplete: () => {
                        activeCount.current--
                        if (activeCount.current === 0) isIdle.current = true
                        if (zIndex.current !== 1 && isIdle.current)
                            zIndex.current = 1
                    },
                })
                .fromTo(
                    slot.wrapper,
                    {
                        opacity: 1,
                        scale: 0,
                        x: cacheMousePos.current.x - offsetX - imgWidth / 2,
                        y: cacheMousePos.current.y - offsetY - imgHeight / 2,
                        xPercent: 0,
                        yPercent: 0,
                        rotation: 0,
                        force3D: true,
                    },
                    {
                        duration: 0.8,
                        ease: "power3",
                        scale: scaleFactor,
                        filter: `grayscale(${grayscaleValue * 100}%) brightness(${brightnessValue * 100}%) blur(${blurValue}px)`,
                        x: mousePos.current.x - offsetX - imgWidth / 2,
                        y: mousePos.current.y - offsetY - imgHeight / 2,
                    },
                    0
                )
                .fromTo(
                    slot.inner,
                    {
                        scale: 2,
                        force3D: true,
                    },
                    {
                        duration: 0.8,
                        ease: "power3",
                        scale: 1,
                    },
                    0
                )
                .to(
                    slot.wrapper,
                    {
                        duration: 0.4,
                        ease: "power3.in",
                        opacity: 0,
                        scale: 0.2,
                    },
                    0.45
                )
        }

        const showNextImageQueueLimit = () => {
            imgIndex.current =
                imgIndex.current < images.length - 1 ? imgIndex.current + 1 : 0
            zIndex.current++

            const imgEl = imageRefs.current[imgIndex.current]
            if (!imgEl) return

            visibleCount.current++

            const offsetX = containerRect.current.left
            const offsetY = containerRect.current.top

            const imgWidth = imageWidth
            const imgHeight = imageHeight
            const scaleValue = gsap.utils.random(0.5, 1.6)

            gsap.killTweensOf(imgEl)
            gsap.fromTo(
                imgEl,
                {
                    scale:
                        scaleValue - Math.max(gsap.utils.random(0.2, 0.6), 0),
                    rotationZ: 0,
                    opacity: 1,
                    zIndex: zIndex.current,
                    x: cacheMousePos.current.x - offsetX - imgWidth / 2,
                    y: cacheMousePos.current.y - offsetY - imgHeight / 2,
                    force3D: true,
                },
                {
                    duration: 0.4,
                    ease: "power3",
                    scale: scaleValue,
                    rotationZ: gsap.utils.random(-3, 3),
                    x: mousePos.current.x - offsetX - imgWidth / 2,
                    y: mousePos.current.y - offsetY - imgHeight / 2,
                    onStart: () => {
                        activeCount.current++
                        isIdle.current = false
                    },
                    onComplete: () => {
                        activeCount.current--
                    },
                }
            )

            if (visibleCount.current >= visibleImagesTotal) {
                const lastInQueue =
                    (((imgIndex.current - visibleImagesTotal) % images.length) +
                        images.length) %
                    images.length
                const imgToHide = imageRefs.current[lastInQueue]
                if (imgToHide) {
                    gsap.to(imgToHide, {
                        duration: 0.4,
                        ease: "power4",
                        opacity: 0,
                        scale: 1.3,
                        onComplete: () => {
                            if (activeCount.current === 0) isIdle.current = true
                        },
                    })
                }
            }
        }

        const showNextImageScatter = () => {
            const pool = trail1PoolRefs.current
            if (!pool.length) return

            trail1PoolIndex.current =
                trail1PoolIndex.current < pool.length - 1
                    ? trail1PoolIndex.current + 1
                    : 0
            const slot = pool[trail1PoolIndex.current]
            if (
                !slot ||
                !slot.wrapper ||
                !slot.inners ||
                slot.inners.length === 0
            )
                return

            const imgSrc = images[imgIndex.current % images.length]
            imgIndex.current++
            zIndex.current++

            const offsetX = containerRect.current.left
            const offsetY = containerRect.current.top

            const imgWidth = imageWidth
            const imgHeight = imageHeight

            const currentX = mousePos.current.x - offsetX - imgWidth / 2
            const currentY = mousePos.current.y - offsetY - imgHeight / 2

            gsap.killTweensOf([slot.wrapper, ...slot.inners])

            slot.inners.forEach((inner) => {
                if (inner && inner.style.backgroundImage !== `url(${imgSrc})`) {
                    inner.style.backgroundImage = `url(${imgSrc})`
                }
            })

            slot.wrapper.style.zIndex = zIndex.current

            const tl = gsap.timeline({
                onStart: () => {
                    activeCount.current++
                    isIdle.current = false
                },
                onComplete: () => {
                    activeCount.current--
                    if (activeCount.current === 0) isIdle.current = true
                    if (zIndex.current !== 1 && isIdle.current)
                        zIndex.current = 1
                },
            })

            tl.set(
                slot.wrapper,
                {
                    opacity: 1,
                    x: currentX,
                    y: currentY,
                    xPercent: 0,
                    yPercent: 0,
                    rotation: 0,
                    scale: 1,
                    force3D: true,
                },
                0
            )
                .set(
                    slot.inners,
                    {
                        x: 0,
                        y: 0,
                        scale: 1,
                        opacity: 1,
                        force3D: true,
                    },
                    0
                )
                .to(
                    slot.inners,
                    {
                        duration: 0.3,
                        ease: "power3",
                        x: () => gsap.utils.random(-20, 20),
                        y: () => gsap.utils.random(-20, 20),
                        opacity: 0,
                        scale: () => gsap.utils.random(0.7, 1),
                        stagger: {
                            each: 0.01,
                            from: "random",
                        },
                        onComplete: () => {
                            gsap.set(slot.wrapper, { opacity: 0 })
                        },
                    },
                    0.05
                )
        }

        const showNextImage3D = () => {
            const pool = trail1PoolRefs.current
            if (!pool.length) return

            trail1PoolIndex.current =
                trail1PoolIndex.current < pool.length - 1
                    ? trail1PoolIndex.current + 1
                    : 0
            const slot = pool[trail1PoolIndex.current]
            if (!slot || !slot.wrapper || !slot.inner) return

            const imgSrc = images[imgIndex.current % images.length]
            imgIndex.current++
            zIndex.current++

            const offsetX = containerRect.current.left
            const offsetY = containerRect.current.top
            const imgWidth = imageWidth
            const imgHeight = imageHeight

            // 3D logic from Variant 9
            const centerX = winsize.current.width / 2
            const centerY = winsize.current.height / 2
            const relX = mousePos.current.x - centerX
            const relY = mousePos.current.y - centerY

            rotation.current.x = -(relY / centerY) * 30
            rotation.current.y = (relX / centerX) * 30
            cachedRotation.current = { ...rotation.current }

            const distanceFromCenter = Math.sqrt(relX * relX + relY * relY)
            const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY)
            const proportion = distanceFromCenter / maxDistance
            zValue.current = proportion * 1200 - 600
            cachedZValue.current = zValue.current

            const normalizedZ = (zValue.current + 600) / 1200
            const brightness = 0.2 + normalizedZ * 2.3

            gsap.killTweensOf([slot.wrapper, slot.inner])

            if (slot.inner.style.backgroundImage !== `url(${imgSrc})`) {
                slot.inner.style.backgroundImage = `url(${imgSrc})`
            }
            slot.wrapper.style.zIndex = zIndex.current

            const tl = gsap.timeline({
                onStart: () => {
                    activeCount.current++
                    isIdle.current = false
                },
                onComplete: () => {
                    activeCount.current--
                    if (activeCount.current === 0) isIdle.current = true
                    if (zIndex.current !== 1 && isIdle.current)
                        zIndex.current = 1
                },
            })

            tl.fromTo(
                slot.wrapper,
                {
                    opacity: 1,
                    scale: 0,
                    z: zValue.current,
                    rotateX: rotation.current.x,
                    rotateY: rotation.current.y,
                    x: mousePos.current.x - offsetX - imgWidth / 2,
                    y: mousePos.current.y - offsetY - imgHeight / 2,
                    filter: `brightness(${brightness})`,
                    xPercent: 0,
                    yPercent: 0,
                    rotation: 0,
                    force3D: true,
                },
                {
                    duration: 1,
                    ease: "expo",
                    scale: 1,
                    z: 0,
                    rotateX: 0,
                    rotateY: 0,
                    filter: "brightness(1)",
                },
                0
            ).to(
                slot.wrapper,
                {
                    duration: 1.2,
                    ease: "power2.in",
                    opacity: 0,
                    z: -1000,
                },
                0.3
            )
        }

        const showNextImageBounce = () => {
            imgIndex.current =
                imgIndex.current < images.length - 1 ? imgIndex.current + 1 : 0
            zIndex.current++

            const imgEl = imageRefs.current[imgIndex.current]
            if (!imgEl) return

            const offsetX = containerRect.current.left
            const offsetY = containerRect.current.top
            const imgWidth = imageWidth
            const imgHeight = imageHeight

            const currentX = mousePos.current.x - offsetX
            const currentY = mousePos.current.y - offsetY

            gsap.killTweensOf(imgEl)

            // Spawn slightly above cursor target point
            gsap.set(imgEl, {
                x: currentX - imgWidth / 2,
                y: currentY - imgHeight / 2 - 25,
                rotation: Math.random() * 24 - 12, // Organic tilt
                opacity: 1,
                scale: 1,
                zIndex: zIndex.current,
                force3D: true,
            })

            activeCount.current++
            isIdle.current = false

            // Drop & Bounce Execution
            gsap.to(imgEl, {
                y: currentY - imgHeight / 2 + 70,
                duration: 0.65,
                ease: "bounce.out",
            })

            // Dissolve Sequence
            gsap.to(imgEl, {
                opacity: 0,
                scale: 0.7,
                duration: 0.4,
                delay: 0.6,
                ease: "power1.in",
                onComplete: () => {
                    activeCount.current--
                    if (activeCount.current === 0) isIdle.current = true
                    if (zIndex.current !== 1 && isIdle.current)
                        zIndex.current = 1
                },
            })
        }

        const runWarmup = () => {
            if (warmedUp.current) return
            warmedUp.current = true
            const OFFSCREEN = -2000

            imageRefs.current.forEach((imgEl) => {
                if (!imgEl) return
                gsap.set(imgEl, {
                    opacity: 1,
                    scale: 1,
                    x: OFFSCREEN,
                    y: OFFSCREEN,
                    force3D: true,
                })
                gsap.to(imgEl, {
                    x: OFFSCREEN + 1,
                    y: OFFSCREEN + 1,
                    duration: 0.02,
                    ease: "power2.out",
                    onComplete: () => {
                        gsap.to(imgEl, {
                            opacity: 0,
                            scale: 0.2,
                            duration: 0.02,
                            ease: "power2.in",
                            onComplete: () => {
                                gsap.set(imgEl, {
                                    opacity: 0,
                                    scale: 1,
                                    x: 0,
                                    y: 0,
                                })
                            },
                        })
                    },
                })
            })

            trail1PoolRefs.current.forEach((slot) => {
                if (
                    !slot ||
                    !slot.wrapper ||
                    !slot.inners ||
                    slot.inners.length === 0
                )
                    return
                gsap.set(slot.wrapper, {
                    x: OFFSCREEN,
                    y: OFFSCREEN,
                    opacity: 1,
                    scale: 1,
                    force3D: true,
                })
                gsap.set(slot.inners, {
                    scale: 2.8,
                    filter: "brightness(250%)",
                    force3D: true,
                })
                gsap.to(slot.wrapper, {
                    x: OFFSCREEN + 1,
                    y: OFFSCREEN + 1,
                    duration: 0.02,
                    ease: "power2.out",
                })
                gsap.to(slot.inners, {
                    scale: 1,
                    filter: "brightness(100%)",
                    duration: 0.02,
                    ease: "power2.out",
                    onComplete: () => {
                        gsap.to(slot.wrapper, {
                            opacity: 0,
                            scale: 0.2,
                            duration: 0.02,
                            ease: "power2.in",
                            onComplete: () => {
                                gsap.set(slot.wrapper, {
                                    opacity: 0,
                                    scale: 1,
                                    x: 0,
                                    y: 0,
                                })
                                gsap.set(slot.inners, {
                                    scale: 1,
                                    filter: "brightness(100%)",
                                })
                            },
                        })
                    },
                })
            })
        }

        runWarmup()

        const tick = () => {
            if (!enableTrail || images.length === 0) return

            const mx = mousePos.current.x
            const my = mousePos.current.y
            const cx = cacheMousePos.current.x
            const cy = cacheMousePos.current.y

            const lerpFactor = Math.max(0.01, 1 - smoothing / 100)
            cacheMousePos.current.x = cx + (mx - cx) * lerpFactor
            cacheMousePos.current.y = cy + (my - cy) * lerpFactor

            const dx = mx - lastMousePos.current.x
            const dy = my - lastMousePos.current.y

            const distSq = dx * dx + dy * dy

            if (distSq > thresholdSq.current) {
                if (trailEffect === "trail2") {
                    showNextImageRecycle()
                } else if (trailEffect === "trail1") {
                    showNextImageDynamic()
                } else if (trailEffect === "trail3") {
                    showNextImageFlyAway()
                } else if (trailEffect === "trail4") {
                    showNextImageMomentum()
                } else if (trailEffect === "trail5") {
                    showNextImageRotation()
                } else if (trailEffect === "trail6") {
                    showNextImageSpeedReactive()
                } else if (trailEffect === "trail7") {
                    showNextImageQueueLimit()
                } else if (trailEffect === "trail8") {
                    showNextImageScatter()
                } else if (trailEffect === "trail9") {
                    showNextImage3D()
                } else if (trailEffect === "trail10") {
                    showNextImageBounce()
                }
                lastMousePos.current.x = mx
                lastMousePos.current.y = my
            }
        }

        // Corrected tick logic to use requestAnimationFrame for smoother updates
        let rafId
        const animate = () => {
            tick()
            rafId = requestAnimationFrame(animate)
        }
        rafId = requestAnimationFrame(animate)

        return () => {
            cancelAnimationFrame(rafId)
        }
    }, [
        isStatic,
        images,
        threshold,
        smoothing,
        enableTrail,
        trailEffect,
        isVisible,
        imagesLoaded,
        imageWidth,
        imageHeight,
    ])

    const handleMouseEnter = (index) => {
        if (isStatic || trailEffect !== "trail10") return
        const img = imageRefs.current[index]
        if (!img) return
        gsap.to(img, {
            scale: 1.15,
            duration: 0.4,
            ease: "back.out(2.5)",
            overwrite: "auto",
        })
    }

    const handleMouseLeave = (index) => {
        if (isStatic || trailEffect !== "trail10") return
        const img = imageRefs.current[index]
        if (!img) return
        gsap.to(img, {
            opacity: 0,
            scale: 0.5,
            duration: 0.3,
            ease: "power2.in",
        })
    }

    // ResizeObserver can report after the first canvas render. Use Framer's
    // injected numeric width immediately so connected frames apply at once.
    const styleWidth = typeof style?.width === "number" ? style.width : null
    const responsiveWidth = containerWidth ?? styleWidth

    const automaticFrameKey =
        responsiveWidth !== null && responsiveWidth <= mobileBreakpoint
            ? "phone"
            : responsiveWidth !== null && responsiveWidth <= tabletBreakpoint
              ? "tablet"
              : "desktop"

    // Framer's canvas can report the internal ComponentInstance width rather
    // than the page breakpoint width. Frame Mode lets each page breakpoint
    // explicitly choose the correct connected frame. Auto remains available
    // for Preview and published responsive layouts.
    const activeFrameKey =
        frameMode && frameMode !== "auto" ? frameMode : automaticFrameKey

    const connectedFrame =
        activeFrameKey === "phone"
            ? phoneFrame || tabletFrame || desktopFrame || children
            : activeFrameKey === "tablet"
              ? tabletFrame || desktopFrame || phoneFrame || children
              : desktopFrame || tabletFrame || phoneFrame || children

    // Keep each responsive connection in its own keyed slot. Without a new
    // key, Framer may reuse the previous ComponentInstance when a different
    // Desktop / Tablet / Phone frame is connected.
    const filledConnectedFrame = (
        <div
            key={activeFrameKey}
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                minWidth: 0,
                minHeight: 0,
                overflow: "hidden",
            }}
        >
            {React.Children.map(connectedFrame, (child) => {
                if (!React.isValidElement(child)) return child

                const element = child as React.ReactElement<any>

                return React.cloneElement(element, {
                    key: `${activeFrameKey}-${element.key ?? "frame"}`,
                    width: "100%",
                    height: "100%",
                    style: {
                        ...(element.props?.style || {}),
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        maxWidth: "100%",
                        minWidth: 0,
                        height: "100%",
                        maxHeight: "100%",
                        minHeight: 0,
                    },
                })
            })}
        </div>
    )

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                // Preserve the concrete size Framer injects on the canvas.
                // Overwriting it with 100% can collapse the component when the
                // surrounding canvas wrapper has no explicit height.
                width: style?.width ?? "100%",
                maxWidth: "100%",
                minWidth: 0,
                height: style?.height ?? "100%",
                minHeight: 0,
                overflow: "hidden",
                background: background,
                backgroundImage: backgroundImage
                    ? `url(${backgroundImage})`
                    : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
                perspective:
                    !isStatic && trailEffect === "trail9" ? 1000 : "none",
                transformStyle:
                    !isStatic && trailEffect === "trail9"
                        ? "preserve-3d"
                        : "flat",
            }}
        >
            <div
                style={{
                    zIndex: 10,
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    minWidth: 0,
                    minHeight: 0,
                    overflow: "hidden",
                }}
            >
                {filledConnectedFrame}
            </div>

            {/*
                On the Framer canvas and during static export, skip the
                animated trail entirely and render a simple non-animated
                fallback (a single static preview image) instead of the
                interactive GSAP-driven pool/overlay markup.
            */}
            {isStatic
                ? enableTrail &&
                  images &&
                  images.length > 0 && (
                      <div
                          aria-hidden="true"
                          style={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              width: imageWidth,
                              height: imageHeight,
                              borderRadius: 8,
                              overflow: "hidden",
                              boxShadow: "0 10px 20px rgba(0,0,0,0.5)",
                              zIndex: 20,
                          }}
                      >
                          <img
                              src={images[0]}
                              alt=""
                              style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                              }}
                          />
                      </div>
                  )
                : enableTrail && (
                      <div
                          aria-hidden="true"
                          style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              pointerEvents:
                                  trailEffect === "trail10" ? "auto" : "none",
                              overflow:
                                  trailEffect === "trail8"
                                      ? "visible"
                                      : "hidden",
                              zIndex: 20,
                              transformStyle:
                                  trailEffect === "trail9"
                                      ? "preserve-3d"
                                      : "flat",
                          }}
                      >
                          {(trailEffect === "trail2" ||
                              trailEffect === "trail7" ||
                              trailEffect === "trail10") &&
                              images.map((src, index) => (
                                  <div
                                      key={index}
                                      ref={(el) =>
                                          (imageRefs.current[index] = el)
                                      }
                                      onMouseEnter={() =>
                                          handleMouseEnter(index)
                                      }
                                      onMouseLeave={() =>
                                          handleMouseLeave(index)
                                      }
                                      style={{
                                          position: "absolute",
                                          top: 0,
                                          left: 0,
                                          width: imageWidth,
                                          height: imageHeight,
                                          opacity: 0,
                                          borderRadius: 8,
                                          overflow: "hidden",
                                          boxShadow:
                                              "0 10px 20px rgba(0,0,0,0.5)",
                                          willChange: "transform, opacity",
                                          pointerEvents:
                                              trailEffect === "trail10"
                                                  ? "auto"
                                                  : "none",
                                      }}
                                  >
                                      <img
                                          src={src}
                                          alt=""
                                          style={{
                                              width: "100%",
                                              height: "100%",
                                              objectFit: "cover",
                                          }}
                                      />
                                  </div>
                              ))}

                          {(trailEffect === "trail1" ||
                              trailEffect === "trail3" ||
                              trailEffect === "trail4" ||
                              trailEffect === "trail5" ||
                              trailEffect === "trail6" ||
                              trailEffect === "trail8" ||
                              trailEffect === "trail9") &&
                              Array.from({ length: trailPoolSize }).map(
                                  (_, index) => (
                                      <div
                                          key={index}
                                          ref={(el) => {
                                              if (
                                                  !trail1PoolRefs.current[index]
                                              ) {
                                                  trail1PoolRefs.current[
                                                      index
                                                  ] = {
                                                      wrapper: null,
                                                      inner: null,
                                                      inners: [],
                                                  }
                                              }
                                              trail1PoolRefs.current[
                                                  index
                                              ].wrapper = el
                                          }}
                                          style={{
                                              position: "absolute",
                                              top: 0,
                                              left: 0,
                                              width: imageWidth,
                                              height: imageHeight,
                                              opacity: 0,
                                              borderRadius: 8,
                                              overflow:
                                                  trailEffect === "trail8"
                                                      ? "visible"
                                                      : "hidden",
                                              boxShadow:
                                                  "0 10px 20px rgba(0,0,0,0.5)",
                                              backgroundColor: "#333",
                                              willChange: "transform, opacity",
                                              transformStyle:
                                                  trailEffect === "trail9"
                                                      ? "preserve-3d"
                                                      : "flat",
                                              backfaceVisibility:
                                                  trailEffect === "trail9"
                                                      ? "hidden"
                                                      : "visible",
                                          }}
                                      >
                                          {trailEffect === "trail8" ? (
                                              Array.from({ length: 4 }).map(
                                                  (_, i) => (
                                                      <div
                                                          key={i}
                                                          ref={(el) => {
                                                              if (
                                                                  !trail1PoolRefs
                                                                      .current[
                                                                      index
                                                                  ]
                                                              ) {
                                                                  trail1PoolRefs.current[
                                                                      index
                                                                  ] = {
                                                                      wrapper:
                                                                          null,
                                                                      inner: null,
                                                                      inners: [],
                                                                  }
                                                              }
                                                              trail1PoolRefs.current[
                                                                  index
                                                              ].inners[i] = el
                                                          }}
                                                          style={{
                                                              position:
                                                                  "absolute",
                                                              top: 0,
                                                              left: 0,
                                                              width: "100%",
                                                              height: "100%",
                                                              backgroundSize:
                                                                  "cover",
                                                              backgroundPosition:
                                                                  "center",
                                                              boxShadow:
                                                                  "0 10px 20px rgba(0,0,0,0.5)",
                                                              willChange:
                                                                  "transform, filter, opacity",
                                                          }}
                                                      />
                                                  )
                                              )
                                          ) : (
                                              <div
                                                  ref={(el) => {
                                                      if (
                                                          !trail1PoolRefs
                                                              .current[index]
                                                      ) {
                                                          trail1PoolRefs.current[
                                                              index
                                                          ] = {
                                                              wrapper: null,
                                                              inner: null,
                                                              inners: [],
                                                          }
                                                      }
                                                      trail1PoolRefs.current[
                                                          index
                                                      ].inner = el
                                                      trail1PoolRefs.current[
                                                          index
                                                      ].inners[0] = el
                                                  }}
                                                  style={{
                                                      width: "100%",
                                                      height: "100%",
                                                      backgroundSize: "cover",
                                                      backgroundPosition:
                                                          "center",
                                                      willChange:
                                                          "transform, filter",
                                                  }}
                                              />
                                          )}
                                      </div>
                                  )
                              )}
                      </div>
                  )}
        </div>
    )
}

ImageTrail.defaultProps = {
    frameMode: "auto",
    mobileBreakpoint: 809,
    tabletBreakpoint: 1199,
}

addPropertyControls(ImageTrail, {
    desktopFrame: {
        type: ControlType.ComponentInstance,
        title: "Desktop Frame",
    },
    tabletFrame: {
        type: ControlType.ComponentInstance,
        title: "Tablet Frame",
    },
    phoneFrame: {
        type: ControlType.ComponentInstance,
        title: "Phone Frame",
    },
    frameMode: {
        type: ControlType.Enum,
        title: "Frame Mode",
        options: ["auto", "desktop", "tablet", "phone"],
        optionTitles: ["Auto", "Desktop", "Tablet", "Phone"],
        defaultValue: "auto",
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Phone Below",
        defaultValue: 809,
        min: 320,
        max: 1200,
        step: 1,
        unit: "px",
    },
    tabletBreakpoint: {
        type: ControlType.Number,
        title: "Tablet Below",
        defaultValue: 1199,
        min: 600,
        max: 1600,
        step: 1,
        unit: "px",
    },
    enableTrail: {
        type: ControlType.Boolean,
        defaultValue: true,
        title: "Enable Trail",
    },
    trailEffect: {
        type: ControlType.Enum,
        options: [
            "trail1",
            "trail2",
            "trail3",
            "trail4",
            "trail5",
            "trail6",
            "trail7",
            "trail8",
            "trail9",
            "trail10",
        ],
        optionTitles: [
            "Trail 1 (Dynamic)",
            "Trail 2 (Recycle)",
            "Trail 3 (Fly Away)",
            "Trail 4 (Momentum)",
            "Trail 5 (Rotation)",
            "Trail 6 (Speed Reactive)",
            "Trail 7 (Queue Limit)",
            "Trail 8 (Scatter)",
            "Trail 9 (3D Perspective)",
            "Trail 10 (Falling Bounce)",
        ],
        defaultValue: "trail1",
        title: "Trail Effect",
    },
    background: {
        type: ControlType.Color,
        defaultValue: "#111111",
        title: "Background Color",
    },
    backgroundImage: {
        type: ControlType.Image,
        defaultValue: "",
        title: "Background Image",
    },
    images: {
        type: ControlType.Array,
        propertyControl: { type: ControlType.Image },
        defaultValue: [
            "https://picsum.photos/200/250?random=1",
            "https://picsum.photos/200/250?random=2",
            "https://picsum.photos/200/250?random=3",
            "https://picsum.photos/200/250?random=4",
            "https://picsum.photos/200/250?random=5",
            "https://picsum.photos/200/250?random=6",
            "https://picsum.photos/200/250?random=7",
            "https://picsum.photos/200/250?random=8",
            "https://picsum.photos/200/250?random=9",
            "https://picsum.photos/200/250?random=10",
            "https://picsum.photos/200/250?random=11",
            "https://picsum.photos/200/250?random=12",
        ],
        title: "Trail Images",
    },
    imageWidth: {
        type: ControlType.Number,
        defaultValue: 200,
        min: 10,
        max: 1000,
        step: 1,
        title: "Image Width",
    },
    imageHeight: {
        type: ControlType.Number,
        defaultValue: 250,
        min: 10,
        max: 1000,
        step: 1,
        title: "Image Height",
    },
    threshold: {
        type: ControlType.Number,
        defaultValue: 80,
        min: 10,
        max: 200,
        step: 1,
        title: "Distance Threshold",
    },
    smoothing: {
        type: ControlType.Number,
        defaultValue: 80,
        min: 0,
        max: 99,
        step: 1,
        title: "Smoothing",
        displayStepper: true,
    },
})
