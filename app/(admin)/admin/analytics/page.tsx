"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Eye, 
  MousePointerClick, 
  Globe, 
  Monitor, 
  Smartphone, 
  Tablet,
  TrendingUp,
  Clock,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

type AnalyticsData = {
  realtime: number;
  topPages: { path: string; views: number }[];
  referrers: { source: string; sessions: number }[];
  devices: { category: string; sessions: number }[];
  sessionsUsers: { date: string; sessions: number; users: number }[];
  engagement: number;
};

const COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  muted: "hsl(var(--muted))",
};

const deviceColors = {
  desktop: "#3b82f6",
  mobile: "#10b981",
  tablet: "#f59e0b",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    realtime: 0,
    topPages: [],
    referrers: [],
    devices: [],
    sessionsUsers: [],
    engagement: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const response = await fetch("/api/analytics");
      const result = await response.json();
      
      if (result.error) {
        setError(result.error);
      } else {
        setData(result);
        setError(null);
        setLastUpdated(new Date());
      }
    } catch (err) {
      setError("Failed to load analytics");
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchAnalytics();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate totals
  const totalSessions = data.sessionsUsers.reduce((sum, item) => sum + item.sessions, 0);
  const totalUsers = data.sessionsUsers.reduce((sum, item) => sum + item.users, 0);
  const avgSessionsPerDay = data.sessionsUsers.length > 0 
    ? Math.round(totalSessions / data.sessionsUsers.length) 
    : 0;

  // Format engagement time
  const formatEngagement = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Prepare chart data with proper date formatting
  const sessionsChartData = data.sessionsUsers.slice(-14).map(item => {
    let formattedDate = item.date;
    try {
      // Handle different date formats from GA API
      // Format could be "20240101" (YYYYMMDD) or ISO string
      if (item.date && typeof item.date === 'string') {
        if (item.date.length === 8 && /^\d{8}$/.test(item.date)) {
          // Format: YYYYMMDD
          const year = item.date.substring(0, 4);
          const month = item.date.substring(4, 6);
          const day = item.date.substring(6, 8);
          const dateObj = new Date(`${year}-${month}-${day}`);
          if (!isNaN(dateObj.getTime())) {
            formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }
        } else {
          // Try parsing as ISO date
          const dateObj = new Date(item.date);
          if (!isNaN(dateObj.getTime())) {
            formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }
        }
      }
    } catch (error) {
      console.warn('Date formatting error:', error);
      formattedDate = item.date || 'Invalid Date';
    }
    return {
      date: formattedDate,
      sessions: item.sessions || 0,
      users: item.users || 0,
    };
  });

  const topPagesData = data.topPages.slice(0, 10).map((page, index) => ({
    name: page.path.length > 30 ? page.path.substring(0, 30) + '...' : page.path,
    fullPath: page.path,
    views: page.views,
    rank: index + 1,
  }));

  const deviceData = data.devices.map(device => ({
    name: device.category.charAt(0).toUpperCase() + device.category.slice(1),
    value: device.sessions,
    color: deviceColors[device.category as keyof typeof deviceColors] || COLORS.primary,
  }));

  const referrerData = data.referrers.slice(0, 8).map(ref => ({
    name: ref.source || 'Direct',
    sessions: ref.sessions,
  }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              View your website analytics and performance metrics
            </p>
          </div>
        </div>

        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Error Loading Analytics</CardTitle>
            </div>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchAnalytics} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            {lastUpdated 
              ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
              : "View your website analytics and performance metrics"
            }
          </p>
        </div>
        <Button 
          onClick={fetchAnalytics} 
          variant="outline" 
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.realtime}</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatEngagement(data.engagement)}</div>
            <p className="text-xs text-muted-foreground">Per session</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Sessions & Users Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Sessions & Users</CardTitle>
            <CardDescription>Last 14 days performance</CardDescription>
          </CardHeader>
          <CardContent>
            {sessionsChartData.length > 0 ? (
              <ChartContainer
                className="h-[320px]"
                config={{
                  sessions: { label: "Sessions", color: COLORS.primary },
                  users: { label: "Users", color: COLORS.secondary },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sessionsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip 
                      content={<ChartTooltipContent 
                        valueFormatter={(value: any, name?: string) => {
                          if (typeof value === 'number') {
                            return value.toLocaleString();
                          }
                          return value;
                        }}
                      />} 
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="sessions" 
                      strokeWidth={2}
                      stroke={COLORS.primary}
                      dot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      strokeWidth={2}
                      stroke={COLORS.secondary}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Device Categories</CardTitle>
            <CardDescription>Traffic by device type</CardDescription>
          </CardHeader>
          <CardContent>
            {deviceData.length > 0 ? (
              <ChartContainer
                className="h-[320px]"
                config={Object.fromEntries(deviceData.map((d) => [d.name, { label: d.name, color: d.color }]))}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : "0"}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
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

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most viewed pages (Last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            {topPagesData.length > 0 ? (
              <ChartContainer
                className="h-[320px]"
                config={{
                  views: { label: "Views", color: COLORS.primary },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topPagesData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis 
                      dataKey="name"
                      type="category"
                      width={150}
                      tick={{ fontSize: 11 }}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value: number | undefined) => value ? [`${value.toLocaleString()} views`, 'Views'] : ['', '']}
                    />
                    <Bar dataKey="views" radius={[0, 4, 4, 0]} />
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

        {/* Top Referrers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
            <CardDescription>Traffic sources (Last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            {referrerData.length > 0 ? (
              <ChartContainer
                className="h-[320px]"
                config={{
                  sessions: { label: "Sessions", color: COLORS.secondary },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={referrerData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value: number | undefined) => value ? [`${value.toLocaleString()} sessions`, 'Sessions'] : ['', '']}
                    />
                    <Bar dataKey="sessions" radius={[4, 4, 0, 0]} />
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
      </div>


      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avg Sessions/Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgSessionsPerDay.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Page</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topPages.length > 0 ? (
              <>
                <div className="text-sm font-medium truncate" title={data.topPages[0].path}>
                  {data.topPages[0].path}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.topPages[0].views.toLocaleString()} views
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Referrer</CardTitle>
          </CardHeader>
          <CardContent>
            {data.referrers.length > 0 ? (
              <>
                <div className="text-sm font-medium">
                  {data.referrers[0].source || 'Direct'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.referrers[0].sessions.toLocaleString()} sessions
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
