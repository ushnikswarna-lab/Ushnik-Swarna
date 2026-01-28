import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { apiCacheHeaders } from "@/lib/api-cache";

// GET: Fetch approved testimonials for public display
export async function GET(request: NextRequest) {
  try {
    const db = getFirestore();
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get("featured");
    const limit = searchParams.get("limit");

    let query: FirebaseFirestore.Query = db
      .collection("testimonials")
      .where("status", "==", "approved");

    if (featured === "true") {
      query = query.where("featured", "==", true);
    }

    const snapshot = await query.orderBy("createdAt", "desc").get();

    let testimonials = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (limit) {
      testimonials = testimonials.slice(0, parseInt(limit));
    }

    return NextResponse.json(testimonials, { headers: apiCacheHeaders() });
  } catch (error: any) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch testimonials" },
      { status: 500 }
    );
  }
}
