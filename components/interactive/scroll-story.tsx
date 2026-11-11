import { useRef, type CSSProperties } from "react"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface StoryImage {
    src: string
    srcSet?: string
    alt?: string
}

interface StorySlide {
    leftImage?: StoryImage
    leftHeading?: string
    leftText?: string
    rightImage?: StoryImage
    rightHeading?: string
    rightText?: string
}

interface ScrollStoryProps {
    slide1LeftImage?: StoryImage
    slide1LeftHeading?: string
    slide1LeftText?: string
    slide1RightImage?: StoryImage
    slide1RightHeading?: string
    slide1RightText?: string

    slide2LeftImage?: StoryImage
    slide2LeftHeading?: string
    slide2LeftText?: string
    slide2RightImage?: StoryImage
    slide2RightHeading?: string
    slide2RightText?: string

    slide3LeftImage?: StoryImage
    slide3LeftHeading?: string
    slide3LeftText?: string
    slide3RightImage?: StoryImage
    slide3RightHeading?: string
    slide3RightText?: string

    slide4LeftImage?: StoryImage
    slide4LeftHeading?: string
    slide4LeftText?: string
    slide4RightImage?: StoryImage
    slide4RightHeading?: string
    slide4RightText?: string

    slide5LeftImage?: StoryImage
    slide5LeftHeading?: string
    slide5LeftText?: string
    slide5RightImage?: StoryImage
    slide5RightHeading?: string
    slide5RightText?: string

    backgroundColor: string
    textColor: string
    headingFont: any
    bodyFont: any
    style?: CSSProperties
}

/* -------------------------------------------------------------------------- */
/* DEFAULT IMAGES                                                             */
/* -------------------------------------------------------------------------- */

const DEFAULT_IMAGES = [
    "https://www.lummi.ai/api/render/image/0f1e332c-2482-468c-823d-7a066a41c10d?token=eyJhbGciOiJIUzI1NiJ9.eyJpZHMiOlsiMGYxZTMzMmMtMjQ4Mi00NjhjLTgyM2QtN2EwNjZhNDFjMTBkIl0sInJlc29sdXRpb24iOiJtZWRpdW0iLCJyZW5kZXJTcGVjcyI6eyJlZmZlY3RzIjp7InJlZnJhbWUiOnt9fX0sInNob3VsZEF1dG9Eb3dubG9hZCI6ZmFsc2UsImp0aSI6IjhxbG84LXAwWGR5ejhGbll6Zk81OCIsImlhdCI6MTc4ODcxNTc5MywiZXhwIjoxNzg4NzE1ODUzfQ.xUWVrkxOrHMiE25Wu5D1lWIdv_cC7KSdC89VB70BSL0",

    "https://assets.lummi.ai/assets/QmdiqgLVKJdiyDWrw69eZTSx3pmx9nHbvkHbMuFaxua9h8?auto=format&w=640",

    "https://www.lummi.ai/api/render/image/5608da93-bf65-49b2-a7c5-a0c0b68c0d82?token=eyJhbGciOiJIUzI1NiJ9.eyJpZHMiOlsiNTYwOGRhOTMtYmY2NS00OWIyLWE3YzUtYTBjMGI2OGMwZDgyIl0sInJlc29sdXRpb24iOiJtZWRpdW0iLCJyZW5kZXJTcGVjcyI6eyJlZmZlY3RzIjp7InJlZnJhbWUiOnt9fX0sInNob3VsZEF1dG9Eb3dubG9hZCI6ZmFsc2UsImp0aSI6IjlMSjJha282akdDeUdpSFpOM29vciIsImlhdCI6MTc4ODcxNjgzMSwiZXhwIjoxNzg4NzE2ODkxfQ.-avRlziU_zKx1TNalUDvMlTMWxnNX0NWaTL_gSFjdjM",

    "https://www.lummi.ai/api/render/image/213da244-1713-4274-bd13-aa9059b3c726?token=eyJhbGciOiJIUzI1NiJ9.eyJpZHMiOlsiMjEzZGEyNDQtMTcxMy00Mjc0LWJkMTMtYWE5MDU5YjNjNzI2Il0sInJlc29sdXRpb24iOiJtZWRpdW0iLCJyZW5kZXJTcGVjcyI6eyJlZmZlY3RzIjp7InJlZnJhbWUiOnt9fX0sInNob3VsZEF1dG9Eb3dubG9hZCI6Im51RHdXb0lmaGRiTmN5eUNnYlowbiIsImlhdCI6MTc4ODcxNjc5NCwiZXhwIjoxNzg4NzE2ODU0fQ.FmEkv37yLm_sulSRxS0vMUUQK-nR8BwGYsDRZXq0S2A",

    "https://assets.lummi.ai/assets/QmVkxg4jSeFJa5aeJz27ZwNzsuJQ7HQ3cbbkhN4nmu9Rc9?auto=format&w=640",

    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=85",

    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=85",

    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=85",

    "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1600&q=85",

    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1600&q=85",
]

/**
 * Scroll Story
 *
 * A pinned, split-screen scroll narrative.
 *
 * The first screen contains a small scroll-to-explore message.
 * The message fades away as the first story slide enters.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ScrollStory(props: ScrollStoryProps) {
    const {
        backgroundColor = "#000000",
        textColor = "#FFFFFF",
        headingFont,
        bodyFont,
    } = props

    const slides: StorySlide[] = [1, 2, 3, 4, 5]
        .map((n) => ({
            leftImage: (props as any)[`slide${n}LeftImage`],
            leftHeading: (props as any)[`slide${n}LeftHeading`],
            leftText: (props as any)[`slide${n}LeftText`],

            rightImage: (props as any)[`slide${n}RightImage`],
            rightHeading: (props as any)[`slide${n}RightHeading`],
            rightText: (props as any)[`slide${n}RightText`],
        }))
        .filter(
            (slide) =>
                slide.leftImage ||
                slide.rightImage ||
                slide.leftHeading ||
                slide.rightHeading
        )

    const isStatic = useIsStaticRenderer()

    const containerRef = useRef<HTMLDivElement>(null)

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    })

    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 220,
        damping: 40,
        mass: 0.6,
    })

    const count = Math.max(1, slides.length)

    /* ---------------------------------------------------------------------- */
    /* STATIC / THUMBNAIL RENDERER                                            */
    /* ---------------------------------------------------------------------- */

    if (isStatic || RenderTarget.current() === RenderTarget.thumbnail) {
        const slide = slides[0] || {}

        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100vh",
                    backgroundColor,
                    overflow: "hidden",
                    display: "flex",
                    fontFamily: bodyFont?.fontFamily,
                }}
            >
                <StaticHalf
                    image={slide.leftImage}
                    heading={slide.leftHeading}
                    text={slide.leftText}
                    textColor={textColor}
                    headingFont={headingFont}
                    bodyFont={bodyFont}
                />

                <StaticHalf
                    image={slide.rightImage}
                    heading={slide.rightHeading}
                    text={slide.rightText}
                    textColor={textColor}
                    headingFont={headingFont}
                    bodyFont={bodyFont}
                />
            </div>
        )
    }

    /* ---------------------------------------------------------------------- */
    /* ANIMATED RENDER                                                        */
    /* ---------------------------------------------------------------------- */

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: `${count * 100}vh`,
            }}
        >
            <div
                style={{
                    position: "sticky",
                    top: 0,
                    width: "100%",
                    height: "100vh",
                    overflow: "hidden",
                    backgroundColor,
                }}
            >
                {/* ---------------------------------------------------------- */}
                {/* SCROLL TO EXPLORE                                           */}
                {/* ---------------------------------------------------------- */}

                <ScrollIntro
                    progress={smoothProgress}
                    textColor={textColor}
                    headingFont={headingFont}
                />

                {/* ---------------------------------------------------------- */}
                {/* STORY SLIDES                                                */}
                {/* ---------------------------------------------------------- */}

                {slides.map((slide, i) => (
                    <StorySlideLayer
                        key={i}
                        index={i}
                        count={count}
                        progress={smoothProgress}
                        slide={slide}
                        textColor={textColor}
                        headingFont={headingFont}
                        bodyFont={bodyFont}
                    />
                ))}
            </div>
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* SCROLL INTRO                                                               */
/* -------------------------------------------------------------------------- */

function ScrollIntro({
    progress,
    textColor,
    headingFont,
}: {
    progress: any
    textColor: string
    headingFont: any
}) {
    /*
     * The intro is visible at the very beginning.
     * It fades and moves slightly upward as the first slide enters.
     */
    const opacity = useTransform(progress, [0, 0.12], [1, 0])

    const y = useTransform(progress, [0, 0.12], ["0px", "-20px"])

    return (
        <motion.div
            style={{
                position: "absolute",
                inset: 0,
                zIndex: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                opacity,
                y,
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                }}
            >
                <div
                    style={{
                        color: textColor,
                        opacity: 0.9,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        fontSize: 14,
                        lineHeight: 1.2,
                        ...headingFont,
                    }}
                >
                    Scroll to Explore
                </div>

                <div
                    style={{
                        color: textColor,
                        opacity: 0.6,
                        marginTop: 14,
                        fontSize: 18,
                        lineHeight: 1,
                    }}
                >
                    ↓
                </div>
            </div>
        </motion.div>
    )
}

/* -------------------------------------------------------------------------- */
/* STORY SLIDE                                                                */
/* -------------------------------------------------------------------------- */

function StorySlideLayer({
    index,
    count,
    progress,
    slide,
    textColor,
    headingFont,
    bodyFont,
}: {
    index: number
    count: number
    progress: any
    slide: StorySlide
    textColor: string
    headingFont: any
    bodyFont: any
}) {
    const start = index / count
    const end = (index + 1) / count
    const mid = (start + end) / 2

    /*
     * Left side enters from the bottom.
     * Right side enters from the top.
     */

    const leftY = useTransform(
        progress,
        [start, mid, end],
        ["100%", "0%", index === count - 1 ? "0%" : "-100%"]
    )

    const rightY = useTransform(
        progress,
        [start, mid, end],
        ["-100%", "0%", index === count - 1 ? "0%" : "100%"]
    )

    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                pointerEvents: "none",
            }}
        >
            {/* LEFT */}
            <motion.div
                style={{
                    position: "relative",
                    width: "50%",
                    height: "100%",
                    overflow: "hidden",
                    y: leftY,
                }}
            >
                <SlideHalf
                    image={slide.leftImage}
                    heading={slide.leftHeading}
                    text={slide.leftText}
                    textColor={textColor}
                    headingFont={headingFont}
                    bodyFont={bodyFont}
                />
            </motion.div>

            {/* RIGHT */}
            <motion.div
                style={{
                    position: "relative",
                    width: "50%",
                    height: "100%",
                    overflow: "hidden",
                    y: rightY,
                }}
            >
                <SlideHalf
                    image={slide.rightImage}
                    heading={slide.rightHeading}
                    text={slide.rightText}
                    textColor={textColor}
                    headingFont={headingFont}
                    bodyFont={bodyFont}
                />
            </motion.div>
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* SLIDE HALF                                                                 */
/* -------------------------------------------------------------------------- */

function SlideHalf({
    image,
    heading,
    text,
    textColor,
    headingFont,
    bodyFont,
}: {
    image?: StoryImage
    heading?: string
    text?: string
    textColor: string
    headingFont: any
    bodyFont: any
}) {
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                backgroundImage: image?.src ? `url(${image.src})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px",
            }}
        >
            {(heading || text) && (
                <div
                    style={{
                        maxWidth: 420,
                        textAlign: "center",
                    }}
                >
                    {heading && (
                        <div
                            style={{
                                color: textColor,
                                marginBottom: 16,
                                textTransform: "uppercase",
                                ...headingFont,
                            }}
                        >
                            {heading}
                        </div>
                    )}

                    {text && (
                        <div
                            style={{
                                color: textColor,
                                ...bodyFont,
                            }}
                        >
                            {text}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* STATIC HALF                                                                */
/* -------------------------------------------------------------------------- */

function StaticHalf({
    image,
    heading,
    text,
    textColor,
    headingFont,
    bodyFont,
}: {
    image?: StoryImage
    heading?: string
    text?: string
    textColor: string
    headingFont: any
    bodyFont: any
}) {
    return (
        <div
            style={{
                width: "50%",
                height: "100%",
            }}
        >
            <SlideHalf
                image={image}
                heading={heading}
                text={text}
                textColor={textColor}
                headingFont={headingFont}
                bodyFont={bodyFont}
            />
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* PROPERTY CONTROLS                                                          */
/* -------------------------------------------------------------------------- */

function slideFieldControls(n: number) {
    const leftImage = DEFAULT_IMAGES[(n - 1) * 2]
    const rightImage = DEFAULT_IMAGES[(n - 1) * 2 + 1]

    return {
        [`slide${n}LeftImage`]: {
            type: ControlType.ResponsiveImage,
            title: `Slide ${n} Left Image`,
            defaultValue: {
                src: leftImage,
            },
        },

        [`slide${n}LeftHeading`]: {
            type: ControlType.String,
            title: `Slide ${n} Left Heading`,
            defaultValue: `Chapter ${n}`,
        },

        [`slide${n}LeftText`]: {
            type: ControlType.String,
            title: `Slide ${n} Left Text`,
            displayTextArea: true,
            defaultValue: "A visual story told through movement and scroll.",
        },

        [`slide${n}RightImage`]: {
            type: ControlType.ResponsiveImage,
            title: `Slide ${n} Right Image`,
            defaultValue: {
                src: rightImage,
            },
        },

        [`slide${n}RightHeading`]: {
            type: ControlType.String,
            title: `Slide ${n} Right Heading`,
            defaultValue: `Explore ${n}`,
        },

        [`slide${n}RightText`]: {
            type: ControlType.String,
            title: `Slide ${n} Right Text`,
            displayTextArea: true,
            defaultValue:
                "Create immersive layouts with a smooth split-screen transition.",
        },
    }
}

/* -------------------------------------------------------------------------- */
/* FRAMER PROPERTY CONTROLS                                                   */
/* -------------------------------------------------------------------------- */

addPropertyControls(ScrollStory, {
    ...slideFieldControls(1),
    ...slideFieldControls(2),
    ...slideFieldControls(3),
    ...slideFieldControls(4),
    ...slideFieldControls(5),

    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },

    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },

    headingFont: {
        type: ControlType.Font,
        title: "Heading Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 40,
            variant: "Black",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
        },
    },

    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 15,
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: 1.4,
        },
    },
})
