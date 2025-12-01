import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ClipboardList, MessageSquare, Users, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { role } = useAuth();
  const [stats, setStats] = useState({
    openTasks: 0,
    upcomingAppointments: 0,
    totalPatients: 0,
    recentMessages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role === "staff") {
      fetchStaffStats();
    } else {
      setLoading(false);
    }
  }, [role]);

  const fetchStaffStats = async () => {
    try {
      // Get open tasks count
      const { data: tasks } = await supabase
        .from("follow_up_tasks")
        .select("id", { count: "exact", head: true })
        .neq("status", "DONE");

      // Get upcoming appointments count
      const { data: appointments } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .gte("scheduled_start", new Date().toISOString())
        .in("status", ["SCHEDULED", "CONFIRMED"]);

      // Get total patients count
      const { data: patients } = await supabase
        .from("patients")
        .select("id", { count: "exact", head: true });

      // Get recent messages count (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: messages } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo.toISOString());

      setStats({
        openTasks: tasks?.length || 0,
        upcomingAppointments: appointments?.length || 0,
        totalPatients: patients?.length || 0,
        recentMessages: messages?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {role === "staff" ? "Healthcare Staff Overview" : "Welcome to your patient portal"}
        </p>
      </div>

      {role === "staff" ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Open Tasks</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.openTasks}</div>
                <p className="text-xs text-muted-foreground">Requires attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.upcomingAppointments}</div>
                <p className="text-xs text-muted-foreground">Scheduled</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPatients}</div>
                <p className="text-xs text-muted-foreground">Registered</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Messages (7 days)</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.recentMessages}</div>
                <p className="text-xs text-muted-foreground">SMS activity</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Quick Access
              </CardTitle>
              <CardDescription>Jump to key sections of the healthcare assistant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <a
                  href="/tasks"
                  className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Follow-up Tasks</p>
                      <p className="text-sm text-muted-foreground">
                        Manage patient follow-ups and reminders
                      </p>
                    </div>
                  </div>
                </a>
                <a
                  href="/appointments"
                  className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Appointments</p>
                      <p className="text-sm text-muted-foreground">
                        View all scheduled appointments
                      </p>
                    </div>
                  </div>
                </a>
                <a
                  href="/messages"
                  className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Messages</p>
                      <p className="text-sm text-muted-foreground">
                        SMS conversations with patients
                      </p>
                    </div>
                  </div>
                </a>
                <a
                  href="/patients"
                  className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Patient Directory</p>
                      <p className="text-sm text-muted-foreground">
                        Search and view patient records
                      </p>
                    </div>
                  </div>
                </a>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Your Patient Portal</CardTitle>
            <CardDescription>Access your appointments and messages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <a
                href="/my-appointments"
                className="p-6 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="h-6 w-6 text-primary" />
                  <p className="font-semibold">My Appointments</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  View your upcoming and past appointments
                </p>
              </a>
              <a
                href="/my-messages"
                className="p-6 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  <p className="font-semibold">My Messages</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your conversation history with the clinic
                </p>
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Index;
