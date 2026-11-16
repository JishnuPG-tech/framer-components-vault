import { useState, type CSSProperties, type MouseEvent } from "react"
import {
    motion,
    useTransform,
    AnimatePresence,
    useMotionValue,
    useSpring,
} from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface AvatarPerson {
    name?: string
    designation?: string
    image?: {
        src: string
        srcSet?: string
        alt?: string
    }
}

interface RSAvatarTooltipProps {
    name1?: string
    designation1?: string
    image1?: {
        src: string
        srcSet?: string
        alt?: string
    }

    name2?: string
    designation2?: string
    image2?: {
        src: string
        srcSet?: string
        alt?: string
    }

    name3?: string
    designation3?: string
    image3?: {
        src: string
        srcSet?: string
        alt?: string
    }

    name4?: string
    designation4?: string
    image4?: {
        src: string
        srcSet?: string
        alt?: string
    }

    name5?: string
    designation5?: string
    image5?: {
        src: string
        srcSet?: string
        alt?: string
    }

    name6?: string
    designation6?: string
    image6?: {
        src: string
        srcSet?: string
        alt?: string
    }

    avatarSize: number
    avatarOverlap: number
    tooltipBackground: string
    nameColor: string
    designationColor: string
    borderColor: string
    style?: CSSProperties
}

/**
 * RS Avatar Tooltip
 *
 * Overlapping avatar group with interactive hover tooltips.
 *
 * Static-renderer safe:
 * animations and hover interactions are disabled
 * when rendered by Framer's static renderer.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function RSAvatarTooltip(props: RSAvatarTooltipProps) {
    const {
        avatarSize = 56,
        avatarOverlap = 14,
        tooltipBackground = "#000000",
        nameColor = "#FFFFFF",
        designationColor = "rgba(255, 255, 255, 0.6)",
        borderColor = "#FFFFFF",
        style,
    } = props

    /*
     * IMPORTANT:
     * Framer Marketplace static renderer check.
     *
     * When true, we render a completely static version.
     * No hover state, spring, animation, or continuous effect
     * is used in the static renderer.
     */
    const isStatic = useIsStaticRenderer()

    const people: AvatarPerson[] = [
        {
            name: props.name1,
            designation: props.designation1,
            image: props.image1,
        },
        {
            name: props.name2,
            designation: props.designation2,
            image: props.image2,
        },
        {
            name: props.name3,
            designation: props.designation3,
            image: props.image3,
        },
        {
            name: props.name4,
            designation: props.designation4,
            image: props.image4,
        },
        {
            name: props.name5,
            designation: props.designation5,
            image: props.image5,
        },
        {
            name: props.name6,
            designation: props.designation6,
            image: props.image6,
        },
    ].filter((person) => Boolean(person.image?.src))

    const containerStyle: CSSProperties = {
        position: "relative",
        display: "flex",
        alignItems: "center",
        width: "max-content",
        height: avatarSize,
        ...style,
    }

    /*
     * STATIC VERSION
     *
     * This branch intentionally contains:
     * - no useState
     * - no motion components
     * - no AnimatePresence
     * - no springs
     * - no mouse tracking
     * - no hover animation
     */
    if (isStatic) {
        return (
            <div style={containerStyle}>
                {people.map((person, index) => (
                    <div
                        key={`static-avatar-${index}`}
                        style={{
                            position: "relative",
                            width: avatarSize,
                            height: avatarSize,
                            flexShrink: 0,
                            marginLeft: index === 0 ? 0 : -avatarOverlap,
                            zIndex: people.length - index,
                        }}
                    >
                        <img
                            src={person.image?.src}
                            srcSet={person.image?.srcSet}
                            width={avatarSize}
                            height={avatarSize}
                            alt={person.name || person.image?.alt || ""}
                            draggable={false}
                            style={{
                                display: "block",
                                width: avatarSize,
                                height: avatarSize,
                                objectFit: "cover",
                                objectPosition: "top",
                                borderRadius: "50%",
                                border: `2px solid ${borderColor}`,
                                boxSizing: "border-box",
                            }}
                        />
                    </div>
                ))}
            </div>
        )
    }

    /*
     * INTERACTIVE VERSION
     */
    return (
        <div style={containerStyle}>
            {people.map((person, index) => (
                <RSAvatarTooltipItem
                    key={`interactive-avatar-${index}`}
                    person={person}
                    avatarSize={avatarSize}
                    avatarOverlap={avatarOverlap}
                    tooltipBackground={tooltipBackground}
                    nameColor={nameColor}
                    designationColor={designationColor}
                    borderColor={borderColor}
                    isFirst={index === 0}
                />
            ))}
        </div>
    )
}

/**
 * Individual interactive avatar.
 */
function RSAvatarTooltipItem({
    person,
    avatarSize,
    avatarOverlap,
    tooltipBackground,
    nameColor,
    designationColor,
    borderColor,
    isFirst,
}: {
    person: AvatarPerson
    avatarSize: number
    avatarOverlap: number
    tooltipBackground: string
    nameColor: string
    designationColor: string
    borderColor: string
    isFirst: boolean
}) {
    const [hovered, setHovered] = useState(false)

    const x = useMotionValue(0)

    const springConfig = {
        stiffness: 100,
        damping: 5,
    }

    const rotate = useSpring(
        useTransform(x, [-100, 100], [-45, 45]),
        springConfig
    )

    const translateX = useSpring(
        useTransform(x, [-100, 100], [-50, 50]),
        springConfig
    )

    function handleMouseMove(event: MouseEvent<HTMLImageElement>) {
        const target = event.currentTarget
        const halfWidth = target.offsetWidth / 2

        x.set(event.nativeEvent.offsetX - halfWidth)
    }

    return (
        <div
            style={{
                position: "relative",
                width: avatarSize,
                height: avatarSize,
                flexShrink: 0,
                marginLeft: isFirst ? 0 : -avatarOverlap,
                zIndex: hovered ? 100 : 1,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <AnimatePresence mode="popLayout">
                {hovered && (
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 20,
                            scale: 0.6,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            transition: {
                                type: "spring",
                                stiffness: 260,
                                damping: 10,
                            },
                        }}
                        exit={{
                            opacity: 0,
                            y: 20,
                            scale: 0.6,
                        }}
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: -70,

                            translateX,
                            rotate,

                            whiteSpace: "nowrap",

                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",

                            padding: "8px 16px",

                            borderRadius: 8,

                            backgroundColor: tooltipBackground,

                            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.35)",

                            zIndex: 200,

                            pointerEvents: "none",

                            boxSizing: "border-box",
                        }}
                    >
                        <div
                            style={{
                                position: "relative",
                                zIndex: 2,

                                fontWeight: 700,
                                color: nameColor,

                                fontSize: 15,
                                lineHeight: 1.3,
                            }}
                        >
                            {person.name}
                        </div>

                        <div
                            style={{
                                color: designationColor,

                                fontSize: 12,
                                lineHeight: 1.3,

                                marginTop: 2,
                            }}
                        >
                            {person.designation}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <img
                onMouseMove={handleMouseMove}
                src={person.image?.src}
                srcSet={person.image?.srcSet}
                width={avatarSize}
                height={avatarSize}
                alt={person.name || person.image?.alt || ""}
                draggable={false}
                style={{
                    display: "block",

                    width: avatarSize,
                    height: avatarSize,

                    objectFit: "cover",
                    objectPosition: "top",

                    borderRadius: "50%",

                    border: `2px solid ${borderColor}`,

                    boxSizing: "border-box",

                    position: "relative",

                    transition: "transform 0.3s ease",

                    transform: hovered ? "scale(1.08)" : "scale(1)",
                }}
            />
        </div>
    )
}

/**
 * Property controls
 */
function personFieldControls(n: number) {
    return {
        [`name${n}`]: {
            type: ControlType.String,
            title: `Person ${n} Name`,
            defaultValue: "",
        },

        [`designation${n}`]: {
            type: ControlType.String,
            title: `Person ${n} Role`,
            defaultValue: "",
        },

        [`image${n}`]: {
            type: ControlType.ResponsiveImage,
            title: `Person ${n} Image`,
        },
    }
}

addPropertyControls(RSAvatarTooltip, {
    ...personFieldControls(1),
    ...personFieldControls(2),
    ...personFieldControls(3),
    ...personFieldControls(4),
    ...personFieldControls(5),
    ...personFieldControls(6),

    avatarSize: {
        type: ControlType.Number,
        title: "Avatar Size",
        defaultValue: 56,
        min: 24,
        max: 120,
        step: 1,
        unit: "px",
    },

    avatarOverlap: {
        type: ControlType.Number,
        title: "Avatar Overlap",
        defaultValue: 14,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },

    tooltipBackground: {
        type: ControlType.Color,
        title: "Tooltip Background",
        defaultValue: "#000000",
    },

    nameColor: {
        type: ControlType.Color,
        title: "Name Color",
        defaultValue: "#FFFFFF",
    },

    designationColor: {
        type: ControlType.Color,
        title: "Role Color",
        defaultValue: "rgba(255, 255, 255, 0.6)",
    },

    borderColor: {
        type: ControlType.Color,
        title: "Avatar Border",
        defaultValue: "#FFFFFF",
    },
})
