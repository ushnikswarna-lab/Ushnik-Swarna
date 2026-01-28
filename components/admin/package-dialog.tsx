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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Upload, X, Plus, Trash2 } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";

export type PackageStatus = "active" | "inactive";
export type PackageType = "special_offer" | "seasonal" | "honeymoon" | "family" | "group";

export interface Package {
    id?: string;
    title: string;
    slug: string;
    type: PackageType;
    shortDescription?: string;
    description?: string;
    basePrice?: number;
    discountedPrice?: number;
    currency?: string;
    inclusions?: string[];
    exclusions?: string[];
    validFrom?: string;
    validTo?: string;
    minPeople?: number;
    maxPeople?: number;
    duration?: string;
    images?: string[];
    status?: PackageStatus;
    createdAt?: any;
    updatedAt?: any;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved: () => void;
    editPackage?: Package | null;
}

const TOTAL_STEPS = 6;

export function PackageDialog({ open, onOpenChange, onSaved, editPackage }: Props) {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [type, setType] = useState<PackageType>("special_offer");
    const [shortDescription, setShortDescription] = useState("");
    const [description, setDescription] = useState("");
    const [basePrice, setBasePrice] = useState("");
    const [discountedPrice, setDiscountedPrice] = useState("");
    const [currency, setCurrency] = useState("INR");
    const [inclusions, setInclusions] = useState<string[]>([]);
    const [exclusions, setExclusions] = useState<string[]>([]);
    const [validFrom, setValidFrom] = useState("");
    const [validTo, setValidTo] = useState("");
    const [minPeople, setMinPeople] = useState("");
    const [maxPeople, setMaxPeople] = useState("");
    const [duration, setDuration] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [status, setStatus] = useState<PackageStatus>("active");

    useEffect(() => {
        if (open) {
            if (editPackage) {
                setTitle(editPackage.title || "");
                setSlug(editPackage.slug || "");
                setType(editPackage.type || "special_offer");
                setShortDescription(editPackage.shortDescription || "");
                setDescription(editPackage.description || "");
                setBasePrice(editPackage.basePrice?.toString() || "");
                setDiscountedPrice(editPackage.discountedPrice?.toString() || "");
                setCurrency(editPackage.currency || "INR");
                setInclusions(editPackage.inclusions || []);
                setExclusions(editPackage.exclusions || []);
                setValidFrom(editPackage.validFrom || "");
                setValidTo(editPackage.validTo || "");
                setMinPeople(editPackage.minPeople?.toString() || "");
                setMaxPeople(editPackage.maxPeople?.toString() || "");
                setDuration(editPackage.duration || "");
                setImages(editPackage.images || []);
                setStatus(editPackage.status || "active");
            } else {
                resetForm();
            }
            setCurrentStep(1);
        }
    }, [open, editPackage]);

    const resetForm = () => {
        setTitle("");
        setSlug("");
        setType("special_offer");
        setShortDescription("");
        setDescription("");
        setBasePrice("");
        setDiscountedPrice("");
        setCurrency("INR");
        setInclusions([]);
        setExclusions([]);
        setValidFrom("");
        setValidTo("");
        setMinPeople("");
        setMaxPeople("");
        setDuration("");
        setImages([]);
        setStatus("active");
    };

    // Auto-generate slug from title
    useEffect(() => {
        if (!editPackage && title) {
            const generatedSlug = title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");
            setSlug(generatedSlug);
        }
    }, [title, editPackage]);

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

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleImageUpload(e.dataTransfer.files);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleImageUpload(e.target.files);
        }
    };

    const handleImageUpload = async (files: FileList) => {
        setUploading(true);
        try {
            const uploadPromises = Array.from(files).map((file) => uploadToCloudinary(file));
            const responses = await Promise.all(uploadPromises);
            const urls = responses.map(response => response.secure_url);
            setImages((prev) => [...prev, ...urls]);
            toast.success(`${urls.length} image(s) uploaded successfully`);
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error(error?.message || "Failed to upload images");
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    // List handlers
    const addListItem = (listType: "inclusions" | "exclusions") => {
        if (listType === "inclusions") {
            setInclusions([...inclusions, ""]);
        } else {
            setExclusions([...exclusions, ""]);
        }
    };

    const removeListItem = (listType: "inclusions" | "exclusions", index: number) => {
        if (listType === "inclusions") {
            setInclusions(inclusions.filter((_, i) => i !== index));
        } else {
            setExclusions(exclusions.filter((_, i) => i !== index));
        }
    };

    const updateListItem = (
        listType: "inclusions" | "exclusions",
        index: number,
        value: string
    ) => {
        if (listType === "inclusions") {
            const updated = [...inclusions];
            updated[index] = value;
            setInclusions(updated);
        } else {
            const updated = [...exclusions];
            updated[index] = value;
            setExclusions(updated);
        }
    };

    // Validation
    const validateStep = (step: number): boolean => {
        if (step === 1) {
            if (!title.trim()) {
                toast.error("Title is required");
                return false;
            }
            if (!slug.trim()) {
                toast.error("Slug is required");
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
        }
    };

    const handlePrevious = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return;

        setLoading(true);
        try {
            const packageData: Package = {
                title,
                slug,
                type,
                shortDescription,
                description,
                basePrice: basePrice ? parseFloat(basePrice) : undefined,
                discountedPrice: discountedPrice ? parseFloat(discountedPrice) : undefined,
                currency,
                inclusions: inclusions.filter((i) => i.trim()),
                exclusions: exclusions.filter((e) => e.trim()),
                validFrom,
                validTo,
                minPeople: minPeople ? parseInt(minPeople) : undefined,
                maxPeople: maxPeople ? parseInt(maxPeople) : undefined,
                duration,
                images,
                status,
            };

            const url = editPackage
                ? `/api/admin/packages/${editPackage.id}`
                : "/api/admin/packages";
            const method = editPackage ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(packageData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to save package");
            }

            toast.success(editPackage ? "Package updated" : "Package created");
            onSaved();
        } catch (error: any) {
            console.error("Save error:", error);
            toast.error(error?.message || "Failed to save package");
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">
                                Title <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Summer Special Package"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="slug">
                                Slug <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="slug"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="e.g., summer-special-package"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">
                                Package Type <span className="text-destructive">*</span>
                            </Label>
                            <Select value={type} onValueChange={(v) => setType(v as PackageType)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="special_offer">Special Offer</SelectItem>
                                    <SelectItem value="seasonal">Seasonal Package</SelectItem>
                                    <SelectItem value="honeymoon">Honeymoon Package</SelectItem>
                                    <SelectItem value="family">Family Package</SelectItem>
                                    <SelectItem value="group">Group Package</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={status} onValueChange={(v) => setStatus(v as PackageStatus)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="shortDescription">Short Description</Label>
                            <Textarea
                                id="shortDescription"
                                value={shortDescription}
                                onChange={(e) => setShortDescription(e.target.value)}
                                placeholder="Brief description for preview cards"
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Full Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Detailed package description"
                                rows={6}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration</Label>
                            <Input
                                id="duration"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                placeholder="e.g., 3 Days / 2 Nights"
                            />
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="basePrice">Base Price</Label>
                                <Input
                                    id="basePrice"
                                    type="number"
                                    value={basePrice}
                                    onChange={(e) => setBasePrice(e.target.value)}
                                    placeholder="0"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="discountedPrice">Discounted Price</Label>
                                <Input
                                    id="discountedPrice"
                                    type="number"
                                    value={discountedPrice}
                                    onChange={(e) => setDiscountedPrice(e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Select value={currency} onValueChange={setCurrency}>
                                <SelectTrigger>
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

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="minPeople">Min People</Label>
                                <Input
                                    id="minPeople"
                                    type="number"
                                    value={minPeople}
                                    onChange={(e) => setMinPeople(e.target.value)}
                                    placeholder="0"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="maxPeople">Max People</Label>
                                <Input
                                    id="maxPeople"
                                    type="number"
                                    value={maxPeople}
                                    onChange={(e) => setMaxPeople(e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Valid Period</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start font-normal",
                                            !validFrom && "text-muted-foreground"
                                        )}
                                    >
                                        {validFrom ? (
                                            validTo ? (
                                                <>{format(parseISO(validFrom), "PPP")} – {format(parseISO(validTo), "PPP")}</>
                                            ) : (
                                                format(parseISO(validFrom), "PPP")
                                            )
                                        ) : (
                                            <span>Pick dates</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="range"
                                        numberOfMonths={2}
                                        selected={{
                                            from: validFrom ? parseISO(validFrom) : undefined,
                                            to: validTo ? parseISO(validTo) : undefined,
                                        } as DateRange}
                                        onSelect={(range) => {
                                            setValidFrom(range?.from ? format(range.from, "yyyy-MM-dd") : "");
                                            setValidTo(range?.to ? format(range.to, "yyyy-MM-dd") : "");
                                        }}
                                        defaultMonth={validFrom ? parseISO(validFrom) : undefined}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Inclusions</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addListItem("inclusions")}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {inclusions.map((item, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            value={item}
                                            onChange={(e) => updateListItem("inclusions", index, e.target.value)}
                                            placeholder="e.g., Breakfast included"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeListItem("inclusions", index)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                                {inclusions.length === 0 && (
                                    <p className="text-sm text-muted-foreground">No inclusions added</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Exclusions</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addListItem("exclusions")}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {exclusions.map((item, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            value={item}
                                            onChange={(e) => updateListItem("exclusions", index, e.target.value)}
                                            placeholder="e.g., Airfare not included"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeListItem("exclusions", index)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                                {exclusions.length === 0 && (
                                    <p className="text-sm text-muted-foreground">No exclusions added</p>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Package Images</Label>
                            <div
                                className={cn(
                                    "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                                    dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                                    uploading && "opacity-50 pointer-events-none"
                                )}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
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
                                    disabled={uploading}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => document.getElementById("image-upload")?.click()}
                                    disabled={uploading}
                                >
                                    {uploading ? "Uploading..." : "Select Images"}
                                </Button>
                            </div>
                        </div>

                        {images.length > 0 && (
                            <div className="grid grid-cols-3 gap-4">
                                {images.map((url, index) => (
                                    <div key={index} className="relative group aspect-video">
                                        <Image
                                            src={url}
                                            alt={`Package image ${index + 1}`}
                                            fill
                                            className="object-cover rounded-lg"
                                        />
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
                                <div><strong>Type:</strong> {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || "—"}</div>
                                {shortDescription && (
                                    <div><strong>Short Description:</strong> {shortDescription}</div>
                                )}
                            </div>
                        </div>

                        {description && (
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg">Description</h3>
                                <p className="text-sm text-muted-foreground">{description}</p>
                            </div>
                        )}

                        {(basePrice || discountedPrice) && (
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg">Pricing</h3>
                                <div className="grid gap-2 text-sm">
                                    {basePrice && <div><strong>Base Price:</strong> {currency} {basePrice}</div>}
                                    {discountedPrice && <div><strong>Discounted Price:</strong> {currency} {discountedPrice}</div>}
                                    {(validFrom || validTo) && (
                                        <div>
                                            <strong>Valid Period:</strong>{" "}
                                            {validFrom ? format(parseISO(validFrom), "MMM dd, yyyy") : "—"} to{" "}
                                            {validTo ? format(parseISO(validTo), "MMM dd, yyyy") : "—"}
                                        </div>
                                    )}
                                    {(minPeople || maxPeople) && (
                                        <div>
                                            <strong>People:</strong> {minPeople || "—"} to {maxPeople || "—"}
                                        </div>
                                    )}
                                    {duration && <div><strong>Duration:</strong> {duration}</div>}
                                </div>
                            </div>
                        )}

                        {inclusions.filter((i) => i.trim()).length > 0 && (
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg">Inclusions</h3>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                    {inclusions.filter((i) => i.trim()).map((item, index) => (
                                        <li key={index}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {exclusions.filter((e) => e.trim()).length > 0 && (
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg">Exclusions</h3>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                    {exclusions.filter((e) => e.trim()).map((item, index) => (
                                        <li key={index}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {images.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg">Images ({images.length})</h3>
                                <div className="grid grid-cols-3 gap-4">
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

    const stepTitles = [
        "Basic Information",
        "Description",
        "Pricing & Validity",
        "Inclusions & Exclusions",
        "Images",
        "Preview",
    ];

    const stepProgress = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
                <div className="flex max-h-[90vh] flex-col">
                    {/* Fixed Header */}
                    <div className="shrink-0 border-b bg-background mt-2 p-3">
                        <DialogHeader className="space-y-1">
                            <DialogTitle className="leading-none">
                                {editPackage ? "Edit Package" : "New Package"}
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
                                {loading ? "Saving..." : editPackage ? "Update" : "Create"}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
