"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CirclePlusIcon, CrosshairIcon } from "lucide-react"

import { navigationIcon } from "@/components/nav-icons"
import { NavUser } from "@/components/nav-user"
import { navigationGroups, secondaryNavigation } from "@/lib/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

function isItemActive(pathname: string, url: string) {
  if (url === "/dashboard") return pathname === "/dashboard"
  return pathname === url || pathname.startsWith(`${url}/`)
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link href="/dashboard" />}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <CrosshairIcon className="size-4!" />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold tracking-tight">
                  Parabellum
                </span>
                <span className="truncate text-[11px] font-normal text-muted-foreground">
                  Paper trading terminal
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                  render={<Link href="/dashboard/trades?trade=1" />}
                >
                  <CirclePlusIcon />
                  <span>New trade</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = navigationIcon(item.url)
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isItemActive(pathname, item.url)}
                        render={<Link href={item.url} />}
                      >
                        <Icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavigation.map((item) => {
                const Icon = navigationIcon(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={!item.external && isItemActive(pathname, item.url)}
                      render={
                        item.external ? (
                          <a href={item.url} target="_blank" rel="noreferrer" />
                        ) : (
                          <Link href={item.url} />
                        )
                      }
                    >
                      <Icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: "Parabellum Desk",
            email: "default · Paper account",
            avatar: "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
