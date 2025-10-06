import React from 'react'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

/**
 * Simple markdown renderer with subtle styling that matches the website design
 * Supports: headers, bold, italic, code, lists, links, and line breaks
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  if (!content) return null

  // Split content into lines for processing
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    
    // Skip empty lines
    if (line.trim() === '') {
      elements.push(<br key={i} />)
      i++
      continue
    }

    // Headers
    if (line.startsWith('######')) {
      const content = line.startsWith('###### ') ? line.slice(7) : line.slice(6)
      elements.push(
        <h6 key={i} className="text-xs font-medium text-foreground/90 mt-1.5 mb-0.5 first:mt-0">
          {content}
        </h6>
      )
    } else if (line.startsWith('#####')) {
      const content = line.startsWith('##### ') ? line.slice(6) : line.slice(5)
      elements.push(
        <h5 key={i} className="text-xs font-medium text-foreground/90 mt-1.5 mb-0.5 first:mt-0">
          {content}
        </h5>
      )
    } else if (line.startsWith('####')) {
      const content = line.startsWith('#### ') ? line.slice(5) : line.slice(4)
      elements.push(
        <h4 key={i} className="text-xs font-medium text-foreground/90 mt-1.5 mb-0.5 first:mt-0">
          {content}
        </h4>
      )
    } else if (line.startsWith('###')) {
      const content = line.startsWith('### ') ? line.slice(4) : line.slice(3)
      elements.push(
        <h3 key={i} className="text-xs font-medium text-foreground/90 mt-1.5 mb-0.5 first:mt-0">
          {content}
        </h3>
      )
    } else if (line.startsWith('##')) {
      const content = line.startsWith('## ') ? line.slice(3) : line.slice(2)
      elements.push(
        <h2 key={i} className="text-xs font-medium text-foreground/90 mt-1.5 mb-0.5 first:mt-0">
          {content}
        </h2>
      )
    } else if (line.startsWith('#')) {
      const content = line.startsWith('# ') ? line.slice(2) : line.slice(1)
      elements.push(
        <h1 key={i} className="text-xs font-medium text-foreground/90 mt-1.5 mb-0.5 first:mt-0">
          {content}
        </h1>
      )
    }
    // Unordered lists
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      const listItems: React.ReactNode[] = []
      let j = i
      
      while (j < lines.length && (lines[j].startsWith('- ') || lines[j].startsWith('* ') || lines[j].startsWith('  - ') || lines[j].startsWith('  * ') || lines[j].startsWith('    - ') || lines[j].startsWith('    * '))) {
        const currentLine = lines[j]
        const indentLevel = (currentLine.match(/^(\s*)/)?.[1]?.length || 0) / 2 // Count spaces, divide by 2 for levels
        const item = currentLine.replace(/^\s*[-*]\s/, '')
        
        listItems.push(
          <li key={j} className={`text-xs text-foreground/80 flex items-start gap-1.5 ${indentLevel > 0 ? 'ml-3' : ''}`}>
            <span className="text-foreground/60 mt-0.5 flex-shrink-0">•</span>
            <span className="flex-1">{parseInlineMarkdown(item)}</span>
          </li>
        )
        j++
      }
      
      elements.push(
        <ul key={i} className="space-y-0.5 my-0.5">
          {listItems}
        </ul>
      )
      i = j - 1
    }
    // Ordered lists
    else if (/^\d+\.\s/.test(line)) {
      const listItems: React.ReactNode[] = []
      let j = i
      
      while (j < lines.length && (/^\d+\.\s/.test(lines[j]) || /^\s+\d+\.\s/.test(lines[j]))) {
        const currentLine = lines[j]
        const indentLevel = (currentLine.match(/^(\s*)/)?.[1]?.length || 0) / 2 // Count spaces, divide by 2 for levels
        const match = currentLine.match(/^\s*(\d+)\.\s(.+)/)
        
        if (match) {
          const number = match[1]
          const item = match[2]
          listItems.push(
            <li key={j} className={`text-xs text-foreground/80 flex items-start gap-1.5 ${indentLevel > 0 ? 'ml-3' : ''}`}>
              <span className="text-foreground/60 mt-0.5 flex-shrink-0">{number}.</span>
              <span className="flex-1">{parseInlineMarkdown(item)}</span>
            </li>
          )
        }
        j++
      }
      
      elements.push(
        <ol key={i} className="space-y-0.5 my-0.5">
          {listItems}
        </ol>
      )
      i = j - 1
    }
    // Code blocks
    else if (line.startsWith('```')) {
      const codeLines: string[] = []
      let j = i + 1
      
      while (j < lines.length && !lines[j].startsWith('```')) {
        codeLines.push(lines[j])
        j++
      }
      
      elements.push(
        <pre key={i} className="bg-muted/30 rounded-sm p-1.5 my-1 overflow-x-auto">
          <code className="text-xs font-mono text-foreground/70">
            {codeLines.join('\n')}
          </code>
        </pre>
      )
      i = j
    }
    // Horizontal separators
    else if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
      elements.push(
        <hr key={i} className="border-0 border-t border-border/30 my-1" />
      )
    }
    // Regular paragraphs
    else {
      elements.push(
        <p key={i} className="text-xs text-foreground/80 my-0.5 first:mt-0">
          {parseInlineMarkdown(line)}
        </p>
      )
    }
    
    i++
  }

  return (
    <div className={cn("space-y-0.5", className)}>
      {elements}
    </div>
  )
}

/**
 * Parse inline markdown elements (bold, italic, code, links)
 */
function parseInlineMarkdown(text: string): React.ReactNode[] {
  const elements: React.ReactNode[] = []
  let currentIndex = 0
  let key = 0

  // Regular expression patterns for inline elements
  const patterns = [
    { regex: /\*\*(.*?)\*\*/g, type: 'bold' },
    { regex: /\*(.*?)\*/g, type: 'italic' },
    { regex: /```(.*?)```/g, type: 'codeBlock' },
    { regex: /`(.*?)`/g, type: 'code' },
    { regex: /\[([^\]]+)\]\(([^)]+)\)/g, type: 'link' },
  ]

  // Find all matches
  const matches: Array<{
    type: string
    content: string
    url?: string
    start: number
    end: number
  }> = []

  patterns.forEach(({ regex, type }) => {
    let match
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        type,
        content: match[1],
        url: match[2],
        start: match.index,
        end: match.index + match[0].length,
      })
    }
  })

  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start)

  // Remove overlapping matches (keep the first one)
  const filteredMatches = matches.filter((match, index) => {
    if (index === 0) return true
    const previousMatch = matches[index - 1]
    return match.start >= previousMatch.end
  })

  // Build elements
  filteredMatches.forEach((match) => {
    // Add text before the match
    if (currentIndex < match.start) {
      const beforeText = text.slice(currentIndex, match.start)
      if (beforeText) {
        elements.push(beforeText)
      }
    }

    // Add the matched element
    switch (match.type) {
      case 'bold':
        elements.push(
          <strong key={key++} className="font-medium text-foreground/90">
            {match.content}
          </strong>
        )
        break
      case 'italic':
        elements.push(
          <em key={key++} className="italic text-foreground/70">
            {match.content}
          </em>
        )
        break
      case 'codeBlock':
        elements.push(
          <code key={key++} className="bg-muted/40 px-1 py-0.5 rounded text-xs font-mono text-foreground/70 block">
            {match.content}
          </code>
        )
        break
      case 'code':
        elements.push(
          <code key={key++} className="bg-muted/40 px-1 py-0.5 rounded text-xs font-mono text-foreground/70">
            {match.content}
          </code>
        )
        break
      case 'link':
        elements.push(
          <a
            key={key++}
            href={match.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/80 hover:text-primary hover:underline text-xs"
          >
            {match.content}
          </a>
        )
        break
    }

    currentIndex = match.end
  })

  // Add remaining text
  if (currentIndex < text.length) {
    const remainingText = text.slice(currentIndex)
    if (remainingText) {
      elements.push(remainingText)
    }
  }

  return elements.length > 0 ? elements : [text]
}
