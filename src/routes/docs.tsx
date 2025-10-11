import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { Brain, BookOpen, Code2, Zap, Users, Settings, ChevronRight, Github, Key } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { TableOfContents } from "@/components/docs/table-of-contents";
import { TableOfContentsProvider, useTableOfContents } from "@/contexts/table-of-contents-context";
import { UserAvatar } from "@/components/user-avatar";
import { PageActions } from "@/components/docs/page-actions";

export const Route = createFileRoute("/docs")({
    component: DocsLayout,
});

const docsNavigation = [
    {
        title: "Getting Started",
        items: [
            { title: "Introduction", href: "/docs", icon: BookOpen },
            { title: "Quick Start", href: "/docs/quick-start", icon: Zap },
            { title: "Installation", href: "/docs/installation", icon: Settings },
        ]
    },
    {
        title: "Core Concepts",
        items: [
            { title: "Blocks & Content", href: "/docs/blocks", icon: Code2 },
            { title: "AI Co-author", href: "/docs/ai-coauthor", icon: Brain },
            { title: "Team Collab", href: "/docs/collaboration", icon: Users },
        ]
    },
    {
        title: "API Reference",
        items: [
            { title: "Overview", href: "/docs/api", icon: Settings },
            { title: "Get Started", href: "/docs/api/get-started", icon: Zap },
            { title: "Auth and Keys", href: "/docs/api/auth-and-keys", icon: Key },
            { title: "SDKs", href: "/docs/api/sdks", icon: Code2 },
            { title: "Specification", href: "/docs/api/specification", icon: BookOpen },
        ]
    }
];

function Nav() {
    const { user, isLoading, signOut } = useAuth();

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="relative mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
                <Link to="/" className="font-semibold text-lg tracking-tight inline-flex items-center gap-2">
                    <Brain className="h-6 w-6" />
                    Cortext
                </Link>
                <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 gap-6 text-sm items-center">
                    <a href="/#features" className="text-foreground/70 hover:text-foreground transition-colors">Features</a>
                    <a href="/#api" className="text-foreground/70 hover:text-foreground transition-colors">API</a>
                    <a href="/#pricing" className="text-foreground/70 hover:text-foreground transition-colors">Pricing</a>
                    <Link to="/docs" className="text-foreground font-medium">Docs</Link>
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
                                    <Link to="/content" className="px-3 py-2 rounded-md text-sm font-medium border hover:bg-foreground/5 transition-colors">Content</Link>
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

function DocsLayoutContent() {
    const { user, isLoading } = useAuth();
    const location = useLocation();
    const { items } = useTableOfContents();

    return (
        <div className="min-h-screen flex flex-col">
            <Nav />

            <div className="flex-1 mx-auto w-full max-w-7xl px-6 py-6">
                <div className="flex gap-16">
                    {/* Sidebar */}
                    <aside className="hidden lg:block w-48 flex-shrink-0">
                        <nav className="sticky top-24 space-y-5">
                            {docsNavigation.map((section) => (
                                <div key={section.title}>
                                    <h3 className="text-sm font-semibold text-foreground/90 mb-2.5">{section.title}</h3>
                                    <ul className="space-y-1.5">
                                        {section.items.map((item) => {
                                            const isActive = location.pathname === item.href;
                                            return (
                                                <li key={item.href}>
                                                    <Link
                                                        to={item.href}
                                                        className={`group flex items-center gap-2.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                                                            isActive
                                                                ? 'bg-foreground text-background'
                                                                : 'text-foreground/70 hover:text-foreground hover:bg-foreground/5'
                                                        }`}
                                                    >
                                                        <item.icon className="h-4 w-4" />
                                                        <span>{item.title}</span>
                                                        <ChevronRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))}
                        </nav>
                    </aside>

                        {/* Main content */}
                        <main className="flex-1 min-w-0">
                            <div className="prose prose-neutral dark:prose-invert max-w-none prose-sm">
                                <Outlet />
                            </div>
                        </main>

                    {/* Table of Contents - Right Sidebar */}
                    <aside className="hidden xl:block w-40 flex-shrink-0">
                        <div className="sticky top-24 mt-4">
                            {items.length > 0 && <TableOfContents items={items} />}
                        </div>
                    </aside>
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-auto border-t ios-safe-area">
                <div className="mx-auto max-w-7xl px-6 py-4 sm:py-0 sm:h-16 flex flex-col sm:flex-row items-center justify-between text-sm gap-3 sm:gap-0">
                    <div className="flex flex-wrap items-center justify-center gap-4 order-1 sm:order-2">
                        <a className="text-foreground/60 hover:text-foreground" href="/#features">Features</a>
                        <a className="text-foreground/60 hover:text-foreground" href="/#api">API</a>
                        <a className="text-foreground/60 hover:text-foreground" href="/#pricing">Pricing</a>
                        <Link className="text-foreground/60 hover:text-foreground" to="/docs">Docs</Link>
                        {!isLoading && (
                            <Link className="text-foreground/60 hover:text-foreground" to={user ? "/content" : "/sign-up"}>{user ? "Content" : "Get started"}</Link>
                        )}
                    </div>
                    <span className="text-foreground/60 order-2 sm:order-1">© {new Date().getFullYear()} Cortext</span>
                </div>
            </footer>
        </div>
    );
}

function DocsLayout() {
    return (
        <TableOfContentsProvider>
            <DocsLayoutContent />
        </TableOfContentsProvider>
    );
}
