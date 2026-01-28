import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin, getFirestore } from "@/lib/firebase-admin";

// GET: Fetch single subscriber
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getFirestore();
    const doc = await db.collection("newsletter").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }

    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (error: any) {
    console.error("Error fetching subscriber:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch subscriber" },
      { status: 500 }
    );
  }
}

// PATCH: Update subscriber status (subscribe/unsubscribe)
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

    if (!status || !["subscribed", "unsubscribed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'subscribed' or 'unsubscribed'" },
        { status: 400 }
      );
    }

    const docRef = db.collection("newsletter").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }

    await docRef.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id, status });
  } catch (error: any) {
    console.error("Error updating subscriber:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update subscriber" },
      { status: 500 }
    );
  }
}

// DELETE: Delete subscriber
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getFirestore();
    const docRef = db.collection("newsletter").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }

    await docRef.delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting subscriber:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete subscriber" },
      { status: 500 }
    );
  }
}
