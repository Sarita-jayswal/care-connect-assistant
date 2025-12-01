import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Calendar, ArrowRight, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

type Message = Database["public"]["Tables"]["messages"]["Row"];

const MyMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyMessages();
    }
  }, [user]);

  const fetchMyMessages = async () => {
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
        setMessages([]);
        return;
      }

      // Then get messages for this patient
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("patient_id", patientData.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching messages:", error);
        throw new Error("Failed to load messages");
      }
      
      setMessages(data || []);
    } catch (error) {
      console.error("Error in fetchMyMessages:", error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const getDirectionIcon = (direction: string) => {
    return direction === "OUTBOUND" ? (
      <ArrowRight className="h-4 w-4 text-primary" />
    ) : (
      <ArrowLeft className="h-4 w-4 text-secondary" />
    );
  };

  const getChannelColor = (channel: string) => {
    return channel === "SMS" ? "default" : "secondary";
  };

  const getStatusColor = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      SENT: "default",
      DELIVERED: "secondary",
      FAILED: "destructive",
      RECEIVED: "outline",
    };
    return variants[status] || "outline";
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">My Messages</h1>
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Messages</h1>
        <p className="text-muted-foreground">Your conversation history with the clinic</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Message History
          </CardTitle>
          <CardDescription>Total: {messages.length} messages</CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No messages yet</p>
          ) : (
            <ScrollArea className="h-[600px] w-full rounded-md border p-4">
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div key={msg.id}>
                    <div
                      className={`flex ${
                        msg.direction === "INBOUND" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          msg.direction === "INBOUND"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {getDirectionIcon(msg.direction)}
                          <Badge variant={getChannelColor(msg.channel)} className="text-xs">
                            {msg.channel}
                          </Badge>
                          {msg.direction === "OUTBOUND" && (
                            <Badge variant={getStatusColor(msg.status)} className="text-xs">
                              {msg.status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                        <div className="flex items-center gap-2 mt-3 text-xs opacity-70">
                          <Calendar className="h-3 w-3" />
                          {new Date(msg.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {idx < messages.length - 1 && <Separator className="my-3" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyMessages;