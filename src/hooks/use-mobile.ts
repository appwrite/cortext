import * as React from "react"

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(() => {
    // Initialize with the actual value to avoid re-renders
    if (typeof window === 'undefined') return false
    return window.innerWidth < 800
  })

  React.useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 800)
    }

    // Add event listener
    window.addEventListener("resize", checkIsMobile)

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkIsMobile)
    }
  }, [])

  return isMobile
} 