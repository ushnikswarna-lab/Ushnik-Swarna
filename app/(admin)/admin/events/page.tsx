"use client";

import * as React from "react";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
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
  Calendar as CalendarIcon,
  MapPin,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

interface Event {
  id: string;
  title: string;
  slug: string;
  description?: string;
  eventDate: string;
  eventTime?: string;
  endDate?: string;
  endTime?: string;
  category: string;
  location?: string;
  images: string[];
  registrationRequired: boolean;
  maxAttendees?: number;
  attendeeCount: number;
  status: "active" | "inactive" | "cancelled";
  createdAt: any;
}

const statusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  inactive: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

const categoryOptions = [
  { value: "general", label: "General" },
  { value: "celebration", label: "Celebration" },
  { value: "workshop", label: "Workshop" },
  { value: "activity", label: "Activity" },
  { value: "seasonal", label: "Seasonal" },
  { value: "wellness", label: "Wellness" },
];

export default function EventsPage() {
  const { userData: currentUser } = useAuth();
  const [data, setData] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Event | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Event | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [columnVisibility, setColumnVisibility] = useState({
    title: true,
    category: true,
    date: true,
    location: true,
    attendees: true,
    status: true,
    actions: true,
  });

  // Form state
  const [formData, setFormData] = useState<{
    title: string;
    slug: string;
    description: string;
    eventDate: string;
    eventTime: string;
    endDate: string;
    endTime: string;
    category: string;
    location: string;
    registrationRequired: boolean;
    maxAttendees: string;
    status: "active" | "inactive" | "cancelled";
  }>({
    title: "",
    slug: "",
    description: "",
    eventDate: "",
    eventTime: "",
    endDate: "",
    endTime: "",
    category: "general",
    location: "",
    registrationRequired: false,
    maxAttendees: "",
    status: "active",
  });

  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadData();
      setupRealtimeListener();
      
      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      };
    }
  }, [currentUser]);

  const setupRealtimeListener = () => {
    if (!db) {
      loadData();
      return;
    }
    
    try {
      const eventsQuery = query(
        collection(db, 'events'),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(
        eventsQuery,
        (snapshot) => {
          const events: Event[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as Event));
          setData(events);
          setLoading(false);
        },
        (error) => {
          console.error('Error in real-time listener:', error);
          loadData();
        }
      );
      
      unsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error('Error setting up real-time listener:', error);
      loadData();
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/events");
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      const list: Event[] = await response.json();
      setData(list);
    } catch (error: any) {
      console.error("Error loading events:", error);
      toast.error(error?.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const s = searchQuery.toLowerCase();
    return data.filter((item) => {
      const matchesSearch =
        (item.title || "").toLowerCase().includes(s) ||
        (item.description || "").toLowerCase().includes(s) ||
        (item.location || "").toLowerCase().includes(s);
      const matchesCategory = categoryFilter === "all" ? true : item.category === categoryFilter;
      const matchesStatus = statusFilter === "all" ? true : item.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [data, searchQuery, categoryFilter, statusFilter]);

  const pageCount = Math.ceil(filtered.length / pageSize);
  const paginatedData = filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  const handleSave = async () => {
    try {
      const url = editItem ? `/api/admin/events/${editItem.id}` : "/api/admin/events";
      const method = editItem ? "PUT" : "POST";

      const payload = {
        ...formData,
        maxAttendees: formData.maxAttendees ? Number(formData.maxAttendees) : null,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save event");
      }

      await loadData();
      setIsDialogOpen(false);
      resetForm();
      toast.success(editItem ? "Event updated" : "Event created");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save");
    }
  };

  const handleStatusToggle = useCallback(async (event: Event) => {
    try {
      const newStatus = event.status === "active" ? "inactive" : "active";
      const response = await fetch(`/api/admin/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      setData((prev) => prev.map((e) => (e.id === event.id ? { ...e, status: newStatus } : e)));
      toast.success("Status updated");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update status");
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/admin/events/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete event");
      }
      setData((prev) => prev.filter((i) => i.id !== id));
      toast.success("Event deleted");
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete");
    }
  }, []);

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      description: "",
      eventDate: "",
      eventTime: "",
      endDate: "",
      endTime: "",
      category: "general",
      location: "",
      registrationRequired: false,
      maxAttendees: "",
      status: "active",
    });
    setEditItem(null);
  };

  const openEdit = (event: Event) => {
    setEditItem(event);
    setFormData({
      title: event.title,
      slug: event.slug,
      description: event.description || "",
      eventDate: event.eventDate,
      eventTime: event.eventTime || "",
      endDate: event.endDate || "",
      endTime: event.endTime || "",
      category: event.category,
      location: event.location || "",
      registrationRequired: event.registrationRequired,
      maxAttendees: event.maxAttendees ? String(event.maxAttendees) : "",
      status: event.status,
    });
    setIsDialogOpen(true);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
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
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPageIndex(0);
            }}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPageIndex(0); }}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categoryOptions.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPageIndex(0); }}>
            <SelectTrigger className="h-9 w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
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
            <span className="hidden md:inline">New Event</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border w-full overflow-x-auto">
        <Table className="whitespace-nowrap">
          <TableHeader>
            <TableRow className="bg-muted/50 font-medium">
              {columnVisibility.title && <TableHead>Title</TableHead>}
              {columnVisibility.category && <TableHead>Category</TableHead>}
              {columnVisibility.date && <TableHead>Date</TableHead>}
              {columnVisibility.location && <TableHead>Location</TableHead>}
              {columnVisibility.attendees && <TableHead>Attendees</TableHead>}
              {columnVisibility.status && <TableHead>Status</TableHead>}
              {columnVisibility.actions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={Object.values(columnVisibility).filter(Boolean).length} className="h-24 text-center text-muted-foreground">
                  No events found
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((event) => (
                <TableRow key={event.id}>
                  {columnVisibility.title && (
                    <TableCell className="font-medium">{event.title}</TableCell>
                  )}
                  {columnVisibility.category && (
                    <TableCell>
                      <Badge variant="outline">
                        {categoryOptions.find((c) => c.value === event.category)?.label || event.category}
                      </Badge>
                    </TableCell>
                  )}
                  {columnVisibility.date && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{event.eventDate}</span>
                        {event.eventTime && <span className="text-xs text-muted-foreground">at {event.eventTime}</span>}
                      </div>
                    </TableCell>
                  )}
                  {columnVisibility.location && (
                    <TableCell>
                      {event.location ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{event.location}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  )}
                  {columnVisibility.attendees && (
                    <TableCell>
                      {event.registrationRequired ? (
                        <span>{event.attendeeCount}{event.maxAttendees ? `/${event.maxAttendees}` : ""}</span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  )}
                  {columnVisibility.status && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={event.status === "active"} onCheckedChange={() => handleStatusToggle(event)} />
                        <Badge variant="outline" className={statusColors[event.status]}>
                          {event.status}
                        </Badge>
                      </div>
                    </TableCell>
                  )}
                  {columnVisibility.actions && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(event)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setConfirmDelete(event)}>
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
            Showing {pageIndex * pageSize + 1} to {Math.min((pageIndex + 1) * pageSize, filtered.length)} of {filtered.length} events
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Event" : "Create Event"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      title: e.target.value,
                      slug: !editItem ? generateSlug(e.target.value) : formData.slug,
                    });
                  }}
                  placeholder="Event title"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="event-slug"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Event description..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Event Date Range *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start font-normal",
                      !formData.eventDate && "text-muted-foreground"
                    )}
                  >
                    {formData.eventDate ? (
                      formData.endDate ? (
                        <>
                          {format(parseISO(formData.eventDate), "PPP")} – {format(parseISO(formData.endDate), "PPP")}
                        </>
                      ) : (
                        format(parseISO(formData.eventDate), "PPP")
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
                      from: formData.eventDate ? parseISO(formData.eventDate) : undefined,
                      to: formData.endDate ? parseISO(formData.endDate) : undefined,
                    } as DateRange}
                    onSelect={(range) =>
                      setFormData({
                        ...formData,
                        eventDate: range?.from ? format(range.from, "yyyy-MM-dd") : "",
                        endDate: range?.to ? format(range.to, "yyyy-MM-dd") : "",
                      })
                    }
                    defaultMonth={formData.eventDate ? parseISO(formData.eventDate) : undefined}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formData.eventTime}
                  onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Event location"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.registrationRequired}
                  onCheckedChange={(v) => setFormData({ ...formData, registrationRequired: v })}
                />
                <Label>Registration Required</Label>
              </div>
              {formData.registrationRequired && (
                <div className="space-y-2">
                  <Label>Max Attendees</Label>
                  <Input
                    type="number"
                    value={formData.maxAttendees}
                    onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
                    placeholder="Unlimited"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formData.title || !formData.slug || !formData.eventDate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{confirmDelete?.title}</strong>? This action cannot be undone.
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
