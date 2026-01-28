import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin, getFirestore, getAuth } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const admin = getFirebaseAdmin();
    const db = getFirestore();
    const body = await request.json();
    const { uid, email, password, role, disabled, displayName } = body;

    // If uid is provided, just create Firestore document (for Google login auto-creation)
    if (uid && email) {
      if (role && !["admin", "manager", "user"].includes(role)) {
        return NextResponse.json(
          { error: "Invalid role. Must be 'admin', 'manager', or 'user'" },
          { status: 400 }
        );
      }

      // Check if user document already exists
      const existingDoc = await db.collection("users").doc(uid).get();
      if (existingDoc.exists) {
        return NextResponse.json({
          success: true,
          uid,
          email,
          message: "User already exists",
        });
      }

      // Create user document in Firestore only
      const userData: any = {
        uid,
        email,
        role: role || "user",
        disabled: disabled || false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (displayName) {
        userData.displayName = displayName;
      }

      await db.collection("users").doc(uid).set(userData);

      return NextResponse.json({
        success: true,
        uid,
        email,
      });
    }

    // Original flow: create user with email/password (admin/manager only)
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (role && !["admin", "manager"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'admin' or 'manager'" },
        { status: 400 }
      );
    }

    // Create user in Firebase Authentication using Admin SDK
    const auth = getAuth();
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName || undefined,
      disabled: disabled || false,
    });

    // Create user document in Firestore
    const userData: any = {
      uid: userRecord.uid,
      email: userRecord.email,
      role: role || "manager",
      disabled: disabled || false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (displayName) {
      userData.displayName = displayName;
    }

    await db.collection("users").doc(userRecord.uid).set(userData);

    return NextResponse.json({
      success: true,
      uid: userRecord.uid,
      email: userRecord.email,
    });
  } catch (error: any) {
    console.error("Error creating user:", error);

    let errorMessage = "Failed to create user";
    if (error.code === "auth/email-already-exists") {
      errorMessage = "Email is already in use";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password is too weak";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
