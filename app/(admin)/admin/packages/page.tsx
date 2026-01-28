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
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Search,
    Columns,
    Plus,
    Edit,
    Trash2,
    GripVertical,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    TrendingUp,
    DollarSign,
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
import { PackageDialog, Package, PackageType } from "@/components/admin/package-dialog";
import {
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
    type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Switch } from "@/components/ui/switch";

interface PackageRow extends Package {
    id: string;
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
    packageItem,
    columnVisibility,
    onEdit,
    onDelete,
    onToggleStatus,
    stats
}: {
    packageItem: PackageRow;
    columnVisibility: Record<string, boolean>;
    onEdit: (packageItem: PackageRow) => void;
    onDelete: (packageItem: PackageRow) => void;
    onToggleStatus: (packageItem: PackageRow) => void;
    stats?: { bookings: number; revenue: number };
}) {
    const { transform, transition, setNodeRef, isDragging } = useSortable({
        id: packageItem.id,
    });

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
                <TableCell className="p-0 text-start w-12">
                    <DragHandle id={packageItem.id} />
                </TableCell>
            )}
            {columnVisibility.title && (
                <TableCell className="font-medium py-0">{packageItem.title}</TableCell>
            )}
            {columnVisibility.type && (
                <TableCell className="py-0">
                    <Badge variant="outline">
                        {packageItem.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </Badge>
                </TableCell>
            )}
            {columnVisibility.price && (
                <TableCell className="py-0">
                    {packageItem.discountedPrice ? (
                        <div className="flex flex-col">
                            <span className="line-through text-muted-foreground text-xs">
                                {packageItem.currency || "INR"} {packageItem.basePrice}
                            </span>
                            <span className="font-semibold">
                                {packageItem.currency || "INR"} {packageItem.discountedPrice}
                            </span>
                        </div>
                    ) : packageItem.basePrice ? (
                        `${packageItem.currency || "INR"} ${packageItem.basePrice}`
                    ) : (
                        "-"
                    )}
                </TableCell>
            )}
            {columnVisibility.validity && (
                <TableCell className="py-0">
                    {packageItem.validFrom && packageItem.validTo ? (
                        <div className="text-xs">
                            <div>{new Date(packageItem.validFrom).toLocaleDateString()}</div>
                            <div className="text-muted-foreground">to {new Date(packageItem.validTo).toLocaleDateString()}</div>
                        </div>
                    ) : (
                        "-"
                    )}
                </TableCell>
            )}
            {columnVisibility.capacity && (
                <TableCell className="py-0">
                    {packageItem.minPeople || packageItem.maxPeople ?
                        `${packageItem.minPeople || 0} - ${packageItem.maxPeople || "∞"}` :
                        "-"}
                </TableCell>
            )}
            {columnVisibility.bookings && (
                <TableCell className="py-0">
                    <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{stats?.bookings || 0}</span>
                    </div>
                </TableCell>
            )}
            {columnVisibility.revenue && (
                <TableCell className="py-0">
                    <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium">₹{stats?.revenue?.toLocaleString() || 0}</span>
                    </div>
                </TableCell>
            )}
            {columnVisibility.status && (
                <TableCell className="py-0">
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={!!packageItem.status}
                            onCheckedChange={() =>
                                onToggleStatus(packageItem)
                            }
                        />
                        <span className="text-sm capitalize text-muted-foreground">
                            {!packageItem.status ? "Disabled" : "Active"}
                        </span>
                    </div>
                </TableCell>
            )}
            {columnVisibility.actions && (
                <TableCell className="text-right py-1">
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(packageItem)}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => onDelete(packageItem)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </TableCell>
            )}
        </TableRow>
    );
}

export default function PackagesPage() {
    const { userData: currentUser } = useAuth();
    const [data, setData] = useState<PackageRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<PackageRow | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<PackageRow | null>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<"all" | PackageType>("all");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [columnVisibility, setColumnVisibility] = useState({
        drag: true,
        title: true,
        type: true,
        price: true,
        validity: true,
        capacity: true,
        bookings: true,
        revenue: true,
        status: true,
        actions: true,
    });
    const [packageStats, setPackageStats] = useState<Record<string, { bookings: number; revenue: number }>>({});

    // Drag and drop
    const sortableId = useMemo(() => Math.random().toString(), []);
    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {})
    );

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
            const packagesQuery = query(
                collection(db, 'packages'),
                orderBy('createdAt', 'desc')
            );
            
            const unsubscribe = onSnapshot(
                packagesQuery,
                (snapshot) => {
                    const packages: PackageRow[] = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    } as PackageRow));
                    setData(packages);
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
            const [packagesRes, bookingsRes] = await Promise.all([
                fetch("/api/admin/packages"),
                fetch("/api/admin/bookings"),
            ]);

            if (!packagesRes.ok) {
                throw new Error("Failed to fetch packages");
            }
            const list: PackageRow[] = await packagesRes.json();
            setData(list);

            // Load booking stats for performance tracking
            if (bookingsRes.ok) {
                const bookings: any[] = await bookingsRes.json();
                const stats: Record<string, { bookings: number; revenue: number }> = {};
                
                bookings.forEach((booking) => {
                    // Check if booking references a package (you may need to add packageId to bookings)
                    // For now, we'll track by package title in specialRequests or use a separate field
                    // This is a placeholder - adjust based on your booking schema
                    if (booking.packageId) {
                        if (!stats[booking.packageId]) {
                            stats[booking.packageId] = { bookings: 0, revenue: 0 };
                        }
                        stats[booking.packageId].bookings++;
                        if (booking.totalAmount && (booking.status === "confirmed" || booking.status === "completed")) {
                            stats[booking.packageId].revenue += booking.totalAmount;
                        }
                    }
                });
                setPackageStats(stats);
            }
        } catch (error: any) {
            console.error("Error loading packages:", error);
            toast.error(error?.message || "Failed to load packages");
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        const s = searchQuery.toLowerCase();
        return data.filter((item) => {
            const matchesSearch =
                (item.title || "").toLowerCase().includes(s) ||
                (item.slug || "").toLowerCase().includes(s) ||
                (item.description || "").toLowerCase().includes(s);
            const matchesType = typeFilter === "all" ? true : item.type === typeFilter;
            const matchesStatus = statusFilter === "all" ? true : (item.status || "active") === statusFilter;
            return matchesSearch && matchesType && matchesStatus;
        });
    }, [data, searchQuery, typeFilter, statusFilter]);

    const pageCount = Math.ceil(filtered.length / pageSize);
    const paginatedData = filtered.slice(
        pageIndex * pageSize,
        (pageIndex + 1) * pageSize
    );

    const handleDelete = useCallback(async (id: string) => {
        try {
            const response = await fetch(`/api/admin/packages/${id}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to delete package");
            }
            setData((prev) => prev.filter((i) => i.id !== id));
            toast.success("Package deleted");
        } catch (error: any) {
            console.error("Delete error:", error);
            toast.error(error?.message || "Failed to delete");
        }
    }, []);

    const dataIds = useMemo<UniqueIdentifier[]>(
        () => paginatedData.map((item) => item.id) || [],
        [paginatedData]
    );

    const handleDragEnd = useCallback(
        async (event: DragEndEvent) => {
            const { active, over } = event;
            if (active && over && active.id !== over.id) {
                // Find indices in the paginated data array (what's visible)
                const oldIndex = paginatedData.findIndex((item) => item.id === active.id);
                const newIndex = paginatedData.findIndex((item) => item.id === over.id);

                if (oldIndex === -1 || newIndex === -1) return;

                // Calculate actual indices in the full data array
                const actualOldIndex = data.findIndex((item) => item.id === active.id);
                const actualNewIndex = data.findIndex((item) => item.id === over.id);

                const newData = arrayMove(data, actualOldIndex, actualNewIndex);
                setData(newData);

                // Update order in Firebase
                try {
                    const ids = newData.map((item) => item.id);
                    const response = await fetch("/api/admin/packages/order", {
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
                    loadData();
                }
            }
        },
        [data, paginatedData]
    );

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

    async function handleStatusToggle(packageItem: PackageRow): Promise<void> {
        try {
            const newStatus = !packageItem.status;
            const response = await fetch(`/api/admin/packages/${packageItem.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to update package status");
            }
            setData((prev: any[]) =>
                prev.map((a) => (a.id === packageItem.id ? { ...a, status: newStatus } : a))
            );
            toast.success("Package status updated");
        } catch (error) {
            console.error("Error updating package:", error);
            toast.error("Failed to update package status");
        }
    }

    return (
        <div className="space-y-4 min-w-0">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by title, slug, or description..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPageIndex(0);
                        }}
                        className="pl-9 h-9"
                    />
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <Select
                        value={typeFilter}
                        onValueChange={(v: "all" | PackageType) => {
                            setTypeFilter(v);
                            setPageIndex(0);
                        }}
                    >
                        <SelectTrigger className="h-9 w-[150px]">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All types</SelectItem>
                            <SelectItem value="special_offer">Special Offer</SelectItem>
                            <SelectItem value="seasonal">Seasonal</SelectItem>
                            <SelectItem value="honeymoon">Honeymoon</SelectItem>
                            <SelectItem value="family">Family</SelectItem>
                            <SelectItem value="group">Group</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={statusFilter}
                        onValueChange={(v: "all" | "active" | "inactive") => {
                            setStatusFilter(v);
                            setPageIndex(0);
                        }}
                    >
                        <SelectTrigger className="h-9 w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
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
                            {(["drag", "title", "type", "price", "validity", "capacity", "bookings", "revenue", "status"] as const).map((key) => (
                                <DropdownMenuCheckboxItem
                                    key={key}
                                    checked={columnVisibility[key]}
                                    onCheckedChange={(v) => setColumnVisibility((p) => ({ ...p, [key]: !!v }))}
                                >
                                    {key === "drag" ? "Drag" : key.charAt(0).toUpperCase() + key.slice(1)}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        size="sm"
                        onClick={() => {
                            setEditItem(null);
                            setIsDialogOpen(true);
                        }}
                    >
                        <Plus className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">New Package</span>
                    </Button>
                </div>
            </div>

            <div className="rounded-md border w-full overflow-x-auto">
                <DndContext
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis]}
                    onDragEnd={handleDragEnd}
                    sensors={sensors}
                    id={sortableId}
                >
                    <Table className="whitespace-nowrap">
                        <TableHeader>
                            <TableRow className="bg-muted/50 font-medium">
                                {columnVisibility.drag && <TableHead className="w-12"></TableHead>}
                                {columnVisibility.title && <TableHead>Title</TableHead>}
                                {columnVisibility.type && <TableHead>Type</TableHead>}
                                {columnVisibility.price && <TableHead>Price</TableHead>}
                                {columnVisibility.validity && <TableHead>Validity</TableHead>}
                                {columnVisibility.capacity && <TableHead>Capacity</TableHead>}
                                {columnVisibility.bookings && <TableHead>Bookings</TableHead>}
                                {columnVisibility.revenue && <TableHead>Revenue</TableHead>}
                                {columnVisibility.status && <TableHead>Status</TableHead>}
                                {columnVisibility.actions && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedData.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={Object.values(columnVisibility).filter(Boolean).length}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No packages found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <SortableContext
                                    items={paginatedData.map((s) => s.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                  {paginatedData.map((item) => (
                    <DraggableRow
                      key={item.id}
                      packageItem={item}
                      columnVisibility={columnVisibility}
                      stats={packageStats[item.id]}
                      onEdit={(item) => {
                        setEditItem(item);
                        setIsDialogOpen(true);
                      }}
                      onDelete={(item) => setConfirmDelete(item)}
                      onToggleStatus={handleStatusToggle}
                    />
                  ))}
                                </SortableContext>
                            )}
                        </TableBody>
                    </Table>
                </DndContext>
            </div>

            {/* Pagination */}
            {filtered.length > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                        Showing {pageIndex * pageSize + 1} to{" "}
                        {Math.min((pageIndex + 1) * pageSize, filtered.length)} of{" "}
                        {filtered.length} packages
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
                                className="h-9 w-9"
                                onClick={() => setPageIndex(0)}
                                disabled={pageIndex === 0}
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                                disabled={pageIndex === 0}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-sm px-2">
                                Page {pageIndex + 1} of {pageCount || 1}
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => setPageIndex((p) => Math.min(pageCount - 1, p + 1))}
                                disabled={pageIndex >= pageCount - 1}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => setPageIndex(pageCount - 1)}
                                disabled={pageIndex >= pageCount - 1}
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <PackageDialog
                open={isDialogOpen}
                onOpenChange={(o) => {
                    setIsDialogOpen(o);
                    if (!o) setEditItem(null);
                }}
                onSaved={async () => {
                    await loadData();
                    setIsDialogOpen(false);
                    setEditItem(null);
                }}
                editPackage={editItem}
            />

            <DeleteDialog
                item={confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={async () => {
                    if (confirmDelete) {
                        await handleDelete(confirmDelete.id);
                        setConfirmDelete(null);
                    }
                }}
            />
        </div>
    );
}

function DeleteDialog({
    item,
    onClose,
    onConfirm,
}: {
    item: PackageRow | null;
    onClose: () => void;
    onConfirm: () => void;
}) {
    return (
        <Dialog open={!!item} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Package</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete <strong>{item?.title}</strong>? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={onConfirm}>
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
