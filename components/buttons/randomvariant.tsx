import { useEffect, useState } from "react"
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
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 200
 *
 * @framerSupportedLayoutWidth 100%
 * @framerSupportedLayoutHeight 100%
 */

export default function RandomVariant(props) {
    const { components } = props
    const [selectedComponent, setSelectedComponent] = useState(null)
    const [lastSelectedIndex, setLastSelectedIndex] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    // Function to generate a new random index
    const getRandomIndex = (length, lastIndex) => {
        let randomIndex
        do {
            randomIndex = Math.floor(Math.random() * length)
        } while (randomIndex === lastIndex && length > 1)
        return randomIndex
    }

    useEffect(() => {
        // Ensure the components array is valid and has content
        if (components && components.length > 0) {
            const randomIndex = getRandomIndex(
                components.length,
                lastSelectedIndex
            )
            setSelectedComponent(components[randomIndex])
            setLastSelectedIndex(randomIndex)
            setIsLoading(false)
        } else {
            setSelectedComponent(null) // Clear selected component when no frames are connected
            setIsLoading(false)
        }
    }, [components])

    if (isLoading) {
        return null // Prevent rendering anything while loading
    }

    // Render the selected component if available, otherwise show the styled empty state
    return selectedComponent ? (
        <div style={{ width: "100%", height: "100%" }}>{selectedComponent}</div>
    ) : (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "350px",
                height: "100%",
                minWidth: "300px", // Ensures minimum width of 300px
                minHeight: "200px", // Ensures minimum height of 200px
                padding: "24px",
                boxSizing: "border-box",
                backgroundColor: "#8658d833",
                border: "1px solid #8658D8",
                borderRadius: "8px",
                textAlign: "center",
            }}
        >
            {/* SVG Icon */}
            <svg
                width="100"
                height="40"
                viewBox="0 0 166 127"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M55.4961 100.711H165.496V126.711H55.4961L55.4961 100.711Z"
                    fill="#9A66FF"
                    fill-opacity="0.39"
                />
                <path
                    d="M137.496 100.711H165.496V57.7109H137.496V100.711Z"
                    fill="#9A66FF"
                    fill-opacity="0.39"
                />
                <rect
                    x="27.4961"
                    y="24.7109"
                    width="110"
                    height="76"
                    fill="#9A66FF"
                    fill-opacity="0.51"
                />
                <rect
                    x="0.496094"
                    y="0.710938"
                    width="110"
                    height="76"
                    fill="#9A66FF"
                />
                <path
                    d="M71.5662 25.3702C68.3455 22.1618 64.2473 19.9784 59.7878 19.0951C55.3284 18.2118 50.7073 18.6682 46.5068 20.4068C42.3064 22.1453 38.7144 25.0882 36.1836 28.8647C33.6528 32.6411 32.2963 37.0821 32.2852 41.6282"
                    stroke="#0E0422"
                    stroke-width="5"
                    stroke-miterlimit="10"
                    stroke-linecap="round"
                />
                <path
                    d="M69.7124 13.5625L72.0004 22.8355C72.1058 23.2396 72.1281 23.6609 72.066 24.0738C72.0039 24.4868 71.8587 24.8829 71.6392 25.2382C71.4197 25.5934 71.1304 25.9005 70.7888 26.1407C70.4472 26.381 70.0605 26.5495 69.6519 26.636L60.3789 28.9543"
                    stroke="#0E0422"
                    stroke-width="5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
                <path
                    d="M38.4336 52.633C41.6541 55.8424 45.7526 58.0266 50.2125 58.9104C54.6724 59.7942 59.2941 59.338 63.4951 57.5994C67.6962 55.8607 71.2886 52.9174 73.8195 49.1404C76.3505 45.3633 77.7067 40.9216 77.7173 36.375"
                    stroke="#0E0422"
                    stroke-width="5"
                    stroke-miterlimit="10"
                    stroke-linecap="round"
                />
                <path
                    d="M40.2895 64.4386L38.0015 55.1656C37.8966 54.7613 37.8746 54.34 37.9371 53.927C37.9995 53.514 38.145 53.118 38.3647 52.7628C38.5845 52.4076 38.8739 52.1006 39.2156 51.8604C39.5573 51.6202 39.9441 51.4517 40.3527 51.3651L49.623 49.0469"
                    stroke="#0E0422"
                    stroke-width="5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
            </svg>

            {/* Title Text */}
            <div
                style={{
                    color: "#9A66FF",
                    fontWeight: "bold",
                    fontSize: "14px",
                    fontFamily: "Inter, sans-serif",
                    marginTop: "12px",
                }}
            >
                No frames/components connected.
            </div>

            {/* Description Text */}
            <div
                style={{
                    marginTop: "8px",
                    color: "#8658D8",
                    fontWeight: "normal",
                    fontSize: "12px",
                    fontFamily: "Inter, sans-serif",
                }}
            >
                The connected frames/components will switch randomly on each
                refresh.
            </div>
        </div>
    )
}

// Property controls to connect different components/frames
addPropertyControls(RandomVariant, {
    components: {
        type: ControlType.Array,
        title: "Items",
        propertyControl: { type: ControlType.ComponentInstance },
        description:
            "Check out all other code components on [Eleveight Supply](https://eleveight.supply)",
    },
})
