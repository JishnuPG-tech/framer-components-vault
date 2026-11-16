import { useState, useEffect, useRef, useCallback, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"

interface RatingInputProps {
    name: string
    defaultValue: number
    maxRating: number
    allowHalfValues: boolean
    showHoverEffect: boolean
    iconType: "star" | "heart" | "lightning" | "circle" | "thumbsUp"
    activeColor: string
    inactiveColor: string
    size: number
    spacing: number
    position: "start" | "center" | "end" | "space-between" | "space-around" | "space-evenly"
    style?: CSSProperties
    onChange?: (value: number) => void
    onBlur?: () => void
}

/**
 * Rating input
 * 
 * A form-compatible rating input component that allows users to select a rating.
 * 
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function RatingInput(props: RatingInputProps) {
    const {
        name,
        defaultValue = 0,
        maxRating = 5,
        allowHalfValues = false,
        showHoverEffect = true,
        iconType = "star",
        activeColor = "#FFB400",
        inactiveColor = "#E0E0E0",
        size = 24,
        spacing = 4,
        position = "start",
        style,
        onChange,
        onBlur,
    } = props

    const [rating, setRating] = useState(defaultValue)
    const [hoverRating, setHoverRating] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!showHoverEffect || !containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const totalWidth = rect.width
        const iconWidth = size
        
        // Calculate which icon is being hovered based on position
        let hoveredIconIndex = -1
        const icons = containerRef.current.children
        
        for (let i = 0; i < icons.length; i++) {
            const iconRect = icons[i].getBoundingClientRect()
            if (e.clientX >= iconRect.left && e.clientX <= iconRect.right) {
                hoveredIconIndex = i
                break
            }
        }
        
        // If we found a hovered icon, set the hover rating to that index + 1
        if (hoveredIconIndex !== -1) {
            let newHoverRating = hoveredIconIndex + 1
            
            if (allowHalfValues) {
                const iconRect = icons[hoveredIconIndex].getBoundingClientRect()
                const iconX = e.clientX - iconRect.left
                if (iconX < iconRect.width / 2) {
                    newHoverRating = hoveredIconIndex + 0.5
                }
            }
            
            setHoverRating(newHoverRating)
        } else {
            setHoverRating(0)
        }
    }, [showHoverEffect, size, maxRating, allowHalfValues])

    const handleMouseLeave = useCallback(() => {
        setHoverRating(0)
    }, [])

    const handleClick = useCallback((index: number, e: React.MouseEvent<HTMLDivElement>) => {
        let newRating = index + 1;
        
        // If clicking on the currently selected rating, toggle it off
        if (newRating === rating) {
            newRating = 0;
        }
        
        setRating(newRating);
        
        if (onChange) {
            onChange(newRating);
        }
        
        if (inputRef.current) {
            inputRef.current.value = newRating.toString();
            
            // Dispatch input event for form integration
            const event = new Event('input', { bubbles: true });
            inputRef.current.dispatchEvent(event);
        }
        
        e.stopPropagation();
    }, [rating, onChange])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        let newRating = rating
        
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            newRating = allowHalfValues ? rating + 0.5 : rating + 1
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            newRating = allowHalfValues ? rating - 0.5 : rating - 1
        } else if (e.key === 'Home') {
            newRating = 0
        } else if (e.key === 'End') {
            newRating = maxRating
        } else {
            return
        }
        
        newRating = Math.max(0, Math.min(maxRating, newRating))
        
        if (newRating !== rating) {
            setRating(newRating)
            
            if (onChange) {
                onChange(newRating)
            }
            
            if (inputRef.current) {
                inputRef.current.value = newRating.toString()
                
                // Dispatch input event for form integration
                const event = new Event('input', { bubbles: true })
                inputRef.current.dispatchEvent(event)
            }
        }
        
        e.preventDefault()
    }, [rating, allowHalfValues, maxRating, onChange])

    const handleBlur = useCallback(() => {
        if (onBlur) {
            onBlur()
        }
    }, [onBlur])

    const getIconPath = useCallback((type: string) => {
        switch (type) {
            case "star":
                return "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
            case "heart":
                return "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            case "lightning":
                return "M7 2v11h3v9l7-12h-4l4-8z"
            case "circle":
                return "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
            case "thumbsUp":
                return "M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"
            default:
                return "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
        }
    }, [])

    const renderIcon = useCallback((index: number) => {
        const displayRating = hoverRating > 0 ? hoverRating : rating
        const iconPath = getIconPath(iconType)
        
        // Only fill this specific icon if it's less than or equal to the rating
        const isActive = index < displayRating || 
                        (allowHalfValues && Math.floor(displayRating) === index && displayRating % 1 > 0)
        
        let fillPercentage = 0
        if (displayRating >= index + 1) {
            fillPercentage = 100
        } else if (displayRating > index && displayRating < index + 1) {
            fillPercentage = (displayRating - index) * 100
        }
        
        return (
            <div 
                key={index} 
                style={{ 
                    width: size, 
                    height: size, 
                    marginRight: position.startsWith('space-') ? 0 : (index < maxRating - 1 ? spacing : 0),
                    position: 'relative',
                }}
                onClick={(e) => handleClick(index, e)}
            >
                <svg 
                    viewBox="0 0 24 24" 
                    width={size} 
                    height={size} 
                    style={{ 
                        position: 'absolute',
                        fill: inactiveColor,
                    }}
                >
                    <path d={iconPath} />
                </svg>
                
                <svg 
                    viewBox="0 0 24 24" 
                    width={size} 
                    height={size} 
                    style={{ 
                        position: 'absolute',
                        clipPath: allowHalfValues 
                            ? `inset(0 ${100 - fillPercentage}% 0 0)` 
                            : fillPercentage >= 50 ? 'none' : 'inset(0 100% 0 0)',
                        fill: activeColor,
                    }}
                >
                    <path d={iconPath} />
                </svg>
            </div>
        )
    }, [rating, hoverRating, size, spacing, maxRating, iconType, activeColor, inactiveColor, allowHalfValues, getIconPath, position, handleClick])

    return (
        <div 
            style={{ 
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: position,
                width: '100%',
                ...style,
            }}
        >
            <div
                ref={containerRef}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    width: position.startsWith('space-') ? '100%' : 'auto',
                    justifyContent: position.startsWith('space-') ? position : 'flex-start',
                }}
                role="slider"
                aria-valuemin={0}
                aria-valuemax={maxRating}
                aria-valuenow={rating}
                aria-label={`Rating: ${rating} out of ${maxRating}`}
                tabIndex={0}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
            >
                {Array.from({ length: maxRating }).map((_, index) => renderIcon(index))}
            </div>
            
            <input
                ref={inputRef}
                type="hidden"
                name={name}
                value={rating}
            />
        </div>
    )
}

addPropertyControls(RatingInput, {
    name: {
        type: ControlType.String,
        title: "Field Name",
        defaultValue: "rating",
    },
    position: {
        type: ControlType.Enum,
        title: "Position",
        options: ["start", "center", "end", "space-between", "space-around", "space-evenly"],
        optionTitles: ["Start", "Center", "End", "Space Between", "Space Around", "Space Evenly"],
        defaultValue: "start",
    },
    defaultValue: {
        type: ControlType.Number,
        title: "Default Value",
        defaultValue: 0,
        min: 0,
        max: 5,
        step: 0.5,
    },
    maxRating: {
        type: ControlType.Number,
        title: "Max Rating",
        defaultValue: 5,
        min: 1,
        max: 10,
        step: 1,
    },
    allowHalfValues: {
        type: ControlType.Boolean,
        title: "Half Values",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    showHoverEffect: {
        type: ControlType.Boolean,
        title: "Hover Effect",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    iconType: {
        type: ControlType.Enum,
        title: "Icon Type",
        options: ["star", "heart", "lightning", "circle", "thumbsUp"],
        optionTitles: ["Star", "Heart", "Lightning", "Circle", "Thumbs Up"],
        defaultValue: "star",
    },
    activeColor: {
        type: ControlType.Color,
        title: "Active Color",
        defaultValue: "#FFB400",
    },
    inactiveColor: {
        type: ControlType.Color,
        title: "Inactive Color",
        defaultValue: "#E0E0E0",
    },
    size: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 24,
        min: 12,
        max: 64,
        step: 1,
        unit: "px",
    },
    spacing: {
        type: ControlType.Number,
        title: "Icon Spacing",
        defaultValue: 4,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
})

RatingInput.displayName = "Rating input"