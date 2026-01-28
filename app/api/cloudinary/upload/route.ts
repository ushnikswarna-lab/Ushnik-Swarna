import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
if (!cloudinary.config().cloud_name) {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string | null;
    const resourceType = formData.get("resourceType") as "image" | "video" | "auto" | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const uniqueFileName = `${timestamp}_${randomString}`;

    // Build public_id with folder if provided
    const publicId = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;

    // Upload to Cloudinary using signed upload (no preset needed)
    // Convert buffer to base64 data URI for upload
    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.type || 'image/jpeg'};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      public_id: publicId,
      folder: folder || undefined,
      resource_type: resourceType || "auto",
      quality: "auto:good",
      fetch_format: "auto",
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to upload image to Cloudinary",
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
