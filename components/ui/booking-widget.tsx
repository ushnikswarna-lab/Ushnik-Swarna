"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Bed } from "lucide-react";

interface BookingWidgetProps {
    variant?: "hero" | "sticky";
    className?: string;
}

export function BookingWidget({ variant = "hero", className }: BookingWidgetProps) {
    const [selectedDates, setSelectedDates] = useState<Date[]>([]);
    const [numberOfRooms, setNumberOfRooms] = useState(1);
    const [guests, setGuests] = useState("2");
    const [bookedDates, setBookedDates] = useState<string[]>([]);
    const [loadingAvailability, setLoadingAvailability] = useState(false);

    const isSticky = variant === "sticky";

    useEffect(() => {
        // Load booked dates for calendar indicators
        const loadAvailability = async () => {
            try {
                setLoadingAvailability(true);
                // Load availability for a wide date range to show booked dates on calendar
                const startDate = "2025-01-01";
                const endDate = "2026-12-31";
                const dates = [];
                const start = new Date(startDate);
                const end = new Date(endDate);
                const current = new Date(start);
                while (current <= end) {
                    dates.push(current.toISOString().split('T')[0]);
                    current.setDate(current.getDate() + 1);
                }
                const datesParam = dates.join(',');
                const response = await fetch(`/api/bookings/availability?dates=${datesParam}`);
                if (response.ok) {
                    const data = await response.json();
                    // Extract fully booked dates (where availableRooms = 0)
                    const fullyBooked: string[] = [];
                    Object.entries(data.availability || {}).forEach(([date, info]: [string, any]) => {
                        if (info.availableRooms === 0) {
                            fullyBooked.push(date);
                        }
                    });
                    setBookedDates(fullyBooked);
                }
            } catch (error) {
                console.error("Error loading availability:", error);
            } finally {
                setLoadingAvailability(false);
            }
        };
        loadAvailability();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            <Card
                className={cn(
                    "border-2 hover:border-primary/50 transition-all duration-300 shadow-xl",
                    isSticky 
                        ? "p-4 bg-card/95 backdrop-blur-sm" 
                        : "p-6 md:p-8 bg-card/90 backdrop-blur-md",
                    className
                )}
            >
                <div className={cn(
                    "grid gap-4",
                    isSticky ? "grid-cols-1 sm:grid-cols-4" : "grid-cols-1 md:grid-cols-4"
                )}>
                    {/* Dates Selection */}
                    <div className="space-y-2 sm:col-span-1">
                        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-primary" />
                            Select Dates
                        </label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full h-11 justify-start font-normal border-2 hover:border-primary/30 transition-colors bg-background",
                                        selectedDates.length === 0 && "text-muted-foreground"
                                    )}
                                >
                                    {selectedDates.length > 0 ? (
                                        `${selectedDates.length} date${selectedDates.length > 1 ? 's' : ''} selected`
                                    ) : (
                                        <span>Pick dates</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="multiple"
                                    required={false}
                                    defaultMonth={selectedDates[0] || new Date()}
                                    selected={selectedDates}
                                    onSelect={(dates) => setSelectedDates(dates ?? [])}
                                    numberOfMonths={2}
                                    disabled={(date) => {
                                        const dateStr = format(date, "yyyy-MM-dd");
                                        return date < new Date() || bookedDates.includes(dateStr);
                                    }}
                                    modifiers={{
                                        booked: (date) => bookedDates.includes(format(date, "yyyy-MM-dd")),
                                    }}
                                    modifiersClassNames={{
                                        booked: "bg-red-500/20 text-red-500 font-bold line-through",
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                        {selectedDates.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                                {selectedDates.map(d => format(d, "MMM dd")).join(', ')}
                            </div>
                        )}
                    </div>

                    {/* Number of Rooms */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Bed className="h-4 w-4 text-primary" />
                            Rooms
                        </label>
                        <Select value={String(numberOfRooms)} onValueChange={(v) => setNumberOfRooms(Number(v))}>
                            <SelectTrigger className="h-11 border-2 hover:border-primary/30 focus:border-primary transition-colors bg-background">
                                <SelectValue placeholder="Rooms" />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <SelectItem key={num} value={num.toString()}>
                                        {num} {num === 1 ? "Room" : "Rooms"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Guests */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            Guests
                        </label>
                        <Select value={guests} onValueChange={setGuests}>
                            <SelectTrigger className="h-11 border-2 hover:border-primary/30 focus:border-primary transition-colors bg-background">
                                <SelectValue placeholder="Select guests" />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                                    <SelectItem key={num} value={num.toString()}>
                                        {num} {num === 1 ? "Guest" : "Guests"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Search Button */}
                    <div className={cn("space-y-2", isSticky ? "" : "")}>
                        <label className="text-sm font-semibold opacity-0 hidden md:block pointer-events-none">
                            Action
                        </label>
                        <Button 
                            asChild 
                            size="lg" 
                            className="w-full h-11 group shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                        >
                            <Link
                                href={selectedDates.length > 0
                                    ? `/bookings?dates=${selectedDates.map(d => format(d, "yyyy-MM-dd")).join(',')}`
                                    : "/bookings"}
                            >
                                <Search className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
                                Check Availability
                            </Link>
                        </Button>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
