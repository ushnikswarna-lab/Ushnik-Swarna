"use client";

import * as React from "react";
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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  Download,
  RotateCcw,
  Plus,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Backup {
  id: string;
  fileName: string;
  cloudinaryUrl: string;
  size: number;
  collections: string[];
  documentCount: number;
  createdAt: number;
  restoredAt?: number;
  createdBy?: string;
}

export default function BackupsPage() {
  const { userData: currentUser } = useAuth();
  const [backups, setBackups] = React.useState<Backup[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creatingBackup, setCreatingBackup] = React.useState(false);
  const [restoringBackup, setRestoringBackup] = React.useState<string | null>(null);

  // Filters & pagination
  const [searchQuery, setSearchQuery] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  // Modal states
  const [deleteConfirm, setDeleteConfirm] = React.useState<Backup | null>(null);
  const [restoreConfirm, setRestoreConfirm] = React.useState<Backup | null>(null);
  const [createConfirm, setCreateConfirm] = React.useState(false);
  const [downloadConfirm, setDownloadConfirm] = React.useState<Backup | null>(null);

  React.useEffect(() => {
    if (currentUser?.role === "admin") {
      loadBackups();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const loadBackups = async () => {
    try {
      const response = await fetch("/api/admin/backups");
      if (!response.ok) {
        throw new Error("Failed to load backups");
      }
      const data = await response.json();
      setBackups(data);
    } catch (error: any) {
      console.error("Error loading backups:", error);
      toast.error(`Failed to load backups: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreateConfirm(false);
    setCreatingBackup(true);
    try {
      const response = await fetch("/api/admin/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create backup");
      }

      const newBackup = await response.json();
      setBackups((prev) => [newBackup, ...prev]);
      toast.success("Backup created successfully");
    } catch (error: any) {
      console.error("Error creating backup:", error);
      toast.error(error.message || "Failed to create backup");
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDownloadBackup = async () => {
    if (!downloadConfirm) return;

    const backup = downloadConfirm;
    setDownloadConfirm(null);
    
    try {
      const response = await fetch(`/api/admin/backups/${backup.id}`);
      if (!response.ok) {
        throw new Error("Failed to download backup");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = backup.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Backup downloaded successfully");
    } catch (error: any) {
      console.error("Error downloading backup:", error);
      toast.error(error.message || "Failed to download backup");
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreConfirm) return;

    setRestoringBackup(restoreConfirm.id);
    try {
      const response = await fetch(`/api/admin/backups/${restoreConfirm.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to restore backup");
      }

      const result = await response.json();
      setBackups((prev) =>
        prev.map((b) =>
          b.id === restoreConfirm.id
            ? { ...b, restoredAt: Date.now() }
            : b
        )
      );
      setRestoreConfirm(null);
      toast.success(`Backup restored successfully. ${JSON.stringify(result.results)}`);
    } catch (error: any) {
      console.error("Error restoring backup:", error);
      toast.error(error.message || "Failed to restore backup");
    } finally {
      setRestoringBackup(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const response = await fetch(`/api/admin/backups/${deleteConfirm.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete backup");
      }

      setBackups((prev) => prev.filter((b) => b.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      toast.success("Backup deleted successfully");
    } catch (error: any) {
      console.error("Error deleting backup:", error);
      toast.error(error.message || "Failed to delete backup");
    }
  };

  // Filter backups
  const filteredBackups = backups.filter((backup) => {
    const query = searchQuery.toLowerCase();
    return (
      backup.fileName.toLowerCase().includes(query) ||
      backup.collections.some((col) => col.toLowerCase().includes(query))
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredBackups.length / pageSize);
  const paginatedBackups = filteredBackups.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (currentUser?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">Access denied. Admin only.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Skeleton className="h-4 w-32" /></TableHead>
                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                <TableHead><Skeleton className="h-4 w-32" /></TableHead>
                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by filename, collection..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPageIndex(0);
            }}
            className="pl-9 h-9"
          />
        </div>

        {/* Create Backup Button */}
        <Button
          onClick={() => setCreateConfirm(true)}
          disabled={creatingBackup}
          size="sm"
        >
          {creatingBackup ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Create Backup</span>
            </>
          )}
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Collections</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedBackups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {backups.length === 0
                    ? "No backups found. Create your first backup."
                    : "No backups match your search."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedBackups.map((backup) => (
                <TableRow key={backup.id}>
                  <TableCell className="font-medium">{backup.fileName}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {backup.collections.slice(0, 3).map((col) => (
                        <Badge key={col} variant="outline" className="text-xs">
                          {col}
                        </Badge>
                      ))}
                      {backup.collections.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{backup.collections.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{backup.documentCount}</TableCell>
                  <TableCell>{formatSize(backup.size)}</TableCell>
                  <TableCell>{formatDate(backup.createdAt)}</TableCell>
                  <TableCell>
                    {backup.restoredAt ? (
                      <Badge variant="secondary">Restored</Badge>
                    ) : (
                      <Badge variant="outline">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDownloadConfirm(backup)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRestoreConfirm(backup)}
                        disabled={!!backup.restoredAt}
                        title="Restore"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(backup)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {pageIndex * pageSize + 1} to{" "}
            {Math.min((pageIndex + 1) * pageSize, filteredBackups.length)} of{" "}
            {filteredBackups.length} backups
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageIndex(0)}
              disabled={pageIndex === 0}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={pageIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm">
              Page {pageIndex + 1} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
              disabled={pageIndex >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageIndex(totalPages - 1)}
              disabled={pageIndex >= totalPages - 1}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Backup Confirmation Dialog */}
      <Dialog open={createConfirm} onOpenChange={() => setCreateConfirm(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Create Backup
            </DialogTitle>
            <DialogDescription>
              <div className="space-y-2 mt-2">
                <p>
                  This will create a backup of all Firestore collections and documents.
                  The backup process may take a few moments depending on the amount of data.
                </p>
                <p className="text-sm text-muted-foreground">
                  The backup will be stored in Cloudinary and can be downloaded or restored later.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleCreateBackup}
              disabled={creatingBackup}
            >
              {creatingBackup ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Backup"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Download Backup Confirmation Dialog */}
      <Dialog open={!!downloadConfirm} onOpenChange={() => setDownloadConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Download Backup
            </DialogTitle>
            <DialogDescription>
              <div className="space-y-2 mt-2">
                <p>
                  Download the backup file <strong>{downloadConfirm?.fileName}</strong> to your local device.
                </p>
                <div className="text-sm space-y-1 mt-3">
                  <p><strong>Collections:</strong> {downloadConfirm?.collections.length || 0}</p>
                  <p><strong>Documents:</strong> {downloadConfirm?.documentCount || 0}</p>
                  <p><strong>Size:</strong> {downloadConfirm ? formatSize(downloadConfirm.size) : "N/A"}</p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDownloadConfirm(null)}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleDownloadBackup}>
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Backup
            </DialogTitle>
            <DialogDescription>
              <div className="space-y-2 mt-2">
                <span className="block space-y-2">
                  Are you sure you want to delete the backup <strong>{deleteConfirm?.fileName}</strong>?
                </span>
                <span className="text-destructive font-semibold">
                  This action cannot be undone. The backup file will be removed from Cloudinary and Firestore.
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <Dialog open={!!restoreConfirm} onOpenChange={() => setRestoreConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Restore Backup
            </DialogTitle>
            <DialogDescription>
              <div className="space-y-2 mt-2">
                <span className="block space-y-2">
                  <strong>Warning:</strong> This will restore all data from the backup file to Firestore.
                  Existing data in the following collections will be overwritten:
                </span>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {restoreConfirm?.collections.map((col) => (
                    <li key={col}>{col}</li>
                  ))}
                </ul>
                <span className="text-destructive font-semibold mt-4">
                  This action cannot be undone. Are you sure you want to continue?
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleRestoreBackup}
              disabled={restoringBackup === restoreConfirm?.id}
            >
              {restoringBackup === restoreConfirm?.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                "Restore Backup"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

