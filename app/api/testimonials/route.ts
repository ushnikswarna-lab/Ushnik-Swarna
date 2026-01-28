import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { getApps } from "firebase-admin/app";
import { apiCacheHeaders } from "@/lib/api-cache";

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

// GET: Fetch approved testimonials for public display
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
    const featured = searchParams.get("featured");
    const limit = searchParams.get("limit");

    let query: admin.firestore.Query = db
      .collection("testimonials")
      .where("status", "==", "approved");

    if (featured === "true") {
      query = query.where("featured", "==", true);
    }

    const snapshot = await query.orderBy("createdAt", "desc").get();

    let testimonials = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (limit) {
      testimonials = testimonials.slice(0, parseInt(limit));
    }

    return NextResponse.json(testimonials, { headers: apiCacheHeaders() });
  } catch (error: any) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch testimonials" },
      { status: 500 }
    );
  }
}
