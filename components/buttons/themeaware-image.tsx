// Component that displays different images based on dark/light mode
import { useEffect, useState, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface DarkLightImageProps {
    lightImage: {
        src: string
        alt?: string
    }
    darkImage: {
        src: string
        alt?: string
    }
    objectFit: "contain" | "cover" | "fill" | "none"
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function DarkLightImage(props: DarkLightImageProps) {
    const {
        lightImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Light mode image",
        },
        darkImage = {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Dark mode image",
        },
        objectFit,
    } = props

    const [isDark, setIsDark] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined") return

        const checkDarkMode = () => {
            const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)")
            startTransition(() => setIsDark(darkModeQuery.matches))
        }

        checkDarkMode()

        const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)")
        const handleChange = (e: MediaQueryListEvent) => {
            startTransition(() => setIsDark(e.matches))
        }

        darkModeQuery.addEventListener("change", handleChange)

        return () => {
            darkModeQuery.removeEventListener("change", handleChange)
        }
    }, [])

    const currentImage = isDark ? darkImage : lightImage

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
            }}
        >
            <img
                src={currentImage.src}
                alt={currentImage.alt || ""}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: objectFit,
                }}
            />
        </div>
    )
}

addPropertyControls(DarkLightImage, {
    lightImage: {
        type: ControlType.ResponsiveImage,
        title: "Light Mode Image",
    },
    darkImage: {
        type: ControlType.ResponsiveImage,
        title: "Dark Mode Image",
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Object Fit",
        options: ["contain", "cover", "fill", "none"],
        optionTitles: ["Contain", "Cover", "Fill", "None"],
        defaultValue: "cover",
    },
})