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
    const { name, slug, status, photos, videos, googlePhotosAlbumUrl } = body;

    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (name) updateData.name = name.trim();

    if (slug) {
      const newSlug = slug.toLowerCase().trim();
      // Check if slug already exists (excluding current event)
      const existingEvent = await db.collection("galleryEvents")
        .where("slug", "==", newSlug)
        .limit(1)
        .get();

      if (!existingEvent.empty && existingEvent.docs[0].id !== id) {
        return NextResponse.json(
          { error: "An album with this slug already exists" },
          { status: 400 }
        );
      }
      updateData.slug = newSlug;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    if (photos !== undefined) {
      updateData.photos = Array.isArray(photos) ? photos : [];
    }

    if (videos !== undefined) {
      updateData.videos = Array.isArray(videos) ? videos : [];
    }

    if (googlePhotosAlbumUrl !== undefined) {
      updateData.googlePhotosAlbumUrl = googlePhotosAlbumUrl ? googlePhotosAlbumUrl.trim() : null;
    }

    await db.collection("galleryEvents").doc(id).update(updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating gallery event:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update gallery event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getFirestore();
    const { id } = await params;

    // Delete event document
    await db.collection("galleryEvents").doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting gallery event:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete gallery event" },
      { status: 500 }
    );
  }
}
