"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, UserRole, AuthProvider } from "@/context/auth-context";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { ThemeProvider } from "next-themes";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ALLOWED_ROLES: UserRole[] = ["admin", "manager", "user"];

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Strict authentication and authorization check
  useEffect(() => {
    if (loading) {
      setAuthChecked(false);
      return;
    }

    // Check 1: User must be authenticated
    if (!user) {
      router.push("/login");
      setAuthChecked(true);
      return;
    }

    // Check 2: User data must exist
    if (!userData) {
      router.push("/login");
      setAuthChecked(true);
      return;
    }

    // Check 3: User must not be disabled
    if (userData.disabled) {
      setIsAuthorized(false);
      setAuthChecked(true);
      return;
    }

    // Check 4: User must have allowed role (admin or manager)
    if (!ALLOWED_ROLES.includes(userData.role)) {
      router.push("/login");
      setAuthChecked(true);
      return;
    }

    // All checks passed
    setIsAuthorized(true);
    setAuthChecked(true);
  }, [user, userData, loading, router]);

  // Show loading state while checking authentication
  if (loading || !authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error if user is disabled
  if (userData?.disabled) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Account Disabled</AlertTitle>
          <AlertDescription>
            Your account has been disabled. Please contact an administrator for assistance.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show error if not authorized
  if (!isAuthorized || !user || !userData) {
    return null; // Will redirect via useEffect
  }

  // Render dashboard layout
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SidebarProvider
        style={
          {
            "--sidebar-width": "16rem",
            "--header-height": "3rem",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="sidebar" />
        <SidebarInset className="min-w-0">
          <SiteHeader />
          <div className="flex flex-1 flex-col overflow-auto min-w-0">
            <div className="@container/main flex flex-1 flex-col gap-2 min-w-0">
              <div className="flex flex-col gap-4 p-4 md:p-6 min-w-0 max-w-full overflow-x-hidden">
                {children}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AuthProvider>
  );
}
