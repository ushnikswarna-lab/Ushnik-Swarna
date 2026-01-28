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

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

const db = admin.firestore();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { email, role, disabled, displayName, password } = body;

    // Update user in Firebase Authentication if password is provided
    if (password) {
      await admin.auth().updateUser(id, {
        password,
      });
    }

    // Update user document in Firestore
    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (email !== undefined) updateData.email = email;
    if (role !== undefined) {
      if (!["admin", "manager", "user"].includes(role)) {
        return NextResponse.json(
          { error: "Invalid role. Must be 'admin' or 'manager'" },
          { status: 400 }
        );
      }
      updateData.role = role;
    }
    if (disabled !== undefined) {
      updateData.disabled = disabled;
      // Also update in Auth
      await admin.auth().updateUser(id, {
        disabled: disabled,
      });
    }
    if (displayName !== undefined) updateData.displayName = displayName;

    await db.collection("users").doc(id).update(updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete user from Firebase Authentication
    await admin.auth().deleteUser(id);

    // Delete user document from Firestore
    await db.collection("users").doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete user" },
      { status: 400 }
    );
  }
}

