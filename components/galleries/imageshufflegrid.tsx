// ImageShuffleGrid - A dynamic, animated grid of images that randomly swap positions with each other at set intervals
import React, { useState, useEffect, useCallback, startTransition } from "react"
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ImageItem {
    id: string
    src: string
    alt: string
    gridPosition: number
    nextSrc?: string
    isTransitioning?: boolean
}

interface ImageShuffleGridProps {
    images: Array<{ src: string; alt?: string }>
    emptySlotColor: string
    rows: number
    columns: number
    gap: number
    padding: number
    aspectRatio: "square" | "landscape" | "portrait"
    objectFit: "cover" | "contain" | "fill" | "scale-down" | "none"
    borderRadius: number
    borderColor: string
    borderWidth: number
    backgroundColor: string
    swapInterval: number
    animationDuration: number
    easing: "easeInOut" | "spring" | "linear" | "easeOut" | "easeIn"
    shuffleStyle: "neighbors" | "random" | "diagonal"
    hoverEffect: boolean
    hoverScale: number
    randomizationIntensity: number
    maxSwapsPerInterval: number
    enableImageCycle: boolean
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ImageShuffleGrid(props: ImageShuffleGridProps) {
    const {
        images = [
            { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Image 1" },
            { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Image 2" },
            { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Image 3" },
            { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Image 4" },
            { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "Image 5" },
            { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Image 6" },
            { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Image 7" },
            { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Image 8" },
            { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Image 9" }
        ],
        emptySlotColor = "#EEEEEE",
        rows = 3,
        columns = 3,
        gap = 8,
        padding = 16,
        aspectRatio = "square",
        objectFit = "cover",
        borderRadius = 8,
        borderColor = "#000000",
        borderWidth = 0,
        backgroundColor = "#F5F5F5",
        swapInterval = 2000,
        animationDuration = 0.8,
        easing = "easeInOut",
        shuffleStyle = "neighbors",
        hoverEffect = true,
        hoverScale = 1.05,
        randomizationIntensity = 100,
        maxSwapsPerInterval = 1,
        enableImageCycle = false
    } = props

    const isStatic = useIsStaticRenderer()
    const [imageItems, setImageItems] = useState<ImageItem[]>([])
    const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set())

    // Preload all images
    useEffect(() => {
        const imagesToPreload = images.map(img => img.src).filter(src => src)
        const loaded = new Set<string>()
        
        imagesToPreload.forEach(src => {
            const img = new Image()
            img.onload = () => {
                loaded.add(src)
                setPreloadedImages(new Set(loaded))
            }
            img.src = src
        })
    }, [images])

    // Initialize image items
    useEffect(() => {
        const totalSlots = rows * columns
        const displayImages = images.slice(0, totalSlots)
        
        const items: ImageItem[] = displayImages.map((image, index) => ({
            id: `image-${index}`,
            src: image.src,
            alt: image.alt || `Image ${index + 1}`,
            gridPosition: index
        }))
        
        // Fill remaining slots with empty placeholders
        for (let i = displayImages.length; i < totalSlots; i++) {
            items.push({
                id: `empty-${i}`,
                src: "",
                alt: `Empty slot ${i + 1}`,
                gridPosition: i
            })
        }
        
        setImageItems(items)
    }, [rows, columns, images])

    // Updated swap function to support multiple swaps
    const swapPositions = useCallback(() => {
        if (imageItems.length < 2) return

        const newImageItems = [...imageItems]
        const usedImages = new Set<number>()
        const swapsToPerform = Math.min(maxSwapsPerInterval, Math.floor(imageItems.length / 2))
        
        // Get currently visible image sources for smart cycling
        const currentlyVisibleSources = new Set(
            newImageItems.filter(item => item.src).map(item => item.src)
        )
        
        // Get available images that aren't currently visible
        const getAvailableImageForCycle = () => {
            if (!enableImageCycle || images.length <= imageItems.length) {
                return null
            }
            
            const availableImages = images.filter(img => !currentlyVisibleSources.has(img.src))
            if (availableImages.length === 0) return null
            
            const randomIndex = Math.floor(Math.random() * availableImages.length)
            return availableImages[randomIndex]
        }
        
        for (let swapCount = 0; swapCount < swapsToPerform; swapCount++) {
            if (shuffleStyle === "neighbors") {
                // Get neighbors for each position
                const getNeighbors = (position: number) => {
                    const row = Math.floor(position / columns)
                    const col = position % columns
                    const neighbors = []
                    
                    // Up
                    if (row > 0) neighbors.push(position - columns)
                    // Down  
                    if (row < rows - 1) neighbors.push(position + columns)
                    // Left
                    if (col > 0) neighbors.push(position - 1)
                    // Right
                    if (col < columns - 1) neighbors.push(position + 1)
                    
                    return neighbors
                }
                
                // Find available images that haven't been used in this interval
                const availableImages = newImageItems
                    .map((item, index) => ({ item, index }))
                    .filter(({ index }) => !usedImages.has(index))
                
                if (availableImages.length < 2) break
                
                // Pick a random available image
                const randomAvailableIndex = Math.floor(Math.random() * availableImages.length)
                const { item: selectedItem, index: selectedImageIndex } = availableImages[randomAvailableIndex]
                const currentPosition = selectedItem.gridPosition
                const neighbors = getNeighbors(currentPosition)
                
                // Filter neighbors to only include available ones
                const availableNeighbors = neighbors.filter(neighborPosition => {
                    const neighborImageIndex = newImageItems.findIndex(item => item.gridPosition === neighborPosition)
                    return neighborImageIndex !== -1 && !usedImages.has(neighborImageIndex)
                })
                
                if (availableNeighbors.length > 0) {
                    const randomNeighborPosition = availableNeighbors[Math.floor(Math.random() * availableNeighbors.length)]
                    const neighborImageIndex = newImageItems.findIndex(item => item.gridPosition === randomNeighborPosition)
                    
                    if (neighborImageIndex !== -1) {
                        // Swap positions
                        const temp = newImageItems[selectedImageIndex].gridPosition
                        newImageItems[selectedImageIndex].gridPosition = newImageItems[neighborImageIndex].gridPosition
                        newImageItems[neighborImageIndex].gridPosition = temp
                        
                        // If image cycle is enabled, prepare crossfade transition
                        const newImage = getAvailableImageForCycle()
                        if (newImage && preloadedImages.has(newImage.src)) {
                            newImageItems[selectedImageIndex].nextSrc = newImage.src
                            newImageItems[selectedImageIndex].isTransitioning = true
                            currentlyVisibleSources.add(newImage.src)
                            
                            // Complete the transition after crossfade completes
                            setTimeout(() => {
                                startTransition(() => {
                                    setImageItems(prev => prev.map(item => 
                                        item.id === newImageItems[selectedImageIndex].id
                                            ? { ...item, src: item.nextSrc || item.src, isTransitioning: false, nextSrc: undefined }
                                            : item
                                    ))
                                })
                            }, (animationDuration * 1000) + 50)
                        }
                        
                        // Mark both images as used
                        usedImages.add(selectedImageIndex)
                        usedImages.add(neighborImageIndex)
                    }
                }
            } else if (shuffleStyle === "diagonal") {
                // Get diagonal neighbors for each position
                const getDiagonalNeighbors = (position: number) => {
                    const row = Math.floor(position / columns)
                    const col = position % columns
                    const neighbors = []
                    
                    // Top-left diagonal
                    if (row > 0 && col > 0) neighbors.push(position - columns - 1)
                    // Top-right diagonal
                    if (row > 0 && col < columns - 1) neighbors.push(position - columns + 1)
                    // Bottom-left diagonal
                    if (row < rows - 1 && col > 0) neighbors.push(position + columns - 1)
                    // Bottom-right diagonal
                    if (row < rows - 1 && col < columns - 1) neighbors.push(position + columns + 1)
                    
                    return neighbors
                }
                
                // Find available images that haven't been used in this interval
                const availableImages = newImageItems
                    .map((item, index) => ({ item, index }))
                    .filter(({ index }) => !usedImages.has(index))
                
                if (availableImages.length < 2) break
                
                // Pick a random available image
                const randomAvailableIndex = Math.floor(Math.random() * availableImages.length)
                const { item: selectedItem, index: selectedImageIndex } = availableImages[randomAvailableIndex]
                const currentPosition = selectedItem.gridPosition
                const diagonalNeighbors = getDiagonalNeighbors(currentPosition)
                
                // Filter neighbors to only include available ones
                const availableDiagonalNeighbors = diagonalNeighbors.filter(neighborPosition => {
                    const neighborImageIndex = newImageItems.findIndex(item => item.gridPosition === neighborPosition)
                    return neighborImageIndex !== -1 && !usedImages.has(neighborImageIndex)
                })
                
                if (availableDiagonalNeighbors.length > 0) {
                    const randomNeighborPosition = availableDiagonalNeighbors[Math.floor(Math.random() * availableDiagonalNeighbors.length)]
                    const neighborImageIndex = newImageItems.findIndex(item => item.gridPosition === randomNeighborPosition)
                    
                    if (neighborImageIndex !== -1) {
                        // Swap positions
                        const temp = newImageItems[selectedImageIndex].gridPosition
                        newImageItems[selectedImageIndex].gridPosition = newImageItems[neighborImageIndex].gridPosition
                        newImageItems[neighborImageIndex].gridPosition = temp
                        
                        // If image cycle is enabled, prepare crossfade transition
                        const newImage = getAvailableImageForCycle()
                        if (newImage && preloadedImages.has(newImage.src)) {
                            newImageItems[selectedImageIndex].nextSrc = newImage.src
                            newImageItems[selectedImageIndex].isTransitioning = true
                            currentlyVisibleSources.add(newImage.src)
                            
                            // Complete the transition after crossfade completes
                            setTimeout(() => {
                                startTransition(() => {
                                    setImageItems(prev => prev.map(item => 
                                        item.id === newImageItems[selectedImageIndex].id
                                            ? { ...item, src: item.nextSrc || item.src, isTransitioning: false, nextSrc: undefined }
                                            : item
                                    ))
                                })
                            }, (animationDuration * 1000) + 50)
                        }
                        
                        // Mark both images as used
                        usedImages.add(selectedImageIndex)
                        usedImages.add(neighborImageIndex)
                    }
                }
            } else {
                // Random swap
                const availableImages = newImageItems
                    .map((item, index) => ({ item, index }))
                    .filter(({ index }) => !usedImages.has(index))
                
                if (availableImages.length < 2) break
                
                const randomIndex1 = Math.floor(Math.random() * availableImages.length)
                let randomIndex2 = Math.floor(Math.random() * availableImages.length)
                while (randomIndex2 === randomIndex1 && availableImages.length > 1) {
                    randomIndex2 = Math.floor(Math.random() * availableImages.length)
                }
                
                const index1 = availableImages[randomIndex1].index
                const index2 = availableImages[randomIndex2].index
                
                const temp = newImageItems[index1].gridPosition
                newImageItems[index1].gridPosition = newImageItems[index2].gridPosition
                newImageItems[index2].gridPosition = temp
                
                // If image cycle is enabled, prepare crossfade transition
                const newImage = getAvailableImageForCycle()
                if (newImage && preloadedImages.has(newImage.src)) {
                    newImageItems[index1].nextSrc = newImage.src
                    newImageItems[index1].isTransitioning = true
                    currentlyVisibleSources.add(newImage.src)
                    
                    // Complete the transition after crossfade completes
                    setTimeout(() => {
                        startTransition(() => {
                            setImageItems(prev => prev.map(item => 
                                item.id === newImageItems[index1].id
                                    ? { ...item, src: item.nextSrc || item.src, isTransitioning: false, nextSrc: undefined }
                                    : item
                            ))
                        })
                    }, (animationDuration * 1000) + 50)
                }
                
                // Mark both images as used
                usedImages.add(index1)
                usedImages.add(index2)
            }
        }

        startTransition(() => {
            setImageItems(newImageItems)
        })
    }, [imageItems, shuffleStyle, rows, columns, maxSwapsPerInterval, enableImageCycle, images, preloadedImages, animationDuration])

    // Animation interval
    useEffect(() => {
        if (isStatic || imageItems.length === 0) return

        const interval = setInterval(() => {
            if (Math.random() * 100 < randomizationIntensity) {
                swapPositions()
            }
        }, swapInterval)

        return () => clearInterval(interval)
    }, [swapInterval, swapPositions, randomizationIntensity, isStatic, imageItems.length])

    // Animation variants
    const getTransition = () => {
        if (easing === "spring") {
            return { type: "spring", stiffness: 300, damping: 30 }
        }
        return { duration: animationDuration, ease: easing }
    }

    const getGridPosition = (position: number) => {
        const row = Math.floor(position / columns)
        const col = position % columns
        return { gridColumn: col + 1, gridRow: row + 1 }
    }

    return (
        <div
            style={{
                width: "100%",
                backgroundColor,
                padding: padding,
                position: "relative",
                overflow: "hidden",
                boxSizing: "border-box",
                minWidth: 0,
                minHeight: 0
            }}
        >
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                    gap: gap,
                    width: "100%",
                    boxSizing: "border-box",
                    overflow: "hidden",
                    minWidth: 0,
                    minHeight: 0
                }}
            >
                {imageItems.map((item) => (
                    <motion.div
                        key={item.id}
                        layout
                        style={{
                            ...getGridPosition(item.gridPosition),
                            position: "relative",
                            borderRadius,
                            overflow: "hidden",
                            backgroundColor: emptySlotColor,
                            border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : "none",
                            aspectRatio: aspectRatio === "square" ? "1 / 1" : aspectRatio === "landscape" ? "16 / 9" : "9 / 16",
                            minWidth: 0,
                            minHeight: 0,
                            maxWidth: "100%",
                            maxHeight: "100%"
                        }}
                        transition={getTransition()}
                        whileHover={hoverEffect ? { scale: hoverScale } : undefined}
                    >
                        {/* Only render images when a valid source exists to avoid broken placeholders */}
                        {item.src && (
                            <motion.img
                                src={item.src}
                                alt={item.alt}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: objectFit,
                                    display: "block",
                                    maxWidth: "100%",
                                    maxHeight: "100%",
                                    position: "absolute",
                                    top: 0,
                                    left: 0
                                }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0 }}
                            />
                        )}

                        {/* Next image (for crossfade) */}
                        {item.nextSrc && (
                            <motion.img
                                src={item.nextSrc}
                                alt={item.alt}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: objectFit,
                                    display: "block",
                                    maxWidth: "100%",
                                    maxHeight: "100%",
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    zIndex: 1
                                }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: animationDuration, ease: "easeInOut" }}
                            />
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

addPropertyControls(ImageShuffleGrid, {
    // Images
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.ResponsiveImage,
        },
        defaultValue: [
            { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Image 1" },
            { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Image 2" },
            { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Image 3" },
            { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Image 4" }
        ]
    },
    
    // Layout
    rows: {
        type: ControlType.Number,
        title: "Rows",
        defaultValue: 3,
        min: 1,
        max: 5,
        step: 1,
        displayStepper: true,
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 3,
        min: 1,
        max: 5,
        step: 1,
        displayStepper: true,
    },
    aspectRatio: {
        type: ControlType.Enum,
        title: "Aspect Ratio",
        options: ["square", "landscape", "portrait"],
        optionTitles: ["Square", "Landscape", "Portrait"],
        defaultValue: "square",
        displaySegmentedControl: true,
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["cover", "contain", "fill", "scale-down", "none"],
        optionTitles: ["Cover", "Contain", "Fill", "Scale Down", "None"],
        defaultValue: "cover",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 8,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Inner Padding",
        defaultValue: 16,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    
    // Appearance
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#F5F5F5",
    },
    emptySlotColor: {
        type: ControlType.Color,
        title: "Empty Slot Color",
        defaultValue: "#EEEEEE",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 8,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#000000",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 0,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    hoverEffect: {
        type: ControlType.Boolean,
        title: "Hover Effect",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.05,
        min: 1,
        max: 1.5,
        step: 0.01,
        hidden: ({ hoverEffect }) => !hoverEffect,
    },
    
    // Animation
    swapInterval: {
        type: ControlType.Number,
        title: "Swap Interval",
        defaultValue: 2000,
        min: 500,
        max: 10000,
        step: 100,
        unit: "ms",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 0.8,
        min: 0.1,
        max: 3,
        step: 0.1,
        unit: "s",
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["easeInOut", "spring", "linear", "easeOut", "easeIn"],
        optionTitles: ["Ease In Out", "Spring", "Linear", "Ease Out", "Ease In"],
        defaultValue: "easeInOut",
    },
    
    // Behavior
    shuffleStyle: {
        type: ControlType.Enum,
        title: "Shuffle Style",
        options: ["neighbors", "random", "diagonal"],
        optionTitles: ["Adjacent Swap", "Random Swap", "Diagonal Swap"],
        defaultValue: "neighbors",
    },
    maxSwapsPerInterval: {
        type: ControlType.Number,
        title: "Max Swaps Per Interval",
        defaultValue: 1,
        min: 1,
        max: 10,
        step: 1,
        displayStepper: true,
    },
    randomizationIntensity: {
        type: ControlType.Number,
        title: "Randomization Intensity",
        defaultValue: 100,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    enableImageCycle: {
        type: ControlType.Boolean,
        title: "Enable Image Cycle",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})