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
    const { photos, videos } = body;

    // Update event document with media
    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (photos !== undefined) {
      updateData.photos = Array.isArray(photos) ? photos : [];
    }

    if (videos !== undefined) {
      updateData.videos = Array.isArray(videos) ? videos : [];
    }

    await db.collection("galleryEvents").doc(id).update(updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating media:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update media" },
      { status: 500 }
    );
  }
}
