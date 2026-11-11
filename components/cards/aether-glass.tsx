import React, { useRef, useState } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
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
 * Liquid Glass Morphic Card with Real-Time Specular Refraction
 * 2026 Framer Marketplace 现象级爆款：液体拟态毛玻璃与高光折射卡片
 *
 * 商业定位：
 * - 极度契合高端 AI、Web3 及奢侈品视觉网站
 * - 纯 GPU 硬件加速滤镜，跨浏览器与移动端高帧率兼容
 */
export default function LiquidGlassCard(props) {
    const {
        title,
        subtitle,
        description,
        glassBlur,
        glassOpacity,
        borderColor,
        refractionGlow,
        accentColor,
        borderRadius,
        style,
    } = props

    const cardRef = useRef<HTMLDivElement>(null)
    const [isHovered, setIsHovered] = useState(false)

    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    const springConfig = { damping: 25, stiffness: 200 }
    const smoothX = useSpring(mouseX, springConfig)
    const smoothY = useSpring(mouseY, springConfig)

    // 光斑高光漫游与高光角度换算
    const lightX = useTransform(smoothX, [-0.5, 0.5], ["15%", "85%"])
    const lightY = useTransform(smoothY, [-0.5, 0.5], ["15%", "85%"])

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return
        const rect = cardRef.current.getBoundingClientRect()
        mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
        mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
    }

    return (
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false)
                mouseX.set(0)
                mouseY.set(0)
            }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                borderRadius: `${borderRadius}px`,
                background: `linear-gradient(135deg, rgba(255, 255, 255, ${glassOpacity * 1.5}), rgba(255, 255, 255, ${glassOpacity * 0.4}))`,
                backdropFilter: `blur(${glassBlur}px) saturate(180%)`,
                WebkitBackdropFilter: `blur(${glassBlur}px) saturate(180%)`,
                border: `1px solid ${borderColor}`,
                boxShadow: isHovered
                    ? `0 30px 60px -12px rgba(0, 0, 0, 0.45), 0 0 40px -10px ${accentColor}44, inset 0 1px 1px 0 rgba(255, 255, 255, 0.5)`
                    : "0 20px 40px -15px rgba(0, 0, 0, 0.3), inset 0 1px 1px 0 rgba(255, 255, 255, 0.3)",
                overflow: "hidden",
                cursor: "pointer",
                padding: "36px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxSizing: "border-box",
                ...style,
            }}
        >
            {/* 动态液体高光折射层 (Fluid Specular Highlight) */}
            {refractionGlow && (
                <motion.div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        opacity: isHovered ? 0.8 : 0.25,
                        transition: "opacity 0.4s ease",
                        background: useTransform(
                            [lightX, lightY],
                            ([x, y]) =>
                                `radial-gradient(circle 350px at ${x} ${y}, ${accentColor}33 0%, rgba(255, 255, 255, 0.15) 30%, transparent 70%)`
                        ),
                    }}
                />
            )}

            {/* 卡片头部 */}
            <div style={{ position: "relative", zIndex: 2 }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "20px",
                    }}
                >
                    <span
                        style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: accentColor,
                            padding: "4px 12px",
                            borderRadius: "9999px",
                            background: "rgba(255, 255, 255, 0.1)",
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                        }}
                    >
                        {subtitle}
                    </span>
                    <span
                        style={{
                            fontSize: "16px",
                            color: "rgba(255, 255, 255, 0.6)",
                        }}
                    >
                        ✦
                    </span>
                </div>

                <h3
                    style={{
                        color: "#ffffff",
                        fontSize: "24px",
                        fontWeight: 800,
                        margin: "0 0 12px 0",
                        fontFamily: "Inter, -apple-system, sans-serif",
                        letterSpacing: "-0.03em",
                        lineHeight: 1.2,
                    }}
                >
                    {title}
                </h3>
                <p
                    style={{
                        color: "rgba(255, 255, 255, 0.75)",
                        fontSize: "14px",
                        lineHeight: "1.6",
                        margin: 0,
                        fontFamily: "Inter, -apple-system, sans-serif",
                    }}
                >
                    {description}
                </p>
            </div>

            {/* 卡片底部交互入口 */}
            <div
                style={{
                    position: "relative",
                    zIndex: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "24px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                    marginTop: "28px",
                }}
            >
                <span
                    style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#ffffff",
                    }}
                >
                    Experience Shader
                </span>
                <div
                    style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "rgba(255, 255, 255, 0.12)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ffffff",
                        fontSize: "14px",
                    }}
                >
                    ↗
                </div>
            </div>
        </motion.div>
    )
}

LiquidGlassCard.defaultProps = {
    title: "Quantum Neural Pipeline",
    subtitle: "Liquid Shaders",
    description:
        "Multi-layered refractive glass architecture with GPU-accelerated specular light dispersion.",
    glassBlur: 24,
    glassOpacity: 0.08,
    borderColor: "rgba(255, 255, 255, 0.18)",
    refractionGlow: true,
    accentColor: "#38BDF8",
    borderRadius: 24,
}

addPropertyControls(LiquidGlassCard, {
    title: { type: ControlType.String, title: "Title" },
    subtitle: { type: ControlType.String, title: "Subtitle" },
    description: { type: ControlType.String, title: "Description" },
    glassBlur: {
        type: ControlType.Number,
        title: "Blur (px)",
        min: 10,
        max: 60,
        step: 2,
    },
    glassOpacity: {
        type: ControlType.Number,
        title: "Opacity",
        min: 0.02,
        max: 0.3,
        step: 0.02,
    },
    borderColor: { type: ControlType.Color, title: "Border" },
    refractionGlow: { type: ControlType.Boolean, title: "Refraction Light" },
    accentColor: { type: ControlType.Color, title: "Accent Glow" },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 12,
        max: 40,
        step: 2,
    },
})
