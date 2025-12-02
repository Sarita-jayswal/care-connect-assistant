import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Phone, Calendar, ArrowRight, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

type Message = Database["public"]["Tables"]["messages"]["Row"] & {
  patients: Pick<Database["public"]["Tables"]["patients"]["Row"], "first_name" | "last_name" | "phone"> | null;
};

const Messages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          patients (
            first_name,
            last_name,
            phone
          )
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching messages:", error);
        throw new Error("Failed to load messages");
      }
      
      setMessages(data || []);
    } catch (error) {
      console.error("Error in fetchMessages:", error);
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
        <h1 className="text-3xl font-bold mb-6">Messages</h1>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Group messages by phone number
  const messagesByPhone = messages.reduce((acc, msg) => {
    const phone = msg.phone || "unknown";
    if (!acc[phone]) {
      acc[phone] = [];
    }
    acc[phone].push(msg);
    return acc;
  }, {} as Record<string, Message[]>);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground">SMS conversations with patients</p>
      </div>

      <div className="grid gap-6">
        {Object.entries(messagesByPhone).map(([phone, msgs]) => {
          const latestMsg = msgs[0];
          const patient = latestMsg.patients;

          return (
            <Card key={phone}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      {patient ? (
                        `${patient.first_name} ${patient.last_name}`
                      ) : (
                        "Unknown Patient"
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Phone className="h-3 w-3" />
                      {phone}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{msgs.length} messages</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                  <div className="space-y-4">
                    {msgs.map((msg, idx) => (
                      <div key={msg.id}>
                        <div
                          className={`flex ${
                            msg.direction === "OUTBOUND" ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              msg.direction === "OUTBOUND"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {getDirectionIcon(msg.direction)}
                              <Badge variant={getChannelColor(msg.channel)} className="text-xs">
                                {msg.channel}
                              </Badge>
                              <Badge variant={getStatusColor(msg.status)} className="text-xs">
                                {msg.status}
                              </Badge>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(msg.created_at), "PPp")}
                            </div>
                          </div>
                        </div>
                        {idx < msgs.length - 1 && <Separator className="my-2" />}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          );
        })}

        {Object.keys(messagesByPhone).length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No messages found
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Messages;