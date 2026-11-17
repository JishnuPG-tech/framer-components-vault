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


function MediaContent(props) {
    const {
        media,
        mediaType,
        poster,
        active,
        autoPlay,
        muted,
        loop,
        controls,
        objectFit,
        alt,
    } = props

    const videoRef = React.useRef(null)

    // Play/pause videos depending on whether they are active
    React.useEffect(() => {
        if (!videoRef.current || mediaType !== "video") return

        const video = videoRef.current

        if (active && autoPlay) {
            video.play().catch(() => {})
        } else {
            video.pause()
        }
    }, [active, autoPlay, mediaType])

    if (mediaType === "video") {
        return (
            <video
                ref={videoRef}
                src={media}
                poster={poster || undefined}
                autoPlay={autoPlay && active}
                muted={muted}
                loop={loop}
                controls={controls}
                playsInline
                preload="metadata"
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    objectFit,
                }}
            />
        )
    }

    return (
        <img
            src={media}
            alt={alt || ""}
            loading="lazy"
            style={{
                width: "100%",
                height: "100%",
                display: "block",
                objectFit,
            }}
        />
    )
}

export default function ThemeMedia(props) {
    const [theme, setTheme] = React.useState("light")
    const [isInView, setIsInView] = React.useState(false)
    const [previousTheme, setPreviousTheme] = React.useState(null)

    const containerRef = React.useRef(null)

    /*
     * ─────────────────────────────
     * THEME DETECTION
     * ─────────────────────────────
     */

    React.useEffect(() => {
        const getTheme = () => {
            // First: Framer theme
            const framerTheme = document.body.getAttribute("data-framer-theme")

            if (framerTheme === "dark") {
                return "dark"
            }

            if (framerTheme === "light") {
                return "light"
            }

            // Fallback: system preference
            if (
                window.matchMedia &&
                window.matchMedia("(prefers-color-scheme: dark)").matches
            ) {
                return "dark"
            }

            return "light"
        }

        const initialTheme = getTheme()

        setTheme(initialTheme)

        /*
         * Watch Framer theme changes
         */
        const observer = new MutationObserver(() => {
            const newTheme = getTheme()

            setTheme((currentTheme) => {
                if (currentTheme !== newTheme) {
                    setPreviousTheme(currentTheme)
                }

                return newTheme
            })
        })

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ["data-framer-theme"],
        })

        /*
         * Watch system theme changes
         */
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

        const handleSystemThemeChange = () => {
            const newTheme = getTheme()

            setTheme((currentTheme) => {
                if (currentTheme !== newTheme) {
                    setPreviousTheme(currentTheme)
                }

                return newTheme
            })
        }

        mediaQuery.addEventListener("change", handleSystemThemeChange)

        return () => {
            observer.disconnect()

            mediaQuery.removeEventListener("change", handleSystemThemeChange)
        }
    }, [])

    /*
     * ─────────────────────────────
     * LAZY LOAD / VIEWPORT DETECTION
     * ─────────────────────────────
     */

    React.useEffect(() => {
        if (!containerRef.current) return

        const element = containerRef.current

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]

                if (entry.isIntersecting) {
                    setIsInView(true)

                    // We only need to trigger this once
                    observer.disconnect()
                }
            },
            {
                /*
                 * Start loading slightly before
                 * the component actually enters
                 * the viewport.
                 */
                rootMargin: "300px",
                threshold: 0,
            }
        )

        observer.observe(element)

        return () => {
            observer.disconnect()
        }
    }, [])

    /*
     * ─────────────────────────────
     * SELECT MEDIA
     * ─────────────────────────────
     */

    const currentMedia = theme === "dark" ? props.darkMedia : props.lightMedia

    const currentType = theme === "dark" ? props.darkType : props.lightType

    const currentPoster =
        theme === "dark" ? props.darkPoster : props.lightPoster

    const previousMedia =
        previousTheme === "dark" ? props.darkMedia : props.lightMedia

    const previousType =
        previousTheme === "dark" ? props.darkType : props.lightType

    const previousPoster =
        previousTheme === "dark" ? props.darkPoster : props.lightPoster

    /*
     * ─────────────────────────────
     * NO MEDIA
     * ─────────────────────────────
     */

    if (!currentMedia) {
        return (
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f1f1f1",
                    color: "#666",
                    fontSize: 14,
                }}
            >
                Upload media
            </div>
        )
    }

    /*
     * ─────────────────────────────
     * LAZY LOADING PLACEHOLDER
     * ─────────────────────────────
     */

    if (!isInView) {
        return (
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    background: props.placeholderColor,
                }}
            />
        )
    }

    /*
     * ─────────────────────────────
     * MEDIA CONTAINER
     * ─────────────────────────────
     */

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* CURRENT MEDIA */}

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 1,
                    transition: `opacity ${props.fadeDuration}s ${props.fadeEasing}`,
                    zIndex: 2,
                }}
            >
                <MediaContent
                    media={currentMedia}
                    mediaType={currentType}
                    poster={currentPoster}
                    active={true}
                    autoPlay={props.autoPlay}
                    muted={props.muted}
                    loop={props.loop}
                    controls={props.controls}
                    objectFit={props.objectFit}
                    alt={props.alt}
                />
            </div>

            {/* PREVIOUS MEDIA */}

            {previousTheme &&
                previousMedia &&
                previousMedia !== currentMedia && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            opacity: 0,
                            transition: `opacity ${props.fadeDuration}s ${props.fadeEasing}`,
                            zIndex: 1,
                        }}
                    >
                        <MediaContent
                            media={previousMedia}
                            mediaType={previousType}
                            poster={previousPoster}
                            active={false}
                            autoPlay={props.autoPlay}
                            muted={props.muted}
                            loop={props.loop}
                            controls={props.controls}
                            objectFit={props.objectFit}
                            alt={props.alt}
                        />
                    </div>
                )}
        </div>
    )
}

ThemeMedia.defaultProps = {
    lightMedia: "",
    darkMedia: "",

    lightType: "image",
    darkType: "image",

    lightPoster: "",
    darkPoster: "",

    autoPlay: true,
    muted: true,
    loop: true,
    controls: false,

    objectFit: "contain",

    alt: "",

    fadeDuration: 0.4,
    fadeEasing: "ease-in-out",

    placeholderColor: "#f1f1f1",
}

addPropertyControls(ThemeMedia, {
    // ─────────────────────────────
    // LIGHT MODE
    // ─────────────────────────────

    lightMedia: {
        type: ControlType.File,
        title: "Light Media",
        allowedFileTypes: [
            "jpg",
            "jpeg",
            "png",
            "webp",
            "gif",
            "svg",
            "mp4",
            "webm",
            "mov",
        ],
    },

    lightType: {
        type: ControlType.Enum,
        title: "Light Type",
        options: ["image", "video"],
        optionTitles: ["Image", "Video"],
        defaultValue: "image",
    },

    lightPoster: {
        type: ControlType.File,
        title: "Light Poster",
        allowedFileTypes: ["jpg", "jpeg", "png", "webp"],
        hidden(props) {
            return props.lightType !== "video"
        },
    },

    // ─────────────────────────────
    // DARK MODE
    // ─────────────────────────────

    darkMedia: {
        type: ControlType.File,
        title: "Dark Media",
        allowedFileTypes: [
            "jpg",
            "jpeg",
            "png",
            "webp",
            "gif",
            "svg",
            "mp4",
            "webm",
            "mov",
        ],
    },

    darkType: {
        type: ControlType.Enum,
        title: "Dark Type",
        options: ["image", "video"],
        optionTitles: ["Image", "Video"],
        defaultValue: "image",
    },

    darkPoster: {
        type: ControlType.File,
        title: "Dark Poster",
        allowedFileTypes: ["jpg", "jpeg", "png", "webp"],
        hidden(props) {
            return props.darkType !== "video"
        },
    },

    // ─────────────────────────────
    // VIDEO
    // ─────────────────────────────

    autoPlay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
    },

    muted: {
        type: ControlType.Boolean,
        title: "Muted",
        defaultValue: true,
    },

    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
    },

    controls: {
        type: ControlType.Boolean,
        title: "Controls",
        defaultValue: false,
    },

    // ─────────────────────────────
    // TRANSITION
    // ─────────────────────────────

    fadeDuration: {
        type: ControlType.Number,
        title: "Fade Duration",
        min: 0,
        max: 2,
        step: 0.05,
        unit: "s",
        defaultValue: 0.4,
    },

    fadeEasing: {
        type: ControlType.Enum,
        title: "Fade Easing",
        options: ["ease", "ease-in", "ease-out", "ease-in-out", "linear"],
        optionTitles: ["Ease", "Ease In", "Ease Out", "Ease In Out", "Linear"],
        defaultValue: "ease-in-out",
    },

    // ─────────────────────────────
    // LAZY LOADING
    // ─────────────────────────────

    placeholderColor: {
        type: ControlType.Color,
        title: "Loading Color",
        defaultValue: "#f1f1f1",
    },

    // ─────────────────────────────
    // GENERAL
    // ─────────────────────────────

    objectFit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["contain", "cover", "fill"],
        optionTitles: ["Contain", "Cover", "Fill"],
        defaultValue: "contain",
    },

    alt: {
        type: ControlType.String,
        title: "Alt Text",
        defaultValue: "",
    },
})
