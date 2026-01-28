import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin, getFirestore } from "@/lib/firebase-admin";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = getFirebaseAdmin();
        const db = getFirestore();
        const { id } = await params;
        const body = await request.json();

        if (typeof body.status !== "boolean") {
            return NextResponse.json({ error: "status must be a boolean" }, { status: 400 });
        }

        const docRef = db.collection("packages").doc(id);
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
