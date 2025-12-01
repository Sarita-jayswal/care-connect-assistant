import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface TaskData {
  task_id: string;
  task_type: string;
  priority: string;
  task_status: string;
  risk_score: number;
  task_created_at: string;
  completed_at: string | null;
  patient_id: string;
  first_name: string;
  last_name: string;
  patient_phone: string;
  appointment_id: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  appointment_status: string | null;
  provider_name: string | null;
  location: string | null;
}

const Tasks = () => {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyOpen, setShowOnlyOpen] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data, error } = await supabase.rpc('get_follow_up_tasks');
        
        if (error) throw error;
        
        setTasks(data || []);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'secondary';
      case 'pending':
        return 'default';
      case 'overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Tasks</h1>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Tasks</h1>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive">Error: {error}</p>
        </div>
      </div>
    );
  }

  const filteredTasks = showOnlyOpen 
    ? tasks.filter(task => task.task_status === 'OPEN')
    : tasks;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Follow-up Tasks</h1>
      
      <div className="flex items-center gap-3 mb-4">
        <Switch
          id="show-open-tasks"
          checked={showOnlyOpen}
          onCheckedChange={setShowOnlyOpen}
        />
        <Label htmlFor="show-open-tasks" className="cursor-pointer">
          Show only OPEN tasks
        </Label>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task Type</TableHead>
              <TableHead>Patient Name</TableHead>
              <TableHead>Patient Phone</TableHead>
              <TableHead>Appointment Status</TableHead>
              <TableHead>Task Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Task Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No tasks found
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => (
                <TableRow key={task.task_id}>
                  <TableCell className="font-medium">{task.task_type}</TableCell>
                  <TableCell>
                    {task.first_name} {task.last_name}
                  </TableCell>
                  <TableCell>{task.patient_phone}</TableCell>
                  <TableCell>
                    {task.appointment_status ? (
                      <Badge variant="outline">{task.appointment_status}</Badge>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(task.task_status)}>
                      {task.task_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(task.task_created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Tasks;
