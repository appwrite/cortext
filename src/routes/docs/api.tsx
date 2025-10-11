import { createFileRoute } from "@tanstack/react-router";
import { Code2, Key, Database, Users, Settings, ArrowRight, Copy, CheckCircle, BookOpen, Zap, Shield } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/api")({
    component: APIOverview,
});

function APIOverview() {
    const features = [
        {
            icon: Code2,
            title: "RESTful API",
            description: "Clean, intuitive REST endpoints for all your content management needs",
            href: "/docs/api/specification"
        },
        {
            icon: Key,
            title: "Authentication",
            description: "Secure API key authentication with role-based access control",
            href: "/docs/api/auth-and-keys"
        },
        {
            icon: Database,
            title: "Content Management",
            description: "Create, update, and manage articles with rich content blocks",
            href: "/docs/api/specification"
        },
        {
            icon: Users,
            title: "Team Collaboration",
            description: "Invite team members and manage permissions for collaborative editing",
            href: "/docs/api/specification"
        },
        {
            icon: Settings,
            title: "AI Integration",
            description: "Leverage AI for content generation, optimization, and suggestions",
            href: "/docs/api/specification"
        },
        {
            icon: Shield,
            title: "Rate Limiting",
            description: "Fair usage policies with generous rate limits for all plans",
            href: "/docs/api/specification"
        }
    ];

    const quickStartSteps = [
        {
            step: 1,
            title: "Get your API key",
            description: "Sign up and generate your API key from the dashboard",
            href: "/docs/api/auth-and-keys"
        },
        {
            step: 2,
            title: "Choose your SDK",
            description: "Install the SDK for your preferred programming language",
            href: "/docs/api/sdks"
        },
        {
            step: 3,
            title: "Make your first request",
            description: "Start with our quick start guide and examples",
            href: "/docs/api/get-started"
        }
    ];

    const codeExample = `import { Cortext } from '@cortext/sdk';

const cortext = new Cortext({
  apiKey: process.env.CORTEXT_API_KEY,
  projectId: process.env.CORTEXT_PROJECT_ID
});

// Create your first article
const article = await cortext.articles.create({
  title: "Hello Cortext!",
  content: [
    {
      type: "text",
      data: "# Welcome to Cortext\\n\\nThis is your first article!"
    }
  ],
  status: "draft"
});

console.log('Article created:', article.id);`;

    return (
        <div className="space-y-16">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-4xl font-bold tracking-tight mb-6">Cortext API</h1>
                <p className="text-xl text-foreground/70 max-w-3xl mx-auto mb-8">
                    Powerful REST API for content management, AI-powered writing assistance, and team collaboration. 
                    Build amazing content experiences with our comprehensive API.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/docs/api/get-started"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90 transition-colors"
                    >
                        Get Started
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                        to="/docs/api/specification"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-medium border hover:bg-foreground/5 transition-colors"
                    >
                        <BookOpen className="w-4 h-4" />
                        API Reference
                    </Link>
                </div>
            </div>

            {/* Quick Start */}
            <section>
                <h2 className="text-3xl font-semibold mb-8 text-center">Quick Start</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {quickStartSteps.map((step) => (
                        <Link
                            key={step.step}
                            to={step.href}
                            className="group block p-6 border rounded-xl hover:border-primary/50 transition-all duration-200"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                                    {step.step}
                                </div>
                                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                    {step.title}
                                </h3>
                            </div>
                            <p className="text-foreground/70 text-sm mb-4">{step.description}</p>
                            <div className="flex items-center text-primary text-sm font-medium">
                                Learn more
                                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section>
                <h2 className="text-3xl font-semibold mb-8 text-center">API Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <Link
                            key={index}
                            to={feature.href}
                            className="group block p-6 border rounded-xl hover:border-primary/50 transition-all duration-200"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <feature.icon className="w-6 h-6 text-primary" />
                                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                    {feature.title}
                                </h3>
                            </div>
                            <p className="text-foreground/70 text-sm mb-4">{feature.description}</p>
                            <div className="flex items-center text-primary text-sm font-medium">
                                Learn more
                                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Code Example */}
            <section>
                <h2 className="text-3xl font-semibold mb-8 text-center">Try it out</h2>
                <div className="max-w-4xl mx-auto">
                    <div className="border rounded-xl overflow-hidden">
                        <div className="px-4 py-3 bg-foreground/5 border-b flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Code2 className="w-4 h-4" />
                                <span className="font-medium">JavaScript SDK Example</span>
                            </div>
                            <button className="flex items-center gap-1 text-xs text-foreground/60 hover:text-foreground/80 transition-colors">
                                <Copy className="w-3 h-3" />
                                Copy
                            </button>
                        </div>
                        <pre className="p-6 text-sm overflow-x-auto">
                            <code className="text-foreground/80">{codeExample}</code>
                        </pre>
                    </div>
                </div>
            </section>

            {/* Base URL */}
            <section>
                <h2 className="text-3xl font-semibold mb-8 text-center">Base URL</h2>
                <div className="max-w-2xl mx-auto">
                    <div className="bg-foreground/5 rounded-xl p-8 text-center">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <Code2 className="w-6 h-6 text-foreground" />
                            <span className="font-mono text-xl">https://api.cortext.com</span>
                        </div>
                        <p className="text-foreground/70">
                            All API requests should be made to this base URL. The API uses HTTPS for all communications.
                        </p>
                    </div>
                </div>
            </section>

            {/* Next Steps */}
            <section className="text-center py-12 bg-foreground/5 rounded-2xl">
                <h2 className="text-3xl font-semibold mb-4">Ready to get started?</h2>
                <p className="text-foreground/70 mb-8 max-w-2xl mx-auto">
                    Choose your next step and start building amazing content experiences with the Cortext API.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/docs/api/get-started"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90 transition-colors"
                    >
                        <Zap className="w-4 h-4" />
                        Quick Start Guide
                    </Link>
                    <Link
                        to="/docs/api/specification"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-medium border hover:bg-foreground/5 transition-colors"
                    >
                        <BookOpen className="w-4 h-4" />
                        Full API Reference
                    </Link>
                </div>
            </section>
        </div>
    );
}

