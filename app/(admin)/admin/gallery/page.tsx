"use client";

import * as React from "react";
import { useCallback, useMemo } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  Columns,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  Image as ImageIcon,
  GripVertical,
} from "lucide-react";
import { GalleryDialog } from "@/components/admin/gallery-dialog";
import { GalleryMediaDialog } from "@/components/admin/gallery-media-dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface GalleryEvent {
  id: string;
  name: string;
  slug: string;
  status?: boolean;
  photos?: string[];
  videos?: string[];
  googlePhotosAlbumUrl?: string;
  order?: number;
  createdAt?: any;
  updatedAt?: any;
}

// Drag Handle Component
function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id: id.toString(),
  });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:bg-transparent cursor-grab active:cursor-grabbing"
    >
      <GripVertical className="size-3 text-muted-foreground" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

// Draggable Row Component
function DraggableRow({
  event,
  columnVisibility,
  getThumbnail,
  getMediaCount,
  onEdit,
  onDelete,
  onManageMedia,
  onStatusChange,
}: {
  event: GalleryEvent;
  columnVisibility: Record<string, boolean>;
  getThumbnail: (event: GalleryEvent) => string | null;
  getMediaCount: (event: GalleryEvent) => number;
  onEdit: (event: GalleryEvent) => void;
  onDelete: (event: GalleryEvent) => void;
  onManageMedia: (event: GalleryEvent) => void;
  onStatusChange: (event: GalleryEvent, checked: boolean) => void;
}) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: event.id,
  });

  const thumbnail = getThumbnail(event);
  const mediaCount = getMediaCount(event);

  return (
    <TableRow
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {columnVisibility.drag && (
        <TableCell className="p-0 text-start w-12 py-1">
          <DragHandle id={event.id} />
        </TableCell>
      )}
      {columnVisibility.thumbnail && (
        <TableCell className="py-1">
          {thumbnail ? (
            <div className="h-12 w-12 relative">
              <Image
                src={thumbnail}
                alt={event.name}
                fill
                className="object-cover rounded"
              />
            </div>
          ) : (
            <div className="h-12 w-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
              No Image
            </div>
          )}
        </TableCell>
      )}
      {columnVisibility.name && (
        <TableCell className="font-medium py-1">{event.name}</TableCell>
      )}
      {columnVisibility.status && (
        <TableCell className="py-1">
          <Switch
            checked={event.status !== false}
            onCheckedChange={(checked) => onStatusChange(event, checked)}
          />
        </TableCell>
      )}
      {columnVisibility.slug && (
        <TableCell className="py-1">
          <code className="text-xs bg-muted px-2 py-1 rounded">{event.slug}</code>
        </TableCell>
      )}
      {columnVisibility.mediaCount && (
        <TableCell className="py-1">
          <div className="flex items-center gap-2">
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              mediaCount > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}>
              {mediaCount} {mediaCount === 1 ? "item" : "items"}
            </span>
          </div>
        </TableCell>
      )}
      {columnVisibility.googlePhotos && (
        <TableCell className="py-1">
          {event.googlePhotosAlbumUrl ? (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8"
            >
              <a
                href={event.googlePhotosAlbumUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                <span className="text-xs">View Album</span>
              </a>
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </TableCell>
      )}
      {columnVisibility.actions && (
        <TableCell className="py-1 text-right">
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onManageMedia(event)}
              title="Manage Media"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(event)}
              title="Edit Event"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(event)}
              title="Delete Event"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}

export default function GalleryPage() {
  const { userData: currentUser } = useAuth();
  const [events, setEvents] = React.useState<GalleryEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = React.useState(false);
  const [editEvent, setEditEvent] = React.useState<GalleryEvent | null>(null);
  const [mediaEvent, setMediaEvent] = React.useState<GalleryEvent | null>(null);

  // Filters & pagination
  const [searchQuery, setSearchQuery] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  // Column visibility
  const [columnVisibility, setColumnVisibility] = React.useState({
    drag: true,
    thumbnail: true,
    name: true,
    status: true,
    slug: true,
    mediaCount: true,
    googlePhotos: true,
    actions: true,
  });

  // Drag and drop
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  // Filtered events
  const filteredEvents = React.useMemo(() => {
    return events.filter((event) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        event.name.toLowerCase().includes(searchLower) ||
        event.slug.toLowerCase().includes(searchLower);
      return matchesSearch;
    });
  }, [events, searchQuery]);

  React.useEffect(() => {
    if (currentUser && db) {
      loadEvents();
    } else if (!db) {
      console.warn("Firestore db not available");
      setLoading(false);
    }
  }, [currentUser, db]);

  const loadEvents = async () => {
    if (!db) return;
    try {
      const response = await fetch("/api/admin/gallery");
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      } else {
        throw new Error("Failed to fetch events");
      }
    } catch (error: any) {
      console.error("Error loading events:", error);
      toast.error(`Failed to load events: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (active && over && active.id !== over.id) {
        const oldIndex = events.findIndex((item) => item.id === active.id);
        const newIndex = events.findIndex((item) => item.id === over.id);
        const newEvents = arrayMove(events, oldIndex, newIndex);
        setEvents(newEvents);

        // Update order in Firebase
        try {
          const ids = newEvents.map((item) => item.id);
          const response = await fetch("/api/admin/gallery/order", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to update order");
          }
          toast.success("Order updated successfully");
        } catch (error: any) {
          toast.error(error.message || "Failed to update order");
          // Reload to revert changes
          loadEvents();
        }
      }
    },
    [events, loadEvents]
  );

  const handleStatusChange = async (event: GalleryEvent, checked: boolean) => {
    // Optimistic update
    setEvents(prev => prev.map(e => e.id === event.id ? { ...e, status: checked } : e));

    try {
      const response = await fetch(`/api/admin/gallery/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: checked }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }
      toast.success(`Album ${checked ? "activated" : "deactivated"}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
      // Revert
      loadEvents();
    }
  };

  const handleDeleteEvent = async () => {
    if (!deleteConfirm) return;

    try {
      const response = await fetch(`/api/admin/gallery/${deleteConfirm.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete album");
      }

      setEvents((prev) => prev.filter((e) => e.id !== deleteConfirm.id));
      toast.success("Album deleted successfully");
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting album:", error);
      toast.error("Failed to delete album");
    }
  };

  const handleGalleryDialogClose = () => {
    setIsAddDialogOpen(false);
    setEditEvent(null);
  };

  const handleEventAddedOrUpdated = async () => {
    await loadEvents();
    handleGalleryDialogClose();
  };

  // Modal states
  const [deleteConfirm, setDeleteConfirm] = React.useState<GalleryEvent | null>(null);

  const pageCount = Math.ceil(filteredEvents.length / pageSize);
  const paginatedEvents = filteredEvents.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize
  );

  const getMediaCount = (event: GalleryEvent) => {
    const photoCount = event.photos?.length || 0;
    const videoCount = event.videos?.length || 0;
    return photoCount + videoCount;
  };

  const getThumbnail = (event: GalleryEvent) => {
    if (event.photos && event.photos.length > 0) {
      return event.photos[0];
    }
    return null;
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
      {/* Top Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or slug..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPageIndex(0);
            }}
            className="pl-9"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Column Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Columns className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(["drag", "thumbnail", "name", "status", "slug", "mediaCount", "googlePhotos"] as const).map((key) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={columnVisibility[key]}
                  onCheckedChange={(v) =>
                    setColumnVisibility((p) => ({ ...p, [key]: !!v }))
                  }
                >
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add Event */}
          <Button
            onClick={() => {
              setEditEvent(null);
              setIsAddDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Add Album</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border w-full overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 font-medium">
                {columnVisibility.drag && <TableHead className="w-12"></TableHead>}
                {columnVisibility.thumbnail && <TableHead>Thumbnail</TableHead>}
                {columnVisibility.name && <TableHead>Album Name</TableHead>}
                {columnVisibility.status && <TableHead>Status</TableHead>}
                {columnVisibility.slug && <TableHead>Slug</TableHead>}
                {columnVisibility.mediaCount && <TableHead>Media Count</TableHead>}
                {columnVisibility.googlePhotos && <TableHead>External Link</TableHead>}
                {columnVisibility.actions && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEvents.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={Object.values(columnVisibility).filter(Boolean).length}
                    className="py-1 text-center text-muted-foreground"
                  >
                    No albums found
                  </TableCell>
                </TableRow>
              ) : (
                <SortableContext
                  items={paginatedEvents.map((e) => e.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {paginatedEvents.map((event) => (
                    <DraggableRow
                      key={event.id}
                      event={event}
                      columnVisibility={columnVisibility}
                      getThumbnail={getThumbnail}
                      getMediaCount={getMediaCount}
                      onEdit={(e) => {
                        setEditEvent(e);
                        setIsAddDialogOpen(true);
                      }}
                      onDelete={setDeleteConfirm}
                      onManageMedia={(e) => {
                        setMediaEvent(e);
                        setIsMediaDialogOpen(true);
                      }}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </SortableContext>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      {/* Pagination */}
      {filteredEvents.length > 0 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {pageIndex * pageSize + 1} to{" "}
            {Math.min((pageIndex + 1) * pageSize, filteredEvents.length)} of{" "}
            {filteredEvents.length} events
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Rows per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPageIndex(0);
                }}
              >
                <SelectTrigger className="h-9 w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPageIndex(0)}
                disabled={pageIndex === 0}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                disabled={pageIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm mx-2">
                Page {pageIndex + 1} of {pageCount}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPageIndex((p) => Math.min(pageCount - 1, p + 1))}
                disabled={pageIndex >= pageCount - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPageIndex(pageCount - 1)}
                disabled={pageIndex >= pageCount - 1}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Album</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteEvent}>
              Delete Album
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <GalleryDialog
        open={isAddDialogOpen}
        onOpenChange={handleGalleryDialogClose}
        onEventAdded={handleEventAddedOrUpdated}
        editEvent={editEvent}
      />

      <GalleryMediaDialog
        open={isMediaDialogOpen}
        onOpenChange={(open) => {
          setIsMediaDialogOpen(open);
          if (!open) {
            setMediaEvent(null);
          }
        }}
        onMediaUpdated={handleEventAddedOrUpdated}
        event={mediaEvent}
      />
    </div>
  );
}
