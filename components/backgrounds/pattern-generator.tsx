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
 * These annotations control how your component sizes
 * Learn more: https://www.framer.com/developers/components/auto-sizing
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Pattern(props) {
    // This is a React component containing an Example component
    // Replace <Example /> with your own code
    var id = "id" + Math.random().toString(16).slice(2)
    return (
        <div id="patterns" className={props.pattern} aydi={id}>
            <style>
                {`
                [aydi=${id}] {
                  --background: ${props.background};
                  --foreground: ${props.foreground};
                  --foreground2: ${props.foreground2};
                  --weight: ${props.weight}px;
                  --space: ${props.space}px;
                  --blend: screen;
                  --opacity: ${props.opacity};
                }

                #patterns[aydi=${id}] {
                  width: 100%;
                  height: 100%;
                  position: relative;
                  display: block;
                  overflow: hidden;
                  opacity: var(--opacity);
                }

                .dots#patterns[aydi=${id}] {
                  background-image: radial-gradient(var(--foreground) var(--weight), transparent var(--weight));
                  background-size: var(--space) var(--space);
                }

                .dots2#patterns[aydi=${id}] {
                  background-image: radial-gradient(var(--foreground) var(--weight), transparent var(--weight)), radial-gradient(var(--foreground2) var(--weight), transparent var(--weight));
                  background-position: 0 0, var(--space) var(--space);
                  background-size: calc(var(--space) * 2) calc(var(--space) * 2);
                }

                .cross#patterns[aydi=${id}] {
                  background: radial-gradient(circle, transparent 20%, var(--background) 20%, var(--background) 80%, transparent 80%, transparent) 0% 0% / calc(var(--space) * 2) calc(var(--space) * 2), radial-gradient(circle, transparent 20%, var(--background) 20%, var(--background) 80%, transparent 80%, transparent) var(--space) var(--space) / calc(var(--space) * 2) calc(var(--space) * 2), linear-gradient(var(--foreground) var(--weight), transparent var(--weight)) 0px calc(0px - (var(--weight) / 2)) / var(--space) var(--space), linear-gradient(90deg, var(--foreground) var(--weight), var(--background) var(--weight)) calc(0px - (var(--weight) / 2)) 0px / var(--space) var(--space) var(--background);
                  background-size: calc(var(--space) * 2) calc(var(--space) * 2), calc(var(--space) * 2) calc(var(--space) * 2);
                  background-color: var(--background);
                }

                .cross2#patterns[aydi=${id}] {
                  background: radial-gradient(circle, transparent 20%, var(--background) 20%, var(--background) 80%, transparent 80%, transparent) 0% 0% / calc(var(--space) * 2) calc(var(--space) * 2), radial-gradient(circle, transparent 20%, var(--background) 20%, var(--background) 80%, transparent 80%, transparent) var(--space) var(--space) / calc(var(--space) * 2) calc(var(--space) * 2), linear-gradient(var(--foreground) var(--weight), transparent var(--weight)) 0px calc(0px - (var(--weight) / 2)) / var(--space) var(--space), linear-gradient(90deg, var(--foreground) var(--weight), var(--background) var(--weight)) calc(0px - (var(--weight) / 2)) 0px / var(--space) var(--space) var(--background);
                  background-size: calc(var(--space) * 2) calc(var(--space) * 2), calc(var(--space) * 2) calc(var(--space) * 2), var(--space) var(--space), var(--space) var(--space);
                  background-color: var(--background);
                }

                .diagonal#patterns[aydi=${id}] {
                  background-image: repeating-linear-gradient(45deg, var(--foreground) 0, var(--foreground) var(--weight), transparent 0, transparent 50%);
                  background-size: var(--space) var(--space);
                }

                .diagonal2#patterns[aydi=${id}] {
                  background-image: repeating-linear-gradient(-45deg, var(--foreground) 0, var(--foreground) var(--weight), transparent 0, transparent 50%);
                  background-size: var(--space) var(--space);
                }

                .isometric#patterns[aydi=${id}]:before,
                .isometric2#patterns[aydi=${id}]:before{
                  content: "";
                  width: 100%;
                  height: 100%;
                  display: block;
                  position: absolute;
                  background-image: repeating-linear-gradient(0deg, var(--foreground), var(--foreground) var(--weight), transparent var(--weight), transparent);
                  background-size: var(--space) var(--space);
                  transform: rotate(150deg) scale(4);
                }

                .isometric#patterns[aydi=${id}]:after,
                .isometric2#patterns[aydi=${id}]:after{
                  content: "";
                  width: 100%;
                  height: 100%;
                  display: block;
                  position: absolute;
                  background-image: repeating-linear-gradient(0deg, var(--foreground), var(--foreground) var(--weight), transparent var(--weight), transparent);
                  background-size: var(--space) var(--space);
                  transform: rotate(-150deg) scale(4);
                }
            `}
            </style>
        </div>
    )
}

Pattern.displayName = "Pattern Generator"

addPropertyControls(Pattern, {
    pattern: {
        type: ControlType.Enum,
        defaultValue: "isometric",
        displaySegmentedControl: false,
        segmentedControlDirection: "vertical",
        options: [
            "dots",
            "cross",
            "cross2",
            "diagonal",
            "diagonal2",
            "isometric",
        ],
        optionTitles: [
            "Dots",
            "Cross",
            "Cross 2",
            "Diagonal",
            "Diagonal Reverse",
            "Isometric",
        ],
    },
    weight: {
        type: ControlType.Number,
        defaultValue: 0.2,
        step: 0.1,
    },
    space: {
        type: ControlType.Number,
        defaultValue: 7,
        step: 1,
        min: 1,
    },
    opacity: {
        type: ControlType.Number,
        defaultValue: 1,
        step: 0.1,
        min: 0,
        max: 1,
    },
    background: {
        type: ControlType.Color,
        defaultValue: "000000",
        hidden: function (props) {
            if (props.pattern == "cross" || props.pattern == "cross2") {
                return false
            } else {
                return true
            }
        },
    },
    foreground: {
        type: ControlType.Color,
        defaultValue: "00FFFF",
    },
    foreground2: {
        title: " ",
        type: ControlType.Color,
        defaultValue: "FF0000",
        hidden: function (props) {
            if (props.pattern !== "dots2") {
                return true
            }
        },
    },
})
