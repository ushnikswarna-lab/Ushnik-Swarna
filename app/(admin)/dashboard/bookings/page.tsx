"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bed, Calendar, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";

interface Booking {
  id: string;
  referenceNumber?: string;
  guestName: string;
  guestEmail: string;
  userId?: string;
  accommodationTitle?: string;
  checkIn?: string;
  checkOut?: string;
  checkInDates?: string[];
  numberOfRooms?: number;
  adults: number;
  children: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  totalAmount?: number;
  createdAt: unknown;
}

export default function MyBookingsPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !userData) {
      router.push("/login?redirect=/dashboard/bookings");
      return;
    }
    loadBookings();
  }, [authLoading, user, userData, router]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/bookings");
      if (!response.ok) throw new Error("Failed to load bookings");
      const allBookings: Booking[] = await response.json();
      const mine = allBookings.filter(
        (b) => b.userId === user?.uid || b.guestEmail === userData?.email
      );
      setBookings(mine);
    } catch (e) {
      console.error("Error loading bookings:", e);
      toast.error("Failed to load your bookings");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Confirmed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Cancelled</Badge>;
      case "completed":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading || (!user && !userData)) {
    return (
      <div className="container px-4 py-12 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container px-4 py-12 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">
              My Bookings
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage your reservations
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/bookings">Book New Stay</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Booking History
          </CardTitle>
          <CardDescription>
            All your past and upcoming bookings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <Bed className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No bookings yet</p>
              <Button asChild>
                <Link href="/bookings">Make your first booking</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-semibold">
                        {booking.accommodationTitle || "Accommodation"}
                      </h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    {booking.referenceNumber && (
                      <p className="text-sm text-muted-foreground">
                        Reference: <span className="font-mono">{booking.referenceNumber}</span>
                      </p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Check-in</p>
                        <p className="font-medium">
                          {booking.checkInDates && Array.isArray(booking.checkInDates) && booking.checkInDates.length > 0
                            ? booking.checkInDates.map((d) => format(new Date(d), "MMM dd")).join(", ")
                            : booking.checkIn
                            ? format(new Date(booking.checkIn), "MMM dd, yyyy")
                            : "N/A"}
                        </p>
                      </div>
                      {booking.numberOfRooms != null && (
                        <div>
                          <p className="text-muted-foreground">Rooms</p>
                          <p className="font-medium">
                            {booking.numberOfRooms} Room{booking.numberOfRooms !== 1 ? "s" : ""}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground">Guests</p>
                        <p className="font-medium">
                          {booking.adults} Adult{booking.adults !== 1 ? "s" : ""}
                          {booking.children > 0 &&
                            `, ${booking.children} Child${booking.children !== 1 ? "ren" : ""}`}
                        </p>
                      </div>
                      {booking.totalAmount != null && (
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-medium">₹{booking.totalAmount.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/track-booking?reference=${booking.referenceNumber || ""}`}>
                        Track
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
