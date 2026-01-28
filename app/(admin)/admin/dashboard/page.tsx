 "use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  Package,
  Wrench,
  Users,
  MousePointerClick,
  TrendingUp,
  Clock,
  RefreshCw,
  Calendar,
  DollarSign,
  Bed,
} from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type AnalyticsSummary = {
  realtime: number;
  totalSessions: number;
  totalUsers: number;
  engagement: number;
};

export default function AdminDashboard() {
  const { userData } = useAuth();

  const [counts, setCounts] = useState({
    accommodations: 0,
    amenities: 0,
    packages: 0,
    bookings: 0,
  });
  const [countsLoading, setCountsLoading] = useState(true);

  const [analytics, setAnalytics] = useState<AnalyticsSummary>({
    realtime: 0,
    totalSessions: 0,
    totalUsers: 0,
    engagement: 0,
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [refreshingAnalytics, setRefreshingAnalytics] = useState(false);

  const [bookingData, setBookingData] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    revenue: 0,
    popularAccommodations: [] as { id: string; title: string; count: number }[],
  });
  const [bookingLoading, setBookingLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setCountsLoading(false);
      return;
    }

    const fetchCounts = async () => {
      if (!db) {
        setCountsLoading(false);
        return;
      }
      try {
        const collections = ["accommodations", "amenities", "packages", "bookings"];
        const countsData: any = {};

        for (const col of collections) {
          const q = query(collection(db, col),);
          const snapshot = await getDocs(q);
          countsData[col] = snapshot.size;
        }
        setCounts(countsData);
      } catch (error) {
        console.error("Error fetching counts:", error);
      } finally {
        setCountsLoading(false);
      }
    };

    fetchCounts();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setRefreshingAnalytics(true);
      const response = await fetch("/api/analytics");
      const result = await response.json();

      if (!result || result.error) {
        console.warn("Analytics error on dashboard:", result?.error);
        return;
      }

      const totalSessions = Array.isArray(result.sessionsUsers)
        ? result.sessionsUsers.reduce((sum: number, item: any) => sum + (item.sessions || 0), 0)
        : 0;

      const totalUsers = Array.isArray(result.sessionsUsers)
        ? result.sessionsUsers.reduce((sum: number, item: any) => sum + (item.users || 0), 0)
        : 0;

      setAnalytics({
        realtime: Number(result.realtime || 0),
        totalSessions,
        totalUsers,
        engagement: Number(result.engagement || 0),
      });
    } catch (error) {
      console.error("Error fetching analytics for dashboard:", error);
    } finally {
      setAnalyticsLoading(false);
      setRefreshingAnalytics(false);
    }
  };

  const fetchBookingAnalytics = async () => {
    try {
      setBookingLoading(true);
      const response = await fetch("/api/admin/bookings");
      if (response.ok) {
        const bookings = await response.json();
        const total = bookings.length;
        const pending = bookings.filter((b: any) => b.status === "pending").length;
        const confirmed = bookings.filter((b: any) => b.status === "confirmed").length;
        const completed = bookings.filter((b: any) => b.status === "completed").length;
        const revenue = bookings.reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0);
        
        // Calculate popular accommodations
        const accCounts: Record<string, { id: string; title: string; count: number }> = {};
        bookings.forEach((b: any) => {
          if (b.accommodationId && b.accommodationTitle) {
            if (!accCounts[b.accommodationId]) {
              accCounts[b.accommodationId] = { id: b.accommodationId, title: b.accommodationTitle, count: 0 };
            }
            accCounts[b.accommodationId].count++;
          }
        });
        const popularAccommodations = Object.values(accCounts).sort((a, b) => b.count - a.count).slice(0, 5);

        setBookingData({
          total,
          pending,
          confirmed,
          completed,
          revenue,
          popularAccommodations,
        });
      }
    } catch (error) {
      console.error("Error fetching booking analytics:", error);
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchBookingAnalytics();
  }, []);

  const stats = [
    {
      title: "Accommodations",
      value: counts.accommodations,
      icon: Package,
    },
    {
      title: "Amenities",
      value: counts.amenities,
      icon: Wrench,
    },
    {
      title: "Packages",
      value: counts.packages,
      icon: Package,
    },
    {
      title: "Bookings",
      value: counts.bookings,
      icon: Calendar,
    },
  ];

  const formatEngagement = (seconds: number) => {
    if (!seconds || seconds <= 0) return "0s";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {userData?.email}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAnalytics}
          disabled={refreshingAnalytics}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshingAnalytics ? "animate-spin" : ""}`} />
          Refresh Analytics
        </Button>
      </div>

      {/* Content stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {countsLoading ? "..." : stat.value}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total {stat.title.toLowerCase()}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick analytics summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? "..." : analytics.realtime}
            </div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions (30 days)</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? "..." : analytics.totalSessions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users (30 days)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? "..." : analytics.totalUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? "..." : formatEngagement(analytics.engagement)}
            </div>
            <p className="text-xs text-muted-foreground">Per session</p>
          </CardContent>
        </Card>
      </div>

      {/* Booking Analytics Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Booking Analytics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookingLoading ? "..." : bookingData.total}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookingLoading ? "..." : `₹${bookingData.revenue.toLocaleString()}`}</div>
              <p className="text-xs text-muted-foreground">All bookings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{bookingLoading ? "..." : bookingData.confirmed}</div>
              <p className="text-xs text-muted-foreground">{bookingData.total > 0 ? Math.round((bookingData.confirmed / bookingData.total) * 100) : 0}% of total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{bookingLoading ? "..." : bookingData.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
            </CardContent>
          </Card>
        </div>

        {bookingData.popularAccommodations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Popular Accommodations</CardTitle>
              <CardDescription>Most booked accommodations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {bookingData.popularAccommodations.map((acc, index) => (
                  <div key={acc.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{acc.title}</p>
                        <p className="text-xs text-muted-foreground">{acc.count} bookings</p>
                      </div>
                    </div>
                    <Bed className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

