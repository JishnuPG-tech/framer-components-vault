// Multi-location map component without API key, using OpenStreetMap + Leaflet CDN
import { useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface Marker {
  coordinates: string
  name: string
  address: string
}

interface MapProps {
  markers: Marker[]
  zoom: number
  useCustomPin: boolean
  customPinImage: { src: string; alt?: string }
  customPinSize: number
  markerColor: string
  popoverBackground: string
  popoverTextColor: string
  mapTheme: "standard" | "dark" | "satellite" | "topo" | "light"
  borderRadius: number
  enableClustering: boolean
  showPopup: boolean
  style?: React.CSSProperties
}

/**
 * MultiLocationMap (OpenStreetMap powered map)
 * Shows multiple markers on a map without requiring an API key
 *
 * @framerIntrinsicWidth 480
 * @framerIntrinsicHeight 320
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function MultiLocationMap(props: MapProps) {
  const { markers, zoom, useCustomPin, customPinImage = { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Custom Pin" }, customPinSize, markerColor, popoverBackground, popoverTextColor, mapTheme, borderRadius, enableClustering, showPopup, style } = props
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<any>(null)
  const firstMarkerRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined") return

    // If leaflet already loaded, skip
    if ((window as any).L && leafletRef.current) {
      leafletRef.current.remove()
      leafletRef.current = null
    }

    // Dynamically load Leaflet CSS & JS if not present
    function ensureLeafletLoaded(): Promise<any> {
      if ((window as any).L) return Promise.resolve((window as any).L)
      return new Promise((resolve) => {
        const exists = document.getElementById("leaflet-style")
        if (!exists) {
          const link = document.createElement("link")
          link.id = "leaflet-style"
          link.rel = "stylesheet"
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          document.head.appendChild(link)
        }
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.onload = () => resolve((window as any).L)
        document.body.appendChild(script)
      })
    }

    // Dynamically load Leaflet.markercluster plugin
    function ensureMarkerClusterLoaded(): Promise<any> {
      if ((window as any).L && (window as any).L.markerClusterGroup) {
        return Promise.resolve((window as any).L)
      }
      return new Promise((resolve) => {
        const cssExists = document.getElementById("leaflet-markercluster-style")
        if (!cssExists) {
          const link = document.createElement("link")
          link.id = "leaflet-markercluster-style"
          link.rel = "stylesheet"
          link.href = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css"
          document.head.appendChild(link)
          
          const linkDefault = document.createElement("link")
          linkDefault.id = "leaflet-markercluster-default-style"
          linkDefault.rel = "stylesheet"
          linkDefault.href = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css"
          document.head.appendChild(linkDefault)
        }
        
        const scriptExists = document.getElementById("leaflet-markercluster-script")
        if (!scriptExists) {
          const script = document.createElement("script")
          script.id = "leaflet-markercluster-script"
          script.src = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"
          script.onload = () => resolve((window as any).L)
          document.body.appendChild(script)
        } else {
          resolve((window as any).L)
        }
      })
    }

    ensureLeafletLoaded().then((L) => {
      // Load marker cluster plugin if clustering is enabled
      const loadPromise = enableClustering ? ensureMarkerClusterLoaded() : Promise.resolve(L)
      
      return loadPromise.then(() => {
        if (!mapRef.current) return
        // Prevent double init
        mapRef.current.innerHTML = ""
        
        // Load Google Font Inter
        const fontExists = document.getElementById("google-font-inter")
        if (!fontExists) {
          const link = document.createElement("link")
          link.id = "google-font-inter"
          link.rel = "stylesheet"
          link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          document.head.appendChild(link)
        }
        
        const map = L.map(mapRef.current, {
          zoomControl: true,
          attributionControl: false,
        })
        leafletRef.current = map

        // Compute bounds if markers exist
        let bounds = null
        if (markers.length > 0) {
          const validCoords = markers
            .map(m => {
              const parts = m.coordinates.split(',').map(s => s.trim())
              if (parts.length !== 2) return null
              const lat = parseFloat(parts[0])
              const lng = parseFloat(parts[1])
              if (isNaN(lat) || isNaN(lng)) return null
              return [lat, lng]
            })
            .filter(coord => coord !== null)
          
          if (validCoords.length > 0) {
            bounds = L.latLngBounds(validCoords)
          }
        }

        // Select tile layer based on theme
        let tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        
        switch (mapTheme) {
          case "dark":
            tileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            break
          case "satellite":
            tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            break
          case "topo":
            tileUrl = "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            break
          case "light":
            tileUrl = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            break
          case "standard":
          default:
            tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            break
        }

        L.tileLayer(tileUrl, {
          maxZoom: 19,
        }).addTo(map)

        if (markers.length > 0) {
          // Create marker cluster group if clustering is enabled
          const markerGroup = enableClustering && L.markerClusterGroup 
            ? L.markerClusterGroup({
                showCoverageOnHover: false,
                zoomToBoundsOnClick: true,
                spiderfyOnMaxZoom: true,
                removeOutsideVisibleBounds: true,
                iconCreateFunction: function(cluster) {
                  const count = cluster.getChildCount()
                  let size = 'small'
                  if (count > 10) size = 'medium'
                  if (count > 50) size = 'large'
                  
                  return L.divIcon({
                    html: `<div style="
                      background: ${markerColor};
                      color: white;
                      border-radius: 50%;
                      width: 40px;
                      height: 40px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-family: 'Inter', sans-serif;
                      font-weight: 600;
                      font-size: 14px;
                      border: 3px solid white;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    ">${count}</div>`,
                    className: 'custom-cluster-icon',
                    iconSize: L.point(40, 40)
                  })
                }
              })
            : null
          
          for (const markerData of markers) {
            const { coordinates, name, address } = markerData
            
            // Parse coordinates from "lat, lng" format
            const parts = coordinates.split(',').map(s => s.trim())
            if (parts.length !== 2) continue // Skip invalid format
            
            const latitude = parseFloat(parts[0])
            const longitude = parseFloat(parts[1])
            
            // Skip if parsing failed
            if (isNaN(latitude) || isNaN(longitude)) continue
            
            let marker
            
            if (useCustomPin && customPinImage.src) {
              // Create custom icon
              const customIcon = L.icon({
                iconUrl: customPinImage.src,
                iconSize: [customPinSize, customPinSize],
                iconAnchor: [customPinSize / 2, customPinSize],
                popupAnchor: [0, -customPinSize],
              })
              
              marker = L.marker([latitude, longitude], {
                icon: customIcon,
              })
            } else {
              // Use default circle marker
              marker = L.circleMarker([latitude, longitude], {
                radius: 10,
                color: markerColor,
                fillColor: markerColor,
                fillOpacity: 0.85,
                weight: 2,
              })
              
              // Add hover effect only for circle markers
              marker.on('mouseover', function() {
                this.setStyle({ radius: 12, fillOpacity: 1 })
              })
              marker.on('mouseout', function() {
                this.setStyle({ radius: 10, fillOpacity: 0.85 })
              })
            }
            
            // Create custom popup with styled content
            const popupContent = `
              <div style="
                padding: 12px 16px;
                background: ${popoverBackground};
                color: ${popoverTextColor};
                border-radius: 8px;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                font-weight: 500;
                line-height: 1.4;
                min-width: 120px;
              ">
                <div style="font-weight: 600; margin-bottom: 4px;">${name}</div>
                <div style="font-weight: 400; opacity: 0.8;">${address}</div>
              </div>
            `
            
            marker.bindPopup(popupContent, {
              closeButton: true,
              className: 'custom-popup',
              maxWidth: 300,
              autoPan: true,
            })
            
            // Store reference to first marker
            if (!firstMarkerRef.current) {
              firstMarkerRef.current = marker
            }
            
            // Add marker to cluster group or directly to map
            if (markerGroup) {
              markerGroup.addLayer(marker)
            } else {
              marker.addTo(map)
            }
          }
          
          // Add cluster group to map if clustering is enabled
          if (markerGroup) {
            map.addLayer(markerGroup)
          }
          
          if (bounds) map.fitBounds(bounds, { padding: [24, 24], maxZoom: zoom })
          else map.setView([37.77, -122.41], zoom) // Center on SF by default
        }
        
        // Open popup if showPopup is enabled and there's exactly 1 marker
        if (showPopup && markers.length === 1 && firstMarkerRef.current) {
          setTimeout(() => {
            if (firstMarkerRef.current) {
              firstMarkerRef.current.openPopup()
            }
          }, 100)
        }
        
        // Add custom CSS for popup styling
        const styleId = 'leaflet-custom-popup-style'
        if (!document.getElementById(styleId)) {
          const style = document.createElement('style')
          style.id = styleId
          style.textContent = `
            .custom-popup .leaflet-popup-content-wrapper {
              background: transparent;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              padding: 0;
              border-radius: 8px;
            }
            .custom-popup .leaflet-popup-content {
              margin: 0;
              line-height: 1;
            }
            .custom-popup .leaflet-popup-tip {
              background: ${popoverBackground};
            }
            .custom-cluster-icon {
              background: transparent !important;
              border: none !important;
            }
          `
          document.head.appendChild(style)
        }
      })
    })

    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove()
        leafletRef.current = null
      }
      firstMarkerRef.current = null
    }
  }, [markers, zoom, useCustomPin, customPinImage, customPinSize, markerColor, popoverBackground, popoverTextColor, mapTheme, enableClustering, showPopup])

  if (RenderTarget.current() === RenderTarget.thumbnail)
    return <div style={{ width: "100%", height: "100%", background: "#eee", borderRadius, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320, minWidth: 480 }}>Map preview</div>

  return (
    <div
      ref={mapRef}
      style={{
        width: style?.width || "100%",
        height: style?.height || "100%",
        borderRadius,
        overflow: "hidden",
        ...style,
      }}
      aria-label="Map with multiple locations"
      role="region"
    />
  )
}

addPropertyControls(MultiLocationMap, {
  markers: {
    type: ControlType.Array,
    title: "Markers",
    description: "Add locations to display on the map. Use 'Lat, Lng' format (e.g., 59.1997, 17.6172)",
    control: {
      type: ControlType.Object,
      controls: {
        name: { 
          type: ControlType.String, 
          title: "Name", 
          defaultValue: "Property Name",
          description: "Property designation or name"
        },
        address: { 
          type: ControlType.String, 
          title: "Address", 
          defaultValue: "Street Address",
          description: "Street address or location"
        },
        coordinates: { 
          type: ControlType.String, 
          title: "Lat, Lng", 
          defaultValue: "37.77, -122.41",
          placeholder: "59.1997, 17.6172",
          description: "Copy coordinates directly from Google Maps"
        },
      },
    },
    defaultValue: [
      { coordinates: "37.77, -122.41", name: "San Francisco Property", address: "Market Street" },
      { coordinates: "34.05, -118.25", name: "Los Angeles Property", address: "Hollywood Blvd" },
      { coordinates: "40.7128, -74.006", name: "New York Property", address: "Broadway" },
    ],
  },
  zoom: {
    type: ControlType.Number,
    title: "Zoom Level",
    defaultValue: 4,
    min: 1,
    max: 18,
    step: 1,
    description: "Initial zoom level (1 = world view, 18 = street level)"
  },
  mapTheme: {
    type: ControlType.Enum,
    title: "Map Theme",
    options: ["standard", "dark", "satellite", "topo", "light"],
    optionTitles: ["Standard", "Dark", "Satellite", "Topographic", "Light"],
    defaultValue: "standard",
  },
  borderRadius: {
    type: ControlType.Number,
    title: "Border Radius",
    defaultValue: 8,
    min: 0,
    max: 50,
    step: 1,
  },
  enableClustering: {
    type: ControlType.Boolean,
    title: "Cluster Pins",
    defaultValue: true,
    enabledTitle: "On",
    disabledTitle: "Off",
    description: "Group nearby markers into clusters with count badges"
  },
  useCustomPin: {
    type: ControlType.Boolean,
    title: "Custom Pin",
    defaultValue: false,
    enabledTitle: "Custom",
    disabledTitle: "Default",
  },
  customPinImage: {
    type: ControlType.ResponsiveImage,
    title: "Pin Image",
    hidden: ({ useCustomPin }) => !useCustomPin,
  },
  customPinSize: {
    type: ControlType.Number,
    title: "Pin Size",
    defaultValue: 40,
    min: 20,
    max: 100,
    step: 1,
    hidden: ({ useCustomPin }) => !useCustomPin,
  },
  markerColor: {
    type: ControlType.Color,
    title: "Pin Color",
    defaultValue: "#1A6DFF",
    hidden: ({ useCustomPin }) => useCustomPin,
  },
  showPopup: {
    type: ControlType.Boolean,
    title: "Auto-Open Popup",
    defaultValue: false,
    enabledTitle: "Show",
    disabledTitle: "Hide",
    description: "Automatically open popup on load (only works with exactly 1 marker)",
    hidden: ({ markers }) => markers.length !== 1,
  },
  popoverBackground: {
    type: ControlType.Color,
    title: "Popup Background",
    defaultValue: "#FFFFFF",
  },
  popoverTextColor: {
    type: ControlType.Color,
    title: "Popup Text Color",
    defaultValue: "#000000",
  },
})
