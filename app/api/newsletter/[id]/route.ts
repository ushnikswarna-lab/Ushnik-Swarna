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

// GET: Fetch single subscriber
export async function GET(
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

    const { id } = await params;
    const db = admin.firestore();
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
    if (!getApps().length) {
      return NextResponse.json(
        { error: "Firebase Admin not initialized" },
        { status: 500 }
      );
    }

    const { id } = await params;
    const db = admin.firestore();
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
    if (!getApps().length) {
      return NextResponse.json(
        { error: "Firebase Admin not initialized" },
        { status: 500 }
      );
    }

    const { id } = await params;
    const db = admin.firestore();
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
