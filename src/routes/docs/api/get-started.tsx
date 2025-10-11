import { createFileRoute } from "@tanstack/react-router";
import { Code2, Key, Database, Users, Settings, ArrowRight, Copy, CheckCircle, ExternalLink, Terminal } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/api/get-started")({
    component: APIGetStarted,
});

function APIGetStarted() {
    const steps = [
        {
            title: "Get your API key",
            description: "Sign up for a Cortext account and generate your API key",
            icon: Key,
            content: (
                <div className="space-y-4">
                    <p className="text-foreground/70">
                        First, you'll need to create a Cortext account and generate an API key. 
                        This key will authenticate your requests to the API.
                    </p>
                    <div className="bg-foreground/5 rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Steps to get your API key:</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-foreground/70">
                            <li>Sign up for a Cortext account</li>
                            <li>Go to your dashboard</li>
                            <li>Navigate to API Keys section</li>
                            <li>Click "Generate New Key"</li>
                            <li>Copy and securely store your API key</li>
                        </ol>
                    </div>
                    <Link
                        to="/content"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90 transition-colors"
                    >
                        Get API Key
                        <ExternalLink className="w-4 h-4" />
                    </Link>
                </div>
            )
        },
        {
            title: "Install the SDK",
            description: "Choose and install the SDK for your preferred language",
            icon: Code2,
            content: (
                <div className="space-y-4">
                    <p className="text-foreground/70">
                        Cortext provides official SDKs for popular programming languages. 
                        Choose the one that fits your project.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border rounded-lg p-4">
                            <h4 className="font-semibold mb-2">JavaScript/TypeScript</h4>
                            <div className="bg-foreground/5 rounded p-2 mb-2">
                                <code className="text-sm">npm install @cortext/sdk</code>
                            </div>
                            <div className="space-y-1 text-xs text-foreground/60">
                                <div className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                    <span>TypeScript support</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                    <span>Node.js & Browser</span>
                                </div>
                            </div>
                        </div>
                        <div className="border rounded-lg p-4">
                            <h4 className="font-semibold mb-2">Python</h4>
                            <div className="bg-foreground/5 rounded p-2 mb-2">
                                <code className="text-sm">pip install cortext-sdk</code>
                            </div>
                            <div className="space-y-1 text-xs text-foreground/60">
                                <div className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                    <span>Async/await support</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                    <span>Type hints</span>
                                </div>
                            </div>
                        </div>
                        <div className="border rounded-lg p-4">
                            <h4 className="font-semibold mb-2">PHP</h4>
                            <div className="bg-foreground/5 rounded p-2 mb-2">
                                <code className="text-sm">composer require cortext/sdk</code>
                            </div>
                            <div className="space-y-1 text-xs text-foreground/60">
                                <div className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                    <span>Composer support</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                    <span>Laravel integration</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Link
                        to="/docs/api/sdks"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                        View all SDKs
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            )
        },
        {
            title: "Make your first request",
            description: "Create your first article using the API",
            icon: Database,
            content: (
                <div className="space-y-4">
                    <p className="text-foreground/70">
                        Now let's create your first article! This example shows how to create a simple article with text content.
                    </p>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2">Create an Article</h4>
                            <div className="border rounded-lg overflow-hidden">
                                <div className="px-4 py-2 bg-foreground/5 border-b text-sm font-medium flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Code2 className="w-4 h-4" />
                                        JavaScript
                                    </span>
                                    <button className="flex items-center gap-1 text-xs text-foreground/60 hover:text-foreground/80 transition-colors">
                                        <Copy className="w-3 h-3" />
                                        Copy
                                    </button>
                                </div>
                                <pre className="p-4 text-sm overflow-x-auto">
                                    <code className="text-foreground/80">{`// Create a new article
const article = await cortext.articles.create({
  title: "My First Article",
  content: [
    {
      type: "text",
      data: "# Welcome to Cortext!\\n\\nThis is my first article created with the Cortext API."
    }
  ],
  status: "draft"
});

console.log('Article created:', article.id);
console.log('Article title:', article.title);`}</code>
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-12">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-4">Get Started with the API</h1>
                <p className="text-lg text-foreground/70">
                    Learn how to integrate Cortext into your application with our step-by-step guide. 
                    From setup to your first API call, we'll walk you through everything you need to know.
                </p>
            </div>

            {/* Steps */}
            <div className="space-y-8">
                {steps.map((step, index) => (
                    <div key={index} className="border rounded-xl p-8">
                        <div className="flex items-start gap-6">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <step.icon className="w-6 h-6 text-primary" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-4">
                                    <h2 className="text-2xl font-semibold">{step.title}</h2>
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-foreground/10 text-foreground/60">
                                        Step {index + 1}
                                    </span>
                                </div>
                                <p className="text-foreground/70 mb-6">{step.description}</p>
                                {step.content}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Next Steps */}
            <section className="text-center py-12 bg-foreground/5 rounded-2xl">
                <h2 className="text-2xl font-semibold mb-4">Ready for more?</h2>
                <p className="text-foreground/70 mb-8 max-w-2xl mx-auto">
                    Now that you've made your first API call, explore our comprehensive documentation 
                    to unlock the full power of the Cortext API.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/docs/api/specification"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90 transition-colors"
                    >
                        <Code2 className="w-4 h-4" />
                        API Reference
                    </Link>
                    <Link
                        to="/docs/api/auth-and-keys"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-medium border hover:bg-foreground/5 transition-colors"
                    >
                        <Key className="w-4 h-4" />
                        Authentication Guide
                    </Link>
                </div>
            </section>
        </div>
    );
}

