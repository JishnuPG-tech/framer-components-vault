import { motion } from "framer-motion"
import { useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function BurnEffect(props: any) {
    // 1. Check if we are in the Framer editor canvas or static export
    const isStatic = useIsStaticRenderer()

    // 2. If static, return a lightweight, zero-animation fallback
    if (isStatic) {
        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    background: "#000",
                }}
            >
                <img
                    src={
                        props.bottomImage ||
                        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80"
                    }
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        zIndex: 1,
                    }}
                    alt="bottom"
                />
                <img
                    src={
                        props.topImage ||
                        "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80"
                    }
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        zIndex: 2,
                    }}
                    alt="top"
                />
            </div>
        )
    }

    // 3. Otherwise, render the full interactive experience
    const [isHovered, setIsHovered] = useState(false)
    const duration = props.burnDuration || 3

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: "#000",
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Bottom Image (Revealed as top burns away) */}
            <img
                src={
                    props.bottomImage ||
                    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80"
                }
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    zIndex: 1,
                }}
            />

            {/* Top Image with Organic Burn Mask */}
            <svg
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 2,
                }}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
            >
                <defs>
                    {/* Animated turbulence for crawling, flickering fire edge */}
                    <filter
                        id="burn-front"
                        x="-50%"
                        y="-50%"
                        width="200%"
                        height="200%"
                    >
                        <motion.feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.12"
                            numOctaves="3"
                            animate={
                                isHovered
                                    ? {
                                          baseFrequency: [
                                              "0.12",
                                              "0.16",
                                              "0.12",
                                          ],
                                      }
                                    : {}
                            }
                            transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            result="noise"
                        />
                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="noise"
                            scale="15"
                            xChannelSelector="R"
                            yChannelSelector="G"
                        />
                    </filter>

                    {/* Filter for the glowing fire edge */}
                    <filter
                        id="fire-glow"
                        x="-50%"
                        y="-50%"
                        width="200%"
                        height="200%"
                    >
                        <motion.feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.12"
                            numOctaves="3"
                            animate={
                                isHovered
                                    ? {
                                          baseFrequency: [
                                              "0.12",
                                              "0.16",
                                              "0.12",
                                          ],
                                      }
                                    : {}
                            }
                            transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            result="noise"
                        />
                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="noise"
                            scale="15"
                            xChannelSelector="R"
                            yChannelSelector="G"
                            result="displaced"
                        />
                        <feGaussianBlur
                            in="displaced"
                            stdDeviation="1.5"
                            result="blur"
                        />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="displaced" />
                        </feMerge>
                    </filter>

                    {/* Fire gradient for the edge */}
                    <linearGradient
                        id="fire-gradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                    >
                        <stop offset="0%" stopColor="#ffff99" />
                        <stop offset="30%" stopColor="#ff9900" />
                        <stop offset="70%" stopColor="#ff4500" />
                        <stop offset="100%" stopColor="#5c1a00" />
                    </linearGradient>

                    {/* Mask that eats away the top image */}
                    <mask id="burn-mask">
                        <rect width="100" height="100" fill="white" />

                        {/* Expanding circle from bottom-right corner creates organic spreading burn */}
                        <motion.circle
                            cx="100"
                            cy="100"
                            r="0"
                            fill="black"
                            filter="url(#burn-front)"
                            animate={{ r: isHovered ? 150 : 0 }}
                            transition={{
                                duration: duration,
                                ease: "easeInOut",
                            }}
                        />
                    </mask>
                </defs>

                {/* Top Image */}
                <image
                    href={
                        props.topImage ||
                        "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80"
                    }
                    width="100"
                    height="100"
                    mask="url(#burn-mask)"
                    preserveAspectRatio="xMidYMid slice"
                />
            </svg>

            {/* Burn Edge Effects (Rendered on top to simulate the actual fire) */}
            <svg
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 3,
                    pointerEvents: "none",
                }}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
            >
                {/* Charred black edge (slightly ahead of the fire) */}
                <motion.circle
                    cx="100"
                    cy="100"
                    r="0"
                    fill="none"
                    stroke="#0a0500"
                    strokeWidth="4"
                    filter="url(#burn-front)"
                    animate={{ r: isHovered ? 150 : 0 }}
                    transition={{ duration: duration, ease: "easeInOut" }}
                    style={{ opacity: 0.9 }}
                />

                {/* Main glowing fire edge */}
                <motion.circle
                    cx="100"
                    cy="100"
                    r="0"
                    fill="none"
                    stroke="url(#fire-gradient)"
                    strokeWidth="3"
                    filter="url(#fire-glow)"
                    animate={{ r: isHovered ? 150 : 0 }}
                    transition={{ duration: duration, ease: "easeInOut" }}
                    style={{ mixBlendMode: "screen" }}
                />

                {/* Hot white/yellow core of the flame */}
                <motion.circle
                    cx="100"
                    cy="100"
                    r="0"
                    fill="none"
                    stroke="#fff5e6"
                    strokeWidth="1.2"
                    filter="url(#fire-glow)"
                    animate={{ r: isHovered ? 150 : 0 }}
                    transition={{ duration: duration, ease: "easeInOut" }}
                    style={{ mixBlendMode: "screen", opacity: 0.9 }}
                />
            </svg>
        </div>
    )
}

addPropertyControls(BurnEffect, {
    topImage: {
        type: ControlType.Image,
        title: "Top Image",
        description: "The image that will burn away",
    },
    bottomImage: {
        type: ControlType.Image,
        title: "Bottom Image",
        description: "The image revealed underneath",
    },
    burnDuration: {
        type: ControlType.Number,
        defaultValue: 3,
        min: 1,
        max: 6,
        step: 0.1,
        title: "Burn Duration",
        description: "How long the burn takes (seconds)",
    },
})
