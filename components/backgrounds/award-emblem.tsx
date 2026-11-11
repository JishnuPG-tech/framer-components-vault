// Get Started: https://www.framer.com/developers

import { useId } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Fixed laurel wreath vector (supplied asset). The wreath shape must never change.
const VIEWBOX_WIDTH = 903
const VIEWBOX_HEIGHT = 808
const WREATH_MARKUP = `<path d="M646.847 0C690.443 0.219817 719.986 26.6561 728.093 68.8965C734.284 74.684 740.958 82.9195 746.365 89.5214C777.898 128.509 802.703 172.481 819.768 219.628C898.038 437.322 779.313 685.146 549.392 739.256C520.528 746.046 488.345 753.877 460.633 763.876C479.093 771.818 511.093 788.871 523.786 804.031C524.251 806.303 524.361 805.213 523.302 807.393C519.879 808.575 517.111 805.838 514.583 803.664C495.907 787.609 474.226 776.294 451.381 767.066C429.453 775.626 407.865 787.254 389.76 802.25C387.078 804.472 381.304 810.356 378.079 806.793C377.842 803.101 384.816 797.78 387.533 795.465C403.775 781.633 422.934 772.179 442.441 763.889C417.013 754.11 386.276 747.638 359.788 740.841C308.067 727.579 266.946 711.261 222.999 680.934C139.675 622.269 82.9005 533.062 65.0402 432.736C44.0339 317.028 71.2564 208.761 137.947 112.575C143.683 104.325 166.954 72.9108 175.086 69.4366C178.566 48.8362 186.423 32.8459 202.708 19.039C216.179 7.6177 239.819 -0.394925 257.49 1.22095C255.143 13.6697 246.47 30.8185 238.416 40.5505C222.537 59.7352 203.199 69.3747 178.811 72.1105C176.485 76.5375 169.801 83.7057 166.356 87.7482C161.519 93.352 156.91 99.1493 152.541 105.125C128.719 136.988 109.202 171.852 94.4933 208.816C62.9186 287.598 57.2505 374.386 78.3095 456.604C110.027 582.555 201.405 684.399 326.087 723.336C368.279 736.513 410.011 743.866 451.393 759.945C471.544 752.481 490.403 745.942 511.484 741.135C555.215 731.155 598.211 719.435 637.919 697.913C726.158 649.51 791.412 567.878 819.186 471.146C852.82 357.355 834.879 243.447 774.273 142.244C764.538 126.294 753.975 110.866 742.617 96.0265C738.172 90.2721 726.042 77.3341 723.556 72.2085C682.024 66.1993 657.237 40.2125 646.847 0Z"/><path d="M277.684 729.012C300.45 727.414 316.541 733.004 336.722 742.342C324.493 756.547 300.007 768.995 281.31 770.257C261.3 773.03 238.037 767.899 220.782 757.484C236.619 740.835 254.563 731.381 277.684 729.012Z"/><path d="M610.28 729C613.225 728.791 616.176 728.718 619.128 728.779C643.718 729.226 664.016 740.229 680.793 757.606C665.914 766.032 654.219 769.093 637.656 771.071C635.47 771.194 633.284 771.255 631.098 771.267C604.708 771.145 583.883 761.109 565.551 742.55C580.736 734.933 593.399 730.61 610.28 729Z"/><path d="M741.142 657.36C758.843 654.862 777.31 661.377 792.698 669.422C775.755 687.289 757.068 697.252 732.967 701.085C712.571 703.154 697.515 699.609 679.55 690.051C699.315 671.29 713.361 660.721 741.142 657.36Z"/><path d="M146.209 657.348C179.341 654.709 199.117 669.33 222.458 690.241C211.042 696.817 198.256 700.65 185.106 701.446C155.81 704.942 129.201 689.2 109.076 669.447C121.662 662.075 132.037 659.338 146.209 657.348Z"/><path d="M5.37113 264.747C19.1731 271.957 30.8742 282.616 39.3369 295.687C53.2276 317.275 56.6571 345.928 51.2076 370.689C8.72348 350.935 -4.0106 308.517 5.37113 264.747Z"/><path d="M901.553 410.62L902.239 411.103C902.637 414.538 901.235 420.257 900.451 423.729C891.689 462.696 869.842 490.972 828.701 496.556L827.875 496.201C827.446 493.654 828.915 487.586 829.522 484.99C833.061 469.86 837.843 456.046 847.113 443.317C860.155 425.572 879.761 413.791 901.553 410.62Z"/><path d="M0 410.681C23.4635 413.167 45.3418 428.725 57.6117 448.478C67.3756 464.196 70.7989 479.014 73.9211 496.936C26.9016 490.887 4.48085 455.501 0 410.681Z"/><path d="M896.422 265.325L896.759 265.624C901.669 278.612 899 309.417 893.716 323.141C884.935 345.926 872.995 359.867 851.197 370.373L850.891 370.071C846.789 354.727 848.558 329.557 853.695 314.511C860.774 293.056 876.167 275.339 896.422 265.325Z"/><path d="M606.441 634.527L607.145 635.225C610.243 649.1 605.375 672.563 598.94 685.269C587.429 707.985 571.092 720.066 547.659 728.155L546.533 727.91C545.302 725.491 545.614 722.283 545.498 719.582C544.99 707.661 547.219 696.241 551.792 685.25C562.055 660.568 582.04 644.299 606.441 634.527Z"/><path d="M47.0727 548.376C55.2874 547.427 67.8862 548.976 75.8278 551.443C104.53 560.359 119.145 580.289 132.591 605.461C128.597 606.281 124.219 606.667 120.138 607.12C109.389 608.222 98.5296 606.924 88.3439 603.318C63.4905 594.446 45.5928 573.376 34.5487 550.06C37.977 549.3 43.4314 548.811 47.0727 548.376Z"/><path d="M295.836 634.141C337.33 650 360.431 683.995 356.652 728.448C343.748 725.877 326.502 714.757 317.801 704.887C298.623 683.126 294.465 661.952 295.836 634.141Z"/><path d="M844.841 548.406C852.789 548.143 857.185 548.774 865.054 550.201C862.084 557.432 855.428 568.27 850.413 574.276C832.975 595.156 817.092 604.414 790.597 607.488C781.866 607.629 777.384 607.126 768.793 605.51C773.679 595.046 779.87 585.237 787.211 576.321C802.972 557.524 820.864 550.458 844.841 548.406Z"/><path d="M54.4382 134.549C62.1354 139.498 72.6236 158.237 75.6331 167.189C85.1312 195.437 79.5322 220.473 66.9322 246.406C56.5255 238.904 47.8424 225.478 44.0504 213.388C35.1108 184.883 41.6128 160.091 54.4382 134.549Z"/><path d="M133.921 287.484C134.249 287.466 134.534 287.719 134.83 287.86C136.055 298.002 127.702 323.759 122.26 333.149C109.554 355.074 94.5674 367.113 70.6385 374.123C70.4138 373.974 69.9754 373.293 69.7874 373.033C69.2198 368.807 69.5051 365.256 69.7029 361.077C71.5441 322.157 95.3609 294.255 133.921 287.484Z"/><path d="M767.428 392.703C779.876 396.377 796.641 414.593 802.721 426.215C814.177 448.099 812.971 469.891 806.009 492.827C805.862 493.581 806.003 493.072 805.287 494.23C799.311 494.028 782.46 476.222 778.737 470.803C762.07 446.519 762.327 420.569 767.428 392.703Z"/><path d="M768.695 24.8816C778.462 31.0849 793.157 57.8769 795.722 69.8058C801.178 95.0928 798.925 111.624 786.097 133.288L785.105 133.245C781.841 130.697 779.815 127.812 777.127 124.738C753.486 97.7055 749.953 55.8777 768.695 24.8816Z"/><path d="M846.348 134.577C848.65 135.753 850.603 141.344 851.638 143.736C866.842 178.944 864.925 217.546 836.269 245.168L835.198 244.774C826.662 232.462 821.635 210.668 821.537 195.712C821.182 172.813 830.134 150.751 846.348 134.577Z"/><path d="M688.618 574.876C689.12 575.011 689.775 574.993 690.014 575.55C707.116 615.576 694.851 654.819 660.072 679.238L659.27 679.538C658.94 679.286 658.45 678.962 658.291 678.582C642.787 640.068 658.186 599.717 688.618 574.876Z"/><path d="M158.15 489.092C158.979 489.435 159.575 489.95 160.029 490.77C174.883 517.712 180.088 551.75 165.736 580.026C163.64 584.153 157.018 595.419 153.487 597.654L152.617 597.256C141.053 580.92 133.79 564.51 134.313 544.182C134.841 523.675 143.238 503.267 158.15 489.092Z"/><path d="M742.287 489.031C746.297 490.66 750.424 497.199 752.849 500.739C767.716 522.439 771.573 550.623 761.299 575.054C758.011 582.873 754.496 589.063 749.867 596.191C748.991 597.428 749.567 596.981 748.116 597.519C741.184 593.656 731.847 572.231 729.814 564.614C722.913 538.732 729.367 511.833 742.287 489.031Z"/><path d="M132.556 393.328L133.213 394.051C135.65 402.482 136.547 420.906 135.788 429.613C133.908 451.172 124.567 472.493 107.619 486.411C105.199 488.394 98.5155 494.217 95.5459 493.948C88.963 473.834 87.2307 456.426 94.2778 436.183C100.775 417.349 114.566 401.906 132.556 393.328Z"/><path d="M729.398 188.327C764.158 186.19 791.228 197.841 807.766 230.14C809.934 234.373 816.461 248.335 815.555 252.958C781.425 251.843 758.519 239.729 739.892 210.393C737.609 206.79 728.663 191.559 729.398 188.327Z"/><path d="M767.679 286.95C783.617 289.897 798.6 296.58 810.014 308.242C829.387 328.04 831.61 347.924 831.701 374.002C821.709 371.976 810.393 366.325 802.556 359.905C779.068 340.661 770.967 315.776 767.679 286.95Z"/><path d="M214.252 574.619C217.903 576.174 220.629 579.891 223.352 582.689C234.812 594.47 243.079 608.627 247.497 624.491C251.962 640.528 251.97 665.118 243.496 679.93C208.43 653.992 195.968 615.123 214.252 574.619Z"/><path d="M161.074 188.365L171.245 189.02C156.95 223.766 133.812 249.576 94.6047 252.729C92.9846 252.978 86.6411 252.95 84.6652 252.977C95.8128 211.812 118.561 191.315 161.074 188.365Z"/><path d="M135.736 28.6749C137.933 30.7273 139.505 36.6526 140.57 39.5145C151.788 69.6521 145.417 102.268 124.163 126.322C121.838 128.953 120.39 131.619 117.333 133.612L116.066 133.339C93.5687 97.6644 104.691 55.2127 135.736 28.6749Z"/><path d="M190.336 100.098C206.56 98.9736 214.844 99.8865 229.943 105.435C217.22 124.874 194.876 140.469 172.028 145.566C157.152 148.345 146.381 147.084 132.116 142.974C133.832 140.621 135.93 137.236 137.57 134.777C151.716 113.559 165.776 104.873 190.336 100.098Z"/><path d="M703.277 99.5595C735.429 100.518 752.702 116.098 768.75 142.757C757.729 145.727 751.428 146.707 740.07 146.339C711.433 142.782 689.481 129.701 673.317 105.325C686.022 101.178 690.186 100.161 703.277 99.5595Z"/>`

// Ornament layout, authored in the wreath's coordinate space.
const CX = 451.5
const STAR_Y = 150
const STAR_R = 21
const TOP_LINE_Y = 300
const BOTTOM_LINE_Y = 500
const LINE_WIDTH = 320
const LINE_THICKNESS = 4
const MAIN_Y = (TOP_LINE_Y + BOTTOM_LINE_Y) / 2 // vertically centered between the dividers
const SUBTITLE_Y = 566
const SUBTITLE_SIZE = 40
const SUBTITLE_GAP = SUBTITLE_SIZE * 1.3

// Typography is locked to a serif (never changes).
const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif"
const MAIN_STYLE = {
    fontFamily: SERIF,
    fontWeight: 700,
    fontSize: 112,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
}
const SUBTITLE_STYLE = {
    fontFamily: SERIF,
    fontWeight: 600,
    fontSize: SUBTITLE_SIZE,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
}

// Gleam Sweep: a thin light passes bottom-left -> top-right on hover, then back to flat.
const GLEAM_CSS =
    ".ae-root { display: block; width: 100%; height: 100%; }\n.ae-gleam { opacity: 0; }\n.ae-root:hover .ae-gleam { animation: ae-sweep 0.5s cubic-bezier(0.3, 0, 0.2, 1); }\n@keyframes ae-sweep {\n  0% { opacity: 0; transform: translate(-330px, 300px); }\n  8% { opacity: 1; }\n  92% { opacity: 1; }\n  100% { opacity: 0; transform: translate(330px, -300px); }\n}\n@media (prefers-reduced-motion: reduce) {\n  .ae-root:hover .ae-gleam { animation: none; }\n}"

function getStarPoints(cx, cy, outerRadius, innerRadius) {
    const points = []
    for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius
        const angle = -Math.PI / 2 + (i * Math.PI) / 5
        points.push(
            cx +
                Math.cos(angle) * radius +
                "," +
                (cy + Math.sin(angle) * radius)
        )
    }
    return points.join(" ")
}

/**
 * Award Emblem — a minimal laurel award badge on a fixed wreath vector.
 * Edit the text and one accent color; choose the star count; toggle the dividers.
 * Serif typography is locked. Gleam Sweep highlight on hover. Transparent, vector.
 *
 * @framerIntrinsicWidth 360
 * @framerIntrinsicHeight 322
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
// @framerDisableUnlink
export default function AwardEmblem(props) {
    const {
        mainText,
        subtitle,
        accentColor,
        showStars,
        starCount,
        showDividers,
        scale,
    } = props

    // Uniform scale factor for the whole emblem (percentage -> multiplier).
    const scaleFactor = Math.max(0.1, Number(scale) / 100 || 1)

    const subtitleLines = String(subtitle || "")
        .split("\n")
        .slice(0, 3)
    const stars = showStars ? Number(starCount) : 0
    const label = (mainText + " " + subtitleLines.join(" ")).trim()

    const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
    const gleamId = "aeGleam" + uid
    const maskId = "aeMask" + uid

    // All emblem shapes painted in one color. Used for the visible art AND the gleam mask.
    const ink = (color) => (
        <>
            <g
                fill={color}
                dangerouslySetInnerHTML={{ __html: WREATH_MARKUP }}
            />

            {stars > 0 && (
                <g fill={color}>
                    {Array.from({ length: stars }).map((_, index) => {
                        const spacing = STAR_R * 2.7
                        const x = CX + (index - (stars - 1) / 2) * spacing
                        const big = stars % 2 === 1 && index === (stars - 1) / 2
                        const r = big ? STAR_R * 1.22 : STAR_R
                        const y = STAR_Y - (big ? STAR_R * 0.3 : 0)
                        return (
                            <polygon
                                key={index}
                                points={getStarPoints(x, y, r, r * 0.42)}
                            />
                        )
                    })}
                </g>
            )}

            {showDividers && (
                <g
                    stroke={color}
                    strokeLinecap="round"
                    strokeWidth={LINE_THICKNESS}
                >
                    <line
                        x1={CX - LINE_WIDTH / 2}
                        x2={CX + LINE_WIDTH / 2}
                        y1={TOP_LINE_Y}
                        y2={TOP_LINE_Y}
                    />
                    <line
                        x1={CX - LINE_WIDTH / 2}
                        x2={CX + LINE_WIDTH / 2}
                        y1={BOTTOM_LINE_Y}
                        y2={BOTTOM_LINE_Y}
                    />
                </g>
            )}

            <text
                x={CX}
                y={MAIN_Y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={color}
                style={MAIN_STYLE}
            >
                {mainText}
            </text>

            {subtitleLines.map((line, i) => (
                <text
                    key={i}
                    x={CX}
                    y={SUBTITLE_Y + i * SUBTITLE_GAP}
                    textAnchor="middle"
                    fill={color}
                    style={SUBTITLE_STYLE}
                >
                    {line}
                </text>
            ))}
        </>
    )

    return (
        <div
            className="ae-root"
            style={{
                transform: "scale(" + scaleFactor + ")",
                transformOrigin: "center",
            }}
        >
            <style dangerouslySetInnerHTML={{ __html: GLEAM_CSS }} />
            <svg
                role="img"
                aria-label={label}
                width="100%"
                height="100%"
                viewBox={"0 0 " + VIEWBOX_WIDTH + " " + VIEWBOX_HEIGHT}
                preserveAspectRatio="xMidYMid meet"
                style={{
                    display: "block",
                    overflow: "visible",
                    isolation: "isolate",
                }}
            >
                <defs>
                    <linearGradient id={gleamId} x1="0" y1="1" x2="1" y2="0">
                        <stop offset="0" stopColor="#ffffff" stopOpacity={0} />
                        <stop
                            offset="0.4"
                            stopColor="#ffe9b0"
                            stopOpacity={0}
                        />
                        <stop
                            offset="0.47"
                            stopColor="#ffefc2"
                            stopOpacity={0.35}
                        />
                        <stop
                            offset="0.5"
                            stopColor="#fffdf4"
                            stopOpacity={0.98}
                        />
                        <stop
                            offset="0.53"
                            stopColor="#ffefc2"
                            stopOpacity={0.35}
                        />
                        <stop
                            offset="0.6"
                            stopColor="#ffe9b0"
                            stopOpacity={0}
                        />
                        <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
                    </linearGradient>
                    <mask id={maskId}>{ink("#ffffff")}</mask>
                </defs>

                {/* Flat gold emblem */}
                {ink(accentColor)}

                {/* Gleam: a moving gold light band, screen-blended onto the emblem shapes */}
                <g
                    mask={"url(#" + maskId + ")"}
                    aria-hidden="true"
                    style={{ mixBlendMode: "screen" }}
                >
                    <rect
                        className="ae-gleam"
                        x={0}
                        y={0}
                        width={VIEWBOX_WIDTH}
                        height={VIEWBOX_HEIGHT}
                        fill={"url(#" + gleamId + ")"}
                    />
                </g>
            </svg>
        </div>
    )
}

AwardEmblem.displayName = "Award Emblem"

AwardEmblem.defaultProps = {
    mainText: "AWARD",
    subtitle: "NOMINATION\nNAME",
    accentColor: "#D7B87E",
    showStars: true,
    starCount: "3",
    showDividers: true,
    scale: 100,
}

addPropertyControls(AwardEmblem, {
    mainText: {
        type: ControlType.String,
        title: "Main",
        defaultValue: "AWARD",
        placeholder: "AWARD",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "NOMINATION\nNAME",
        displayTextArea: true,
        placeholder: "NOMINATION NAME",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#D7B87E",
    },
    showStars: {
        type: ControlType.Boolean,
        title: "Stars",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    starCount: {
        type: ControlType.Enum,
        title: "Count",
        defaultValue: "3",
        options: ["1", "3", "5"],
        optionTitles: ["1", "3", "5"],
        displaySegmentedControl: true,
        hidden: (props) => !props.showStars,
    },
    showDividers: {
        type: ControlType.Boolean,
        title: "Dividers",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    scale: {
        type: ControlType.Number,
        title: "Scale",
        defaultValue: 100,
        min: 10,
        max: 300,
        step: 1,
        unit: "%",
        displayStepper: false,
        description: "Explore more components at Sydney Lab",
    },
})
