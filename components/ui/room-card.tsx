"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Bed, Users, Maximize, Wifi, Coffee, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RoomCardProps {
    title: string;
    description: string;
    image: string;
    price: number;
    currency?: string;
    beds?: number;
    maxGuests?: number;
    size?: string;
    amenities?: string[];
    href: string;
    featured?: boolean;
}

export function RoomCard({
    title,
    description,
    image,
    price,
    currency = "INR",
    beds,
    maxGuests,
    size,
    amenities = [],
    href,
    featured = false,
}: RoomCardProps) {
    const currencySymbol = currency === "INR" ? "₹" : "$";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="group h-full"
        >
            <Card className="overflow-hidden h-full flex flex-col hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/40">
                {/* Image */}
                <div className="relative h-64 overflow-hidden">
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {featured && (
                        <Badge className="absolute top-4 right-4 bg-primary text-white">
                            Featured
                        </Badge>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex-1">
                        <h3 className="text-2xl font-semibold mb-2 font-heading group-hover:text-primary transition-colors">
                            {title}
                        </h3>
                        <p className="text-muted-foreground mb-4 line-clamp-2">{description}</p>

                        {/* Room Features */}
                        <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground">
                            {beds && (
                                <div className="flex items-center gap-1">
                                    <Bed className="h-4 w-4" />
                                    <span>{beds} Bed{beds > 1 ? "s" : ""}</span>
                                </div>
                            )}
                            {maxGuests && (
                                <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    <span>Up to {maxGuests}</span>
                                </div>
                            )}
                            {size && (
                                <div className="flex items-center gap-1">
                                    <Maximize className="h-4 w-4" />
                                    <span>{size}</span>
                                </div>
                            )}
                        </div>

                        {/* Amenities */}
                        {amenities.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {amenities.slice(0, 3).map((amenity) => (
                                    <Badge key={amenity} variant="secondary" className="text-xs">
                                        {amenity}
                                    </Badge>
                                ))}
                                {amenities.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                        +{amenities.length - 3} more
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Price & CTA */}
                    <div className="flex items-center justify-between pt-4 border-t">
                        <div>
                            <p className="text-sm text-muted-foreground">Starting from</p>
                            <p className="text-2xl font-bold text-primary">
                                {currencySymbol}{price.toLocaleString()}
                                <span className="text-sm text-muted-foreground font-normal">/night</span>
                            </p>
                        </div>
                        <Button asChild className="group/btn">
                            <Link href={href}>
                                View Details
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
