import { useEffect, useRef, useState } from 'react';

export type CrepeTheme = 'crepe' | 'crepe-dark' | 'nord' | 'nord-dark' | 'frame' | 'frame-dark' | 'cortext' | 'cortext-dark';

interface CrepeEditorProps {
  defaultValue?: string;
  className?: string;
  onChange?: (markdown: string) => void;
  theme?: CrepeTheme;
}

export default function CrepeEditor({ 
  defaultValue = '', 
  className = '',
  onChange,
  theme = 'crepe'
}: CrepeEditorProps) {
  console.log('CrepeEditor component rendered');
  
  const editorRef = useRef<HTMLDivElement>(null);
  const crepeInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Crepe only once when component mounts
  useEffect(() => {
    console.log('useEffect triggered - initializing Crepe');
    
    let isMounted = true;
    
    const initializeCrepe = async () => {
      try {
        console.log('Starting Crepe initialization...');
        
        // Wait for ref to be available
        let attempts = 0;
        while (!editorRef.current && attempts < 10) {
          console.log(`Waiting for ref... attempt ${attempts + 1}`);
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!editorRef.current || !isMounted) {
          throw new Error('Editor ref is still null after waiting or component unmounted');
        }
        
        console.log('Editor ref is now available:', editorRef.current);
        
        // Test dynamic import
        console.log('Loading Crepe module...');
        const crepeModule = await import('@milkdown/crepe');
        console.log('Crepe module loaded:', crepeModule);
        
        const { Crepe, CrepeFeature } = crepeModule;
        console.log('Crepe class:', Crepe);
        console.log('CrepeFeature enum:', CrepeFeature);
        
        // Function to add CSS that prevents layout shifts
        const addLayoutShiftPreventionCSS = () => {
          // Check if we already added the CSS
          if (document.getElementById('crepe-layout-shift-fix')) {
            return;
          }
          
          const style = document.createElement('style');
          style.id = 'crepe-layout-shift-fix';
          style.textContent = `
            /* Prevent layout shifts by ensuring stable positioning during selection */
            .milkdown .ProseMirror {
              position: relative !important;
              /* Keep original padding but ensure it doesn't shift */
              padding: 60px 120px !important;
            }
            
            /* Ensure block handles are positioned absolutely and don't affect layout */
            .milkdown .milkdown-block-handle {
              position: absolute !important;
              /* Remove any transforms that might cause shifts */
              transform: none !important;
              /* Ensure handles don't push content */
              z-index: 10 !important;
              /* Fix the problematic transition that causes layout shifts */
              transition: opacity 0.2s ease, visibility 0.2s ease !important;
              /* Prevent any layout-affecting properties from being transitioned */
              width: auto !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            /* Ensure block handles don't affect layout when showing/hiding */
            .milkdown .milkdown-block-handle[data-show='false'] {
              opacity: 0 !important;
              visibility: hidden !important;
              pointer-events: none !important;
            }
            
            .milkdown .milkdown-block-handle[data-show='true'] {
              opacity: 1 !important;
              visibility: visible !important;
              pointer-events: auto !important;
            }
            
            /* Prevent content from shifting when selection changes */
            .milkdown .ProseMirror * {
              box-sizing: border-box;
            }
            
            /* Ensure selected nodes don't cause layout shifts */
            .milkdown .ProseMirror .ProseMirror-selectednode {
              position: relative;
              z-index: 1;
              /* Prevent margin/padding changes during selection */
              margin: 0 !important;
              padding: 0 !important;
            }
            
            
            /* Ensure the editor container maintains stable positioning */
            .crepe-editor-container .milkdown {
              position: relative;
              overflow: visible;
            }
            
            /* Prevent any layout shifts from selection highlighting */
            .milkdown .ProseMirror *::selection {
              background: var(--crepe-color-selected) !important;
            }
            
            .milkdown .ProseMirror *::-moz-selection {
              background: var(--crepe-color-selected) !important;
            }
            
            /* Ensure slash menu doesn't cause layout shifts */
            .milkdown .milkdown-slash-menu {
              position: absolute !important;
              z-index: 20 !important;
              /* Prevent any layout-affecting transitions */
              transition: none !important;
            }
            
            .milkdown .milkdown-slash-menu[data-show='false'] {
              display: none !important;
            }
            
            .milkdown .milkdown-slash-menu[data-show='true'] {
              display: block !important;
            }
            
            /* Ensure toolbar doesn't cause layout shifts */
            .milkdown .milkdown-toolbar {
              position: absolute !important;
              z-index: 15 !important;
              /* Prevent any layout-affecting transitions */
              transition: none !important;
            }
            
            .milkdown .milkdown-toolbar[data-show='false'] {
              display: none !important;
            }
            
            .milkdown .milkdown-toolbar[data-show='true'] {
              display: flex !important;
            }
            
            /* Style links with soft blue background */
            .milkdown .ProseMirror a {
              background-color: rgba(59, 130, 246, 0.1) !important; /* blue-500 with 10% opacity */
              padding: 0.125rem 0.25rem !important;
              border-radius: 0.25rem !important;
              text-decoration: none !important;
              transition: background-color 0.2s ease !important;
            }
            
            .milkdown .ProseMirror a:hover {
              background-color: rgba(59, 130, 246, 0.2) !important; /* blue-500 with 20% opacity on hover */
            }
          `;
          document.head.appendChild(style);
          console.log('Layout shift prevention CSS added');
        };
        
        // Load CSS for the selected theme
        const loadCSS = () => {
          return new Promise<void>((resolve) => {
            console.log(`Loading Crepe CSS for theme: ${theme}`);
            
            const loadThemeCSS = () => {
              // Remove existing theme CSS (but keep common CSS)
              const existingThemeCSS = document.querySelectorAll('link[href*="/crepe-themes/"]');
              existingThemeCSS.forEach(link => {
                const linkElement = link as HTMLLinkElement;
                if (!linkElement.href.includes('common.css')) {
                  link.remove();
                }
              });
              
              // Load the selected theme CSS
              const themeLink = document.createElement('link');
              themeLink.rel = 'stylesheet';
              themeLink.href = `/crepe-themes/${theme}.css`;
              themeLink.onload = () => {
                console.log(`${theme} theme CSS loaded successfully`);
                console.log('Theme link element:', themeLink);
                console.log('Theme link href:', themeLink.href);
                
                // Add custom CSS to prevent layout shifts
                addLayoutShiftPreventionCSS();
                resolve();
              };
              themeLink.onerror = () => {
                console.warn(`Failed to load ${theme} theme CSS, falling back to crepe theme...`);
                // Fallback to crepe theme
                const fallbackLink = document.createElement('link');
                fallbackLink.rel = 'stylesheet';
                fallbackLink.href = '/crepe-themes/crepe.css';
                fallbackLink.onload = () => {
                  console.log('Fallback crepe theme CSS loaded');
                  addLayoutShiftPreventionCSS();
                  resolve();
                };
                fallbackLink.onerror = () => {
                  console.warn('Failed to load fallback CSS, continuing without styles...');
                  addLayoutShiftPreventionCSS();
                  resolve();
                };
                document.head.appendChild(fallbackLink);
              };
              document.head.appendChild(themeLink);
            };
            
            // Check if common CSS is already loaded
            const existingCommonCSS = document.querySelector('link[href*="common.css"]');
            console.log('Existing common CSS:', existingCommonCSS);
            
            if (!existingCommonCSS) {
              // Load common styles first
              const commonLink = document.createElement('link');
              commonLink.rel = 'stylesheet';
              commonLink.href = '/crepe-themes/common.css';
              commonLink.onload = () => {
                console.log('Common CSS loaded successfully');
                console.log('Common link element:', commonLink);
                console.log('Common link href:', commonLink.href);
                loadThemeCSS();
              };
              commonLink.onerror = () => {
                console.warn('Failed to load common CSS, continuing without styles...');
                loadThemeCSS();
              };
              document.head.appendChild(commonLink);
            } else {
              loadThemeCSS();
            }
          });
        };

        await loadCSS();
        
        // Wait a bit for CSS to load
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Check if component is still mounted before creating Crepe instance
        if (!isMounted || !editorRef.current) {
          return;
        }
        
        console.log('Creating Crepe instance...');
        crepeInstanceRef.current = new Crepe({
          root: editorRef.current,
          defaultValue,
          features: {
            [CrepeFeature.CodeMirror]: true,
            [CrepeFeature.BlockEdit]: true,
            [CrepeFeature.Toolbar]: true,
          },
        });
        
        // Set up change listener using Crepe's built-in listener
        if (onChange && crepeInstanceRef.current) {
          try {
            crepeInstanceRef.current.on(listener => {
              listener.markdownUpdated((_, markdown, prevMarkdown) => {
                if (markdown !== prevMarkdown && isMounted) {
                  console.log('Editor content changed:', markdown);
                  onChange(markdown);
                }
              });
            });
            console.log('Change listener set up successfully using Crepe built-in listener');
          } catch (error) {
            console.warn('Error setting up change listener:', error);
          }
        }
        
        console.log('Calling crepe.create()...');
        await crepeInstanceRef.current.create();
        console.log('Crepe created successfully!');
        
        if (isMounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing Crepe:', error);
        if (isMounted) {
          setError(error instanceof Error ? error.message : 'Unknown error');
          setIsLoading(false);
        }
      }
    };

    initializeCrepe();
    
    // Cleanup function
    return () => {
      console.log('Cleaning up Crepe instance...');
      isMounted = false;
      if (crepeInstanceRef.current) {
        try {
          crepeInstanceRef.current.destroy?.();
          crepeInstanceRef.current = null;
        } catch (error) {
          console.warn('Error destroying Crepe instance:', error);
        }
      }
      
      // Remove the custom CSS to prevent it from affecting other instances
      const customCSS = document.getElementById('crepe-layout-shift-fix');
      if (customCSS) {
        customCSS.remove();
        console.log('Layout shift prevention CSS removed');
      }
    };
  }, [theme]); // Re-run when theme changes

  return (
    <div className={`crepe-editor-container relative ${className}`}>
      <div 
        ref={editorRef} 
        className="min-h-[400px] border border-gray-200 rounded"
        style={{
          // Prevent layout shifts by ensuring stable positioning
          position: 'relative'
        }}
      />
      
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-blue-600">Loading Crepe Editor...</p>
            <p className="text-blue-400 text-sm mt-2">Check console for details</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 bg-red-50/90 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2 text-red-600">Error Loading Crepe</h3>
            <p className="text-red-500 text-sm">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}