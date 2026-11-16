import { motion } from "framer-motion"
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
 * Cinematic Logo Intro
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 450
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function CinematicIntro(props) {
    const {
        logo = {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Logo",
        },
        videoSourceType = "upload",
        videoSrc = "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
        videoUrl,
        overlayColor,
        logoWidth,
        animationType = "fall",
        stiffness,
        damping,
        mass,
        delay,
        text,
        font,
        textColor,
        textDelay,
        showSkipButton,
        skipButtonText,
        skipButtonLink,
        skipButtonDelay,
        onSkip,
        skipButtonColor,
        skipButtonTextColor,
        skipButtonFont,
        showProgressBar = true,
        progressBarDuration = 5,
        progressBarColor = "#FFFFFF",
        progressBarHeight = 4,
        progressBarPosition = "bottom",
    } = props

    const isStatic = useIsStaticRenderer()

    const resolvedVideoSrc = videoSourceType === "url" ? videoUrl : videoSrc

    const animations = {
        fall: {
            initial: { scale: 1.5, opacity: 0, filter: "blur(10px)" },
            animate: { scale: 1, opacity: 1, filter: "blur(0px)" },
        },
        fade: {
            initial: { opacity: 0, filter: "blur(10px)" },
            animate: { opacity: 1, filter: "blur(0px)" },
        },
        slide: {
            initial: { y: -50, opacity: 0, filter: "blur(5px)" },
            animate: { y: 0, opacity: 1, filter: "blur(0px)" },
        },
        rotate: {
            initial: {
                scale: 0.5,
                rotate: -180,
                opacity: 0,
                filter: "blur(10px)",
            },
            animate: { scale: 1, rotate: 0, opacity: 1, filter: "blur(0px)" },
        },
        scale: {
            initial: { scale: 0, opacity: 0, filter: "blur(10px)" },
            animate: { scale: 1, opacity: 1, filter: "blur(0px)" },
        },
        flip: {
            initial: { rotateY: 90, opacity: 0 },
            animate: { rotateY: 0, opacity: 1 },
        },
        zoomOut: {
            initial: { scale: 3, opacity: 0, filter: "blur(10px)" },
            animate: { scale: 1, opacity: 1, filter: "blur(0px)" },
        },
        spin: {
            initial: { rotate: 720, scale: 0, opacity: 0 },
            animate: { rotate: 0, scale: 1, opacity: 1 },
        },
        slideUp: {
            initial: { y: 100, opacity: 0, filter: "blur(5px)" },
            animate: { y: 0, opacity: 1, filter: "blur(0px)" },
        },
        slideLeft: {
            initial: { x: 100, opacity: 0, filter: "blur(5px)" },
            animate: { x: 0, opacity: 1, filter: "blur(0px)" },
        },
        slideRight: {
            initial: { x: -100, opacity: 0, filter: "blur(5px)" },
            animate: { x: 0, opacity: 1, filter: "blur(0px)" },
        },
    }

    const currentAnimation = animations[animationType] || animations.fall
    const SkipTag = skipButtonLink ? motion.a : motion.button

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                backgroundColor: "#000",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {/* Background Video */}
            {isStatic ? (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "radial-gradient(60% 60% at 50% 35%, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.95) 70%), #000",
                        opacity: 0.9,
                    }}
                />
            ) : (
                <video
                    src={resolvedVideoSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: 0.6,
                    }}
                />
            )}

            {/* Dark Overlay */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: overlayColor,
                }}
            />

            {/* Animated Logo */}
            <div style={{ perspective: 1000, zIndex: 10 }}>
                {isStatic ? (
                    <img
                        src={logo.src}
                        alt={logo.alt}
                        style={{
                            width: logoWidth,
                            height: "auto",
                            position: "relative",
                            display: "block",
                            opacity: 1,
                            transform: "scale(1)",
                            filter: "blur(0px)",
                        }}
                    />
                ) : (
                    <motion.img
                        src={logo.src}
                        alt={logo.alt}
                        initial={currentAnimation.initial}
                        animate={currentAnimation.animate}
                        transition={{
                            type: "spring",
                            stiffness: stiffness,
                            damping: damping,
                            mass: mass,
                            delay: delay,
                        }}
                        style={{
                            width: logoWidth,
                            height: "auto",
                            position: "relative",
                            display: "block",
                        }}
                    />
                )}
            </div>

            {/* Animated Text */}
            {text &&
                (isStatic ? (
                    <div
                        style={{
                            position: "relative",
                            zIndex: 10,
                            marginTop: 40,
                            color: textColor,
                            ...font,
                        }}
                    >
                        {text}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            delay: textDelay,
                            duration: 1,
                            ease: "easeOut",
                        }}
                        style={{
                            position: "relative",
                            zIndex: 10,
                            marginTop: 40,
                            color: textColor,
                            ...font,
                        }}
                    >
                        {text}
                    </motion.div>
                ))} 

            {/* Skip Button */}
            {showSkipButton && (
                <SkipTag
                    initial={isStatic ? undefined : { opacity: 0 }}
                    animate={isStatic ? undefined : { opacity: 1 }}
                    transition={isStatic ? undefined : { delay: skipButtonDelay, duration: 0.5 }}
                    onClick={onSkip}
                    {...(skipButtonLink ? { href: skipButtonLink, target: "_blank", rel: "noopener noreferrer" } : {})}
                    style={{
                        position: "absolute",
                        bottom: 30,
                        right: 30,
                        zIndex: 20,
                        background: "transparent",
                        border: `1px solid ${skipButtonColor}`,
                        color: skipButtonTextColor,
                        padding: "8px 16px",
                        borderRadius: 20,
                        cursor: "pointer",
                        outline: "none",
                        textDecoration: "none",
                        ...skipButtonFont,
                        ...(isStatic ? { opacity: 1 } : null),
                    }}
                >
                    {skipButtonText}
                </SkipTag>
            )}

            {/* Progress Bar */}
            {showProgressBar && (
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        [progressBarPosition]: 0,
                        height: progressBarHeight,
                        backgroundColor: "rgba(255,255,255,0.2)",
                        zIndex: 30,
                    }}
                >
                    {isStatic ? (
                        <div
                            style={{
                                height: "100%",
                                width: "100%",
                                backgroundColor: progressBarColor,
                            }}
                        />
                    ) : (
                        <motion.div
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{
                                duration: progressBarDuration,
                                ease: "linear",
                            }}
                            style={{
                                height: "100%",
                                backgroundColor: progressBarColor,
                            }}
                        />
                    )}
                </div>
            )}
        </div>
    )
}

addPropertyControls(CinematicIntro, {
    logo: {
        type: ControlType.ResponsiveImage,
        title: "Logo",
    },
    logoWidth: {
        type: ControlType.Number,
        title: "Logo Width",
        defaultValue: 200,
        min: 50,
        max: 1000,
        step: 10,
        displayStepper: true,
    },
    animationType: {
        type: ControlType.Enum,
        title: "Animation",
        options: [
            "fall",
            "fade",
            "slide",
            "rotate",
            "scale",
            "flip",
            "zoomOut",
            "spin",
            "slideUp",
            "slideLeft",
            "slideRight",
        ],
        optionTitles: [
            "Fall",
            "Fade In",
            "Slide Down",
            "Rotate",
            "Scale Up",
            "3D Flip",
            "Zoom Out",
            "Spin In",
            "Slide Up",
            "Slide Left",
            "Slide Right",
        ],
        defaultValue: "fall",
    },
    videoSourceType: {
        type: ControlType.Enum,
        title: "Video Source",
        options: ["upload", "url"],
        optionTitles: ["Upload", "URL"],
        defaultValue: "upload",
    },
    videoSrc: {
        type: ControlType.File,
        title: "Video Upload",
        allowedFileTypes: ["mp4", "webm"],
        hidden: (props) => props.videoSourceType === "url",
    },
    videoUrl: {
        type: ControlType.Link,
        title: "Video URL",
        defaultValue: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
        hidden: (props) => props.videoSourceType !== "url",
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay",
        defaultValue: "rgba(0, 0, 0, 0.5)",
    },
    stiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        defaultValue: 30,
        min: 1,
        max: 200,
        step: 1,
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        defaultValue: 15,
        min: 1,
        max: 100,
        step: 1,
    },
    mass: {
        type: ControlType.Number,
        title: "Mass",
        defaultValue: 2,
        min: 0.1,
        max: 10,
        step: 0.1,
        displayStepper: true,
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 0.5,
        min: 0,
        max: 5,
        step: 0.1,
        unit: "s",
    },
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "CINEMATIC",
    },
    font: {
        type: ControlType.Font,
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 24,
            letterSpacing: "0.2em",
            variant: "Semibold",
            textAlign: "center",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    textDelay: {
        type: ControlType.Number,
        title: "Text Delay",
        defaultValue: 1.5,
        min: 0,
        max: 10,
        step: 0.1,
        unit: "s",
    },
    showSkipButton: {
        type: ControlType.Boolean,
        title: "Skip Button",
        defaultValue: true,
    },
    skipButtonText: {
        type: ControlType.String,
        title: "Button Text",
        defaultValue: "Skip Intro",
        hidden: (props) => !props.showSkipButton,
    },
    skipButtonLink: {
        type: ControlType.Link,
        title: "Link",
        hidden: (props) => !props.showSkipButton,
    },
    skipButtonDelay: {
        type: ControlType.Number,
        title: "Button Delay",
        defaultValue: 2,
        min: 0,
        max: 10,
        step: 0.1,
        unit: "s",
        hidden: (props) => !props.showSkipButton,
    },
    skipButtonColor: {
        type: ControlType.Color,
        title: "Button Border",
        defaultValue: "rgba(255, 255, 255, 0.5)",
        hidden: (props) => !props.showSkipButton,
    },
    skipButtonTextColor: {
        type: ControlType.Color,
        title: "Button Text",
        defaultValue: "#FFFFFF",
        hidden: (props) => !props.showSkipButton,
    },
    skipButtonFont: {
        type: ControlType.Font,
        controls: "basic",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 14,
            variant: "Medium",
            letterSpacing: "0.05em",
        },
        hidden: (props) => !props.showSkipButton,
    },
    onSkip: {
        type: ControlType.EventHandler,
    },
    showProgressBar: {
        type: ControlType.Boolean,
        title: "Progress Bar",
        defaultValue: true,
    },
    progressBarDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 5,
        min: 1,
        max: 60,
        unit: "s",
        hidden: (props) => !props.showProgressBar,
    },
    progressBarColor: {
        type: ControlType.Color,
        title: "Bar Color",
        defaultValue: "#FFFFFF",
        hidden: (props) => !props.showProgressBar,
    },
    progressBarHeight: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 4,
        min: 1,
        max: 20,
        hidden: (props) => !props.showProgressBar,
    },
    progressBarPosition: {
        type: ControlType.Enum,
        title: "Position",
        options: ["top", "bottom"],
        optionTitles: ["Top", "Bottom"],
        defaultValue: "bottom",
        hidden: (props) => !props.showProgressBar,
    },
})