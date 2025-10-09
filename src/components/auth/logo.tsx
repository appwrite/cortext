import { Brain } from "lucide-react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", showText = true, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl"
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Brain className={`${sizeClasses[size]} text-primary`} />
      {showText && (
        <span className={`font-bold ${textSizeClasses[size]} text-foreground`}>
          Cortext
        </span>
      )}
    </div>
  );
}
