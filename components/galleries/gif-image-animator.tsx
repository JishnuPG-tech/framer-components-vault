import {
    useState,
    useEffect,
    useRef,
    startTransition,
    type CSSProperties,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ImageAnimatorProps {
    images: { src: string }[]
    delay: number
    backgroundColor: string
    borderRadius: number
    padding: string
    objectFit: "cover" | "contain" | "fill" | "none" | "scale-down"
    overflow: "visible" | "hidden" | "scroll" | "auto"
    shadows: string
    style?: CSSProperties
}

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerIntrinsicWidth auto
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicHeight auto
 */
export default function GIFStyleImageAnimator(props: ImageAnimatorProps) {
    const {
        images = [],
        delay = 500,
        backgroundColor = "#FFFFFF",
        borderRadius = 8,
        padding = "0px",
        objectFit = "cover",
        shadows = "",
    } = props

    const isStatic = useIsStaticRenderer()
    const [index, setIndex] = useState(0)
    const timer = useRef<number | null>(null)

    // Fallback default images if none provided
    const fallbackImages = [
        {
            src: "https://assets.lummi.ai/assets/QmPMpwSUHWz4kvfpTn7CmXY4Wjf5yqt3kP9ii9Pj9Nv8jV?auto=format&w=1500",
        },
        {
            src: "https://assets.lummi.ai/assets/QmaMkjxCinCmhuZ3sH3f5Efs67S8XpNwfgpjmWjFtxcgnm?auto=format&w=1500",
        },
        {
            src: "https://assets.lummi.ai/assets/QmbkXk5ACkbxG8rUoLwRjjG1RNS2wd1mHp5x3az8TrpsgZ?auto=format&w=1500",
        },
    ]

    const imgs = images.length > 0 ? images : fallbackImages

    useEffect(() => {
        if (typeof window === "undefined" || isStatic || imgs.length <= 1)
            return

        const startTimer = () => {
            if (timer.current) clearTimeout(timer.current)

            timer.current = window.setTimeout(
                () => {
                    startTransition(() =>
                        setIndex((i) => (i + 1) % imgs.length)
                    )
                },
                Math.max(100, delay)
            )
        }

        startTimer()

        return () => {
            if (timer.current) clearTimeout(timer.current)
        }
    }, [imgs.length, isStatic, delay])

    // Separate effect for index changes to restart timer
    useEffect(() => {
        if (typeof window === "undefined" || isStatic || imgs.length <= 1)
            return

        if (timer.current) clearTimeout(timer.current)

        timer.current = window.setTimeout(
            () => {
                startTransition(() => setIndex((i) => (i + 1) % imgs.length))
            },
            Math.max(100, delay)
        )
    }, [index, imgs.length, isStatic, delay])

    const current = imgs[index]

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                minWidth: "100px",
                minHeight: "100px",
                maxWidth: "100%",
                maxHeight: "100%",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: shadows,
                borderRadius: borderRadius,
            }}
        >
            <div
                style={{
                    ...props.style,
                    width: "100%",
                    height: "100%",
                    overflow: props.overflow,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: backgroundColor,
                    borderRadius: borderRadius,
                    padding: padding,
                    boxSizing: "border-box",
                }}
            >
                <img
                    src={current.src}
                    alt=""
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: objectFit,
                        display: "block",
                        maxWidth: "100%",
                        maxHeight: "100%",
                        // Radius gambar disesuaikan dengan mengurangi padding
                        borderRadius: `max(0px, ${borderRadius}px - ${parseInt(padding) || 0}px)`,
                    }}
                    onError={(e) => {
                        e.currentTarget.src = fallbackImages[0].src
                    }}
                />
            </div>
        </div>
    )
}

addPropertyControls(GIFStyleImageAnimator, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.ResponsiveImage,
        },
        defaultValue: [
            {
                src: "https://assets.lummi.ai/assets/QmPMpwSUHWz4kvfpTn7CmXY4Wjf5yqt3kP9ii9Pj9Nv8jV?auto=format&w=1500",
                alt: "",
            },
            {
                src: "https://assets.lummi.ai/assets/QmaMkjxCinCmhuZ3sH3f5Efs67S8XpNwfgpjmWjFtxcgnm?auto=format&w=1500",
                alt: "",
            },
            {
                src: "https://assets.lummi.ai/assets/QmbkXk5ACkbxG8rUoLwRjjG1RNS2wd1mHp5x3az8TrpsgZ?auto=format&w=1500",
                alt: "",
            },
        ],
        maxCount: 10,
    },
    delay: {
        type: ControlType.Number,
        title: "Delay (ms)",
        defaultValue: 500,
        min: 100,
        max: 5000,
        step: 50,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 8,
        min: 0,
        max: 64,
        step: 1,
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "0px",
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["cover", "contain", "fill", "none", "scale-down"],
        optionTitles: ["Cover", "Contain", "Fill", "None", "Scale Down"],
        defaultValue: "cover",
    },
    overflow: {
        type: ControlType.Enum,
        title: "Overflow",
        options: ["visible", "hidden", "scroll", "auto"],
        optionTitles: ["Visible", "Hidden", "Scroll", "Auto"],
        defaultValue: "hidden",
    },
    shadows: {
        type: ControlType.BoxShadow,
        title: "Shadows",
        description:
            "See more component from [Iklil Najma M](https://dub.sh/artevo)",
    },
})

GIFStyleImageAnimator.displayName = "GIF Image Animator"
