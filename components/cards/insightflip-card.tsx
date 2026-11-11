// 3D flip card animation with glassmorphism and interactive effects
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion"
import { useState, useEffect, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface FlipCard3DProps {
    frontTitle: string
    frontDescription: string
    frontImage: { src: string; alt: string }
    backTitle: string
    backDescription: string
    backImage: { src: string; alt: string }
    cardColor: string
    textColor: string
    accentColor: string
    autoFlip: boolean
    autoFlipDuration: number
    glassEffect: boolean
    titleFont: CSSProperties
    descriptionFont: CSSProperties
    style?: CSSProperties
}

/**
 * 3D Flip Card
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 500
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function FlipCard3D(props: FlipCard3DProps) {
    const {
        frontTitle,
        frontDescription,
        frontImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Front",
        },
        backTitle,
        backDescription,
        backImage = {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Back",
        },
        cardColor,
        textColor,
        accentColor,
        autoFlip,
        autoFlipDuration,
        glassEffect,
        titleFont,
        descriptionFont,
        style,
    } = props

    const [isFlipped, setIsFlipped] = useState(false)
    const [isHovering, setIsHovering] = useState(false)
    const isStatic = useIsStaticRenderer()
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), {
        stiffness: 300,
        damping: 30,
    })
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), {
        stiffness: 300,
        damping: 30,
    })

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!e.currentTarget || isStatic) return
        const rect = e.currentTarget.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width - 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5
        mouseX.set(x)
        mouseY.set(y)
    }

    const handleMouseEnter = () => {
        if (isStatic) return
        startTransition(() => {
            setIsHovering(true)
            setIsFlipped(true)
        })
    }

    const handleMouseLeave = () => {
        if (isStatic) return
        mouseX.set(0)
        mouseY.set(0)
        startTransition(() => {
            setIsHovering(false)
            setIsFlipped(false)
        })
    }

    const cardStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        position: "relative",
        cursor: "pointer",
        perspective: "1000px",
    }

    const innerCardStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        position: "relative",
        transformStyle: "preserve-3d",
    }

    const faceStyle: CSSProperties = {
        position: "absolute",
        width: "100%",
        height: "100%",
        backfaceVisibility: "hidden",
        borderRadius: "20px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "30px",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        ...(glassEffect && {
            background: `linear-gradient(135deg, ${cardColor}cc, ${cardColor}99)`,
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
        }),
        ...(!glassEffect && {
            background: cardColor,
        }),
    }

    const imageStyle: CSSProperties = {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        zIndex: 0,
        opacity: 0.3,
    }

    const contentStyle: CSSProperties = {
        position: "relative",
        zIndex: 1,
    }

    const titleStyle: CSSProperties = {
        margin: 0,
        marginBottom: "12px",
        color: textColor,
        ...titleFont,
    }

    const descriptionStyle: CSSProperties = {
        margin: 0,
        color: textColor,
        opacity: 0.9,
        ...descriptionFont,
    }

    const badgeStyle: CSSProperties = {
        position: "absolute",
        top: "20px",
        right: "20px",
        padding: "8px 16px",
        borderRadius: "20px",
        background: accentColor,
        color: "#FFFFFF",
        fontSize: "12px",
        fontWeight: 600,
        zIndex: 2,
    }

    return (
        <div style={cardStyle} onMouseMove={handleMouseMove} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <motion.div
                style={{
                    ...innerCardStyle,
                    rotateX: isStatic ? 0 : rotateX,
                    rotateY: isStatic ? 0 : rotateY,
                }}
                animate={{ rotateY: isStatic ? 0 : isFlipped ? 180 : 0 }}
                transition={{ duration: 0.8, type: "spring", stiffness: 80, damping: 20 }}
            >
                {/* Front Face */}
                <motion.div
                    style={{
                        ...faceStyle,
                        transform: "rotateY(0deg)",
                    }}
                    initial={isStatic ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <img src={frontImage.src} alt={frontImage.alt} style={imageStyle} />
                    <div style={badgeStyle}>FRONT</div>
                    <div style={contentStyle}>
                        <h2 style={titleStyle}>{frontTitle}</h2>
                        <p style={descriptionStyle}>{frontDescription}</p>
                    </div>
                </motion.div>

                {/* Back Face */}
                <motion.div
                    style={{
                        ...faceStyle,
                        transform: "rotateY(180deg)",
                    }}
                >
                    <img src={backImage.src} alt={backImage.alt} style={imageStyle} />
                    <div style={badgeStyle}>BACK</div>
                    <div style={contentStyle}>
                        <h2 style={titleStyle}>{backTitle}</h2>
                        <p style={descriptionStyle}>{backDescription}</p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    )
}

addPropertyControls(FlipCard3D, {
    frontTitle: {
        type: ControlType.String,
        title: "Front Title",
        defaultValue: "Discover",
    },
    frontDescription: {
        type: ControlType.String,
        title: "Front Description",
        defaultValue: "Explore amazing features with our interactive 3D card experience",
        displayTextArea: true,
    },
    frontImage: {
        type: ControlType.ResponsiveImage,
        title: "Front Image",
    },
    backTitle: {
        type: ControlType.String,
        title: "Back Title",
        defaultValue: "Learn More",
    },
    backDescription: {
        type: ControlType.String,
        title: "Back Description",
        defaultValue: "Dive deeper into the details and unlock new possibilities",
        displayTextArea: true,
    },
    backImage: {
        type: ControlType.ResponsiveImage,
        title: "Back Image",
    },
    cardColor: {
        type: ControlType.Color,
        title: "Card Color",
        defaultValue: "#000000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#0099FF",
    },
    glassEffect: {
        type: ControlType.Boolean,
        title: "Glass Effect",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "32px",
            variant: "Bold",
            letterSpacing: "-0.03em",
            lineHeight: "1em",
        },
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Description Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
})