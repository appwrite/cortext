import { createFileRoute } from "@tanstack/react-router";
import { Brain, Sparkles, Code2, Users, Zap, ArrowRight, CheckCircle, Type as TypeIcon, Image as ImageIcon, Video as VideoIcon, Map as MapIcon, Quote as QuoteIcon, Code2 as CodeIcon, FileEdit, MessageSquare, History } from "lucide-react";
import { useThemeContext } from "@/contexts/theme-context";

export const Route = createFileRoute("/docs/")({
    component: DocsIndex,
});

function DocsIndex() {
    const { effectiveTheme } = useThemeContext();

    // Icon mapping for the block list
    const blocks: { label: string; Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }> }[] = [
        { label: 'Text', Icon: TypeIcon },
        { label: 'Images', Icon: ImageIcon },
        { label: 'Video', Icon: VideoIcon },
        { label: 'Maps', Icon: MapIcon },
        { label: 'Quotes', Icon: QuoteIcon },
        { label: 'Code', Icon: CodeIcon },
    ];

    const features = [
        {
            icon: Sparkles,
            title: "AI Co-author",
            description: "Generate drafts, refine content, and optimize for your audience."
        },
        {
            icon: CodeIcon,
            title: "Flexible Blocks",
            description: "Drag, sort, and edit content blocks with confidence."
        },
        {
            icon: Brain,
            title: "SEO Built-in",
            description: "Real-time suggestions and optimization as you write."
        },
        {
            icon: FileEdit,
            title: "Drafts & Reviews",
            description: "Stage changes, collect feedback, and roll back when needed."
        },
        {
            icon: MessageSquare,
            title: "Team Ready",
            description: "Multi-user editing with permissions and real-time collaboration."
        }
    ];

    const quickStartSteps = [
        {
            step: 1,
            title: "Create an account",
            description: "Sign up for free and get instant access to all features.",
            code: "curl -X POST https://api.cortext.com/auth/signup \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"email\": \"user@example.com\", \"password\": \"password\"}'"
        },
        {
            step: 2,
            title: "Create your first article",
            description: "Start with a simple text block and build from there.",
            code: "curl -X POST https://api.cortext.com/articles \\\n  -H 'Authorization: Bearer YOUR_TOKEN' \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"title\": \"My First Article\", \"content\": [{\"type\": \"text\", \"data\": \"Hello World!\"}]}'"
        },
        {
            step: 3,
            title: "Add AI assistance",
            description: "Enable the AI co-author to help improve your content.",
            code: "curl -X POST https://api.cortext.com/ai/optimize \\\n  -H 'Authorization: Bearer YOUR_TOKEN' \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"articleId\": \"article_123\", \"optimization\": \"seo\"}'"
        }
    ];

    return (
        <div className="space-y-6">
            {/* Hero */}
            <div className="py-4">
                <div className="inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-xs font-medium text-foreground/70 mb-3">
                    Documentation
                </div>
                <h1 className="text-2xl font-bold tracking-tight mb-2">
                    Welcome to Cortext
                </h1>
                <p className="text-base text-foreground/70 max-w-2xl">
                    The complete guide to building modern content management systems with AI-powered collaboration.
                </p>
            </div>

            {/* Quick Links */}
            <section>
                <h2 className="text-lg font-semibold mb-3">Get Started</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border hover:border-foreground/20 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded bg-foreground flex items-center justify-center">
                                <Zap className="w-3 h-3 text-background" />
                            </div>
                            <h3 className="text-sm font-semibold">Quick Start</h3>
                        </div>
                        <p className="text-xs text-foreground/70 mb-2">Get up and running with Cortext in under 5 minutes.</p>
                        <a href="/docs/quick-start" className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:text-foreground/70 transition-colors">
                            Start building →
                        </a>
                    </div>
                    <div className="p-3 rounded-lg border hover:border-foreground/20 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded bg-foreground flex items-center justify-center">
                                <Code2 className="w-3 h-3 text-background" />
                            </div>
                            <h3 className="text-sm font-semibold">API Reference</h3>
                        </div>
                        <p className="text-xs text-foreground/70 mb-2">Complete API documentation with examples and guides.</p>
                        <a href="/docs/api" className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:text-foreground/70 transition-colors">
                            View API docs →
                        </a>
                    </div>
                </div>
            </section>

            {/* Features Overview */}
            <section>
                <h2 className="text-lg font-semibold mb-3">Core Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded bg-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                                <feature.icon className="w-3 h-3 text-background" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                                <p className="text-xs text-foreground/70 mb-2">{feature.description}</p>
                                {feature.title === "Flexible Blocks" && (
                                    <div className="flex flex-wrap gap-1">
                                        {blocks.map(({ label, Icon }) => (
                                            <span key={label} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-foreground/5 text-foreground/60">
                                                <Icon className="w-3 h-3" />
                                                {label}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>


            {/* API Overview */}
            <section>
                <h2 className="text-lg font-semibold mb-3">API Overview</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="p-3 rounded border">
                        <h3 className="font-semibold text-sm mb-1">RESTful Design</h3>
                        <p className="text-foreground/70 text-xs mb-2">
                            Clean, predictable endpoints that follow REST conventions for easy integration.
                        </p>
                        <div className="space-y-0.5 text-xs">
                            <div className="flex justify-between">
                                <span className="text-foreground/60">Base URL:</span>
                                <code className="text-foreground/80">https://api.cortext.com</code>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-foreground/60">Auth:</span>
                                <code className="text-foreground/80">Bearer Token</code>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-foreground/60">Rate Limit:</span>
                                <code className="text-foreground/80">1000 req/min</code>
                            </div>
                        </div>
                    </div>
                    <div className="p-3 rounded border">
                        <h3 className="font-semibold text-sm mb-1">Endpoints</h3>
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <span className="px-1 py-0.5 rounded text-xs font-mono bg-foreground/10 text-foreground/80">
                                    GET
                                </span>
                                <code className="text-xs">/articles</code>
                                <span className="text-foreground/60 text-xs">List</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="px-1 py-0.5 rounded text-xs font-mono bg-foreground/10 text-foreground/80">
                                    POST
                                </span>
                                <code className="text-xs">/articles</code>
                                <span className="text-foreground/60 text-xs">Create</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="px-1 py-0.5 rounded text-xs font-mono bg-foreground/10 text-foreground/80">
                                    PUT
                                </span>
                                <code className="text-xs">/articles/:id</code>
                                <span className="text-foreground/60 text-xs">Update</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="px-1 py-0.5 rounded text-xs font-mono bg-foreground/10 text-foreground/80">
                                    DELETE
                                </span>
                                <code className="text-xs">/articles/:id</code>
                                <span className="text-foreground/60 text-xs">Delete</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Next Steps */}
            <section className="py-3 bg-foreground/5 rounded-lg text-center">
                <h2 className="text-sm font-semibold mb-2">Ready to get started?</h2>
                <p className="text-foreground/70 text-xs mb-3 max-w-2xl mx-auto">
                    Explore our comprehensive guides and start building your content management system today.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <a
                        href="/docs/quick-start"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90 transition-colors"
                    >
                        Quick Start Guide
                        <ArrowRight className="w-3 h-3" />
                    </a>
                    <a
                        href="/docs/api"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border hover:bg-foreground/5 transition-colors"
                    >
                        API Reference
                        <Code2 className="w-3 h-3" />
                    </a>
                </div>
            </section>
        </div>
    );
}
