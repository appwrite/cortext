import { useEffect, useRef, useState } from 'react';

export type CrepeTheme = 'crepe' | 'crepe-dark' | 'nord' | 'nord-dark' | 'frame' | 'frame-dark' | 'cortext' | 'cortext-dark';

interface CrepeEditorProps {
  defaultValue?: string;
  className?: string;
  onChange?: (markdown: string) => void;
  theme?: CrepeTheme;
  onEditorReady?: (editor: any) => void;
}

export default function CrepeEditor({ 
  defaultValue = '', 
  className = '',
  onChange,
  theme = 'crepe',
  onEditorReady
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
        console.log('Available CrepeFeature options:', Object.keys(CrepeFeature));
        
        // Check if History is available as a feature
        const availableFeatures = Object.keys(CrepeFeature);
        console.log('All available features:', availableFeatures);
        
        // Look for history-related features
        const historyFeatures = availableFeatures.filter(feature => 
          feature.toLowerCase().includes('history') || 
          feature.toLowerCase().includes('undo') || 
          feature.toLowerCase().includes('redo')
        );
        console.log('History-related features:', historyFeatures);
        
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
            
            
            /* Hide H1 options from slash menu - multiple approaches */
            .milkdown .milkdown-slash-menu [data-id="h1"],
            .milkdown .milkdown-slash-menu [data-id="heading1"],
            .milkdown .milkdown-slash-menu [data-id="heading-1"],
            .milkdown .milkdown-slash-menu li[data-id="h1"],
            .milkdown .milkdown-slash-menu li[data-id="heading1"],
            .milkdown .milkdown-slash-menu li[data-id="heading-1"],
            .milkdown .milkdown-slash-menu .menu-group li:has([data-id="h1"]),
            .milkdown .milkdown-slash-menu .menu-group li:has([data-id="heading1"]),
            .milkdown .milkdown-slash-menu .menu-group li:has([data-id="heading-1"]) {
              display: none !important;
            }
            
            /* Hide H1 options by text content as fallback */
            .milkdown .milkdown-slash-menu .menu-group li:has-text("Heading 1"),
            .milkdown .milkdown-slash-menu .menu-group li:has-text("H1"),
            .milkdown .milkdown-slash-menu .menu-group li:has-text("h1"),
            .milkdown .milkdown-slash-menu .menu-group li:has-text("Heading1"),
            .milkdown .milkdown-slash-menu .menu-group li:has-text("heading1") {
              display: none !important;
            }
            
            /* Additional selectors for different slash menu structures */
            .milkdown .milkdown-slash-menu li[title*="H1"],
            .milkdown .milkdown-slash-menu li[title*="h1"],
            .milkdown .milkdown-slash-menu li[title*="Heading 1"],
            .milkdown .milkdown-slash-menu li[aria-label*="H1"],
            .milkdown .milkdown-slash-menu li[aria-label*="h1"],
            .milkdown .milkdown-slash-menu li[aria-label*="Heading 1"] {
              display: none !important;
            }
            
            /* Target by icon or content patterns */
            .milkdown .milkdown-slash-menu li:has(svg[data-icon="h1"]),
            .milkdown .milkdown-slash-menu li:has(svg[data-icon="heading1"]),
            .milkdown .milkdown-slash-menu li:has(.icon-h1),
            .milkdown .milkdown-slash-menu li:has(.icon-heading1) {
              display: none !important;
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
        
        // Try to import and inject history plugin before creating Crepe
        let historyPluginInjected = false;
        try {
          const historyModule = await import('@milkdown/plugin-history');
          console.log('History module loaded during Crepe creation:', historyModule);
          const { history } = historyModule;
          console.log('History plugin during Crepe creation:', history);
          historyPluginInjected = true;
        } catch (error) {
          console.log('Failed to load history module during Crepe creation:', error);
        }
        
        crepeInstanceRef.current = new Crepe({
          root: editorRef.current,
          defaultValue,
          features: {
            [CrepeFeature.CodeMirror]: true,
            [CrepeFeature.BlockEdit]: true,
            [CrepeFeature.Toolbar]: true,
            // Try to enable any history-related features
            ...(historyFeatures.length > 0 && historyFeatures.reduce((acc, feature) => {
              acc[CrepeFeature[feature as keyof typeof CrepeFeature]] = true;
              return acc;
            }, {} as any)),
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
        
        // Configure slash menu to disable H1 option
        if (crepeInstanceRef.current && crepeInstanceRef.current.editor) {
          try {
            console.log('Configuring slash menu to disable H1...');
            const editor = crepeInstanceRef.current.editor;
            
            // Access the slash plugin and configure it
            if (editor.ctx) {
              const ctx = editor.ctx;
              
              // Try multiple approaches to find and configure the slash plugin
              const slashPluginKeys = ['slashPlugin', 'slash', 'slashConfig', 'slashCommand'];
              let slashPluginFound = false;
              
              for (const key of slashPluginKeys) {
                try {
                  const slashPlugin = ctx.get(key);
                  if (slashPlugin) {
                    console.log(`Found slash plugin with key '${key}':`, slashPlugin);
                    slashPluginFound = true;
                    
                    // Try to configure the slash plugin
                    if (typeof slashPlugin.config === 'function') {
                      console.log('Configuring existing slash plugin...');
                      
                      // Note: We don't need to import defaultActions since we're working with the existing plugin config
                      
                      // Store original config
                      const originalConfig = slashPlugin.config;
                      
                      // Override the config to filter out H1
                      slashPlugin.config = (ctx: any) => {
                        const originalResult = originalConfig(ctx);
                        
                        if (typeof originalResult === 'function') {
                          return (params: any) => {
                            const result = originalResult(params);
                            if (result && result.actions) {
                              // Filter out H1 actions
                              result.actions = result.actions.filter((action: any) => {
                                const { id = "" } = action;
                                if (id === "h1" || id === "heading1" || id === "heading-1") {
                                  console.log('Filtering out H1 action:', action);
                                  return false;
                                }
                                return true;
                              });
                            }
                            return result;
                          };
                        }
                        
                        return originalResult;
                      };
                      
                      console.log('Slash plugin configured to disable H1');
                      break;
                    }
                  }
                } catch (error) {
                  console.log(`Slash plugin not found with key '${key}':`, error.message);
                }
              }
              
              if (!slashPluginFound) {
                console.log('No slash plugin found in context, trying alternative approach...');
                
                // Try to access slash plugin through different methods
                try {
                  // Try to get all available context keys
                  const allKeys = Object.keys(ctx._ || {});
                  console.log('Available context keys:', allKeys);
                  
                  // Look for slash-related keys
                  const slashKeys = allKeys.filter(key => 
                    key.toLowerCase().includes('slash') || 
                    key.toLowerCase().includes('menu') ||
                    key.toLowerCase().includes('tooltip')
                  );
                  console.log('Slash-related keys:', slashKeys);
                  
                  // Try to configure any slash-related plugins
                  for (const key of slashKeys) {
                    try {
                      const plugin = ctx.get(key);
                      if (plugin && typeof plugin.config === 'function') {
                        console.log(`Found configurable plugin '${key}':`, plugin);
                        
                        // Store original config
                        const originalConfig = plugin.config;
                        
                        // Override the config to filter out H1
                        plugin.config = (ctx: any) => {
                          const originalResult = originalConfig(ctx);
                          
                          if (typeof originalResult === 'function') {
                            return (params: any) => {
                              const result = originalResult(params);
                              if (result && result.actions) {
                                // Filter out H1 actions
                                result.actions = result.actions.filter((action: any) => {
                                  const { id = "" } = action;
                                  if (id === "h1" || id === "heading1" || id === "heading-1") {
                                    console.log('Filtering out H1 action:', action);
                                    return false;
                                  }
                                  return true;
                                });
                              }
                              return result;
                            };
                          }
                          
                          return originalResult;
                        };
                        
                        console.log(`Plugin '${key}' configured to disable H1`);
                      }
                    } catch (error) {
                      console.log(`Error configuring plugin '${key}':`, error.message);
                    }
                  }
                } catch (error) {
                  console.log('Error accessing context keys:', error);
                }
              }
            }
          } catch (error) {
            console.log('Error accessing editor for slash configuration:', error);
          }
        }

        // Add dynamic H1 hiding after editor is ready
        setTimeout(() => {
          const hideH1Options = () => {
            const slashMenu = document.querySelector('.milkdown .milkdown-slash-menu');
            if (slashMenu) {
              // Hide H1 options by various selectors
              const h1Selectors = [
                '[data-id="h1"]',
                '[data-id="heading1"]',
                '[data-id="heading-1"]',
                'li[data-id="h1"]',
                'li[data-id="heading1"]',
                'li[data-id="heading-1"]',
                'li[title*="H1"]',
                'li[title*="h1"]',
                'li[title*="Heading 1"]',
                'li[aria-label*="H1"]',
                'li[aria-label*="h1"]',
                'li[aria-label*="Heading 1"]'
              ];
              
              h1Selectors.forEach(selector => {
                const elements = slashMenu.querySelectorAll(selector);
                elements.forEach(element => {
                  (element as HTMLElement).style.display = 'none';
                });
              });
              
              // Also hide by text content
              const allItems = slashMenu.querySelectorAll('li');
              allItems.forEach(item => {
                const text = item.textContent?.toLowerCase() || '';
                if (text.includes('h1') || text.includes('heading 1') || text.includes('heading1')) {
                  (item as HTMLElement).style.display = 'none';
                }
              });
            }
          };
          
          // Run immediately and set up observer for dynamic content
          hideH1Options();
          
          // Set up mutation observer to hide H1 options when slash menu appears
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                  if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node as Element;
                    if (element.classList?.contains('milkdown-slash-menu') || 
                        element.querySelector?.('.milkdown-slash-menu')) {
                      setTimeout(hideH1Options, 10);
                    }
                  }
                });
              }
            });
          });
          
          // Start observing
          const editorElement = document.querySelector('.milkdown');
          if (editorElement) {
            observer.observe(editorElement, {
              childList: true,
              subtree: true
            });
          }
        }, 1000);

        // Call onEditorReady callback if provided
        if (onEditorReady && crepeInstanceRef.current) {
          onEditorReady(crepeInstanceRef.current);
        }
        
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