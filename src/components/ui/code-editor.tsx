import { Editor } from '@monaco-editor/react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from './button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Copy, Check } from 'lucide-react'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  onLanguageChange?: (language: string) => void
  readOnly?: boolean
  height?: string
  isDragging?: boolean
}

const languageOptions = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'dockerfile', label: 'Dockerfile' },
  { value: 'plaintext', label: 'Plain Text' },
]

export function CodeEditor({ 
  value, 
  onChange, 
  language = 'javascript', 
  onLanguageChange,
  readOnly = false,
  height = '300px',
  isDragging = false
}: CodeEditorProps) {
  const [currentLanguage, setCurrentLanguage] = useState(language)
  const [copied, setCopied] = useState(false)
  const [editorHeight, setEditorHeight] = useState(200)
  const [isEditorReady, setIsEditorReady] = useState(false)
  const [shouldRenderEditor, setShouldRenderEditor] = useState(!isDragging)
  const editorRef = useRef<any>(null)

  useEffect(() => {
    setCurrentLanguage(language)
  }, [language])

  // Handle drag state changes with debouncing
  useEffect(() => {
    if (isDragging) {
      // Immediately hide editor when dragging starts
      setShouldRenderEditor(false)
      setIsEditorReady(false)
      // Dispose editor if it exists
      if (editorRef.current) {
        try {
          editorRef.current.dispose()
        } catch (error) {
          console.warn('Monaco Editor disposal during drag failed:', error)
        }
        editorRef.current = null
      }
    } else {
      // Delay showing editor when dragging ends to prevent rapid creation/destruction
      const timer = setTimeout(() => {
        setShouldRenderEditor(true)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isDragging])

  // Calculate height based on content
  useEffect(() => {
    if (value) {
      const lines = value.split('\n').length
      const minHeight = 120 // Minimum height for 3 lines
      const maxHeight = 500 // Maximum height to prevent excessive scrolling
      const lineHeight = 22 // Monaco's default line height
      const padding = 32 // Top and bottom padding
      const calculatedHeight = Math.max(minHeight, Math.min(maxHeight, lines * lineHeight + padding))
      setEditorHeight(calculatedHeight)
      
      // Update editor layout if it exists and is ready
      if (editorRef.current && isEditorReady) {
        try {
          editorRef.current.layout()
        } catch (error) {
          // Ignore disposal errors during layout updates
          console.warn('Monaco Editor layout update failed:', error)
        }
      }
    } else {
      setEditorHeight(120) // Default height for empty editor
    }
  }, [value, isEditorReady])

  // Handle editor mount to get reference
  const handleEditorDidMount = useCallback((editor: any) => {
    // Only set up editor if we're not in a dragging state
    if (!isDragging && shouldRenderEditor) {
      editorRef.current = editor
      setIsEditorReady(true)
      
      // Update layout after mount
      setTimeout(() => {
        try {
          editor.layout()
        } catch (error) {
          console.warn('Monaco Editor initial layout failed:', error)
        }
      }, 0)
    } else {
      // Dispose immediately if we're dragging
      try {
        editor.dispose()
      } catch (error) {
        console.warn('Monaco Editor immediate disposal failed:', error)
      }
    }
  }, [isDragging, shouldRenderEditor])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        try {
          editorRef.current.dispose()
        } catch (error) {
          // Ignore disposal errors
          console.warn('Monaco Editor disposal failed:', error)
        }
        editorRef.current = null
        setIsEditorReady(false)
      }
    }
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const handleLanguageChange = (newLanguage: string) => {
    setCurrentLanguage(newLanguage)
    onLanguageChange?.(newLanguage) // Call parent's language change handler
  }

  const handleEditorChange = useCallback((newValue: string | undefined) => {
    try {
      onChange(newValue || '')
    } catch (error) {
      console.warn('Monaco Editor change handler failed:', error)
    }
  }, [onChange])

  // Show fallback textarea during dragging or if editor should not render
  if (isDragging || !shouldRenderEditor) {
    return (
      <div className="border rounded-md overflow-hidden">
        <div className="flex items-center justify-between p-2 bg-muted border-b">
          <Select value={currentLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-48 h-8">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {languageOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
        <div style={{ height: `${editorHeight}px` }} className="p-4 bg-muted/50">
          <div className="text-sm text-muted-foreground mb-2">Code Editor (dragging...)</div>
          <textarea
            value={value}
            onChange={(e) => handleEditorChange(e.target.value)}
            className="w-full h-full bg-background border rounded p-2 font-mono text-sm resize-none"
            placeholder="Code will be restored after drag operation..."
            readOnly
          />
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="flex items-center justify-between p-2 bg-muted border-b">
        <Select value={currentLanguage} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-48 h-8">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {languageOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 px-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
      <div style={{ height: `${editorHeight}px` }}>
        {shouldRenderEditor && !isDragging ? (
          <Editor
            key={`${currentLanguage}-${editorHeight}`}
            height="100%"
            language={currentLanguage}
            value={value}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              readOnly,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 14,
              lineNumbers: 'on',
              wordWrap: 'on',
              automaticLayout: true,
              padding: { top: 16, bottom: 16 },
              scrollbar: {
                vertical: 'auto',
                horizontal: 'auto',
              },
            }}
            theme="vs-dark"
          />
        ) : (
          <div className="w-full h-full bg-muted/50 flex items-center justify-center text-muted-foreground text-sm">
            Loading editor...
          </div>
        )}
      </div>
    </div>
  )
}
