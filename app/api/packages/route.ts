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

// GET: Fetch active packages for public display
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
    const type = searchParams.get("type");

    const snapshot = await db.collection("packages").get();

    let packages = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((pkg: any) => pkg.status === true || pkg.status === "active");

    if (type && type !== "all") {
      packages = packages.filter((pkg: any) => pkg.type === type);
    }

    // Sort by order field
    packages.sort((a: any, b: any) => {
      const aOrder = a.order ?? 999999;
      const bOrder = b.order ?? 999999;
      return aOrder - bOrder;
    });

    return NextResponse.json(packages, { headers: apiCacheHeaders() });
  } catch (error: any) {
    console.error("Error fetching packages:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch packages" },
      { status: 500 }
    );
  }
}
