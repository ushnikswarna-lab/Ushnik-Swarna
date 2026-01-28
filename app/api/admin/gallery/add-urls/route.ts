import { NextRequest, NextResponse } from "next/server";

/**
 * Add image/video URLs to gallery
 * Accepts URLs and validates them, optionally uploads to Cloudinary
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls, uploadToCloudinary = false } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "No URLs provided" },
        { status: 400 }
      );
    }

    const validatedUrls: Array<{
      url: string;
      type: "image" | "video";
      valid: boolean;
      cloudinaryUrl?: string;
    }> = [];

    for (const url of urls) {
      if (typeof url !== "string" || !url.trim()) {
        continue;
      }

      const trimmedUrl = url.trim();
      
      // Validate URL format
      try {
        new URL(trimmedUrl);
      } catch {
        validatedUrls.push({
          url: trimmedUrl,
          type: "image",
          valid: false,
        });
        continue;
      }

      // Determine type from URL extension or content
      const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/i.test(trimmedUrl) ||
                      trimmedUrl.includes("image") ||
                      trimmedUrl.match(/imgur|unsplash|pexels|pixabay/i);
      
      const isVideo = /\.(mp4|webm|mov|avi|mkv|flv|wmv)(\?|$)/i.test(trimmedUrl) ||
                      trimmedUrl.includes("video") ||
                      trimmedUrl.match(/youtube|vimeo|dailymotion/i);

      const type = isVideo ? "video" : isImage ? "image" : "image"; // Default to image

      let cloudinaryUrl: string | undefined;

      // Optionally upload to Cloudinary
      if (uploadToCloudinary) {
        try {
          const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
          const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

          if (cloudName && uploadPreset) {
            // Upload from URL to Cloudinary
            const uploadResponse = await fetch(
              `https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  file: trimmedUrl,
                  upload_preset: uploadPreset,
                  folder: type === "video" 
                    ? "production/gallery/videos" 
                    : "production/gallery/photos",
                }),
              }
            );

            if (uploadResponse.ok) {
              const result = await uploadResponse.json();
              cloudinaryUrl = result.secure_url;
            }
          }
        } catch (uploadError) {
          console.error(`Failed to upload ${trimmedUrl} to Cloudinary:`, uploadError);
          // Continue with original URL if Cloudinary upload fails
        }
      }

      validatedUrls.push({
        url: cloudinaryUrl || trimmedUrl,
        type,
        valid: true,
        ...(cloudinaryUrl && { cloudinaryUrl }),
      });
    }

    return NextResponse.json({
      success: true,
      urls: validatedUrls,
      validCount: validatedUrls.filter((u) => u.valid).length,
      invalidCount: validatedUrls.filter((u) => !u.valid).length,
    });
  } catch (error: any) {
    console.error("Error processing URLs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process URLs" },
      { status: 500 }
    );
  }
}
