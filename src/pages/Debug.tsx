import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DistinctValues {
  taskStatuses: string[];
  priorities: string[];
  appointmentStatuses: string[];
}

const Debug = () => {
  const [values, setValues] = useState<DistinctValues>({
    taskStatuses: [],
    priorities: [],
    appointmentStatuses: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDistinctValues = async () => {
      try {
        // Fetch distinct task statuses
        const { data: taskStatusData, error: taskStatusError } = await supabase
          .from('follow_up_tasks')
          .select('status')
          .order('status');

        if (taskStatusError) throw taskStatusError;

        // Fetch distinct priorities
        const { data: priorityData, error: priorityError } = await supabase
          .from('follow_up_tasks')
          .select('priority')
          .order('priority');

        if (priorityError) throw priorityError;

        // Fetch distinct appointment statuses
        const { data: appointmentStatusData, error: appointmentStatusError } = await supabase
          .from('appointments')
          .select('status')
          .order('status');

        if (appointmentStatusError) throw appointmentStatusError;

        // Extract unique values
        const uniqueTaskStatuses = [...new Set(taskStatusData?.map(item => item.status).filter(Boolean) || [])];
        const uniquePriorities = [...new Set(priorityData?.map(item => item.priority).filter(Boolean) || [])];
        const uniqueAppointmentStatuses = [...new Set(appointmentStatusData?.map(item => item.status).filter(Boolean) || [])];

        setValues({
          taskStatuses: uniqueTaskStatuses,
          priorities: uniquePriorities,
          appointmentStatuses: uniqueAppointmentStatuses,
        });
      } catch (err) {
        console.error('Error fetching distinct values:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch distinct values');
      } finally {
        setLoading(false);
      }
    };

    fetchDistinctValues();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Debug - Database Values</h1>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-8 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Debug - Database Values</h1>
        <Alert variant="destructive">
          <AlertDescription>Error: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Debug - Database Values</h1>
        <p className="text-muted-foreground mt-2">
          Distinct values currently in the database for enum/status fields
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Task Statuses</CardTitle>
            <CardDescription>
              Distinct values from follow_up_tasks.status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {values.taskStatuses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No values found</p>
            ) : (
              <div className="space-y-2">
                {values.taskStatuses.map((status) => (
                  <div key={status} className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Priorities</CardTitle>
            <CardDescription>
              Distinct values from follow_up_tasks.priority
            </CardDescription>
          </CardHeader>
          <CardContent>
            {values.priorities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No values found</p>
            ) : (
              <div className="space-y-2">
                {values.priorities.map((priority) => (
                  <div key={priority} className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointment Statuses</CardTitle>
            <CardDescription>
              Distinct values from appointments.status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {values.appointmentStatuses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No values found</p>
            ) : (
              <div className="space-y-2">
                {values.appointmentStatuses.map((status) => (
                  <div key={status} className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Alert className="mt-6">
        <AlertDescription>
          <strong>Note:</strong> These are the actual values currently stored in your database. 
          Use these exact values (including capitalization) in your dropdown menus.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default Debug;
