"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface MasonryGridProps {
    items: React.ReactNode[];
    className?: string;
    columns?: {
        default: number;
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
    };
}

export function MasonryGrid({
    items,
    className,
    columns = { default: 1, sm: 2, md: 3, lg: 3, xl: 4 }
}: MasonryGridProps) {
    const [columnCount, setColumnCount] = useState(columns.default);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width >= 1280 && columns.xl) setColumnCount(columns.xl);
            else if (width >= 1024 && columns.lg) setColumnCount(columns.lg);
            else if (width >= 768 && columns.md) setColumnCount(columns.md);
            else if (width >= 640 && columns.sm) setColumnCount(columns.sm);
            else setColumnCount(columns.default);
        };

        handleResize(); // Initial call
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [columns]);

    // Distribute items into columns
    const columnItems = Array.from({ length: columnCount }, () => [] as React.ReactNode[]);

    items.forEach((item, index) => {
        columnItems[index % columnCount].push(item);
    });

    return (
        <div className={cn("flex gap-4 w-full", className)}>
            {columnItems.map((col, colIndex) => (
                <div key={colIndex} className="flex flex-col gap-4 flex-1">
                    {col.map((item, itemIndex) => (
                        <div key={itemIndex} className="w-full">
                            {item}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
