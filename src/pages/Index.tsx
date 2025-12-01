import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ClipboardList, MessageSquare, Users, Activity, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

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
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          {role === "staff" ? "Staff Dashboard" : "Patient Portal"}
        </h1>
        <p className="text-muted-foreground text-lg">
          {role === "staff" ? "Healthcare management overview and quick access" : "Welcome to your patient portal"}
        </p>
      </div>

      {role === "staff" ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Open Tasks</CardTitle>
                <ClipboardList className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.openTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
                <Link to="/tasks">
                  <Button variant="ghost" size="sm" className="mt-2 h-8 px-2">
                    View all <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
                <Calendar className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.upcomingAppointments}</div>
                <p className="text-xs text-muted-foreground mt-1">Scheduled</p>
                <Link to="/appointments">
                  <Button variant="ghost" size="sm" className="mt-2 h-8 px-2">
                    View all <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                <Users className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalPatients}</div>
                <p className="text-xs text-muted-foreground mt-1">Registered</p>
                <Link to="/patients">
                  <Button variant="ghost" size="sm" className="mt-2 h-8 px-2">
                    View all <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Messages (7 days)</CardTitle>
                <MessageSquare className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.recentMessages}</div>
                <p className="text-xs text-muted-foreground mt-1">SMS activity</p>
                <Link to="/messages">
                  <Button variant="ghost" size="sm" className="mt-2 h-8 px-2">
                    View all <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Activity className="h-6 w-6" />
                Quick Access
              </CardTitle>
              <CardDescription>Navigate to key sections of the healthcare system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Link
                  to="/tasks"
                  className="group p-5 rounded-lg border hover:border-primary hover:bg-muted/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ClipboardList className="h-6 w-6 text-primary" />
                      <div>
                        <p className="font-semibold">Follow-up Tasks</p>
                        <p className="text-sm text-muted-foreground">
                          Manage patient follow-ups and reminders
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
                
                <Link
                  to="/appointments"
                  className="group p-5 rounded-lg border hover:border-primary hover:bg-muted/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-6 w-6 text-primary" />
                      <div>
                        <p className="font-semibold">Appointments</p>
                        <p className="text-sm text-muted-foreground">
                          View and manage all appointments
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
                
                <Link
                  to="/messages"
                  className="group p-5 rounded-lg border hover:border-primary hover:bg-muted/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-6 w-6 text-primary" />
                      <div>
                        <p className="font-semibold">Messages</p>
                        <p className="text-sm text-muted-foreground">
                          SMS conversations with patients
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
                
                <Link
                  to="/patients"
                  className="group p-5 rounded-lg border hover:border-primary hover:bg-muted/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-6 w-6 text-primary" />
                      <div>
                        <p className="font-semibold">Patient Directory</p>
                        <p className="text-sm text-muted-foreground">
                          Search and view patient records
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Welcome to Your Patient Portal</CardTitle>
            <CardDescription>Access your appointments and messages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Link
                to="/my-appointments"
                className="group p-6 rounded-lg border hover:border-primary hover:bg-muted/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="h-6 w-6 text-primary" />
                      <p className="font-semibold text-lg">My Appointments</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      View your upcoming and past appointments
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
              
              <Link
                to="/my-messages"
                className="group p-6 rounded-lg border hover:border-primary hover:bg-muted/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <MessageSquare className="h-6 w-6 text-primary" />
                      <p className="font-semibold text-lg">My Messages</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your conversation history with the clinic
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Index;
