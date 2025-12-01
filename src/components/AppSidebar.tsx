import { Home, ClipboardList, Calendar, MessageSquare, Users, Bug } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

const staffItems = [
  { title: "Tasks", url: "/tasks", icon: ClipboardList },
  { title: "Appointments", url: "/appointments", icon: Calendar },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Patients", url: "/patients", icon: Users },
  { title: "Debug", url: "/debug", icon: Bug },
];

const patientItems = [
  { title: "My Appointments", url: "/my-appointments", icon: Calendar },
  { title: "My Messages", url: "/my-messages", icon: MessageSquare },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { role } = useAuth();
  
  const items = role === "staff" ? staffItems : patientItems;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {role === "staff" ? "Staff Portal" : "Patient Portal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
