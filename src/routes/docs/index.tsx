import { createFileRoute } from "@tanstack/react-router";
import { Brain, Sparkles, Code2, Users, Zap, ArrowRight, CheckCircle } from "lucide-react";
import { useThemeContext } from "@/contexts/theme-context";

export const Route = createFileRoute("/docs/")({
    component: DocsIndex,
});

function DocsIndex() {
    const { effectiveTheme } = useThemeContext();

    const features = [
        {
            icon: Brain,
            title: "AI Co-author",
            description: "Generate drafts, refine content, and optimize for your audience with our intelligent AI assistant.",
            benefits: ["Content generation", "SEO optimization", "Tone adjustment", "Fact checking"]
        },
        {
            icon: Code2,
            title: "Flexible Blocks",
            description: "Build rich content with drag-and-drop blocks that adapt to your needs.",
            benefits: ["Text blocks", "Image galleries", "Code snippets", "Interactive elements"]
        },
        {
            icon: Users,
            title: "Team Collaboration",
            description: "Work together seamlessly with real-time editing, comments, and version control.",
            benefits: ["Real-time editing", "Comment threads", "Version history", "Role-based access"]
        },
        {
            icon: Zap,
            title: "Performance",
            description: "Lightning-fast loading and editing with optimized rendering and caching.",
            benefits: ["Sub-100ms responses", "Auto-save", "Offline support", "CDN delivery"]
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
        <div className="space-y-8">
            {/* Hero */}
            <div className="py-6">
                <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-foreground/70 mb-4">
                    <Sparkles className="h-3 w-3" />
                    Documentation
                </div>
                <h1 className="text-3xl font-bold tracking-tight mb-3">
                    Welcome to Cortext
                </h1>
                <p className="text-lg text-foreground/70 max-w-2xl">
                    The complete guide to building modern content management systems with AI-powered collaboration.
                </p>
            </div>

            {/* Features Grid */}
            <section>
                <h2 className="text-xl font-semibold mb-4">Core Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {features.map((feature, index) => (
                        <div key={index} className="group p-4 rounded-lg border hover:border-foreground/20 transition-colors">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center flex-shrink-0">
                                    <feature.icon className="w-4 h-4 text-background" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-base mb-1">{feature.title}</h3>
                                    <p className="text-foreground/70 text-sm mb-3">{feature.description}</p>
                                    <ul className="space-y-1">
                                        {feature.benefits.map((benefit, benefitIndex) => (
                                            <li key={benefitIndex} className="flex items-center gap-2 text-xs text-foreground/60">
                                                <CheckCircle className="w-3 h-3 text-green-500" />
                                                {benefit}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Quick Start */}
            <section>
                <h2 className="text-xl font-semibold mb-4">Quick Start Guide</h2>
                <div className="space-y-4">
                    {quickStartSteps.map((step, index) => (
                        <div key={index} className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-semibold">
                                    {step.step}
                                </div>
                            </div>
                            <div className="flex-1 space-y-2">
                                <div>
                                    <h3 className="font-semibold text-base mb-1">{step.title}</h3>
                                    <p className="text-foreground/70 text-sm">{step.description}</p>
                                </div>
                                <div className="rounded-lg border overflow-hidden">
                                    <div className="px-3 py-1.5 bg-foreground/5 border-b text-xs font-medium">
                                        Terminal
                                    </div>
                                    <pre className="p-3 text-xs overflow-x-auto">
                                        <code className="text-foreground/80">{step.code}</code>
                                    </pre>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* API Overview */}
            <section>
                <h2 className="text-xl font-semibold mb-4">API Overview</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <div className="p-4 rounded-lg border">
                            <h3 className="font-semibold text-base mb-2">RESTful Design</h3>
                            <p className="text-foreground/70 text-sm mb-3">
                                Clean, predictable endpoints that follow REST conventions for easy integration.
                            </p>
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-foreground/60">Base URL:</span>
                                    <code className="text-foreground/80">https://api.cortext.com</code>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-foreground/60">Authentication:</span>
                                    <code className="text-foreground/80">Bearer Token</code>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-foreground/60">Rate Limit:</span>
                                    <code className="text-foreground/80">1000 req/min</code>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="p-4 rounded-lg border">
                            <h3 className="font-semibold text-base mb-2">Endpoints</h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                        GET
                                    </span>
                                    <code className="text-xs">/articles</code>
                                    <span className="text-foreground/60 text-xs">List articles</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        POST
                                    </span>
                                    <code className="text-xs">/articles</code>
                                    <span className="text-foreground/60 text-xs">Create article</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                        PUT
                                    </span>
                                    <code className="text-xs">/articles/:id</code>
                                    <span className="text-foreground/60 text-xs">Update article</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                        DELETE
                                    </span>
                                    <code className="text-xs">/articles/:id</code>
                                    <span className="text-foreground/60 text-xs">Delete article</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Next Steps */}
            <section className="py-6 bg-foreground/5 rounded-xl">
                <h2 className="text-lg font-semibold mb-3">Ready to get started?</h2>
                <p className="text-foreground/70 text-sm mb-4 max-w-2xl">
                    Explore our comprehensive guides and start building your content management system today.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <a
                        href="/docs/quick-start"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90 transition-colors"
                    >
                        Quick Start Guide
                        <ArrowRight className="w-4 h-4" />
                    </a>
                    <a
                        href="/docs/api"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border hover:bg-foreground/5 transition-colors"
                    >
                        API Reference
                        <Code2 className="w-4 h-4" />
                    </a>
                </div>
            </section>
        </div>
    );
}
