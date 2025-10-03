import * as React from "react"

import { cn } from "@/lib/utils"
import { getDirAttribute } from "@/lib/rtl-utils"

export interface InputProps extends React.ComponentProps<"input"> {
  /**
   * The text content to analyze for RTL direction
   * If provided, the input will automatically set the correct text direction
   */
  value?: string
  /**
   * Optional language code to use as fallback for direction detection
   */
  language?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, value, language, ...props }, ref) => {
    const dir = getDirAttribute(value || '', language)
    
    return (
      <input
        type={type}
        dir={dir}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
