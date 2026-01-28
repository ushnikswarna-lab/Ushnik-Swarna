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
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Mail,
  CheckCircle2,
  XCircle,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface Inquiry {
  id: string;
  type: "general" | "group" | "event" | "media";
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  eventDate?: string;
  groupSize?: number;
  accommodationPreferences?: string;
  status: "pending" | "resolved" | "archived";
  createdAt: any;
}

const typeColors: Record<string, string> = {
  general: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  group: "bg-green-500/10 text-green-500 border-green-500/20",
  event: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  media: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  resolved: "bg-green-500/10 text-green-500 border-green-500/20",
  archived: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export default function InquiriesPage() {
  const { userData: currentUser } = useAuth();
  const [data, setData] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Inquiry | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [columnVisibility, setColumnVisibility] = useState({
    type: true,
    name: true,
    email: true,
    message: true,
    status: true,
    date: true,
    actions: true,
  });

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/inquiries");
      if (!response.ok) {
        throw new Error("Failed to fetch inquiries");
      }
      const list: Inquiry[] = await response.json();
      setData(list);
    } catch (error: any) {
      console.error("Error loading inquiries:", error);
      toast.error(error?.message || "Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const s = searchQuery.toLowerCase();
    return data.filter((item) => {
      const matchesSearch =
        (item.name || "").toLowerCase().includes(s) ||
        (item.email || "").toLowerCase().includes(s) ||
        (item.message || "").toLowerCase().includes(s) ||
        (item.company || "").toLowerCase().includes(s);
      const matchesType = typeFilter === "all" ? true : item.type === typeFilter;
      const matchesStatus = statusFilter === "all" ? true : item.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [data, searchQuery, typeFilter, statusFilter]);

  const pageCount = Math.ceil(filtered.length / pageSize);
  const paginatedData = filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  const handleStatusChange = useCallback(async (inquiry: Inquiry, newStatus: string) => {
    try {
      const response = await fetch(`/api/inquiries/${inquiry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update status");
      }

      setData((prev) => prev.map((i) => (i.id === inquiry.id ? { ...i, status: newStatus as any } : i)));
      toast.success("Inquiry status updated");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update status");
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/inquiries/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete inquiry");
      }
      setData((prev) => prev.filter((i) => i.id !== id));
      toast.success("Inquiry deleted");
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete");
    }
  }, []);

  const exportToCSV = () => {
    const headers = ["Type", "Name", "Email", "Phone", "Company", "Message", "Status", "Date"];
    const rows = filtered.map((i) => [
      i.type,
      i.name,
      i.email,
      i.phone || "",
      i.company || "",
      i.message.substring(0, 100),
      i.status,
      i.createdAt ? format(new Date(i.createdAt.toDate?.() || i.createdAt), "yyyy-MM-dd") : "",
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inquiries-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
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

  // Stats
  const stats = {
    total: data.length,
    pending: data.filter((i) => i.status === "pending").length,
    resolved: data.filter((i) => i.status === "resolved").length,
    general: data.filter((i) => i.type === "general").length,
    group: data.filter((i) => i.type === "group").length,
    event: data.filter((i) => i.type === "event").length,
    media: data.filter((i) => i.type === "media").length,
  };

  return (
    <div className="space-y-6 min-w-0">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Inquiries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.resolved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Group Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.group}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inquiries..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPageIndex(0);
            }}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPageIndex(0); }}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="group">Group Booking</SelectItem>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="media">Media/Press</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPageIndex(0); }}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
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

          <Button variant="outline" size="sm" onClick={exportToCSV}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border w-full overflow-x-auto">
        <Table className="whitespace-nowrap">
          <TableHeader>
            <TableRow className="bg-muted/50 font-medium">
              {columnVisibility.type && <TableHead>Type</TableHead>}
              {columnVisibility.name && <TableHead>Name</TableHead>}
              {columnVisibility.email && <TableHead>Email</TableHead>}
              {columnVisibility.message && <TableHead>Message</TableHead>}
              {columnVisibility.status && <TableHead>Status</TableHead>}
              {columnVisibility.date && <TableHead>Date</TableHead>}
              {columnVisibility.actions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={Object.values(columnVisibility).filter(Boolean).length} className="h-24 text-center text-muted-foreground">
                  No inquiries found
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((inquiry) => (
                <TableRow key={inquiry.id}>
                  {columnVisibility.type && (
                    <TableCell>
                      <Badge variant="outline" className={typeColors[inquiry.type]}>
                        {inquiry.type}
                      </Badge>
                    </TableCell>
                  )}
                  {columnVisibility.name && (
                    <TableCell className="font-medium">{inquiry.name}</TableCell>
                  )}
                  {columnVisibility.email && (
                    <TableCell>
                      <a href={`mailto:${inquiry.email}`} className="text-primary hover:underline">
                        {inquiry.email}
                      </a>
                    </TableCell>
                  )}
                  {columnVisibility.message && (
                    <TableCell className="max-w-xs">
                      <p className="truncate">{inquiry.message}</p>
                    </TableCell>
                  )}
                  {columnVisibility.status && (
                    <TableCell>
                      <Select value={inquiry.status} onValueChange={(v) => handleStatusChange(inquiry, v)}>
                        <SelectTrigger className="h-7 w-[110px]">
                          <Badge variant="outline" className={statusColors[inquiry.status]}>
                            {inquiry.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  )}
                  {columnVisibility.date && (
                    <TableCell>
                      {(() => {
    try {
      const rawDate = inquiry.createdAt?.toDate?.() ?? inquiry.createdAt
      const date = new Date(rawDate)

      return isNaN(date.getTime())
        ? "-"
        : format(date, "MM dd, yyyy")
    } catch {
      return "-"
    }
  })()}
                    </TableCell>
                  )}
                  {columnVisibility.actions && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedInquiry(inquiry)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setConfirmDelete(inquiry)}>
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
            Showing {pageIndex * pageSize + 1} to {Math.min((pageIndex + 1) * pageSize, filtered.length)} of {filtered.length} inquiries
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

      {/* View Inquiry Dialog */}
      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
            <DialogDescription>
              <Badge variant="outline" className={typeColors[selectedInquiry?.type || "general"]}>
                {selectedInquiry?.type}
              </Badge>
            </DialogDescription>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="font-medium">{selectedInquiry.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="font-medium">
                    <a href={`mailto:${selectedInquiry.email}`} className="text-primary hover:underline">
                      {selectedInquiry.email}
                    </a>
                  </p>
                </div>
                {selectedInquiry.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="font-medium">{selectedInquiry.phone}</p>
                  </div>
                )}
                {selectedInquiry.company && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Company</label>
                    <p className="font-medium">{selectedInquiry.company}</p>
                  </div>
                )}
                {selectedInquiry.eventDate && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Event Date</label>
                    <p className="font-medium">{selectedInquiry.eventDate}</p>
                  </div>
                )}
                {selectedInquiry.groupSize && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Group Size</label>
                    <p className="font-medium">{selectedInquiry.groupSize} people</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="font-medium">
                    <Badge variant="outline" className={statusColors[selectedInquiry.status]}>
                      {selectedInquiry.status}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date</label>
                  <p className="font-medium">
                    {selectedInquiry.createdAt ? format(new Date(selectedInquiry.createdAt.toDate?.() || selectedInquiry.createdAt), "PPP") : "-"}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Message</label>
                <p className="text-sm mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">{selectedInquiry.message}</p>
              </div>
              {selectedInquiry.accommodationPreferences && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Accommodation Preferences</label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">{selectedInquiry.accommodationPreferences}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedInquiry(null)}>Close</Button>
            {selectedInquiry && selectedInquiry.status !== "resolved" && (
              <Button onClick={() => { handleStatusChange(selectedInquiry, "resolved"); setSelectedInquiry(null); }}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark as Resolved
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Inquiry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete inquiry from <strong>{confirmDelete?.name}</strong>? This action cannot be undone.
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
