import { createContext, useContext, useState, ReactNode } from "react";

interface TableOfContentsItem {
    id: string;
    title: string;
    level: number;
}

interface TableOfContentsContextType {
    items: TableOfContentsItem[];
    setItems: (items: TableOfContentsItem[]) => void;
}

const TableOfContentsContext = createContext<TableOfContentsContextType | undefined>(undefined);

export function TableOfContentsProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<TableOfContentsItem[]>([]);

    return (
        <TableOfContentsContext.Provider value={{ items, setItems }}>
            {children}
        </TableOfContentsContext.Provider>
    );
}

export function useTableOfContents() {
    const context = useContext(TableOfContentsContext);
    if (context === undefined) {
        throw new Error('useTableOfContents must be used within a TableOfContentsProvider');
    }
    return context;
}
