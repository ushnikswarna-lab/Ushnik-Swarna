import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin, getFirestore } from "@/lib/firebase-admin";

// GET: Fetch all testimonials
export async function GET(request: NextRequest) {
  try {
    const db = getFirestore();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query: FirebaseFirestore.Query = db.collection("testimonials");

    if (status && status !== "all") {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.orderBy("createdAt", "desc").get();

    const testimonials = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(testimonials);
  } catch (error: any) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch testimonials" },
      { status: 500 }
    );
  }
}

// POST: Create a new testimonial
export async function POST(request: NextRequest) {
  try {
    const admin = getFirebaseAdmin();
    const db = getFirestore();
    const body = await request.json();

    const {
      guestName,
      guestLocation,
      rating,
      review,
      stayDate,
      avatar,
    } = body;

    // Validate required fields
    if (!guestName?.trim() || !review?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields: guestName, review" },
        { status: 400 }
      );
    }

    const testimonialData = {
      guestName: guestName.trim(),
      guestLocation: guestLocation?.trim() || null,
      rating: rating ? Number(rating) : 5,
      review: review.trim(),
      stayDate: stayDate || null,
      avatar: avatar || null,
      status: "pending",
      featured: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("testimonials").add(testimonialData);

    return NextResponse.json(
      { id: docRef.id, ...testimonialData },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating testimonial:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create testimonial" },
      { status: 500 }
    );
  }
}
