import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin, getFirestore } from "@/lib/firebase-admin";

// GET: Fetch single inquiry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getFirestore();
    const doc = await db.collection("inquiries").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (error: any) {
    console.error("Error fetching inquiry:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch inquiry" },
      { status: 500 }
    );
  }
}

// PUT: Update inquiry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = getFirebaseAdmin();
    const { id } = await params;
    const db = getFirestore();
    const body = await request.json();

    const docRef = db.collection("inquiries").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    const updateData = {
      ...body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    delete updateData.id;
    delete updateData.createdAt;

    await docRef.update(updateData);

    return NextResponse.json({ id, ...updateData });
  } catch (error: any) {
    console.error("Error updating inquiry:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update inquiry" },
      { status: 500 }
    );
  }
}

// PATCH: Update inquiry status
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

    const docRef = db.collection("inquiries").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (status !== undefined) updateData.status = status;

    await docRef.update(updateData);

    return NextResponse.json({ id, ...updateData });
  } catch (error: any) {
    console.error("Error updating inquiry status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update inquiry status" },
      { status: 500 }
    );
  }
}

// DELETE: Delete inquiry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getFirestore();
    const docRef = db.collection("inquiries").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    await docRef.delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting inquiry:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete inquiry" },
      { status: 500 }
    );
  }
}
