// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect } from "react"
import { Fragment } from "react"

/**
 * @framerDisableUnlink
 */
export default function OverscrollBehavior(props) {
    const { enabled = true } = props

    useEffect(() => {
        // Apply overscroll behavior fix when component mounts
        if (enabled) {
            // Store original value for cleanup
            const originalOverscrollBehavior =
                document.body.style.overscrollBehavior

            // Apply the fix
            document.body.style.overscrollBehavior = "none"

            // Cleanup function - restore original behavior when component unmounts
            return () => {
                document.body.style.overscrollBehavior =
                    originalOverscrollBehavior
            }
        }
    }, [enabled])

    // Return inline styles to ensure overscroll behavior is properly applied
    return (
        <Fragment>
            <style>
                {`
                    body {
                        overscroll-behavior: ${enabled ? "none" : "auto"};
                    }
                    
                    html {
                        overscroll-behavior: ${enabled ? "none" : "auto"};
                    }
                    
                    /* Additional iOS Safari specific fixes */
                    body.no-overscroll {
                        position: fixed;
                        overflow: hidden;
                        width: 100%;
                        height: 100%;
                    }
                    
                    /* Prevent rubber band scrolling on iOS */
                    .no-bounce {
                        -webkit-overflow-scrolling: touch;
                        overscroll-behavior: none;
                    }
                `}
            </style>
        </Fragment>
    )
}

OverscrollBehavior.displayName = "Overscroll Behavior"

addPropertyControls(OverscrollBehavior, {
    enabled: {
        title: "Enabled",
        type: ControlType.Boolean,
        defaultValue: true,
        description:
            "Enable/disable overscroll behavior prevention\n\nMade with ❤️ by [Nitso](https://dub.sh/nitso-framer)",
    },
})
