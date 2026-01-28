import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { apiCacheHeaders } from "@/lib/api-cache";

// GET: Fetch active events for public display
export async function GET(request: NextRequest) {
  try {
    const db = getFirestore();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const upcoming = searchParams.get("upcoming");
    const limit = searchParams.get("limit");

    let query: FirebaseFirestore.Query = db
      .collection("events")
      .where("status", "==", "active");

    if (category && category !== "all") {
      query = query.where("category", "==", category);
    }

    const snapshot = await query.orderBy("eventDate", "asc").get();

    let events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter upcoming events if requested
    if (upcoming === "true") {
      const now = new Date();
      events = events.filter((event: any) => new Date(event.eventDate) >= now);
    }

    if (limit) {
      events = events.slice(0, parseInt(limit));
    }

    return NextResponse.json(events, { headers: apiCacheHeaders() });
  } catch (error: any) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch events" },
      { status: 500 }
    );
  }
}
