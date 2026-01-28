"use client";

export interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

export async function uploadToCloudinary(
  file: File | Blob,
  folder?: string,
  resourceType?: "image" | "video" | "auto"
): Promise<CloudinaryUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (folder) {
    formData.append("folder", folder);
  }
  if (resourceType) {
    formData.append("resourceType", resourceType);
  }

  // Use server-side API route for signed uploads (no unsigned preset needed)
  const response = await fetch("/api/cloudinary/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
    throw new Error(
      errorData.error || errorData.error?.message || `Failed to upload image to Cloudinary (${response.status})`
    );
  }

  return await response.json();
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  const response = await fetch(`/api/cloudinary/delete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ publicId }),
  });

  if (!response.ok) {
    throw new Error("Failed to delete image from Cloudinary");
  }
}
