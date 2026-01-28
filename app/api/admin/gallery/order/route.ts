import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin, getFirestore } from "@/lib/firebase-admin";

// PATCH: Update order of gallery events
export async function PATCH(request: NextRequest) {
  try {
    const admin = getFirebaseAdmin();
    const db = getFirestore();
    const body = await request.json();
    const { ids } = body; // Array of event IDs in the new order

    if (!Array.isArray(ids)) {
      return NextResponse.json(
        { error: "ids must be an array" },
        { status: 400 }
      );
    }

    // Update order for each event
    const batch = db.batch();
    ids.forEach((eventId: string, index: number) => {
      const ref = db.collection("galleryEvents").doc(eventId);
      batch.update(ref, {
        order: index + 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error reordering gallery events:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reorder gallery events" },
      { status: 500 }
    );
  }
}
