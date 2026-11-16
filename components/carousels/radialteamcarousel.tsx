// Radial Team Carousel - avatars arranged in circle/arc with rotation and center detail card
// Responsive and adjustable to fit any device size, all options working properly
import { useEffect, useState, useRef, useCallback, useMemo, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, useSpring, useTransform, animate, type PanInfo, type AnimationPlaybackControls } from "framer-motion"

interface TeamMember {
    name: string
    role: string
    bio: string
    avatar: { src: string; alt?: string }
    url: string
}

interface RadialTeamCarouselProps {
    members: TeamMember[]
    ctaLabel: string
    ringRadius: number
    ringShape: "full" | "half" | "quarter"
    avatarSize: number
    activeAvatarSize: number
    startAngleOffset: number
    avatarShape: "circle" | "rounded" | "hexagon"
    borderWidth: number
    inactiveBorderColor: string
    activeBorderColor: string
    inactiveOpacity: number
    showNameLabel: boolean
    centerCardWidth: number
    centerCardPadding: number
    centerCardBorderRadius: number
    centerCardBackground: string
    centerCardShadow: boolean
    showRole: boolean
    showBio: boolean
    showCTA: boolean
    dragToRotate: boolean
    dragResistance: number
    autoRotate: boolean
    autoRotateSpeed: number
    autoRotateDirection: "clockwise" | "counterclockwise"
    snapToMember: boolean
    backgroundColor: string
    ringTrackColor: string
    showRingTrack: boolean
    accentColor: string
    rotationSpringStiffness: number
    rotationSpringDamping: number
    cardTransition: "fade" | "slideup" | "scale"
    cardTransitionDuration: number
    nameFont: CSSProperties
    roleFont: CSSProperties
    bioFont: CSSProperties
    ctaFont: CSSProperties
    style?: CSSProperties
}

/**
 * Radial Team Carousel
 * 
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 1000
 * 
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function RadialTeamCarousel(props: RadialTeamCarouselProps) {
    const {
        members = [],
        ctaLabel,
        ringRadius,
        ringShape,
        avatarSize,
        activeAvatarSize,
        startAngleOffset,
        avatarShape,
        borderWidth,
        inactiveBorderColor,
        activeBorderColor,
        inactiveOpacity,
        showNameLabel,
        centerCardWidth,
        centerCardPadding,
        centerCardBorderRadius,
        centerCardBackground,
        centerCardShadow,
        showRole,
        showBio,
        showCTA,
        dragToRotate,
        dragResistance,
        autoRotate,
        autoRotateSpeed,
        autoRotateDirection,
        snapToMember,
        backgroundColor,
        ringTrackColor,
        showRingTrack,
        accentColor,
        rotationSpringStiffness,
        rotationSpringDamping,
        cardTransition,
        cardTransitionDuration,
        nameFont,
        roleFont,
        bioFont,
        ctaFont,
        style,
    } = props

    const [activeIndex, setActiveIndex] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const autoRotateRef = useRef<AnimationPlaybackControls | null>(null)
    const [containerDimensions, setContainerDimensions] = useState({ width: 1000, height: 1000 })
    const [isInView, setIsInView] = useState(true)
    const isStatic = useIsStaticRenderer()

    const rotation = useMotionValue(0)
    const springRotation = useSpring(rotation, {
        stiffness: rotationSpringStiffness,
        damping: rotationSpringDamping,
    })

    // Detect if component is in responsive mode
    const isResponsive = style?.width === "100%" || style?.height === "100%"

    // Update container dimensions on mount and resize
    useEffect(() => {
        if (!containerRef.current) return
        
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                startTransition(() => {
                    setContainerDimensions({ 
                        width: rect.width || 1000, 
                        height: rect.height || 1000 
                    })
                })
            }
        }
        
        updateDimensions()
        
        if (typeof window !== "undefined") {
            const resizeObserver = new ResizeObserver(updateDimensions)
            resizeObserver.observe(containerRef.current)
            
            return () => {
                resizeObserver.disconnect()
            }
        }
    }, [])

    // Intersection Observer for visibility detection
    useEffect(() => {
        if (!containerRef.current || isStatic) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    startTransition(() => {
                        setIsInView(entry.isIntersecting)
                    })
                })
            },
            { threshold: 0.1 }
        )

        observer.observe(containerRef.current)

        return () => {
            observer.disconnect()
        }
    }, [isStatic])

    // Calculate effective avatar sizes
    const effectiveAvatarSize = useMemo(() => {
        if (!isResponsive) return avatarSize
        
        const minDimension = Math.min(containerDimensions.width, containerDimensions.height)
        const maxSize = minDimension / 10
        
        return Math.min(avatarSize, Math.max(maxSize, 40))
    }, [isResponsive, containerDimensions, avatarSize])

    const effectiveActiveAvatarSize = useMemo(() => {
        if (!isResponsive) return activeAvatarSize
        
        const minDimension = Math.min(containerDimensions.width, containerDimensions.height)
        const maxSize = minDimension / 7
        
        return Math.min(activeAvatarSize, Math.max(maxSize, 60))
    }, [isResponsive, containerDimensions, activeAvatarSize])

    // Calculate effective ring radius based on container size
    const effectiveRingRadius = useMemo(() => {
        if (!isResponsive) return ringRadius
        
        // Allow much larger rings - only constrain if truly necessary
        const minDimension = Math.min(containerDimensions.width, containerDimensions.height)
        const maxRadius = (minDimension / 2) - effectiveActiveAvatarSize - 40
        
        // Use the user's ring radius unless it physically won't fit
        return Math.min(ringRadius, Math.max(maxRadius, 100))
    }, [isResponsive, containerDimensions, ringRadius, effectiveActiveAvatarSize])
    
    // Calculate effective card width
    const effectiveCardWidth = useMemo(() => {
        if (!isResponsive) return centerCardWidth
        
        const maxWidth = containerDimensions.width - 40
        return Math.min(centerCardWidth, Math.max(maxWidth, 200))
    }, [isResponsive, containerDimensions.width, centerCardWidth])

    // Calculate angle span based on ring shape
    const angleSpan = useMemo(() => {
        switch (ringShape) {
            case "half":
                return 180
            case "quarter":
                return 90
            default:
                return 360
        }
    }, [ringShape])

    // Calculate angle between members
    const angleStep = useMemo(() => {
        return members.length > 1 ? angleSpan / members.length : 0
    }, [members.length, angleSpan])

    // Get avatar border radius based on shape
    const getAvatarBorderRadius = useCallback((shape: string, size: number) => {
        switch (shape) {
            case "circle":
                return "50%"
            case "rounded":
                return `${size * 0.2}px`
            case "hexagon":
                return `${size * 0.15}px`
            default:
                return "50%"
        }
    }, [])

    // Get hexagon clip path
    const getHexagonClip = useCallback(() => {
        return "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
    }, [])

    // Find closest member index based on rotation
    const getClosestMemberIndex = useCallback(
        (currentRotation: number) => {
            if (members.length === 0) return 0
            const normalizedRotation = ((currentRotation % 360) + 360) % 360
            const targetAngle = (normalizedRotation / angleStep) % members.length
            return Math.round(targetAngle) % members.length
        },
        [members.length, angleStep]
    )

    // Snap to nearest member
    const snapToNearest = useCallback(() => {
        const currentRotation = rotation.get()
        const closestIndex = getClosestMemberIndex(currentRotation)
        const targetRotation = closestIndex * angleStep

        rotation.set(targetRotation)
        startTransition(() => setActiveIndex(closestIndex))
    }, [rotation, getClosestMemberIndex, angleStep])

    // Handle drag
    const handleDrag = useCallback(
        (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            if (!dragToRotate || isStatic) return

            const deltaAngle = info.delta.x * dragResistance * 0.5
            const currentRotation = rotation.get()
            rotation.set(currentRotation + deltaAngle)

            const newIndex = getClosestMemberIndex(currentRotation + deltaAngle)
            if (newIndex !== activeIndex) {
                startTransition(() => setActiveIndex(newIndex))
            }
        },
        [dragToRotate, dragResistance, rotation, getClosestMemberIndex, activeIndex, isStatic]
    )

    const handleDragStart = useCallback(() => {
        if (isStatic) return
        startTransition(() => setIsDragging(true))
        if (autoRotateRef.current) {
            autoRotateRef.current.stop()
        }
    }, [isStatic])

    const handleDragEnd = useCallback(() => {
        if (isStatic) return
        startTransition(() => setIsDragging(false))
        if (snapToMember) {
            snapToNearest()
        }
    }, [snapToMember, snapToNearest, isStatic])

    // Auto rotation
    useEffect(() => {
        if (autoRotate && !isDragging && members.length > 0 && isInView && !isStatic) {
            const direction = autoRotateDirection === "clockwise" ? 1 : -1

            autoRotateRef.current = animate(rotation, rotation.get() + 360 * direction, {
                duration: 360 / Math.abs(autoRotateSpeed),
                ease: "linear",
                repeat: Infinity,
                onUpdate: (latest) => {
                    const newIndex = getClosestMemberIndex(latest)
                    if (newIndex !== activeIndex) {
                        startTransition(() => setActiveIndex(newIndex))
                    }
                },
            })

            return () => {
                if (autoRotateRef.current) {
                    autoRotateRef.current.stop()
                }
            }
        } else {
            // Stop auto-rotation when not in view or static rendering
            if (autoRotateRef.current) {
                autoRotateRef.current.stop()
            }
        }
    }, [autoRotate, autoRotateSpeed, autoRotateDirection, isDragging, rotation, getClosestMemberIndex, activeIndex, members.length, isInView, isStatic])

    // Navigate to specific member
    const navigateToMember = useCallback(
        (index: number) => {
            const targetRotation = index * angleStep
            rotation.set(targetRotation)
            startTransition(() => setActiveIndex(index))
        },
        [rotation, angleStep]
    )

    // Card transition variants
    const cardVariants = useMemo(() => {
        const duration = cardTransitionDuration / 1000

        switch (cardTransition) {
            case "slideup":
                return {
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 },
                    exit: { opacity: 0, y: -20 },
                    transition: { duration },
                }
            case "scale":
                return {
                    initial: { opacity: 0, scale: 0.9 },
                    animate: { opacity: 1, scale: 1 },
                    exit: { opacity: 0, scale: 0.9 },
                    transition: { duration },
                }
            default:
                return {
                    initial: { opacity: 0 },
                    animate: { opacity: 1 },
                    exit: { opacity: 0 },
                    transition: { duration },
                }
        }
    }, [cardTransition, cardTransitionDuration])

    const activeMember = members[activeIndex] || members[0]

    // Calculate card position based on available space
    const cardBottomPosition = useMemo(() => {
        const minDimension = Math.min(containerDimensions.width, containerDimensions.height)
        const centerY = containerDimensions.height / 2
        const ringBottom = centerY + effectiveRingRadius + effectiveActiveAvatarSize / 2
        const availableSpace = containerDimensions.height - ringBottom
        
        return Math.max(10, Math.min(40, availableSpace / 3))
    }, [containerDimensions, effectiveRingRadius, effectiveActiveAvatarSize])

    if (members.length === 0) {
        return (
            <div
                style={{
                    ...style,
                    width: "100%",
                    height: "100%",
                    backgroundColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <p style={{ color: "#999", fontSize: 16 }}>Add team members to get started</p>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                backgroundColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Ring Track */}
            {showRingTrack && (
                <div
                    style={{
                        position: "absolute",
                        width: effectiveRingRadius * 2,
                        height: effectiveRingRadius * 2,
                        borderRadius: "50%",
                        border: `2px dashed ${ringTrackColor}`,
                        opacity: 0.3,
                        pointerEvents: "none",
                    }}
                />
            )}

            {/* Avatar Ring */}
            <motion.div
                drag={dragToRotate && !isStatic}
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0}
                onDrag={isStatic ? undefined : handleDrag}
                onDragStart={isStatic ? undefined : handleDragStart}
                onDragEnd={isStatic ? undefined : handleDragEnd}
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    cursor: dragToRotate && !isStatic ? (isDragging ? "grabbing" : "grab") : "default",
                }}
            >
                {members.map((member, index) => {
                    const isActive = index === activeIndex
                    const avatarSrc = member.avatar?.src || "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"
                    const avatarAlt = member.avatar?.alt || member.name

                    return (
                        <motion.div
                            key={index}
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                x: useTransform(springRotation, (r) => {
                                    const baseAngle = startAngleOffset + index * angleStep
                                    const totalAngle = baseAngle - r

                                    let adjustedAngle = totalAngle
                                    if (ringShape === "half") {
                                        adjustedAngle = totalAngle - 90
                                    } else if (ringShape === "quarter") {
                                        adjustedAngle = totalAngle - 45
                                    }

                                    const rad = (adjustedAngle * Math.PI) / 180
                                    return Math.cos(rad) * effectiveRingRadius
                                }),
                                y: useTransform(springRotation, (r) => {
                                    const baseAngle = startAngleOffset + index * angleStep
                                    const totalAngle = baseAngle - r

                                    let adjustedAngle = totalAngle
                                    if (ringShape === "half") {
                                        adjustedAngle = totalAngle - 90
                                    } else if (ringShape === "quarter") {
                                        adjustedAngle = totalAngle - 45
                                    }

                                    const rad = (adjustedAngle * Math.PI) / 180
                                    return Math.sin(rad) * effectiveRingRadius
                                }),
                            }}
                            onClick={() => navigateToMember(index)}
                        >
                            <motion.div
                                animate={{
                                    scale: isActive ? 1 : effectiveAvatarSize / effectiveActiveAvatarSize,
                                    opacity: isActive ? 1 : inactiveOpacity,
                                }}
                                transition={{ duration: 0.3 }}
                                style={{
                                    width: effectiveActiveAvatarSize,
                                    height: effectiveActiveAvatarSize,
                                    position: "relative",
                                    cursor: "pointer",
                                    transform: "translate(-50%, -50%)",
                                }}
                            >
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: getAvatarBorderRadius(avatarShape, effectiveActiveAvatarSize),
                                        border: `${borderWidth}px solid ${
                                            isActive ? activeBorderColor : inactiveBorderColor
                                        }`,
                                        overflow: "hidden",
                                        clipPath: avatarShape === "hexagon" ? getHexagonClip() : undefined,
                                        backgroundColor: "#f0f0f0",
                                    }}
                                >
                                    <img
                                        src={avatarSrc}
                                        alt={avatarAlt}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                </div>

                                {showNameLabel && !isActive && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "100%",
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            marginTop: 8,
                                            whiteSpace: "nowrap",
                                            fontSize: 12,
                                            fontWeight: 500,
                                            color: "#666",
                                            ...nameFont,
                                        }}
                                    >
                                        {member.name}
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )
                })}
            </motion.div>

            {/* Center Detail Card */}
            {activeMember && (
                <motion.div
                    key={activeIndex}
                    {...cardVariants}
                    style={{
                        position: "absolute",
                        bottom: cardBottomPosition,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: effectiveCardWidth,
                        maxWidth: "calc(100% - 40px)",
                        padding: centerCardPadding,
                        backgroundColor: centerCardBackground,
                        borderRadius: centerCardBorderRadius,
                        boxShadow: centerCardShadow ? "0 10px 40px rgba(0,0,0,0.15)" : "none",
                        textAlign: "center",
                        zIndex: 10,
                    }}
                >
                    <h3
                        style={{
                            margin: 0,
                            marginBottom: showRole ? 8 : 16,
                            color: "#000",
                            ...nameFont,
                        }}
                    >
                        {activeMember.name}
                    </h3>

                    {showRole && (
                        <p
                            style={{
                                margin: 0,
                                marginBottom: showBio ? 12 : 16,
                                color: accentColor,
                                ...roleFont,
                            }}
                        >
                            {activeMember.role}
                        </p>
                    )}

                    {showBio && (
                        <p
                            style={{
                                margin: 0,
                                marginBottom: showCTA ? 20 : 0,
                                color: "#666",
                                ...bioFont,
                            }}
                        >
                            {activeMember.bio}
                        </p>
                    )}

                    {showCTA && (
                        <a
                            href={activeMember.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: "inline-block",
                                padding: "12px 24px",
                                backgroundColor: accentColor,
                                color: "#fff",
                                borderRadius: 8,
                                textDecoration: "none",
                                ...ctaFont,
                            }}
                        >
                            {ctaLabel}
                        </a>
                    )}
                </motion.div>
            )}
        </div>
    )
}

addPropertyControls(RadialTeamCarousel, {
    members: {
        type: ControlType.Array,
        title: "Members",
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Team Member",
                },
                role: {
                    type: ControlType.String,
                    title: "Role",
                    defaultValue: "Position",
                },
                bio: {
                    type: ControlType.String,
                    title: "Bio",
                    defaultValue: "A brief description about this team member.",
                    displayTextArea: true,
                },
                avatar: {
                    type: ControlType.ResponsiveImage,
                    title: "Avatar",
                },
                url: {
                    type: ControlType.String,
                    title: "URL",
                    defaultValue: "https://framer.link/dulaj80",
                },
            },
        },
        defaultValue: [
            {
                name: "Alex Chen",
                role: "Creative Director",
                bio: "Leading design innovation with 10+ years of experience.",
                avatar: { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Alex" },
                url: "https://framer.link/dulaj80",
            },
            {
                name: "Sarah Johnson",
                role: "Lead Developer",
                bio: "Building scalable solutions with modern technologies.",
                avatar: { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Sarah" },
                url: "https://framer.link/dulaj80",
            },
            {
                name: "Marcus Lee",
                role: "Product Manager",
                bio: "Driving product strategy and user-centered design.",
                avatar: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Marcus",
                },
                url: "https://framer.link/dulaj80",
            },
            {
                name: "Emma Davis",
                role: "UX Researcher",
                bio: "Uncovering insights that shape exceptional experiences.",
                avatar: { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Emma" },
                url: "https://framer.link/dulaj80",
            },
            {
                name: "James Wilson",
                role: "Brand Strategist",
                bio: "Crafting compelling narratives that resonate.",
                avatar: { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "James" },
                url: "https://framer.link/dulaj80",
            },
            {
                name: "Olivia Martinez",
                role: "Marketing Lead",
                bio: "Connecting brands with audiences through data-driven campaigns.",
                avatar: { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Olivia" },
                url: "https://framer.link/dulaj80",
            },
            {
                name: "Ryan Park",
                role: "Tech Lead",
                bio: "Architecting robust systems for tomorrow's challenges.",
                avatar: { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Ryan" },
                url: "https://framer.link/dulaj80",
            },
            {
                name: "Sophie Anderson",
                role: "Content Director",
                bio: "Telling stories that inspire and engage audiences.",
                avatar: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Sophie",
                },
                url: "https://framer.link/dulaj80",
            },
        ],
        maxCount: 12,
    },
    ctaLabel: {
        type: ControlType.String,
        title: "CTA Label",
        defaultValue: "Meet Them",
    },
    ringRadius: {
        type: ControlType.Number,
        title: "Ring Radius",
        defaultValue: 320,
        min: 100,
        max: 800,
        step: 10,
        unit: "px",
    },
    ringShape: {
        type: ControlType.Enum,
        title: "Ring Shape",
        options: ["full", "half", "quarter"],
        optionTitles: ["Full Circle", "Half Arc", "Quarter Arc"],
        defaultValue: "full",
        displaySegmentedControl: true,
    },
    avatarSize: {
        type: ControlType.Number,
        title: "Avatar Size",
        defaultValue: 72,
        min: 40,
        max: 120,
        step: 4,
        unit: "px",
    },
    activeAvatarSize: {
        type: ControlType.Number,
        title: "Active Avatar Size",
        defaultValue: 110,
        min: 60,
        max: 180,
        step: 5,
        unit: "px",
    },
    startAngleOffset: {
        type: ControlType.Number,
        title: "Start Angle Offset",
        defaultValue: 0,
        min: 0,
        max: 360,
        step: 15,
        unit: "°",
    },
    avatarShape: {
        type: ControlType.Enum,
        title: "Avatar Shape",
        options: ["circle", "rounded", "hexagon"],
        optionTitles: ["Circle", "Rounded", "Hexagon"],
        defaultValue: "circle",
        displaySegmentedControl: true,
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 3,
        min: 0,
        max: 10,
        step: 1,
        unit: "px",
    },
    inactiveBorderColor: {
        type: ControlType.Color,
        title: "Inactive Border",
        defaultValue: "#DDDDDD",
    },
    activeBorderColor: {
        type: ControlType.Color,
        title: "Active Border",
        defaultValue: "#4F46E5",
    },
    inactiveOpacity: {
        type: ControlType.Number,
        title: "Inactive Opacity",
        defaultValue: 0.6,
        min: 0,
        max: 1,
        step: 0.1,
    },
    showNameLabel: {
        type: ControlType.Boolean,
        title: "Show Name Label",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    centerCardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 300,
        min: 200,
        max: 500,
        step: 10,
        unit: "px",
    },
    centerCardPadding: {
        type: ControlType.Number,
        title: "Card Padding",
        defaultValue: 32,
        min: 16,
        max: 64,
        step: 4,
        unit: "px",
    },
    centerCardBorderRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 24,
        min: 0,
        max: 48,
        step: 4,
        unit: "px",
    },
    centerCardBackground: {
        type: ControlType.Color,
        title: "Card Background",
        defaultValue: "#FFFFFF",
    },
    centerCardShadow: {
        type: ControlType.Boolean,
        title: "Card Shadow",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showRole: {
        type: ControlType.Boolean,
        title: "Show Role",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showBio: {
        type: ControlType.Boolean,
        title: "Show Bio",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showCTA: {
        type: ControlType.Boolean,
        title: "Show CTA",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    dragToRotate: {
        type: ControlType.Boolean,
        title: "Drag to Rotate",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    dragResistance: {
        type: ControlType.Number,
        title: "Drag Resistance",
        defaultValue: 0.6,
        min: 0.1,
        max: 2,
        step: 0.1,
    },
    autoRotate: {
        type: ControlType.Boolean,
        title: "Auto Rotate",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoRotateSpeed: {
        type: ControlType.Number,
        title: "Auto Rotate Speed",
        defaultValue: 20,
        min: 5,
        max: 60,
        step: 5,
        unit: "°/s",
        hidden: ({ autoRotate }) => !autoRotate,
    },
    autoRotateDirection: {
        type: ControlType.Enum,
        title: "Auto Direction",
        options: ["clockwise", "counterclockwise"],
        optionTitles: ["Clockwise", "Counter-Clockwise"],
        defaultValue: "clockwise",
        hidden: ({ autoRotate }) => !autoRotate,
    },
    snapToMember: {
        type: ControlType.Boolean,
        title: "Snap to Member",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F8F8F8",
    },
    ringTrackColor: {
        type: ControlType.Color,
        title: "Ring Track Color",
        defaultValue: "#E8E8E8",
    },
    showRingTrack: {
        type: ControlType.Boolean,
        title: "Show Ring Track",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#4F46E5",
    },
    rotationSpringStiffness: {
        type: ControlType.Number,
        title: "Spring Stiffness",
        defaultValue: 200,
        min: 50,
        max: 500,
        step: 10,
    },
    rotationSpringDamping: {
        type: ControlType.Number,
        title: "Spring Damping",
        defaultValue: 25,
        min: 10,
        max: 50,
        step: 5,
    },
    cardTransition: {
        type: ControlType.Enum,
        title: "Card Transition",
        options: ["fade", "slideup", "scale"],
        optionTitles: ["Fade", "Slide Up", "Scale"],
        defaultValue: "fade",
        displaySegmentedControl: true,
    },
    cardTransitionDuration: {
        type: ControlType.Number,
        title: "Transition Duration",
        defaultValue: 350,
        min: 100,
        max: 1000,
        step: 50,
        unit: "ms",
    },
    nameFont: {
        type: ControlType.Font,
        title: "Name Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "22px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    roleFont: {
        type: ControlType.Font,
        title: "Role Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    bioFont: {
        type: ControlType.Font,
        title: "Bio Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    ctaFont: {
        type: ControlType.Font,
        title: "CTA Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
})
