"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Package,
  Wrench,
  Building2,
  Users,
  BarChart,
  MessageSquare,
  Image,
  Home,
  Database,
  Bed,
  CalendarRange,
  Star,
  Mail,
} from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavSecondary } from "./nav-secondary"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { userData } = useAuth()
  const isAdmin = userData?.role === "admin"

  const navMain = [
    {
      title: "Home",
      url: "/",
      icon: Home,
    },
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Analytics",
      url: "/admin/analytics",
      icon: BarChart,
    },
  ]
  const navMainUser = [
    {
      title: "Home",
      url: "/",
      icon: Home,
    },
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "My Bookings",
      url: "/dashboard/bookings",
      icon: Building2,
    },
  ]
  const navResources = [
    {
      title: "Accommodations",
      url: "/admin/accommodations",
      icon: Bed,
    },
    {
      title: "Amenities",
      url: "/admin/amenities",
      icon: Wrench,
    },
    {
      title: "Packages",
      url: "/admin/packages",
      icon: Package,
    },
    {
      title: "Testimonials",
      url: "/admin/testimonials",
      icon: Star,
    },
    {
      title: "Events",
      url: "/admin/events",
      icon: CalendarRange,
    },
    {
      title: "Gallery",
      url: "/admin/gallery",
      icon: Image,
    },
  ]
  const navBookings = [
    {
      title: "Bookings",
      url: "/admin/bookings",
      icon: Building2,
    },
    {
      title: "Booking Reports",
      url: "/admin/reports",
      icon: BarChart,
    },
    {
      title: "Email Notifications",
      url: "/admin/notifications",
      icon: MessageSquare,
    },
  ]
  const navContactForms = [
    {
      title: "Inquiries",
      url: "/admin/inquiries",
      icon: MessageSquare,
    },
    {
      title: "Newsletter",
      url: "/admin/newsletter",
      icon: Mail,
    },
  ]
  const navSecondary = [
    ...(isAdmin
      ? [
        {
          title: "Users",
          url: "/admin/users",
          icon: Users,
        },
        {
          title: "Backups",
          url: "/admin/backups",
          icon: Database,
        },
      ]
      : []),
  ]

  const user = userData
    ? {
      name: userData.email.split("@")[0] || "User",
      email: userData.email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        userData.email.split("@")[0] || "User"
      )}&background=random`,
    }
    : null

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:!p-1.5 pointer-events-none"
            >
              <div className="gap-2 flex items-center">
                <div className="h-5 w-5 rounded bg-primary" />
                <span className="text-base font-semibold">P2tEcostay Admin</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {userData?.role === "user" ? (
          <>
            <NavMain items={navMainUser} />
          </>
        ) : (
          <>
            <NavMain items={navMain} />
            <NavMain items={navBookings} sectionTitle="Bookings" />
            <NavMain items={navResources} sectionTitle="Resources" />
            <NavMain items={navContactForms} sectionTitle="Contact Forms" />
            <NavSecondary items={navSecondary} className="mt-auto" />
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        {user && <NavUser user={user} />}
      </SidebarFooter>
    </Sidebar>
  )
}
