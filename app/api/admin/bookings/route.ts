import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { getApps } from "firebase-admin/app";
import { randomBytes } from "crypto";
import { sendBookingIsItYouEmail, sendBookingReceivedEmail, sendBookingNotificationToAdmin } from "@/lib/email";

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

// GET: Fetch all bookings
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
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const reference = searchParams.get("reference");

    let query: admin.firestore.Query = db.collection("bookings");

    if (reference) {
      // Search by reference number
      query = query.where("referenceNumber", "==", reference.toUpperCase());
    } else if (status && status !== "all") {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.orderBy("createdAt", "desc").get();

    let bookings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter by date range if provided
    if (startDate || endDate) {
      bookings = bookings.filter((booking: any) => {
        const checkIn = new Date(booking.checkIn);
        if (startDate && checkIn < new Date(startDate)) return false;
        if (endDate && checkIn > new Date(endDate)) return false;
        return true;
      });
    }

    return NextResponse.json(bookings);
  } catch (error: any) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

// POST: Create a new booking
export async function POST(request: NextRequest) {
  try {
    if (!getApps().length) {
      return NextResponse.json(
        { error: "Firebase Admin not initialized" },
        { status: 500 }
      );
    }

    const db = admin.firestore();
    const body = await request.json();

    const {
      guestName,
      guestEmail,
      guestPhone,
      accommodationId,
      accommodationTitle,
      checkIn, // Legacy support
      checkOut, // Legacy support
      checkInDates, // New: array of dates
      numberOfRooms, // New: number of rooms to book
      adults,
      children,
      totalAmount,
      specialRequests,
      userId,
      userEmail,
    } = body;

    // Validate required fields
    // Support both old format (checkIn/checkOut) and new format (checkInDates)
    let finalCheckInDates: string[] = [];
    
    if (checkInDates && Array.isArray(checkInDates) && checkInDates.length > 0) {
      // New format: array of dates
      finalCheckInDates = checkInDates.map((d: any) => {
        if (typeof d === 'string') return d.split('T')[0];
        return new Date(d).toISOString().split('T')[0];
      });
    } else if (checkIn && checkOut) {
      // Old format: convert range to individual dates
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const current = new Date(start);
      while (current < end) {
        finalCheckInDates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
    }

    if (!guestName?.trim() || !guestEmail?.trim() || finalCheckInDates.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: guestName, guestEmail, and at least one check-in date" },
        { status: 400 }
      );
    }

    const finalNumberOfRooms = numberOfRooms ? Number(numberOfRooms) : 1;
    if (finalNumberOfRooms < 1) {
      return NextResponse.json(
        { error: "numberOfRooms must be at least 1" },
        { status: 400 }
      );
    }

    // Generate booking reference
    const refNumber = `BK${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const bookingData: any = {
      referenceNumber: refNumber,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      guestPhone: guestPhone?.trim() || null,
      accommodationId: accommodationId || null,
      accommodationTitle: accommodationTitle || null,
      // New format
      checkInDates: finalCheckInDates,
      numberOfRooms: finalNumberOfRooms,
      // Legacy support (for backward compatibility)
      checkIn: finalCheckInDates[0] || null,
      checkOut: finalCheckInDates.length > 0 ? finalCheckInDates[finalCheckInDates.length - 1] : null,
      adults: adults ? Number(adults) : 1,
      children: children ? Number(children) : 0,
      totalAmount: totalAmount ? Number(totalAmount) : null,
      specialRequests: specialRequests?.trim() || null,
      status: "pending",
      paymentStatus: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const isVerifiedUser = !!(userId && userEmail);
    if (userId) bookingData.userId = userId;
    if (userEmail) bookingData.userEmail = userEmail;

    // For non-verified users: add verification token and send "Is it you?" email
    if (!isVerifiedUser) {
      const verifyToken = randomBytes(32).toString("hex");
      const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
      bookingData.verifyToken = verifyToken;
      bookingData.verifyTokenExpiry = admin.firestore.Timestamp.fromDate(verifyTokenExpiry);
      bookingData.emailVerified = false;
    } else {
      bookingData.emailVerified = true;
    }

    const docRef = await db.collection("bookings").add(bookingData);
    const bookingId = docRef.id;

    const base = process.env.NEXT_PUBLIC_SITE_URL || (() => { try { return new URL(request.url).origin; } catch { return ""; } })();

    if (!isVerifiedUser) {
      const verifyUrl = `${base.replace(/\/$/, "")}/api/bookings/verify?token=${encodeURIComponent(bookingData.verifyToken)}&id=${bookingId}`;
      const notMeUrl = `${base.replace(/\/$/, "")}/api/bookings/not-me?token=${encodeURIComponent(bookingData.verifyToken)}&id=${bookingId}`;
      try {
        await sendBookingIsItYouEmail({
          guestEmail: bookingData.guestEmail,
          guestName: bookingData.guestName,
          verifyLink: verifyUrl,
          notMeLink: notMeUrl,
          referenceNumber: refNumber,
        });
      } catch (e) {
        console.error("Failed to send Is it you? email:", e);
      }
    } else {
      try {
        await sendBookingReceivedEmail(bookingData.guestEmail, bookingData.guestName, refNumber);
      } catch (e) {
        console.error("Failed to send booking received email:", e);
      }
    }

    // Send notification to admin
    try {
      await sendBookingNotificationToAdmin({
        referenceNumber: refNumber,
        guestName: bookingData.guestName,
        guestEmail: bookingData.guestEmail,
        guestPhone: bookingData.guestPhone || undefined,
        accommodationTitle: bookingData.accommodationTitle || undefined,
        checkInDates: bookingData.checkInDates || undefined,
        numberOfRooms: bookingData.numberOfRooms || undefined,
        adults: bookingData.adults,
        children: bookingData.children,
        totalAmount: bookingData.totalAmount || undefined,
        specialRequests: bookingData.specialRequests || undefined,
      });
    } catch (e) {
      console.error("Failed to send admin notification email:", e);
    }

    return NextResponse.json(
      { id: bookingId, ...bookingData },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create booking" },
      { status: 500 }
    );
  }
}
