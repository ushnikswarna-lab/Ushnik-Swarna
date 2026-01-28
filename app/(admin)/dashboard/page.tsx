"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, DollarSign, Bed, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";

interface Booking {
  id: string;
  referenceNumber?: string;
  guestName: string;
  guestEmail: string;
  accommodationTitle?: string;
  checkIn?: string; // Legacy support
  checkOut?: string; // Legacy support
  checkInDates?: string[]; // New format: array of dates
  numberOfRooms?: number; // New format: number of rooms
  adults: number;
  children: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  totalAmount?: number;
  createdAt: any;
}

export default function UserDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  let user, userData, authLoading;
  try {
    const auth = useAuth();
    user = auth?.user || null;
    userData = auth?.userData || null;
    authLoading = auth?.loading ?? true;
  } catch (error) {
    user = null;
    userData = null;
    authLoading = true;
  }

  useEffect(() => {
    if (!mounted) return;
    if (!authLoading) {
      if (!user || !userData) {
        router.push("/login?redirect=/dashboard");
        return;
      }
      // Allow both "user" role and authenticated users
      if (userData.role === "user" || user) {
        loadBookings();
      } else {
        router.push("/login?redirect=/dashboard");
      }
    }
  }, [mounted, authLoading, user, userData, router]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/bookings");
      if (response.ok) {
        const allBookings = await response.json();
        // Filter bookings for current user
        const userBookings = allBookings.filter(
          (b: any) => b.userId === user?.uid || b.guestEmail === userData?.email
        );
        setBookings(userBookings);
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
      toast.error("Failed to load booking history");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Confirmed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Cancelled</Badge>;
      case "completed":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    pending: bookings.filter((b) => b.status === "pending").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    totalSpent: bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
  };

  if (!mounted || authLoading || loading) {
    return (
      <div className="container px-4 py-12 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight font-heading">
            My Dashboard
            <span className="block mt-2 text-primary">
              Welcome back!
            </span>
          </h1>
          <p className="text-muted-foreground mt-2">Welcome back, {userData?.email}</p>
        </div>
        <Button asChild size="lg">
          <Link href="/bookings">Book New</Link>
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/bookings" className="block">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Book New Stay
              </CardTitle>
              <CardDescription>Make a new booking reservation</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/dashboard/bookings" className="block">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bed className="h-5 w-5" />
                View My Bookings
              </CardTitle>
              <CardDescription>View all your booking history</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Booking History */}
      <Card id="bookings">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Bookings</CardTitle>
              <CardDescription>All your past and upcoming bookings</CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link href="/bookings">Book New</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <Bed className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No bookings found</p>
              <Button asChild>
                <Link href="/bookings">Make Your First Booking</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
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
                        <p className="text-muted-foreground">Check-in Dates</p>
                        <p className="font-medium">
                          {booking.checkInDates && Array.isArray(booking.checkInDates) && booking.checkInDates.length > 0
                            ? booking.checkInDates.map(d => format(new Date(d), "MMM dd")).join(", ")
                            : booking.checkIn
                            ? format(new Date(booking.checkIn), "MMM dd, yyyy")
                            : "N/A"}
                        </p>
                      </div>
                      {booking.numberOfRooms && (
                        <div>
                          <p className="text-muted-foreground">Rooms</p>
                          <p className="font-medium">{booking.numberOfRooms} Room{booking.numberOfRooms !== 1 ? "s" : ""}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground">Guests</p>
                        <p className="font-medium">
                          {booking.adults} Adult{booking.adults !== 1 ? "s" : ""}
                          {booking.children > 0 && `, ${booking.children} Child${booking.children !== 1 ? "ren" : ""}`}
                        </p>
                      </div>
                      {booking.totalAmount && (
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-medium">₹{booking.totalAmount.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
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
