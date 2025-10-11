import { createFileRoute } from "@tanstack/react-router";
import { Code2, Key, Database, Users, Settings, ArrowRight, Copy, CheckCircle, BookOpen } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/api/specification")({
    component: APISpecification,
});

function APISpecification() {
    const endpoints = [
        {
            category: "Authentication",
            icon: Key,
            endpoints: [
                {
                    method: "POST",
                    path: "/auth/signup",
                    description: "Create a new user account",
                    parameters: ["email", "password", "name"]
                },
                {
                    method: "POST",
                    path: "/auth/signin",
                    description: "Sign in with email and password",
                    parameters: ["email", "password"]
                },
                {
                    method: "POST",
                    path: "/auth/refresh",
                    description: "Refresh access token",
                    parameters: ["refreshToken"]
                },
                {
                    method: "POST",
                    path: "/auth/signout",
                    description: "Sign out and invalidate tokens",
                    parameters: []
                }
            ]
        },
        {
            category: "Articles",
            icon: Database,
            endpoints: [
                {
                    method: "GET",
                    path: "/articles",
                    description: "List all articles",
                    parameters: ["limit", "offset", "status", "author"]
                },
                {
                    method: "POST",
                    path: "/articles",
                    description: "Create a new article",
                    parameters: ["title", "content", "status", "author"]
                },
                {
                    method: "GET",
                    path: "/articles/:id",
                    description: "Get article by ID",
                    parameters: ["id"]
                },
                {
                    method: "PUT",
                    path: "/articles/:id",
                    description: "Update article",
                    parameters: ["id", "title", "content", "status"]
                },
                {
                    method: "DELETE",
                    path: "/articles/:id",
                    description: "Delete article",
                    parameters: ["id"]
                }
            ]
        },
        {
            category: "Blocks",
            icon: Code2,
            endpoints: [
                {
                    method: "GET",
                    path: "/blocks/types",
                    description: "Get available block types",
                    parameters: []
                },
                {
                    method: "POST",
                    path: "/blocks/validate",
                    description: "Validate block data",
                    parameters: ["type", "data"]
                },
                {
                    method: "POST",
                    path: "/blocks/render",
                    description: "Render block to HTML",
                    parameters: ["type", "data", "style"]
                }
            ]
        },
        {
            category: "Team",
            icon: Users,
            endpoints: [
                {
                    method: "GET",
                    path: "/team/members",
                    description: "List team members",
                    parameters: []
                },
                {
                    method: "POST",
                    path: "/team/invite",
                    description: "Invite team member",
                    parameters: ["email", "role", "message"]
                },
                {
                    method: "PUT",
                    path: "/team/members/:id",
                    description: "Update member role",
                    parameters: ["id", "role"]
                },
                {
                    method: "DELETE",
                    path: "/team/members/:id",
                    description: "Remove team member",
                    parameters: ["id"]
                }
            ]
        },
        {
            category: "AI",
            icon: Settings,
            endpoints: [
                {
                    method: "POST",
                    path: "/ai/generate",
                    description: "Generate content with AI",
                    parameters: ["prompt", "options"]
                },
                {
                    method: "POST",
                    path: "/ai/optimize",
                    description: "Optimize content for SEO",
                    parameters: ["content", "goals"]
                },
                {
                    method: "POST",
                    path: "/ai/suggest",
                    description: "Get content suggestions",
                    parameters: ["content", "context"]
                }
            ]
        }
    ];

    const codeExamples = [
        {
            title: "Basic Setup",
            description: "Initialize the Cortext SDK with your credentials",
            code: `import { Cortext } from '@cortext/sdk';

const cortext = new Cortext({
  apiKey: process.env.CORTEXT_API_KEY,
  projectId: process.env.CORTEXT_PROJECT_ID,
  baseUrl: 'https://api.cortext.com' // optional
});`
        },
        {
            title: "Create Article",
            description: "Create a new article with content blocks",
            code: `const article = await cortext.articles.create({
  title: "Getting Started with Cortext",
  content: [
    {
      type: "text",
      data: "# Welcome to Cortext\\n\\nThis is your first article!"
    },
    {
      type: "image",
      data: {
        src: "https://example.com/image.jpg",
        alt: "Cortext Content"
      }
    }
  ],
  status: "draft"
});`
        },
        {
            title: "AI Content Generation",
            description: "Generate content using AI assistance",
            code: `const generated = await cortext.ai.generate({
  prompt: "Write a blog post about sustainable web development",
  options: {
    maxLength: 1000,
    tone: "professional",
    includeHeadings: true
  }
});`
        },
        {
            title: "Team Collaboration",
            description: "Invite team members and manage permissions",
            code: `// Invite a team member
const invitation = await cortext.team.invite({
  email: "writer@example.com",
  role: "writer",
  message: "Welcome to our content team!"
});

// Add a comment to an article
const comment = await cortext.comments.create({
  articleId: "article_123",
  content: "This section needs more detail",
  position: {
    blockId: "block_456",
    startOffset: 10,
    endOffset: 25
  }
});`
        }
    ];

    const responseExamples = [
        {
            title: "Article Response",
            code: `{
  "id": "article_123",
  "title": "Getting Started with Cortext",
  "content": [
    {
      "id": "block_456",
      "type": "text",
      "data": "# Welcome to Cortext",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "status": "draft",
  "author": {
    "id": "user_789",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}`
        },
        {
            title: "Error Response",
            code: `{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}`
        }
    ];

    return (
        <div className="space-y-12">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-4">API Specification</h1>
                <p className="text-lg text-foreground/70">
                    Complete reference for the Cortext API. Learn how to integrate Cortext into your applications with our RESTful API and JavaScript SDK.
                </p>
            </div>

            {/* Base URL */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Base URL</h2>
                <div className="bg-foreground/5 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Code2 className="w-5 h-5 text-foreground" />
                        <span className="font-mono text-lg">https://api.cortext.com</span>
                    </div>
                    <p className="text-foreground/70">
                        All API requests should be made to this base URL. The API uses HTTPS for all communications.
                    </p>
                </div>
            </section>

            {/* Authentication */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Authentication</h2>
                <div className="space-y-6">
                    <div className="border rounded-xl p-6">
                        <h3 className="font-semibold text-lg mb-3">API Key Authentication</h3>
                        <p className="text-foreground/70 mb-4">
                            Include your API key in the Authorization header of all requests.
                        </p>
                        <div className="rounded-lg border overflow-hidden">
                            <div className="px-4 py-2 bg-foreground/5 border-b text-sm font-medium">
                                Example Request
                            </div>
                            <pre className="p-4 text-sm overflow-x-auto">
                                <code className="text-foreground/80">curl -H "Authorization: Bearer YOUR_API_KEY" \\\n  https://api.cortext.com/articles</code>
                            </pre>
                        </div>
                    </div>
                    <div className="border rounded-xl p-6">
                        <h3 className="font-semibold text-lg mb-3">Rate Limiting</h3>
                        <p className="text-foreground/70 mb-4">
                            API requests are rate limited to ensure fair usage. Rate limits are applied per API key.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="text-center">
                                <div className="font-semibold text-foreground">Free</div>
                                <div className="text-foreground/60">100 req/min</div>
                            </div>
                            <div className="text-center">
                                <div className="font-semibold text-foreground">Pro</div>
                                <div className="text-foreground/60">1000 req/min</div>
                            </div>
                            <div className="text-center">
                                <div className="font-semibold text-foreground">Enterprise</div>
                                <div className="text-foreground/60">10000 req/min</div>
                            </div>
                            <div className="text-center">
                                <div className="font-semibold text-foreground">Burst</div>
                                <div className="text-foreground/60">2x limit</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Endpoints */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">API Endpoints</h2>
                <div className="space-y-8">
                    {endpoints.map((category, categoryIndex) => (
                        <div key={categoryIndex} className="border rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <category.icon className="w-6 h-6 text-foreground" />
                                <h3 className="font-semibold text-xl">{category.category}</h3>
                            </div>
                            <div className="space-y-4">
                                {category.endpoints.map((endpoint, endpointIndex) => (
                                    <div key={endpointIndex} className="border rounded-lg p-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2 py-1 rounded text-xs font-mono ${
                                                endpoint.method === 'GET' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                                endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                            }`}>
                                                {endpoint.method}
                                            </span>
                                            <code className="text-sm font-mono text-foreground/80">{endpoint.path}</code>
                                        </div>
                                        <p className="text-foreground/70 text-sm mb-3">{endpoint.description}</p>
                                        {endpoint.parameters.length > 0 && (
                                            <div>
                                                <h4 className="font-medium text-sm text-foreground/80 mb-2">Parameters:</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {endpoint.parameters.map((param, paramIndex) => (
                                                        <span key={paramIndex} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-foreground/5 text-foreground/60">
                                                            <span className="font-mono">{param}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Code Examples */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Code Examples</h2>
                <div className="space-y-6">
                    {codeExamples.map((example, index) => (
                        <div key={index} className="border rounded-xl p-6">
                            <h3 className="font-semibold text-lg mb-3">{example.title}</h3>
                            <p className="text-foreground/70 mb-4">{example.description}</p>
                            <div className="rounded-lg border overflow-hidden">
                                <div className="px-4 py-2 bg-foreground/5 border-b text-sm font-medium flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Code2 className="w-4 h-4" />
                                        JavaScript SDK
                                    </span>
                                    <button className="flex items-center gap-1 text-xs text-foreground/60 hover:text-foreground/80 transition-colors">
                                        <Copy className="w-3 h-3" />
                                        Copy
                                    </button>
                                </div>
                                <pre className="p-4 text-sm overflow-x-auto">
                                    <code className="text-foreground/80">{example.code}</code>
                                </pre>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Response Examples */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Response Examples</h2>
                <div className="space-y-6">
                    {responseExamples.map((example, index) => (
                        <div key={index} className="border rounded-xl p-6">
                            <h3 className="font-semibold text-lg mb-4">{example.title}</h3>
                            <div className="rounded-lg border overflow-hidden">
                                <div className="px-4 py-2 bg-foreground/5 border-b text-sm font-medium">
                                    JSON Response
                                </div>
                                <pre className="p-4 text-sm overflow-x-auto">
                                    <code className="text-foreground/80">{example.code}</code>
                                </pre>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Error Codes */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Error Codes</h2>
                <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2">400 Bad Request</h3>
                        <p className="text-sm text-foreground/70 mb-2">
                            The request was invalid or cannot be served.
                        </p>
                        <div className="bg-foreground/5 rounded p-3">
                            <pre className="text-sm text-foreground/80">{`{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}`}</pre>
                        </div>
                    </div>
                    <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2">401 Unauthorized</h3>
                        <p className="text-sm text-foreground/70 mb-2">
                            Authentication failed or API key is invalid.
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
                            Rate limit exceeded. Wait before making more requests.
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
                <h2 className="text-2xl font-semibold mb-4">Ready to integrate?</h2>
                <p className="text-foreground/70 mb-8 max-w-2xl mx-auto">
                    Start building with our API today. Get your API key and begin creating amazing content management experiences.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/content"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90 transition-colors"
                    >
                        Get API Key
                        <Key className="w-4 h-4" />
                    </Link>
                    <Link
                        to="/docs/api/get-started"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-medium border hover:bg-foreground/5 transition-colors"
                    >
                        Quick Start Guide
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>
        </div>
    );
}
