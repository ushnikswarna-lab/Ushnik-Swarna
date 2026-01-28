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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface GalleryEvent {
  id?: string;
  name: string;
  slug: string;
  status?: boolean;
  photos?: string[];
  videos?: string[];
  googlePhotosAlbumUrl?: string;
}

interface GalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventAdded: () => void;
  editEvent?: GalleryEvent | null;
}

export function GalleryDialog({
  open,
  onOpenChange,
  onEventAdded,
  editEvent = null,
}: GalleryDialogProps) {
  const isEditMode = !!editEvent;
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<boolean>(true);
  const [googlePhotosAlbumUrl, setGooglePhotosAlbumUrl] = useState("");

  // Generate slug from name
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Populate form when editing
  useEffect(() => {
    if (isEditMode && editEvent) {
      setName(editEvent.name || "");
      setSlug(editEvent.slug || "");
      setStatus(editEvent.status !== false);
      setGooglePhotosAlbumUrl(editEvent.googlePhotosAlbumUrl || "");
    } else {
      setName("");
      setSlug("");
      setStatus(true);
      setGooglePhotosAlbumUrl("");
    }
  }, [isEditMode, editEvent, open]);

  // Auto-generate slug when name changes (only in Create mode)
  useEffect(() => {
    if (!isEditMode && name) {
      setSlug(generateSlug(name));
    }
  }, [name, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter an album name");
      return;
    }

    if (!slug.trim()) {
      toast.error("Please enter a slug");
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const eventData: any = {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        status,
      };

      // Add Google Photos album URL if provided
      if (googlePhotosAlbumUrl.trim()) {
        // Normalize URL - add https:// if missing
        let normalizedUrl = googlePhotosAlbumUrl.trim();
        if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
          normalizedUrl = `https://${normalizedUrl}`;
        }
        eventData.googlePhotosAlbumUrl = normalizedUrl;
      }

      const url = isEditMode && editEvent?.id
        ? `/api/admin/gallery/${editEvent.id}`
        : "/api/admin/gallery";

      const method = isEditMode ? "PATCH" : "POST";

      setUploadProgress(30);
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      setUploadProgress(70);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${isEditMode ? "update" : "create"} album`);
      }

      const result = await response.json();

      setUploadProgress(100);
      toast.success(`Album ${isEditMode ? "updated" : "created"} successfully`);

      // Reset form
      setName("");
      setSlug("");
      setStatus(true);
      setGooglePhotosAlbumUrl("");

      onEventAdded();
    } catch (error: any) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} album:`, error);
      toast.error(error.message || `Failed to ${isEditMode ? "update" : "create"} album`);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const isProcessing = loading;

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open && !isProcessing) {
        onOpenChange(false);
      }
    }}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 gap-0"
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
          <DialogTitle>
            {isEditMode ? "Edit Gallery Album" : "Add New Gallery Album"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Edit the album name and slug."
              : "Create a new gallery album."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-3">
          <form id="gallery-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Album Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Annual Company Event 2024"
                disabled={isProcessing}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g., annual-company-event-2024"
                disabled={isProcessing}
                required
              />
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier for the album (auto-generated from name)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="googlePhotosAlbumUrl">External Album Link (Optional)</Label>
              <Input
                id="googlePhotosAlbumUrl"
                value={googlePhotosAlbumUrl}
                onChange={(e) => setGooglePhotosAlbumUrl(e.target.value)}
                placeholder="e.g., photos.app.goo.gl/..."
                disabled={isProcessing}
                type="url"
              />
              <p className="text-xs text-muted-foreground">
                Paste any single public link (Google Photos / Google Drive / etc).
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="status"
                checked={status}
                onCheckedChange={setStatus}
                disabled={isProcessing}
              />
              <Label htmlFor="status">Active</Label>
            </div>

            {loading && (
              <div className="space-y-2 py-2">
                <Progress value={uploadProgress} />
                <p className="text-xs text-muted-foreground text-center">
                  {isEditMode ? "Updating album..." : "Creating album..."}
                </p>
              </div>
            )}
          </form>
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
          <Button type="submit" form="gallery-form" disabled={isProcessing}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : (
              isEditMode ? "Update Album" : "Create Album"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
