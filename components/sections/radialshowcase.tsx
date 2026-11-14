// Radial product presentation with six circular image frames arranged in a ring against black background
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    motion,
    useMotionValue,
    useTransform,
    animate,
    useInView,
} from "framer-motion"
import { useEffect, useRef, useState, startTransition } from "react"
import type { CSSProperties } from "react"

interface RadialShowcaseProps {
    backgroundColor: string
    ringRadius: number
    imageSize: number
    items: Array<{ image: { src: string; alt: string } }>
    shadowIntensity: number
    rotationSpeed: number
    fallDuration: number
    appearDuration: number
    rotateDuration: number
    style?: CSSProperties
}

/**
 * Radial Product Showcase
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 800
 */
export default function RadialShowcase(props: RadialShowcaseProps) {
    const {
        backgroundColor,
        ringRadius,
        imageSize,
        fallDuration,
        appearDuration,
        rotateDuration,
        items,
        shadowIntensity,
        rotationSpeed,
    } = props

    // Default images array
    const defaultItems = [
        {
            image: {
                src: "https://cdn.leonardo.ai/users/d27c0a4f-51ac-4c7e-a0f5-550a1ad63c4b/generations/1f1389fa-5752-6770-8f3a-ff6be82cf6fd/gpt-image-1.5_A_bright_high-key_close-up_portrait_of_a_woman_resting_a_heavy_glass_dropper_bot-3.jpg",
                alt: "Woman portrait 2",
            },
        },
        {
            image: {
                src: "https://cdn.leonardo.ai/users/b0ce7539-c759-4e37-9dfb-750e22e31a64/generations/7848b11d-516b-47fd-b044-b3673efed31b/variations/alchemyrefiner_alchemymagic_0_7848b11d-516b-47fd-b044-b3673efed31b_0.jpg",
                alt: "Woman portrait 3",
            },
        },
        {
            image: {
                src: "https://cdn.leonardo.ai/users/fa85911c-0fc0-4eae-b3c9-df68553172ba/generations/1f134789-28e5-6f80-8014-314d05c298c9/seedream-4.0_exquisite_high_fashion_photography_of_%D0%92%D0%BE%D1%81%D1%81%D0%BE%D0%B7%D0%B4%D0%B0%D0%B9%D1%82%D0%B5_%D1%80%D0%B5%D0%B4%D0%B0%D0%BA%D1%86%D0%B8%D0%BE%D0%BD-0.jpg",
                alt: "Woman portrait 4",
            },
        },
        {
            image: {
                src: "https://cdn.leonardo.ai/users/7f41f587-ed8f-4c8c-9446-f59c67d84b87/generations/1f1334d6-1230-6760-b77d-46bead76e1cd/seedream-4.5_A_beautiful_young_East_Asian_woman_looking_directly_at_the_camera_smiling_confid-0.jpg",
                alt: "Woman portrait 5",
            },
        },
        {
            image: {
                src: "https://cdn.leonardo.ai/users/e5c8339d-c0e1-40b0-bdd1-8d82379d7a52/generations/1f12f561-8833-6160-b5b5-2e75afd57198/seedream-4.5_A_happy_young_woman_laughing_and_winking_with_a_playful_confident_pose_pointing_-0.jpg",
                alt: "Woman portrait 6",
            },
        },
        {
            image: {
                src: "https://cdn.leonardo.ai/users/e5c8339d-c0e1-40b0-bdd1-8d82379d7a52/generations/1f12f347-353e-6980-9adc-48189dbc5e15/seedream-4.5_A_beautiful_slavic_young_woman_looking_directly_at_the_camera_smiling_confidentl-0.jpg",
                alt: "Woman portrait 7",
            },
        },
        {
            image: {
                src: "https://cdn.leonardo.ai/users/e5c8339d-c0e1-40b0-bdd1-8d82379d7a52/generations/1f129015-3929-6ee0-8551-f8e6a8e29ccb/seedream-4.5_A_stunningly_beautiful_europe_young_woman_with_a_warm_genuine_smile_symmetrical_-0.jpg",
                alt: "Woman portrait 8",
            },
        },
        {
            image: {
                src: "https://cdn.leonardo.ai/users/e5c8339d-c0e1-40b0-bdd1-8d82379d7a52/generations/1f116105-d2f3-6a20-990b-f1857960a4d1/seedream-4.5_Ultra-realistic_studio_portrait_of_a_young_Scandinavian_blonde_woman_wearing_App-0.jpg",
                alt: "Woman portrait 9",
            },
        },
    ]

    // Use provided items or fall back to default
    const displayItems = items && items.length > 0 ? items : defaultItems

    // Calculate positions for images in a circle
    // Starting from top (0°) and going clockwise
    const angleStep = 360 / displayItems.length
    const startAngle = -90 // Start from top

    // Motion value for continuous rotation
    const rotation = useMotionValue(0)
    const counterRotation = useTransform(rotation, (value) => -value)
    const [animationPhase, setAnimationPhase] = useState<
        "appear" | "rotate" | "fall"
    >("appear")
    const [cycleKey, setCycleKey] = useState(0)
    const [fallingIndex, setFallingIndex] = useState(-1)
    const [fallOrder, setFallOrder] = useState<number[]>([])
    const [nextFallTime, setNextFallTime] = useState(0)

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { amount: 0.1 })
    const shouldAnimate = !isStatic && isInView

    // Calculate which item is at the bottom at any given rotation
    const getBottomItemIndex = (currentRotation: number) => {
        // Normalize rotation to 0-360
        const normalizedRotation = ((currentRotation % 360) + 360) % 360

        // Bottom position is at 90 degrees (since we start at -90)
        // Calculate which item is closest to the bottom
        const targetAngle = 90

        let closestIndex = 0
        let minDiff = Infinity

        for (let i = 0; i < displayItems.length; i++) {
            // Skip items that have already fallen
            if (fallOrder.includes(i)) continue

            const itemAngle =
                (startAngle + angleStep * i + normalizedRotation) % 360
            const normalizedItemAngle = ((itemAngle % 360) + 360) % 360

            // Calculate shortest angular distance to bottom
            let diff = Math.abs(normalizedItemAngle - targetAngle)
            if (diff > 180) diff = 360 - diff

            if (diff < minDiff) {
                minDiff = diff
                closestIndex = i
            }
        }

        return closestIndex
    }

    useEffect(() => {
        // Disable animations/timers in Canvas/Export/Thumbnail and when offscreen
        if (!shouldAnimate) return

        let rotationControls
        let phaseTimer
        let checkInterval

        if (animationPhase === "appear") {
            // Start rotation during appear animation
            rotationControls = animate(rotation, rotation.get() + 360, {
                duration: rotationSpeed,
                repeat: Infinity,
                ease: "linear",
            })

            // Wait for appear animation to complete (longest delay + duration)
            phaseTimer = setTimeout(
                () => {
                    startTransition(() => setAnimationPhase("rotate"))
                },
                displayItems.length * 150 + appearDuration * 1000
            )
        } else if (animationPhase === "rotate") {
            // Start continuous rotation
            rotationControls = animate(rotation, rotation.get() + 360, {
                duration: rotationSpeed,
                repeat: Infinity,
                ease: "linear",
            })

            // After rotateDuration seconds, trigger fall
            phaseTimer = setTimeout(() => {
                const bottomIndex = getBottomItemIndex(rotation.get())
                startTransition(() => {
                    setAnimationPhase("fall")
                    setFallOrder([bottomIndex])
                    setFallingIndex(bottomIndex)
                    setNextFallTime(Date.now() + fallDuration * 1000)
                })
            }, rotateDuration * 1000)
        } else if (animationPhase === "fall") {
            // Continue rotation during fall
            rotationControls = animate(rotation, rotation.get() + 360, {
                duration: rotationSpeed,
                repeat: Infinity,
                ease: "linear",
            })

            // Continuously check which item is at the bottom
            checkInterval = setInterval(() => {
                const now = Date.now()
                if (
                    now >= nextFallTime &&
                    fallOrder.length < displayItems.length
                ) {
                    const bottomIndex = getBottomItemIndex(rotation.get())
                    // Make sure we don't drop the same item twice
                    if (!fallOrder.includes(bottomIndex)) {
                        startTransition(() => {
                            setFallOrder((prev) => [...prev, bottomIndex])
                            setFallingIndex(bottomIndex)
                            setNextFallTime(now + fallDuration * 1000)
                        })
                    } else {
                        // If the bottom item has already fallen, find the next available item
                        let nextIndex = -1
                        for (let i = 0; i < displayItems.length; i++) {
                            if (!fallOrder.includes(i)) {
                                nextIndex = i
                                break
                            }
                        }
                        if (nextIndex !== -1) {
                            startTransition(() => {
                                setFallOrder((prev) => [...prev, nextIndex])
                                setFallingIndex(nextIndex)
                                setNextFallTime(now + fallDuration * 1000)
                            })
                        }
                    }
                } else if (
                    fallOrder.length >= displayItems.length &&
                    now >= nextFallTime
                ) {
                    // All items have fallen, restart cycle
                    clearInterval(checkInterval)
                    startTransition(() => {
                        setCycleKey((prev) => prev + 1)
                        setAnimationPhase("appear")
                        setFallingIndex(-1)
                        setFallOrder([])
                        setNextFallTime(0)
                    })
                }
            }, 50) // Check every 50ms
        }

        return () => {
            if (rotationControls) rotationControls.stop()
            if (phaseTimer) clearTimeout(phaseTimer)
            if (checkInterval) clearInterval(checkInterval)
        }
    }, [
        shouldAnimate,
        animationPhase,
        rotationSpeed,
        rotation,
        displayItems.length,
        fallingIndex,
        fallDuration,
        fallOrder,
        angleStep,
        startAngle,
        nextFallTime,
        appearDuration,
        rotateDuration,
    ])

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                backgroundColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
            }}
        >
            <motion.div
                style={{
                    position: "relative",
                    width: ringRadius * 2,
                    height: ringRadius * 2,
                    rotate: shouldAnimate ? rotation : 0,
                }}
            >
                {displayItems.map((item, index) => {
                    const angle = startAngle + angleStep * index
                    const radian = (angle * Math.PI) / 180

                    // Calculate position on the circle
                    const x = Math.cos(radian) * ringRadius
                    const y = Math.sin(radian) * ringRadius

                    // Random rotation for falling item
                    const fallRotation = (Math.random() - 0.5) * 720 // Random rotation between -360 and 360
                    const isFalling =
                        animationPhase === "fall" && index === fallingIndex
                    const hasFallen =
                        fallOrder.includes(index) && index !== fallingIndex

                    return (
                        <motion.div
                            key={`${cycleKey}-${index}`}
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                width: imageSize,
                                height: imageSize,
                                x: x - imageSize / 2,
                                y: y - imageSize / 2,
                                rotate: shouldAnimate ? counterRotation : 0,
                            }}
                        >
                            <motion.div
                                initial={
                                    !shouldAnimate
                                        ? false
                                        : {
                                              scale: 0,
                                              opacity: 0,
                                              filter: "blur(20px)",
                                              y: 0,
                                              rotate: 0,
                                          }
                                }
                                animate={
                                    !shouldAnimate
                                        ? {
                                              scale: 1,
                                              opacity: 1,
                                              filter: "blur(0px)",
                                              y: 0,
                                              rotate: 0,
                                          }
                                        : isFalling
                                          ? {
                                                y: 1000,
                                                opacity: 0,
                                                rotate: fallRotation,
                                                filter: "blur(10px)",
                                            }
                                          : hasFallen
                                            ? {
                                                  y: 1000,
                                                  opacity: 0,
                                                  rotate: 0,
                                                  filter: "blur(10px)",
                                              }
                                            : {
                                                  scale: 1,
                                                  opacity: 1,
                                                  filter: "blur(0px)",
                                                  y: 0,
                                                  rotate: 0,
                                              }
                                }
                                transition={
                                    !shouldAnimate
                                        ? {
                                              duration: 0,
                                          }
                                        : isFalling
                                          ? {
                                                duration: fallDuration,
                                                ease: [0.6, 0.05, 0.8, 0.9],
                                            }
                                          : hasFallen
                                            ? {
                                                  duration: 0,
                                              }
                                            : {
                                                  duration: appearDuration,
                                                  delay: index * 0.15,
                                                  ease: [0.34, 1.56, 0.64, 1],
                                              }
                                }
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: "50%",
                                    overflow: "hidden",
                                    boxShadow: `0 ${shadowIntensity * 4}px ${shadowIntensity * 20}px rgba(0, 0, 0, ${shadowIntensity / 100})`,
                                }}
                            >
                                <img
                                    src={item.image.src}
                                    alt={item.image.alt}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />
                            </motion.div>
                        </motion.div>
                    )
                })}
            </motion.div>
        </div>
    )
}

addPropertyControls(RadialShowcase, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(0, 0, 0, 0.3)",
    },
    ringRadius: {
        type: ControlType.Number,
        title: "Ring Radius",
        defaultValue: 200,
        min: 100,
        max: 500,
        step: 10,
        unit: "px",
    },
    imageSize: {
        type: ControlType.Number,
        title: "Image Size",
        defaultValue: 120,
        min: 80,
        max: 300,
        step: 10,
        unit: "px",
    },
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
            },
        },
        defaultValue: [
            {
                image: {
                    src: "https://cdn.leonardo.ai/users/d27c0a4f-51ac-4c7e-a0f5-550a1ad63c4b/generations/1f1389fa-5752-6770-8f3a-ff6be82cf6fd/gpt-image-1.5_A_bright_high-key_close-up_portrait_of_a_woman_resting_a_heavy_glass_dropper_bot-3.jpg",
                    alt: "Woman portrait 2",
                },
            },
            {
                image: {
                    src: "https://cdn.leonardo.ai/users/b0ce7539-c759-4e37-9dfb-750e22e31a64/generations/7848b11d-516b-47fd-b044-b3673efed31b/variations/alchemyrefiner_alchemymagic_0_7848b11d-516b-47fd-b044-b3673efed31b_0.jpg",
                    alt: "Woman portrait 3",
                },
            },
            {
                image: {
                    src: "https://cdn.leonardo.ai/users/fa85911c-0fc0-4eae-b3c9-df68553172ba/generations/1f134789-28e5-6f80-8014-314d05c298c9/seedream-4.0_exquisite_high_fashion_photography_of_%D0%92%D0%BE%D1%81%D1%81%D0%BE%D0%B7%D0%B4%D0%B0%D0%B9%D1%82%D0%B5_%D1%80%D0%B5%D0%B4%D0%B0%D0%BA%D1%86%D0%B8%D0%BE%D0%BD-0.jpg",
                    alt: "Woman portrait 4",
                },
            },
            {
                image: {
                    src: "https://cdn.leonardo.ai/users/7f41f587-ed8f-4c8c-9446-f59c67d84b87/generations/1f1334d6-1230-6760-b77d-46bead76e1cd/seedream-4.5_A_beautiful_young_East_Asian_woman_looking_directly_at_the_camera_smiling_confid-0.jpg",
                    alt: "Woman portrait 5",
                },
            },
            {
                image: {
                    src: "https://cdn.leonardo.ai/users/e5c8339d-c0e1-40b0-bdd1-8d82379d7a52/generations/1f12f561-8833-6160-b5b5-2e75afd57198/seedream-4.5_A_happy_young_woman_laughing_and_winking_with_a_playful_confident_pose_pointing_-0.jpg",
                    alt: "Woman portrait 6",
                },
            },
            {
                image: {
                    src: "https://cdn.leonardo.ai/users/e5c8339d-c0e1-40b0-bdd1-8d82379d7a52/generations/1f12f347-353e-6980-9adc-48189dbc5e15/seedream-4.5_A_beautiful_slavic_young_woman_looking_directly_at_the_camera_smiling_confidentl-0.jpg",
                    alt: "Woman portrait 7",
                },
            },
            {
                image: {
                    src: "https://cdn.leonardo.ai/users/e5c8339d-c0e1-40b0-bdd1-8d82379d7a52/generations/1f129015-3929-6ee0-8551-f8e6a8e29ccb/seedream-4.5_A_stunningly_beautiful_europe_young_woman_with_a_warm_genuine_smile_symmetrical_-0.jpg",
                    alt: "Woman portrait 8",
                },
            },
            {
                image: {
                    src: "https://cdn.leonardo.ai/users/e5c8339d-c0e1-40b0-bdd1-8d82379d7a52/generations/1f116105-d2f3-6a20-990b-f1857960a4d1/seedream-4.5_Ultra-realistic_studio_portrait_of_a_young_Scandinavian_blonde_woman_wearing_App-0.jpg",
                    alt: "Woman portrait 9",
                },
            },
        ],
    },
    shadowIntensity: {
        type: ControlType.Number,
        title: "Shadow",
        defaultValue: 30,
        min: 0,
        max: 100,
        step: 5,
    },
    rotationSpeed: {
        type: ControlType.Number,
        title: "Rotation Speed",
        defaultValue: 10,
        min: 10,
        max: 120,
        step: 5,
        unit: "s",
    },
    fallDuration: {
        type: ControlType.Number,
        title: "Fall Duration",
        defaultValue: 2,
        min: 0.5,
        max: 5,
        step: 0.1,
        unit: "s",
    },
    appearDuration: {
        type: ControlType.Number,
        title: "Appear Duration",
        defaultValue: 1,
        min: 0.3,
        max: 3,
        step: 0.1,
        unit: "s",
    },
    rotateDuration: {
        type: ControlType.Number,
        title: "Rotate Duration",
        defaultValue: 3,
        min: 3,
        max: 30,
        step: 1,
        unit: "s",
    },
})
