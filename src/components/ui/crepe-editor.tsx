import { useEffect, useRef, useState } from 'react';

interface CrepeEditorProps {
  defaultValue?: string;
  className?: string;
  onChange?: (markdown: string) => void;
}

export default function CrepeEditor({ 
  defaultValue = '', 
  className = '',
  onChange
}: CrepeEditorProps) {
  console.log('CrepeEditor component rendered');
  
  const editorRef = useRef<HTMLDivElement>(null);
  const crepeInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('useEffect triggered');
    console.log('Editor ref current:', editorRef.current);
    
    let isMounted = true;
    
    // Wait for the ref to be available
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
        
        // Load CSS (only if not already loaded)
        const loadCSS = () => {
          return new Promise<void>((resolve) => {
            console.log('Loading Crepe CSS...');
            
            // Check if CSS is already loaded
            const existingCommonCSS = document.querySelector('link[href*="common/style.css"]');
            const existingCrepeCSS = document.querySelector('link[href*="crepe/style.css"]');
            
            if (existingCommonCSS && existingCrepeCSS) {
              console.log('Crepe CSS already loaded, skipping...');
              resolve();
              return;
            }
            
            // Load common styles first
            const commonLink = document.createElement('link');
            commonLink.rel = 'stylesheet';
            commonLink.href = '/node_modules/@milkdown/crepe/lib/theme/common/style.css';
            commonLink.onload = () => {
              console.log('Common CSS loaded');
              
              // Then load crepe theme
              const crepeLink = document.createElement('link');
              crepeLink.rel = 'stylesheet';
              crepeLink.href = '/node_modules/@milkdown/crepe/lib/theme/crepe/style.css';
              crepeLink.onload = () => {
                console.log('Crepe CSS loaded successfully');
                resolve();
              };
              crepeLink.onerror = () => {
                console.warn('Failed to load Crepe CSS, continuing without styles...');
                resolve();
              };
              document.head.appendChild(crepeLink);
            };
            commonLink.onerror = () => {
              console.warn('Failed to load common CSS, continuing without styles...');
              resolve();
            };
            document.head.appendChild(commonLink);
          });
        };

        await loadCSS();
        
        // Wait a bit for CSS to load
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Check if component is still mounted before creating Crepe instance
        if (!isMounted || !editorRef.current) {
          return;
        }
        
        // Check if Crepe instance already exists
        if (crepeInstanceRef.current) {
          console.log('Crepe instance already exists, skipping creation...');
          setIsLoading(false);
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
    };
  }, [defaultValue]);

  return (
    <div className={`crepe-editor-container relative ${className}`}>
      <div 
        ref={editorRef} 
        className="min-h-[400px] border border-gray-200 rounded"
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