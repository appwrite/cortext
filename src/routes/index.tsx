import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Brain, Sparkles, Type as TypeIcon, Image as ImageIcon, Video as VideoIcon, Map as MapIcon, Quote as QuoteIcon, Code2 as CodeIcon, FileEdit, MessageSquare, History, Github } from "lucide-react";
import { useEffect, useState } from "react";
import { useThemeContext } from "@/contexts/theme-context";
import { OptimizedImage, useImagePreload } from "@/components/ui/optimized-image";
import { UserAvatar } from "@/components/user-avatar";

export const Route = createFileRoute("/")({
    component: Index,
});

function Nav() {
    const { user, isLoading, signOut } = useAuth();

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="relative mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
                <a href="#home" className="font-semibold text-lg tracking-tight inline-flex items-center gap-2">
                    <Brain className="h-6 w-6" />
                    Cortext
                </a>
                <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 gap-6 text-sm items-center">
                    <a href="#features" className="text-foreground/70 hover:text-foreground transition-colors">Features</a>
                    <a href="#api" className="text-foreground/70 hover:text-foreground transition-colors">API</a>
                    <a href="#pricing" className="text-foreground/70 hover:text-foreground transition-colors">Pricing</a>
                    <Link to="/docs" className="text-foreground/70 hover:text-foreground transition-colors">Docs</Link>
                    <a
                        href="https://github.com/appwrite/cortext"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-foreground/20 hover:border-foreground/40 text-foreground/70 hover:text-foreground transition-colors"
                        aria-label="View on GitHub"
                    >
                        <div className="w-4 h-4 rounded-full bg-foreground/10 flex items-center justify-center">
                            <Github className="h-2.5 w-2.5 fill-current" />
                        </div>
                        <span className="text-xs font-medium">6</span>
                    </a>
                </nav>
                <div className="flex items-center gap-3">
                    {!isLoading && (
                        <div className="animate-in fade-in duration-300">
                            {user ? (
                                <div className="flex items-center gap-3">
                                    <Link to="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium border hover:bg-foreground/5 transition-colors">Dashboard</Link>
                                    <UserAvatar user={user} onSignOut={() => signOut.mutate()} />
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Link to="/sign-in" className="px-3 py-2 rounded-md text-sm font-medium border hover:bg-foreground/5 transition-colors">Sign in</Link>
                                    <Link
                                        to="/sign-up"
                                        className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90 transition-colors"
                                    >
                                        Get started
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

function Index() {
    const [count, setCount] = useState(0);
    const { effectiveTheme } = useThemeContext();
    const { user, isLoading } = useAuth();
    
    // Preload the appropriate dashboard image based on theme
    const dashboardImageSrc = effectiveTheme === 'dark' ? "/dashboard-dark.png" : "/dashboard-light.png";
    useImagePreload(dashboardImageSrc, true);

    useEffect(() => {
        const target = 128; // seed value for early signups
        const duration = 800; // ms
        const steps = 40;
        const tick = Math.max(16, Math.floor(duration / steps));
        const increment = Math.max(1, Math.ceil(target / steps));
        let current = 0;
        const id = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(id);
            }
            setCount(current);
        }, tick);
        return () => clearInterval(id);
    }, []);

    // Icon mapping for the block list
    const blocks: { label: string; Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }> }[] = [
        { label: 'Text', Icon: TypeIcon },
        { label: 'Images', Icon: ImageIcon },
        { label: 'Video', Icon: VideoIcon },
        { label: 'Maps', Icon: MapIcon },
        { label: 'Quotes', Icon: QuoteIcon },
        { label: 'Code', Icon: CodeIcon },
    ];

    // Workflow features for drafts, reviews, versioning
    const workflowFeatures: { title: string; desc: string; Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }> }[] = [
        { title: 'Drafts', desc: 'Work in private or shared drafts before publishing.', Icon: FileEdit },
        { title: 'Reviews', desc: 'Request reviews, track comments, and resolve threads.', Icon: MessageSquare },
        { title: 'Versioning', desc: 'Manual versions with diffs and easy restore.', Icon: History },
    ];

    return (
        <div className="min-h-screen flex flex-col" id="home">
            <Nav />

            {/* Hero */}
            <section className="mx-auto w-full max-w-7xl px-8 mb-1 mt-24">
                <div className="mx-auto max-w-3xl text-center mb-10">
                    <p className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-foreground/70">
                        Now available
                    </p>
                    <h1 className="mt-6 mb-6 text-4xl font-semibold tracking-tight md:text-5xl">
                        AI-powered content management
                        </h1>
                    <p className="mt-4 text-base text-foreground/70 md:text-lg">
                        Organize rich content with flexible, sortable blocks. Co-write with an AI assistant trained to boost quality, SEO, and team productivity.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
                        {!isLoading && (
                            <Link
                                to={user ? "/dashboard" : "/sign-up"}
                                className="w-full sm:w-auto px-5 py-3 rounded-md text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90 transition-colors text-center"
                            >
                                {user ? "Go to Dashboard" : "Get started"}
                            </Link>
                        )}
                    </div>
                    {/* <p className="mt-4 text-xs md:text-sm text-foreground/70">
                        <span className="font-semibold text-foreground">{count.toLocaleString()}</span> teams already trusting Cortext
                    </p> */}
                </div>

                {/* Dashboard screenshot that merges with the next separator */}
                <div className="relative mx-auto mt-10 md:mt-12 w-full max-w-6xl -mb-px">
                    <div className="rounded-t-xl border border-b-0 border-foreground/5 bg-card dark:bg-transparent overflow-hidden">
                        <div className="aspect-[16/9] w-full relative dashboard-screenshot">
                            <OptimizedImage
                                src={dashboardImageSrc}
                                alt="Cortext Dashboard - Article Management Interface"
                                className="h-full w-full object-cover filter brightness-95 contrast-110 saturate-90"
                                style={{ objectPosition: 'top center' }}
                                priority={true}
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                                quality={90}
                                placeholder="blur"
                                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                            />
                            <div className={`absolute inset-0 pointer-events-none ${
                                effectiveTheme === 'dark' 
                                    ? 'bg-gradient-to-t from-black/30 via-black/5 to-transparent' 
                                    : 'bg-gradient-to-t from-white/40 via-white/10 to-transparent'
                            }`}></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trusted by */}
            <section className="mx-auto w-full max-w-7xl px-6 py-12 border-t">
                <div className="mx-auto max-w-4xl text-center">
                    <p className="text-sm font-medium text-foreground/70 mb-8">Trusted by</p>
                    <div className="flex items-center justify-center gap-6 sm:gap-8 md:gap-12">
                        <a 
                            href="https://appwrite.io" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:opacity-80 transition-opacity duration-200"
                        >
                            <img 
                                src={effectiveTheme === 'dark' ? "/trusted/appwrite-dark.svg" : "/trusted/appwrite-light.svg"} 
                                alt="Appwrite" 
                                className="h-5 w-auto"
                            />
                        </a>
                        <a 
                            href="https://imagine.dev" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:opacity-80 transition-opacity duration-200"
                        >
                            <img 
                                src={effectiveTheme === 'dark' ? "/trusted/imagine-dark.svg" : "/trusted/imagine-light.svg"} 
                                alt="Imagine" 
                                className="h-6 w-auto"
                            />
                        </a>
                        <a 
                            href="https://refetch.io" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:opacity-80 transition-opacity duration-200"
                        >
                            <img 
                                src={effectiveTheme === 'dark' ? "/trusted/refetch-dark.svg" : "/trusted/refetch-light.svg"} 
                                alt="Refetch" 
                                className="h-5 w-auto"
                            />
                        </a>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="mx-auto w-full max-w-7xl px-6 py-16 md:py-24 border-t">
                <div className="mx-auto max-w-5xl">
                    <div className="text-center mb-16">
                        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl mb-3">Everything you need</h2>
                        <p className="text-foreground/70">AI-powered content management with flexible blocks and team collaboration.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {/* AI Co-author */}
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center flex-shrink-0 mt-1">
                                <Sparkles className="w-4 h-4 text-background" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground/90 mb-1">AI Co-author</h3>
                                <p className="text-sm text-foreground/70">Generate drafts, refine content, and optimize for your audience.</p>
                            </div>
                        </div>

                        {/* Composable Blocks */}
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center flex-shrink-0 mt-1">
                                <CodeIcon className="w-4 h-4 text-background" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground/90 mb-1">Flexible Blocks</h3>
                                <p className="text-sm text-foreground/70 mb-2">Drag, sort, and edit content blocks with confidence.</p>
                                <div className="flex flex-wrap gap-1">
                                    {blocks.map(({ label, Icon }) => (
                                        <span key={label} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-foreground/5 text-foreground/60">
                                            <Icon className="w-3 h-3" />
                                            {label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* SEO Optimization */}
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center flex-shrink-0 mt-1">
                                <svg className="w-4 h-4 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground/90 mb-1">SEO Built-in</h3>
                                <p className="text-sm text-foreground/70">Real-time suggestions and optimization as you write.</p>
                            </div>
                        </div>

                        {/* Workflow Management */}
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center flex-shrink-0 mt-1">
                                <FileEdit className="w-4 h-4 text-background" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground/90 mb-1">Drafts & Reviews</h3>
                                <p className="text-sm text-foreground/70">Stage changes, collect feedback, and roll back when needed.</p>
                            </div>
                        </div>

                        {/* Team Collaboration */}
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center flex-shrink-0 mt-1">
                                <MessageSquare className="w-4 h-4 text-background" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground/90 mb-1">Team Ready</h3>
                                <p className="text-sm text-foreground/70">Multi-user editing with permissions and real-time collaboration.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonial */}
            <section className="mx-auto w-full max-w-7xl px-6 py-16 md:py-24 border-t">
                <div className="mx-auto max-w-4xl text-center">
                    <div className="mb-8">
                        <svg className="mx-auto h-12 w-12 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v9.391h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v9.391h-10z"/>
                        </svg>
                    </div>
                    <blockquote className="text-lg md:text-xl text-foreground/90 font-medium leading-relaxed mb-6">
                        "Cortext transformed our content consistency and SEO. The AI co-author doesn't just speed up writing - it improves quality and search visibility. It's like having a senior content strategist who never sleeps."
                    </blockquote>
                    <div className="flex flex-col items-center">
                        <div className="text-foreground font-semibold">Laura Du Ry</div>
                        <div className="text-foreground/60 text-sm">Growth Lead at Appwrite</div>
                    </div>
                </div>
            </section>

            {/* API Section */}
            <section id="api" className="mx-auto w-full max-w-7xl px-6 py-16 md:py-24 border-t">
                <div className="mx-auto max-w-5xl">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl mb-3">Thoughtfully designed for developers</h2>
                        <p className="text-foreground/70">Built by the engineers behind Appwrite, Imagine, Open Runtimes and Refetch to integrates seamlessly with your existing workflow.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        {/* Features */}
                        <div className="space-y-6 order-2 lg:order-1">
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center flex-shrink-0 mt-1">
                                    <CodeIcon className="w-4 h-4 text-background" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground/90 mb-1">RESTful Design</h3>
                                    <p className="text-sm text-foreground/70">Clean, predictable endpoints that follow REST conventions.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center flex-shrink-0 mt-1">
                                    <svg className="w-4 h-4 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground/90 mb-1">Secure by Default</h3>
                                    <p className="text-sm text-foreground/70">Built-in authentication, rate limiting, and data validation.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center flex-shrink-0 mt-1">
                                    <svg className="w-4 h-4 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground/90 mb-1">Fast & Reliable</h3>
                                    <p className="text-sm text-foreground/70">Sub-100ms response times with 99.9% uptime guarantee.</p>
                                </div>
                            </div>

                            <div className="pt-4">
                                <a 
                                    href="https://appwrite.io/docs" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border hover:bg-foreground/5 transition-colors"
                                >
                                    <CodeIcon className="w-4 h-4" />
                                    View API Documentation
                                </a>
                            </div>
                        </div>

                        {/* Code Example */}
                        <div className="relative order-1 lg:order-2">
                            <div className="rounded-xl border border-foreground/20 overflow-hidden">
                                <div className="px-5 pt-5 pb-2 flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-foreground"></div>
                                        <div className="w-3 h-3 rounded-full bg-foreground"></div>
                                        <div className="w-3 h-3 rounded-full bg-foreground"></div>
                                    </div>
                                    <span className="text-xs font-normal text-foreground">index.ts</span>
                                </div>
                                <div className="p-5 font-mono text-xs leading-relaxed">
                                    <div className="text-foreground">
                                        <span className="text-gray-500">// Create article with type safety</span>
                                        <br />
                                        <span className="text-blue-500 dark:text-blue-400">interface</span> <span className="text-yellow-500 dark:text-yellow-400">Article</span> {`{`}
                                    </div>
                                    <div className="mt-1 text-foreground ml-2">
                                        <span className="text-green-500 dark:text-green-400">  title</span>: <span className="text-blue-500 dark:text-blue-400">string</span>;<br />
                                        <span className="text-green-500 dark:text-green-400">  content</span>: <span className="text-yellow-500 dark:text-yellow-400">Block</span>[];<br />
                                        <span className="text-green-500 dark:text-green-400">  status</span>: <span className="text-orange-500 dark:text-orange-400">'draft'</span> | <span className="text-orange-500 dark:text-orange-400">'published'</span>;<br />
                                        <span className="text-green-500 dark:text-green-400">  createdAt</span>: <span className="text-yellow-500 dark:text-yellow-400">Date</span>;<br />
                                        {`}`}
                                    </div>
                                    <div className="mt-3 text-foreground">
                                        <span className="text-gray-500">// Type-safe API calls</span>
                                        <br />
                                        <span className="text-blue-500 dark:text-blue-400">const</span> <span className="text-green-500 dark:text-green-400">createArticle</span> = <span className="text-blue-500 dark:text-blue-400">async</span> (
                                    </div>
                                    <div className="mt-1 text-foreground ml-2">
                                        <span className="text-green-500 dark:text-green-400">  article</span>: <span className="text-yellow-500 dark:text-yellow-400">Article</span><br />
                                        ): <span className="text-yellow-500 dark:text-yellow-400">Promise</span>&lt;<span className="text-yellow-500 dark:text-yellow-400">Article</span>&gt; =&gt; {`{`}<br />
                                        <span className="text-blue-500 dark:text-blue-400">  return</span> <span className="text-blue-500 dark:text-blue-400">await</span> <span className="text-green-500 dark:text-green-400">api</span>.<span className="text-blue-500 dark:text-blue-400">post</span>(<span className="text-orange-500 dark:text-orange-400">'/articles'</span>, <span className="text-green-500 dark:text-green-400">article</span>);<br />
                                        {`};`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="mx-auto w-full max-w-7xl px-6 py-16 md:py-24 border-t">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Simple, transparent pricing</h2>
                    <p className="mt-2 text-foreground/70">Choose a plan that fits your team. No hidden fees.</p>
                </div>
                <div className="mt-10 grid grid-cols-1 gap-6 md:mt-12 md:grid-cols-3">
                    {/* Free */}
                    <div className="rounded-xl border p-6 flex flex-col">
                        <div>
                            <h3 className="text-lg font-semibold">Free</h3>
                            <p className="mt-1 text-sm text-foreground/70">Get started at no cost</p>
                            <div className="mt-4 flex items-baseline gap-1">
                                <span className="text-3xl font-semibold">$0</span>
                                <span className="text-foreground/60">/mo</span>
                            </div>
                        </div>
                        <ul className="mt-6 space-y-2 text-sm">
                            {[
                                'Basic editor and blocks',
                                '1 project',
                                'Up to 5 articles per month',
                                'Community support',
                            ].map((item) => (
                                <li key={item} className="flex items-start gap-3">
                                    <span className="mt-1 h-2 w-2 rounded-full bg-foreground/60" aria-hidden />
                                    <span className="text-foreground/80">{item}</span>
                                </li>
                            ))}
                        </ul>
                        {!isLoading && (
                            <Link to={user ? "/dashboard" : "/sign-up"} className="mt-6 inline-flex justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-foreground/5 transition-colors">{user ? "Go to Dashboard" : "Get started"}</Link>
                        )}
                    </div>

                    {/* Pro */}
                    <div className="rounded-xl border p-6 flex flex-col">
                        <div>
                            <div className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-foreground/80">Most popular</div>
                            <h3 className="mt-2 text-lg font-semibold">Pro</h3>
                            <p className="mt-1 text-sm text-foreground/70">Advanced features for teams</p>
                            <div className="mt-4 flex items-baseline gap-1">
                                <span className="text-3xl font-semibold">$20</span>
                                <span className="text-foreground/60">/mo</span>
                            </div>
                        </div>
                        <ul className="mt-6 space-y-2 text-sm">
                            {[
                                'All Free features',
                                'AI co-author',
                                'SEO optimization tools',
                                'Unlimited projects',
                                'Email support',
                            ].map((item) => (
                                <li key={item} className="flex items-start gap-3">
                                    <span className="mt-1 h-2 w-2 rounded-full bg-foreground/60" aria-hidden />
                                    <span className="text-foreground/80">{item}</span>
                                </li>
                            ))}
                        </ul>
                        {!isLoading && (
                            <Link to={user ? "/dashboard" : "/sign-up"} className="mt-6 inline-flex justify-center rounded-md px-4 py-2 text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90 transition-colors">{user ? "Go to Dashboard" : "Upgrade to Pro"}</Link>
                        )}
                    </div>

                    {/* Enterprise */}
                    <div className="rounded-xl border p-6 flex flex-col">
                        <div>
                            <h3 className="text-lg font-semibold">Enterprise</h3>
                            <p className="mt-1 text-sm text-foreground/70">Tailored for your organization</p>
                            <div className="mt-4 flex items-baseline gap-1">
                                <span className="text-3xl font-semibold">Custom</span>
                            </div>
                        </div>
                        <ul className="mt-6 space-y-2 text-sm">
                            {[
                                'Custom onboarding and training',
                                'Priority SLAs and support',
                                'Security reviews and SSO',
                                'Custom integrations',
                            ].map((item) => (
                                <li key={item} className="flex items-start gap-3">
                                    <span className="mt-1 h-2 w-2 rounded-full bg-foreground/60" aria-hidden />
                                    <span className="text-foreground/80">{item}</span>
                                </li>
                            ))}
                        </ul>
                        {!isLoading && (
                            <Link to={user ? "/dashboard" : "/sign-up"} className="mt-6 inline-flex justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-foreground/5 transition-colors">{user ? "Go to Dashboard" : "Contact sales"}</Link>
                        )}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section id="cta" className="mx-auto w-full max-w-7xl px-6 py-16 md:py-24 border-t">
                <div className="rounded-2xl border px-6 py-10 md:px-10 md:py-14 text-center">
                    <h3 className="text-2xl font-semibold tracking-tight">Start building with Cortext</h3>
                    <p className="mt-2 text-foreground/70">A focused, reliable CMS designed for modern content management and team collaboration.</p>
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                        {!isLoading && (
                            <Link
                                to={user ? "/dashboard" : "/sign-up"}
                                className="w-full sm:w-auto px-5 py-3 rounded-md text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90 transition-colors text-center"
                            >
                                {user ? "Go to Dashboard" : "Get started"}
                            </Link>
                        )}
                        {!isLoading && !user && (
                            <Link
                                to="/sign-in"
                                className="w-full sm:w-auto px-5 py-3 rounded-md text-sm font-medium border hover:bg-foreground/5 transition-colors text-center"
                            >
                                I already have an account
                            </Link>
                        )}
                        </div>
                    </div>
                </section>

            {/* Footer */}
            <footer className="mt-auto border-t ios-safe-area">
                <div className="mx-auto max-w-7xl px-6 py-4 sm:py-0 sm:h-16 flex flex-col sm:flex-row items-center justify-between text-sm gap-3 sm:gap-0">
                    <div className="flex flex-wrap items-center justify-center gap-4 order-1 sm:order-2">
                        <a className="text-foreground/60 hover:text-foreground" href="#features">Features</a>
                        <a className="text-foreground/60 hover:text-foreground" href="#api">API</a>
                        <a className="text-foreground/60 hover:text-foreground" href="#pricing">Pricing</a>
                        <Link className="text-foreground/60 hover:text-foreground" to="/docs">Docs</Link>
                        {!isLoading && (
                            <Link className="text-foreground/60 hover:text-foreground" to={user ? "/dashboard" : "/sign-up"}>{user ? "Dashboard" : "Get started"}</Link>
                        )}
                    </div>
                    <span className="text-foreground/60 order-2 sm:order-1">© {new Date().getFullYear()} Cortext</span>
                </div>
            </footer>
        </div>
    );
}
