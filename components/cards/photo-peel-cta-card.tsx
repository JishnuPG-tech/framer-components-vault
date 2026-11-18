import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useReducedMotion } from "framer-motion"

type ResponsiveImage = {
    src?: string
    srcSet?: string
    alt?: string
}

interface Props {
    headline: string
    description: string
    ctaLabel: string
    link: string
    firstImage?: ResponsiveImage
    secondImage?: ResponsiveImage
    firstImagePosition: string
    secondImagePosition: string
    panelColor: string
    textColor: string
    buttonColor: string
    buttonTextColor: string
    cardRadius: number
    cardMinHeight: number
    horizontalPadding: number
    animationDuration: number
    style?: React.CSSProperties
}

const FIRST_IMAGE: ResponsiveImage = {
    src: "https://images.unsplash.com/photo-1701028613111-b68614a9b72a?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1700",
    alt: "Bright yellow flower against a saturated blue backdrop",
}

const SECOND_IMAGE: ResponsiveImage = {
    src: "https://images.unsplash.com/photo-1721434144886-b23e136a2cd2?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1800",
    alt: "Vivid violet flower against a soft pink background",
}

const smoothEase: [number, number, number, number] = [0.22, 1, 0.36, 1]

/**
 * Photo Peel CTA Card
 * One focused, full-card link with an editorial image peel interaction.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1040
 * @framerIntrinsicHeight 424
 */
export default function PhotoPeelCTACard(props: Props) {
    const {
        headline,
        description,
        ctaLabel,
        link,
        firstImage,
        secondImage,
        firstImagePosition,
        secondImagePosition,
        panelColor,
        textColor,
        buttonColor,
        buttonTextColor,
        cardRadius,
        cardMinHeight,
        horizontalPadding,
        animationDuration,
        style,
    } = props

    const [revealed, setRevealed] = React.useState(false)
    const reducedMotion = useReducedMotion()
    const destination = (link || "").trim()
    const hasLink = destination.length > 0
    const baseImage = firstImage?.src ? firstImage : FIRST_IMAGE
    const peelImage = secondImage?.src ? secondImage : SECOND_IMAGE
    const duration = reducedMotion ? 0 : animationDuration

    const sharedCardStyle: React.CSSProperties = {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
        width: "100%",
        minHeight: cardMinHeight,
        borderRadius: cardRadius,
        overflow: "hidden",
        background: panelColor,
        color: textColor,
        textDecoration: "none",
        boxSizing: "border-box",
        outlineOffset: 5,
        cursor: hasLink ? "pointer" : "default",
    }

    const content = (
        <>
            <div
                style={{
                    display: "flex",
                    minWidth: 0,
                    minHeight: cardMinHeight,
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 32,
                    padding: `clamp(26px, 3.6cqw, ${horizontalPadding}px)`,
                    boxSizing: "border-box",
                    background: panelColor,
                }}
            >
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    <h2
                        style={{
                            margin: 0,
                            fontFamily: '"Inter Display", "Inter", sans-serif',
                            fontWeight: 800,
                            fontSize: "clamp(38px, 5.15cqw, 72px)",
                            lineHeight: 0.99,
                            letterSpacing: "-0.065em",
                            color: textColor,
                            maxWidth: 500,
                            overflowWrap: "break-word",
                        }}
                    >
                        {headline}
                    </h2>
                    <p
                        style={{
                            margin: 0,
                            maxWidth: 390,
                            fontFamily: '"Inter", sans-serif',
                            fontWeight: 450,
                            fontSize: "clamp(14px, 1.45cqw, 17px)",
                            lineHeight: 1.48,
                            letterSpacing: "-0.015em",
                            color: textColor,
                            opacity: 0.8,
                        }}
                    >
                        {description}
                    </p>
                </div>
                {hasLink ? (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            width: "100%",
                            gap: 16,
                        }}
                    >
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "fit-content",
                                minHeight: 52,
                                padding: "12px 20px",
                                borderRadius: 999,
                                boxSizing: "border-box",
                                background: buttonColor,
                                color: buttonTextColor,
                                fontFamily: '"Inter", sans-serif',
                                fontSize: 14,
                                fontWeight: 600,
                                letterSpacing: "-0.01em",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {ctaLabel}
                        </span>
                        <motion.span
                            aria-hidden="true"
                            initial={false}
                            animate={{ x: revealed ? 4 : 0, y: revealed ? -4 : 0 }}
                            transition={{ duration: duration * 0.75, ease: smoothEase }}
                            style={{ fontFamily: "Arial, sans-serif", fontWeight: 400, fontSize: 34, lineHeight: 1 }}
                        >
                            ↗
                        </motion.span>
                    </div>
                ) : null}
            </div>

            <div
                style={{
                    position: "relative",
                    isolation: "isolate",
                    minHeight: 300,
                    overflow: "hidden",
                    background: "#2344D8",
                }}
            >
                <motion.img
                    src={baseImage.src}
                    srcSet={baseImage.srcSet}
                    alt={baseImage.alt || "Colorful editorial image"}
                    draggable={false}
                    initial={false}
                    animate={{ scale: revealed && !reducedMotion ? 1.075 : 1 }}
                    transition={{ duration: duration * 1.35, ease: smoothEase }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: firstImagePosition,
                        userSelect: "none",
                        pointerEvents: "none",
                    }}
                />
                <motion.div
                    aria-hidden="true"
                    initial={false}
                    animate={{
                        clipPath: revealed
                            ? "polygon(0% 0%, 115% 0%, 100% 100%, 0% 100%)"
                            : "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)",
                    }}
                    transition={{ duration, ease: smoothEase }}
                    style={{ position: "absolute", inset: 0, overflow: "hidden" }}
                >
                    <motion.img
                        src={peelImage.src}
                        srcSet={peelImage.srcSet}
                        alt=""
                        draggable={false}
                        initial={false}
                        animate={{ scale: revealed && !reducedMotion ? 1 : 1.08 }}
                        transition={{ duration: duration * 1.25, ease: smoothEase }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: secondImagePosition,
                            userSelect: "none",
                            pointerEvents: "none",
                        }}
                    />
                </motion.div>
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        right: 22,
                        top: 22,
                        width: 39,
                        height: 39,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,.96)",
                        color: "#151515",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 19,
                        lineHeight: 1,
                        boxShadow: "0 5px 18px rgba(0,0,0,.12)",
                        pointerEvents: "none",
                    }}
                >
                    ↗
                </div>
            </div>
        </>
    )

    return (
        <motion.div
            onHoverStart={() => setRevealed(true)}
            onHoverEnd={() => setRevealed(false)}
            onFocusCapture={() => setRevealed(true)}
            onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) setRevealed(false)
            }}
            style={{ width: "100%", containerType: "inline-size", boxSizing: "border-box", ...style } as any}
        >
            {hasLink ? (
                <a
                    href={destination}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${ctaLabel}: ${headline}`}
                    style={sharedCardStyle}
                >
                    {content}
                </a>
            ) : (
                <div style={sharedCardStyle}>{content}</div>
            )}
        </motion.div>
    )
}

PhotoPeelCTACard.defaultProps = {
    headline: "Make some noise.",
    description: "Your next idea deserves a place to shine. Make a website that feels like you.",
    ctaLabel: "Start building",
    link: "",
    firstImage: FIRST_IMAGE,
    secondImage: SECOND_IMAGE,
    firstImagePosition: "50% 50%",
    secondImagePosition: "50% 50%",
    panelColor: "#DCFF43",
    textColor: "#151515",
    buttonColor: "#151515",
    buttonTextColor: "#FFFFFF",
    cardRadius: 20,
    cardMinHeight: 424,
    horizontalPadding: 43,
    animationDuration: 0.72,
}

addPropertyControls(PhotoPeelCTACard, {
    headline: { type: ControlType.String, title: "Headline", defaultValue: "Make some noise.", displayTextArea: true },
    description: { type: ControlType.String, title: "Description", defaultValue: "Your next idea deserves a place to shine. Make a website that feels like you.", displayTextArea: true },
    ctaLabel: { type: ControlType.String, title: "CTA", defaultValue: "Start building" },
    link: { type: ControlType.Link, title: "Link", defaultValue: "" },
    firstImage: { type: ControlType.ResponsiveImage, title: "Image" },
    secondImage: { type: ControlType.ResponsiveImage, title: "Reveal Image" },
    firstImagePosition: { type: ControlType.String, title: "Image Crop", defaultValue: "50% 50%" },
    secondImagePosition: { type: ControlType.String, title: "Reveal Crop", defaultValue: "50% 50%" },
    panelColor: { type: ControlType.Color, title: "Panel", defaultValue: "#DCFF43" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#151515" },
    buttonColor: { type: ControlType.Color, title: "Button", defaultValue: "#151515" },
    buttonTextColor: { type: ControlType.Color, title: "Button Text", defaultValue: "#FFFFFF" },
    cardRadius: { type: ControlType.Number, title: "Radius", min: 0, max: 60, step: 1, defaultValue: 20 },
    cardMinHeight: { type: ControlType.Number, title: "Height", min: 260, max: 760, step: 4, defaultValue: 424 },
    horizontalPadding: { type: ControlType.Number, title: "Padding", min: 20, max: 80, step: 1, defaultValue: 43 },
    animationDuration: { type: ControlType.Number, title: "Reveal Speed", min: 0.1, max: 1.5, step: 0.02, defaultValue: 0.72 },
})
