import { useState, useCallback, useEffect, useMemo } from "react"
import { motion, AnimatePresence, PanInfo } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Bookmark Icon Components (replacing phosphor-icons)
const BookmarkFilled = ({ size = 20, color = "#EF4444" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill={color}>
    <path d="M184 32H72A16 16 0 0 0 56 48v176a8 8 0 0 0 12.24 6.78l51.76-31.05 51.76 31.05A8 8 0 0 0 184 224V48a16 16 0 0 0-16-16z" />
  </svg>
)

const BookmarkOutline = ({ size = 20, color = "#666666" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" stroke={color} strokeWidth="16">
    <path d="M184 32H72a16 16 0 0 0-16 16v176a8 8 0 0 0 12.24 6.78l51.76-31.05 51.76 31.05A8 8 0 0 0 184 224V48a16 16 0 0 0-16-16z" />
  </svg>
)

// Types
interface Job {
  id: string
  title: string
  rate: string
  company: string
  role: string
  link?: string
}

interface CompanyData {
  name: string
  color: string
  logo: React.ReactNode
  jobs: Job[]
}

interface JobInput {
  title: string
  rate: string
  role: string
  link?: string
}

interface StackInput {
  companyName: string
  companyColor: string
  logoType: "anthropic" | "perplexity" | "google" | "custom"
  customLogo?: { src: string; srcSet?: string; alt?: string }
  jobs: JobInput[]
}

interface JobCardProps {
  job: Job
  companyName: string
  companyColor: string
  logo: React.ReactNode
  index: number
  totalCards: number
  isFront: boolean
  isBookmarked: boolean
  onToggleBookmark: () => void
  onCycle: () => void
  theme: "light" | "dark"
  stackIndex: number
  peekOffset: number
  borderRadius: number
  padding: number
  cardWidth: string | number
  cardHeight: string | number
  link?: string
}

interface CardStackProps {
  company: CompanyData
  theme: "light" | "dark"
  stackIndex: number
  peekOffset: number
  borderRadius: number
  padding: number
  cardWidth: string | number
  cardHeight: string | number
}

// Theme colors
const themes = {
  light: {
    outerBg: "#CADBDD",
    cardBg: "#F7F7EF",
    text: "#1C1C1C",
    textSecondary: "#666666",
    border: "#E0E0E0",
    divider: "#E0E0E0",
  },
  dark: {
    outerBg: "#0d0d0c",
    cardBg: "#1e1e1c",
    text: "#F7F7EF",
    textSecondary: "#999999",
    border: "#333333",
    divider: "#333333",
  },
}

// Anthropic Logo Component
const AnthropicLogo = ({ color }: { color: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill={color} />
    <path d="M8 12h8M12 8v8" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

// Perplexity Logo Component
const PerplexityLogo = ({ theme }: { theme: "light" | "dark" }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect
      x="2"
      y="2"
      width="20"
      height="20"
      rx="4"
      fill={theme === "dark" ? "white" : "#1C1C1C"}
    />
    <path
      d="M8 8l4 4-4 4M12 8h4"
      stroke={theme === "dark" ? "#1C1C1C" : "white"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

// Google/Gemini Logo Component
const GeminiLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="geminiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4285F4" />
        <stop offset="50%" stopColor="#34A853" />
        <stop offset="100%" stopColor="#EA4335" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#geminiGradient)" />
    <path
      d="M12 6v6l4 2"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

// Custom Logo Placeholder
const CustomLogo = ({ color }: { color: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="4" fill={color} />
    <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">C</text>
  </svg>
)

// Get logo component based on type
const getLogoComponent = (logoType: string, color: string, theme: "light" | "dark", customLogo?: { src: string; srcSet?: string; alt?: string }) => {
  if (customLogo && customLogo.src) {
    return (
      <img 
        src={customLogo.src} 
        srcSet={customLogo.srcSet}
        alt={customLogo.alt || "Company logo"}
        style={{
          width: "24px",
          height: "24px",
          objectFit: "contain",
          borderRadius: "4px",
        }}
      />
    )
  }
  
  switch (logoType) {
    case "anthropic":
      return <AnthropicLogo color={color} />
    case "perplexity":
      return <PerplexityLogo theme={theme} />
    case "google":
      return <GeminiLogo />
    default:
      return <CustomLogo color={color} />
  }
}

// Dot Indicator Component
const DotIndicator = ({
  total,
  active,
  onClick,
  theme,
}: {
  total: number
  active: number
  onClick: (index: number) => void
  theme: "light" | "dark"
}) => {
  const colors = themes[theme]

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        alignItems: "center",
      }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          onClick={() => onClick(i)}
          style={{
            width: "6px",
            borderRadius: "3px",
            backgroundColor:
              i === active ? colors.text : `${colors.text}40`,
            cursor: "pointer",
          }}
          animate={{
            height: i === active ? "24px" : "6px",
            opacity: i === active ? 1 : 0.4,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          whileHover={{ opacity: 0.8 }}
        />
      ))}
    </div>
  )
}

// Individual Job Card Component
const JobCard = ({
  job,
  companyName,
  companyColor,
  logo,
  index,
  totalCards,
  isFront,
  isBookmarked,
  onToggleBookmark,
  onCycle,
  theme,
  stackIndex,
  peekOffset,
  borderRadius,
  padding,
  cardWidth,
  cardHeight,
  link,
}: JobCardProps) => {
  const colors = themes[theme]
  const [isHovered, setIsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    setIsDragging(false)
    const threshold = 60
    const velocity = Math.abs(info.velocity.y)
    const offset = Math.abs(info.offset.y)

    if (offset > threshold || velocity > 500) {
      onCycle()
    }
  }

  const getCardStyle = () => {
    const baseOffset = index * peekOffset
    const peekOffsetValue = isFront ? 0 : baseOffset

    return {
      zIndex: totalCards - index,
      y: peekOffsetValue,
      scale: isFront ? 1 : 1 - index * 0.03,
      opacity: isFront ? 1 : 0.7 - index * 0.15,
    }
  }

  const cardStyle = getCardStyle()
  
  const bottomOffset = (totalCards - 1) * peekOffset

  return (
    <motion.div
      drag={isFront ? "y" : false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      onHoverStart={() => isFront && setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 50 }}
      animate={{
        y: cardStyle.y + (isHovered && isFront ? -4 : 0),
        scale: cardStyle.scale,
        opacity: cardStyle.opacity,
        zIndex: cardStyle.zIndex,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: bottomOffset,
        backgroundColor: colors.cardBg,
        borderRadius: `${borderRadius}px`,
        padding: `${padding}px`,
        display: "flex",
        flexDirection: "column",
        boxShadow:
          isHovered && isFront
            ? theme === "dark"
              ? "0 20px 40px rgba(0,0,0,0.4)"
              : "0 20px 40px rgba(0,0,0,0.15)"
            : theme === "dark"
            ? "0 4px 20px rgba(0,0,0,0.3)"
            : "0 4px 20px rgba(0,0,0,0.08)",
        cursor: isFront ? "grab" : "default",
        border: `1px solid ${colors.border}`,
        minHeight: "180px",
      }}
    >
      {/* Top Row: Rate + Bookmark */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <span
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: companyColor,
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {job.rate}
        </span>
        <motion.button
          onClick={(e) => {
            e.stopPropagation()
            onToggleBookmark()
          }}
          whileTap={{ scale: 0.9 }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isBookmarked ? (
            <BookmarkFilled size={20} color="#EF4444" />
          ) : (
            <BookmarkOutline size={20} color={colors.textSecondary} />
          )}
        </motion.button>
      </div>

      {/* Middle: Title + Dot Indicator */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flex: 1,
          gap: "16px",
        }}
      >
        <h3
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: colors.text,
            margin: 0,
            lineHeight: 1.3,
            fontFamily: "system-ui, -apple-system, sans-serif",
            flex: 1,
          }}
        >
          {job.title}
        </h3>
        <DotIndicator
          total={totalCards}
          active={index}
          onClick={(i) => i !== index && onCycle()}
          theme={theme}
        />
      </div>

      {/* Divider */}
      <div
        style={{
          height: "1px",
          backgroundColor: colors.divider,
          margin: "16px 0",
        }}
      />

      {/* Bottom Row: Logo + Company + View Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          {logo}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: colors.text,
                fontFamily: "system-ui, -apple-system, sans-serif",
              }}
            >
              {companyName}
            </span>
            <span
              style={{
                fontSize: "12px",
                color: colors.textSecondary,
                fontFamily: "system-ui, -apple-system, sans-serif",
              }}
            >
              {job.role}
            </span>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation()
            if (link) {
              window.open(link, "_blank", "noopener,noreferrer")
            }
          }}
          style={{
            padding: "8px 16px",
            borderRadius: "20px",
            border: `1px solid ${colors.border}`,
            backgroundColor: "transparent",
            color: colors.text,
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          View
        </motion.button>
      </div>
    </motion.div>
  )
}

// Card Stack Component
const CardStack = ({ 
  company, 
  theme, 
  stackIndex, 
  peekOffset,
  borderRadius,
  padding,
  cardWidth,
  cardHeight
}: CardStackProps) => {
  const [cardOrder, setCardOrder] = useState(() =>
    company.jobs.map((_, i) => i)
  )
  const [bookmarkedCards, setBookmarkedCards] = useState<Set<string>>(
    new Set()
  )

  const cycleCards = useCallback(() => {
    setCardOrder((prev) => {
      const newOrder = [...prev]
      const first = newOrder.shift()!
      newOrder.push(first)
      return newOrder
    })
  }, [])

  const toggleBookmark = useCallback((jobId: string) => {
    setBookmarkedCards((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(jobId)) {
        newSet.delete(jobId)
      } else {
        newSet.add(jobId)
      }
      return newSet
    })
  }, [])

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: typeof cardHeight === "number" ? cardHeight + 100 : "100%",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: cardWidth,
          height: cardHeight,
        }}
      >
        <AnimatePresence mode="popLayout">
          {cardOrder.map((jobIndex, stackPosition) => {
            const job = company.jobs[jobIndex]
            const isFront = stackPosition === 0

            return (
              <JobCard
                key={job.id}
                job={job}
                companyName={company.name}
                companyColor={company.color}
                logo={company.logo}
                index={stackPosition}
                totalCards={company.jobs.length}
                isFront={isFront}
                isBookmarked={bookmarkedCards.has(job.id)}
                onToggleBookmark={() => toggleBookmark(job.id)}
                onCycle={cycleCards}
                theme={theme}
                stackIndex={stackIndex}
                peekOffset={peekOffset}
                borderRadius={borderRadius}
                padding={padding}
                cardWidth={cardWidth}
                cardHeight={cardHeight}
                link={job.link}
              />
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Default job data
const defaultStacks: StackInput[] = [
  {
    companyName: "Anthropic",
    companyColor: "#d97757",
    logoType: "anthropic",
    jobs: [
      { title: "Prompt Engineer", rate: "$120/hr", role: "Contract", link: "" },
      { title: "AI Safety Researcher", rate: "$145/hr", role: "Full-time", link: "" },
      { title: "Interpretability Lead", rate: "$155/hr", role: "Lead", link: "" },
    ],
  },
  {
    companyName: "Perplexity",
    companyColor: "#d97757",
    logoType: "perplexity",
    jobs: [
      { title: "Generative AI Lead", rate: "$160/hr", role: "Lead", link: "" },
      { title: "ML Engineer", rate: "$135/hr", role: "Full-time", link: "" },
      { title: "Search AI Researcher", rate: "$140/hr", role: "Research", link: "" },
    ],
  },
  {
    companyName: "Google",
    companyColor: "#4285F4",
    logoType: "google",
    jobs: [
      { title: "LLM Platform Engineer", rate: "$130-160/hr", role: "Senior", link: "" },
      { title: "AI Research Scientist", rate: "$150/hr", role: "Research", link: "" },
      { title: "Multimodal AI Lead", rate: "$165/hr", role: "Lead", link: "" },
    ],
  },
]

// Main Component
/**
 * AI Job Cards Component
 * Stacked job cards with drag interactions and animations
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function AIJobCards(props: { 
  theme?: "light" | "dark"
  cardWidth?: string | number
  cardHeight?: number
  cardGap?: number
  peekOffset?: number
  borderRadius?: number
  padding?: number
  stacks?: StackInput[]
  hideBackground?: boolean
  outerBorderRadius?: number
  columnsMobile?: number
  columnsTablet?: number
  columnsDesktop?: number
  rowGap?: number
  columnGap?: number
  rowGapTablet?: number
  columnGapTablet?: number
  rowGapMobile?: number
  columnGapMobile?: number
  enableSearch?: boolean
  searchPlaceholder?: string
  searchGap?: number
  stackGap?: number
  style?: React.CSSProperties
}) {
  const { 
    theme = "light", 
    cardWidth = "100%",
    cardHeight = 234,
    cardGap = 16,
    peekOffset = 20,
    borderRadius = 32,
    padding = 24,
    stacks = defaultStacks,
    hideBackground = false,
    outerBorderRadius = 24,
    columnsMobile = 1,
    columnsTablet = 2,
    columnsDesktop = 3,
    rowGap,
    columnGap,
    rowGapTablet,
    columnGapTablet,
    rowGapMobile,
    columnGapMobile,
    enableSearch = false,
    searchPlaceholder = "Search jobs, companies, or roles...",
    searchGap = 24,
    stackGap = 0,
    style 
  } = props

  const [searchQuery, setSearchQuery] = useState("")

  const companies: CompanyData[] = useMemo(
    () =>
      stacks.map((stack, idx) => ({
        name: stack.companyName,
        color: stack.companyColor,
        logo: getLogoComponent(stack.logoType, stack.companyColor, theme, stack.customLogo),
        jobs: stack.jobs.slice(0, 5).map((job, jobIdx) => ({
          id: `stack${idx}-job${jobIdx}`,
          title: job.title,
          rate: job.rate,
          company: stack.companyName,
          role: job.role,
          link: job.link,
        })),
      })),
    [stacks, theme]
  )

  // Filter companies based on search query
  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companies

    const query = searchQuery.toLowerCase()
    return companies.filter((company) => {
      // Check if company name matches
      if (company.name.toLowerCase().includes(query)) return true
      
      // Check if any job in the stack matches
      return company.jobs.some(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          job.role.toLowerCase().includes(query) ||
          job.rate.toLowerCase().includes(query)
      )
    })
  }, [companies, searchQuery])

  const colors = themes[theme]
  const actualRowGap = rowGap ?? cardGap
  const actualColumnGap = columnGap ?? cardGap
  const actualRowGapTablet = rowGapTablet ?? actualRowGap
  const actualColumnGapTablet = columnGapTablet ?? actualColumnGap
  const actualRowGapMobile = rowGapMobile ?? actualRowGapTablet
  const actualColumnGapMobile = columnGapMobile ?? actualColumnGapTablet

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: typeof cardHeight === "number" ? cardHeight + (peekOffset * 2) + 80 : "400px",
        backgroundColor: hideBackground ? "transparent" : colors.outerBg,
        padding: "40px 20px",
        borderRadius: `${outerBorderRadius}px`,
        fontFamily: "system-ui, -apple-system, sans-serif",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        overflow: "auto",
        gap: `${searchGap}px`,
        ...style,
      }}
    >
      {/* Search Input */}
      {enableSearch && (
        <div
          style={{
            width: "100%",
            maxWidth: "600px",
            position: "relative",
          }}
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            style={{
              width: "100%",
              padding: "12px 16px 12px 44px",
              fontSize: "15px",
              fontFamily: "system-ui, -apple-system, sans-serif",
              backgroundColor: colors.cardBg,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: "12px",
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.2s ease",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = colors.text
            }}
            onBlur={(e) => {
              e.target.style.borderColor = colors.border
            }}
          />
          {/* Search Icon */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={colors.textSecondary}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          {/* Clear Button */}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: colors.textSecondary,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Results Count */}
      {enableSearch && searchQuery && (
        <div
          style={{
            fontSize: "14px",
            color: colors.textSecondary,
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {filteredCompanies.length === 0
            ? "No jobs found"
            : `${filteredCompanies.length} ${filteredCompanies.length === 1 ? "stack" : "stacks"} found`}
        </div>
      )}

      {/* Card Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columnsDesktop}, minmax(280px, 1fr))`,
          gap: `${actualRowGap}px ${actualColumnGap}px`,
          width: "100%",
          maxWidth: "100%",
          alignItems: "start",
          justifyContent: "center",
          justifyItems: "center",
        }}
        className="job-cards-grid"
      >
        {filteredCompanies.map((company, index) => (
          <CardStack
            key={`${company.name}-${index}`}
            company={company}
            theme={theme}
            stackIndex={index}
            peekOffset={peekOffset}
            borderRadius={borderRadius}
            padding={padding}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
          />
        ))}
      </div>
      <style>{`
        @media (max-width: 640px) {
          .job-cards-grid {
            grid-template-columns: repeat(${columnsMobile}, 1fr) !important;
            gap: ${actualRowGapMobile}px ${actualColumnGapMobile}px !important;
          }
        }
        @media (min-width: 641px) and (max-width: 1024px) {
          .job-cards-grid {
            grid-template-columns: repeat(${columnsTablet}, 1fr) !important;
            gap: ${actualRowGapTablet}px ${actualColumnGapTablet}px !important;
          }
        }
      `}</style>
    </div>
  )
}

addPropertyControls(AIJobCards, {
  theme: {
    type: ControlType.Enum,
    title: "Theme",
    options: ["light", "dark"],
    optionTitles: ["Light", "Dark"],
    defaultValue: "light",
  },
  enableSearch: {
    type: ControlType.Boolean,
    title: "Enable Search",
    defaultValue: false,
    enabledTitle: "Yes",
    disabledTitle: "No",
  },
  searchPlaceholder: {
    type: ControlType.String,
    title: "Search Placeholder",
    defaultValue: "Search jobs, companies, or roles...",
    hidden: ({ enableSearch }) => !enableSearch,
  },
  searchGap: {
    type: ControlType.Number,
    title: "Search Gap",
    defaultValue: 24,
    min: 0,
    max: 100,
    step: 1,
    unit: "px",
    hidden: ({ enableSearch }) => !enableSearch,
  },
  stackGap: {
    type: ControlType.Number,
    title: "Stack Gap",
    defaultValue: 0,
    min: 0,
    max: 50,
    step: 1,
    unit: "px",
  },
  stacks: {
    type: ControlType.Array,
    title: "Card Stacks",
    defaultValue: defaultStacks,
    maxCount: 20,
    control: {
      type: ControlType.Object,
      title: "Stack",
      controls: {
        companyName: { type: ControlType.String, title: "Company Name", defaultValue: "Company" },
        companyColor: { type: ControlType.Color, title: "Brand Color", defaultValue: "#d97757" },
        logoType: { 
          type: ControlType.Enum, 
          title: "Logo Style", 
          options: ["anthropic", "perplexity", "google", "custom"],
          optionTitles: ["Anthropic", "Perplexity", "Google", "Custom"],
          defaultValue: "custom" 
        },
        customLogo: {
          type: ControlType.ResponsiveImage,
          title: "Custom Logo",
          hidden: ({ logoType }) => logoType !== "custom",
        },
        jobs: {
          type: ControlType.Array,
          title: "Jobs",
          defaultValue: [
            { title: "Job Title 1", rate: "$100/hr", role: "Full-time", link: "" },
            { title: "Job Title 2", rate: "$120/hr", role: "Contract", link: "" },
            { title: "Job Title 3", rate: "$140/hr", role: "Lead", link: "" },
          ],
          maxCount: 5,
          control: {
            type: ControlType.Object,
            controls: {
              title: { type: ControlType.String, title: "Job Title", defaultValue: "Job Title" },
              rate: { type: ControlType.String, title: "Rate", defaultValue: "$100/hr" },
              role: { type: ControlType.String, title: "Role Type", defaultValue: "Full-time" },
              link: { type: ControlType.String, title: "View Link (URL)", defaultValue: "", placeholder: "https://example.com/job" },
            }
          }
        }
      }
    }
  },
  columnsDesktop: {
    type: ControlType.Number,
    title: "Desktop Columns",
    defaultValue: 3,
    min: 1,
    max: 10,
    step: 1,
  },
  columnsTablet: {
    type: ControlType.Number,
    title: "Tablet Columns",
    defaultValue: 2,
    min: 1,
    max: 10,
    step: 1,
  },
  columnsMobile: {
    type: ControlType.Number,
    title: "Mobile Columns",
    defaultValue: 1,
    min: 1,
    max: 10,
    step: 1,
  },
  cardWidth: {
    type: ControlType.String,
    title: "Card Width",
    defaultValue: "100%",
    placeholder: "e.g., 100%, 240px",
  },
  cardHeight: {
    type: ControlType.Number,
    title: "Card Height",
    defaultValue: 234,
    min: 150,
    max: 500,
    step: 1,
    unit: "px",
  },
  rowGap: {
    type: ControlType.Number,
    title: "Row Gap (Desktop)",
    defaultValue: 0,
    min: 0,
    max: 100,
    step: 1,
    unit: "px",
  },
  columnGap: {
    type: ControlType.Number,
    title: "Column Gap (Desktop)",
    defaultValue: 0,
    min: 0,
    max: 100,
    step: 1,
    unit: "px",
  },
  rowGapTablet: {
    type: ControlType.Number,
    title: "Row Gap (Tablet)",
    defaultValue: 0,
    min: 0,
    max: 100,
    step: 1,
    unit: "px",
  },
  columnGapTablet: {
    type: ControlType.Number,
    title: "Column Gap (Tablet)",
    defaultValue: 0,
    min: 0,
    max: 100,
    step: 1,
    unit: "px",
  },
  rowGapMobile: {
    type: ControlType.Number,
    title: "Row Gap (Mobile)",
    defaultValue: 0,
    min: 0,
    max: 100,
    step: 1,
    unit: "px",
  },
  columnGapMobile: {
    type: ControlType.Number,
    title: "Column Gap (Mobile)",
    defaultValue: 0,
    min: 0,
    max: 100,
    step: 1,
    unit: "px",
  },
  peekOffset: {
    type: ControlType.Number,
    title: "Card Peek Offset",
    defaultValue: 20,
    min: 8,
    max: 60,
    step: 1,
    unit: "px",
  },
  borderRadius: {
    type: ControlType.Number,
    title: "Border Radius",
    defaultValue: 32,
    min: 0,
    max: 60,
    step: 1,
    unit: "px",
  },
  padding: {
    type: ControlType.Number,
    title: "Card Padding",
    defaultValue: 24,
    min: 8,
    max: 48,
    step: 1,
    unit: "px",
  },
  hideBackground: {
    type: ControlType.Boolean,
    title: "Hide Background",
    defaultValue: false,
    enabledTitle: "Yes",
    disabledTitle: "No",
  },
  outerBorderRadius: {
    type: ControlType.Number,
    title: "Outer Corner Radius",
    defaultValue: 24,
    min: 0,
    max: 100,
    step: 1,
    unit: "px",
  },
})