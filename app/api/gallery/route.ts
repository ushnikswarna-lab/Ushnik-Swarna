import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { apiCacheHeaders } from "@/lib/api-cache";

export async function GET(request: NextRequest) {
  try {
    const db = getFirestore();
    const snapshot = await db.collection("galleryEvents").get();

    const events = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((event: any) => event.status !== false);

    // Sort by order field (default to 999 if not set), then by createdAt
    events.sort((a: any, b: any) => {
      const aOrder = a.order ?? 999;
      const bOrder = b.order ?? 999;
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      const aCreated = a.createdAt?.toMillis?.() || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const bCreated = b.createdAt?.toMillis?.() || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return bCreated - aCreated;
    });

    return NextResponse.json({ events }, { headers: apiCacheHeaders() });
  } catch (error: any) {
    console.error("Error fetching gallery events:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch gallery events" },
      { status: 500 }
    );
  }
}
