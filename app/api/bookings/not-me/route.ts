import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { getApps } from "firebase-admin/app";

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
  const doneUrl = `${base.replace(/\/$/, "")}/bookings/not-me-done`;

  if (!token || !id || !getApps().length) {
    return NextResponse.redirect(doneUrl);
  }

  try {
    const db = admin.firestore();
    const ref = db.collection("bookings").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.redirect(doneUrl);

    const d = snap.data() as { verifyToken?: string };
    if (d.verifyToken !== token) return NextResponse.redirect(doneUrl);

    await ref.update({
      verifyToken: admin.firestore.FieldValue.delete(),
      verifyTokenExpiry: admin.firestore.FieldValue.delete(),
      emailDisputed: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.redirect(doneUrl);
  } catch (e) {
    console.error("not-me:", e);
    return NextResponse.redirect(doneUrl);
  }
}
