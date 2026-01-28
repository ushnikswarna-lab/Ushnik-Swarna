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
    const { name, slug, photos, videos, googlePhotosAlbumUrl } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: "Missing required fields: name and slug" },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingEvent = await db.collection("galleryEvents")
      .where("slug", "==", slug.toLowerCase())
      .limit(1)
      .get();

    if (!existingEvent.empty) {
      return NextResponse.json(
        { error: "An event with this slug already exists" },
        { status: 400 }
      );
    }

    // Get the current max order to assign a new order
    const existingEvents = await db.collection("galleryEvents").get();
    const maxOrder = existingEvents.docs.reduce((max, doc) => {
      const data = doc.data();
      return Math.max(max, data.order || 0);
    }, 0);

    // Create event document
    const eventData: any = {
      name: name.trim(),
      slug: slug.toLowerCase().trim(),
      status: true,
      order: maxOrder + 1,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (photos && Array.isArray(photos) && photos.length > 0) {
      eventData.photos = photos;
    }

    if (videos && Array.isArray(videos) && videos.length > 0) {
      eventData.videos = videos;
    }

    if (googlePhotosAlbumUrl) {
      eventData.googlePhotosAlbumUrl = googlePhotosAlbumUrl.trim();
    }

    const docRef = await db.collection("galleryEvents").add(eventData);

    return NextResponse.json({
      success: true,
      id: docRef.id
    });
  } catch (error: any) {
    console.error("Error creating gallery event:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create gallery event" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!getApps().length) {
      return NextResponse.json(
        { error: "Firebase Admin not initialized" },
        { status: 500 }
      );
    }

    const db = admin.firestore();
    const snapshot = await db.collection("galleryEvents").get();

    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

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

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error("Error fetching gallery events:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch gallery events" },
      { status: 500 }
    );
  }
}
