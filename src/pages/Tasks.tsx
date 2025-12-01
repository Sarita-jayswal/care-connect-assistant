import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

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
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "completed">("open");
  const { toast } = useToast();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data, error } = await supabase.rpc('get_follow_up_tasks');
        
        if (error) {
          console.error('RPC Error:', error);
          throw new Error(`Failed to fetch tasks: ${error.message}`);
        }
        
        if (!data) {
          console.warn('No tasks data returned');
          setTasks([]);
          return;
        }
        
        setTasks(data);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
        setTasks([]);
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

  const handleStatusUpdate = async (taskId: string, newStatus: Database['public']['Enums']['follow_up_status']) => {
    try {
      const isCompleted = newStatus === 'DONE';
      const completedAt = isCompleted ? new Date().toISOString() : null;

      const { error } = await supabase
        .from('follow_up_tasks')
        .update({ 
          status: newStatus,
          completed_at: completedAt
        })
        .eq('id', taskId);

      if (error) throw error;

      // Update local state
      setTasks(tasks.map(task => 
        task.task_id === taskId 
          ? { ...task, task_status: newStatus, completed_at: completedAt }
          : task
      ));

      toast({
        title: "Success",
        description: "Task status updated successfully",
      });
    } catch (err) {
      console.error('Error updating task status:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update task status',
        variant: "destructive",
      });
    }
  };

  const handlePriorityUpdate = async (taskId: string, newPriority: Database['public']['Enums']['follow_up_priority']) => {
    try {
      const { error } = await supabase
        .from('follow_up_tasks')
        .update({ priority: newPriority })
        .eq('id', taskId);

      if (error) throw error;

      // Update local state
      setTasks(tasks.map(task => 
        task.task_id === taskId 
          ? { ...task, priority: newPriority }
          : task
      ));

      toast({
        title: "Success",
        description: "Priority updated successfully",
      });
    } catch (err) {
      console.error('Error updating priority:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update priority',
        variant: "destructive",
      });
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

  const filteredTasks = filterStatus === "all" 
    ? tasks
    : filterStatus === "open"
    ? tasks.filter(task => task.task_status !== 'DONE')
    : tasks.filter(task => task.task_status === 'DONE');

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Follow-up Tasks</h1>
      
      <div className="flex items-center gap-3 mb-4">
        <Label htmlFor="filter-status">Filter by status:</Label>
        <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
          <SelectTrigger id="filter-status" className="w-[180px] bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="open">Open & In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
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
              <TableHead>Created At</TableHead>
              <TableHead>Completed At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
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
                    <Select
                      value={task.task_status}
                      onValueChange={(value) => handleStatusUpdate(task.task_id, value as Database['public']['Enums']['follow_up_status'])}
                    >
                      <SelectTrigger className="w-[140px] bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        <SelectItem value="OPEN">OPEN</SelectItem>
                        <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
                        <SelectItem value="DONE">DONE</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={task.priority}
                      onValueChange={(value) => handlePriorityUpdate(task.task_id, value as Database['public']['Enums']['follow_up_priority'])}
                    >
                      <SelectTrigger className="w-[120px] bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        <SelectItem value="LOW">LOW</SelectItem>
                        <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                        <SelectItem value="HIGH">HIGH</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {new Date(task.task_created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {task.completed_at ? (
                      <span className="text-sm">
                        {new Date(task.completed_at).toLocaleDateString()} {new Date(task.completed_at).toLocaleTimeString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
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
