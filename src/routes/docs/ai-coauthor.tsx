import { createFileRoute } from "@tanstack/react-router";
import { Brain, Sparkles, Zap, Target, BarChart3, ArrowRight, CheckCircle, Code2 } from "lucide-react";

export const Route = createFileRoute("/docs/ai-coauthor")({
    component: AICoauthor,
});

function AICoauthor() {
    const features = [
        {
            icon: Sparkles,
            title: "Content Generation",
            description: "Generate high-quality content from simple prompts and ideas.",
            examples: ["Blog post outlines", "Product descriptions", "Social media posts", "Email campaigns"]
        },
        {
            icon: Target,
            title: "SEO Optimization",
            description: "Automatically optimize content for search engines and readability.",
            examples: ["Keyword suggestions", "Meta descriptions", "Heading structure", "Readability scores"]
        },
        {
            icon: BarChart3,
            title: "Performance Analytics",
            description: "Track and improve content performance with AI insights.",
            examples: ["Engagement metrics", "Conversion tracking", "A/B testing", "Content scoring"]
        },
        {
            icon: Zap,
            title: "Real-time Assistance",
            description: "Get instant suggestions and improvements as you write.",
            examples: ["Grammar checking", "Tone adjustments", "Fact verification", "Style consistency"]
        }
    ];

    const useCases = [
        {
            title: "Blog Writing",
            description: "Create engaging blog posts with AI assistance for research, structure, and optimization.",
            code: `// Generate a blog post outline
const outline = await cortext.ai.generateOutline({
  topic: "The Future of AI in Content Management",
  targetAudience: "developers",
  tone: "professional",
  length: "medium"
});

// Generate content for each section
const content = await cortext.ai.generateContent({
  outline: outline,
  style: "informative",
  includeExamples: true
});`
        },
        {
            title: "Product Descriptions",
            description: "Write compelling product descriptions that convert visitors into customers.",
            code: `// Generate product description
const description = await cortext.ai.generateProductDescription({
  productName: "Cortext Pro",
  features: ["AI co-author", "Team collaboration", "SEO tools"],
  targetAudience: "content creators",
  tone: "persuasive"
});`
        },
        {
            title: "Email Marketing",
            description: "Create personalized email campaigns that resonate with your audience.",
            code: `// Generate email campaign
const email = await cortext.ai.generateEmail({
  type: "newsletter",
  subject: "Weekly Product Updates",
  audience: "existing customers",
  tone: "friendly",
  callToAction: "Learn more"
});`
        }
    ];

    const optimizationExamples = [
        {
            title: "SEO Optimization",
            description: "Improve search engine visibility with AI-powered suggestions.",
            before: "Our product is really good and has many features that users will love.",
            after: "Cortext Pro delivers powerful AI-driven content management with advanced collaboration tools that boost team productivity by 40%.",
            improvements: ["Added specific benefits", "Included keywords", "Improved clarity", "Added metrics"]
        },
        {
            title: "Tone Adjustment",
            description: "Match your content to the right tone for your audience.",
            before: "This is a very important update that you need to know about.",
            after: "Exciting news! We've just released a game-changing update that will transform how you create content.",
            improvements: ["More engaging", "Positive language", "Clear value", "Action-oriented"]
        },
        {
            title: "Readability Enhancement",
            description: "Make complex topics accessible to all readers.",
            before: "The implementation of machine learning algorithms in content management systems necessitates the utilization of sophisticated natural language processing techniques.",
            after: "AI-powered content management uses smart language processing to understand and improve your writing automatically.",
            improvements: ["Simplified language", "Shorter sentences", "Common words", "Clear benefits"]
        }
    ];

    const apiExamples = [
        {
            title: "Basic Content Generation",
            code: `// Generate content from a prompt
const response = await cortext.ai.generate({
  prompt: "Write a blog post about sustainable web development",
  options: {
    maxLength: 1000,
    tone: "professional",
    includeHeadings: true
  }
});

console.log(response.content);`
        },
        {
            title: "Content Optimization",
            code: `// Optimize existing content
const optimized = await cortext.ai.optimize({
  content: "Your existing content here...",
  goals: ["seo", "readability", "engagement"],
  targetAudience: "developers"
});

console.log(optimized.suggestions);`
        },
        {
            title: "Batch Processing",
            code: `// Process multiple articles
const articles = await cortext.articles.list({ status: "draft" });

const optimizedArticles = await Promise.all(
  articles.map(article => 
    cortext.ai.optimize({
      content: article.content,
      goals: ["seo"]
    })
  )
);`
        }
    ];

    return (
        <div className="space-y-12">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-4">AI Co-author</h1>
                <p className="text-lg text-foreground/70">
                    Harness the power of artificial intelligence to create better content faster. Our AI co-author helps you write, optimize, and improve your content with intelligent suggestions and automation.
                </p>
            </div>

            {/* Features Overview */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">AI-Powered Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {features.map((feature, index) => (
                        <div key={index} className="p-6 rounded-xl border hover:border-foreground/20 transition-colors">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-foreground/10 flex items-center justify-center flex-shrink-0">
                                    <feature.icon className="w-5 h-5 text-foreground" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                                    <p className="text-foreground/70 mb-3">{feature.description}</p>
                                    <div className="space-y-1">
                                        {feature.examples.map((example, exampleIndex) => (
                                            <div key={exampleIndex} className="flex items-center gap-2 text-sm text-foreground/60">
                                                <CheckCircle className="w-3 h-3 text-green-500" />
                                                {example}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Use Cases */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Common Use Cases</h2>
                <div className="space-y-8">
                    {useCases.map((useCase, index) => (
                        <div key={index} className="border rounded-xl p-6">
                            <h3 className="font-semibold text-lg mb-3">{useCase.title}</h3>
                            <p className="text-foreground/70 mb-4">{useCase.description}</p>
                            <div className="rounded-lg border overflow-hidden">
                                <div className="px-4 py-2 bg-foreground/5 border-b text-sm font-medium flex items-center gap-2">
                                    <Code2 className="w-4 h-4" />
                                    Code Example
                                </div>
                                <pre className="p-4 text-sm overflow-x-auto">
                                    <code className="text-foreground/80">{useCase.code}</code>
                                </pre>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Optimization Examples */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Content Optimization Examples</h2>
                <div className="space-y-8">
                    {optimizationExamples.map((example, index) => (
                        <div key={index} className="border rounded-xl p-6">
                            <h3 className="font-semibold text-lg mb-3">{example.title}</h3>
                            <p className="text-foreground/70 mb-4">{example.description}</p>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-medium text-sm text-red-600 dark:text-red-400 mb-2">Before</h4>
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                        <p className="text-sm text-foreground/80">{example.before}</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium text-sm text-green-600 dark:text-green-400 mb-2">After</h4>
                                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                        <p className="text-sm text-foreground/80">{example.after}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-4">
                                <h4 className="font-medium text-sm mb-2">Improvements Made:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {example.improvements.map((improvement, improvementIndex) => (
                                        <span key={improvementIndex} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-foreground/5 text-foreground/60">
                                            <CheckCircle className="w-3 h-3" />
                                            {improvement}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* API Reference */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">API Reference</h2>
                <div className="space-y-6">
                    {apiExamples.map((example, index) => (
                        <div key={index} className="border rounded-xl p-6">
                            <h3 className="font-semibold text-lg mb-4">{example.title}</h3>
                            <div className="rounded-lg border overflow-hidden">
                                <div className="px-4 py-2 bg-foreground/5 border-b text-sm font-medium">
                                    JavaScript SDK
                                </div>
                                <pre className="p-4 text-sm overflow-x-auto">
                                    <code className="text-foreground/80">{example.code}</code>
                                </pre>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Best Practices */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Best Practices</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Getting Better Results</h3>
                        <ul className="space-y-2 text-sm text-foreground/70">
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                Be specific with your prompts and requirements
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                Provide context about your target audience
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                Review and edit AI-generated content
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                Use AI as a starting point, not the final result
                            </li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Content Quality</h3>
                        <ul className="space-y-2 text-sm text-foreground/70">
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                Always fact-check AI-generated information
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                Maintain your brand voice and personality
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                Test different prompts to find what works best
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                Use AI suggestions as inspiration, not copy-paste
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">AI Co-author Pricing</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border rounded-xl p-6">
                        <h3 className="font-semibold text-lg mb-2">Free</h3>
                        <p className="text-foreground/70 text-sm mb-4">Basic AI features</p>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>10 AI requests/month</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Basic content generation</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Simple optimization</span>
                            </div>
                        </div>
                    </div>
                    <div className="border rounded-xl p-6 border-foreground/20">
                        <div className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-foreground/80 mb-4">Most Popular</div>
                        <h3 className="font-semibold text-lg mb-2">Pro</h3>
                        <p className="text-foreground/70 text-sm mb-4">Advanced AI features</p>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Unlimited AI requests</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Advanced content generation</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>SEO optimization</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Performance analytics</span>
                            </div>
                        </div>
                    </div>
                    <div className="border rounded-xl p-6">
                        <h3 className="font-semibold text-lg mb-2">Enterprise</h3>
                        <p className="text-foreground/70 text-sm mb-4">Custom AI solutions</p>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Custom AI models</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Brand-specific training</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Priority support</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Custom integrations</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Next Steps */}
            <section className="text-center py-12 bg-foreground/5 rounded-2xl">
                <h2 className="text-2xl font-semibold mb-4">Start using AI Co-author today</h2>
                <p className="text-foreground/70 mb-8 max-w-2xl mx-auto">
                    Transform your content creation process with intelligent AI assistance. Try it free and see the difference.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90 transition-colors"
                    >
                        Try AI Co-author
                        <ArrowRight className="w-4 h-4" />
                    </a>
                    <a
                        href="/docs/api"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-medium border hover:bg-foreground/5 transition-colors"
                    >
                        API Documentation
                        <Code2 className="w-4 h-4" />
                    </a>
                </div>
            </section>
        </div>
    );
}
