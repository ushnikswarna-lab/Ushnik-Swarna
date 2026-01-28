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

// GET: Fetch active amenities for public display
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

    const snapshot = await db.collection("amenities").get();

    let amenities = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((amenity: any) => amenity.status === true || amenity.status === "active");

    if (category && category !== "all") {
      amenities = amenities.filter((amenity: any) => amenity.category === category);
    }

    // Sort by order field
    amenities.sort((a: any, b: any) => {
      const aOrder = a.order ?? 999999;
      const bOrder = b.order ?? 999999;
      return aOrder - bOrder;
    });

    return NextResponse.json(amenities, { headers: apiCacheHeaders() });
  } catch (error: any) {
    console.error("Error fetching amenities:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch amenities" },
      { status: 500 }
    );
  }
}
