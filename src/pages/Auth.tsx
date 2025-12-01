import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.string().email("Invalid email address").max(255);
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(100);
const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone format (e.g., +1234567890)").max(20);

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Staff login
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  
  // Patient login
  const [patientPhone, setPatientPhone] = useState("");
  const [patientPassword, setPatientPassword] = useState("");
  
  // Signup states
  const [isSignup, setIsSignup] = useState(false);
  const [signupName, setSignupName] = useState("");

  const handleStaffAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      emailSchema.parse(staffEmail);
      passwordSchema.parse(staffPassword);

      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: staffEmail,
          password: staffPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              role: "staff",
              full_name: signupName,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          // Create entry in users table
          await supabase.from("users").insert({
            user_id: data.user.id,
            email: staffEmail,
            full_name: signupName,
            role: "COORDINATOR",
          });

          toast({
            title: "Account created!",
            description: "Please check your email to verify your account.",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: staffEmail,
          password: staffPassword,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "Successfully logged in as staff.",
        });
        navigate("/tasks");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePatientAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      phoneSchema.parse(patientPhone);
      passwordSchema.parse(patientPassword);

      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          phone: patientPhone,
          password: patientPassword,
          options: {
            data: {
              role: "patient",
              full_name: signupName,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          // Find matching patient by phone
          const { data: patientData, error: patientError } = await supabase
            .from("patients")
            .select("id")
            .eq("phone", patientPhone)
            .maybeSingle();

          if (patientError) {
            console.error("Error finding patient:", patientError);
          }

          if (patientData) {
            // Link patient to auth user
            const { error: updateError } = await supabase
              .from("patients")
              .update({ user_id: data.user.id })
              .eq("id", patientData.id);

            if (updateError) {
              console.error("Error linking patient:", updateError);
              throw new Error("Failed to link your account. Please contact support.");
            }

            toast({
              title: "Account created and linked!",
              description: "You can now log in and view your appointments.",
            });
          } else {
            toast({
              title: "Account created!",
              description: "Your phone number is not yet registered in our system. Please contact the clinic.",
              variant: "destructive",
            });
          }
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          phone: patientPhone,
          password: patientPassword,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "Successfully logged in.",
        });
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Healthcare Portal</CardTitle>
          <CardDescription>
            {isSignup ? "Create your account" : "Sign in to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="staff" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="staff">Staff</TabsTrigger>
              <TabsTrigger value="patient">Patient</TabsTrigger>
            </TabsList>
            
            <TabsContent value="staff">
              <form onSubmit={handleStaffAuth} className="space-y-4">
                {isSignup && (
                  <div className="space-y-2">
                    <Label htmlFor="staff-name">Full Name</Label>
                    <Input
                      id="staff-name"
                      placeholder="John Doe"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                      maxLength={100}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="staff-email">Email</Label>
                  <Input
                    id="staff-email"
                    type="email"
                    placeholder="staff@hospital.com"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    required
                    maxLength={255}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-password">Password</Label>
                  <Input
                    id="staff-password"
                    type="password"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    required
                    minLength={6}
                    maxLength={100}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Please wait..." : isSignup ? "Sign Up" : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="patient">
              <form onSubmit={handlePatientAuth} className="space-y-4">
                {isSignup && (
                  <div className="space-y-2">
                    <Label htmlFor="patient-name">Full Name</Label>
                    <Input
                      id="patient-name"
                      placeholder="Jane Smith"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                      maxLength={100}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="patient-phone">Phone Number</Label>
                  <Input
                    id="patient-phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    required
                    maxLength={20}
                  />
                  <p className="text-xs text-muted-foreground">
                    Include country code (e.g., +1 for US)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patient-password">Password</Label>
                  <Input
                    id="patient-password"
                    type="password"
                    value={patientPassword}
                    onChange={(e) => setPatientPassword(e.target.value)}
                    required
                    minLength={6}
                    maxLength={100}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Please wait..." : isSignup ? "Sign Up" : "Sign In"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => setIsSignup(!isSignup)}
              className="text-primary hover:underline"
            >
              {isSignup ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
