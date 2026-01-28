import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin, getFirestore } from "@/lib/firebase-admin";

// PUT: Update an existing package
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = getFirebaseAdmin();
        const db = getFirestore();
        const { id } = await params;
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
            status,
        } = body;

        // Validate required fields
        if (!title?.trim() || !slug?.trim()) {
            return NextResponse.json(
                { error: "Missing required fields: title, slug" },
                { status: 400 }
            );
        }

        // Check if slug already exists (excluding current document)
        const existingSnapshot = await db
            .collection("packages")
            .where("slug", "==", slug.trim())
            .get();

        const slugExists = existingSnapshot.docs.some((doc) => doc.id !== id);

        if (slugExists) {
            return NextResponse.json(
                { error: "A package with this slug already exists" },
                { status: 400 }
            );
        }

        const updateData: any = {
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
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (status !== undefined) {
            updateData.status = status;
        }

        await db.collection("packages").doc(id).update(updateData);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error updating package:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update package" },
            { status: 500 }
        );
    }
}

// DELETE: Remove a package
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const db = getFirestore();
        const { id } = await params;

        await db.collection("packages").doc(id).delete();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting package:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete package" },
            { status: 500 }
        );
    }
}
