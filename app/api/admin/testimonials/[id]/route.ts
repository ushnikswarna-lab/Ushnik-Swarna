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

// GET: Fetch single testimonial
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
    const doc = await db.collection("testimonials").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
    }

    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (error: any) {
    console.error("Error fetching testimonial:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch testimonial" },
      { status: 500 }
    );
  }
}

// PUT: Update testimonial
export async function PUT(
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

    const docRef = db.collection("testimonials").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
    }

    const updateData: any = {
      guestName: body.guestName?.trim(),
      guestLocation: body.guestLocation?.trim() || null,
      rating: body.rating ? Number(body.rating) : 5,
      review: body.review?.trim(),
      stayDate: body.stayDate || null,
      avatar: body.avatar || null,
      status: body.status || "pending",
      featured: !!body.featured,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (body.reply !== undefined) {
      updateData.reply = body.reply?.trim() || null;
      if (body.reply?.trim()) {
        updateData.replyDate = admin.firestore.FieldValue.serverTimestamp();
      } else {
        updateData.replyDate = null;
      }
    }

    await docRef.update(updateData);

    return NextResponse.json({ id, ...updateData });
  } catch (error: any) {
    console.error("Error updating testimonial:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update testimonial" },
      { status: 500 }
    );
  }
}

// PATCH: Update testimonial status or featured
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
    const { status, featured, reply } = body;

    const docRef = db.collection("testimonials").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
    }

    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (status !== undefined) updateData.status = status;
    if (featured !== undefined) updateData.featured = featured;
    if (reply !== undefined) {
      updateData.reply = reply?.trim() || null;
      if (reply?.trim()) {
        updateData.replyDate = admin.firestore.FieldValue.serverTimestamp();
      } else {
        updateData.replyDate = null;
      }
    }

    await docRef.update(updateData);

    return NextResponse.json({ id, ...updateData });
  } catch (error: any) {
    console.error("Error updating testimonial:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update testimonial" },
      { status: 500 }
    );
  }
}

// DELETE: Delete testimonial
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
    const docRef = db.collection("testimonials").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
    }

    await docRef.delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting testimonial:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete testimonial" },
      { status: 500 }
    );
  }
}
