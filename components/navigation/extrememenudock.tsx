import * as React from "react"
import {
    motion,
    useMotionValue,
    useSpring,
    useAnimationFrame,
    MotionValue,
} from "framer-motion"
import {
    Terminal,
    Globe,
    Music,
    MessageCircle,
    Camera,
    Zap,
    Box,
    Mail,
    Folder,
    Code,
    Headphones,
    Image as ImageIcon,
    Video,
    FileText,
    Settings,
    Search,
    Star,
    Heart,
    Home,
    User,
    Bell,
    Calendar,
    Download,
    Upload,
    Trash,
    Edit,
    Share,
    Lock,
    Unlock,
} from "lucide-react"
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
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 800
 */

// --- TYPES ---
interface Vector2 {
    x: number
    y: number
}

const ICON_MAP = {
    Terminal,
    Globe,
    Music,
    MessageCircle,
    Camera,
    Zap,
    Box,
    Mail,
    Folder,
    Code,
    Headphones,
    Image: ImageIcon,
    Video,
    FileText,
    Settings,
    Search,
    Star,
    Heart,
    Home,
    User,
    Bell,
    Calendar,
    Download,
    Upload,
    Trash,
    Edit,
    Share,
    Lock,
    Unlock,
}

type IconName = keyof typeof ICON_MAP

interface DockItemProps {
    id?: string
    title: string
    color: string
    iconName?: IconName
    iconSize?: number
    image?: any
    link?: string
    onClickAction?: () => void
}

// --- UTILS ---
const distance = (a: Vector2, b: Vector2) =>
    Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2))

const clamp = (val: number, min: number, max: number) =>
    Math.min(Math.max(val, min), max)

// --- DOCK CARD (live, physics-driven) ---
interface DockCardProps {
    item: DockItemProps
    index: number
    mouseX: MotionValue<number>
    mouseY: MotionValue<number>
    hoveredIndex: number | null
    setHoveredIndex: (idx: number | null) => void
    dockBounds: React.MutableRefObject<DOMRect | null>
    config: any
    onItemClick?: (item: DockItemProps, index: number) => void
}

const DockCard = ({
    item,
    index,
    mouseX,
    mouseY,
    hoveredIndex,
    setHoveredIndex,
    dockBounds,
    config,
    onItemClick,
}: DockCardProps) => {
    const cardRef = React.useRef<HTMLDivElement>(null)

    const velocity = React.useRef<Vector2>({ x: 0, y: 0 })
    const position = React.useRef<Vector2>({ x: 0, y: 0 })
    const isSleeping = React.useRef(false)

    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const scale = useMotionValue(1)
    const rotateX = useMotionValue(0)
    const rotateY = useMotionValue(0)

    const springConfig = {
        damping: config.damping,
        stiffness: config.stiffness,
        mass: config.mass,
    }

    const springX = useSpring(x, springConfig)
    const springY = useSpring(y, springConfig)
    const springRotateX = useSpring(rotateX, springConfig)
    const springRotateY = useSpring(rotateY, springConfig)
    const springScale = useSpring(scale, { ...springConfig, stiffness: 200 })
    const time = React.useRef(0)

    useAnimationFrame(() => {
        if (!cardRef.current) return

        const mx = mouseX.get()
        const my = mouseY.get()
        const rect = cardRef.current.getBoundingClientRect()
        const currentX = x.get()
        const currentY = y.get()
        const homeX = rect.left + rect.width / 2 - currentX
        const homeY = rect.top + rect.height / 2 - currentY
        const dist = distance({ x: homeX, y: homeY }, { x: mx, y: my })

        const speed =
            Math.abs(velocity.current.x) + Math.abs(velocity.current.y)

        if (speed < 0.05 && dist > config.magnetRadius) {
            if (!isSleeping.current) {
                x.set(0)
                y.set(0)
                scale.set(1)
                rotateX.set(0)
                rotateY.set(0)
                velocity.current = { x: 0, y: 0 }
                position.current = { x: 0, y: 0 }
                isSleeping.current = true
            }
            return
        }

        isSleeping.current = false
        time.current += 1

        let forceX = 0
        let forceY = 0
        forceX += (0 - position.current.x) * 0.08
        forceY += (0 - position.current.y) * 0.08

        if (dist < config.magnetRadius) {
            const pull = (config.magnetRadius - dist) / config.magnetRadius
            forceX += (mx - homeX) * pull * config.magnetStrength
            forceY += (my - homeY) * pull * config.magnetStrength
        }

        if (
            config.enableOrbitalEffect &&
            hoveredIndex !== null &&
            hoveredIndex !== index
        ) {
            const idxDist = Math.abs(hoveredIndex - index)
            if (idxDist <= 2) {
                const orbitSpeed = 0.1
                const orbitRadius = (25 * (3 - idxDist)) / 3
                const offset = time.current * orbitSpeed + index
                forceX += Math.cos(offset) * orbitRadius * 0.1
                forceY += Math.sin(offset) * orbitRadius * 0.1
            }
        }

        velocity.current.x += forceX
        velocity.current.y += forceY
        velocity.current.x *= 0.9
        velocity.current.y *= 0.9
        position.current.x += velocity.current.x
        position.current.y += velocity.current.y
        x.set(position.current.x)
        y.set(position.current.y)
        rotateY.set(clamp(velocity.current.x * 0.5, -25, 25))
        rotateX.set(clamp(-velocity.current.y * 0.5, -25, 25))

        let targetScale = 1
        if (dist < 150) {
            targetScale = 1 + ((150 - dist) / 150) * (config.hoverScale - 1)
        }
        scale.set(targetScale)
    })

    const handleClick = () => {
        if (onItemClick) onItemClick(item, index)
        if (item.link) window.location.href = item.link
        if (item.onClickAction) item.onClickAction()
    }

    const IconComponent = item.iconName ? ICON_MAP[item.iconName] : Box
    const iconSize = item.iconSize || 32
    const baseShadow = `${config.shadowOffsetX}px ${config.shadowOffsetY}px ${config.shadowBlur}px ${config.shadowColor}`
    const activeGlow = `0 0 ${config.glowIntensity}px ${config.glowColor}`
    const currentBoxShadow =
        hoveredIndex === index ? `${baseShadow}, ${activeGlow}` : baseShadow

    const imageSrc =
        item.image && typeof item.image === "object"
            ? item.image.src
            : item.image

    return (
        <motion.div
            ref={cardRef}
            onPointerEnter={() => setHoveredIndex(index)}
            onPointerLeave={() => setHoveredIndex(null)}
            onClick={handleClick}
            style={{
                x: springX,
                y: springY,
                scale: springScale,
                rotateX: springRotateX,
                rotateY: springRotateY,
                zIndex: hoveredIndex === index ? 50 : 1,
                transformStyle: "preserve-3d",
                perspective: 800,
                position: "relative",
                flexShrink: 0,
                cursor: "pointer",
            }}
        >
            <CardFace
                item={item}
                config={config}
                imageSrc={imageSrc}
                IconComponent={IconComponent}
                iconSize={iconSize}
                currentBoxShadow={currentBoxShadow}
            />
            {config.showLabels && (
                <motion.div
                    style={{
                        position: "absolute",
                        bottom: -30,
                        left: "50%",
                        x: "-50%",
                        fontSize: config.labelFontSize,
                        fontFamily: config.labelFontFamily,
                        fontWeight: config.labelFontWeight,
                        color: config.labelColor,
                        padding: config.showLabelBackground ? "2px 8px" : "0",
                        borderRadius: config.showLabelBackground ? 10 : 0,
                        backgroundColor: config.showLabelBackground
                            ? config.labelBackgroundColor
                            : "transparent",
                        backdropFilter: config.showLabelBackground
                            ? "blur(4px)"
                            : "none",
                        border: config.showLabelBackground
                            ? "1px solid rgba(255,255,255,0.1)"
                            : "none",
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                    }}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{
                        opacity: hoveredIndex === index ? 1 : 0,
                        y: hoveredIndex === index ? 0 : -10,
                    }}
                >
                    {item.title}
                </motion.div>
            )}
        </motion.div>
    )
}

// --- STATIC DOCK CARD (no springs, no RAF, no hover) ---
const StaticDockCard = ({
    item,
    config,
}: {
    item: DockItemProps
    config: any
}) => {
    const IconComponent = item.iconName ? ICON_MAP[item.iconName] : Box
    const iconSize = item.iconSize || 32
    const baseShadow = `${config.shadowOffsetX}px ${config.shadowOffsetY}px ${config.shadowBlur}px ${config.shadowColor}`
    const imageSrc =
        item.image && typeof item.image === "object"
            ? item.image.src
            : item.image

    return (
        <div style={{ position: "relative", flexShrink: 0 }}>
            <CardFace
                item={item}
                config={config}
                imageSrc={imageSrc}
                IconComponent={IconComponent}
                iconSize={iconSize}
                currentBoxShadow={baseShadow}
            />
        </div>
    )
}

// --- SHARED CARD FACE ---
const CardFace = ({
    item,
    config,
    imageSrc,
    IconComponent,
    iconSize,
    currentBoxShadow,
}: any) => (
    <div
        style={{
            width: config.cardSize,
            height: config.cardSize,
            borderRadius: config.cardBorderRadius,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            backgroundColor: config.cardBackgroundColor,
            border: `${config.cardBorderWidth}px solid ${config.cardBorderColor}`,
            backdropFilter: "blur(10px)",
            boxShadow: currentBoxShadow,
            transition: "box-shadow 0.3s ease",
            position: "relative",
        }}
    >
        {config.showShine && (
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "linear-gradient(45deg, rgba(255,255,255,0.4), transparent)",
                    opacity: 0.1,
                    pointerEvents: "none",
                }}
            />
        )}
        {imageSrc ? (
            <img
                src={imageSrc}
                alt={item.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
        ) : (
            <div
                style={{
                    color: item.color,
                    filter: "brightness(1.5) drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <IconComponent size={iconSize} />
            </div>
        )}
    </div>
)

// --- DEFAULT ITEMS ---
const DEFAULT_ITEMS: DockItemProps[] = [
    { title: "Finder", color: "#007AFF", iconName: "Folder" },
    { title: "Terminal", color: "#333333", iconName: "Terminal" },
    { title: "Code", color: "#8E44AD", iconName: "Code" },
    { title: "Music", color: "#FA2D48", iconName: "Music" },
    { title: "Slack", color: "#4A154B", iconName: "MessageCircle" },
]

// --- MAIN COMPONENT ---
export default function ExtremeDock(props: any) {
    const {
        items = DEFAULT_ITEMS,
        stiffness = 120,
        damping = 15,
        mass = 0.5,
        magnetStrength = 0.2,
        magnetRadius = 250,
        backgroundColor = "rgba(255, 255, 255, 0.05)",
        dockBorderRadius = 24,
        dockBorderColor = "rgba(255,255,255,0.1)",
        dockBorderWidth = 1,
        dockPadding = 16,
        dockGap = 16,
        dockPosition = "bottom",
        dockAlignment = "center",
        cardSize = 64,
        cardBorderRadius = 16,
        cardBackgroundColor = "rgba(255, 255, 255, 0.1)",
        cardBorderColor = "rgba(255, 255, 255, 0.2)",
        cardBorderWidth = 1,
        showLabels = true,
        showShine = true,
        showFloorGlow = true,
        floorGlowColor = "rgba(59, 130, 246, 0.15)",
        floorGlowOpacity = 1,
        labelFontSize = 10,
        labelFontFamily = "Inter, -apple-system, system-ui, sans-serif",
        labelFontWeight = 700,
        labelColor = "white",
        showLabelBackground = true,
        labelBackgroundColor = "rgba(0,0,0,0.6)",
        hoverScale = 1.5,
        enableOrbitalEffect = true,
        shadowColor = "rgba(0,0,0,0.5)",
        shadowBlur = 15,
        shadowOffsetX = 0,
        shadowOffsetY = 5,
        glowColor = "rgba(0, 153, 255, 0.5)",
        glowIntensity = 30,
        onItemClick,
        width,
        height,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const safeConfig = {
        stiffness,
        damping,
        mass,
        magnetStrength,
        magnetRadius,
        cardSize,
        cardBorderRadius,
        cardBackgroundColor,
        cardBorderColor,
        cardBorderWidth,
        showLabels,
        showShine,
        labelFontSize,
        labelFontFamily,
        labelFontWeight,
        labelColor,
        showLabelBackground,
        labelBackgroundColor,
        hoverScale,
        enableOrbitalEffect,
        shadowColor,
        shadowBlur,
        shadowOffsetX,
        shadowOffsetY,
        glowColor,
        glowIntensity,
    }

    const dockRef = React.useRef<HTMLDivElement>(null)
    const dockBounds = React.useRef<DOMRect | null>(null)
    const mouseX = useMotionValue(-1000)
    const mouseY = useMotionValue(-1000)
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)

    React.useEffect(() => {
        if (isStatic) return
        const updateBounds = () => {
            if (dockRef.current)
                dockBounds.current = dockRef.current.getBoundingClientRect()
        }
        updateBounds()
        window.addEventListener("resize", updateBounds)
        return () => window.removeEventListener("resize", updateBounds)
    }, [isStatic])

    const getPositionStyles = () => {
        const alignmentMap: any = {
            left: "flex-start",
            center: "center",
            right: "flex-end",
        }
        const positionMap: any = {
            top: { alignItems: "flex-start", paddingTop: 48 },
            center: { alignItems: "center" },
            bottom: { alignItems: "flex-end", paddingBottom: 48 },
        }
        return {
            justifyContent: alignmentMap[dockAlignment],
            ...positionMap[dockPosition],
        }
    }

    const resolvedItems = items || DEFAULT_ITEMS

    const dockContainerStyle: React.CSSProperties = {
        display: "flex",
        gap: dockGap,
        padding: dockPadding,
        borderRadius: dockBorderRadius,
        backgroundColor,
        border: `${dockBorderWidth}px solid ${dockBorderColor}`,
        backdropFilter: "blur(20px)",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
        alignItems: "flex-end",
        transformStyle: "preserve-3d",
        zIndex: 10,
    }

    return (
        <div
            style={{
                width: width ?? 800,
                height: height ?? 800,
                display: "flex",
                ...getPositionStyles(),
                overflow: "visible",
                perspective: 1000,
                position: "relative",
                ...style,
            }}
        >
            {/* Static fallback — plain cards, no springs, no RAF, no hover */}
            {isStatic ? (
                <div style={dockContainerStyle}>
                    {resolvedItems.map((item: any, i: number) => (
                        <StaticDockCard
                            key={item.id || i}
                            item={item}
                            config={safeConfig}
                        />
                    ))}
                </div>
            ) : (
                <div
                    ref={dockRef}
                    onMouseMove={(e) => {
                        mouseX.set(e.clientX)
                        mouseY.set(e.clientY)
                    }}
                    onMouseLeave={() => {
                        mouseX.set(-1000)
                        mouseY.set(-1000)
                        setHoveredIndex(null)
                    }}
                    style={dockContainerStyle}
                >
                    {resolvedItems.map((item: any, i: number) => (
                        <DockCard
                            key={item.id || i}
                            item={item}
                            index={i}
                            mouseX={mouseX}
                            mouseY={mouseY}
                            hoveredIndex={hoveredIndex}
                            setHoveredIndex={setHoveredIndex}
                            dockBounds={dockBounds}
                            config={safeConfig}
                            onItemClick={onItemClick}
                        />
                    ))}
                </div>
            )}

            {showFloorGlow && dockPosition === "bottom" && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "80%",
                        height: 80,
                        backgroundColor: floorGlowColor,
                        opacity: floorGlowOpacity,
                        filter: "blur(60px)",
                        pointerEvents: "none",
                    }}
                />
            )}
        </div>
    )
}

ExtremeDock.defaultProps = {
    width: 800,
    height: 800,
}

addPropertyControls(ExtremeDock, {
    items: {
        type: ControlType.Array,
        title: "Dock Items",
        description:
            "Add, remove, and customize the individual app icons displayed in your dock.",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    defaultValue: "App",
                    title: "Title",
                    description: "The text displayed in the label.",
                },
                color: {
                    type: ControlType.Color,
                    defaultValue: "#0099FF",
                    title: "Icon Color",
                    description: "The primary color of the icon.",
                },
                iconName: {
                    type: ControlType.Enum,
                    title: "Icon",
                    options: Object.keys(ICON_MAP),
                    defaultValue: "Box",
                    description:
                        "Select from the built-in Lucide icon library.",
                },
                iconSize: {
                    type: ControlType.Number,
                    title: "Icon Size",
                    min: 16,
                    max: 64,
                    defaultValue: 32,
                    description: "Scale of the internal icon.",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Custom Image",
                    description:
                        "Overrides the icon with a custom uploaded image.",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link To",
                    description: "Where the icon navigates to when clicked.",
                },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    stiffness: {
        type: ControlType.Number,
        min: 50,
        max: 500,
        defaultValue: 120,
        title: "Stiffness",
        description: "Controls the rigidity and speed of the spring animation.",
    },
    damping: {
        type: ControlType.Number,
        min: 5,
        max: 100,
        defaultValue: 15,
        title: "Damping",
        description: "Higher values stop the spring bounciness faster.",
    },
    mass: {
        type: ControlType.Number,
        min: 0.1,
        max: 5,
        step: 0.1,
        defaultValue: 0.5,
        title: "Mass",
        description: "Heavier items move slower and bounce with more momentum.",
    },
    magnetStrength: {
        type: ControlType.Number,
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.2,
        title: "Magnet Strength",
        description: "How aggressively the icons pull toward your cursor.",
    },
    magnetRadius: {
        type: ControlType.Number,
        min: 50,
        max: 500,
        defaultValue: 250,
        title: "Magnet Radius",
        description:
            "The pixel distance at which the cursor starts affecting the dock.",
    },
    hoverScale: {
        type: ControlType.Number,
        min: 1,
        max: 3,
        step: 0.1,
        defaultValue: 1.5,
        title: "Hover Scale",
        description:
            "Maximum size multiplier of the icon when the mouse is directly over it.",
    },
    enableOrbitalEffect: {
        type: ControlType.Boolean,
        title: "Orbital Effect",
        defaultValue: true,
        description:
            "Neighboring icons slightly rotate and orbit around the currently hovered item.",
    },
    shadowColor: {
        type: ControlType.Color,
        defaultValue: "rgba(0,0,0,0.5)",
        title: "Shadow Color",
        description: "The base drop shadow color for the resting dock cards.",
    },
    shadowBlur: {
        type: ControlType.Number,
        min: 0,
        max: 50,
        defaultValue: 15,
        title: "Shadow Blur",
        description: "How soft the edges of the base shadow are.",
    },
    shadowOffsetX: {
        type: ControlType.Number,
        min: -50,
        max: 50,
        defaultValue: 0,
        title: "Shadow Offset X",
        description: "Horizontal shift of the base shadow.",
    },
    shadowOffsetY: {
        type: ControlType.Number,
        min: -50,
        max: 50,
        defaultValue: 5,
        title: "Shadow Offset Y",
        description: "Vertical shift of the base shadow.",
    },
    glowColor: {
        type: ControlType.Color,
        defaultValue: "rgba(0, 153, 255, 0.5)",
        title: "Hover Glow Color",
        description:
            "The color of the intense active glow when an item is hovered.",
    },
    glowIntensity: {
        type: ControlType.Number,
        min: 0,
        max: 100,
        defaultValue: 30,
        title: "Hover Glow Spread",
        description: "How far the active colored glow spreads outward.",
    },
    backgroundColor: {
        type: ControlType.Color,
        defaultValue: "rgba(255, 255, 255, 0.05)",
        title: "Dock BG Color",
        description: "The background color of the main dock container pill.",
    },
    dockBorderRadius: {
        type: ControlType.Number,
        min: 0,
        max: 100,
        defaultValue: 24,
        title: "Dock Radius",
        description: "How rounded the corners of the main dock container are.",
    },
    dockBorderColor: {
        type: ControlType.Color,
        defaultValue: "rgba(255,255,255,0.1)",
        title: "Dock Border Color",
        description: "The stroke color outlining the main dock container.",
    },
    dockBorderWidth: {
        type: ControlType.Number,
        min: 0,
        max: 10,
        defaultValue: 1,
        title: "Dock Border Width",
        description: "Thickness of the border outlining the main dock.",
    },
    dockPadding: {
        type: ControlType.Number,
        min: 0,
        max: 50,
        defaultValue: 16,
        title: "Dock Padding",
        description:
            "Internal spacing between the container edge and the icons.",
    },
    dockGap: {
        type: ControlType.Number,
        min: 0,
        max: 50,
        defaultValue: 16,
        title: "Item Gap",
        description: "Horizontal space between each individual dock icon.",
    },
    dockPosition: {
        type: ControlType.Enum,
        title: "Dock Position",
        options: ["bottom", "top", "center"],
        defaultValue: "bottom",
        description:
            "Anchors the dock to the top, bottom, or center of its parent frame.",
    },
    dockAlignment: {
        type: ControlType.Enum,
        title: "Dock Alignment",
        options: ["left", "center", "right"],
        defaultValue: "center",
        description: "Aligns the items horizontally within the parent frame.",
    },
    cardSize: {
        type: ControlType.Number,
        min: 32,
        max: 128,
        defaultValue: 64,
        title: "Card Size",
        description:
            "Base width and height of each unhovered dock item in pixels.",
    },
    cardBorderRadius: {
        type: ControlType.Number,
        min: 0,
        max: 50,
        defaultValue: 16,
        title: "Card Radius",
        description:
            "How rounded the corners of each individual icon card are.",
    },
    cardBackgroundColor: {
        type: ControlType.Color,
        defaultValue: "rgba(255, 255, 255, 0.1)",
        title: "Card BG Color",
        description: "The background color of the individual icon cards.",
    },
    cardBorderColor: {
        type: ControlType.Color,
        defaultValue: "rgba(255, 255, 255, 0.2)",
        title: "Card Border Color",
        description: "The stroke color outlining each individual card.",
    },
    cardBorderWidth: {
        type: ControlType.Number,
        min: 0,
        max: 10,
        defaultValue: 1,
        title: "Card Border Width",
        description: "Thickness of the border outlining each card.",
    },
    showLabels: {
        type: ControlType.Boolean,
        title: "Show Labels",
        defaultValue: true,
        description:
            "Toggles the tooltip text that appears when hovering an item.",
    },
    showShine: {
        type: ControlType.Boolean,
        title: "Show Shine",
        defaultValue: true,
        description:
            "Adds a subtle, glassy diagonal gradient overlay to the cards.",
    },
    showFloorGlow: {
        type: ControlType.Boolean,
        title: "Show Floor Glow",
        defaultValue: true,
        description:
            "Toggles the ambient reflection glow beneath the dock (only visible in bottom position).",
    },
    floorGlowColor: {
        type: ControlType.Color,
        defaultValue: "rgba(59, 130, 246, 0.15)",
        title: "Floor Glow Color",
        description: "The color of the ambient light reflecting off the floor.",
    },
    floorGlowOpacity: {
        type: ControlType.Number,
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 1,
        title: "Floor Glow Intensity",
        description:
            "Master opacity level of the floor reflection (0 = invisible, 1 = fully visible).",
    },
    labelFontSize: {
        type: ControlType.Number,
        min: 6,
        max: 20,
        defaultValue: 10,
        title: "Label Font Size",
        displayStepper: true,
        unit: "px",
        description: "The pixel size of the tooltip text.",
    },
    labelFontFamily: {
        type: ControlType.String,
        defaultValue: "Inter, -apple-system, system-ui, sans-serif",
        title: "Label Font Family",
        placeholder: "Inter, sans-serif",
        description: "The CSS font-family stack for the tooltip text.",
    },
    labelFontWeight: {
        type: ControlType.Enum,
        title: "Label Font Weight",
        options: [100, 200, 300, 400, 500, 600, 700, 800, 900],
        optionTitles: [
            "100 Thin",
            "200 Extra Light",
            "300 Light",
            "400 Normal",
            "500 Medium",
            "600 Semi Bold",
            "700 Bold",
            "800 Extra Bold",
            "900 Black",
        ],
        defaultValue: 700,
        description: "The thickness of the tooltip text.",
    },
    labelColor: {
        type: ControlType.Color,
        defaultValue: "white",
        title: "Label Text Color",
        description: "The color of the tooltip text.",
    },
    showLabelBackground: {
        type: ControlType.Boolean,
        title: "Show Label BG",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Toggles the pill-shaped background behind the tooltip text.",
    },
    labelBackgroundColor: {
        type: ControlType.Color,
        defaultValue: "rgba(0,0,0,0.6)",
        title: "Label BG Color",
        description:
            "The color of the pill-shaped background behind the tooltip text.",
        hidden: (props) => props.showLabelBackground === false,
    },
})
