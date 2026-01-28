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
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Calendar as CalendarIcon,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, startOfWeek, endOfWeek, isWithinInterval, isSameMonth } from "date-fns";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  referenceNumber: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  accommodationId?: string;
  accommodationTitle?: string;
  checkIn?: string; // Legacy support
  checkOut?: string; // Legacy support
  checkInDates?: string[]; // New format: array of dates
  numberOfRooms?: number; // New format: number of rooms
  adults: number;
  children: number;
  totalAmount?: number;
  specialRequests?: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid" | "refunded";
  createdAt: any;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  confirmed: "bg-green-500/10 text-green-500 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
  completed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

const paymentStatusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  paid: "bg-green-500/10 text-green-500 border-green-500/20",
  refunded: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export default function BookingsPage() {
  const { userData: currentUser } = useAuth();
  const [data, setData] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Booking | null>(null);

  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [columnVisibility, setColumnVisibility] = useState({
    reference: true,
    guest: true,
    accommodation: true,
    dates: true,
    guests: true,
    amount: true,
    status: true,
    payment: true,
    actions: true,
  });

  useEffect(() => {
    if (currentUser) {
      loadData();
      // Set up real-time listener
      setupRealtimeListener();
      
      // Cleanup listener on unmount
      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      };
    }
  }, [currentUser]);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  const setupRealtimeListener = () => {
    if (!db) {
      // Fallback to regular fetch if db not available
      loadData();
      return;
    }
    
    try {
      const bookingsQuery = query(
        collection(db, 'bookings'),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(
        bookingsQuery,
        (snapshot) => {
          const bookings: Booking[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as Booking));
          setData(bookings);
          setLoading(false);
        },
        (error) => {
          console.error('Error in real-time listener:', error);
          // Fallback to regular fetch on error
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
      const response = await fetch("/api/admin/bookings");
      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }
      const list: Booking[] = await response.json();
      setData(list);
    } catch (error: any) {
      console.error("Error loading bookings:", error);
      toast.error(error?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const s = searchQuery.toLowerCase();
    return data.filter((item) => {
      const matchesSearch =
        (item.referenceNumber || "").toLowerCase().includes(s) ||
        (item.guestName || "").toLowerCase().includes(s) ||
        (item.guestEmail || "").toLowerCase().includes(s) ||
        (item.accommodationTitle || "").toLowerCase().includes(s);
      const matchesStatus = statusFilter === "all" ? true : item.status === statusFilter;
      const matchesPayment = paymentFilter === "all" ? true : item.paymentStatus === paymentFilter;
      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [data, searchQuery, statusFilter, paymentFilter]);

  const pageCount = Math.ceil(filtered.length / pageSize);
  const paginatedData = filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  const handleStatusChange = useCallback(async (booking: Booking, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update status");
      }

      setData((prev) => prev.map((b) => (b.id === booking.id ? { ...b, status: newStatus as any } : b)));
      toast.success("Booking status updated");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update status");
    }
  }, []);

  const handlePaymentStatusChange = useCallback(async (booking: Booking, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update payment status");
      }

      setData((prev) => prev.map((b) => (b.id === booking.id ? { ...b, paymentStatus: newStatus as any } : b)));
      toast.success("Payment status updated");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update payment status");
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete booking");
      }
      setData((prev) => prev.filter((i) => i.id !== id));
      toast.success("Booking deleted");
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error?.message || "Failed to delete");
    }
  }, []);

  const exportToCSV = () => {
    const headers = ["Reference", "Guest Name", "Email", "Phone", "Accommodation", "Check-in Dates", "Number of Rooms", "Adults", "Children", "Amount", "Status", "Payment"];
    const rows = filtered.map((b) => [
      b.referenceNumber,
      b.guestName,
      b.guestEmail,
      b.guestPhone || "",
      b.accommodationTitle || "",
      b.checkInDates && Array.isArray(b.checkInDates) && b.checkInDates.length > 0
        ? b.checkInDates.join(', ')
        : (b.checkIn && b.checkOut ? `${b.checkIn} - ${b.checkOut}` : b.checkIn || "N/A"),
      b.numberOfRooms?.toString() || "1",
      b.adults,
      b.children,
      b.totalAmount || "",
      b.status,
      b.paymentStatus,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${format(new Date(), "yyyy-MM-dd")}.csv`;
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
    pending: data.filter((b) => b.status === "pending").length,
    confirmed: data.filter((b) => b.status === "confirmed").length,
    completed: data.filter((b) => b.status === "completed").length,
  };

  return (
    <div className="space-y-6 min-w-0">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.confirmed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle and Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "calendar")}>
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>
        </Tabs>
        {viewMode === "list" && (
          <>
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPageIndex(0);
                }}
                className="pl-9 h-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPageIndex(0); }}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v); setPageIndex(0); }}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All payments</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
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
          </>
        )}

        <Button variant="outline" size="sm" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* View Content */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "calendar")} className="w-full">
        <TabsContent value="list" className="space-y-4">
          {/* Table */}
          <div className="rounded-md border w-full overflow-x-auto">
            <Table className="whitespace-nowrap">
              <TableHeader>
                <TableRow className="bg-muted/50 font-medium">
                  {columnVisibility.reference && <TableHead>Reference</TableHead>}
                  {columnVisibility.guest && <TableHead>Guest</TableHead>}
                  {columnVisibility.accommodation && <TableHead>Accommodation</TableHead>}
                  {columnVisibility.dates && <TableHead>Dates</TableHead>}
                  {columnVisibility.guests && <TableHead>Guests</TableHead>}
                  {columnVisibility.amount && <TableHead>Amount</TableHead>}
                  {columnVisibility.status && <TableHead>Status</TableHead>}
                  {columnVisibility.payment && <TableHead>Payment</TableHead>}
                  {columnVisibility.actions && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={Object.values(columnVisibility).filter(Boolean).length} className="h-24 text-center text-muted-foreground">
                      No bookings found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((booking) => (
                    <TableRow key={booking.id}>
                      {columnVisibility.reference && (
                        <TableCell className="font-mono text-sm">{booking.referenceNumber}</TableCell>
                      )}
                      {columnVisibility.guest && (
                        <TableCell>
                          <div>
                            <div className="font-medium">{booking.guestName}</div>
                            <div className="text-xs text-muted-foreground">{booking.guestEmail}</div>
                          </div>
                        </TableCell>
                      )}
                      {columnVisibility.accommodation && (
                        <TableCell>{booking.accommodationTitle || "-"}</TableCell>
                      )}
                      {columnVisibility.dates && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">
                              {(() => {
                                // Support both old format (checkIn/checkOut) and new format (checkInDates)
                                if (booking.checkInDates && Array.isArray(booking.checkInDates) && booking.checkInDates.length > 0) {
                                  const dates = booking.checkInDates.map(d => {
                                    try {
                                      const date = typeof d === 'string' ? parseISO(d) : new Date(d);
                                      return format(date, "MMM dd");
                                    } catch {
                                      return d;
                                    }
                                  });
                                  return `${dates.length} date${dates.length > 1 ? 's' : ''}: ${dates.join(', ')}`;
                                } else if (booking.checkIn && booking.checkOut) {
                                  try {
                                    return `${format(parseISO(booking.checkIn), "MMM dd, yyyy")} - ${format(parseISO(booking.checkOut), "MMM dd, yyyy")}`;
                                  } catch {
                                    return `${booking.checkIn} - ${booking.checkOut}`;
                                  }
                                } else if (booking.checkIn) {
                                  try {
                                    return format(parseISO(booking.checkIn), "MMM dd, yyyy");
                                  } catch {
                                    return booking.checkIn;
                                  }
                                }
                                return "N/A";
                              })()}
                            </span>
                            {booking.numberOfRooms && booking.numberOfRooms > 1 && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {booking.numberOfRooms} rooms
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {columnVisibility.guests && (
                        <TableCell>
                          {booking.adults}A{booking.children > 0 && `, ${booking.children}C`}
                        </TableCell>
                      )}
                      {columnVisibility.amount && (
                        <TableCell>{booking.totalAmount ? `₹${booking.totalAmount.toLocaleString()}` : "-"}</TableCell>
                      )}
                      {columnVisibility.status && (
                        <TableCell>
                          <Select value={booking.status} onValueChange={(v) => handleStatusChange(booking, v)}>
                            <SelectTrigger className="h-7 w-[110px]">
                              <Badge variant="outline" className={statusColors[booking.status]}>
                                {booking.status}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      )}
                      {columnVisibility.payment && (
                        <TableCell>
                          <Select value={booking.paymentStatus} onValueChange={(v) => handlePaymentStatusChange(booking, v)}>
                            <SelectTrigger className="h-7 w-[100px]">
                              <Badge variant="outline" className={paymentStatusColors[booking.paymentStatus]}>
                                {booking.paymentStatus}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="refunded">Refunded</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      )}
                      {columnVisibility.actions && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setSelectedBooking(booking)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setConfirmDelete(booking)}>
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
            Showing {pageIndex * pageSize + 1} to {Math.min((pageIndex + 1) * pageSize, filtered.length)} of {filtered.length} bookings
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
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold font-heading">Booking Calendar</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-semibold min-w-[150px] text-center">
                  {format(selectedMonth, "MMMM yyyy")}
                </span>
                <Button variant="outline" size="sm" onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {/* Full Calendar Month Grid */}
                <div className="rounded-md border p-4 bg-background">
                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar Days Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const monthStart = startOfMonth(selectedMonth);
                      const monthEnd = endOfMonth(selectedMonth);
                      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
                      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
                      const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
                      
                      return days.map((day) => {
                        const isCurrentMonth = isSameMonth(day, selectedMonth);
                        const isToday = isSameDay(day, new Date());
                        
                        // Get bookings for this day - support both old and new formats
                        const dayBookings = filtered.filter((b) => {
                          if (b.checkInDates && Array.isArray(b.checkInDates) && b.checkInDates.length > 0) {
                            // New format: check if day is in checkInDates array
                            return b.checkInDates.some((dateStr: string) => {
                              try {
                                const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
                                return isSameDay(date, day);
                              } catch {
                                return false;
                              }
                            });
                          } else if (b.checkIn && b.checkOut && typeof b.checkIn === 'string' && typeof b.checkOut === 'string') {
                            // Old format: check if day is within range
                            try {
                              const checkIn = parseISO(b.checkIn);
                              const checkOut = parseISO(b.checkOut);
                              return isWithinInterval(day, { start: checkIn, end: checkOut });
                            } catch {
                              return false;
                            }
                          }
                          return false;
                        });
                        
                        const isCheckIn = filtered.some((b) => {
                          if (b.checkInDates && Array.isArray(b.checkInDates) && b.checkInDates.length > 0) {
                            return b.checkInDates.some((dateStr: string) => {
                              try {
                                const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
                                return isSameDay(date, day);
                              } catch {
                                return false;
                              }
                            });
                          } else if (b.checkIn && typeof b.checkIn === 'string') {
                            try {
                              return isSameDay(parseISO(b.checkIn), day);
                            } catch {
                              return false;
                            }
                          }
                          return false;
                        });
                        
                        const isCheckOut = filtered.some((b) => {
                          // For new format, check-out is the last date in checkInDates
                          if (b.checkInDates && Array.isArray(b.checkInDates) && b.checkInDates.length > 0) {
                            const lastDate = b.checkInDates[b.checkInDates.length - 1];
                            try {
                              const date = typeof lastDate === 'string' ? parseISO(lastDate) : new Date(lastDate);
                              return isSameDay(date, day);
                            } catch {
                              return false;
                            }
                          } else if (b.checkOut && typeof b.checkOut === 'string') {
                            try {
                              return isSameDay(parseISO(b.checkOut), day);
                            } catch {
                              return false;
                            }
                          }
                          return false;
                        });
                        
                        return (
                          <div
                            key={day.toISOString()}
                            className={cn(
                              "min-h-[80px] p-1 border rounded-md text-sm transition-colors",
                              !isCurrentMonth && "opacity-40 bg-muted/30",
                              isCurrentMonth && "bg-background",
                              isToday && "ring-2 ring-primary",
                              isCheckIn && "bg-green-500/20 border-green-500/50",
                              isCheckOut && "bg-blue-500/20 border-blue-500/50",
                              dayBookings.length > 0 && !isCheckIn && !isCheckOut && "bg-primary/10 border-primary/30"
                            )}
                          >
                            <div className={cn(
                              "font-semibold mb-1",
                              isToday && "text-primary"
                            )}>
                              {format(day, "d")}
                            </div>
                            <div className="space-y-0.5">
                              {dayBookings.slice(0, 2).map((booking) => (
                                <div
                                  key={booking.id}
                                  className={cn(
                                    "text-xs p-1 rounded truncate cursor-pointer hover:opacity-80",
                                    (() => {
                                      // Check if this is a check-in day
                                      if (booking.checkInDates && Array.isArray(booking.checkInDates)) {
                                        return booking.checkInDates.some((dateStr: string) => {
                                          try {
                                            const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
                                            return isSameDay(date, day);
                                          } catch {
                                            return false;
                                          }
                                        });
                                      } else if (booking.checkIn && typeof booking.checkIn === 'string') {
                                        try {
                                          return isSameDay(parseISO(booking.checkIn), day);
                                        } catch {
                                          return false;
                                        }
                                      }
                                      return false;
                                    })() && "bg-green-500/30 text-green-700 dark:text-green-300",
                                    (() => {
                                      // Check if this is a check-out day (last date)
                                      if (booking.checkInDates && Array.isArray(booking.checkInDates) && booking.checkInDates.length > 0) {
                                        const lastDate = booking.checkInDates[booking.checkInDates.length - 1];
                                        try {
                                          const date = typeof lastDate === 'string' ? parseISO(lastDate) : new Date(lastDate);
                                          return isSameDay(date, day);
                                        } catch {
                                          return false;
                                        }
                                      } else if (booking.checkOut) {
                                        try {
                                          return isSameDay(parseISO(booking.checkOut), day);
                                        } catch {
                                          return false;
                                        }
                                      }
                                      return false;
                                    })() && "bg-blue-500/30 text-blue-700 dark:text-blue-300",
                                    (() => {
                                      // Check if it's neither check-in nor check-out
                                      const isCI = (() => {
                                        if (booking.checkInDates && Array.isArray(booking.checkInDates)) {
                                          return booking.checkInDates.some((dateStr: string) => {
                                            try {
                                              const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
                                              return isSameDay(date, day);
                                            } catch {
                                              return false;
                                            }
                                          });
                                      } else if (booking.checkIn && typeof booking.checkIn === 'string') {
                                        try {
                                          return isSameDay(parseISO(booking.checkIn), day);
                                        } catch {
                                          return false;
                                        }
                                      }
                                        return false;
                                      })();
                                      const isCO = (() => {
                                        if (booking.checkInDates && Array.isArray(booking.checkInDates) && booking.checkInDates.length > 0) {
                                          const lastDate = booking.checkInDates[booking.checkInDates.length - 1];
                                          try {
                                            const date = typeof lastDate === 'string' ? parseISO(lastDate) : new Date(lastDate);
                                            return isSameDay(date, day);
                                          } catch {
                                            return false;
                                          }
                                        } else if (booking.checkOut && typeof booking.checkOut === 'string') {
                                          try {
                                            return isSameDay(parseISO(booking.checkOut), day);
                                          } catch {
                                            return false;
                                          }
                                        }
                                        return false;
                                      })();
                                      return !isCI && !isCO;
                                    })() && "bg-primary/20 text-primary"
                                  )}
                                  onClick={() => setSelectedBooking(booking)}
                                  title={`${booking.guestName} - ${booking.accommodationTitle || "N/A"}${booking.numberOfRooms && booking.numberOfRooms > 1 ? ` (${booking.numberOfRooms} rooms)` : ''}`}
                                >
                                  {(() => {
                                    if (booking.checkInDates && Array.isArray(booking.checkInDates)) {
                                      return booking.checkInDates.some((dateStr: string) => {
                                        try {
                                          const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
                                          return isSameDay(date, day);
                                        } catch {
                                          return false;
                                        }
                                      }) ? "✓ " : "";
                                    } else if (booking.checkIn && typeof booking.checkIn === 'string') {
                                      try {
                                        return isSameDay(parseISO(booking.checkIn), day) ? "✓ " : "";
                                      } catch {
                                        return "";
                                      }
                                    }
                                    return "";
                                  })()}
                                  {booking.guestName.split(" ")[0]}
                                  {booking.numberOfRooms && booking.numberOfRooms > 1 && ` (${booking.numberOfRooms})`}
                                </div>
                              ))}
                              {dayBookings.length > 2 && (
                                <div className="text-xs text-muted-foreground px-1">
                                  +{dayBookings.length - 2} more
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-3">Legend</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/50" />
                      <span>Check-in</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-blue-500/20 border border-blue-500/50" />
                      <span>Check-out</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-primary/10 border border-primary/30" />
                      <span>Booked</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Bookings This Month</h4>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {filtered
                      .filter((b) => {
                        // Support both old and new formats
                        let firstDate: Date | null = null;
                        if (b.checkInDates && Array.isArray(b.checkInDates) && b.checkInDates.length > 0) {
                          try {
                            const dateStr = b.checkInDates[0];
                            firstDate = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
                          } catch {
                            return false;
                          }
                        } else if (b.checkIn) {
                          try {
                            firstDate = parseISO(b.checkIn);
                          } catch {
                            return false;
                          }
                        }
                        if (!firstDate) return false;
                        const monthStart = startOfMonth(selectedMonth);
                        const monthEnd = endOfMonth(selectedMonth);
                        return firstDate >= monthStart && firstDate <= monthEnd;
                      })
                      .map((booking) => (
                        <Card key={booking.id} className="p-3 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedBooking(booking)}>
                          <div className="text-sm">
                            <p className="font-semibold">{booking.guestName}</p>
                            <p className="text-xs text-muted-foreground">{booking.accommodationTitle || "N/A"}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {(() => {
                                if (booking.checkInDates && Array.isArray(booking.checkInDates) && booking.checkInDates.length > 0) {
                                  const dates = booking.checkInDates.map(d => {
                                    try {
                                      const date = typeof d === 'string' ? parseISO(d) : new Date(d);
                                      return format(date, "MMM dd");
                                    } catch {
                                      return d;
                                    }
                                  });
                                  return `${dates.length} date${dates.length > 1 ? 's' : ''}: ${dates.join(', ')}`;
                                } else if (booking.checkIn && booking.checkOut) {
                                  try {
                                    return `${format(parseISO(booking.checkIn), "MMM dd")} - ${format(parseISO(booking.checkOut), "MMM dd")}`;
                                  } catch {
                                    return `${booking.checkIn} - ${booking.checkOut}`;
                                  }
                                } else if (booking.checkIn) {
                                  try {
                                    return format(parseISO(booking.checkIn), "MMM dd");
                                  } catch {
                                    return booking.checkIn;
                                  }
                                }
                                return "N/A";
                              })()}
                            </p>
                            {booking.numberOfRooms && booking.numberOfRooms > 1 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {booking.numberOfRooms} room{booking.numberOfRooms > 1 ? 's' : ''}
                              </p>
                            )}
                            <Badge variant="outline" className={statusColors[booking.status]}>{booking.status}</Badge>
                          </div>
                        </Card>
                      ))}
                    {filtered.filter((b) => {
                      let firstDate: Date | null = null;
                      if (b.checkInDates && Array.isArray(b.checkInDates) && b.checkInDates.length > 0) {
                        try {
                          const dateStr = b.checkInDates[0];
                          firstDate = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
                        } catch {
                          return false;
                        }
                      } else if (b.checkIn) {
                        try {
                          firstDate = parseISO(b.checkIn);
                        } catch {
                          return false;
                        }
                      }
                      if (!firstDate) return false;
                      const monthStart = startOfMonth(selectedMonth);
                      const monthEnd = endOfMonth(selectedMonth);
                      return firstDate >= monthStart && firstDate <= monthEnd;
                    }).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No bookings this month</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Booking Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>Reference: {selectedBooking?.referenceNumber}</DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Guest Name</label>
                  <p className="font-medium">{selectedBooking.guestName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="font-medium">{selectedBooking.guestEmail}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="font-medium">{selectedBooking.guestPhone || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Accommodation</label>
                  <p className="font-medium">{selectedBooking.accommodationTitle || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Check-in Dates</label>
                  <p className="font-medium">
                    {selectedBooking.checkInDates && Array.isArray(selectedBooking.checkInDates) && selectedBooking.checkInDates.length > 0
                      ? selectedBooking.checkInDates.map((d, i) => {
                          try {
                            const date = typeof d === 'string' ? parseISO(d) : new Date(d);
                            return format(date, "MMM dd, yyyy");
                          } catch {
                            return d;
                          }
                        }).join(', ')
                      : selectedBooking.checkIn || "N/A"}
                  </p>
                </div>
                {selectedBooking.numberOfRooms && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Number of Rooms</label>
                    <p className="font-medium">{selectedBooking.numberOfRooms}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Guests</label>
                  <p className="font-medium">{selectedBooking.adults} Adults, {selectedBooking.children} Children</p>
                  {selectedBooking.numberOfRooms && selectedBooking.numberOfRooms > 1 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedBooking.numberOfRooms} room{selectedBooking.numberOfRooms > 1 ? 's' : ''} × {selectedBooking.adults} adults, {selectedBooking.children} children
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Amount</label>
                  <p className="font-medium">{selectedBooking.totalAmount ? `₹${selectedBooking.totalAmount.toLocaleString()}` : "-"}</p>
                </div>
              </div>
              {selectedBooking.specialRequests && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Special Requests</label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">{selectedBooking.specialRequests}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete booking <strong>{confirmDelete?.referenceNumber}</strong>? This action cannot be undone.
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
