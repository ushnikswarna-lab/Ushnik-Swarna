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

// GET: Fetch all accommodations
export async function GET() {
  try {
    if (!getApps().length) {
      return NextResponse.json(
        { error: "Firebase Admin not initialized" },
        { status: 500 }
      );
    }

    const db = admin.firestore();
    const snapshot = await db.collection("accommodations").get();

    const accommodations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by order field (default to 999999 if not set), then by createdAt
    accommodations.sort((a: any, b: any) => {
      const aOrder = a.order ?? 999999;
      const bOrder = b.order ?? 999999;
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      const aCreated = a.createdAt?.toMillis?.() || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const bCreated = b.createdAt?.toMillis?.() || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return bCreated - aCreated;
    });

    return NextResponse.json(accommodations);
  } catch (error: any) {
    console.error("Error fetching accommodations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch accommodations" },
      { status: 500 }
    );
  }
}

// POST: Create a new accommodation
export async function POST(request: NextRequest) {
  try {
    if (!getApps().length) {
      return NextResponse.json(
        { error: "Firebase Admin not initialized" },
        { status: 500 }
      );
    }

    const db = admin.firestore();
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
    } = body;

    // Validate required fields
    if (!title?.trim() || !slug?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields: title, slug" },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingSnapshot = await db
      .collection("accommodations")
      .where("slug", "==", slug.trim())
      .get();

    if (!existingSnapshot.empty) {
      return NextResponse.json(
        { error: "An accommodation with this slug already exists" },
        { status: 400 }
      );
    }

    const accommodationData = {
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
      status: body.status || "active",
      order: 999999,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("accommodations").add(accommodationData);

    return NextResponse.json(
      { id: docRef.id, ...accommodationData },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating accommodation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create accommodation" },
      { status: 500 }
    );
  }
}
