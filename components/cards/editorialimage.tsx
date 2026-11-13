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
 * EditorialImage
 *
 * What it does
 *   A very small, responsive image component: a semantic <figure> + <img>
 *   that fills the width of its frame, crops with "object-fit", rounds its
 *   corners and never overflows horizontally. Height is either fixed (px),
 *   derived from an aspect ratio, or the image's natural height.
 *
 * How to use it
 *   Drop it into a section and give it a width. Pick an image in the
 *   "Image" control or paste a URL into "Image URL" (used when no image is
 *   set). Always fill in "Alt text" for screen readers; an empty alt falls
 *   back to "Editorial image".
 *
 * Settings
 *   Image (responsive image), Image URL, Alt text, Height (0 = auto),
 *   Aspect ratio (e.g. "3 / 2"; empty = natural height; ignored when Height
 *   is set), Corner radius, Object fit (cover / contain / fill),
 *   Focus (object-position, e.g. "50% 50%" or "center top"),
 *   Loading (lazy / eager), Background color (shown behind "contain" and
 *   while the image loads)
 *
 * Known limits
 *   - No lightbox or caption; wrap it in your own layout for those.
 *   - Static component: nothing animates, so reduced motion needs no handling.
 */
export default function EditorialImage(props: any) {
    const {
        image,
        imageUrl = "",
        altText = "Editorial image",
        height = 0,
        aspectRatio = "",
        cornerRadius = 16,
        objectFit = "cover",
        focus = "50% 50%",
        loading = "lazy",
        backgroundColor = "#F1EDE4",
        style,
    } = props

    const src = String((image && image.src) || imageUrl || "").trim()
    const srcSet = image && image.srcSet ? image.srcSet : undefined
    const alt =
        String(altText || "").trim() ||
        (image && image.alt ? String(image.alt) : "") ||
        "Editorial image"
    const h = Math.max(0, Number(height) || 0)
    const ratio = String(aspectRatio || "").trim()
    const fit =
        objectFit === "contain"
            ? "contain"
            : objectFit === "fill"
              ? "fill"
              : "cover"
    const sized = h > 0 || ratio.length > 0

    return (
        <figure
            style={{
                position: "relative",
                width: "100%",
                maxWidth: "100%",
                minWidth: 0,
                margin: 0,
                padding: 0,
                boxSizing: "border-box",
                overflow: "hidden",
                borderRadius: cornerRadius,
                background: backgroundColor,
                height: h > 0 ? h : "auto",
                aspectRatio: h > 0 ? undefined : ratio || undefined,
                ...style,
            }}
        >
            {src ? (
                <img
                    src={src}
                    srcSet={srcSet}
                    alt={alt}
                    loading={loading === "eager" ? "eager" : "lazy"}
                    decoding="async"
                    style={{
                        display: "block",
                        width: "100%",
                        maxWidth: "100%",
                        height: sized ? "100%" : "auto",
                        objectFit: fit,
                        objectPosition: String(focus || "50% 50%"),
                        borderRadius: cornerRadius,
                    }}
                />
            ) : (
                <div
                    aria-hidden="true"
                    style={{
                        width: "100%",
                        height: "100%",
                        minHeight: sized ? undefined : 120,
                    }}
                />
            )}
        </figure>
    )
}

addPropertyControls(EditorialImage, {
    image: { type: ControlType.ResponsiveImage, title: "Image" },
    imageUrl: {
        type: ControlType.String,
        title: "Image URL",
        defaultValue: "",
        placeholder: "https://...",
    },
    altText: {
        type: ControlType.String,
        title: "Alt text",
        defaultValue: "Editorial image",
        placeholder: "Describe the image",
    },
    height: {
        type: ControlType.Number,
        title: "Height",
        min: 0,
        max: 1600,
        step: 1,
        defaultValue: 0,
        unit: "px",
        description: "0 = auto",
    },
    aspectRatio: {
        type: ControlType.String,
        title: "Aspect ratio",
        defaultValue: "",
        placeholder: "e.g. 3 / 2 (empty = natural)",
        hidden: (p: any) => Number(p.height) > 0,
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Corner radius",
        min: 0,
        max: 120,
        step: 1,
        defaultValue: 16,
        unit: "px",
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Object fit",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
        defaultValue: "cover",
    },
    focus: {
        type: ControlType.String,
        title: "Focus",
        defaultValue: "50% 50%",
        placeholder: "object-position",
    },
    loading: {
        type: ControlType.Enum,
        title: "Loading",
        options: ["lazy", "eager"],
        optionTitles: ["Lazy", "Eager"],
        defaultValue: "lazy",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F1EDE4",
    },
})
