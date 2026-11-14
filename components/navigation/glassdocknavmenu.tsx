import { useRef } from "react"
import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
} from "framer-motion"
import type { MotionValue } from "framer-motion"
import type { Icon as PhosphorIcon, IconProps } from "@phosphor-icons/react"
import {
    Sun,
    Heart,
    MusicNote,
    Coffee,
    Leaf,
    Star,
    Moon,
    Flame,
    Cloud,
} from "@phosphor-icons/react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const ICON_SIZE = 44
const MAG_RANGE = 120
const MAG_SCALE = 1.55

interface DockItemDef {
    icon: typeof Sun
    label: string
    color: string
}

const DOCK_ITEMS: DockItemDef[] = [
    { icon: Sun, label: "Energy", color: "#FFBE0B" },
    { icon: Heart, label: "Love", color: "#FF5C8A" },
    { icon: MusicNote, label: "Joy", color: "#FF7B54" },
    { icon: Coffee, label: "Comfort", color: "#C9A96E" },
    { icon: Leaf, label: "Nature", color: "#06D6A0" },
    { icon: Star, label: "Dreams", color: "#FFBE0B" },
    { icon: Moon, label: "Rest", color: "#B388FF" },
    { icon: Flame, label: "Passion", color: "#FF5C8A" },
    { icon: Cloud, label: "Peace", color: "#3A86FF" },
]

interface DockItemProps {
    icon: typeof Sun
    color: string
    label: string
    mouseX: MotionValue<number>
    index: number
}

function DockItem({
    icon: IconComponent,
    color,
    label,
    mouseX,
    index,
}: DockItemProps) {
    const ref = useRef<HTMLDivElement>(null)

    const distance = useTransform(mouseX, (mx: number) => {
        const el = ref.current
        if (!el || mx < 0) return 200
        const rect = el.getBoundingClientRect()
        const center = rect.left + rect.width / 2
        return Math.abs(mx - center)
    })

    const rawSize = useTransform(
        distance,
        [0, MAG_RANGE],
        [ICON_SIZE * MAG_SCALE, ICON_SIZE]
    )

    const size = useSpring(rawSize, { stiffness: 300, damping: 22, mass: 0.5 })

    const y = useTransform(size, [ICON_SIZE, ICON_SIZE * MAG_SCALE], [0, -12])

    return (
        <motion.div
            style={{
                position: "relative",
                display: "flex",
                cursor: "pointer",
                flexDirection: "column",
                alignItems: "center",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                type: "spring",
                stiffness: 200,
                damping: 18,
                delay: index * 0.04,
            }}
            whileHover="hovered"
        >
            {/* Frosted Tooltip */}
            <motion.div
                variants={{ hovered: { opacity: 1 }, initial: { opacity: 0 } }}
                initial="initial"
                style={{
                    background: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    pointerEvents: "none",
                    position: "absolute",
                    top: -40,
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.9)",
                    whiteSpace: "nowrap",
                    opacity: 0,
                    transition: "opacity 0.15s",
                    zIndex: 10,
                }}
            >
                {label}
            </motion.div>

            {/* Icon Badge */}
            <motion.div
                ref={ref}
                style={{
                    width: size,
                    height: size,
                    y,
                    background: `${color}18`,
                    border: `1px solid ${color}22`,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
                whileTap={{ scale: 0.82 }}
            >
                <IconComponent size={22} weight="regular" style={{ color }} />
            </motion.div>
        </motion.div>
    )
}

export function GlassDock() {
    const mouseX = useMotionValue(-200)

    return (
        <div
            style={{
                position: "relative",
                display: "flex",
                height: "100%",
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                backgroundColor: "#1A1A19",
                paddingBottom: 32,
            }}
        >
            {/* Background image */}
            <img
                src="https://ik.imagekit.io/aitoolkit/bg%20images/Ethereal%20Orange%20Flower%201%20(1).png?updatedAt=1775223702866"
                alt=""
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: 0.6,
                    pointerEvents: "none",
                }}
            />

            {/* Dock */}
            <motion.div
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 180, damping: 20 }}
                onMouseMove={(e) => mouseX.set(e.clientX)}
                onMouseLeave={() => mouseX.set(-200)}
                style={{
                    position: "relative",
                    isolation: "isolate",
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 8,
                    borderRadius: 24,
                    paddingLeft: 16,
                    paddingRight: 16,
                    paddingBottom: 12,
                    paddingTop: 12,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow:
                        "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
                }}
            >
                {/* Separate non-animating blur layer */}
                <div
                    style={{
                        pointerEvents: "none",
                        position: "absolute",
                        inset: 0,
                        zIndex: -1,
                        borderRadius: 24,
                        backdropFilter: "blur(24px) saturate(1.8)",
                        WebkitBackdropFilter: "blur(24px) saturate(1.8)",
                    }}
                />

                {DOCK_ITEMS.map((item, index) => (
                    <DockItem
                        key={item.label}
                        icon={item.icon}
                        color={item.color}
                        label={item.label}
                        mouseX={mouseX}
                        index={index}
                    />
                ))}
            </motion.div>
        </div>
    )
}

addPropertyControls(GlassDock, {
    showBackground: {
        type: ControlType.Boolean,
        title: "Show Background",
        defaultValue: true,
    },
})
