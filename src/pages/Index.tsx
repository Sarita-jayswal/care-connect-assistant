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
      const { count: tasksCount, error: tasksError } = await supabase
        .from("follow_up_tasks")
        .select("*", { count: "exact", head: true })
        .neq("status", "DONE");

      if (tasksError) console.error("Error fetching tasks count:", tasksError);

      // Get upcoming appointments count
      const { count: appointmentsCount, error: appointmentsError } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("scheduled_start", new Date().toISOString())
        .in("status", ["SCHEDULED", "CONFIRMED"]);

      if (appointmentsError) console.error("Error fetching appointments count:", appointmentsError);

      // Get total patients count
      const { count: patientsCount, error: patientsError } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true });

      if (patientsError) console.error("Error fetching patients count:", patientsError);

      // Get recent messages count (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count: messagesCount, error: messagesError } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo.toISOString());

      if (messagesError) console.error("Error fetching messages count:", messagesError);

      setStats({
        openTasks: tasksCount || 0,
        upcomingAppointments: appointmentsCount || 0,
        totalPatients: patientsCount || 0,
        recentMessages: messagesCount || 0,
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
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="relative">
        <div className="flex flex-col space-y-2">
          <h1 className="text-4xl font-outfit font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            {role === "staff" ? "Healthcare Staff Overview" : "Welcome to your patient portal"}
          </p>
        </div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl"></div>
      </div>

      {role === "staff" ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="medical-card hover:shadow-strong transition-all duration-300 group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Open Tasks</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <ClipboardList className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-outfit font-bold text-primary">{stats.openTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
              </CardContent>
            </Card>

            <Card className="medical-card hover:shadow-strong transition-all duration-300 group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Appointments</CardTitle>
                <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <Calendar className="h-4 w-4 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-outfit font-bold text-accent">{stats.upcomingAppointments}</div>
                <p className="text-xs text-muted-foreground mt-1">Scheduled</p>
              </CardContent>
            </Card>

            <Card className="medical-card hover:shadow-strong transition-all duration-300 group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Users className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-outfit font-bold text-primary">{stats.totalPatients}</div>
                <p className="text-xs text-muted-foreground mt-1">Registered</p>
              </CardContent>
            </Card>

            <Card className="medical-card hover:shadow-strong transition-all duration-300 group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Messages (7 days)</CardTitle>
                <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <MessageSquare className="h-4 w-4 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-outfit font-bold text-accent">{stats.recentMessages}</div>
                <p className="text-xs text-muted-foreground mt-1">SMS activity</p>
              </CardContent>
            </Card>
          </div>

          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-outfit">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                Quick Access
              </CardTitle>
              <CardDescription className="text-base">Jump to key sections of the CareFollow assistant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <a
                  href="/tasks"
                  className="p-5 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 hover:shadow-medium transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <ClipboardList className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground group-hover:text-primary transition-colors">Follow-up Tasks</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Manage patient follow-ups and reminders
                      </p>
                    </div>
                  </div>
                </a>
                <a
                  href="/appointments"
                  className="p-5 rounded-xl border border-border/50 hover:border-accent/50 hover:bg-accent/5 hover:shadow-medium transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                      <Calendar className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground group-hover:text-accent transition-colors">Appointments</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        View all scheduled appointments
                      </p>
                    </div>
                  </div>
                </a>
                <a
                  href="/messages"
                  className="p-5 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 hover:shadow-medium transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground group-hover:text-primary transition-colors">Messages</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        SMS conversations with patients
                      </p>
                    </div>
                  </div>
                </a>
                <a
                  href="/patients"
                  className="p-5 rounded-xl border border-border/50 hover:border-accent/50 hover:bg-accent/5 hover:shadow-medium transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                      <Users className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground group-hover:text-accent transition-colors">Patient Directory</p>
                      <p className="text-sm text-muted-foreground mt-1">
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
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="text-2xl font-outfit">Welcome to Your Patient Portal</CardTitle>
            <CardDescription className="text-base">Access your appointments and messages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <a
                href="/my-appointments"
                className="p-6 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 hover:shadow-medium transition-all duration-300 group"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-semibold text-lg">My Appointments</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  View your upcoming and past appointments
                </p>
              </a>
              <a
                href="/my-messages"
                className="p-6 rounded-xl border border-border/50 hover:border-accent/50 hover:bg-accent/5 hover:shadow-medium transition-all duration-300 group"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                    <MessageSquare className="h-6 w-6 text-accent" />
                  </div>
                  <p className="font-semibold text-lg">My Messages</p>
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
