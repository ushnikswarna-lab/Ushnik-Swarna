"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MediaItem {
    url: string;
    type: "photo" | "video";
    width?: number;
    height?: number;
}

interface JustifiedGridProps {
    items: MediaItem[];
    className?: string;
    targetRowHeight?: number;
    onClick?: (index: number) => void;
}

interface MeasuredItem extends MediaItem {
    aspectRatio: number;
    originalIndex: number;
}

interface Row {
    items: MeasuredItem[];
    height: number;
}

export function JustifiedGrid({
    items,
    className,
    targetRowHeight = 300,
    onClick,
}: JustifiedGridProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [measuredItems, setMeasuredItems] = useState<MeasuredItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("JustifiedGrid mounted. Items:", items.length);
    }, [items]);

    // Handle Resize
    useEffect(() => {
        if (!containerRef.current) return;

        // Initial width fallback
        if (containerRef.current.offsetWidth) {
            setContainerWidth(containerRef.current.offsetWidth);
        }

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                console.log("ResizeObserver width:", entry.contentRect.width);
                if (entry.contentRect.width > 0) {
                    setContainerWidth(entry.contentRect.width);
                }
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Measure Items
    useEffect(() => {
        let mounted = true;
        const loadItems = async () => {
            const results: MeasuredItem[] = [];

            const promises = items.map((item, index) => {
                return new Promise<MeasuredItem>((resolve) => {
                    if (item.type === "photo") {
                        const img = new Image();
                        img.src = item.url;
                        img.onload = () => {
                            resolve({
                                ...item,
                                aspectRatio: img.width / img.height,
                                originalIndex: index,
                            });
                        };
                        img.onerror = () => {
                            // Fallback for error
                            resolve({
                                ...item,
                                aspectRatio: 1, // Square fallback
                                originalIndex: index,
                            });
                        };
                    } else {
                        // For videos, try to load metadata or default to 16:9
                        const video = document.createElement("video");
                        video.src = item.url;
                        video.onloadedmetadata = () => {
                            resolve({
                                ...item,
                                aspectRatio: video.videoWidth / video.videoHeight || 1.77,
                                originalIndex: index,
                            });
                        };
                        video.onerror = () => {
                            resolve({
                                ...item,
                                aspectRatio: 1.77, // 16:9 fallback
                                originalIndex: index,
                            });
                        };
                        // Timeout for video metadata
                        setTimeout(() => {
                            resolve({
                                ...item,
                                aspectRatio: 1.77,
                                originalIndex: index,
                            });
                        }, 3000);
                    }
                });
            });

            const loaded = await Promise.all(promises);
            if (mounted) {
                setMeasuredItems(loaded);
                setLoading(false);
            }
        };

        if (items.length > 0) {
            setLoading(true);
            loadItems();
        } else {
            setMeasuredItems([]);
            setLoading(false);
        }

        return () => {
            mounted = false;
        };
    }, [items]);

    // Calculate Layout
    const calculateRows = useCallback(() => {
        if (!containerWidth || measuredItems.length === 0) return [];

        const rows: Row[] = [];
        let currentRow: MeasuredItem[] = [];
        let currentAspectRatioSum = 0;



        measuredItems.forEach((item) => {
            currentRow.push(item);
            currentAspectRatioSum += item.aspectRatio;

            const visualWidth = currentAspectRatioSum * targetRowHeight;

            if (visualWidth >= containerWidth) {
                // Row is full
                const rowHeight = containerWidth / currentAspectRatioSum;
                rows.push({ items: [...currentRow], height: rowHeight });
                currentRow = [];
                currentAspectRatioSum = 0;
            }
        });

        // Last row
        if (currentRow.length > 0) {
            // Don't stretch the last row too much, use target height
            rows.push({ items: currentRow, height: targetRowHeight });
        }

        return rows;
    }, [measuredItems, containerWidth, targetRowHeight]);

    const rows = calculateRows();

    return (
        <div ref={containerRef} className={cn("w-full min-h-[200px]", className)}>
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="aspect-[4/3] w-full rounded-md" />
                    ))}
                </div>
            ) : (
                rows.map((row, rowIndex) => (
                    <div
                        key={rowIndex}
                        className="flex gap-4 mb-4 w-full"
                        style={{ height: row.height }}
                    >
                        {row.items.map((item, itemIndex) => (
                            <motion.div
                                key={`${rowIndex}-${itemIndex}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                className="relative cursor-pointer overflow-hidden rounded-md group bg-muted"
                                style={{
                                    width: row.height * item.aspectRatio,
                                    flexGrow: rowIndex === rows.length - 1 ? 0 : 1,
                                }}
                                onClick={() => onClick?.(item.originalIndex)}
                            >
                                {item.type === "photo" ? (
                                    <img
                                        src={item.url}
                                        alt="Gallery Item"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="relative w-full h-full">
                                        <video
                                            src={item.url}
                                            className="w-full h-full object-cover"
                                            muted
                                            loop
                                            onMouseEnter={(e) => e.currentTarget.play()}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.pause();
                                                e.currentTarget.currentTime = 0;
                                            }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                                                <Play className="w-5 h-5 text-white fill-white" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                            </motion.div>
                        ))}
                    </div>
                ))
            )}
        </div>
    );
}
