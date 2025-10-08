import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle, ArrowRight, Code2, Zap, Users, Settings } from "lucide-react";

export const Route = createFileRoute("/docs/quick-start")({
    component: QuickStart,
});

function QuickStart() {
    const prerequisites = [
        "Node.js 18+ installed",
        "A code editor (VS Code recommended)",
        "Basic knowledge of JavaScript/TypeScript",
        "Git for version control"
    ];

    const steps = [
        {
            title: "Install Cortext CLI",
            description: "Install our command-line tool to get started quickly.",
            code: "npm install -g @cortext/cli",
            details: "The CLI provides commands for project initialization, deployment, and local development."
        },
        {
            title: "Create a new project",
            description: "Initialize a new Cortext project in your workspace.",
            code: "cortext init my-blog",
            details: "This creates a new directory with all necessary files and configurations."
        },
        {
            title: "Configure your project",
            description: "Set up your project settings and connect to your backend.",
            code: `# .env.local
CORTEXT_API_URL=https://api.cortext.com
CORTEXT_API_KEY=your_api_key_here
CORTEXT_PROJECT_ID=your_project_id`,
            details: "Environment variables are used to configure API connections and authentication."
        },
        {
            title: "Start the development server",
            description: "Launch the local development environment.",
            code: "npm run dev",
            details: "This starts the development server on http://localhost:3000 with hot reloading."
        },
        {
            title: "Create your first article",
            description: "Use the dashboard to create and edit your first piece of content.",
            code: `// Example: Creating an article programmatically
const article = await cortext.articles.create({
  title: "Welcome to Cortext",
  content: [
    {
      type: "text",
      data: "This is my first article using Cortext!"
    }
  ],
  status: "draft"
});`,
            details: "Articles are composed of blocks that can be text, images, code, or custom components."
        }
    ];

    const nextSteps = [
        {
            icon: Code2,
            title: "Learn about Blocks",
            description: "Understand how to use different content blocks effectively.",
            href: "/docs/blocks"
        },
        {
            icon: Zap,
            title: "AI Co-author Setup",
            description: "Configure AI assistance for content generation and optimization.",
            href: "/docs/ai-coauthor"
        },
        {
            icon: Users,
            title: "Team Collaboration",
            description: "Set up team members and collaboration features.",
            href: "/docs/collaboration"
        },
        {
            icon: Settings,
            title: "API Integration",
            description: "Integrate Cortext with your existing applications.",
            href: "/docs/api"
        }
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight mb-3">Quick Start Guide</h1>
                <p className="text-base text-foreground/70">
                    Get up and running with Cortext in under 5 minutes. This guide will walk you through the essential steps to create your first content management system.
                </p>
            </div>

            {/* Prerequisites */}
            <section>
                <h2 className="text-xl font-semibold mb-4">Prerequisites</h2>
                <p className="text-foreground/70 text-sm mb-3">
                    Before you begin, make sure you have the following installed and configured:
                </p>
                <ul className="space-y-1">
                    {prerequisites.map((item, index) => (
                        <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-foreground/80">{item}</span>
                        </li>
                    ))}
                </ul>
            </section>

            {/* Installation Steps */}
            <section>
                <h2 className="text-xl font-semibold mb-4">Installation Steps</h2>
                <div className="space-y-4">
                    {steps.map((step, index) => (
                        <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                    <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-semibold">
                                        {index + 1}
                                    </div>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div>
                                        <h3 className="font-semibold text-base mb-1">{step.title}</h3>
                                        <p className="text-foreground/70 text-sm mb-2">{step.description}</p>
                                        <p className="text-xs text-foreground/60">{step.details}</p>
                                    </div>
                                    <div className="rounded-lg border overflow-hidden">
                                        <div className="px-3 py-1.5 bg-foreground/5 border-b text-xs font-medium flex items-center gap-2">
                                            <Code2 className="w-3 h-3" />
                                            Terminal
                                        </div>
                                        <pre className="p-3 text-xs overflow-x-auto">
                                            <code className="text-foreground/80">{step.code}</code>
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Verification */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Verify Installation</h2>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                                Success! Your Cortext installation is complete.
                            </h3>
                            <p className="text-green-700 dark:text-green-300 mb-4">
                                You should now be able to access your dashboard at <code className="bg-green-100 dark:bg-green-800 px-2 py-1 rounded text-sm">http://localhost:3000</code> and see the welcome screen.
                            </p>
                            <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
                                <p>✅ Development server running</p>
                                <p>✅ Database connected</p>
                                <p>✅ API endpoints accessible</p>
                                <p>✅ Authentication configured</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Next Steps */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">What's Next?</h2>
                <p className="text-foreground/70 mb-8">
                    Now that you have Cortext running, explore these guides to unlock its full potential:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {nextSteps.map((step, index) => (
                        <a
                            key={index}
                            href={step.href}
                            className="group p-6 rounded-xl border hover:border-foreground/20 transition-colors"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-foreground/10 flex items-center justify-center flex-shrink-0 group-hover:bg-foreground/20 transition-colors">
                                    <step.icon className="w-5 h-5 text-foreground" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-2 group-hover:text-foreground/80 transition-colors">
                                        {step.title}
                                    </h3>
                                    <p className="text-foreground/70 mb-3">{step.description}</p>
                                    <div className="flex items-center gap-2 text-sm text-foreground/60 group-hover:text-foreground/80 transition-colors">
                                        <span>Learn more</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </section>

            {/* Troubleshooting */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Troubleshooting</h2>
                <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2">Port already in use</h3>
                        <p className="text-foreground/70 text-sm mb-2">
                            If you get an error about port 3000 being in use, try:
                        </p>
                        <code className="text-sm bg-foreground/5 px-2 py-1 rounded">npm run dev -- --port 3001</code>
                    </div>
                    <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2">API connection failed</h3>
                        <p className="text-foreground/70 text-sm mb-2">
                            Make sure your environment variables are set correctly:
                        </p>
                        <code className="text-sm bg-foreground/5 px-2 py-1 rounded">cortext config --check</code>
                    </div>
                    <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2">Need help?</h3>
                        <p className="text-foreground/70 text-sm">
                            Check our <a href="/docs" className="text-foreground hover:underline">documentation</a> or join our <a href="https://discord.gg/cortext" className="text-foreground hover:underline">Discord community</a> for support.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
