import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, User, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

const MyAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyAppointments();
    }
  }, [user]);

  const fetchMyAppointments = async () => {
    try {
      // First, get the patient record for this user
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (patientError) {
        console.error("Error fetching patient:", patientError);
        throw new Error("Failed to load patient information");
      }

      if (!patientData) {
        console.warn("No patient record found for this user");
        setAppointments([]);
        return;
      }

      // Then get appointments for this patient
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", patientData.id)
        .order("scheduled_start", { ascending: true });

      if (error) {
        console.error("Error fetching appointments:", error);
        throw new Error("Failed to load appointments");
      }
      
      setAppointments(data || []);
    } catch (error) {
      console.error("Error in fetchMyAppointments:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      SCHEDULED: "default",
      CONFIRMED: "secondary",
      RESCHEDULED: "outline",
      CANCELLED: "destructive",
      MISSED: "destructive",
    };
    return variants[status] || "outline";
  };

  const isPastAppointment = (date: string) => {
    return new Date(date) < new Date();
  };

  const upcomingAppointments = appointments.filter(
    (apt) => !isPastAppointment(apt.scheduled_start) && apt.status !== "CANCELLED"
  );
  const pastAppointments = appointments.filter(
    (apt) => isPastAppointment(apt.scheduled_start) || apt.status === "CANCELLED"
  );

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">My Appointments</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Appointments</h1>
        <p className="text-muted-foreground">View your upcoming and past appointments</p>
      </div>

      <div className="grid gap-6">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Appointments
            </CardTitle>
            <CardDescription>
              {upcomingAppointments.length} upcoming appointment
              {upcomingAppointments.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No upcoming appointments scheduled
              </p>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((apt) => (
                  <Card key={apt.id} className="border-primary/20">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">
                              {new Date(apt.scheduled_start).toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(apt.scheduled_start).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                        <Badge variant={getStatusVariant(apt.status)}>{apt.status}</Badge>
                      </div>
                      <Separator className="my-3" />
                      <div className="space-y-2 text-sm">
                        {apt.provider_name && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>Dr. {apt.provider_name}</span>
                          </div>
                        )}
                        {apt.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{apt.location}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Past Appointments</CardTitle>
            <CardDescription>
              {pastAppointments.length} past appointment
              {pastAppointments.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pastAppointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No past appointments</p>
            ) : (
              <div className="space-y-3">
                {pastAppointments.slice(0, 5).map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {new Date(apt.scheduled_start).toLocaleDateString()}
                        </span>
                      </div>
                      {apt.provider_name && (
                        <p className="text-xs text-muted-foreground">Dr. {apt.provider_name}</p>
                      )}
                    </div>
                    <Badge variant={getStatusVariant(apt.status)} className="text-xs">
                      {apt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyAppointments;