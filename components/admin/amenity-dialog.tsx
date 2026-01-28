"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Upload, X, Plus, Trash2 } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import Image from "next/image";

export type AmenityStatus = "active" | "inactive";
export type AmenityCategory = "indoor" | "outdoor" | "dining" | "wellness" | "recreation" | "services";

export interface Amenity {
  id?: string;
  title: string;
  slug: string;
  category: AmenityCategory;
  type?: string; // facility, service, activity
  shortDescription?: string;
  description?: string;
  features?: string[];
  operatingHours?: string;
  availability?: string;
  images?: string[];
  status?: AmenityStatus;
  featured?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  editAmenity?: Amenity | null;
}

const TOTAL_STEPS = 5;

export function AmenityDialog({ open, onOpenChange, onSaved, editAmenity }: Props) {
  const isEdit = !!editAmenity;
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Step 1 fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState<AmenityCategory>("indoor");
  const [type, setType] = useState("");
  const [shortDescription, setShortDescription] = useState("");

  // Step 2 fields
  const [description, setDescription] = useState("");
  const [operatingHours, setOperatingHours] = useState("");
  const [availability, setAvailability] = useState("");

  // Step 3 fields
  const [features, setFeatures] = useState<string[]>([""]);

  // Step 4 fields
  const [images, setImages] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);

  // Step 5 - Preview (no fields)

  // Auto-generate slug from title (only in add mode)
  useEffect(() => {
    if (!isEdit && title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setSlug(generatedSlug);
    }
  }, [title, isEdit]);

  // Populate form on edit / reset on add
  useEffect(() => {
    if (open) {
      if (isEdit && editAmenity) {
        setTitle(editAmenity.title || "");
        setSlug(editAmenity.slug || "");
        setCategory(editAmenity.category || "indoor");
        setType(editAmenity.type || "");
        setShortDescription(editAmenity.shortDescription || "");
        setDescription(editAmenity.description || "");
        setOperatingHours(editAmenity.operatingHours || "");
        setAvailability(editAmenity.availability || "");
        setFeatures(
          editAmenity.features?.length
            ? editAmenity.features
            : [""]
        );
        setImages(editAmenity.images || []);
        setFeatured(editAmenity.featured || false);
        setCurrentStep(1);
      } else {
        // Reset for new amenity
        setTitle("");
        setSlug("");
        setCategory("indoor");
        setType("");
        setShortDescription("");
        setDescription("");
        setOperatingHours("");
        setAvailability("");
        setFeatures([""]);
        setImages([]);
        setFeatured(false);
        setCurrentStep(1);
      }
    }
  }, [open, isEdit, editAmenity]);

  const stepProgress = (currentStep / TOTAL_STEPS) * 100;

  // Image upload handlers
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

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (files.length > 0) {
      await uploadImages(files);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      await uploadImages(files);
    }
  };

  const uploadImages = async (files: File[]) => {
    setUploadingImages(true);
    try {
      const uploadPromises = files.map((file) =>
        uploadToCloudinary(file, "amenities")
      );
      const results = await Promise.all(uploadPromises);
      const urls = results.map((result) => result.secure_url);
      setImages((prev) => [...prev, ...urls]);
      toast.success(`${files.length} image(s) uploaded successfully`);
    } catch (error: any) {
      console.error("Error uploading images:", error);
      toast.error(error?.message || "Failed to upload image(s)");
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // List handlers
  const addListItem = () => {
    setFeatures((prev) => [...prev, ""]);
  };

  const removeListItem = (index: number) => {
    if (features.length > 1) {
      setFeatures((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateListItem = (index: number, value: string) => {
    setFeatures((prev) =>
      prev.map((item, i) => (i === index ? value : item))
    );
  };

  // Validation
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!title.trim() || !slug.trim()) {
          toast.error("Title and slug are required");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(1)) return;

    const amenityData = {
      title: title.trim(),
      slug: slug.trim(),
      category,
      type: type.trim() || null,
      shortDescription: shortDescription.trim() || null,
      description: description.trim() || null,
      operatingHours: operatingHours.trim() || null,
      availability: availability.trim() || null,
      features: features.filter((f) => f.trim()),
      images,
      status: "active" as AmenityStatus,
      featured,
    };

    setLoading(true);

    try {
      const url = isEdit && editAmenity?.id
        ? `/api/admin/amenities/${editAmenity.id}`
        : "/api/admin/amenities";

      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(amenityData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save amenity");
      }

      toast.success(isEdit ? "Amenity updated successfully" : "Amenity created successfully");
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving amenity:", error);
      toast.error(error.message || "Failed to save amenity");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Swimming Pool"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">Slug * (auto-generated, editable)</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="swimming-pool"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as AmenityCategory)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indoor">Indoor</SelectItem>
                  <SelectItem value="outdoor">Outdoor</SelectItem>
                  <SelectItem value="dining">Dining</SelectItem>
                  <SelectItem value="wellness">Wellness</SelectItem>
                  <SelectItem value="recreation">Recreation</SelectItem>
                  <SelectItem value="services">Services</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facility">Facility</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                e.g., Facility (pool), Service (concierge), Activity (yoga class)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Textarea
                id="shortDescription"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Olympic-sized pool with stunning ocean views..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Switch
                id="featured"
                checked={featured}
                onCheckedChange={setFeatured}
              />
              <Label htmlFor="featured" className="cursor-pointer">
                Featured Amenity
              </Label>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Detailed Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of the amenity..."
                rows={6}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="operatingHours">Operating Hours</Label>
              <Input
                id="operatingHours"
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
                placeholder="6:00 AM - 10:00 PM daily"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="availability">Availability</Label>
              <Input
                id="availability"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                placeholder="Open year-round / Seasonal / By appointment"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Features & Highlights</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addListItem}
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {features.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => updateListItem(index, e.target.value)}
                      placeholder="e.g., Heated water, Poolside bar, Lifeguard on duty"
                    />
                    {features.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeListItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <Label>Images</Label>
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop images here, or click to select
              </p>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInput}
                className="hidden"
                id="image-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("image-upload")?.click()}
                disabled={uploadingImages}
              >
                {uploadingImages ? "Uploading..." : "Select Images"}
              </Button>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {images.map((url, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-video relative rounded-lg overflow-hidden border">
                      <Image
                        src={url}
                        alt={`Image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Basic Information</h3>
              <div className="grid gap-2 text-sm">
                <div><strong>Title:</strong> {title || "—"}</div>
                <div><strong>Slug:</strong> {slug || "—"}</div>
                <div><strong>Category:</strong> {category.charAt(0).toUpperCase() + category.slice(1)}</div>
                {type && <div><strong>Type:</strong> {type.charAt(0).toUpperCase() + type.slice(1)}</div>}
                {shortDescription && (
                  <div><strong>Short Description:</strong> {shortDescription}</div>
                )}
              </div>
            </div>

            {(operatingHours || availability) && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Operating Information</h3>
                <div className="grid gap-2 text-sm">
                  {operatingHours && <div><strong>Hours:</strong> {operatingHours}</div>}
                  {availability && <div><strong>Availability:</strong> {availability}</div>}
                </div>
              </div>
            )}

            {description && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Description</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            )}

            {features.filter((f) => f.trim()).length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Features</h3>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {features.filter((f) => f.trim()).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {images.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Images ({images.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((url, index) => (
                    <div key={index} className="aspect-video relative rounded-lg overflow-hidden border">
                      <Image
                        src={url}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex max-h-[90vh] flex-col">
          {/* Fixed Header */}
          <div className="shrink-0 border-b bg-background mt-2 p-3">
            <DialogHeader className="space-y-1">
              <DialogTitle className="leading-none">
                {isEdit ? "Edit Amenity" : "New Amenity"}
              </DialogTitle>
            </DialogHeader>

            {/* Progress Bar */}
            <div className="space-x-2 mt-2 flex items-center justify-center">
              <Progress value={stepProgress} className="" />
              <div className="text-sm text-muted-foreground">
                {Math.round(stepProgress)}%
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderStepContent()}
          </div>

          {/* Fixed Footer */}
          <div className="shrink-0 border-t bg-background p-3 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {TOTAL_STEPS}
            </div>

            {currentStep < TOTAL_STEPS ? (
              <Button size="sm" onClick={handleNext} disabled={loading}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleSubmit} disabled={loading}>
                {loading ? "Saving..." : isEdit ? "Update" : "Create"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
