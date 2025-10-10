import { createFileRoute } from "@tanstack/react-router";
import { Code2, Image, Video, MapPin, Quote, Type, ArrowRight, Copy, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/docs/blocks")({
    component: Blocks,
});

function Blocks() {
    const blockTypes = [
        {
            type: "text",
            icon: Type,
            title: "Text Block",
            description: "Rich text editing with formatting, links, and styling options.",
            features: ["Markdown support", "Custom formatting", "Inline links", "Lists and tables"],
            example: `{
  "type": "text",
  "data": "# Welcome to Cortext\n\nThis is a **rich text** block with [links](https://cortext.com) and *formatting*.",
  "style": {
    "fontSize": "16px",
    "lineHeight": "1.6"
  }
}`
        },
        {
            type: "image",
            icon: Image,
            title: "Image Block",
            description: "High-quality image display with responsive sizing and optimization.",
            features: ["Auto-optimization", "Responsive sizing", "Lazy loading", "Alt text support"],
            example: `{
  "type": "image",
  "data": {
    "src": "https://example.com/image.jpg",
    "alt": "Beautiful landscape",
    "caption": "A stunning view of the mountains"
  },
  "style": {
    "width": "100%",
    "maxWidth": "800px"
  }
}`
        },
        {
            type: "video",
            icon: Video,
            title: "Video Block",
            description: "Embed videos from popular platforms or upload your own.",
            features: ["YouTube/Vimeo support", "Custom uploads", "Responsive player", "Thumbnail preview"],
            example: `{
  "type": "video",
  "data": {
    "src": "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "platform": "youtube",
    "title": "Amazing Video"
  },
  "style": {
    "aspectRatio": "16:9"
  }
}`
        },
        {
            type: "code",
            icon: Code2,
            title: "Code Block",
            description: "Syntax-highlighted code snippets with copy functionality.",
            features: ["Syntax highlighting", "Copy to clipboard", "Line numbers", "Language detection"],
            example: `{
  "type": "code",
  "data": {
    "language": "javascript",
    "showLineNumbers": true
  }
}`
        },
        {
            type: "quote",
            icon: Quote,
            title: "Quote Block",
            description: "Highlight important quotes and testimonials with elegant styling.",
            features: ["Custom styling", "Author attribution", "Social sharing", "Multiple formats"],
            example: `{
  "type": "quote",
  "data": {
    "text": "The best way to predict the future is to create it.",
    "author": "Peter Drucker",
    "source": "Management Consultant"
  },
  "style": {
    "variant": "large"
  }
}`
        },
        {
            type: "map",
            icon: MapPin,
            title: "Map Block",
            description: "Interactive maps with custom markers and location data.",
            features: ["Interactive maps", "Custom markers", "Location search", "Street view"],
            example: `{
  "type": "map",
  "data": {
    "center": [40.7128, -74.0060],
    "zoom": 13,
    "markers": [
      {
        "position": [40.7128, -74.0060],
        "title": "New York City"
      }
    ]
  }
}`
        }
    ];

    const customBlockExample = `// Custom Block Component
import { BlockComponent } from '@cortext/react';

interface CustomBlockData {
  title: string;
  items: string[];
  theme: 'light' | 'dark';
}

export const CustomBlock: BlockComponent<CustomBlockData> = ({ data, isEditing }) => {
  return (
    <div className={\`custom-block \${data.theme}\`}>
      <h3>{data.title}</h3>
      <ul>
        {data.items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

// Register the block
cortext.blocks.register('custom', CustomBlock);`;

    const blockApiExample = `// Creating a block programmatically
const article = await cortext.articles.create({
  title: "My Article",
  content: [
    {
      type: "text",
      data: "Introduction paragraph..."
    },
    {
      type: "image",
      data: {
        src: "https://example.com/image.jpg",
        alt: "Description"
      }
    },
    {
      type: "custom",
      data: {
        title: "Features",
        items: ["Feature 1", "Feature 2", "Feature 3"],
        theme: "light"
      }
    }
  ]
});

// Updating blocks
await cortext.articles.update(article.id, {
  content: [
    ...article.content,
    {
      type: "text",
      data: "New paragraph added!"
    }
  ]
});`;

    return (
        <div className="space-y-12">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-4">Blocks & Content</h1>
                <p className="text-lg text-foreground/70">
                    Learn how to use Cortext's flexible block system to create rich, interactive content. Blocks are the building blocks of your content, each designed for a specific purpose.
                </p>
            </div>

            {/* Overview */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">What are Blocks?</h2>
                <div className="bg-foreground/5 rounded-xl p-6 mb-6">
                    <p className="text-foreground/80 mb-4">
                        Blocks are modular content components that can be combined to create rich, interactive articles. Each block has a specific purpose and can be customized to fit your needs.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                            <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center mx-auto mb-2">
                                <Type className="w-4 h-4" />
                            </div>
                            <span className="text-foreground/70">Text</span>
                        </div>
                        <div className="text-center">
                            <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center mx-auto mb-2">
                                <Image className="w-4 h-4" />
                            </div>
                            <span className="text-foreground/70">Images</span>
                        </div>
                        <div className="text-center">
                            <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center mx-auto mb-2">
                                <Video className="w-4 h-4" />
                            </div>
                            <span className="text-foreground/70">Videos</span>
                        </div>
                        <div className="text-center">
                            <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center mx-auto mb-2">
                                <Code2 className="w-4 h-4" />
                            </div>
                            <span className="text-foreground/70">Code</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Block Types */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Available Block Types</h2>
                <div className="space-y-8">
                    {blockTypes.map((block, index) => (
                        <div key={index} className="border rounded-xl p-6">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-foreground/10 flex items-center justify-center flex-shrink-0">
                                    <block.icon className="w-5 h-5 text-foreground" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-2">{block.title}</h3>
                                    <p className="text-foreground/70 mb-3">{block.description}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {block.features.map((feature, featureIndex) => (
                                            <span key={featureIndex} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-foreground/5 text-foreground/60">
                                                <CheckCircle className="w-3 h-3" />
                                                {feature}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-lg border overflow-hidden">
                                <div className="px-4 py-2 bg-foreground/5 border-b text-sm font-medium flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Code2 className="w-4 h-4" />
                                        Example JSON
                                    </span>
                                    <button className="flex items-center gap-1 text-xs text-foreground/60 hover:text-foreground/80 transition-colors">
                                        <Copy className="w-3 h-3" />
                                        Copy
                                    </button>
                                </div>
                                <pre className="p-4 text-sm overflow-x-auto">
                                    <code className="text-foreground/80">{block.example}</code>
                                </pre>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Custom Blocks */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Creating Custom Blocks</h2>
                <p className="text-foreground/70 mb-6">
                    You can create custom blocks to extend Cortext's functionality. Custom blocks are React components that can be used just like built-in blocks.
                </p>
                <div className="space-y-6">
                    <div className="border rounded-xl p-6">
                        <h3 className="font-semibold text-lg mb-4">Custom Block Example</h3>
                        <div className="rounded-lg border overflow-hidden">
                            <div className="px-4 py-2 bg-foreground/5 border-b text-sm font-medium">
                                CustomBlock.tsx
                            </div>
                            <pre className="p-4 text-sm overflow-x-auto">
                                <code className="text-foreground/80">{customBlockExample}</code>
                            </pre>
                        </div>
                    </div>
                </div>
            </section>

            {/* API Usage */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Working with Blocks via API</h2>
                <p className="text-foreground/70 mb-6">
                    You can create, update, and manage blocks programmatically using our REST API or JavaScript SDK.
                </p>
                <div className="border rounded-xl p-6">
                    <h3 className="font-semibold text-lg mb-4">API Examples</h3>
                    <div className="rounded-lg border overflow-hidden">
                        <div className="px-4 py-2 bg-foreground/5 border-b text-sm font-medium">
                            JavaScript SDK
                        </div>
                        <pre className="p-4 text-sm overflow-x-auto">
                            <code className="text-foreground/80">{blockApiExample}</code>
                        </pre>
                    </div>
                </div>
            </section>

            {/* Best Practices */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Best Practices</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Content Structure</h3>
                        <ul className="space-y-2 text-sm text-foreground/70">
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                Start with a text block for introduction
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                Use images to break up long text sections
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                Group related content in logical order
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                End with a call-to-action or summary
                            </li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Performance</h3>
                        <ul className="space-y-2 text-sm text-foreground/70">
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                Optimize images before uploading
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                Use lazy loading for media blocks
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                Keep custom blocks lightweight
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                Test on different screen sizes
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Next Steps */}
            <section className="text-center py-12 bg-foreground/5 rounded-2xl">
                <h2 className="text-2xl font-semibold mb-4">Ready to build with blocks?</h2>
                <p className="text-foreground/70 mb-8 max-w-2xl mx-auto">
                    Start creating rich content with our flexible block system. Explore the dashboard to see blocks in action.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90 transition-colors"
                    >
                        Open Dashboard
                        <ArrowRight className="w-4 h-4" />
                    </a>
                    <a
                        href="/docs/api"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-medium border hover:bg-foreground/5 transition-colors"
                    >
                        API Reference
                        <Code2 className="w-4 h-4" />
                    </a>
                </div>
            </section>
        </div>
    );
}
