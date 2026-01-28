import { NextResponse } from "next/server";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

const GA_PROPERTY = `properties/${process.env.GA_PROPERTY_ID}`;

const analytics = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
});

// Helper for GA4 API - regular reports
async function query(request) {
  const [response] = await analytics.runReport(request);
  return response;
}

// Helper for GA4 API - realtime reports
async function queryRealtime(request) {
  const [response] = await analytics.runRealtimeReport(request);
  return response;
}

export async function GET() {
  try {
    // Check if required environment variables are set
    if (!process.env.GA_PROPERTY_ID) {
      console.warn("GA_PROPERTY_ID not set, returning empty analytics data");
      return NextResponse.json({
        realtime: 0,
        topPages: [],
        referrers: [],
        devices: [],
        sessionsUsers: [],
        engagement: 0,
      });
    }

    if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      console.warn("Firebase credentials not set, returning empty analytics data");
      return NextResponse.json({
        realtime: 0,
        topPages: [],
        referrers: [],
        devices: [],
        sessionsUsers: [],
        engagement: 0,
      });
    }

    // Helper to safely execute queries with fallback
    const safeQuery = async (queryFn, defaultValue) => {
      try {
        return await queryFn();
      } catch (err) {
        console.error("Query error:", err.message);
        return defaultValue;
      }
    };

    // 1. Realtime Active Users (use runRealtimeReport for realtime data)
    const realtime = await safeQuery(async () => {
      const realtimeReq = {
        property: GA_PROPERTY,
        metrics: [{ name: "activeUsers" }],
      };
      return await queryRealtime(realtimeReq);
    }, { rows: [] });

    // 2. Top Pages (using pagePath instead of pageTitle)
    const pages = await safeQuery(async () => {
      const pagesReq = {
        property: GA_PROPERTY,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 10,
      };
      return await query(pagesReq);
    }, { rows: [] });

    // 3. Top Referrers
    const referrers = await safeQuery(async () => {
      const refReq = {
        property: GA_PROPERTY,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "sessionSource" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 10,
      };
      return await query(refReq);
    }, { rows: [] });

    // 4. Devices
    const devices = await safeQuery(async () => {
      const devicesReq = {
        property: GA_PROPERTY,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      };
      return await query(devicesReq);
    }, { rows: [] });

    // 5. Sessions and Users over time
    const sessionsUsers = await safeQuery(async () => {
      const sessionsUsersReq = {
        property: GA_PROPERTY,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      };
      return await query(sessionsUsersReq);
    }, { rows: [] });

    // 6. Engagement (average session duration)
    const engagement = await safeQuery(async () => {
      const engagementReq = {
        property: GA_PROPERTY,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        metrics: [{ name: "averageSessionDuration" }],
      };
      return await query(engagementReq);
    }, { rows: [] });

    // Parse engagement duration (it comes in seconds as a string like "123.45")
    const engagementValue = engagement.rows?.[0]?.metricValues?.[0]?.value ?? "0";
    const engagementSeconds = parseFloat(engagementValue) || 0;

    return NextResponse.json({
      realtime: Number(realtime.rows?.[0]?.metricValues?.[0]?.value ?? 0),
      topPages: pages.rows?.map(r => ({
        path: r.dimensionValues?.[0]?.value || "",
        views: Number(r.metricValues?.[0]?.value || 0),
      })) ?? [],
      referrers: referrers.rows?.map(r => ({
        source: r.dimensionValues?.[0]?.value || "",
        sessions: Number(r.metricValues?.[0]?.value || 0),
      })) ?? [],
      devices: devices.rows?.map(r => ({
        category: r.dimensionValues?.[0]?.value || "",
        sessions: Number(r.metricValues?.[0]?.value || 0),
      })) ?? [],
      sessionsUsers: sessionsUsers.rows?.map(r => ({
        date: r.dimensionValues?.[0]?.value || "",
        sessions: Number(r.metricValues?.[0]?.value || 0),
        users: Number(r.metricValues?.[1]?.value || 0),
      })) ?? [],
      engagement: engagementSeconds,
    });

  } catch (err) {
    console.error("GA ERROR:", err);
    console.error("Error details:", {
      message: err.message,
      code: err.code,
      status: err.status,
      stack: err.stack,
    });
    return NextResponse.json(
      {
        error: err.message || "Failed to fetch analytics data",
        details: err.code || err.status || "Unknown error",
      },
      { status: 500 }
    );
  }
}
