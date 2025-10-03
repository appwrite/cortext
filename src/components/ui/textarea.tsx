import * as React from "react"

import { cn } from "@/lib/utils"
import { getDirAttribute } from "@/lib/rtl-utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * The text content to analyze for RTL direction
   * If provided, the textarea will automatically set the correct text direction
   */
  value?: string
  /**
   * Optional language code to use as fallback for direction detection
   */
  language?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, value, language, ...props }, ref) => {
    const dir = getDirAttribute(value || '', language)
    
    return (
      <textarea
        value={value}
        dir={dir}
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
