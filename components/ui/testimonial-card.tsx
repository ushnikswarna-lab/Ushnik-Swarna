"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/card";

interface TestimonialCardProps {
    name: string;
    location?: string;
    rating: number;
    review: string;
    date?: string;
    avatar?: string;
}

export function TestimonialCard({
    name,
    location,
    rating,
    review,
    date,
    avatar,
}: TestimonialCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
        >
            <Card className="p-6 md:p-8 h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30 relative overflow-hidden">
                {/* Quote Icon */}
                <Quote className="absolute top-4 right-4 h-12 w-12 text-primary/10" />

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            className={`h-5 w-5 ${i < rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-gray-200 text-gray-200"
                                }`}
                        />
                    ))}
                </div>

                {/* Review */}
                <p className="text-foreground/90 mb-6 leading-relaxed italic relative z-10">
                    "{review}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                    {avatar ? (
                        <div className="relative h-12 w-12 rounded-full overflow-hidden">
                            <Image src={avatar} alt={name} fill className="object-cover" />
                        </div>
                    ) : (
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-lg font-semibold text-primary">
                                {name.charAt(0)}
                            </span>
                        </div>
                    )}
                    <div>
                        <p className="font-semibold">{name}</p>
                        {location && (
                            <p className="text-sm text-muted-foreground">{location}</p>
                        )}
                        {date && (
                            <p className="text-xs text-muted-foreground mt-1">{date}</p>
                        )}
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
