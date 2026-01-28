import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin, getFirestore } from "@/lib/firebase-admin";

/**
 * PATCH: Update the order of amenities
 */
export async function PATCH(request: NextRequest) {
  try {
    const admin = getFirebaseAdmin();
    const db = getFirestore();
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid request. 'ids' must be a non-empty array" },
        { status: 400 }
      );
    }

    // Update order field for each amenity
    const batch = db.batch();
    ids.forEach((id: string, index: number) => {
      const docRef = db.collection("amenities").doc(id);
      batch.update(docRef, {
        order: index,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating amenities order:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update amenities order" },
      { status: 500 }
    );
  }
}
