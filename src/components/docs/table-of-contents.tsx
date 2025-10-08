import { useEffect, useState } from "react";

interface TableOfContentsItem {
    id: string;
    title: string;
    level: number;
}

interface TableOfContentsProps {
    items: TableOfContentsItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
    const [activeSection, setActiveSection] = useState<string>('');

    // Intersection Observer to track which section is in view
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            { threshold: 0.5, rootMargin: '-100px 0px -50% 0px' }
        );

        items.forEach(({ id }) => {
            const element = document.getElementById(id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => observer.disconnect();
    }, [items]);

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div>
            <h2 className="text-sm font-semibold mb-3">On this page</h2>
            <nav className="space-y-1">
                {items.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className={`w-full text-left py-1 text-xs transition-colors ${
                            activeSection === item.id
                                ? 'text-foreground font-semibold'
                                : 'text-foreground/70 hover:text-foreground'
                        }`}
                        style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
                    >
                        {item.title}
                    </button>
                ))}
            </nav>
        </div>
    );
}
