import { createFileRoute } from "@tanstack/react-router";
import { Code2, CheckCircle, ExternalLink, Copy, Download, Star, Github } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/api/sdks")({
    component: APISDKs,
});

function APISDKs() {
    const sdks = [
        {
            name: "JavaScript/TypeScript",
            description: "Official SDK for web and Node.js applications",
            icon: "🟨",
            language: "JavaScript",
            version: "2.1.0",
            install: "npm install @cortext/sdk",
            features: [
                "TypeScript support",
                "Promise-based API",
                "Auto-retry logic",
                "Browser & Node.js support",
                "Tree-shaking support"
            ],
            codeExample: `import { Cortext } from '@cortext/sdk';

const cortext = new Cortext({
  apiKey: process.env.CORTEXT_API_KEY,
  projectId: process.env.CORTEXT_PROJECT_ID
});

// Create an article
const article = await cortext.articles.create({
  title: "My Article",
  content: [
    {
      type: "text",
      data: "# Hello World"
    }
  ],
  status: "draft"
});`,
            githubUrl: "https://github.com/cortext/sdk-js",
            npmUrl: "https://www.npmjs.com/package/@cortext/sdk",
            status: "stable"
        },
        {
            name: "Python",
            description: "Official SDK for Python applications",
            icon: "🐍",
            language: "Python",
            version: "1.8.2",
            install: "pip install cortext-sdk",
            features: [
                "Async/await support",
                "Type hints",
                "Django integration",
                "Flask integration",
                "Pydantic models"
            ],
            codeExample: `from cortext import Cortext

cortext = Cortext(
    api_key=os.getenv('CORTEXT_API_KEY'),
    project_id=os.getenv('CORTEXT_PROJECT_ID')
)

# Create an article
article = await cortext.articles.create(
    title="My Article",
    content=[
        {
            "type": "text",
            "data": "# Hello World"
        }
    ],
    status="draft"
)`,
            githubUrl: "https://github.com/cortext/sdk-python",
            pypiUrl: "https://pypi.org/project/cortext-sdk/",
            status: "stable"
        },
        {
            name: "PHP",
            description: "Official SDK for PHP applications",
            icon: "🐘",
            language: "PHP",
            version: "1.5.1",
            install: "composer require cortext/sdk",
            features: [
                "Composer support",
                "Laravel integration",
                "PSR-4 autoloading",
                "Symfony integration",
                "Guzzle HTTP client"
            ],
            codeExample: `<?php
use Cortext\\Cortext;

$cortext = new Cortext([
    'api_key' => $_ENV['CORTEXT_API_KEY'],
    'project_id' => $_ENV['CORTEXT_PROJECT_ID']
]);

// Create an article
$article = $cortext->articles()->create([
    'title' => 'My Article',
    'content' => [
        [
            'type' => 'text',
            'data' => '# Hello World'
        ]
    ],
    'status' => 'draft'
]);`,
            githubUrl: "https://github.com/cortext/sdk-php",
            packagistUrl: "https://packagist.org/packages/cortext/sdk",
            status: "stable"
        },
        {
            name: "Go",
            description: "Official SDK for Go applications",
            icon: "🐹",
            language: "Go",
            version: "1.3.0",
            install: "go get github.com/cortext/sdk-go",
            features: [
                "Context support",
                "Struct tags",
                "Gin integration",
                "Echo integration",
                "gRPC support"
            ],
            codeExample: `package main

import (
    "context"
    "github.com/cortext/sdk-go"
)

func main() {
    client := cortext.NewClient(&cortext.Config{
        APIKey:    os.Getenv("CORTEXT_API_KEY"),
        ProjectID: os.Getenv("CORTEXT_PROJECT_ID"),
    })

    article, err := client.Articles.Create(context.Background(), &cortext.CreateArticleRequest{
        Title: "My Article",
        Content: []cortext.Block{
            {
                Type: "text",
                Data: "# Hello World",
            },
        },
        Status: "draft",
    })
}`,
            githubUrl: "https://github.com/cortext/sdk-go",
            pkgUrl: "https://pkg.go.dev/github.com/cortext/sdk-go",
            status: "stable"
        },
        {
            name: "Java",
            description: "Official SDK for Java applications",
            icon: "☕",
            language: "Java",
            version: "1.2.0",
            install: "Maven/Gradle dependency",
            features: [
                "Spring Boot integration",
                "Jackson serialization",
                "OkHttp client",
                "Maven & Gradle support",
                "Android support"
            ],
            codeExample: `import com.cortext.sdk.Cortext;
import com.cortext.sdk.models.*;

Cortext client = new Cortext.Builder()
    .apiKey(System.getenv("CORTEXT_API_KEY"))
    .projectId(System.getenv("CORTEXT_PROJECT_ID"))
    .build();

// Create an article
Article article = client.articles().create(ArticleCreateRequest.builder()
    .title("My Article")
    .content(Arrays.asList(
        Block.builder()
            .type("text")
            .data("# Hello World")
            .build()
    ))
    .status("draft")
    .build());`,
            githubUrl: "https://github.com/cortext/sdk-java",
            mavenUrl: "https://mvnrepository.com/artifact/com.cortext/sdk",
            status: "stable"
        },
        {
            name: "C#",
            description: "Official SDK for .NET applications",
            icon: "🔷",
            language: "C#",
            version: "1.1.0",
            install: "dotnet add package Cortext.Sdk",
            features: [
                "ASP.NET Core integration",
                "Async/await support",
                "Newtonsoft.Json",
                "HttpClient support",
                "NuGet package"
            ],
            codeExample: `using Cortext.Sdk;

var client = new CortextClient(new CortextConfig
{
    ApiKey = Environment.GetEnvironmentVariable("CORTEXT_API_KEY"),
    ProjectId = Environment.GetEnvironmentVariable("CORTEXT_PROJECT_ID")
});

// Create an article
var article = await client.Articles.CreateAsync(new CreateArticleRequest
{
    Title = "My Article",
    Content = new[]
    {
        new Block
        {
            Type = "text",
            Data = "# Hello World"
        }
    },
    Status = "draft"
});`,
            githubUrl: "https://github.com/cortext/sdk-dotnet",
            nugetUrl: "https://www.nuget.org/packages/Cortext.Sdk",
            status: "stable"
        }
    ];

    const communitySdks = [
        {
            name: "Ruby",
            description: "Community-maintained SDK for Ruby",
            language: "Ruby",
            install: "gem install cortext-sdk",
            githubUrl: "https://github.com/community/cortext-sdk-ruby",
            status: "community"
        },
        {
            name: "Swift",
            description: "Community-maintained SDK for Swift/iOS",
            language: "Swift",
            install: "Swift Package Manager",
            githubUrl: "https://github.com/community/cortext-sdk-swift",
            status: "community"
        },
        {
            name: "Kotlin",
            description: "Community-maintained SDK for Kotlin/Android",
            language: "Kotlin",
            install: "Gradle dependency",
            githubUrl: "https://github.com/community/cortext-sdk-kotlin",
            status: "community"
        }
    ];

    return (
        <div className="space-y-12">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-4">Official SDKs</h1>
                <p className="text-lg text-foreground/70">
                    Choose from our official SDKs for popular programming languages. 
                    Each SDK is designed to make it easy to integrate Cortext into your application.
                </p>
            </div>

            {/* Official SDKs */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Official SDKs</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {sdks.map((sdk, index) => (
                        <div key={index} className="border rounded-xl p-6">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="text-3xl">{sdk.icon}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-semibold">{sdk.name}</h3>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            sdk.status === 'stable' 
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                        }`}>
                                            {sdk.status}
                                        </span>
                                    </div>
                                    <p className="text-foreground/70 text-sm mb-3">{sdk.description}</p>
                                    <div className="flex items-center gap-4 text-sm text-foreground/60">
                                        <span>v{sdk.version}</span>
                                        <span>•</span>
                                        <span>{sdk.language}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="mb-4">
                                <h4 className="font-semibold text-sm mb-2">Features</h4>
                                <div className="grid grid-cols-1 gap-1">
                                    {sdk.features.map((feature, featureIndex) => (
                                        <div key={featureIndex} className="flex items-center gap-2 text-sm">
                                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            <span className="text-foreground/70">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Install Command */}
                            <div className="mb-4">
                                <h4 className="font-semibold text-sm mb-2">Installation</h4>
                                <div className="bg-foreground/5 rounded-lg p-3">
                                    <div className="flex items-center justify-between">
                                        <code className="text-sm font-mono text-foreground/80">{sdk.install}</code>
                                        <button className="flex items-center gap-1 text-xs text-foreground/60 hover:text-foreground/80 transition-colors">
                                            <Copy className="w-3 h-3" />
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Code Example */}
                            <div className="mb-4">
                                <h4 className="font-semibold text-sm mb-2">Quick Example</h4>
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="px-3 py-2 bg-foreground/5 border-b text-xs font-medium flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <Code2 className="w-3 h-3" />
                                            {sdk.language}
                                        </span>
                                        <button className="flex items-center gap-1 text-xs text-foreground/60 hover:text-foreground/80 transition-colors">
                                            <Copy className="w-3 h-3" />
                                            Copy
                                        </button>
                                    </div>
                                    <pre className="p-3 text-xs overflow-x-auto">
                                        <code className="text-foreground/80">{sdk.codeExample}</code>
                                    </pre>
                                </div>
                            </div>

                            {/* Links */}
                            <div className="flex items-center gap-3">
                                <a
                                    href={sdk.githubUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground transition-colors"
                                >
                                    <Github className="w-4 h-4" />
                                    GitHub
                                </a>
                                {sdk.npmUrl && (
                                    <a
                                        href={sdk.npmUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        Package
                                    </a>
                                )}
                                {sdk.pypiUrl && (
                                    <a
                                        href={sdk.pypiUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        PyPI
                                    </a>
                                )}
                                {sdk.packagistUrl && (
                                    <a
                                        href={sdk.packagistUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        Packagist
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Community SDKs */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Community SDKs</h2>
                <p className="text-foreground/70 mb-6">
                    Community-maintained SDKs for additional languages. These are not officially supported 
                    but are maintained by the community.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {communitySdks.map((sdk, index) => (
                        <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold">{sdk.name}</h3>
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    community
                                </span>
                            </div>
                            <p className="text-sm text-foreground/70 mb-3">{sdk.description}</p>
                            <div className="space-y-2">
                                <div className="text-xs font-mono bg-foreground/5 rounded p-2">
                                    {sdk.install}
                                </div>
                                <a
                                    href={sdk.githubUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                                >
                                    <Github className="w-4 h-4" />
                                    View on GitHub
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* SDK Comparison */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">SDK Comparison</h2>
                <div className="overflow-x-auto">
                    <table className="w-full border rounded-lg overflow-hidden">
                        <thead className="bg-foreground/5">
                            <tr>
                                <th className="text-left p-4 font-semibold">Language</th>
                                <th className="text-left p-4 font-semibold">Version</th>
                                <th className="text-left p-4 font-semibold">TypeScript</th>
                                <th className="text-left p-4 font-semibold">Async/Await</th>
                                <th className="text-left p-4 font-semibold">Framework Integration</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            <tr>
                                <td className="p-4 font-medium">JavaScript/TypeScript</td>
                                <td className="p-4 text-sm text-foreground/70">2.1.0</td>
                                <td className="p-4">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                </td>
                                <td className="p-4">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                </td>
                                <td className="p-4 text-sm text-foreground/70">React, Vue, Angular</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-medium">Python</td>
                                <td className="p-4 text-sm text-foreground/70">1.8.2</td>
                                <td className="p-4">
                                    <span className="text-foreground/40">-</span>
                                </td>
                                <td className="p-4">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                </td>
                                <td className="p-4 text-sm text-foreground/70">Django, Flask</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-medium">PHP</td>
                                <td className="p-4 text-sm text-foreground/70">1.5.1</td>
                                <td className="p-4">
                                    <span className="text-foreground/40">-</span>
                                </td>
                                <td className="p-4">
                                    <span className="text-foreground/40">-</span>
                                </td>
                                <td className="p-4 text-sm text-foreground/70">Laravel, Symfony</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-medium">Go</td>
                                <td className="p-4 text-sm text-foreground/70">1.3.0</td>
                                <td className="p-4">
                                    <span className="text-foreground/40">-</span>
                                </td>
                                <td className="p-4">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                </td>
                                <td className="p-4 text-sm text-foreground/70">Gin, Echo</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-medium">Java</td>
                                <td className="p-4 text-sm text-foreground/70">1.2.0</td>
                                <td className="p-4">
                                    <span className="text-foreground/40">-</span>
                                </td>
                                <td className="p-4">
                                    <span className="text-foreground/40">-</span>
                                </td>
                                <td className="p-4 text-sm text-foreground/70">Spring Boot</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-medium">C#</td>
                                <td className="p-4 text-sm text-foreground/70">1.1.0</td>
                                <td className="p-4">
                                    <span className="text-foreground/40">-</span>
                                </td>
                                <td className="p-4">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                </td>
                                <td className="p-4 text-sm text-foreground/70">ASP.NET Core</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Next Steps */}
            <section className="text-center py-12 bg-foreground/5 rounded-2xl">
                <h2 className="text-2xl font-semibold mb-4">Ready to integrate?</h2>
                <p className="text-foreground/70 mb-8 max-w-2xl mx-auto">
                    Choose your preferred SDK and start building amazing content experiences with Cortext.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/docs/api/get-started"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90 transition-colors"
                    >
                        <Code2 className="w-4 h-4" />
                        Get Started Guide
                    </Link>
                    <Link
                        to="/docs/api/specification"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-medium border hover:bg-foreground/5 transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        API Reference
                    </Link>
                </div>
            </section>
        </div>
    );
}
