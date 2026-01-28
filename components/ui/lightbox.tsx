"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import Image from "next/image";
import { useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface LightboxProps {
    open: boolean;
    onClose: () => void;
    media: { url: string; type: "photo" | "video"; alt?: string }[];
    index: number;
    onIndexChange: (index: number) => void;
}

export function Lightbox({
    open,
    onClose,
    media,
    index,
    onIndexChange,
}: LightboxProps) {
    const currentMedia = media[index];

    const handleNext = useCallback(() => {
        onIndexChange((index + 1) % media.length);
    }, [index, media.length, onIndexChange]);

    const handlePrev = useCallback(() => {
        onIndexChange((index - 1 + media.length) % media.length);
    }, [index, media.length, onIndexChange]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!open) return;
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") handleNext();
            if (e.key === "ArrowLeft") handlePrev();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose, handleNext, handlePrev]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
                >
                    {/* Controls */}
                    <div className="absolute top-4 right-4 flex gap-2 z-50">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/10 rounded-full"
                            onClick={onClose}
                        >
                            <X className="h-6 w-6" />
                        </Button>
                    </div>

                    {/* Navigation */}
                    {media.length > 1 && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-4 text-white hover:bg-white/10 rounded-full z-50 hidden md:flex h-12 w-12"
                                onClick={handlePrev}
                            >
                                <ChevronLeft className="h-8 w-8" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-4 text-white hover:bg-white/10 rounded-full z-50 hidden md:flex h-12 w-12"
                                onClick={handleNext}
                            >
                                <ChevronRight className="h-8 w-8" />
                            </Button>
                        </>
                    )}

                    {/* Content */}
                    <motion.div
                        key={currentMedia.url}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="w-full h-full flex items-center justify-center max-w-7xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {currentMedia.type === "photo" ? (
                            <div className="relative w-full h-full">
                                <Image
                                    src={currentMedia.url}
                                    alt={currentMedia.alt || "Gallery image"}
                                    fill
                                    className="object-contain"
                                    priority
                                    quality={100}
                                />
                            </div>
                        ) : (
                            <video
                                src={currentMedia.url}
                                controls
                                autoPlay
                                className="max-w-full max-h-full object-contain shadow-2xl"
                            />
                        )}

                        {/* Download Button overlay */}
                        <div className="absolute bottom-4 right-4 opacity-0 hover:opacity-100 transition-opacity">
                            <a href={currentMedia.url} download target="_blank" rel="noreferrer">
                                <Button size="icon" variant="secondary" className="rounded-full shadow-lg">
                                    <Download className="h-4 w-4" />
                                </Button>
                            </a>
                        </div>

                        {/* Counter */}
                        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                            {index + 1} / {media.length}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
