import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { apiCacheHeaders } from "@/lib/api-cache";

// GET: Fetch active accommodations for public display
export async function GET(request: NextRequest) {
  try {
    const db = getFirestore();
    const snapshot = await db.collection("accommodations").get();

    let accommodations = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((acc: any) => acc.status === true || acc.status === "active");

    // Sort by order field
    accommodations.sort((a: any, b: any) => {
      const aOrder = a.order ?? 999999;
      const bOrder = b.order ?? 999999;
      return aOrder - bOrder;
    });

    return NextResponse.json(accommodations, { headers: apiCacheHeaders() });
  } catch (error: any) {
    console.error("Error fetching accommodations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch accommodations" },
      { status: 500 }
    );
  }
}
