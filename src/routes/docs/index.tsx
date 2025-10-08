import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, Sparkles, Code2, Users, Zap, ArrowRight, CheckCircle, Type as TypeIcon, Image as ImageIcon, Video as VideoIcon, Map as MapIcon, Quote as QuoteIcon, Code2 as CodeIcon, FileEdit, MessageSquare, History } from "lucide-react";
import { useThemeContext } from "@/contexts/theme-context";
import { useTableOfContents } from "@/contexts/table-of-contents-context";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/docs/")({
    component: DocsIndex,
});

function DocsIndex() {
    const { effectiveTheme } = useThemeContext();
    const { setItems } = useTableOfContents();

    // Table of contents for this page
    const tableOfContents = [
        { id: 'welcome', title: 'Welcome to Cortext', level: 1 },
        { id: 'get-started', title: 'Get Started', level: 1 },
        { id: 'core-features', title: 'Core Features', level: 1 },
        { id: 'api-overview', title: 'API Overview', level: 1 },
        { id: 'ready-to-start', title: 'Ready to get started?', level: 1 },
    ];

    // Set table of contents when component mounts
    useEffect(() => {
        setItems(tableOfContents);
        return () => setItems([]);
    }, [setItems]);

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
            <div id="welcome" className="py-4">
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
            <section id="get-started">
                <h2 className="text-lg font-semibold mb-3">Get Started</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-all duration-200">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                                <Zap className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-sm text-foreground mb-1">Quick Start</h3>
                                <p className="text-xs text-muted-foreground mb-2">Get up and running with Cortext in under 5 minutes.</p>
                                <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs font-medium text-primary hover:text-primary/70">
                                    <Link to="/docs/quick-start">
                                        Start building →
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-all duration-200">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                                <Code2 className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-sm text-foreground mb-1">API Reference</h3>
                                <p className="text-xs text-muted-foreground mb-2">Complete API documentation with examples and guides.</p>
                                <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs font-medium text-primary hover:text-primary/70">
                                    <Link to="/docs/api">
                                        View API docs →
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Overview */}
            <section id="core-features">
                <h2 className="text-lg font-semibold mb-3">Core Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {features.map((feature, index) => (
                        <div key={index} className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-all duration-200">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                                    <feature.icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-sm text-foreground mb-1">{feature.title}</h3>
                                    <p className="text-xs text-muted-foreground mb-2">{feature.description}</p>
                                    {feature.title === "Flexible Blocks" && (
                                        <div className="flex flex-wrap gap-1">
                                            {blocks.map(({ label, Icon }) => (
                                                <span key={label} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                                                    <Icon className="w-3 h-3" />
                                                    {label}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>


            {/* API Overview */}
            <section id="api-overview">
                <h2 className="text-lg font-semibold mb-3">API Overview</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-all duration-200">
                        <h3 className="font-medium text-sm text-foreground mb-1">RESTful Design</h3>
                        <p className="text-muted-foreground text-xs mb-3">
                            Clean, predictable endpoints that follow REST conventions for easy integration.
                        </p>
                        <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Base URL:</span>
                                <code className="text-foreground font-mono">https://api.cortext.com</code>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Auth:</span>
                                <code className="text-foreground font-mono">Bearer Token</code>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Rate Limit:</span>
                                <code className="text-foreground font-mono">1000 req/min</code>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-all duration-200">
                        <h3 className="font-medium text-sm text-foreground mb-1">Endpoints</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 rounded text-xs font-mono bg-muted text-muted-foreground">
                                    GET
                                </span>
                                <code className="text-xs text-foreground">/articles</code>
                                <span className="text-muted-foreground text-xs">List</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 rounded text-xs font-mono bg-muted text-muted-foreground">
                                    POST
                                </span>
                                <code className="text-xs text-foreground">/articles</code>
                                <span className="text-muted-foreground text-xs">Create</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 rounded text-xs font-mono bg-muted text-muted-foreground">
                                    PUT
                                </span>
                                <code className="text-xs text-foreground">/articles/:id</code>
                                <span className="text-muted-foreground text-xs">Update</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 rounded text-xs font-mono bg-muted text-muted-foreground">
                                    DELETE
                                </span>
                                <code className="text-xs text-foreground">/articles/:id</code>
                                <span className="text-muted-foreground text-xs">Delete</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Next Steps */}
            <section id="ready-to-start" className="py-3 bg-foreground/5 rounded-lg text-center">
                <h2 className="text-sm font-semibold mb-2">Ready to get started?</h2>
                <p className="text-foreground/70 text-xs mb-3 max-w-2xl mx-auto">
                    Explore our comprehensive guides and start building your content management system today.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button asChild size="sm" className="h-8 px-3 text-xs font-semibold bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200">
                        <Link to="/docs/quick-start">
                            Quick Start Guide
                            <ArrowRight className="w-3 h-3 ml-1" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="h-8 px-3 text-xs font-medium">
                        <Link to="/docs/api">
                            API Reference
                            <Code2 className="w-3 h-3 ml-1" />
                        </Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}
