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

// GET: Fetch all packages
export async function GET() {
    try {
        if (!getApps().length) {
            return NextResponse.json(
                { error: "Firebase Admin not initialized" },
                { status: 500 }
            );
        }

        const db = admin.firestore();
        const snapshot = await db.collection("packages").get();

        const packages = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        // Sort by order field (default to 999999 if not set), then by createdAt
        packages.sort((a: any, b: any) => {
            const aOrder = a.order ?? 999999;
            const bOrder = b.order ?? 999999;
            if (aOrder !== bOrder) {
                return aOrder - bOrder;
            }
            const aCreated = a.createdAt?.toMillis?.() || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
            const bCreated = b.createdAt?.toMillis?.() || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
            return bCreated - aCreated;
        });

        return NextResponse.json(packages);
    } catch (error: any) {
        console.error("Error fetching packages:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch packages" },
            { status: 500 }
        );
    }
}

// POST: Create a new package
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
            title,
            slug,
            type,
            shortDescription,
            description,
            basePrice,
            discountedPrice,
            currency,
            inclusions,
            exclusions,
            validFrom,
            validTo,
            minPeople,
            maxPeople,
            duration,
            images,
        } = body;

        // Validate required fields
        if (!title?.trim() || !slug?.trim()) {
            return NextResponse.json(
                { error: "Missing required fields: title, slug" },
                { status: 400 }
            );
        }

        // Check if slug already exists
        const existingSnapshot = await db
            .collection("packages")
            .where("slug", "==", slug.trim())
            .get();

        if (!existingSnapshot.empty) {
            return NextResponse.json(
                { error: "A package with this slug already exists" },
                { status: 400 }
            );
        }

        const packageData = {
            title: title.trim(),
            slug: slug.trim(),
            type: type || "special_offer",
            shortDescription: shortDescription?.trim() || null,
            description: description?.trim() || null,
            basePrice: basePrice ? Number(basePrice) : null,
            discountedPrice: discountedPrice ? Number(discountedPrice) : null,
            currency: currency || "INR",
            inclusions: Array.isArray(inclusions) ? inclusions.filter((i: string) => i.trim()) : [],
            exclusions: Array.isArray(exclusions) ? exclusions.filter((e: string) => e.trim()) : [],
            validFrom: validFrom || null,
            validTo: validTo || null,
            minPeople: minPeople ? Number(minPeople) : null,
            maxPeople: maxPeople ? Number(maxPeople) : null,
            duration: duration?.trim() || null,
            images: Array.isArray(images) ? images : [],
            status: body.status || "active",
            order: 999999,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await db.collection("packages").add(packageData);

        return NextResponse.json(
            { id: docRef.id, ...packageData },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Error creating package:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create package" },
            { status: 500 }
        );
    }
}
