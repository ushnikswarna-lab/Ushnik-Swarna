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
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Mail,
  Download,
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";

function formatNewsletterDate(v: any): string {
  if (v == null) return "-";
  let date: Date | null = null;
  if (v instanceof Date && !isNaN(v.getTime())) date = v;
  else if (typeof v === "number" && !isNaN(v)) date = new Date(v);
  else if (typeof v === "string") {
    const d = new Date(v);
    date = isNaN(d.getTime()) ? null : d;
  } else if (v && typeof (v as { toDate?: () => Date }).toDate === "function") {
    const d = (v as { toDate: () => Date }).toDate();
    date = d && !isNaN(d.getTime()) ? d : null;
  } else if (v && (typeof (v as { seconds?: number }).seconds === "number" || typeof (v as { _seconds?: number })._seconds === "number")) {
    const s = (v as { seconds?: number; _seconds?: number }).seconds ?? (v as { _seconds?: number })._seconds;
    date = new Date((s as number) * 1000);
  }
  if (!date || isNaN(date.getTime())) return "-";
  try {
    return format(date, "MMM dd, yyyy");
  } catch {
    return "-";
  }
}

interface NewsletterSubscriber {
  id: string;
  email: string;
  status: "subscribed" | "unsubscribed";
  source?: string;
  createdAt: any;
  updatedAt?: any;
}

export default function NewsletterPage() {
  const { userData: currentUser } = useAuth();
  const [data, setData] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<NewsletterSubscriber | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

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
      const subscribersQuery = query(
        collection(db, 'newsletter'),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(
        subscribersQuery,
        (snapshot) => {
          const subscribers: NewsletterSubscriber[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as NewsletterSubscriber));
          setData(subscribers);
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
      const response = await fetch("/api/newsletter");
      if (!response.ok) {
        throw new Error("Failed to fetch subscribers");
      }
      const list: NewsletterSubscriber[] = await response.json();
      setData(list);
    } catch (error: any) {
      console.error("Error loading subscribers:", error);
      toast.error(error?.message || "Failed to load subscribers");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const s = searchQuery.toLowerCase();
    return data.filter((item) => {
      const matchesSearch = item.email.toLowerCase().includes(s);
      const matchesStatus = statusFilter === "all" ? true : item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, searchQuery, statusFilter]);

  const pageCount = Math.ceil(filtered.length / pageSize);
  const paginatedData = filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  const handleStatusChange = useCallback(async (subscriber: NewsletterSubscriber, newStatus: string) => {
    try {
      const response = await fetch(`/api/newsletter/${subscriber.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update status");
      }

      setData((prev) => prev.map((i) => (i.id === subscriber.id ? { ...i, status: newStatus as any } : i)));
      toast.success("Subscriber status updated");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update status");
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/newsletter/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete subscriber");
      }
      setData((prev) => prev.filter((i) => i.id !== id));
      toast.success("Subscriber deleted");
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete");
    }
  }, []);

  const exportToCSV = () => {
    const headers = ["Email", "Status", "Source", "Subscribed Date"];
    const rows = filtered.map((s) => [
      s.email,
      s.status,
      s.source || "website",
      formatNewsletterDate(s.createdAt),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${format(new Date(), "yyyy-MM-dd")}.csv`;
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
    subscribed: data.filter((s) => s.status === "subscribed").length,
    unsubscribed: data.filter((s) => s.status === "unsubscribed").length,
  };

  return (
    <div className="space-y-6 min-w-0">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Subscribers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.subscribed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unsubscribed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">{stats.unsubscribed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email..."
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
              <SelectItem value="subscribed">Subscribed</SelectItem>
              <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button size="sm" onClick={() => setSendDialogOpen(true)}>
            <Mail className="h-4 w-4 mr-2" />
            Send Newsletter
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border w-full overflow-x-auto">
        <Table className="whitespace-nowrap">
          <TableHeader>
            <TableRow className="bg-muted/50 font-medium">
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Subscribed Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No subscribers found
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((subscriber) => (
                <TableRow key={subscriber.id}>
                  <TableCell className="font-medium">
                    <a href={`mailto:${subscriber.email}`} className="text-primary hover:underline">
                      {subscriber.email}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Select value={subscriber.status} onValueChange={(v) => handleStatusChange(subscriber, v)}>
                      <SelectTrigger className="h-7 w-[130px]">
                        <Badge variant="outline" className={subscriber.status === "subscribed" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-gray-500/10 text-gray-500 border-gray-500/20"}>
                          {subscriber.status}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="subscribed">Subscribed</SelectItem>
                        <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{subscriber.source || "website"}</Badge>
                  </TableCell>
                  <TableCell>
                    {formatNewsletterDate(subscriber.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setConfirmDelete(subscriber)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
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
            Showing {pageIndex * pageSize + 1} to {Math.min((pageIndex + 1) * pageSize, filtered.length)} of {filtered.length} subscribers
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

      {/* Send Newsletter Dialog */}
      <SendNewsletterDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        subscribers={data.filter(s => s.status === "subscribed")}
        onSent={loadData}
      />

      {/* Delete Confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subscriber</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{confirmDelete?.email}</strong> from the newsletter? This action cannot be undone.
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

function SendNewsletterDialog({
  open,
  onOpenChange,
  subscribers,
  onSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscribers: NewsletterSubscriber[];
  onSent: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) {
      toast.error("Please fill in subject and content");
      return;
    }

    setSending(true);
    setProgress(0);

    try {
      const total = subscribers.length;
      let sent = 0;

      for (const subscriber of subscribers) {
        try {
          const response = await fetch("/api/newsletter/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: subscriber.email,
              subject,
              content,
            }),
          });

          if (response.ok) {
            sent++;
          }
        } catch (error) {
          console.error(`Failed to send to ${subscriber.email}:`, error);
        }

        setProgress((sent / total) * 100);
      }

      toast.success(`Newsletter sent to ${sent} of ${total} subscribers`);
      setSubject("");
      setContent("");
      onSent();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error sending newsletter:", error);
      toast.error(error?.message || "Failed to send newsletter");
    } finally {
      setSending(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Newsletter</DialogTitle>
          <DialogDescription>
            Send newsletter to {subscribers.length} subscribed email{subscribers.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Newsletter Subject"
              disabled={sending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Newsletter content..."
              rows={10}
              disabled={sending}
            />
          </div>
          {sending && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground text-center">
                Sending... {Math.round(progress)}%
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending || !subject.trim() || !content.trim()}>
            {sending ? "Sending..." : "Send Newsletter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
