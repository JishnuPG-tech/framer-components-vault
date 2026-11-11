/* User request: Update CreativeLab to pass Framer marketplace static-renderer checks by disabling animations/continuous effects during static rendering while preserving live runtime visuals, controls, text, glow, and sizing. */
import * as React from "react";
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, useSpring } from "framer-motion";

interface CreativeLabProps {
    textLine1?: string;
    textLine2?: string;
    textLine3?: string;
    line1?: string;
    line2?: string;
    line3?: string;
    fontSize?: number | string;
    textColor?: string;
    glowColor1?: string;
    glowColor2?: string;
    glowOuter?: string;
    glowInner?: string;
    glowSize?: number | string;
    magneticStrength?: number | string;
    strength?: number | string;
    hoverRadius?: number | string;
    radius?: number | string;
    fontFamily?: string | { fontFamily?: string; fontSelector?: string };
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CreativeLab(props: CreativeLabProps) {
    const {
        textLine1 = props.line1 ?? "CREATIVE",
        textLine2 = props.line2 ?? "DEVELOPMENT",
        textLine3 = props.line3 ?? "LAB",
        textColor = props.textColor ?? "#FFFFFF",
        glowColor1 = props.glowOuter ?? props.glowColor1 ?? "#C084FC",
        glowColor2 = props.glowInner ?? props.glowColor2 ?? "#6366F1",
        fontFamily = "inter",
    } = props;

    const resolvedFont = React.useMemo(() => {
        if (typeof fontFamily === "object" && fontFamily) {
            if (fontFamily.fontFamily) {
                return {
                    fontFamily: fontFamily.fontFamily,
                    fontWeight: 900,
                    fontStyle: "normal" as const,
                }
            }

            if (fontFamily.fontSelector) {
                const selector = fontFamily.fontSelector
                const splitIndex = selector.lastIndexOf("-")
                const selectedFamily =
                    splitIndex > 0 ? selector.slice(0, splitIndex) : selector
                const selectedVariant =
                    splitIndex > 0
                        ? selector
                              .slice(splitIndex + 1)
                              .toLowerCase()
                              .replace(/\s+/g, "")
                        : "regular"

                let weight = 400
                if (selectedVariant.includes("thin")) weight = 100
                else if (selectedVariant.includes("extralight")) weight = 200
                else if (selectedVariant.includes("light")) weight = 300
                else if (selectedVariant.includes("medium")) weight = 500
                else if (selectedVariant.includes("semibold")) weight = 600
                else if (selectedVariant.includes("extrabold")) weight = 800
                else if (selectedVariant.includes("black")) weight = 900
                else if (selectedVariant.includes("bold")) weight = 700

                return {
                    fontFamily: selectedFamily,
                    fontWeight: weight,
                    fontStyle: selectedVariant.includes("italic")
                        ? ("italic" as const)
                        : ("normal" as const),
                }
            }
        }

        if (fontFamily === "inter") {
            return {
                fontFamily: "'Inter', system-ui, sans-serif",
                fontWeight: 900,
                fontStyle: "normal" as const,
            }
        }
        if (fontFamily === "system") {
            return {
                fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                fontWeight: 900,
                fontStyle: "normal" as const,
            }
        }
        if (fontFamily === "arial") {
            return {
                fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
                fontWeight: 900,
                fontStyle: "normal" as const,
            }
        }
        if (fontFamily === "georgia") {
            return {
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontWeight: 900,
                fontStyle: "normal" as const,
            }
        }
        if (fontFamily === "mono") {
            return {
                fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
                fontWeight: 900,
                fontStyle: "normal" as const,
            }
        }

        return {
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: 900,
            fontStyle: "normal" as const,
        }
    }, [fontFamily])

    // Parse numeric props robustly
    const fontSize = React.useMemo(() => {
        const val = props.fontSize ?? 90;
        return typeof val === "string" ? parseFloat(val) : val;
    }, [props.fontSize]);

    const glowSize = React.useMemo(() => {
        const val = props.glowSize ?? 400;
        return typeof val === "string" ? parseFloat(val) : val;
    }, [props.glowSize]);

    const magneticStrength = React.useMemo(() => {
        const val = props.strength ?? props.magneticStrength ?? 50;
        return typeof val === "string" ? parseFloat(val) : val;
    }, [props.strength, props.magneticStrength]);

    const hoverRadius = React.useMemo(() => {
        const val = props.radius ?? props.hoverRadius ?? 150;
        return typeof val === "string" ? parseFloat(val) : val;
    }, [props.radius, props.hoverRadius]);

    const isStaticRenderer = useIsStaticRenderer();
    const containerRef = React.useRef<HTMLDivElement>(null);

    const mouseX = useMotionValue(-1000);
    const mouseY = useMotionValue(-1000);

    const blobX = useSpring(mouseX, { stiffness: 60, damping: 25 });
    const blobY = useSpring(mouseY, { stiffness: 60, damping: 25 });

    React.useEffect(() => {
        if (isStaticRenderer) return;
        if (typeof window === "undefined" || typeof document === "undefined") return;

        const handleGlobalMouseMove = (event: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            mouseX.set(event.clientX - rect.left);
            mouseY.set(event.clientY - rect.top);
        };

        const handleGlobalMouseLeave = () => {
            mouseX.set(-1000);
            mouseY.set(-1000);
        };

        window.addEventListener("mousemove", handleGlobalMouseMove);
        document.addEventListener("mouseleave", handleGlobalMouseLeave);

        return () => {
            window.removeEventListener("mousemove", handleGlobalMouseMove);
            document.removeEventListener("mouseleave", handleGlobalMouseLeave);
        };
    }, [isStaticRenderer, mouseX, mouseY]);

    function MagneticLetter({ char }: { char: string }) {
        const letterRef = React.useRef<HTMLSpanElement>(null);
        
        const x = useMotionValue(0);
        const y = useMotionValue(0);

        const springX = useSpring(x, { stiffness: 150, damping: 15 });
        const springY = useSpring(y, { stiffness: 150, damping: 15 });

        React.useEffect(() => {
            if (isStaticRenderer) return;
            const container = containerRef.current;
            if (!container) return;

            const updateLetterPosition = () => {
                if (!letterRef.current) return;
                const letterRect = letterRef.current.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();

                const letterCenterX = letterRect.left - containerRect.left + letterRect.width / 2;
                const letterCenterY = letterRect.top - containerRect.top + letterRect.height / 2;

                const curMouseX = mouseX.get();
                const curMouseY = mouseY.get();

                const dx = curMouseX - letterCenterX;
                const dy = curMouseY - letterCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < hoverRadius && curMouseX > -500) {
                    const angle = Math.atan2(dy, dx);
                    const force = (1 - distance / hoverRadius) * magneticStrength;
                    x.set(-Math.cos(angle) * force);
                    y.set(-Math.sin(angle) * force);
                } else {
                    x.set(0);
                    y.set(0);
                }
            };

            const unsubscribeX = mouseX.on("change", updateLetterPosition);
            const unsubscribeY = mouseY.on("change", updateLetterPosition);

            return () => {
                unsubscribeX();
                unsubscribeY();
            };
        }, [hoverRadius, isStaticRenderer, magneticStrength, mouseX, mouseY, x, y]);

        if (isStaticRenderer) {
            return (
                <span
                    ref={letterRef}
                    style={{
                        display: "inline-block",
                        userSelect: "none",
                        whiteSpace: "pre",
                        cursor: "default",
                    }}
                >
                    {char}
                </span>
            );
        }

        return (
            <motion.span
                ref={letterRef}
                style={{
                    x: springX,
                    y: springY,
                    display: "inline-block",
                    userSelect: "none",
                    whiteSpace: "pre",
                    cursor: "default",
                }}
                whileHover={{ scale: 1.15, transition: { duration: 0.1 } }}
            >
                {char}
            </motion.span>
        );
    }

    const lineStyle: React.CSSProperties = {
        fontFamily: resolvedFont.fontFamily,
        fontWeight: resolvedFont.fontWeight,
        fontStyle: resolvedFont.fontStyle,
        fontSize: `${fontSize}px`,
        color: textColor,
        lineHeight: "1.05",
        letterSpacing: "-0.04em",
        margin: "0",
        padding: "0",
        textAlign: "center",
        zIndex: 2,
        position: "relative",
    };

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor: "#000000",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
                position: "relative",
                gap: "10px",
            }}
        >
            {isStaticRenderer ? (
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: glowSize,
                        height: glowSize,
                        borderRadius: "50%",
                        background: `radial-gradient(circle, ${glowColor1} 0%, ${glowColor2} 50%, transparent 100%)`,
                        filter: "blur(60px)",
                        pointerEvents: "none",
                        zIndex: 1,
                        opacity: 0.6,
                        transform: "translate(-50%, -50%)",
                    }}
                />
            ) : (
                <motion.div
                    style={{
                        position: "absolute",
                        left: -glowSize / 2,
                        top: -glowSize / 2,
                        width: glowSize,
                        height: glowSize,
                        borderRadius: "50%",
                        background: `radial-gradient(circle, ${glowColor1} 0%, ${glowColor2} 50%, transparent 100%)`,
                        filter: "blur(60px)",
                        pointerEvents: "none",
                        zIndex: 1,
                        x: blobX,
                        y: blobY,
                        opacity: 0.6,
                    }}
                />
            )}

            <div style={lineStyle}>
                {Array.from(textLine1).map((char, idx) => (
                    <MagneticLetter key={`l1-${idx}`} char={char} />
                ))}
            </div>
            <div style={lineStyle}>
                {Array.from(textLine2).map((char, idx) => (
                    <MagneticLetter key={`l2-${idx}`} char={char} />
                ))}
            </div>
            <div style={lineStyle}>
                {Array.from(textLine3).map((char, idx) => (
                    <MagneticLetter key={`l3-${idx}`} char={char} />
                ))}
            </div>
        </div>
    );
}

addPropertyControls(CreativeLab, {
    textLine1: { type: ControlType.String, defaultValue: "CREATIVE", title: "Line 1" },
    textLine2: { type: ControlType.String, defaultValue: "DEVELOPMENT", title: "Line 2" },
    textLine3: { type: ControlType.String, defaultValue: "LAB", title: "Line 3" },
    fontFamily: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            variant: "Black",
            fontSize: "100px",
            letterSpacing: "-0.04em",
            lineHeight: "1.05em",
        },
    },
    fontSize: { type: ControlType.Number, defaultValue: 100, min: 30, max: 200, step: 1, title: "Font Size" },
    textColor: { type: ControlType.Color, defaultValue: "#FFFFFF", title: "Text Color" },
    glowColor1: { type: ControlType.Color, defaultValue: "#C084FC", title: "Glow Outer" },
    glowColor2: { type: ControlType.Color, defaultValue: "#6366F1", title: "Glow Inner" },
    glowSize: { type: ControlType.Number, defaultValue: 450, min: 200, max: 1000, step: 10, title: "Glow Size" },
    magneticStrength: { type: ControlType.Number, defaultValue: 60, min: 10, max: 150, step: 5, title: "Strength" },
    hoverRadius: { type: ControlType.Number, defaultValue: 180, min: 50, max: 400, step: 10, title: "Radius" },
});
