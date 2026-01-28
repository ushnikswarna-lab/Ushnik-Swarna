import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { getApps } from "firebase-admin/app";
import { sendBookingVerifiedEmail } from "@/lib/email";

if (!getApps().length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };
  if (serviceAccount.projectId && serviceAccount.privateKey && serviceAccount.clientEmail) {
    try { admin.initializeApp({ credential: admin.credential.cert(serviceAccount as admin.ServiceAccount) }); } catch (e) { console.error(e); }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const id = searchParams.get("id");
  const base = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const successUrl = `${base.replace(/\/$/, "")}/bookings/verify-success`;
  const failUrl = `${base.replace(/\/$/, "")}/bookings/verify-success?error=invalid`;

  if (!token || !id || !getApps().length) {
    return NextResponse.redirect(failUrl);
  }

  try {
    const db = admin.firestore();
    const ref = db.collection("bookings").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.redirect(failUrl);

    const d = snap.data() as { verifyToken?: string; verifyTokenExpiry?: { toDate: () => Date }; guestEmail?: string; guestName?: string };
    if (d.verifyToken !== token || !d.verifyTokenExpiry) return NextResponse.redirect(failUrl);

    const exp = d.verifyTokenExpiry && typeof (d.verifyTokenExpiry as any).toDate === "function"
      ? (d.verifyTokenExpiry as any).toDate()
      : d.verifyTokenExpiry && (d.verifyTokenExpiry as any).seconds
        ? new Date((d.verifyTokenExpiry as any).seconds * 1000)
        : null;
    if (!exp || new Date() > exp) return NextResponse.redirect(failUrl);

    await ref.update({
      emailVerified: true,
      verifyToken: admin.firestore.FieldValue.delete(),
      verifyTokenExpiry: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    try {
      await sendBookingVerifiedEmail(d.guestEmail || "", d.guestName || "Guest");
    } catch (e) {
      console.error("sendBookingVerifiedEmail:", e);
    }

    return NextResponse.redirect(successUrl);
  } catch (e) {
    console.error("verify booking:", e);
    return NextResponse.redirect(failUrl);
  }
}
