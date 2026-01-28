"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload, X, Loader2, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface GalleryEvent {
  id: string;
  name: string;
  slug: string;
  photos?: string[];
  videos?: string[];
  googlePhotosAlbumUrl?: string;
}

interface GalleryMediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMediaUpdated: () => void;
  event: GalleryEvent | null;
}

export function GalleryMediaDialog({
  open,
  onOpenChange,
  onMediaUpdated,
  event,
}: GalleryMediaDialogProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [urlInput, setUrlInput] = useState("");
  const [addingUrls, setAddingUrls] = useState(false);

  useEffect(() => {
    if (event && open) {
      setPhotos(event.photos || []);
      setVideos(event.videos || []);
    } else {
      setPhotos([]);
      setVideos([]);
    }
  }, [event, open]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    if (!event) return;

    const imageFiles: File[] = [];
    const videoFiles: File[] = [];

    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        imageFiles.push(file);
      } else if (file.type.startsWith("video/")) {
        videoFiles.push(file);
      } else {
        toast.error(`${file.name} is not a valid image or video file`);
      }
    });

    setUploading(true);
    const totalFiles = imageFiles.length + videoFiles.length;
    let uploaded = 0;

    try {
      // Upload images
      for (const file of imageFiles) {
        const fileId = `${Date.now()}_${Math.random()}`;
        setUploadingFiles((prev) => new Set(prev).add(fileId));
        try {
          const folder = event?.slug
            ? `production/gallery/${event.slug}/photos`
            : "production/gallery/photos";

          const result = await uploadToCloudinary(file, folder, "image");
          setPhotos((prev) => [...prev, result.secure_url]);
          uploaded++;
          setUploadProgress((uploaded / totalFiles) * 100);
        } catch (error: any) {
          console.error(`Error uploading ${file.name}:`, error);
          toast.error(`Failed to upload ${file.name}: ${error.message}`);
        } finally {
          setUploadingFiles((prev) => {
            const next = new Set(prev);
            next.delete(fileId);
            return next;
          });
        }
      }

      // Upload videos
      for (const file of videoFiles) {
        const fileId = `${Date.now()}_${Math.random()}`;
        setUploadingFiles((prev) => new Set(prev).add(fileId));
        try {
          const folder = event?.slug
            ? `production/gallery/${event.slug}/videos`
            : "production/gallery/videos";

          const result = await uploadToCloudinary(file, folder, "video");
          setVideos((prev) => [...prev, result.secure_url]);
          uploaded++;
          setUploadProgress((uploaded / totalFiles) * 100);
        } catch (error: any) {
          console.error(`Error uploading ${file.name}:`, error);
          toast.error(`Failed to upload ${file.name}: ${error.message}`);
        } finally {
          setUploadingFiles((prev) => {
            const next = new Set(prev);
            next.delete(fileId);
            return next;
          });
        }
      }

      if (uploaded > 0) {
        toast.success(`Successfully uploaded ${uploaded} file(s)`);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!event) return;

    try {
      const response = await fetch(`/api/admin/gallery/${event.id}/media`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photos,
          videos,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update media");
      }

      toast.success("Media updated successfully");
      onMediaUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating media:", error);
      toast.error(error.message || "Failed to update media");
    }
  };

  const isProcessing = uploading || uploadingFiles.size > 0;

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open && !isProcessing) {
        onOpenChange(false);
      }
    }}>
      <DialogContent
        className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 gap-0"
        onInteractOutside={(e) => {
          if (isProcessing) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (isProcessing) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className="p-3 border-b">
          <DialogTitle>Manage Media - {event.name}</DialogTitle>
          <DialogDescription>
            Add or remove photos and videos for this album.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid gap-4">
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="upload">Upload Files</TabsTrigger>
                <TabsTrigger value="urls">Add URLs</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4 m-0">
                <div className="grid gap-2">
                  <Label>Add Photos & Videos</Label>
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                      dragActive
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-muted-foreground/50",
                      isProcessing && "opacity-50 pointer-events-none"
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      id="media-upload"
                      className="hidden"
                      accept="image/*,video/*"
                      onChange={handleFileInput}
                      disabled={isProcessing}
                      multiple
                    />
                    <label
                      htmlFor="media-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div className="text-sm">
                        <span className="text-primary font-medium">Click to upload</span> or drag and drop
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Images and videos up to 100MB each
                      </p>
                    </label>
                  </div>
                  {uploading && (
                    <div className="space-y-2">
                      <Progress value={uploadProgress} />
                      <p className="text-xs text-muted-foreground text-center">
                        Uploading files... {Math.round(uploadProgress)}%
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="urls" className="space-y-4 m-0">
                <div className="grid gap-2">
                  <Label htmlFor="url-input">Add Image/Video URLs</Label>
                  <Textarea
                    id="url-input"
                    placeholder="Enter URLs, one per line. Examples:&#10;https://example.com/image.jpg&#10;https://example.com/video.mp4"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    disabled={addingUrls}
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    onClick={async () => {
                      if (!urlInput.trim()) {
                        toast.error("Please enter at least one URL");
                        return;
                      }

                      const urls = urlInput
                        .split("\n")
                        .map((line) => line.trim())
                        .filter((line) => line.length > 0);

                      if (urls.length === 0) {
                        toast.error("No valid URLs found");
                        return;
                      }

                      setAddingUrls(true);
                      try {
                        const response = await fetch("/api/admin/gallery/add-urls", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            urls,
                            uploadToCloudinary: false,
                          }),
                        });

                        if (!response.ok) {
                          const error = await response.json();
                          throw new Error(error.error || "Failed to process URLs");
                        }

                        const result = await response.json();
                        const validUrls = result.urls.filter((u: any) => u.valid);

                        if (validUrls.length === 0) {
                          toast.error("No valid URLs found");
                          return;
                        }

                        // Add URLs to photos/videos arrays
                        validUrls.forEach((item: any) => {
                          if (item.type === "image") {
                            setPhotos((prev) => [...prev, item.url]);
                          } else {
                            setVideos((prev) => [...prev, item.url]);
                          }
                        });

                        toast.success(`Added ${validUrls.length} URL(s)`);
                        setUrlInput("");
                      } catch (error: any) {
                        console.error("Error adding URLs:", error);
                        toast.error(error.message || "Failed to add URLs");
                      } finally {
                        setAddingUrls(false);
                      }
                    }}
                    disabled={addingUrls || !urlInput.trim()}
                    className="w-full"
                  >
                    {addingUrls ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Add URLs
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* Photos Preview */}
            {photos.length > 0 && (
              <div className="grid gap-2">
                <Label>Photos ({photos.length})</Label>
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square group">
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removePhoto(index)}
                        disabled={isProcessing}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos Preview */}
            {videos.length > 0 && (
              <div className="grid gap-2">
                <Label>Videos ({videos.length})</Label>
                <div className="grid grid-cols-2 gap-2">
                  {videos.map((video, index) => (
                    <div key={index} className="relative aspect-video group">
                      <video
                        src={video}
                        className="w-full h-full object-cover rounded-lg border"
                        controls
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeVideo(index)}
                        disabled={isProcessing}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-3 border-t mt-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
