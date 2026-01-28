import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const db = getFirestore();
    const { slug } = await params;

    const snapshot = await db.collection("galleryEvents")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const eventData = snapshot.docs[0].data();

    if (eventData.status === false) {
      return NextResponse.json(
        { error: "Album not found" },
        { status: 404 }
      );
    }

    const event = {
      id: snapshot.docs[0].id,
      ...eventData,
    };

    return NextResponse.json({ event });
  } catch (error: any) {
    console.error("Error fetching gallery event:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch gallery event" },
      { status: 500 }
    );
  }
}
