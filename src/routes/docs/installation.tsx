import { createFileRoute } from "@tanstack/react-router";
import { Download, Code2, CheckCircle, AlertCircle, ArrowRight, Terminal } from "lucide-react";

export const Route = createFileRoute("/docs/installation")({
    component: Installation,
});

function Installation() {
    const installationMethods = [
        {
            title: "npm",
            description: "Install via npm package manager",
            code: "npm install @cortext/sdk",
            icon: "📦",
            popular: true
        },
        {
            title: "yarn",
            description: "Install via yarn package manager",
            code: "yarn add @cortext/sdk",
            icon: "🧶",
            popular: false
        },
        {
            title: "pnpm",
            description: "Install via pnpm package manager",
            code: "pnpm add @cortext/sdk",
            icon: "⚡",
            popular: false
        },
        {
            title: "CDN",
            description: "Include via CDN (browser only)",
            code: '<script src="https://cdn.cortext.com/sdk/latest/cortext.min.js"></script>',
            icon: "🌐",
            popular: false
        }
    ];

    const systemRequirements = [
        {
            category: "Node.js",
            requirements: ["Node.js 18.0.0 or higher", "npm 8.0.0 or higher"],
            optional: false
        },
        {
            category: "Browser Support",
            requirements: ["Chrome 90+", "Firefox 88+", "Safari 14+", "Edge 90+"],
            optional: false
        },
        {
            category: "Operating Systems",
            requirements: ["Windows 10+", "macOS 10.15+", "Linux (Ubuntu 18.04+)"],
            optional: false
        },
        {
            category: "Development Tools",
            requirements: ["VS Code (recommended)", "Git 2.20+", "Docker (optional)"],
            optional: true
        }
    ];

    const setupSteps = [
        {
            step: 1,
            title: "Create a new project",
            description: "Initialize a new project or add to existing one",
            code: "mkdir my-cortext-app\ncd my-cortext-app\nnpm init -y"
        },
        {
            step: 2,
            title: "Install Cortext SDK",
            description: "Add the Cortext SDK to your project",
            code: "npm install @cortext/sdk"
        },
        {
            step: 3,
            title: "Get API credentials",
            description: "Sign up and get your API key from the dashboard",
            code: "# Visit https://cortext.com/dashboard\n# Copy your API key and project ID"
        },
        {
            step: 4,
            title: "Configure environment",
            description: "Set up your environment variables",
            code: "# Create .env file\necho 'CORTEXT_API_KEY=your_api_key_here' > .env\necho 'CORTEXT_PROJECT_ID=your_project_id' >> .env"
        },
        {
            step: 5,
            title: "Initialize the SDK",
            description: "Set up the Cortext client in your application",
            code: `import { Cortext } from '@cortext/sdk';

const cortext = new Cortext({
  apiKey: process.env.CORTEXT_API_KEY,
  projectId: process.env.CORTEXT_PROJECT_ID
});`
        },
        {
            step: 6,
            title: "Test the connection",
            description: "Verify everything is working correctly",
            code: `// Test the connection
async function testConnection() {
  try {
    const projects = await cortext.projects.list();
    console.log('Connected successfully!', projects);
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();`
        }
    ];

    const troubleshooting = [
        {
            problem: "Module not found error",
            solution: "Make sure you've installed the SDK and are importing it correctly",
            code: "npm install @cortext/sdk\n# or\nyarn add @cortext/sdk"
        },
        {
            problem: "API key invalid",
            solution: "Check your API key in the dashboard and ensure it's correctly set in your environment",
            code: "echo $CORTEXT_API_KEY\n# Should show your API key"
        },
        {
            problem: "Network connection failed",
            solution: "Check your internet connection and firewall settings",
            code: "curl -I https://api.cortext.com\n# Should return 200 OK"
        },
        {
            problem: "TypeScript errors",
            solution: "Install TypeScript types and ensure proper configuration",
            code: "npm install @types/node typescript\ntsc --init"
        }
    ];

    return (
        <div className="space-y-12">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-4">Installation</h1>
                <p className="text-lg text-foreground/70">
                    Get started with Cortext by installing our SDK and setting up your development environment. Choose the installation method that works best for your project.
                </p>
            </div>

            {/* Installation Methods */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Installation Methods</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {installationMethods.map((method, index) => (
                        <div key={index} className={`p-6 rounded-xl border ${method.popular ? 'border-foreground/20' : 'border-foreground/10'} hover:border-foreground/20 transition-colors`}>
                            <div className="flex items-start gap-4">
                                <div className="text-2xl">{method.icon}</div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="font-semibold text-lg">{method.title}</h3>
                                        {method.popular && (
                                            <span className="px-2 py-1 rounded-full text-xs bg-foreground/10 text-foreground/80">
                                                Popular
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-foreground/70 mb-4">{method.description}</p>
                                    <div className="rounded-lg border overflow-hidden">
                                        <div className="px-4 py-2 bg-foreground/5 border-b text-sm font-medium flex items-center gap-2">
                                            <Terminal className="w-4 h-4" />
                                            Command
                                        </div>
                                        <pre className="p-4 text-sm overflow-x-auto">
                                            <code className="text-foreground/80">{method.code}</code>
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* System Requirements */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">System Requirements</h2>
                <div className="space-y-6">
                    {systemRequirements.map((req, index) => (
                        <div key={index} className="border rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle className="w-4 h-4 text-foreground" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <h3 className="font-semibold text-lg">{req.category}</h3>
                                        {req.optional && (
                                            <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                Optional
                                            </span>
                                        )}
                                    </div>
                                    <ul className="space-y-1">
                                        {req.requirements.map((requirement, reqIndex) => (
                                            <li key={reqIndex} className="flex items-center gap-2 text-sm text-foreground/70">
                                                <CheckCircle className="w-3 h-3 text-green-500" />
                                                {requirement}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Setup Steps */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Setup Guide</h2>
                <div className="space-y-8">
                    {setupSteps.map((step, index) => (
                        <div key={index} className="border rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold">
                                        {step.step}
                                    </div>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                                        <p className="text-foreground/70">{step.description}</p>
                                    </div>
                                    <div className="rounded-lg border overflow-hidden">
                                        <div className="px-4 py-2 bg-foreground/5 border-b text-sm font-medium flex items-center gap-2">
                                            <Terminal className="w-4 h-4" />
                                            Terminal
                                        </div>
                                        <pre className="p-4 text-sm overflow-x-auto">
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
                                Installation Complete!
                            </h3>
                            <p className="text-green-700 dark:text-green-300 mb-4">
                                If you can run the test connection code without errors, your installation is successful.
                            </p>
                            <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
                                <p>✅ SDK installed correctly</p>
                                <p>✅ Environment variables configured</p>
                                <p>✅ API connection established</p>
                                <p>✅ Ready to start building!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Troubleshooting */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Troubleshooting</h2>
                <div className="space-y-4">
                    {troubleshooting.map((item, index) => (
                        <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="font-semibold mb-2">{item.problem}</h3>
                                    <p className="text-foreground/70 text-sm mb-3">{item.solution}</p>
                                    <div className="rounded-lg border overflow-hidden">
                                        <div className="px-3 py-2 bg-foreground/5 border-b text-xs font-medium">
                                            Solution
                                        </div>
                                        <pre className="p-3 text-xs overflow-x-auto">
                                            <code className="text-foreground/80">{item.code}</code>
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Next Steps */}
            <section className="text-center py-12 bg-foreground/5 rounded-2xl">
                <h2 className="text-2xl font-semibold mb-4">Ready to start building?</h2>
                <p className="text-foreground/70 mb-8 max-w-2xl mx-auto">
                    Now that you have Cortext installed, explore our guides to learn how to create amazing content management systems.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                        href="/docs/quick-start"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90 transition-colors"
                    >
                        Quick Start Guide
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
