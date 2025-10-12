import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, Code2, Users, Zap, ArrowRight, CheckCircle, Type as TypeIcon, Image as ImageIcon, Video as VideoIcon, Map as MapIcon, Quote as QuoteIcon, Code2 as CodeIcon, FileEdit, MessageSquare, History } from "lucide-react";
import { useThemeContext } from "@/contexts/theme-context";
import { useTableOfContents } from "@/contexts/table-of-contents-context";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PageActions } from "@/components/docs/page-actions";

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

    const features: { icon: string | React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>; title: string; description: string }[] = [
        {
            icon: effectiveTheme === 'dark' ? "/icons/claude-icon-dark.svg" : "/icons/claude-icon-light.svg",
            title: "AI co-author",
            description: "Generate drafts, refine content, and optimize for your audience."
        },
        {
            icon: CodeIcon,
            title: "Flexible blocks",
            description: "Drag, sort, and edit content blocks with confidence."
        },
        {
            icon: Brain,
            title: "SEO built-in",
            description: "Real-time suggestions and optimization as you write."
        },
        {
            icon: FileEdit,
            title: "Drafts & reviews",
            description: "Stage changes, collect feedback, and roll back when needed."
        },
        {
            icon: MessageSquare,
            title: "Team ready",
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
                <div className="flex items-center justify-between mb-3">
                    <div className="inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-xs font-medium text-foreground/70">
                        Documentation
                    </div>
                    <div className="mt-1">
                        <PageActions />
                    </div>
                </div>
                <h1 className="text-2xl font-medium tracking-tight mb-6">
                    Welcome to Cortext
                </h1>
                <div className="text-base text-foreground/70 max-w-2xl space-y-5 leading-relaxed">
                    <p className="font-normal">
                        Documentation for building content management systems with AI-powered collaboration features. 
                        This guide covers content creation, management, and optimization using Cortext's AI features, 
                        team collaboration tools, and API integrations.
                    </p>
                    <p className="font-normal">
                        Cortext combines artificial intelligence with content management capabilities. The platform 
                        supports content generation, workflow management, and consistency across digital assets. 
                        It serves individual creators and organizations of various sizes.
                    </p>
                    <p className="font-normal">
                        Features include automated content suggestions, SEO optimization, real-time collaboration, 
                        and version control. The platform offers a RESTful API and documentation for integration 
                        with existing tools and workflows.
                    </p>
                </div>
            </div>


            {/* Quick Links */}
            <section id="get-started">
                <h2 className="text-lg font-medium mb-3">Get started</h2>
                <p className="text-sm text-foreground/70 mb-6 max-w-2xl">
                    Choose your path to begin working with Cortext. Whether you're looking for a quick setup 
                    or comprehensive API documentation, we have the resources to get you up and running.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link to="/docs/quick-start" className="block p-4 rounded-lg border border-border bg-card dark:bg-transparent hover:border-primary/50 transition-all duration-200 cursor-pointer">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                                <Zap className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-normal text-sm text-foreground mb-1">Quick start</h3>
                                <p className="text-xs text-muted-foreground mb-2">Get up and running with Cortext in under 5 minutes.</p>
                                <div className="mt-3 h-7 flex items-center">
                                    <span className="text-xs text-primary font-medium">
                                        Start building
                                        <ArrowRight className="w-3 h-3 ml-1 inline" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Link>
                    <Link to="/docs/api" className="block p-4 rounded-lg border border-border bg-card dark:bg-transparent hover:border-primary/50 transition-all duration-200 cursor-pointer">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                                <Code2 className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-normal text-sm text-foreground mb-1">API reference</h3>
                                <p className="text-xs text-muted-foreground mb-2">Complete API documentation with examples and guides.</p>
                                <div className="mt-3 h-7 flex items-center">
                                    <span className="text-xs text-primary font-medium">
                                        View API docs
                                        <ArrowRight className="w-3 h-3 ml-1 inline" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            </section>

            {/* Features Overview */}
            <section id="core-features">
                <h2 className="text-lg font-medium mb-3">Core features</h2>
                <p className="text-sm text-foreground/70 mb-6 max-w-2xl">
                    Discover the key capabilities that make Cortext a powerful content management solution. 
                    Each feature is designed to enhance your content creation workflow and improve team productivity.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {features.map((feature, index) => (
                        <div key={index} className="p-4 rounded-lg border border-border bg-card dark:bg-transparent hover:border-primary/50 transition-all duration-200 cursor-pointer">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                                    {typeof feature.icon === 'string' ? (
                                        <img src={feature.icon} alt={feature.title} className="w-4 h-4" />
                                    ) : (
                                        <feature.icon className="w-4 h-4" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-normal text-sm text-foreground mb-1">{feature.title}</h3>
                                    <p className="text-xs text-muted-foreground mb-2">{feature.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>


            {/* Next Steps */}
            <section id="ready-to-start" className="p-4 rounded-lg border border-border bg-card dark:bg-transparent">
                <h2 className="text-lg font-medium mb-3">Ready to get started?</h2>
                <p className="text-foreground/70 text-sm mb-4 max-w-2xl">
                    Explore our comprehensive guides and start building your content management system today.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
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
