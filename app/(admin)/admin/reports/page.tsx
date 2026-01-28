"use client";

import * as React from "react";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Calendar, DollarSign, TrendingUp, Users, Bed, BarChart3 } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface Booking {
  id: string;
  referenceNumber: string;
  guestName: string;
  accommodationId?: string;
  accommodationTitle?: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  totalAmount?: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid" | "refunded";
  createdAt: any;
}

const COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
};

export default function BookingReportsPage() {
  const { userData: currentUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "all">("30d");

  useEffect(() => {
    if (currentUser) {
      loadBookings();
    }
  }, [currentUser, period]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/bookings");
      if (!response.ok) throw new Error("Failed to fetch bookings");
      const data: Booking[] = await response.json();
      setBookings(data);
    } catch (error: any) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = useMemo(() => {
    if (period === "all") return bookings;

    const now = new Date();
    let cutoff: Date;

    switch (period) {
      case "7d":
        cutoff = subDays(now, 7);
        break;
      case "30d":
        cutoff = subDays(now, 30);
        break;
      case "90d":
        cutoff = subDays(now, 90);
        break;
      default:
        cutoff = subDays(now, 30);
    }

    return bookings.filter((b) => {
      const created = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return created >= cutoff;
    });
  }, [bookings, period]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const confirmed = filteredBookings.filter((b) => b.status === "confirmed" || b.status === "completed");
    const cancelled = filteredBookings.filter((b) => b.status === "cancelled");
    const revenue = confirmed.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalGuests = filteredBookings.reduce((sum, b) => sum + b.adults + b.children, 0);
    const avgBookingValue = confirmed.length > 0 ? revenue / confirmed.length : 0;
    const cancellationRate = filteredBookings.length > 0 ? (cancelled.length / filteredBookings.length) * 100 : 0;

    return {
      total: filteredBookings.length,
      confirmed: confirmed.length,
      cancelled: cancelled.length,
      revenue,
      totalGuests,
      avgBookingValue,
      cancellationRate,
    };
  }, [filteredBookings]);

  // Daily revenue chart data
  const dailyRevenueData = useMemo(() => {
    const revenueByDate: Record<string, number> = {};
    filteredBookings
      .filter((b) => (b.status === "confirmed" || b.status === "completed") && b.totalAmount)
      .forEach((b) => {
        const date = format(new Date(b.checkIn), "yyyy-MM-dd");
        revenueByDate[date] = (revenueByDate[date] || 0) + (b.totalAmount || 0);
      });

    return Object.entries(revenueByDate)
      .map(([date, revenue]) => ({
        date: format(new Date(date), "MMM dd"),
        revenue,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);
  }, [filteredBookings]);

  // Status distribution
  const statusData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    filteredBookings.forEach((b) => {
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [filteredBookings]);

  // Top accommodations
  const topAccommodations = useMemo(() => {
    const accCounts: Record<string, { title: string; count: number; revenue: number }> = {};
    filteredBookings
      .filter((b) => b.accommodationId && b.accommodationTitle)
      .forEach((b) => {
        if (!accCounts[b.accommodationId!]) {
          accCounts[b.accommodationId!] = {
            title: b.accommodationTitle!,
            count: 0,
            revenue: 0,
          };
        }
        accCounts[b.accommodationId!].count++;
        if (b.totalAmount && (b.status === "confirmed" || b.status === "completed")) {
          accCounts[b.accommodationId!].revenue += b.totalAmount;
        }
      });
    return Object.values(accCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredBookings]);

  const exportReport = () => {
    const csv = [
      ["Period", "Total Bookings", "Confirmed", "Cancelled", "Revenue", "Total Guests", "Avg Booking Value", "Cancellation Rate"],
      [
        period,
        metrics.total,
        metrics.confirmed,
        metrics.cancelled,
        metrics.revenue,
        metrics.totalGuests,
        metrics.avgBookingValue.toFixed(2),
        metrics.cancellationRate.toFixed(2) + "%",
      ],
    ].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `booking-report-${period}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-80" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Booking Reports</h1>
          <p className="text-muted-foreground">Detailed analytics and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
            <p className="text-xs text-muted-foreground">In selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{metrics.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From confirmed bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Booking Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{metrics.avgBookingValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per confirmed booking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalGuests}</div>
            <p className="text-xs text-muted-foreground">Adults + Children</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Revenue</CardTitle>
            <CardDescription>Revenue by check-in date</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyRevenueData.length > 0 ? (
              <ChartContainer
                className="h-[300px]"
                config={{
                  revenue: { label: "Revenue", color: COLORS.primary },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking Status</CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ChartContainer
                className="h-[300px]"
                config={Object.fromEntries(statusData.map((d) => [d.name, { label: d.name, color: COLORS.primary }]))}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Accommodations */}
      {topAccommodations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Accommodations</CardTitle>
            <CardDescription>Most booked accommodations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topAccommodations.map((acc, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{acc.title}</p>
                      <p className="text-xs text-muted-foreground">{acc.count} bookings</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{acc.revenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cancellation Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.cancellationRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.cancelled} cancelled out of {metrics.total}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Confirmation Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics.total > 0 ? ((metrics.confirmed / metrics.total) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.confirmed} confirmed bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avg Guests per Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {filteredBookings.length > 0 ? (metrics.totalGuests / filteredBookings.length).toFixed(1) : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average party size
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
