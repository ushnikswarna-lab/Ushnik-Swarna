import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin, getFirestore } from "@/lib/firebase-admin";

// GET: Fetch single event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getFirestore();
    const doc = await db.collection("events").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (error: any) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch event" },
      { status: 500 }
    );
  }
}

// PUT: Update event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = getFirebaseAdmin();
    const { id } = await params;
    const db = getFirestore();
    const body = await request.json();

    const docRef = db.collection("events").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if slug is being changed and if it already exists
    if (body.slug && body.slug !== doc.data()?.slug) {
      const existingSnapshot = await db
        .collection("events")
        .where("slug", "==", body.slug.trim())
        .get();

      if (!existingSnapshot.empty) {
        return NextResponse.json(
          { error: "An event with this slug already exists" },
          { status: 400 }
        );
      }
    }

    const updateData = {
      title: body.title?.trim(),
      slug: body.slug?.trim(),
      description: body.description?.trim() || null,
      eventDate: body.eventDate,
      eventTime: body.eventTime || null,
      endDate: body.endDate || null,
      endTime: body.endTime || null,
      category: body.category || "general",
      location: body.location?.trim() || null,
      images: Array.isArray(body.images) ? body.images : [],
      registrationRequired: !!body.registrationRequired,
      maxAttendees: body.maxAttendees ? Number(body.maxAttendees) : null,
      status: body.status || "active",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await docRef.update(updateData);

    return NextResponse.json({ id, ...updateData });
  } catch (error: any) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update event" },
      { status: 500 }
    );
  }
}

// PATCH: Update event status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = getFirebaseAdmin();
    const { id } = await params;
    const db = getFirestore();
    const body = await request.json();
    const { status } = body;

    const docRef = db.collection("events").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (status !== undefined) updateData.status = status;

    await docRef.update(updateData);

    return NextResponse.json({ id, ...updateData });
  } catch (error: any) {
    console.error("Error updating event status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update event status" },
      { status: 500 }
    );
  }
}

// DELETE: Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getFirestore();
    const docRef = db.collection("events").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await docRef.delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete event" },
      { status: 500 }
    );
  }
}
