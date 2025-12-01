import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Tasks from "./pages/Tasks";
import Appointments from "./pages/Appointments";
import Messages from "./pages/Messages";
import Patients from "./pages/Patients";
import MyAppointments from "./pages/MyAppointments";
import MyMessages from "./pages/MyMessages";
import Auth from "./pages/Auth";
import CreatePatient from "./pages/CreatePatient";
import ActivateAccount from "./pages/ActivateAccount";
import NotFound from "./pages/NotFound";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const queryClient = new QueryClient();

const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
  const { signOut, role } = useAuth();
  
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1">
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center justify-between px-4">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground capitalize">{role}</span>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
      <Route path="/activate" element={<ActivateAccount />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Index />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute allowedRoles={["staff"]}>
            <AuthenticatedLayout>
              <Tasks />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <ProtectedRoute allowedRoles={["staff"]}>
            <AuthenticatedLayout>
              <Appointments />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute allowedRoles={["staff"]}>
            <AuthenticatedLayout>
              <Messages />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedRoute allowedRoles={["staff"]}>
            <AuthenticatedLayout>
              <Patients />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-patient"
        element={
          <ProtectedRoute allowedRoles={["staff"]}>
            <AuthenticatedLayout>
              <CreatePatient />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-appointments"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <AuthenticatedLayout>
              <MyAppointments />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-messages"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <AuthenticatedLayout>
              <MyMessages />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
