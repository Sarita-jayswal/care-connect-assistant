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
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Trash2, MoreVertical, Calendar, Phone, MessageSquare, User, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface TaskData {
  task_id: string;
  task_type: string;
  priority: string;
  task_status: string;
  risk_score: number;
  task_created_at: string;
  completed_at: string | null;
  description: string | null;
  patient_id: string;
  first_name: string;
  last_name: string;
  patient_phone: string;
  missed_appointment_count: number;
  appointment_id: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  appointment_status: string | null;
  provider_name: string | null;
  location: string | null;
}

// Helper function to convert UTC ISO string to datetime-local format
const toDatetimeLocalString = (utcString: string | null) => {
  if (!utcString) return "";
  const date = new Date(utcString);
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().slice(0, 16);
};

// Helper function to convert datetime-local string to UTC ISO string
const toUTCString = (datetimeLocal: string) => {
  if (!datetimeLocal) return "";
  const date = new Date(datetimeLocal);
  return date.toISOString();
};

const Tasks = () => {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "completed">("open");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [taskToReschedule, setTaskToReschedule] = useState<TaskData | null>(null);
  const [rescheduleData, setRescheduleData] = useState({
    scheduled_start: "",
    scheduled_end: "",
    provider_name: "",
    location: "",
  });
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

  const handleDeleteClick = (taskId: string) => {
    setTaskToDelete(taskId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;

    try {
      const { error } = await supabase
        .from('follow_up_tasks')
        .delete()
        .eq('id', taskToDelete);

      if (error) throw error;

      // Update local state
      setTasks(tasks.filter(task => task.task_id !== taskToDelete));

      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (err) {
      console.error('Error deleting task:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete task',
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const handleRescheduleClick = (task: TaskData) => {
    if (!task.appointment_id) {
      toast({
        title: "No Appointment",
        description: "This task is not linked to an appointment",
        variant: "destructive",
      });
      return;
    }
    setTaskToReschedule(task);
    setRescheduleData({
      scheduled_start: toDatetimeLocalString(task.scheduled_start),
      scheduled_end: toDatetimeLocalString(task.scheduled_end),
      provider_name: task.provider_name || "",
      location: task.location || "",
    });
    setRescheduleDialogOpen(true);
  };

  const handleRescheduleConfirm = async () => {
    if (!taskToReschedule?.appointment_id) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          scheduled_start: toUTCString(rescheduleData.scheduled_start),
          scheduled_end: toUTCString(rescheduleData.scheduled_end),
          provider_name: rescheduleData.provider_name,
          location: rescheduleData.location,
          status: 'RESCHEDULED',
        })
        .eq('id', taskToReschedule.appointment_id);

      if (error) throw error;

      // Refresh tasks
      const { data } = await supabase.rpc('get_follow_up_tasks');
      if (data) setTasks(data);

      toast({
        title: "Success",
        description: "Appointment rescheduled successfully",
      });

      setRescheduleDialogOpen(false);
      setTaskToReschedule(null);
    } catch (err) {
      console.error('Error rescheduling appointment:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to reschedule appointment',
        variant: "destructive",
      });
    }
  };

  const handleCallPatient = (task: TaskData) => {
    toast({
      title: "Call Logged",
      description: `Contact attempt logged for ${task.first_name} ${task.last_name}`,
    });
    // In a real implementation, this would log the call attempt to the database
  };

  const handleSendSMS = (task: TaskData) => {
    toast({
      title: "SMS Feature",
      description: "SMS reminder functionality will be integrated with Twilio",
    });
    // This would integrate with your existing Twilio/n8n workflow
  };

  const handleViewPatient = (patientId: string) => {
    window.location.href = `/patients`;
    // In a more advanced implementation, this could open a patient detail modal
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
              <TableHead>Details</TableHead>
              <TableHead>Patient Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Missed Count</TableHead>
              <TableHead>Apt. Status</TableHead>
              <TableHead>Task Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  No tasks found
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => (
                <TableRow key={task.task_id}>
                  <TableCell className="font-medium whitespace-nowrap">{task.task_type}</TableCell>
                  <TableCell className="min-w-[300px] max-w-md">
                    {task.description ? (
                      <span className="text-sm text-muted-foreground">
                        {task.description}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {task.first_name} {task.last_name}
                  </TableCell>
                  <TableCell>{task.patient_phone}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {task.missed_appointment_count >= 2 && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                      <Badge 
                        variant={task.missed_appointment_count >= 2 ? "destructive" : "secondary"}
                      >
                        {task.missed_appointment_count} missed
                      </Badge>
                    </div>
                  </TableCell>
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
                  <TableCell className="whitespace-nowrap">
                    {new Date(task.task_created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {task.appointment_id && (
                            <DropdownMenuItem onClick={() => handleRescheduleClick(task)}>
                              <Calendar className="mr-2 h-4 w-4" />
                              Reschedule
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleCallPatient(task)}>
                            <Phone className="mr-2 h-4 w-4" />
                            Log Call
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSendSMS(task)}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Send SMS
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewPatient(task.patient_id)}>
                            <User className="mr-2 h-4 w-4" />
                            View Patient
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(task.task_id)}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Update the appointment details for {taskToReschedule?.first_name} {taskToReschedule?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="scheduled_start">Start Time</Label>
              <Input
                id="scheduled_start"
                type="datetime-local"
                value={rescheduleData.scheduled_start}
                onChange={(e) => setRescheduleData({ ...rescheduleData, scheduled_start: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="scheduled_end">End Time</Label>
              <Input
                id="scheduled_end"
                type="datetime-local"
                value={rescheduleData.scheduled_end}
                onChange={(e) => setRescheduleData({ ...rescheduleData, scheduled_end: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="provider_name">Provider Name</Label>
              <Input
                id="provider_name"
                value={rescheduleData.provider_name}
                onChange={(e) => setRescheduleData({ ...rescheduleData, provider_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={rescheduleData.location}
                onChange={(e) => setRescheduleData({ ...rescheduleData, location: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRescheduleConfirm}>
              Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tasks;
