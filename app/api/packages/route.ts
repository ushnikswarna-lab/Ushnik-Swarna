import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { apiCacheHeaders } from "@/lib/api-cache";

// GET: Fetch active packages for public display
export async function GET(request: NextRequest) {
  try {
    const db = getFirestore();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const snapshot = await db.collection("packages").get();

    let packages = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((pkg: any) => pkg.status === true || pkg.status === "active");

    if (type && type !== "all") {
      packages = packages.filter((pkg: any) => pkg.type === type);
    }

    // Sort by order field
    packages.sort((a: any, b: any) => {
      const aOrder = a.order ?? 999999;
      const bOrder = b.order ?? 999999;
      return aOrder - bOrder;
    });

    return NextResponse.json(packages, { headers: apiCacheHeaders() });
  } catch (error: any) {
    console.error("Error fetching packages:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch packages" },
      { status: 500 }
    );
  }
}
