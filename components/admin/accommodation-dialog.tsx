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
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Upload, X, Plus, Trash2 } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import Image from "next/image";

export type AccommodationStatus = "active" | "inactive";

export interface Accommodation {
  id?: string;
  title: string;
  slug: string;
  area?: string;
  bedType?: string;
  // Capacity details
  maxAdults?: number;
  maxChildren?: number;
  totalBeds?: number;
  numberOfRooms?: number; // Number of rooms available for this accommodation type
  guestCount?: number; // Keep for backward compatibility
  // Pricing
  baseRate?: number;
  weekendRate?: number;
  seasonalRate?: number;
  holidayRate?: number;
  currency?: string;
  shortDescription?: string;
  description?: string;
  servicesAndAmenities?: string[];
  features?: string[];
  images?: string[];
  status?: AccommodationStatus;
  createdAt?: any;
  updatedAt?: any;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  editAccommodation?: Accommodation | null;
}

const TOTAL_STEPS = 6;

export function AccommodationDialog({ open, onOpenChange, onSaved, editAccommodation }: Props) {
  const isEdit = !!editAccommodation;
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Step 1 fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [area, setArea] = useState("");
  const [bedType, setBedType] = useState("");
  const [maxAdults, setMaxAdults] = useState("");
  const [maxChildren, setMaxChildren] = useState("");
  const [totalBeds, setTotalBeds] = useState("");
  const [numberOfRooms, setNumberOfRooms] = useState("");
  const [shortDescription, setShortDescription] = useState("");

  // Step 2 fields - Pricing
  const [baseRate, setBaseRate] = useState("");
  const [weekendRate, setWeekendRate] = useState("");
  const [seasonalRate, setSeasonalRate] = useState("");
  const [holidayRate, setHolidayRate] = useState("");
  const [currency, setCurrency] = useState("INR");

  // Step 3 fields
  const [description, setDescription] = useState("");

  // Step 4 fields
  const [servicesAndAmenities, setServicesAndAmenities] = useState<string[]>([""]);
  const [features, setFeatures] = useState<string[]>([""]);

  // Step 5 fields
  const [images, setImages] = useState<string[]>([]);

  // Step 6 - Preview (no fields)

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
      if (isEdit && editAccommodation) {
        setTitle(editAccommodation.title || "");
        setSlug(editAccommodation.slug || "");
        setArea(editAccommodation.area || "");
        setBedType(editAccommodation.bedType || "");
        setMaxAdults(editAccommodation.maxAdults?.toString() || "");
        setMaxChildren(editAccommodation.maxChildren?.toString() || "");
        setTotalBeds(editAccommodation.totalBeds?.toString() || "");
        setNumberOfRooms(editAccommodation.numberOfRooms?.toString() || "");
        setShortDescription(editAccommodation.shortDescription || "");
        setBaseRate(editAccommodation.baseRate?.toString() || "");
        setWeekendRate(editAccommodation.weekendRate?.toString() || "");
        setSeasonalRate(editAccommodation.seasonalRate?.toString() || "");
        setHolidayRate(editAccommodation.holidayRate?.toString() || "");
        setCurrency(editAccommodation.currency || "INR");
        setDescription(editAccommodation.description || "");
        setServicesAndAmenities(
          editAccommodation.servicesAndAmenities?.length
            ? editAccommodation.servicesAndAmenities
            : [""]
        );
        setFeatures(
          editAccommodation.features?.length
            ? editAccommodation.features
            : [""]
        );
        setImages(editAccommodation.images || []);
        setCurrentStep(1);
      } else {
        // Reset for new accommodation
        setTitle("");
        setSlug("");
        setArea("");
        setBedType("");
        setMaxAdults("");
        setMaxChildren("");
        setTotalBeds("");
        setNumberOfRooms("");
        setShortDescription("");
        setBaseRate("");
        setWeekendRate("");
        setSeasonalRate("");
        setHolidayRate("");
        setCurrency("INR");
        setDescription("");
        setServicesAndAmenities([""]);
        setFeatures([""]);
        setImages([]);
        setCurrentStep(1);
      }
    }
  }, [open, isEdit, editAccommodation]);

  // Step progress (0/25/50/75/100)
  const stepProgress = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;

  // Image upload handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) {
      await handleImageUpload(e.dataTransfer.files);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      await handleImageUpload(e.target.files);
    }
  };

  const handleImageUpload = async (files: FileList) => {
    setUploadingImages(true);
    try {
      const uploadPromises = Array.from(files).map((file) =>
        uploadToCloudinary(file, "production/accommodations")
      );
      const results = await Promise.all(uploadPromises);
      const urls = results.map((r) => r.secure_url);
      setImages((prev) => [...prev, ...urls]);
      toast.success(`${urls.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error("Upload error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to upload image(s)";
      toast.error(message);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // List handlers
  const addListItem = (listType: "services" | "features") => {
    if (listType === "services") {
      setServicesAndAmenities((prev) => [...prev, ""]);
    } else {
      setFeatures((prev) => [...prev, ""]);
    }
  };

  const removeListItem = (listType: "services" | "features", index: number) => {
    if (listType === "services") {
      if (servicesAndAmenities.length > 1) {
        setServicesAndAmenities((prev) => prev.filter((_, i) => i !== index));
      }
    } else {
      if (features.length > 1) {
        setFeatures((prev) => prev.filter((_, i) => i !== index));
      }
    }
  };

  const updateListItem = (
    listType: "services" | "features",
    index: number,
    value: string
  ) => {
    if (listType === "services") {
      setServicesAndAmenities((prev) =>
        prev.map((item, i) => (i === index ? value : item))
      );
    } else {
      setFeatures((prev) =>
        prev.map((item, i) => (i === index ? value : item))
      );
    }
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

    const accommodationData = {
      title: title.trim(),
      slug: slug.trim(),
      area: area.trim() || null,
      bedType: bedType.trim() || null,
      maxAdults: maxAdults ? Number(maxAdults) : null,
      maxChildren: maxChildren ? Number(maxChildren) : null,
      totalBeds: totalBeds ? Number(totalBeds) : null,
      numberOfRooms: numberOfRooms ? Number(numberOfRooms) : 1,
      baseRate: baseRate ? Number(baseRate) : null,
      weekendRate: weekendRate ? Number(weekendRate) : null,
      seasonalRate: seasonalRate ? Number(seasonalRate) : null,
      holidayRate: holidayRate ? Number(holidayRate) : null,
      currency: currency || "INR",
      shortDescription: shortDescription.trim() || null,
      description: description.trim() || null,
      servicesAndAmenities: servicesAndAmenities.filter((s) => s.trim()),
      features: features.filter((f) => f.trim()),
      images,
      status: "active" as AccommodationStatus,
    };

    setLoading(true);

    try {
      const url = isEdit && editAccommodation?.id
        ? `/api/admin/accommodations/${editAccommodation.id}`
        : "/api/admin/accommodations";

      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accommodationData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save accommodation");
      }

      toast.success(isEdit ? "Accommodation updated successfully" : "Accommodation created successfully");
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving accommodation:", error);
      toast.error(error.message || "Failed to save accommodation");
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
                placeholder="Forest View Cottage"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">Slug * (auto-generated, editable)</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="forest-view-cottage"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="area">Area (sq m)</Label>
              <Input
                id="area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="37"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bedType">Bed Type</Label>
              <Input
                id="bedType"
                value={bedType}
                onChange={(e) => setBedType(e.target.value)}
                placeholder="King Bed, Twin Beds, etc."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="maxAdults">Max Adults</Label>
                <Input
                  id="maxAdults"
                  type="number"
                  value={maxAdults}
                  onChange={(e) => setMaxAdults(e.target.value)}
                  placeholder="2"
                  min="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxChildren">Max Children</Label>
                <Input
                  id="maxChildren"
                  type="number"
                  value={maxChildren}
                  onChange={(e) => setMaxChildren(e.target.value)}
                  placeholder="2"
                  min="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="totalBeds">Total Beds</Label>
                <Input
                  id="totalBeds"
                  type="number"
                  value={totalBeds}
                  onChange={(e) => setTotalBeds(e.target.value)}
                  placeholder="2"
                  min="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="numberOfRooms">Number of Rooms *</Label>
                <Input
                  id="numberOfRooms"
                  type="number"
                  value={numberOfRooms}
                  onChange={(e) => setNumberOfRooms(e.target.value)}
                  placeholder="1"
                  min="1"
                  required
                />
                <p className="text-xs text-muted-foreground">Total number of rooms available for this accommodation type</p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Textarea
                id="shortDescription"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Cozy cottage with forest views..."
                rows={3}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="font-medium mb-2">Pricing Information</h3>
            
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="baseRate">Base Rate (Per Night)</Label>
              <Input
                id="baseRate"
                type="number"
                value={baseRate}
                onChange={(e) => setBaseRate(e.target.value)}
                placeholder="150"
                min="0"
                step="0.01"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="weekendRate">Weekend Rate (Per Night)</Label>
              <Input
                id="weekendRate"
                type="number"
                value={weekendRate}
                onChange={(e) => setWeekendRate(e.target.value)}
                placeholder="200"
                min="0"
                step="0.01"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Different rate for Friday & Saturday nights
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="seasonalRate">Peak Season Rate (Per Night)</Label>
              <Input
                id="seasonalRate"
                type="number"
                value={seasonalRate}
                onChange={(e) => setSeasonalRate(e.target.value)}
                placeholder="250"
                min="0"
                step="0.01"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Rate during peak seasons (summer, etc.)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="holidayRate">Holiday Rate (Per Night)</Label>
              <Input
                id="holidayRate"
                type="number"
                value={holidayRate}
                onChange={(e) => setHolidayRate(e.target.value)}
                placeholder="300"
                min="0"
                step="0.01"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Rate during holidays and special occasions
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of the accommodation..."
                rows={8}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Services & Amenities</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addListItem("services")}
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {servicesAndAmenities.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => updateListItem("services", index, e.target.value)}
                      placeholder="e.g., Free WiFi, Air Conditioning"
                    />
                    {servicesAndAmenities.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeListItem("services", index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Features</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addListItem("features")}
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
                      onChange={(e) => updateListItem("features", index, e.target.value)}
                      placeholder="e.g., Private Balcony, Ocean View"
                    />
                    {features.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeListItem("features", index)}
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

      case 5:
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

      case 6:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Basic Information</h3>
              <div className="grid gap-2 text-sm">
                <div><strong>Title:</strong> {title || "—"}</div>
                <div><strong>Slug:</strong> {slug || "—"}</div>
                <div><strong>Area:</strong> {area ? `${area} sq m` : "—"}</div>
                <div><strong>Bed Type:</strong> {bedType || "—"}</div>
                <div><strong>Capacity:</strong> {maxAdults ? `${maxAdults} adults` : ""}{maxChildren ? `, ${maxChildren} children` : ""}{totalBeds ? `, ${totalBeds} beds` : ""} {!maxAdults && !maxChildren && !totalBeds ? "—" : ""}</div>
                <div><strong>Number of Rooms:</strong> {numberOfRooms || "1"}</div>
                {shortDescription && (
                  <div><strong>Short Description:</strong> {shortDescription}</div>
                )}
              </div>
            </div>

            {(baseRate || weekendRate || seasonalRate || holidayRate) && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Pricing</h3>
                <div className="grid gap-2 text-sm">
                  {baseRate && <div><strong>Base Rate:</strong> {currency} {baseRate}/night</div>}
                  {weekendRate && <div><strong>Weekend Rate:</strong> {currency} {weekendRate}/night</div>}
                  {seasonalRate && <div><strong>Seasonal Rate:</strong> {currency} {seasonalRate}/night</div>}
                  {holidayRate && <div><strong>Holiday Rate:</strong> {currency} {holidayRate}/night</div>}
                </div>
              </div>
            )}

            {description && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Description</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            )}

            {servicesAndAmenities.filter((s) => s.trim()).length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Services & Amenities</h3>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {servicesAndAmenities.filter((s) => s.trim()).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
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
                {isEdit ? "Edit Accommodation" : "New Accommodation"}
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
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentStep === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
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
