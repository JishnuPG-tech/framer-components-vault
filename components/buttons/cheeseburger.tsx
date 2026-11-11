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
import { useCallback, useState, type CSSProperties } from "react"

interface BurgerMenuProps {
    color: string
    size: number
    lineThickness: number
    lineGap: number
    rounded: boolean
    livelyHover: boolean
    transition?: any
    onToggle?: (open: boolean) => void
    style?: CSSProperties
}

/**
 * Burger Menu
 *
 * An animated hamburger that snaps into an X on tap.
 *
 * @framerIntrinsicWidth 48
 * @framerIntrinsicHeight 48
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function BurgerMenu(props: BurgerMenuProps) {
    const {
        color = "#161616",
        size = 28,
        lineThickness = 2,
        lineGap = 7,
        rounded = true,
        livelyHover = true,
        transition = {
            type: "spring",
            stiffness: 520,
            damping: 24,
            mass: 0.9,
        },
        onToggle,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const [isOpen, setIsOpen] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const open = isStatic ? false : isOpen

    // Open always wins over hover, so a click shows the X even while hovering.
    const animateState = open
        ? "open"
        : isHovered && livelyHover && !isStatic
          ? "hover"
          : "closed"

    const toggle = useCallback(() => {
        setIsOpen((prev) => {
            const next = !prev
            if (onToggle) onToggle(next)
            return next
        })
    }, [onToggle])

    const radius = rounded ? lineThickness : 0

    const lineBase: CSSProperties = {
        position: "absolute",
        left: "50%",
        top: "50%",
        width: size,
        height: lineThickness,
        marginLeft: -size / 2,
        marginTop: -lineThickness / 2,
        borderRadius: radius,
        background: color,
    }

    return (
        <motion.div
            role="button"
            aria-label="Menu"
            aria-expanded={open}
            tabIndex={0}
            onClick={toggle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    toggle()
                }
            }}
            initial={false}
            animate={animateState}
            whileTap={{ scale: 0.88 }}
            transition={transition}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: size,
                minHeight: size,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                outline: "none",
                userSelect: "none",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: size,
                    height: size,
                }}
            >
                {/* Top bar */}
                <motion.div
                    style={lineBase}
                    variants={{
                        closed: { y: -lineGap, rotate: 0 },
                        open: { y: 0, rotate: 45 },
                        hover: { y: -lineGap - 1.5, rotate: 0 },
                    }}
                    transition={transition}
                />
                {/* Middle bar */}
                <motion.div
                    style={{ ...lineBase, transformOrigin: "center" }}
                    variants={{
                        closed: { opacity: 1, scaleX: 1 },
                        open: { opacity: 0, scaleX: 0.2 },
                        hover: { opacity: 1, scaleX: 0.7 },
                    }}
                    transition={{ ...transition, duration: 0.18 }}
                />
                {/* Bottom bar */}
                <motion.div
                    style={lineBase}
                    variants={{
                        closed: { y: lineGap, rotate: 0 },
                        open: { y: 0, rotate: -45 },
                        hover: { y: lineGap + 1.5, rotate: 0 },
                    }}
                    transition={transition}
                />
            </div>
        </motion.div>
    )
}

addPropertyControls(BurgerMenu, {
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#161616",
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 28,
        min: 12,
        max: 80,
        unit: "px",
    },
    lineThickness: {
        type: ControlType.Number,
        title: "Thickness",
        defaultValue: 2,
        min: 1,
        max: 8,
        step: 0.5,
        unit: "px",
    },
    lineGap: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 7,
        min: 2,
        max: 20,
        step: 0.5,
        unit: "px",
    },
    rounded: {
        type: ControlType.Boolean,
        title: "Rounded",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    livelyHover: {
        type: ControlType.Boolean,
        title: "Hover",
        defaultValue: true,
        enabledTitle: "Lively",
        disabledTitle: "Off",
    },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        defaultValue: {
            type: "spring",
            stiffness: 520,
            damping: 24,
            mass: 0.9,
        },
    },
    onToggle: {
        type: ControlType.EventHandler,
    },
})
