import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { getApps } from "firebase-admin/app";

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  if (serviceAccount.projectId && serviceAccount.privateKey && serviceAccount.clientEmail) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
    } catch (error) {
      console.error("Firebase Admin initialization error:", error);
    }
  } else {
    console.error("Firebase Admin credentials are missing. Please check your environment variables.");
  }
}

// PATCH: Update an existing amenity
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!getApps().length) {
      return NextResponse.json(
        { error: "Firebase Admin not initialized" },
        { status: 500 }
      );
    }

    const db = admin.firestore();
    const { id } = await params;
    const body = await request.json();

    const {
      title,
      slug,
      category,
      type,
      shortDescription,
      description,
      operatingHours,
      availability,
      features,
      images,
      status,
    } = body;

    // Validate required fields
    if (!title?.trim() || !slug?.trim() || !category) {
      return NextResponse.json(
        { error: "Missing required fields: title, slug, category" },
        { status: 400 }
      );
    }

    // Check if slug already exists (excluding current document)
    const existingSnapshot = await db
      .collection("amenities")
      .where("slug", "==", slug.trim())
      .get();

    const slugExists = existingSnapshot.docs.some((doc) => doc.id !== id);

    if (slugExists) {
      return NextResponse.json(
        { error: "An amenity with this slug already exists" },
        { status: 400 }
      );
    }

    const updateData: any = {
      title: title.trim(),
      slug: slug.trim(),
      category,
      type: type?.trim() || null,
      shortDescription: shortDescription?.trim() || null,
      description: description?.trim() || null,
      operatingHours: operatingHours?.trim() || null,
      availability: availability?.trim() || null,
      features: Array.isArray(features) ? features.filter((f: string) => f.trim()) : [],
      images: Array.isArray(images) ? images : [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (status !== undefined) {
      updateData.status = status;
    }

    await db.collection("amenities").doc(id).update(updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating amenity:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update amenity" },
      { status: 500 }
    );
  }
}

// DELETE: Remove an amenity
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!getApps().length) {
      return NextResponse.json(
        { error: "Firebase Admin not initialized" },
        { status: 500 }
      );
    }

    const db = admin.firestore();
    const { id } = await params;

    await db.collection("amenities").doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting amenity:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete amenity" },
      { status: 500 }
    );
  }
}
