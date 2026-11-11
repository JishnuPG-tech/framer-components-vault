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
 * Google Map Embed
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

const MAP_TYPE_CODES = {
    roadmap: "m",
    satellite: "k",
}

export default function GoogleMapEmbed(props) {
    const { address, zoom, mapType, grayscale, borderRadius } = props

    const encodedAddress = encodeURIComponent(address || "Eiffel Tower, Paris")
    const typeCode = MAP_TYPE_CODES[mapType] || "m"
    const src = `https://maps.google.com/maps?q=${encodedAddress}&z=${zoom}&t=${typeCode}&output=embed`

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: borderRadius,
                filter: grayscale ? "grayscale(1)" : "none",
            }}
        >
            <iframe
                title="Google Map"
                src={src}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
            />
        </div>
    )
}

GoogleMapEmbed.defaultProps = {
    address: "Eiffel Tower, Paris",
    zoom: 14,
    mapType: "roadmap",
    grayscale: false,
    borderRadius: 0,
}

addPropertyControls(GoogleMapEmbed, {
    address: {
        type: ControlType.String,
        title: "Address",
        defaultValue: "Los Angeles",
        placeholder: "Enter address or place name",
    },
    zoom: {
        type: ControlType.Number,
        title: "Zoom",
        defaultValue: 14,
        min: 1,
        max: 21,
        step: 1,
    },
    mapType: {
        type: ControlType.Enum,
        title: "Map Type",
        options: ["roadmap", "satellite"],
        optionTitles: ["Roadmap", "Satellite"],
        defaultValue: "roadmap",
    },
    grayscale: {
        type: ControlType.Boolean,
        title: "Grayscale",
        defaultValue: false,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        max: 100,
    },
})
