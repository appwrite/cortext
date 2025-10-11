import { createFileRoute } from "@tanstack/react-router";
import { Key, Shield, AlertTriangle, Copy, CheckCircle, ExternalLink, Eye, EyeOff } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/api/auth-and-keys")({
    component: APIAuthAndKeys,
});

function APIAuthAndKeys() {
    const authMethods = [
        {
            title: "API Key Authentication",
            description: "The primary method for authenticating API requests",
            icon: Key,
            recommended: true,
            content: (
                <div className="space-y-4">
                    <p className="text-foreground/70">
                        API keys are the recommended authentication method for most applications. 
                        They provide secure access to your Cortext resources and are easy to implement.
                    </p>
                    <div className="bg-foreground/5 rounded-lg p-4">
                        <h4 className="font-semibold mb-2">How it works:</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-foreground/70">
                            <li>Include your API key in the Authorization header</li>
                            <li>Use the format: <code className="bg-foreground/10 px-1 rounded">Authorization: Bearer YOUR_API_KEY</code></li>
                            <li>The API validates the key and grants access to your resources</li>
                        </ol>
                    </div>
                </div>
            )
        },
        {
            title: "JWT Token Authentication",
            description: "For applications that need user-specific authentication",
            icon: Shield,
            recommended: false,
            content: (
                <div className="space-y-4">
                    <p className="text-foreground/70">
                        JWT tokens are used for user-specific authentication when you need to access 
                        resources on behalf of a specific user.
                    </p>
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">Advanced Usage</h4>
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    JWT authentication is typically used in web applications where users sign in 
                                    and you need to make API calls on their behalf.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    const rateLimits = [
        {
            plan: "Free",
            requests: "100",
            period: "per minute",
            burst: "200",
            description: "Perfect for development and testing"
        },
        {
            plan: "Pro",
            requests: "1,000",
            period: "per minute",
            burst: "2,000",
            description: "Ideal for production applications"
        },
        {
            plan: "Enterprise",
            requests: "10,000",
            period: "per minute",
            burst: "20,000",
            description: "For high-volume applications"
        }
    ];

    const securityBestPractices = [
        {
            title: "Keep your API key secure",
            description: "Never expose your API key in client-side code or public repositories",
            icon: Shield
        },
        {
            title: "Use environment variables",
            description: "Store API keys in environment variables, not in your code",
            icon: Key
        },
        {
            title: "Rotate keys regularly",
            description: "Generate new API keys periodically and revoke old ones",
            icon: CheckCircle
        },
        {
            title: "Monitor usage",
            description: "Keep track of API usage to detect any unauthorized access",
            icon: AlertTriangle
        }
    ];

    return (
        <div className="space-y-12">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-4">Authentication & API Keys</h1>
                <p className="text-lg text-foreground/70">
                    Learn how to authenticate with the Cortext API using API keys and other authentication methods. 
                    Secure your API access and understand rate limiting policies.
                </p>
            </div>

            {/* Authentication Methods */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Authentication Methods</h2>
                <div className="space-y-6">
                    {authMethods.map((method, index) => (
                        <div key={index} className="border rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <method.icon className="w-6 h-6 text-primary" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-semibold">{method.title}</h3>
                                        {method.recommended && (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                Recommended
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-foreground/70 mb-4">{method.description}</p>
                                    {method.content}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Getting API Keys */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Getting Your API Key</h2>
                <div className="space-y-6">
                    <div className="border rounded-xl p-6">
                        <h3 className="text-xl font-semibold mb-4">Step-by-step guide</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold flex-shrink-0">
                                    1
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">Sign up for Cortext</h4>
                                    <p className="text-foreground/70 text-sm">
                                        Create your Cortext account if you haven't already. You can sign up for free.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold flex-shrink-0">
                                    2
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">Access your dashboard</h4>
                                    <p className="text-foreground/70 text-sm">
                                        Log in to your Cortext dashboard and navigate to the API Keys section.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold flex-shrink-0">
                                    3
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">Generate a new key</h4>
                                    <p className="text-foreground/70 text-sm">
                                        Click "Generate New Key" and give it a descriptive name for your application.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold flex-shrink-0">
                                    4
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">Copy and store securely</h4>
                                    <p className="text-foreground/70 text-sm">
                                        Copy your API key and store it securely. You won't be able to see it again.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6">
                            <Link
                                to="/content"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90 transition-colors"
                            >
                                Get API Key
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Using API Keys */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Using Your API Key</h2>
                <div className="space-y-6">
                    <div className="border rounded-xl p-6">
                        <h3 className="text-xl font-semibold mb-4">HTTP Headers</h3>
                        <p className="text-foreground/70 mb-4">
                            Include your API key in the Authorization header of all requests to the Cortext API.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold mb-2">cURL Example</h4>
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="px-4 py-2 bg-foreground/5 border-b text-sm font-medium flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <Key className="w-4 h-4" />
                                            cURL
                                        </span>
                                        <button className="flex items-center gap-1 text-xs text-foreground/60 hover:text-foreground/80 transition-colors">
                                            <Copy className="w-3 h-3" />
                                            Copy
                                        </button>
                                    </div>
                                    <pre className="p-4 text-sm overflow-x-auto">
                                        <code className="text-foreground/80">{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  https://api.cortext.com/articles`}</code>
                                    </pre>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">JavaScript Example</h4>
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="px-4 py-2 bg-foreground/5 border-b text-sm font-medium flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <Key className="w-4 h-4" />
                                            JavaScript
                                        </span>
                                        <button className="flex items-center gap-1 text-xs text-foreground/60 hover:text-foreground/80 transition-colors">
                                            <Copy className="w-3 h-3" />
                                            Copy
                                        </button>
                                    </div>
                                    <pre className="p-4 text-sm overflow-x-auto">
                                        <code className="text-foreground/80">{`const response = await fetch('https://api.cortext.com/articles', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const articles = await response.json();`}</code>
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Rate Limiting */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Rate Limiting</h2>
                <div className="space-y-6">
                    <p className="text-foreground/70">
                        API requests are rate limited to ensure fair usage across all users. 
                        Rate limits are applied per API key and reset every minute.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {rateLimits.map((limit, index) => (
                            <div key={index} className="border rounded-xl p-6">
                                <h3 className="font-semibold text-lg mb-2">{limit.plan}</h3>
                                <div className="space-y-2 mb-4">
                                    <div className="text-2xl font-bold text-primary">{limit.requests}</div>
                                    <div className="text-sm text-foreground/60">{limit.period}</div>
                                    <div className="text-xs text-foreground/50">
                                        Burst: {limit.burst} requests
                                    </div>
                                </div>
                                <p className="text-sm text-foreground/70">{limit.description}</p>
                            </div>
                        ))}
                    </div>
                    <div className="bg-foreground/5 rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Rate Limit Headers</h4>
                        <p className="text-sm text-foreground/70 mb-3">
                            Every API response includes headers that show your current rate limit status:
                        </p>
                        <div className="space-y-1 text-sm font-mono text-foreground/80">
                            <div><code>X-RateLimit-Limit</code> - Your rate limit per minute</div>
                            <div><code>X-RateLimit-Remaining</code> - Requests remaining in current window</div>
                            <div><code>X-RateLimit-Reset</code> - Time when the rate limit resets</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Security Best Practices */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Security Best Practices</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {securityBestPractices.map((practice, index) => (
                        <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <practice.icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold mb-1">{practice.title}</h3>
                                    <p className="text-sm text-foreground/70">{practice.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Error Handling */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Authentication Errors</h2>
                <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2">401 Unauthorized</h3>
                        <p className="text-sm text-foreground/70 mb-2">
                            Your API key is invalid, expired, or missing.
                        </p>
                        <div className="bg-foreground/5 rounded p-3">
                            <pre className="text-sm text-foreground/80">{`{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid API key",
    "details": {
      "reason": "The provided API key is invalid or has been revoked"
    }
  }
}`}</pre>
                        </div>
                    </div>
                    <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2">429 Too Many Requests</h3>
                        <p className="text-sm text-foreground/70 mb-2">
                            You've exceeded your rate limit. Wait for the reset time before making more requests.
                        </p>
                        <div className="bg-foreground/5 rounded p-3">
                            <pre className="text-sm text-foreground/80">{`{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded",
    "details": {
      "limit": 100,
      "remaining": 0,
      "resetTime": "2024-01-15T10:31:00Z"
    }
  }
}`}</pre>
                        </div>
                    </div>
                </div>
            </section>

            {/* Next Steps */}
            <section className="text-center py-12 bg-foreground/5 rounded-2xl">
                <h2 className="text-2xl font-semibold mb-4">Ready to start building?</h2>
                <p className="text-foreground/70 mb-8 max-w-2xl mx-auto">
                    Now that you understand authentication, explore our API reference to see all available endpoints.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/docs/api/specification"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90 transition-colors"
                    >
                        <Key className="w-4 h-4" />
                        API Reference
                    </Link>
                    <Link
                        to="/docs/api/get-started"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-medium border hover:bg-foreground/5 transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Get Started Guide
                    </Link>
                </div>
            </section>
        </div>
    );
}
