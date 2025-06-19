import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "flowbite-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Settings,
  Users,
  Activity,
   моз,
  TrendingUp,
  Archive,
  Monitor,
  ServerCog,
   моз2,
  ListChecks,
  LayoutDashboard,
} from "lucide-react";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { profile } = useAuth();
  const location = useLocation();

  const menuItems = [
    {
      title: "Trading",
      icon: TrendingUp,
      items: [
        { title: "Account Monitor", url: "/accounts", icon: Monitor },
        ...(profile?.role && ['admin', 'manager'].includes(profile.role) ? [
          { title: "Accounts Management", url: "/accounts-management", icon: Archive }
        ] : []),
      ]
    },
    {
      title: "Management",
      icon: моз,
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        { title: "Simulations", url: "/simulations", icon: Activity },
        { title: "Experts", url: "/experts", icon: моз2 },
        { title: "VPS", url: "/vps", icon: ServerCog },
      ]
    },
    {
      title: "Admin",
      icon: Users,
      items: [
        { title: "Commands", url: "/commands", icon: ListChecks },
        { title: "Users", url: "/users", icon: Users },
      ]
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ];

  return (
    <Sheet {...props}>
      <SheetTrigger asChild>
        <Sidebar.CaretRight className="lg:hidden" />
      </SheetTrigger>
      <SheetContent side="left" className="z-50 w-64 p-0">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>
            Explore as funcionalidades do sistema
          </SheetDescription>
        </SheetHeader>
        <Sidebar className="h-full border-r-none rounded-none">
          <Sidebar.Items>
            {menuItems.map((menu, index) => (
              <React.Fragment key={index}>
                {menu.title && menu.items ? (
                  <Sidebar.ItemGroup title={menu.title}>
                    {menu.items.map((item, i) => (
                      <Sidebar.Item
                        key={i}
                        href={item.url}
                        active={location.pathname === item.url}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Sidebar.Item>
                    ))}
                  </Sidebar.ItemGroup>
                ) : (
                  <Sidebar.Item
                    href={menu.url}
                    icon={Home}
                    active={location.pathname === menu.url}
                  >
                    <menu.icon className="h-4 w-4" />
                    <span>{menu.title}</span>
                  </Sidebar.Item>
                )}
              </React.Fragment>
            ))}
          </Sidebar.Items>
        </Sidebar>
      </SheetContent>
    </Sheet>
  );
}
