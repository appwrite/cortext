import { useAuth } from "@/hooks/use-auth";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Layers3, Image as ImageIcon, Video, MapPin, CheckCircle2, Brain, History, MessageSquare, GitBranch } from "lucide-react";

export const Route = createFileRoute("/")({
    component: Index,
});

function Index() {
    const { user, signOut } = useAuth();

    const primaryCta = user ? (
        <Link to="/dashboard">
            <Button size="lg" className="px-6">Go to Dashboard</Button>
        </Link>
    ) : (
        <Link
            to="/sign-in"
            search={{ redirect: "/dashboard" }}
        >
            <Button size="lg" className="px-6">Start building</Button>
        </Link>
    );

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            <header className="flex items-center justify-between px-6 py-4">
                <Link to="/" className="font-semibold tracking-tight text-base inline-flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Cortext
                </Link>
                <div className="flex items-center gap-2">
                    {user ? (
                        <>
                            <Link to="/dashboard">
                                <Button variant="ghost" size="sm">Dashboard</Button>
                            </Link>
                            <Button variant="outline" size="sm" onClick={() => signOut.mutate()}>Sign out</Button>
                        </>
                    ) : (
                        <>
                            <Link to="/sign-in" search={{ redirect: "/dashboard" }}>
                                <Button variant="ghost" size="sm">Sign in</Button>
                            </Link>
                            <Link to="/sign-up">
                                <Button size="sm">Create account</Button>
                            </Link>
                        </>
                    )}
                </div>
            </header>

            <main className="flex-1">
                <section className="px-6 py-16 md:py-24">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
                            From idea to article with your AI co-writer
                        </h1>
                        <p className="mt-4 text-muted-foreground text-base md:text-lg">
                            A minimal CMS to build articles from sortable blocks.
                        </p>
                        <div className="mt-8 flex items-center justify-center gap-3">
                            {primaryCta}
                            {!user && (
                                <Link to="/sign-up">
                                    <Button variant="outline" size="lg" className="px-6">Try it free</Button>
                                </Link>
                            )}
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground flex items-center justify-center gap-1">
                            <CheckCircle2 className="h-4 w-4" /> No setup required. Sign in and start writing.
                        </p>
                    </div>
                    <div className="mt-10 max-w-5xl mx-auto">
                        <div className="aspect-[16/9] rounded-xl border-2 bg-muted/40 flex items-center justify-center">
                            <span className="text-sm text-muted-foreground">Dashboard screenshot placeholder</span>
                        </div>
                    </div>
                </section>

                <section className="px-6 pb-20">
                    <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FeatureCard
                            icon={<Layers3 className="h-5 w-5" />}
                            title="Sortable sections"
                            desc="Reorder with up/down controls for precise sequencing."
                        />
                        <FeatureCard
                            icon={<ImageIcon className="h-5 w-5" />}
                            title="Images"
                            desc="Upload and preview images; stored securely."
                        />
                        <FeatureCard
                            icon={<Video className="h-5 w-5" />}
                            title="Video embeds"
                            desc="Drop in a YouTube URL and we handle the rest."
                        />
                        <FeatureCard
                            icon={<MapPin className="h-5 w-5" />}
                            title="Map locations"
                            desc="Add a lat/lng and preview it on an embedded map."
                        />
                    </div>
                </section>

                <section className="px-6 pb-20">
                    <div className="max-w-5xl mx-auto space-y-4">
                        <h2 className="text-base font-medium tracking-tight">Drafts, Reviews, and Versioning</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FeatureCard
                                icon={<History className="h-5 w-5" />}
                                title="Drafts"
                                desc="Publish when ready; keep work-in-progress private."
                            />
                            <FeatureCard
                                icon={<MessageSquare className="h-5 w-5" />}
                                title="Reviews"
                                desc="Share for feedback and iterate quickly."
                            />
                            <FeatureCard
                                icon={<GitBranch className="h-5 w-5" />}
                                title="Versioning"
                                desc="Track changes over time and revert if needed."
                            />
                        </div>
                    </div>
                </section>
            </main>

            <footer className="px-6 py-6 border-t text-xs text-muted-foreground">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <span>Cortext • Minimal section-based CMS</span>
                    <span>© {new Date().getFullYear()}</span>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <div className="rounded-lg border bg-card p-4 text-left">
            <div className="flex items-center gap-2 text-sm font-medium">
                <span className="inline-flex items-center justify-center rounded-md bg-secondary size-8">
                    {icon}
                </span>
                {title}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
        </div>
    );
}
