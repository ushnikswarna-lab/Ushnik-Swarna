"use client";

import * as React from "react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Columns,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Star,
  Check,
  X,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Testimonial {
  id: string;
  guestName: string;
  guestLocation?: string;
  rating: number;
  review: string;
  stayDate?: string;
  avatar?: string;
  status: "pending" | "approved" | "rejected";
  featured: boolean;
  reply?: string;
  replyDate?: any;
  createdAt: any;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  approved: "bg-green-500/10 text-green-500 border-green-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function TestimonialsPage() {
  const { userData: currentUser } = useAuth();
  const [data, setData] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Testimonial | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Testimonial | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [columnVisibility, setColumnVisibility] = useState({
    guest: true,
    rating: true,
    review: true,
    stayDate: true,
    status: true,
    featured: true,
    actions: true,
  });

  // Form state
  const [formData, setFormData] = useState({
    guestName: "",
    guestLocation: "",
    rating: 5,
    review: "",
    stayDate: "",
    status: "pending" as const,
    featured: false,
    reply: "",
  });
  const [replyingTo, setReplyingTo] = useState<Testimonial | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/testimonials");
      if (!response.ok) {
        throw new Error("Failed to fetch testimonials");
      }
      const list: Testimonial[] = await response.json();
      setData(list);
    } catch (error: any) {
      console.error("Error loading testimonials:", error);
      toast.error(error?.message || "Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const s = searchQuery.toLowerCase();
    return data.filter((item) => {
      const matchesSearch =
        (item.guestName || "").toLowerCase().includes(s) ||
        (item.guestLocation || "").toLowerCase().includes(s) ||
        (item.review || "").toLowerCase().includes(s);
      const matchesStatus = statusFilter === "all" ? true : item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, searchQuery, statusFilter]);

  const pageCount = Math.ceil(filtered.length / pageSize);
  const paginatedData = filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  const handleStatusChange = useCallback(async (testimonial: Testimonial, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/testimonials/${testimonial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      setData((prev) => prev.map((t) => (t.id === testimonial.id ? { ...t, status: newStatus as any } : t)));
      toast.success("Status updated");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update status");
    }
  }, []);

  const handleFeaturedToggle = useCallback(async (testimonial: Testimonial) => {
    try {
      const response = await fetch(`/api/admin/testimonials/${testimonial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !testimonial.featured }),
      });

      if (!response.ok) {
        throw new Error("Failed to update featured status");
      }

      setData((prev) => prev.map((t) => (t.id === testimonial.id ? { ...t, featured: !t.featured } : t)));
      toast.success("Featured status updated");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update");
    }
  }, []);

  const handleSave = async () => {
    try {
      const url = editItem
        ? `/api/admin/testimonials/${editItem.id}`
        : "/api/admin/testimonials";
      const method = editItem ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save testimonial");
      }

      await loadData();
      setIsDialogOpen(false);
      resetForm();
      toast.success(editItem ? "Testimonial updated" : "Testimonial created");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save");
    }
  };

  const handleDelete = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/admin/testimonials/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete testimonial");
      }
      setData((prev) => prev.filter((i) => i.id !== id));
      toast.success("Testimonial deleted");
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete");
    }
  }, []);

  const resetForm = () => {
    setFormData({
      guestName: "",
      guestLocation: "",
      rating: 5,
      review: "",
      stayDate: "",
      status: "pending",
      featured: false,
      reply: "",
    });
    setEditItem(null);
  };

  const handleReply = async (testimonial: Testimonial) => {
    if (!replyText.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }

    try {
      const response = await fetch(`/api/admin/testimonials/${testimonial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: replyText.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to save reply");
      }

      setData((prev) => prev.map((t) => (t.id === testimonial.id ? { ...t, reply: replyText.trim(), replyDate: new Date() } : t)));
      setReplyingTo(null);
      setReplyText("");
      toast.success("Reply saved");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save reply");
    }
  };

  const openEdit = (testimonial: Testimonial) => {
    setEditItem(testimonial);
    setFormData({
      guestName: testimonial.guestName,
      guestLocation: testimonial.guestLocation || "",
      rating: testimonial.rating,
      review: testimonial.review,
      stayDate: testimonial.stayDate || "",
      status: testimonial.status as "pending",
      featured: testimonial.featured,
      reply: testimonial.reply || "",
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="rounded-md border">
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 min-w-0">
      {/* Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search testimonials..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPageIndex(0);
            }}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPageIndex(0); }}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.keys(columnVisibility).map((key) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={columnVisibility[key as keyof typeof columnVisibility]}
                  onCheckedChange={(v) => setColumnVisibility((p) => ({ ...p, [key]: !!v }))}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="sm" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Add Testimonial</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border w-full overflow-x-auto">
        <Table className="whitespace-nowrap">
          <TableHeader>
            <TableRow className="bg-muted/50 font-medium">
              {columnVisibility.guest && <TableHead>Guest</TableHead>}
              {columnVisibility.rating && <TableHead>Rating</TableHead>}
              {columnVisibility.review && <TableHead>Review</TableHead>}
              {columnVisibility.stayDate && <TableHead>Stay Date</TableHead>}
              {columnVisibility.status && <TableHead>Status</TableHead>}
              {columnVisibility.featured && <TableHead>Featured</TableHead>}
              {columnVisibility.actions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={Object.values(columnVisibility).filter(Boolean).length} className="h-24 text-center text-muted-foreground">
                  No testimonials found
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((testimonial) => (
                <TableRow key={testimonial.id}>
                  {columnVisibility.guest && (
                    <TableCell>
                      <div>
                        <div className="font-medium">{testimonial.guestName}</div>
                        {testimonial.guestLocation && (
                          <div className="text-xs text-muted-foreground">{testimonial.guestLocation}</div>
                        )}
                      </div>
                    </TableCell>
                  )}
                  {columnVisibility.rating && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < testimonial.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
                          />
                        ))}
                      </div>
                    </TableCell>
                  )}
                  {columnVisibility.review && (
                    <TableCell className="max-w-xs">
                      <p className="truncate">{testimonial.review}</p>
                    </TableCell>
                  )}
                  {columnVisibility.stayDate && (
                    <TableCell>{testimonial.stayDate || "-"}</TableCell>
                  )}
                  {columnVisibility.status && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-7 w-7 ${testimonial.status === "approved" ? "bg-green-500/20 text-green-500" : ""}`}
                          onClick={() => handleStatusChange(testimonial, "approved")}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-7 w-7 ${testimonial.status === "rejected" ? "bg-red-500/20 text-red-500" : ""}`}
                          onClick={() => handleStatusChange(testimonial, "rejected")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                  {columnVisibility.featured && (
                    <TableCell>
                      <Switch checked={testimonial.featured} onCheckedChange={() => handleFeaturedToggle(testimonial)} />
                    </TableCell>
                  )}
                  {columnVisibility.actions && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setReplyingTo(testimonial); setReplyText(testimonial.reply || ""); }}>
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(testimonial)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setConfirmDelete(testimonial)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {pageIndex * pageSize + 1} to {Math.min((pageIndex + 1) * pageSize, filtered.length)} of {filtered.length} testimonials
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Rows per page:</span>
              <Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setPageIndex(0); }}>
                <SelectTrigger className="h-9 w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((size) => (
                    <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setPageIndex(0)} disabled={pageIndex === 0}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setPageIndex((p) => Math.max(0, p - 1))} disabled={pageIndex === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm px-2">Page {pageIndex + 1} of {pageCount || 1}</div>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setPageIndex((p) => Math.min(pageCount - 1, p + 1))} disabled={pageIndex >= pageCount - 1}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setPageIndex(pageCount - 1)} disabled={pageIndex >= pageCount - 1}>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(o) => { setIsDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Guest Name *</Label>
                <Input
                  value={formData.guestName}
                  onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={formData.guestLocation}
                  onChange={(e) => setFormData({ ...formData, guestLocation: e.target.value })}
                  placeholder="Mumbai, India"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rating</Label>
                <Select value={String(formData.rating)} onValueChange={(v) => setFormData({ ...formData, rating: Number(v) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((r) => (
                      <SelectItem key={r} value={String(r)}>{r} Star{r > 1 ? "s" : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Stay Date</Label>
                <Input
                  value={formData.stayDate}
                  onChange={(e) => setFormData({ ...formData, stayDate: e.target.value })}
                  placeholder="December 2025"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Review *</Label>
              <Textarea
                value={formData.review}
                onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                placeholder="Enter guest review..."
                rows={4}
              />
            </div>
            {editItem && (
              <div className="space-y-2">
                <Label>Reply to Review</Label>
                <Textarea
                  value={formData.reply}
                  onChange={(e) => setFormData({ ...formData, reply: e.target.value })}
                  placeholder="Enter your reply to this review..."
                  rows={3}
                />
              </div>
            )}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.featured}
                  onCheckedChange={(v) => setFormData({ ...formData, featured: v })}
                />
                <Label>Featured</Label>
              </div>
              <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formData.guestName || !formData.review}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={!!replyingTo} onOpenChange={() => { setReplyingTo(null); setReplyText(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Review</DialogTitle>
            <DialogDescription>
              Reply to <strong>{replyingTo?.guestName}</strong>&apos;s review
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Original Review:</p>
              <p className="text-sm text-muted-foreground">{replyingTo?.review}</p>
            </div>
            <div className="space-y-2">
              <Label>Your Reply</Label>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Enter your reply..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReplyingTo(null); setReplyText(""); }}>Cancel</Button>
            <Button onClick={() => replyingTo && handleReply(replyingTo)} disabled={!replyText.trim()}>
              Save Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Testimonial</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete testimonial from <strong>{confirmDelete?.guestName}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => { if (confirmDelete) { await handleDelete(confirmDelete.id); setConfirmDelete(null); } }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
