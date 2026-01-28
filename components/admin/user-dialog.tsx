"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { UserData, UserRole } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface User extends UserData {
  id: string;
  displayName?: string;
}

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded: () => void;
  editUser?: User | null;
}

const TOTAL_STEPS = 2;

export function AddUserDialog({
  open,
  onOpenChange,
  onUserAdded,
  editUser = null,
}: AddUserDialogProps) {
  const isEditMode = !!editUser;
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("manager");
  const [disabled, setDisabled] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (open) {
      if (isEditMode && editUser) {
        setName(editUser.displayName || "");
        setEmail(editUser.email);
        setPassword(""); // Don't pre-fill password
        setRole(editUser.role);
        setDisabled(editUser.disabled || false);
        setCurrentStep(1);
      } else {
        // Reset form for add mode
        setName("");
        setEmail("");
        setPassword("");
        setRole("manager");
        setDisabled(false);
        setCurrentStep(1);
      }
    }
  }, [isEditMode, editUser, open]);

  const stepProgress = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;

  const handleNext = () => {
    // Validate step 1
    if (currentStep === 1) {
      if (!email) {
        toast.error("Please fill in email");
        return;
      }
      if (!isEditMode && !password) {
        toast.error("Please enter a password for new users");
        return;
      }
    }
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!email) {
      toast.error("Please fill in email");
      return;
    }

    if (!isEditMode && !password) {
      toast.error("Please enter a password for new users");
      return;
    }

    if (!db) {
      toast.error("Database not initialized");
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      if (isEditMode && editUser) {
        // Update existing user via API (uses Firebase Admin SDK)
        setProgress(20);
        const response = await fetch(`/api/users/${editUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            role,
            disabled,
            displayName: name || undefined,
            ...(password && { password }), // Only include password if provided
          }),
        });

        setProgress(80);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update user");
        }

        setProgress(100);
        toast.success("User updated successfully");
      } else {
        // Create new user via API (uses Firebase Admin SDK - won't affect current session)
        setProgress(20);
        const response = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            role,
            disabled,
            displayName: name || undefined,
          }),
        });

        setProgress(60);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create user");
        }

        setProgress(100);
        toast.success("User added successfully");
      }

      // Reset form
      setName("");
      setEmail("");
      setPassword("");
      setRole("manager");
      setDisabled(false);
      setCurrentStep(1);

      onUserAdded();
      onOpenChange(false);
    } catch (error: any) {
      console.error(`Error ${isEditMode ? "updating" : "adding"} user:`, error);
      let errorMessage = `Failed to ${isEditMode ? "update" : "add"} user`;
      
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email is already in use";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name (Optional)</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                disabled={loading || isEditMode}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">
                Password {isEditMode && "(leave empty to keep current)"} *
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEditMode ? "Enter new password (optional)" : "Enter password"}
                disabled={loading}
                required={!isEditMode}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={role}
                onValueChange={(value: UserRole) => setRole(value)}
                disabled={loading}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="disabled">Disabled</Label>
              <Switch
                id="disabled"
                checked={disabled}
                onCheckedChange={setDisabled}
                disabled={loading}
              />
            </div>
            {loading && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-xs text-muted-foreground text-center">
                  {isEditMode ? "Updating user..." : "Creating user..."}
                </p>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Preview</h3>
            <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
              <div>
                <Label className="text-sm text-muted-foreground">Name</Label>
                <p className="font-medium">{name || "Not provided"}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Email</Label>
                <p className="font-medium">{email}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Role</Label>
                <p className="font-medium capitalize">{role}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Status</Label>
                <p className="font-medium">{disabled ? "Disabled" : "Active"}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open && !loading) {
        onOpenChange(false);
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex max-h-[90vh] flex-col">
          {/* Fixed Header */}
          <div className="shrink-0 border-b bg-background mt-2 p-3">
            <DialogHeader className="space-y-1">
              <DialogTitle className="leading-none">
                {isEditMode ? "Edit User" : "New User"}
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
                {loading
                  ? isEditMode
                    ? "Updating..."
                    : "Creating..."
                  : isEditMode
                  ? "Update User"
                  : "Create User"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
