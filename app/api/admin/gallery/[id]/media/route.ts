import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin, getFirestore } from "@/lib/firebase-admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = getFirebaseAdmin();
    const db = getFirestore();
    const { id } = await params;
    const body = await request.json();
    const { photos, videos } = body;

    // Update event document with media
    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (photos !== undefined) {
      updateData.photos = Array.isArray(photos) ? photos : [];
    }

    if (videos !== undefined) {
      updateData.videos = Array.isArray(videos) ? videos : [];
    }

    await db.collection("galleryEvents").doc(id).update(updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating media:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update media" },
      { status: 500 }
    );
  }
}
