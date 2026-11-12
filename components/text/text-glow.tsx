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
export default function Glow(props) {
    var id = "id" + Math.random().toString(16).slice(2)

    return (
        <section id={id} className="section section-design no-pad-bottom">
            <style>
                {`

                    #${id} .filter-container {
                        position: relative;
                        isolation: isolate;
                    }

                    #${id} h2 {
                        padding: 0;
                        margin: 0;
                    }

                    #${id} .typography-ps-headline-super {
                        font-size: 80px;
                        
                        font-weight: 600;
                        letter-spacing: -0.015em;
                        ${convertStylesToString(props.font)}
                    }



                    #${id} .filter {
                        filter: url(#glow-1);
                        margin: -80px 0;
                        padding: 80px 0;
                        color: #fffaf6;
                        transform: translateZ(0);
                    
                    }

                    #${id} svg {
                    display: none;
                    } 

                    ${
                        typeof window !== "undefined" &&
                        window !== window.parent
                            ? `
                                            #__framer-badge-container {
                                                display: none !important;
                                            }
                                        `
                            : ""
                    }                    
                `}
            </style>
            <div className="header-copy viewport-content">
                <div className="subsection-copy subsection-copy-intro">
                    <h2
                        aria-hidden="true"
                        className="ric-large-10 large-centered glow-element typography-ps-headline-super"
                    >
                        <div
                            className="filter-container"
                            data-component-list="TextGlow"
                        >
                            <svg
                                width="1440px"
                                height="300px"
                                viewBox="0 0 1440 300"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <defs>
                                    <filter
                                        id="glow-1"
                                        color-interpolation-filters="sRGB"
                                        x="-50%"
                                        y="-50%"
                                        width="200%"
                                        height="200%"
                                    >
                                        <feGaussianBlur
                                            in="SourceGraphic"
                                            data-target-blur="4"
                                            stdDeviation="4, 4"
                                            result="blur4"
                                        ></feGaussianBlur>
                                        <feGaussianBlur
                                            in="SourceGraphic"
                                            data-target-blur="19"
                                            stdDeviation="19, 19"
                                            result="blur19"
                                        ></feGaussianBlur>
                                        <feGaussianBlur
                                            in="SourceGraphic"
                                            data-target-blur="9"
                                            stdDeviation="9, 9"
                                            result="blur9"
                                        ></feGaussianBlur>
                                        <feGaussianBlur
                                            in="SourceGraphic"
                                            data-target-blur="30"
                                            stdDeviation="30, 30"
                                            result="blur30"
                                        ></feGaussianBlur>
                                        <feColorMatrix
                                            in="blur4"
                                            result="color-0-blur"
                                            type="matrix"
                                            values="1 0 0 0 0
                                                          0 0.9803921568627451 0 0 0
                                                          0 0 0.9647058823529412 0 0
                                                          0 0 0 0.8 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-0-blur"
                                            result="layer-0-offsetted"
                                            dx="0"
                                            dy="0"
                                            data-target-offset-y="0"
                                        ></feOffset>
                                        <feColorMatrix
                                            in="blur19"
                                            result="color-1-blur"
                                            type="matrix"
                                            values="0.8156862745098039 0 0 0 0
                                                          0 0.49411764705882355 0 0 0
                                                          0 0 0.2627450980392157 0 0
                                                          0 0 0 1 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-1-blur"
                                            result="layer-1-offsetted"
                                            dx="0"
                                            dy="2"
                                            data-target-offset-y="2"
                                        ></feOffset>
                                        <feColorMatrix
                                            in="blur9"
                                            result="color-2-blur"
                                            type="matrix"
                                            values="1 0 0 0 0
                                                          0 0.6666666666666666 0 0 0
                                                          0 0 0.36470588235294116 0 0
                                                          0 0 0 0.65 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-2-blur"
                                            result="layer-2-offsetted"
                                            dx="0"
                                            dy="2"
                                            data-target-offset-y="2"
                                        ></feOffset>
                                        <feColorMatrix
                                            in="blur30"
                                            result="color-3-blur"
                                            type="matrix"
                                            values="1 0 0 0 0
                                                          0 0.611764705882353 0 0 0
                                                          0 0 0.39215686274509803 0 0
                                                          0 0 0 1 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-3-blur"
                                            result="layer-3-offsetted"
                                            dx="0"
                                            dy="2"
                                            data-target-offset-y="2"
                                        ></feOffset>
                                        <feColorMatrix
                                            in="blur30"
                                            result="color-4-blur"
                                            type="matrix"
                                            values="0.4549019607843137 0 0 0 0
                                                          0 0.16470588235294117 0 0 0
                                                          0 0 0 0 0
                                                          0 0 0 1 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-4-blur"
                                            result="layer-4-offsetted"
                                            dx="0"
                                            dy="16"
                                            data-target-offset-y="16"
                                        ></feOffset>
                                        <feColorMatrix
                                            in="blur30"
                                            result="color-5-blur"
                                            type="matrix"
                                            values="0.4235294117647059 0 0 0 0
                                                          0 0.19607843137254902 0 0 0
                                                          0 0 0.11372549019607843 0 0
                                                          0 0 0 1 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-5-blur"
                                            result="layer-5-offsetted"
                                            dx="0"
                                            dy="64"
                                            data-target-offset-y="64"
                                        ></feOffset>
                                        <feColorMatrix
                                            in="blur30"
                                            result="color-6-blur"
                                            type="matrix"
                                            values="0.21176470588235294 0 0 0 0
                                                          0 0.10980392156862745 0 0 0
                                                          0 0 0.07450980392156863 0 0
                                                          0 0 0 1 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-6-blur"
                                            result="layer-6-offsetted"
                                            dx="0"
                                            dy="64"
                                            data-target-offset-y="64"
                                        ></feOffset>
                                        <feColorMatrix
                                            in="blur30"
                                            result="color-7-blur"
                                            type="matrix"
                                            values="0 0 0 0 0
                                                          0 0 0 0 0
                                                          0 0 0 0 0
                                                          0 0 0 0.68 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-7-blur"
                                            result="layer-7-offsetted"
                                            dx="0"
                                            dy="64"
                                            data-target-offset-y="64"
                                        ></feOffset>
                                        <feMerge>
                                            <feMergeNode in="layer-0-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-1-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-2-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-3-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-4-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-5-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-6-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-7-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-0-offsetted"></feMergeNode>
                                            <feMergeNode in="SourceGraphic"></feMergeNode>
                                        </feMerge>
                                    </filter>
                                    <filter
                                        id="glow-1-safari"
                                        color-interpolation-filters="sRGB"
                                        filterUnits="userSpaceOnUse"
                                        x="-50%"
                                        y="-50%"
                                        width="200%"
                                        height="200%"
                                    >
                                        <feGaussianBlur
                                            in="SourceGraphic"
                                            data-target-blur="4"
                                            stdDeviation="4"
                                            result="blur4"
                                        ></feGaussianBlur>
                                        <feGaussianBlur
                                            in="SourceGraphic"
                                            data-target-blur="19"
                                            stdDeviation="19"
                                            result="blur19"
                                        ></feGaussianBlur>
                                        <feGaussianBlur
                                            in="SourceGraphic"
                                            data-target-blur="9"
                                            stdDeviation="9"
                                            result="blur9"
                                        ></feGaussianBlur>
                                        <feGaussianBlur
                                            in="SourceGraphic"
                                            data-target-blur="30"
                                            stdDeviation="30"
                                            result="blur30"
                                        ></feGaussianBlur>
                                        <feColorMatrix
                                            in="blur4"
                                            result="color-0-blur"
                                            type="matrix"
                                            values="1 0 0 0 0
                                                          0 0.9803921568627451 0 0 0
                                                          0 0 0.9647058823529412 0 0
                                                          0 0 0 0.8 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-0-blur"
                                            result="layer-0-offsetted"
                                            dx="0"
                                            dy="0"
                                            data-target-offset-y="0"
                                        ></feOffset>
                                        <feColorMatrix
                                            in="blur19"
                                            result="color-1-blur"
                                            type="matrix"
                                            values="0.8156862745098039 0 0 0 0
                                                          0 0.49411764705882355 0 0 0
                                                          0 0 0.2627450980392157 0 0
                                                          0 0 0 1 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-1-blur"
                                            result="layer-1-offsetted"
                                            dx="0"
                                            dy="2"
                                            data-target-offset-y="2"
                                        ></feOffset>
                                        <feColorMatrix
                                            in="blur9"
                                            result="color-2-blur"
                                            type="matrix"
                                            values="1 0 0 0 0
                                                          0 0.6666666666666666 0 0 0
                                                          0 0 0.36470588235294116 0 0
                                                          0 0 0 0.65 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-2-blur"
                                            result="layer-2-offsetted"
                                            dx="0"
                                            dy="2"
                                            data-target-offset-y="2"
                                        ></feOffset>
                                        <feColorMatrix
                                            in="blur30"
                                            result="color-3-blur"
                                            type="matrix"
                                            values="1 0 0 0 0
                                                          0 0.611764705882353 0 0 0
                                                          0 0 0.39215686274509803 0 0
                                                          0 0 0 1 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-3-blur"
                                            result="layer-3-offsetted"
                                            dx="0"
                                            dy="2"
                                            data-target-offset-y="2"
                                        ></feOffset>
                                        <feColorMatrix
                                            in="blur30"
                                            result="color-4-blur"
                                            type="matrix"
                                            values="0.4549019607843137 0 0 0 0
                                                          0 0.16470588235294117 0 0 0
                                                          0 0 0 0 0
                                                          0 0 0 1 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-4-blur"
                                            result="layer-4-offsetted"
                                            dx="0"
                                            dy="16"
                                            data-target-offset-y="16"
                                        ></feOffset>
                                        <feColorMatrix
                                            in="blur30"
                                            result="color-5-blur"
                                            type="matrix"
                                            values="0.4235294117647059 0 0 0 0
                                                          0 0.19607843137254902 0 0 0
                                                          0 0 0.11372549019607843 0 0
                                                          0 0 0 1 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-5-blur"
                                            result="layer-5-offsetted"
                                            dx="0"
                                            dy="64"
                                            data-target-offset-y="64"
                                        ></feOffset>
                                        <feColorMatrix
                                            in="blur30"
                                            result="color-6-blur"
                                            type="matrix"
                                            values="0.21176470588235294 0 0 0 0
                                                          0 0.10980392156862745 0 0 0
                                                          0 0 0.07450980392156863 0 0
                                                          0 0 0 1 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-6-blur"
                                            result="layer-6-offsetted"
                                            dx="0"
                                            dy="64"
                                            data-target-offset-y="64"
                                        ></feOffset>
                                        <feColorMatrix
                                            in="blur30"
                                            result="color-7-blur"
                                            type="matrix"
                                            values="0 0 0 0 0
                                                          0 0 0 0 0
                                                          0 0 0 0 0
                                                          0 0 0 0.68 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-7-blur"
                                            result="layer-7-offsetted"
                                            dx="0"
                                            dy="64"
                                            data-target-offset-y="64"
                                        ></feOffset>
                                        <feMerge>
                                            <feMergeNode in="layer-0-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-1-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-2-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-3-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-4-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-5-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-6-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-7-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-0-offsetted"></feMergeNode>
                                            <feMergeNode in="SourceGraphic"></feMergeNode>
                                        </feMerge>
                                    </filter>
                                    <filter
                                        id="glow-1-safari-18"
                                        color-interpolation-filters="sRGB"
                                        filterUnits="userSpaceOnUse"
                                        x="-50%"
                                        y="-50%"
                                        width="200%"
                                        height="200%"
                                    >
                                        <feGaussianBlur
                                            in="SourceGraphic"
                                            data-target-blur="4"
                                            stdDeviation="4"
                                            result="blur4"
                                        ></feGaussianBlur>
                                        <feGaussianBlur
                                            in="SourceGraphic"
                                            data-target-blur="12"
                                            stdDeviation="12"
                                            result="blur12"
                                        ></feGaussianBlur>
                                        <feGaussianBlur
                                            in="SourceGraphic"
                                            data-target-blur="9"
                                            stdDeviation="9"
                                            result="blur9"
                                        ></feGaussianBlur>
                                        <feGaussianBlur
                                            in="SourceGraphic"
                                            data-target-blur="12"
                                            stdDeviation="12"
                                            result="blur12"
                                        ></feGaussianBlur>
                                        <feColorMatrix
                                            in="blur4"
                                            result="color-0-blur"
                                            type="matrix"
                                            values="1 0 0 0 0
                                                          0 0.9803921568627451 0 0 0
                                                          0 0 0.9647058823529412 0 0
                                                          0 0 0 0.8 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-0-blur"
                                            result="layer-0-offsetted"
                                            dx="0"
                                            dy="0"
                                            data-target-offset-y="0"
                                        ></feOffset>
                                        <feColorMatrix
                                            in="blur12"
                                            result="color-1-blur"
                                            type="matrix"
                                            values="0.8156862745098039 0 0 0 0
                                                          0 0.49411764705882355 0 0 0
                                                          0 0 0.2627450980392157 0 0
                                                          0 0 0 1 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-1-blur"
                                            result="layer-1-offsetted"
                                            dx="0"
                                            dy="2"
                                            data-target-offset-y="2"
                                        ></feOffset>
                                        <feColorMatrix
                                            in="blur9"
                                            result="color-2-blur"
                                            type="matrix"
                                            values="1 0 0 0 0
                                                          0 0.6666666666666666 0 0 0
                                                          0 0 0.36470588235294116 0 0
                                                          0 0 0 0.65 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-2-blur"
                                            result="layer-2-offsetted"
                                            dx="0"
                                            dy="2"
                                            data-target-offset-y="2"
                                        ></feOffset>
                                        <feColorMatrix
                                            in="blur12"
                                            result="color-3-blur"
                                            type="matrix"
                                            values="1 0 0 0 0
                                                          0 0.611764705882353 0 0 0
                                                          0 0 0.39215686274509803 0 0
                                                          0 0 0 1 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-3-blur"
                                            result="layer-3-offsetted"
                                            dx="0"
                                            dy="2"
                                            data-target-offset-y="2"
                                        ></feOffset>
                                        <feColorMatrix
                                            in="blur12"
                                            result="color-4-blur"
                                            type="matrix"
                                            values="0.4549019607843137 0 0 0 0
                                                          0 0.16470588235294117 0 0 0
                                                          0 0 0 0 0
                                                          0 0 0 1 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-4-blur"
                                            result="layer-4-offsetted"
                                            dx="0"
                                            dy="16"
                                            data-target-offset-y="16"
                                        ></feOffset>
                                        <feColorMatrix
                                            in="blur12"
                                            result="color-5-blur"
                                            type="matrix"
                                            values="0.4235294117647059 0 0 0 0
                                                          0 0.19607843137254902 0 0 0
                                                          0 0 0.11372549019607843 0 0
                                                          0 0 0 1 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-5-blur"
                                            result="layer-5-offsetted"
                                            dx="0"
                                            dy="20"
                                            data-target-offset-y="20"
                                        ></feOffset>
                                        <feColorMatrix
                                            in="blur12"
                                            result="color-6-blur"
                                            type="matrix"
                                            values="0.21176470588235294 0 0 0 0
                                                          0 0.10980392156862745 0 0 0
                                                          0 0 0.07450980392156863 0 0
                                                          0 0 0 1 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-6-blur"
                                            result="layer-6-offsetted"
                                            dx="0"
                                            dy="20"
                                            data-target-offset-y="20"
                                        ></feOffset>
                                        <feColorMatrix
                                            in="blur12"
                                            result="color-7-blur"
                                            type="matrix"
                                            values="0 0 0 0 0
                                                          0 0 0 0 0
                                                          0 0 0 0 0
                                                          0 0 0 0.68 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-7-blur"
                                            result="layer-7-offsetted"
                                            dx="0"
                                            dy="20"
                                            data-target-offset-y="20"
                                        ></feOffset>
                                        <feMerge>
                                            <feMergeNode in="layer-0-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-1-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-2-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-3-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-4-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-5-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-6-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-7-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-0-offsetted"></feMergeNode>
                                            <feMergeNode in="SourceGraphic"></feMergeNode>
                                        </feMerge>
                                    </filter>
                                    <filter
                                        id="glow-1-ios"
                                        color-interpolation-filters="sRGB"
                                        filterUnits="userSpaceOnUse"
                                        x="-50%"
                                        y="-50%"
                                        width="200%"
                                        height="200%"
                                    >
                                        <feGaussianBlur
                                            in="SourceGraphic"
                                            data-target-blur="4"
                                            stdDeviation="4"
                                            result="blur4"
                                        ></feGaussianBlur>
                                        <feGaussianBlur
                                            in="SourceGraphic"
                                            data-target-blur="12"
                                            stdDeviation="12"
                                            result="blur12"
                                        ></feGaussianBlur>
                                        <feGaussianBlur
                                            in="SourceGraphic"
                                            data-target-blur="9"
                                            stdDeviation="9"
                                            result="blur9"
                                        ></feGaussianBlur>
                                        <feGaussianBlur
                                            in="SourceGraphic"
                                            data-target-blur="12"
                                            stdDeviation="12"
                                            result="blur12"
                                        ></feGaussianBlur>
                                        <feColorMatrix
                                            in="blur4"
                                            result="color-0-blur"
                                            type="matrix"
                                            values="1 0 0 0 0
                                                        0 0.9803921568627451 0 0 0
                                                        0 0 0.9647058823529412 0 0
                                                        0 0 0 0.8 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-0-blur"
                                            result="layer-0-offsetted"
                                            dx="0"
                                            dy="0"
                                            data-target-offset-y="0"
                                        ></feOffset>
                                        <feColorMatrix
                                            in="blur12"
                                            result="color-1-blur"
                                            type="matrix"
                                            values="0.8156862745098039 0 0 0 0
                                                        0 0.49411764705882355 0 0 0
                                                        0 0 0.2627450980392157 0 0
                                                        0 0 0 1 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-1-blur"
                                            result="layer-1-offsetted"
                                            dx="0"
                                            dy="2"
                                            data-target-offset-y="2"
                                        ></feOffset>
                                        <feColorMatrix
                                            in="blur9"
                                            result="color-2-blur"
                                            type="matrix"
                                            values="1 0 0 0 0
                                                        0 0.6666666666666666 0 0 0
                                                        0 0 0.36470588235294116 0 0
                                                        0 0 0 0.65 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-2-blur"
                                            result="layer-2-offsetted"
                                            dx="0"
                                            dy="2"
                                            data-target-offset-y="2"
                                        ></feOffset>
                                        <feColorMatrix
                                            in="blur12"
                                            result="color-3-blur"
                                            type="matrix"
                                            values="1 0 0 0 0
                                                        0 0.611764705882353 0 0 0
                                                        0 0 0.39215686274509803 0 0
                                                        0 0 0 1 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-3-blur"
                                            result="layer-3-offsetted"
                                            dx="0"
                                            dy="2"
                                            data-target-offset-y="2"
                                        ></feOffset>
                                        <feColorMatrix
                                            in="blur12"
                                            result="color-4-blur"
                                            type="matrix"
                                            values="0.4549019607843137 0 0 0 0
                                                        0 0.16470588235294117 0 0 0
                                                        0 0 0 0 0
                                                        0 0 0 1 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-4-blur"
                                            result="layer-4-offsetted"
                                            dx="0"
                                            dy="12"
                                            data-target-offset-y="12"
                                        ></feOffset>
                                        <feColorMatrix
                                            in="blur12"
                                            result="color-5-blur"
                                            type="matrix"
                                            values="0.4235294117647059 0 0 0 0
                                                        0 0.19607843137254902 0 0 0
                                                        0 0 0.11372549019607843 0 0
                                                        0 0 0 1 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-5-blur"
                                            result="layer-5-offsetted"
                                            dx="0"
                                            dy="12"
                                            data-target-offset-y="12"
                                        ></feOffset>
                                        <feColorMatrix
                                            in="blur12"
                                            result="color-6-blur"
                                            type="matrix"
                                            values="0.21176470588235294 0 0 0 0
                                                        0 0.10980392156862745 0 0 0
                                                        0 0 0.07450980392156863 0 0
                                                        0 0 0 1 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-6-blur"
                                            result="layer-6-offsetted"
                                            dx="0"
                                            dy="12"
                                            data-target-offset-y="12"
                                        ></feOffset>
                                        <feColorMatrix
                                            in="blur12"
                                            result="color-7-blur"
                                            type="matrix"
                                            values="0 0 0 0 0
                                                        0 0 0 0 0
                                                        0 0 0 0 0
                                                        0 0 0 0.68 0"
                                        ></feColorMatrix>
                                        <feOffset
                                            in="color-7-blur"
                                            result="layer-7-offsetted"
                                            dx="0"
                                            dy="12"
                                            data-target-offset-y="12"
                                        ></feOffset>
                                        <feMerge>
                                            <feMergeNode in="layer-0-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-1-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-2-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-3-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-4-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-5-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-6-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-7-offsetted"></feMergeNode>
                                            <feMergeNode in="layer-0-offsetted"></feMergeNode>
                                            <feMergeNode in="SourceGraphic"></feMergeNode>
                                        </feMerge>
                                    </filter>
                                </defs>
                            </svg>

                            <span className="filter">{props.title}</span>
                        </div>
                    </h2>
                </div>
            </div>
        </section>
    )
}

const convertStylesToString = (styles) => {
    return (
        Object.keys(styles)
            .map(
                (property) =>
                    `${property.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${
                        styles[property]
                    }`
            )
            .join("; ") + ";"
    )
}

Glow.displayName = "Text Glow"

addPropertyControls(Glow, {
    title: {
        type: ControlType.String,
        defaultValue: "Titanium",
    },
    font: {
        type: ControlType.Font,
        controls: "extended",
        displayFontSize: true,
        displayTextAlignment: false,
        defaultValue: {
            fontWeight: 400,
            fontStyle: "normal",
            fontFamily: '"Inter", "Inter Placeholder", sans-serif',
            fontSize: "14px",
            lineHeight: "1.5em",
            letterSpacing: "0em",
        },
    },
})
