import { useState, useRef, useEffect } from "react";
import { ChevronDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeContext } from "@/contexts/theme-context";

interface PageAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string | React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

interface PageActionsProps {
  className?: string;
}

export function PageActions({ className }: PageActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { effectiveTheme } = useThemeContext();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const actions: PageAction[] = [
    {
      id: 'markdown',
      title: 'View as Markdown',
      subtitle: 'Open this page in Markdown',
      icon: FileText,
      onClick: () => {
        // TODO: Implement markdown view
        console.log('View as Markdown');
        setIsOpen(false);
      }
    },
    {
      id: 'claude',
      title: 'Open in Claude',
      subtitle: 'Ask questions about this page',
      icon: effectiveTheme === 'dark' ? '/icons/claude-icon-dark.svg' : '/icons/claude-icon-light.svg',
      onClick: () => {
        const currentUrl = window.location.href;
        const claudeUrl = `https://claude.ai/new?q=Read%20from%20this%20URL%3A%20${encodeURIComponent(currentUrl)}%20and%20explain%20the%20Cortext%20documentation%20to%20me.%20Help%20me%20understand%20how%20to%20use%20Cortext%27s%20AI-powered%20content%20management%20features.`;
        window.open(claudeUrl, '_blank', 'noopener,noreferrer');
        setIsOpen(false);
      }
    },
    {
      id: 'chatgpt',
      title: 'Open in ChatGPT',
      subtitle: 'Ask questions about this page',
      icon: effectiveTheme === 'dark' ? '/icons/openai-icon-dark.svg' : '/icons/openai-icon-light.svg',
      onClick: () => {
        const currentUrl = window.location.href;
        const chatgptUrl = `https://chatgpt.com/?prompt=Read+from+this+URL%3A+${encodeURIComponent(currentUrl)}+and+explain+the+Cortext+documentation+to+me.+Help+me+understand+how+to+use+Cortext%27s+AI-powered+content+management+features.`;
        window.open(chatgptUrl, '_blank', 'noopener,noreferrer');
        setIsOpen(false);
      }
    }
  ];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 px-3 text-xs font-medium"
      >
        Copy page
        <div className="w-px h-4 bg-border mx-2" />
        <ChevronDown className="w-3 h-3" />
      </Button>

      {isOpen && (
        <>
          {/* Arrow pointing to the button */}
          <div className="absolute right-3 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-border z-50" />
          <div className="absolute right-0 top-full mt-1 w-64 bg-background border rounded-lg shadow-lg z-50 animate-in fade-in-0 zoom-in-95 duration-200 overflow-hidden">
            <div className="p-1">
              {actions.map((action) => {
                return (
                    <button
                      key={action.id}
                      onClick={action.onClick}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-accent rounded-md transition-colors group cursor-pointer"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                        {typeof action.icon === 'string' ? (
                          <img src={action.icon} alt={action.title} className="w-4 h-4" />
                        ) : (
                          <action.icon className="w-4 h-4 text-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-foreground mb-0.5">
                          {action.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {action.subtitle}
                        </div>
                      </div>
                    </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
