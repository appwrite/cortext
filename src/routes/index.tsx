import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Brain, Type as TypeIcon, Image as ImageIcon, Video as VideoIcon, Map as MapIcon, Quote as QuoteIcon, Code2 as CodeIcon, FileEdit, MessageSquare, History, Github } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
    component: Index,
});

function Nav() {
    const { user, isLoading } = useAuth();

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="relative mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
                <a href="#home" className="font-semibold text-lg tracking-tight inline-flex items-center gap-2">
                    <Brain aria-hidden="true" className="h-6 w-6 text-foreground/80" />
                    Cortext
                </a>
                <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 gap-6 text-sm items-center">
                    <a href="#features" className="text-foreground/70 hover:text-foreground transition-colors">Features</a>
                    <a href="#pricing" className="text-foreground/70 hover:text-foreground transition-colors">Pricing</a>
                    <a href="https://appwrite.io/docs" target="_blank" rel="noopener noreferrer" className="text-foreground/70 hover:text-foreground transition-colors">API</a>
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
                                <Link to="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium border hover:bg-foreground/5 transition-colors">Dashboard</Link>
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
        { label: 'Embeds', Icon: CodeIcon },
    ];

    // Workflow features for drafts, reviews, versioning
    const workflowFeatures: { title: string; desc: string; Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }> }[] = [
        { title: 'Drafts', desc: 'Work in private or shared drafts before publishing.', Icon: FileEdit },
        { title: 'Reviews', desc: 'Request reviews, track comments, and resolve threads.', Icon: MessageSquare },
        { title: 'Versioning', desc: 'Auto-saved versions with diffs and easy restore.', Icon: History },
    ];

    return (
        <div className="min-h-screen flex flex-col" id="home">
            <Nav />

            {/* Hero */}
            <section className="mx-auto w-full max-w-7xl px-8 mb-1 mt-24">
                <div className="mx-auto max-w-3xl text-center">
                    <p className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-foreground/70">
                        Private beta soon
                    </p>
                    <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-5xl">
                        AI-powered content management system
                        </h1>
                    <p className="mt-4 text-base text-foreground/70 md:text-lg">
                        Organize rich content with flexible, sortable blocks. Co-write with an AI assistant trained to boost quality, SEO, and team productivity.
                        </p>
                        <div className="mt-8 flex items-center justify-center gap-3">
                        <Link
                            to="/sign-up"
                            className="px-5 py-3 rounded-md text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90 transition-colors"
                        >
                            Get early access
                                </Link>
                        <a href="#features" className="px-5 py-3 rounded-md text-sm font-medium border hover:bg-foreground/5 transition-colors">
                            Learn more
                        </a>
                    </div>
                    <p className="mt-4 text-xs md:text-sm text-foreground/70">
                        <span className="font-semibold text-foreground">{count.toLocaleString()}</span> people have already signed up
                    </p>
                </div>

                {/* Dashboard screenshot that merges with the next separator */}
                <div className="relative mx-auto mt-10 md:mt-12 w-full max-w-6xl -mb-px">
                    <div className="rounded-t-xl border border-b-0 bg-card overflow-hidden">
                        <div className="aspect-[21/9] w-full relative">
                            <img 
                                src="/dashboard.png" 
                                alt="Cortext Dashboard - Article Management Interface"
                                className="h-full w-full object-cover object-top filter brightness-95 contrast-110 saturate-90"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/30 to-transparent pointer-events-none"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trusted by */}
            <section className="mx-auto w-full max-w-7xl px-6 py-12 border-t">
                <div className="mx-auto max-w-4xl text-center">
                    <p className="text-sm font-medium text-foreground/70 mb-8">Trusted by</p>
                    <div className="flex items-center justify-center gap-12">
                        <a 
                            href="https://appwrite.io" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:opacity-80 transition-opacity duration-200"
                        >
                            <img 
                                src="/trusted/appwrite.svg" 
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
                                src="/trusted/imagine.svg" 
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
                                src="/trusted/refetch.svg" 
                                alt="Refetch" 
                                className="h-5 w-auto"
                            />
                        </a>
                    </div>
                </div>
            </section>

            {/* Feature: AI Co-author */}
            <section id="coauthor" className="mx-auto w-full max-w-7xl px-6 py-16 md:py-24 border-t">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center">
                    <div className="order-2 md:order-1">
                        <div className="rounded-xl border bg-card p-6">
                            <div className="aspect-[16/10] w-full rounded-lg border bg-gradient-to-tr from-emerald-500/10 to-transparent" aria-hidden />
                            <p className="mt-3 text-sm text-foreground/70">
                                Co-author suggests structure, headlines, and SEO-ready copy. You stay in control.
                            </p>
                        </div>
                    </div>
                    <div className="order-1 md:order-2">
                        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">AI co-author</h2>
                        <p className="mt-3 text-foreground/70">
                            An AI partner trained for content quality and reach. Draft, refine, and optimize without breaking your flow.
                        </p>
                        <ul className="mt-6 space-y-2 text-sm">
                            {[
                                'Generate first drafts and outlines',
                                'Rewrite with tone and style controls',
                                'Team-friendly prompts for faster reviews',
                            ].map((item) => (
                                <li key={item} className="flex items-start gap-3">
                                    <span className="mt-1 h-2 w-2 rounded-full bg-foreground/60" aria-hidden />
                                    <span className="text-foreground/80">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* Feature: Composable Blocks */}
            <section id="features" className="mx-auto w-full max-w-7xl px-6 py-16 md:py-24 border-t">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Composable blocks, crystal clear structure</h2>
                        <p className="mt-3 text-foreground/70">
                            Blocks keep structure simple and predictable. Drag to sort, edit in place, and publish with confidence.
                        </p>
                        <ul className="mt-6 grid grid-cols-2 gap-2 text-sm">
                            {blocks.map(({ label, Icon }) => (
                                <li key={label} className="rounded-md border px-3 py-2 text-foreground/80 flex items-center gap-2">
                                    <Icon className="h-4 w-4 text-foreground/70" aria-hidden />
                                    <span>{label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="rounded-xl border bg-card p-6">
                        <div className="aspect-[16/10] w-full rounded-lg border bg-gradient-to-br from-foreground/[4%] to-transparent" aria-hidden />
                        <p className="mt-3 text-sm text-foreground/70">
                            A clean editor surface designed for focus. No clutter, just the tools you need.
                        </p>
                    </div>
                </div>
            </section>

            {/* Feature: SEO Optimization */}
            <section id="seo" className="mx-auto w-full max-w-7xl px-6 py-16 md:py-24 border-t">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Designed to boost your content SEO</h2>
                        <p className="mt-3 text-foreground/70">
                            Get actionable SEO guidance while you write. Improve structure, readability, and discoverability without leaving the editor.
                        </p>
                        <ul className="mt-6 space-y-2 text-sm">
                            {[
                                'Real-time SEO suggestions and readability tips',
                                'Metadata, titles, and descriptions with previews',
                                'Keyword coverage and internal link prompts',
                                'Schema-ready structure hints for better crawlability',
                            ].map((item) => (
                                <li key={item} className="flex items-start gap-3">
                                    <span className="mt-1 h-2 w-2 rounded-full bg-foreground/60" aria-hidden />
                                    <span className="text-foreground/80">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="rounded-xl border bg-card p-6">
                        <div className="aspect-[16/10] w-full rounded-lg border bg-gradient-to-tr from-sky-500/10 to-transparent" aria-hidden />
                        <p className="mt-3 text-sm text-foreground/70">
                            Clear, contextual guidance that elevates content quality and reach.
                        </p>
                        </div>
                    </div>
                </section>

            {/* Feature: Drafts, Reviews, Versioning */}
            <section id="workflow" className="mx-auto w-full max-w-7xl px-6 py-16 md:py-24 border-t">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Drafts, reviews, and versioning</h2>
                        <p className="mt-3 text-foreground/70">
                            Keep work moving without losing context. Stage changes, collect feedback, and roll back when you need to.
                        </p>
                        <ul className="mt-6 space-y-3 text-sm">
                            {workflowFeatures.map(({ title, desc, Icon }) => (
                                <li key={title} className="flex items-start gap-3 rounded-md border px-3 py-2">
                                    <Icon className="mt-1 h-4 w-4 text-foreground/70" aria-hidden />
                                    <div>
                                        <div className="font-medium text-foreground/90">{title}</div>
                                        <p className="text-foreground/70">{desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="rounded-xl border bg-card p-6">
                        <div className="aspect-[16/10] w-full rounded-lg border bg-gradient-to-tr from-violet-500/10 to-transparent" aria-hidden />
                        <p className="mt-3 text-sm text-foreground/70">
                            Safe collaboration with clear history and approvals.
                        </p>
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
                    <div className="rounded-xl border bg-card p-6 flex flex-col">
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
                        <Link to="/sign-up" className="mt-6 inline-flex justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-foreground/5 transition-colors">Get started</Link>
                    </div>

                    {/* Pro */}
                    <div className="rounded-xl border bg-card p-6 flex flex-col">
                        <div>
                            <div className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-foreground/80">Most popular</div>
                            <h3 className="mt-2 text-lg font-semibold">Pro</h3>
                            <p className="mt-1 text-sm text-foreground/70">Advanced features for teams</p>
                            <div className="mt-4 flex items-baseline gap-1">
                                <span className="text-3xl font-semibold">$19</span>
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
                        <Link to="/sign-up" className="mt-6 inline-flex justify-center rounded-md px-4 py-2 text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90 transition-colors">Upgrade to Pro</Link>
                    </div>

                    {/* Enterprise */}
                    <div className="rounded-xl border bg-card p-6 flex flex-col">
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
                        <Link to="/sign-up" className="mt-6 inline-flex justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-foreground/5 transition-colors">Contact sales</Link>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section id="cta" className="mx-auto w-full max-w-7xl px-6 py-16 md:py-24 border-t">
                <div className="rounded-2xl border px-6 py-10 md:px-10 md:py-14 text-center bg-card">
                    <h3 className="text-2xl font-semibold tracking-tight">Start building with Cortext</h3>
                    <p className="mt-2 text-foreground/70">Join the early access list and help shape a focused, reliable CMS for modern teams.</p>
                    <div className="mt-6 flex items-center justify-center gap-3">
                        <Link
                            to="/sign-up"
                            className="px-5 py-3 rounded-md text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90 transition-colors"
                        >
                            Get early access
                        </Link>
                        <Link
                            to="/sign-in"
                            className="px-5 py-3 rounded-md text-sm font-medium border hover:bg-foreground/5 transition-colors"
                        >
                            I already have an account
                        </Link>
                        </div>
                    </div>
                </section>

            {/* Footer */}
            <footer className="mt-auto border-t">
                <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between text-sm">
                    <span className="text-foreground/60">© {new Date().getFullYear()} Cortext</span>
                    <div className="flex items-center gap-4">
                        <a className="text-foreground/60 hover:text-foreground" href="#features">Features</a>
                        <a className="text-foreground/60 hover:text-foreground" href="#pricing">Pricing</a>
                        <a className="text-foreground/60 hover:text-foreground" href="https://appwrite.io/docs" target="_blank" rel="noopener noreferrer">API</a>
                        <Link className="text-foreground/60 hover:text-foreground" to="/sign-up">Get started</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
