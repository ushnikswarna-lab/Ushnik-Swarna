import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin, getFirestore } from "@/lib/firebase-admin";

// GET: Fetch all newsletter subscribers (admin only)
export async function GET(request: NextRequest) {
  try {
    const db = getFirestore();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query: FirebaseFirestore.Query = db.collection("newsletter");

    if (status && status !== "all") {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.orderBy("createdAt", "desc").get();

    const subscribers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(subscribers);
  } catch (error: any) {
    console.error("Error fetching newsletter subscribers:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch subscribers" },
      { status: 500 }
    );
  }
}

// POST: Subscribe to newsletter
export async function POST(request: NextRequest) {
  try {
    const admin = getFirebaseAdmin();
    const db = getFirestore();
    const body = await request.json();
    const { email } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await db.collection("newsletter")
      .where("email", "==", email.trim().toLowerCase())
      .limit(1)
      .get();

    if (!existing.empty) {
      // If exists but unsubscribed, reactivate
      const existingDoc = existing.docs[0];
      const existingData = existingDoc.data();
      
      if (existingData.status === "unsubscribed") {
        await existingDoc.ref.update({
          status: "subscribed",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return NextResponse.json(
          { message: "Successfully resubscribed to newsletter!", id: existingDoc.id },
          { status: 200 }
        );
      }
      
      return NextResponse.json(
        { message: "You are already subscribed to our newsletter!" },
        { status: 200 }
      );
    }

    // Create new subscription
    const subscriberData = {
      email: email.trim().toLowerCase(),
      status: "subscribed",
      source: "website",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("newsletter").add(subscriberData);

    return NextResponse.json(
      { message: "Successfully subscribed to newsletter!", id: docRef.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error subscribing to newsletter:", error);
    return NextResponse.json(
      { error: error.message || "Failed to subscribe" },
      { status: 500 }
    );
  }
}
