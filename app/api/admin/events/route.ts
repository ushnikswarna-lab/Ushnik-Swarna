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
  }
}

// GET: Fetch all events
export async function GET(request: NextRequest) {
  try {
    if (!getApps().length) {
      return NextResponse.json(
        { error: "Firebase Admin not initialized" },
        { status: 500 }
      );
    }

    const db = admin.firestore();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const upcoming = searchParams.get("upcoming");

    let query: admin.firestore.Query = db.collection("events");

    if (category && category !== "all") {
      query = query.where("category", "==", category);
    }

    const snapshot = await query.orderBy("eventDate", "asc").get();

    let events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter upcoming events if requested
    if (upcoming === "true") {
      const now = new Date();
      events = events.filter((event: any) => new Date(event.eventDate) >= now);
    }

    return NextResponse.json(events);
  } catch (error: any) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// POST: Create a new event
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
      description,
      eventDate,
      eventTime,
      endDate,
      endTime,
      category,
      location,
      images,
      registrationRequired,
      maxAttendees,
    } = body;

    // Validate required fields
    if (!title?.trim() || !slug?.trim() || !eventDate) {
      return NextResponse.json(
        { error: "Missing required fields: title, slug, eventDate" },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingSnapshot = await db
      .collection("events")
      .where("slug", "==", slug.trim())
      .get();

    if (!existingSnapshot.empty) {
      return NextResponse.json(
        { error: "An event with this slug already exists" },
        { status: 400 }
      );
    }

    const eventData = {
      title: title.trim(),
      slug: slug.trim(),
      description: description?.trim() || null,
      eventDate,
      eventTime: eventTime || null,
      endDate: endDate || null,
      endTime: endTime || null,
      category: category || "general",
      location: location?.trim() || null,
      images: Array.isArray(images) ? images : [],
      registrationRequired: !!registrationRequired,
      maxAttendees: maxAttendees ? Number(maxAttendees) : null,
      attendeeCount: 0,
      status: "active",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("events").add(eventData);

    return NextResponse.json(
      { id: docRef.id, ...eventData },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create event" },
      { status: 500 }
    );
  }
}
