import { useState, useRef } from "react"
import {
    motion,
    AnimatePresence,
    useMotionValue,
    useSpring,
    useTransform,
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

import * as LucideIcons from "lucide-react"

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

export default function LinkedKineticNav(props) {
    const {
        items,
        variant,
        glassColor,
        activePillColor,
        textColor,
        activeTextColor,
        borderRadius,
        blurAmount,
        magneticStrength,
        hapticIntensity,
        springStiffness,
        springDamping,
    } = props

    const [activeIndex, setActiveIndex] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    const glareOpacity = useMotionValue(0)

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        mouseX.set(e.clientX - rect.left)
        mouseY.set(e.clientY - rect.top)
    }

    const isDesktop = variant === "desktop"
    const springConfig = { stiffness: springStiffness, damping: springDamping }

    return (
        <div style={wrapperStyle}>
            <motion.nav
                ref={containerRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => glareOpacity.set(1)}
                onMouseLeave={() => glareOpacity.set(0)}
                whileTap={{ scale: 1 - hapticIntensity / 100 }}
                layout
                style={{
                    ...navBaseStyle,
                    flexDirection: isDesktop ? "row" : "column",
                    borderRadius: isDesktop ? borderRadius : 32,
                    backgroundColor: glassColor,
                    backdropFilter: `blur(${blurAmount}px) saturate(200%)`,
                    WebkitBackdropFilter: `blur(${blurAmount}px) saturate(200%)`,
                    width: isDesktop ? "auto" : 64,
                    height: isDesktop ? "auto" : isOpen ? "auto" : 64,
                    padding: isDesktop ? "8px" : "8px",
                    border: "1px solid rgba(255,255,255,0.15)",
                }}
            >
                <GlareLayer
                    mouseX={mouseX}
                    mouseY={mouseY}
                    opacity={glareOpacity}
                />
                <div
                    style={{
                        ...reflectionStyle,
                        borderRadius: `${borderRadius}px ${borderRadius}px 24px 24px`,
                    }}
                />

                {isDesktop ? (
                    <div style={itemsWrapperStyle}>
                        {items.map((item, index) => (
                            <Link key={index} href={item.link}>
                                <NavButton
                                    item={item}
                                    isActive={activeIndex === index}
                                    onClick={() => setActiveIndex(index)}
                                    activePillColor={activePillColor}
                                    textColor={
                                        activeIndex === index
                                            ? activeTextColor
                                            : textColor
                                    }
                                    borderRadius={borderRadius}
                                    magneticStrength={magneticStrength}
                                    springConfig={springConfig}
                                    mouseX={mouseX}
                                    mouseY={mouseY}
                                />
                            </Link>
                        ))}
                    </div>
                ) : (
                    <MobileStack
                        isOpen={isOpen}
                        setIsOpen={setIsOpen}
                        items={items}
                        activeIndex={activeIndex}
                        setActiveIndex={setActiveIndex}
                        activeTextColor={activeTextColor}
                        textColor={textColor}
                        activePillColor={activePillColor}
                    />
                )}
            </motion.nav>
        </div>
    )
}

function NavButton({
    item,
    isActive,
    onClick,
    activePillColor,
    textColor,
    borderRadius,
    magneticStrength,
    springConfig,
    mouseX,
    mouseY,
}) {
    const btnRef = useRef<HTMLButtonElement>(null)
    const [isHovered, setIsHovered] = useState(false)
    const IconComponent = LucideIcons[item.icon] || LucideIcons.HelpCircle

    const x = useSpring(
        useTransform(mouseX, (v) => {
            if (!btnRef.current || !isHovered) return 0
            const rect = btnRef.current.getBoundingClientRect()
            const parentRect =
                btnRef.current.parentElement!.parentElement!.getBoundingClientRect()
            const dist = v - (rect.left - parentRect.left + rect.width / 2)
            return dist * (magneticStrength / 100)
        }),
        springConfig
    )

    const y = useSpring(
        useTransform(mouseY, (v) => {
            if (!btnRef.current || !isHovered) return 0
            const rect = btnRef.current.getBoundingClientRect()
            const parentRect =
                btnRef.current.parentElement!.parentElement!.getBoundingClientRect()
            const dist = v - (rect.top - parentRect.top + rect.height / 2)
            return dist * (magneticStrength / 100)
        }),
        springConfig
    )

    return (
        <button
            ref={btnRef}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ ...btnStyle, color: textColor }}
        >
            {isActive && (
                <motion.div
                    layoutId="pill"
                    transition={{ type: "spring", ...springConfig }}
                    style={{
                        ...activePillStyle,
                        backgroundColor: activePillColor,
                        borderRadius,
                    }}
                />
            )}
            <motion.div style={{ ...btnContentStyle, x, y }}>
                {item.showIcon && <IconComponent size={18} strokeWidth={2.5} />}
                <span>{item.label}</span>
            </motion.div>
        </button>
    )
}

function MobileStack({
    isOpen,
    setIsOpen,
    items,
    activeIndex,
    setActiveIndex,
    activeTextColor,
    textColor,
    activePillColor,
}) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column-reverse",
                alignItems: "center",
                gap: 8,
            }}
        >
            <button onClick={() => setIsOpen(!isOpen)} style={mobileToggleBtn}>
                <motion.div
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    style={{ display: "flex" }}
                >
                    <LucideIcons.Plus size={24} color={textColor} />
                </motion.div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.8 }}
                        style={mobileItemsContainer}
                    >
                        {items.map((item, index) => {
                            const Icon =
                                LucideIcons[item.icon] || LucideIcons.Circle
                            const isActive = activeIndex === index
                            return (
                                <Link key={index} href={item.link}>
                                    <button
                                        onClick={() => {
                                            setActiveIndex(index)
                                            setIsOpen(false)
                                        }}
                                        style={{
                                            ...mobileCircleBtn,
                                            backgroundColor: isActive
                                                ? activePillColor
                                                : "transparent",
                                            color: isActive
                                                ? activeTextColor
                                                : textColor,
                                        }}
                                    >
                                        <Icon size={20} />
                                    </button>
                                </Link>
                            )
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function GlareLayer({ mouseX, mouseY, opacity }) {
    const glareEffect = useSpring(
        useTransform(
            [mouseX, mouseY],
            ([x, y]) =>
                `radial-gradient(circle 80px at ${x}px ${y}px, rgba(255,255,255,0.25), transparent 100%)`
        )
    )
    return (
        <motion.div
            style={{ ...glareStyle, opacity, background: glareEffect }}
        />
    )
}

// --- Styles ---
const wrapperStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
}
const navBaseStyle: React.CSSProperties = {
    position: "relative",
    display: "flex",
    overflow: "hidden",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
    cursor: "pointer",
}
const reflectionStyle: React.CSSProperties = {
    position: "absolute",
    top: "1px",
    left: "1px",
    right: "1px",
    height: "40%",
    background:
        "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)",
    pointerEvents: "none",
    zIndex: 6,
}
const glareStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    zIndex: 5,
    mixBlendMode: "overlay",
}
const itemsWrapperStyle: React.CSSProperties = {
    display: "flex",
    gap: "4px",
    zIndex: 10,
}
const btnStyle: React.CSSProperties = {
    position: "relative",
    padding: "0 20px",
    height: "46px",
    border: "none",
    background: "transparent",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    outline: "none",
    display: "flex",
    alignItems: "center",
}
const btnContentStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    position: "relative",
    zIndex: 2,
}
const activePillStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    zIndex: 1,
    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.2)",
}
const mobileToggleBtn: React.CSSProperties = {
    background: "rgba(255,255,255,0.1)",
    border: "none",
    width: 48,
    height: 48,
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    outline: "none",
}
const mobileItemsContainer: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    paddingBottom: 10,
}
const mobileCircleBtn: React.CSSProperties = {
    width: 48,
    height: 48,
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.3s ease",
}

// --- Property Controls ---
addPropertyControls(LinkedKineticNav, {
    variant: {
        type: ControlType.Enum,
        options: ["desktop", "phone"],
        defaultValue: "desktop",
    },
    items: {
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, defaultValue: "Home" },
                icon: { type: ControlType.String, defaultValue: "Home" },
                showIcon: { type: ControlType.Boolean, defaultValue: true },
                link: { type: ControlType.Link, title: "Action" }, // Link Control Added
            },
        },
        defaultValue: [
            { label: "Home", icon: "Home", showIcon: true },
            { label: "Work", icon: "Briefcase", showIcon: true },
            { label: "Vault", icon: "Lock", showIcon: true },
        ],
    },
    magneticStrength: {
        type: ControlType.Number,
        title: "Magnetics",
        min: 0,
        max: 60,
        defaultValue: 30,
    },
    hapticIntensity: {
        type: ControlType.Number,
        title: "Haptics",
        min: 0,
        max: 10,
        defaultValue: 3,
    },
    springStiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        min: 100,
        max: 1000,
        defaultValue: 450,
    },
    springDamping: {
        type: ControlType.Number,
        title: "Damping",
        min: 10,
        max: 100,
        defaultValue: 35,
    },
    glassColor: {
        type: ControlType.Color,
        defaultValue: "rgba(15, 15, 20, 0.7)",
    },
    activePillColor: {
        type: ControlType.Color,
        defaultValue: "rgba(255, 255, 255, 0.15)",
    },
    textColor: {
        type: ControlType.Color,
        defaultValue: "rgba(255, 255, 255, 0.5)",
    },
    activeTextColor: { type: ControlType.Color, defaultValue: "#ffffff" },
    borderRadius: { type: ControlType.Number, defaultValue: 99 },
    blurAmount: { type: ControlType.Number, defaultValue: 40 },
})
