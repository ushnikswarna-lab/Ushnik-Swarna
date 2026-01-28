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

// PATCH: Update an existing accommodation
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
      area,
      bedType,
      maxAdults,
      maxChildren,
      totalBeds,
      numberOfRooms,
      baseRate,
      weekendRate,
      seasonalRate,
      currency,
      shortDescription,
      description,
      servicesAndAmenities,
      features,
      images,
      status,
    } = body;

    // Validate required fields
    if (!title?.trim() || !slug?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields: title, slug" },
        { status: 400 }
      );
    }

    // Check if slug already exists (excluding current document)
    const existingSnapshot = await db
      .collection("accommodations")
      .where("slug", "==", slug.trim())
      .get();

    const slugExists = existingSnapshot.docs.some((doc) => doc.id !== id);

    if (slugExists) {
      return NextResponse.json(
        { error: "An accommodation with this slug already exists" },
        { status: 400 }
      );
    }

    const updateData: any = {
      title: title.trim(),
      slug: slug.trim(),
      area: area?.trim() || null,
      bedType: bedType?.trim() || null,
      maxAdults: maxAdults ? Number(maxAdults) : null,
      maxChildren: maxChildren ? Number(maxChildren) : null,
      totalBeds: totalBeds ? Number(totalBeds) : null,
      numberOfRooms: numberOfRooms ? Number(numberOfRooms) : 1,
      baseRate: baseRate ? Number(baseRate) : null,
      weekendRate: weekendRate ? Number(weekendRate) : null,
      seasonalRate: seasonalRate ? Number(seasonalRate) : null,
      currency: currency || "USD",
      shortDescription: shortDescription?.trim() || null,
      description: description?.trim() || null,
      servicesAndAmenities: Array.isArray(servicesAndAmenities) ? servicesAndAmenities.filter((s: string) => s.trim()) : [],
      features: Array.isArray(features) ? features.filter((f: string) => f.trim()) : [],
      images: Array.isArray(images) ? images : [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (status !== undefined) {
      updateData.status = status;
    }

    await db.collection("accommodations").doc(id).update(updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating accommodation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update accommodation" },
      { status: 500 }
    );
  }
}

// DELETE: Remove an accommodation
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

    await db.collection("accommodations").doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting accommodation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete accommodation" },
      { status: 500 }
    );
  }
}
