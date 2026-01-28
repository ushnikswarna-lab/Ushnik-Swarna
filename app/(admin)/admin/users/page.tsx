"use client";

import * as React from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth, UserData } from "@/context/auth-context";
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
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
} from "lucide-react";
import { AddUserDialog } from "@/components/admin/user-dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

type RoleFilter = "all" | "admin" | "manager";

interface User extends UserData {
  id: string;
  displayName?: string;
}

export default function UsersPage() {
  const { userData: currentUser } = useAuth();
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [editUser, setEditUser] = React.useState<User | null>(null);

  // Filters & pagination
  const [searchQuery, setSearchQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<RoleFilter>("all");
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  // Column visibility
  const [columnVisibility, setColumnVisibility] = React.useState({
    name: true,
    email: true,
    role: true,
    status: true,
    actions: true,
  });

  // Modal states
  const [deleteConfirm, setDeleteConfirm] = React.useState<User | null>(null);

  React.useEffect(() => {
    if (currentUser?.role === "admin" && db) {
      loadUsers();
    } else if (!db) {
      setLoading(false);
    }
  }, [currentUser]);

  const loadUsers = async () => {
    if (!db) return;
    try {
      const usersQuery = query(
        collection(db, "users"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(usersQuery);
      const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase().trim();
      const usersList = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as User))
        .filter(user => {
          const userEmail = user.email?.toString().toLowerCase().trim();
          return (
            userEmail !== adminEmail &&
            user.uid !== currentUser?.uid
          );
        });
    
      setUsers(usersList);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirm) return;

    try {
      const response = await fetch(`/api/users/${deleteConfirm.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete user");
      }
      setUsers((prev) => prev.filter((u) => u.id !== deleteConfirm.id));
      toast.success("User deleted successfully");
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  const handleUserAdded = async () => {
    await loadUsers();
    setIsAddDialogOpen(false);
    setEditUser(null);
  };

  const handleToggleDisabled = async (user: User) => {
    try {
      const newDisabled = !user.disabled;
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled: newDisabled }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, disabled: newDisabled } : u))
      );
      toast.success("User status updated");
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    }
  };

  // Filtered users
  const filteredUsers = React.useMemo(() => {
    return users.filter((user) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        user.email.toLowerCase().includes(searchLower) ||
        (user.displayName?.toLowerCase().includes(searchLower) ?? false);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const pageCount = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  if (currentUser?.role !== "admin") {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Access denied. Admin only.</p>
      </div>
    );
  }

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
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPageIndex(0);
            }}
            className="pl-9 h-9"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Role Filter */}
          <Select
            value={roleFilter}
            onValueChange={(v) => {
              setRoleFilter(v as RoleFilter);
              setPageIndex(0);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
            </SelectContent>
          </Select>

          {/* Column Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(["name", "email", "role", "status"] as const).map((key) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={columnVisibility[key]}
                  onCheckedChange={(v) =>
                    setColumnVisibility((p) => ({ ...p, [key]: !!v }))
                  }
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add User */}
          <Button
            onClick={() => {
              setEditUser(null);
              setIsAddDialogOpen(true);
            }}
            size="sm"
          >
            <Plus className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Add User</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table className="whitespace-nowrap">
          <TableHeader>
            <TableRow className="bg-muted/50 font-medium">
              {columnVisibility.name && <TableHead>Name</TableHead>}
              {columnVisibility.email && <TableHead>Email</TableHead>}
              {columnVisibility.role && <TableHead>Role</TableHead>}
              {columnVisibility.status && <TableHead>Status</TableHead>}
              {columnVisibility.actions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={Object.values(columnVisibility).filter(Boolean).length}
                  className="h-24 text-center text-muted-foreground py-3"
                >
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  {columnVisibility.name && (
                    <TableCell className="py-1">{user.displayName || "—"}</TableCell>
                  )}
                  {columnVisibility.email && <TableCell className="py-1">{user.email}</TableCell>}
                  {columnVisibility.role && (
                    <TableCell className="py-1">
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                  )}
                  {columnVisibility.status && (
                    <TableCell className="py-1">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!user.disabled}
                          onCheckedChange={() => handleToggleDisabled(user)}
                        />
                        <span className="text-sm capitalize text-muted-foreground">
                          {user.disabled ? "Disabled" : "Active"}
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
                          onClick={() => {
                            setEditUser(user);
                            setIsAddDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setDeleteConfirm(user)}
                        >
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
      {filteredUsers.length > 0 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {pageIndex * pageSize + 1} to{" "}
            {Math.min((pageIndex + 1) * pageSize, filteredUsers.length)} of {filteredUsers.length} users
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Rows per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPageIndex(0);
                }}
              >
                <SelectTrigger className="w-24">
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
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteConfirm?.displayName || deleteConfirm?.email}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddUserDialog
        open={isAddDialogOpen}
        onOpenChange={(open: boolean) => {
          setIsAddDialogOpen(open);
          if (!open) setEditUser(null);
        }}
        onUserAdded={handleUserAdded}
        editUser={editUser}
      />
    </div>
  );
}
