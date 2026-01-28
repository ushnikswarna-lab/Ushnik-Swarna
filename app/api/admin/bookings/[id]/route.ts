import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin, getFirestore } from "@/lib/firebase-admin";
import { sendBookingStatusChangeEmail } from "@/lib/email";

// GET: Fetch single booking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getFirestore();
    const doc = await db.collection("bookings").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (error: any) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

// PUT: Update booking
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = getFirebaseAdmin();
    const { id } = await params;
    const db = getFirestore();
    const body = await request.json();

    const docRef = db.collection("bookings").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const updateData = {
      ...body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.referenceNumber;
    delete updateData.createdAt;

    await docRef.update(updateData);

    return NextResponse.json({ id, ...updateData });
  } catch (error: any) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update booking" },
      { status: 500 }
    );
  }
}

// PATCH: Update booking status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = getFirebaseAdmin();
    const { id } = await params;
    const db = getFirestore();
    const body = await request.json();
    const { status, paymentStatus } = body;

    const docRef = db.collection("bookings").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const oldData = doc.data();
    const oldStatus = oldData?.status;

    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    await docRef.update(updateData);

    // Send email notification if status changed
    if (status && oldStatus && status !== oldStatus && oldData?.guestEmail) {
      try {
        await sendBookingStatusChangeEmail({
          guestEmail: oldData.guestEmail,
          guestName: oldData.guestName || "Guest",
          referenceNumber: oldData.referenceNumber || id,
          status: status as "pending" | "confirmed" | "cancelled" | "completed",
          accommodationTitle: oldData.accommodationTitle,
          checkInDates: oldData.checkInDates || (oldData.checkIn ? [oldData.checkIn] : undefined),
          numberOfRooms: oldData.numberOfRooms,
          totalAmount: oldData.totalAmount,
        });
      } catch (emailError) {
        console.error("Failed to send status change email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ id, ...updateData });
  } catch (error: any) {
    console.error("Error updating booking status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update booking status" },
      { status: 500 }
    );
  }
}

// DELETE: Delete booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getFirestore();
    const docRef = db.collection("bookings").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    await docRef.delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting booking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete booking" },
      { status: 500 }
    );
  }
}
