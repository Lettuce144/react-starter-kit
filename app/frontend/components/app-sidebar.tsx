import { Link, usePage } from "@inertiajs/react"
import { BookOpen, Folder, LayoutGrid } from "lucide-react"

import { NavFooter } from "@/components/nav-footer"
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
import { adminDashboardPath } from "@/routes"
import type { NavItem, CollectionConfig } from "@/types"

import AppLogo from "./app-logo"

let defaultNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: adminDashboardPath(),
    icon: LayoutGrid,
  },
]

const footerNavItems: NavItem[] = [
  {
    title: "Repository",
    href: "https://github.com/inertia-rails/react-starter-kit",
    icon: Folder,
  },
  {
    title: "Documentation",
    href: "https://inertia-rails.dev",
    icon: BookOpen,
  },
]

export function AppSidebar() {
  const { collections }: {collections: CollectionConfig[]} = usePage().props;

  const navItems = defaultNavItems.concat(collections.map(col => ({
    title: col.label_plural,
    href: `/admin/${col.slug}`,
    icon: LayoutGrid,
  })))

  console.log(collections)

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={adminDashboardPath()} prefetch>
                <AppLogo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavFooter items={footerNavItems} className="mt-auto" />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
