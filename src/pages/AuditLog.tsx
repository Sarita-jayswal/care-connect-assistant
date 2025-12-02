import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AuditLog = {
  id: string;
  event_type: string;
  created_at: string;
  created_by: string;
  metadata: any;
  appointment_id: string | null;
  patient_id: string | null;
};

export default function AuditLog() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeBadgeVariant = (eventType: string) => {
    const type = eventType.toLowerCase();
    if (type.includes("create") || type.includes("insert")) return "default";
    if (type.includes("update") || type.includes("edit")) return "secondary";
    if (type.includes("delete") || type.includes("remove")) return "destructive";
    return "outline";
  };

  const toggleSelectAll = () => {
    if (selectedLogs.length === logs.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(logs.map((log) => log.id));
    }
  };

  const toggleSelectLog = (id: string) => {
    setSelectedLogs((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedLogs.length === 0) return;

    try {
      const { error } = await supabase
        .from("audit_log")
        .delete()
        .in("id", selectedLogs);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedLogs.length} audit log(s) deleted successfully`,
      });

      setSelectedLogs([]);
      setIsBulkDeleteOpen(false);
      fetchAuditLogs();
    } catch (error: any) {
      console.error("Error deleting audit logs:", error);
      const errorMessage = error?.message || error?.error_description || "Failed to delete audit logs";
      toast({
        title: "Error Deleting Audit Logs",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card className="p-6">
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex justify-between items-start">
        <div className="relative flex-1">
          <div className="flex flex-col space-y-2">
            <h1 className="text-4xl font-outfit font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Audit Log
            </h1>
            <p className="text-muted-foreground text-lg">
              System activity and event tracking
            </p>
          </div>
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-accent/5 rounded-full blur-2xl"></div>
        </div>
        {selectedLogs.length > 0 && (
          <Button
            variant="destructive"
            onClick={() => setIsBulkDeleteOpen(true)}
            className="shadow-soft"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected ({selectedLogs.length})
          </Button>
        )}
      </div>

      <Card className="medical-card">
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedLogs.length === logs.length && logs.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Patient ID</TableHead>
                <TableHead>Appointment ID</TableHead>
                <TableHead>Metadata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedLogs.includes(log.id)}
                        onCheckedChange={() => toggleSelectLog(log.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(log.created_at), "MMM dd, yyyy HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getEventTypeBadgeVariant(log.event_type)}>
                        {log.event_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{log.created_by}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.patient_id ? (
                        <span className="truncate block max-w-[150px]" title={log.patient_id}>
                          {log.patient_id}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.appointment_id ? (
                        <span className="truncate block max-w-[150px]" title={log.appointment_id}>
                          {log.appointment_id}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      {log.metadata ? (
                        <details className="cursor-pointer">
                          <summary className="text-sm text-muted-foreground hover:text-foreground">
                            View details
                          </summary>
                          <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Audit Logs</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedLogs.length} audit log(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedLogs.length} Log(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
