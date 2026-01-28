import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { apiCacheHeaders } from "@/lib/api-cache";

// GET: Fetch active amenities for public display
export async function GET(request: NextRequest) {
  try {
    const db = getFirestore();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const snapshot = await db.collection("amenities").get();

    let amenities = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((amenity: any) => amenity.status === true || amenity.status === "active");

    if (category && category !== "all") {
      amenities = amenities.filter((amenity: any) => amenity.category === category);
    }

    // Sort by order field
    amenities.sort((a: any, b: any) => {
      const aOrder = a.order ?? 999999;
      const bOrder = b.order ?? 999999;
      return aOrder - bOrder;
    });

    return NextResponse.json(amenities, { headers: apiCacheHeaders() });
  } catch (error: any) {
    console.error("Error fetching amenities:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch amenities" },
      { status: 500 }
    );
  }
}
