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
    } else {
        console.error("Firebase Admin credentials are missing. Please check your environment variables.");
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        if (typeof body.status !== "boolean") {
            return NextResponse.json({ error: "status must be a boolean" }, { status: 400 });
        }

        const docRef = admin.firestore().collection("packages").doc(id);
        await docRef.update({
            status: body.status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Status PATCH error:", err);
        return NextResponse.json(
            { error: err.message || "Failed to update status" },
            { status: 500 }
        );
    }
}
