"use client"
import Link from "next/link"
import { type LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  sectionTitle,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
  }[],
  sectionTitle?: string
}) {
  const pathname = usePathname();
  return (
    <SidebarGroup className="py-0 mb-0">
      <SidebarGroupContent className="flex flex-col gap-1">
        {sectionTitle && (
          <SidebarGroupLabel className="text-sm font-semibold">{sectionTitle}</SidebarGroupLabel>
        )}
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url || pathname?.startsWith(item.url + "/")
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton tooltip={item.title} asChild isActive={isActive}>
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
