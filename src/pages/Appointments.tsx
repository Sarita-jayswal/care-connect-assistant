import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";

// Helper functions to convert between datetime-local format and UTC
const toDatetimeLocalString = (utcTimestamp: string): string => {
  const date = new Date(utcTimestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toUTCString = (datetimeLocalString: string): string => {
  // Parse the datetime-local string as local time and convert to UTC
  const localDate = new Date(datetimeLocalString);
  return localDate.toISOString();
};

type Patient = Database["public"]["Tables"]["patients"]["Row"];
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, MapPin, User, Pencil, Plus, Trash2, Filter, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"] & {
  patients: Pick<Database["public"]["Tables"]["patients"]["Row"], "first_name" | "last_name" | "phone">;
};

const appointmentSchema = z.object({
  scheduled_start: z.string().min(1, "Start time is required"),
  scheduled_end: z.string().optional().nullable(),
  provider_name: z.string().trim().max(200).optional().nullable(),
  location: z.string().trim().max(500).optional().nullable(),
  status: z.enum(["SCHEDULED", "CONFIRMED", "RESCHEDULED", "CANCELLED", "MISSED"]),
});

const createAppointmentSchema = z.object({
  patient_id: z.string().uuid("Please select a patient"),
  scheduled_start: z.string().min(1, "Start time is required"),
  scheduled_end: z.string().min(1, "End time is required"),
  provider_name: z.string().trim().min(1, "Provider name is required").max(200),
  location: z.string().trim().min(1, "Location is required").max(500),
  status: z.enum(["SCHEDULED", "CONFIRMED", "RESCHEDULED", "CANCELLED", "MISSED"]),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;
type CreateAppointmentFormData = z.infer<typeof createAppointmentSchema>;

const Appointments = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null);
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  
  // Filter states from URL params
  const [startDate, setStartDate] = useState<Date | undefined>(
    searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined
  );
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "all");
  const [providerFilter, setProviderFilter] = useState<string>(searchParams.get("provider") || "");

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      scheduled_start: "",
      scheduled_end: "",
      provider_name: "",
      location: "",
      status: "SCHEDULED",
    },
  });

  const createForm = useForm<CreateAppointmentFormData>({
    resolver: zodResolver(createAppointmentSchema),
    defaultValues: {
      patient_id: "",
      scheduled_start: "",
      scheduled_end: "",
      provider_name: "",
      location: "",
      status: "SCHEDULED",
    },
  });

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", format(startDate, "yyyy-MM-dd"));
    if (endDate) params.set("endDate", format(endDate, "yyyy-MM-dd"));
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    if (providerFilter) params.set("provider", providerFilter);
    setSearchParams(params, { replace: true });
  }, [startDate, endDate, statusFilter, providerFilter]);

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          patients!inner (
            first_name,
            last_name,
            phone
          )
        `)
        .order("scheduled_start", { ascending: false });

      if (error) {
        console.error("Error fetching appointments:", error);
        throw new Error("Failed to load appointments");
      }
      
      setAppointments(data || []);
    } catch (error) {
      console.error("Error in fetchAppointments:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("last_name", { ascending: true });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    form.reset({
      scheduled_start: toDatetimeLocalString(appointment.scheduled_start),
      scheduled_end: appointment.scheduled_end 
        ? toDatetimeLocalString(appointment.scheduled_end)
        : "",
      provider_name: appointment.provider_name || "",
      location: appointment.location || "",
      status: appointment.status,
    });
    setIsEditDialogOpen(true);
  };

  const onSubmit = async (data: AppointmentFormData) => {
    if (!editingAppointment) return;

    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          scheduled_start: toUTCString(data.scheduled_start),
          scheduled_end: data.scheduled_end ? toUTCString(data.scheduled_end) : null,
          provider_name: data.provider_name || null,
          location: data.location || null,
          status: data.status,
        })
        .eq("id", editingAppointment.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Appointment updated successfully",
      });

      setIsEditDialogOpen(false);
      fetchAppointments();
    } catch (error: any) {
      console.error("Error updating appointment:", error);
      const errorMessage = error?.message || error?.error_description || "Failed to update appointment";
      toast({
        title: "Error Updating Appointment",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const onCreateSubmit = async (data: CreateAppointmentFormData) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .insert({
          patient_id: data.patient_id,
          scheduled_start: toUTCString(data.scheduled_start),
          scheduled_end: toUTCString(data.scheduled_end),
          provider_name: data.provider_name,
          location: data.location,
          status: data.status,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Appointment created successfully",
      });

      setIsCreateDialogOpen(false);
      createForm.reset();
      fetchAppointments();
    } catch (error: any) {
      console.error("Error creating appointment:", error);
      const errorMessage = error?.message || error?.error_description || "Failed to create appointment";
      toast({
        title: "Error Creating Appointment",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDeleteAppointment = async () => {
    if (!deletingAppointment) return;

    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", deletingAppointment.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Appointment deleted successfully",
      });

      setDeletingAppointment(null);
      fetchAppointments();
    } catch (error: any) {
      console.error("Error deleting appointment:", error);
      const errorMessage = error?.message || error?.error_description || "Failed to delete appointment";
      toast({
        title: "Error Deleting Appointment",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAppointments.length === 0) return;

    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .in("id", selectedAppointments);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedAppointments.length} appointment(s) deleted successfully`,
      });

      setSelectedAppointments([]);
      setIsBulkDeleteOpen(false);
      fetchAppointments();
    } catch (error: any) {
      console.error("Error deleting appointments:", error);
      const errorMessage = error?.message || error?.error_description || "Failed to delete appointments";
      toast({
        title: "Error Deleting Appointments",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const toggleSelectAll = () => {
    if (selectedAppointments.length === filteredAppointments.length) {
      setSelectedAppointments([]);
    } else {
      setSelectedAppointments(filteredAppointments.map((a) => a.id));
    }
  };

  const toggleSelectAppointment = (id: string) => {
    setSelectedAppointments((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Filter appointments based on filters
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      // Date range filter
      if (startDate) {
        const appointmentDate = new Date(appointment.scheduled_start);
        if (appointmentDate < startDate) return false;
      }
      if (endDate) {
        const appointmentDate = new Date(appointment.scheduled_start);
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (appointmentDate > endOfDay) return false;
      }
      
      // Status filter
      if (statusFilter && statusFilter !== "all" && appointment.status !== statusFilter) {
        return false;
      }
      
      // Provider name filter
      if (providerFilter && appointment.provider_name) {
        if (!appointment.provider_name.toLowerCase().includes(providerFilter.toLowerCase())) {
          return false;
        }
      } else if (providerFilter && !appointment.provider_name) {
        return false;
      }
      
      return true;
    });
  }, [appointments, startDate, endDate, statusFilter, providerFilter]);

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setStatusFilter("all");
    setProviderFilter("");
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters = startDate || endDate || (statusFilter && statusFilter !== "all") || providerFilter;

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

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Appointments</h1>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex justify-between items-start">
        <div className="relative flex-1">
          <div className="flex flex-col space-y-2">
            <h1 className="text-4xl font-outfit font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Appointments
            </h1>
            <p className="text-muted-foreground text-lg">View and manage all patient appointments</p>
          </div>
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-accent/5 rounded-full blur-2xl"></div>
        </div>
        <div className="flex gap-2">
          {selectedAppointments.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setIsBulkDeleteOpen(true)}
              className="shadow-soft"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedAppointments.length})
            </Button>
          )}
          <Button onClick={() => setIsCreateDialogOpen(true)} className="shadow-soft medical-gradient-bg hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4 mr-2" />
            Create Appointment
          </Button>
        </div>
      </div>

      <Card className="medical-card">
        <CardHeader>
          <CardTitle className="text-2xl font-outfit">All Appointments</CardTitle>
          <CardDescription className="text-base">
            Total: {appointments.length} appointments | Showing: {filteredAppointments.length}
          </CardDescription>
          
          {/* Filters */}
          <div className="pt-4 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
              
              {/* Date Range Filter */}
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">From:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>

                <Label className="text-sm text-muted-foreground">To:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Status:</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] h-9">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="RESCHEDULED">Rescheduled</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="MISSED">Missed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Provider Filter */}
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Provider:</Label>
                <Input
                  placeholder="Search provider..."
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                  className="w-[200px] h-9"
                />
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-9"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedAppointments.length === filteredAppointments.length && filteredAppointments.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>24h Reminder</TableHead>
                  <TableHead>2h Reminder</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      {hasActiveFilters ? "No appointments match the current filters" : "No appointments found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedAppointments.includes(appointment.id)}
                          onCheckedChange={() => toggleSelectAppointment(appointment.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {appointment.patients.first_name} {appointment.patients.last_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {appointment.patients.phone}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {new Date(appointment.scheduled_start).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(appointment.scheduled_start).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {appointment.provider_name || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {appointment.location ? (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{appointment.location}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {appointment.reminder_24h_sent_at ? (
                          <div className="text-xs">
                            <div className="font-medium text-green-600">Sent</div>
                            <div className="text-muted-foreground">
                              {format(new Date(appointment.reminder_24h_sent_at), "MMM dd, HH:mm")}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs">Not sent</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {appointment.reminder_2h_sent_at ? (
                          <div className="text-xs">
                            <div className="font-medium text-green-600">Sent</div>
                            <div className="text-muted-foreground">
                              {format(new Date(appointment.reminder_2h_sent_at), "MMM dd, HH:mm")}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs">Not sent</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditAppointment(appointment)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingAppointment(appointment)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogDescription>
              Update appointment details below
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="scheduled_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date & Time</FormLabel>
                    <FormControl>
                      <Input {...field} type="datetime-local" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="scheduled_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date & Time (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} type="datetime-local" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="provider_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider Name (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Dr. Smith" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Clinic Room 101" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                        <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                        <SelectItem value="RESCHEDULED">Rescheduled</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        <SelectItem value="MISSED">Missed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Appointment</DialogTitle>
            <DialogDescription>
              Schedule a new appointment for a patient
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="patient_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a patient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.first_name} {patient.last_name} - {patient.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="scheduled_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date & Time</FormLabel>
                    <FormControl>
                      <Input {...field} type="datetime-local" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="scheduled_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date & Time *</FormLabel>
                    <FormControl>
                      <Input {...field} type="datetime-local" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="provider_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Dr. Smith" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Clinic Room 101" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                        <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                        <SelectItem value="RESCHEDULED">Rescheduled</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        <SelectItem value="MISSED">Missed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Appointment</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingAppointment} onOpenChange={(open) => !open && setDeletingAppointment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this appointment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAppointment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Appointments</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedAppointments.length} appointment(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete {selectedAppointments.length} Appointment(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Appointments;