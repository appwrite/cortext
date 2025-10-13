import { createFileRoute } from '@tanstack/react-router';
import CrepeEditor, { CrepeTheme } from '../components/ui/crepe-editor';
import { useState, useCallback } from 'react';

function CrepeEditorPage() {
  console.log('CrepeEditorPage component rendered');
  
  // Initial content - this should be static
  const initialContent = `# Welcome to Crepe Milkdown Editor

This is a **WYSIWYG Markdown editor** built with Crepe theme. You can:

## Features

- **Rich text editing** with live preview
- **Block editing** - click on any block to edit it
- **Toolbar** with formatting options
- **Slash commands** - type \`/\` to see available commands
- **Multiple themes** - Crepe, Nord, and Frame
- **Light/Dark modes**

## Try it out!

1. Click on any text to edit it
2. Use the toolbar for formatting
3. Type \`/\` to see slash commands
4. Switch themes using the controls above

> This editor supports all standard Markdown features including tables, code blocks, and more!

\`\`\`javascript
// Code blocks are supported too!
function hello() {
    console.log("Hello, Crepe!");
}
\`\`\`

---

**Enjoy writing!** ✨`;

  const [content, setContent] = useState(initialContent);
  const [currentTheme, setCurrentTheme] = useState<CrepeTheme>('crepe');

  // Memoize the onChange callback to prevent unnecessary rerenders
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  // Theme options
  const themes: { value: CrepeTheme; label: string; description: string }[] = [
    { value: 'crepe', label: 'Crepe', description: 'Default Crepe theme with modern styling' },
    { value: 'crepe-dark', label: 'Crepe Dark', description: 'Dark variant of the Crepe theme' },
    { value: 'nord', label: 'Nord', description: 'Nord color scheme with clean aesthetics' },
    { value: 'nord-dark', label: 'Nord Dark', description: 'Dark variant of the Nord theme' },
    { value: 'frame', label: 'Frame', description: 'Frame theme with structured layout' },
    { value: 'frame-dark', label: 'Frame Dark', description: 'Dark variant of the Frame theme' },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Crepe Milkdown Editor</h1>
        <p className="text-gray-600 mb-4">
          A beautiful WYSIWYG Markdown editor with multiple themes
        </p>
        
        {/* Theme Selector */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Choose Theme</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {themes.map((theme) => (
              <button
                key={theme.value}
                onClick={() => setCurrentTheme(theme.value)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  currentTheme === theme.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{theme.label}</div>
                <div className="text-sm text-gray-600">{theme.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg border">
        <div className="p-6">
          <CrepeEditor 
            defaultValue={initialContent} 
            onChange={handleContentChange}
            theme={currentTheme}
            className="min-h-[500px]"
          />
        </div>
      </div>

      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Current Content (Markdown):</h3>
        <pre className="bg-white p-4 rounded border text-sm overflow-auto max-h-96">
          {content}
        </pre>
      </div>

      <div className="mt-6 text-center text-gray-500">
        <p>
          Powered by{' '}
          <a 
            href="https://milkdown.dev" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Milkdown
          </a>{' '}
          • Built with{' '}
          <a 
            href="https://milkdown.dev/docs/guide/using-crepe" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Crepe
          </a>
        </p>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/crepe-editor')({
  component: CrepeEditorPage,
});
