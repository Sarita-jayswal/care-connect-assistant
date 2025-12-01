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
import { AlertCircle, CheckCircle2 } from "lucide-react";

const emailSchema = z.string().trim().min(1, "Email is required").email("Invalid email address").max(255, "Email is too long");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(100, "Password is too long");
const phoneSchema = z.string().trim().min(1, "Phone number is required").regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone format (e.g., +1234567890)").max(20, "Phone number is too long");
const nameSchema = z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long");

interface FieldError {
  message: string;
  isValid: boolean;
}

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Staff login
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffEmailError, setStaffEmailError] = useState<FieldError | null>(null);
  const [staffPasswordError, setStaffPasswordError] = useState<FieldError | null>(null);
  
  // Patient login
  const [patientPhone, setPatientPhone] = useState("");
  const [patientPassword, setPatientPassword] = useState("");
  const [patientPhoneError, setPatientPhoneError] = useState<FieldError | null>(null);
  const [patientPasswordError, setPatientPasswordError] = useState<FieldError | null>(null);
  
  // Signup states
  const [isSignup, setIsSignup] = useState(false);
  const [signupName, setSignupName] = useState("");
  const [signupNameError, setSignupNameError] = useState<FieldError | null>(null);

  // Validation functions
  const validateEmail = (value: string): FieldError | null => {
    if (!value.trim()) return null; // Don't show error for empty field until blur
    const result = emailSchema.safeParse(value);
    if (!result.success) {
      return { message: result.error.issues[0].message, isValid: false };
    }
    return { message: "", isValid: true };
  };

  const validatePassword = (value: string): FieldError | null => {
    if (!value) return null;
    const result = passwordSchema.safeParse(value);
    if (!result.success) {
      return { message: result.error.issues[0].message, isValid: false };
    }
    return { message: "", isValid: true };
  };

  const validatePhone = (value: string): FieldError | null => {
    if (!value.trim()) return null;
    const result = phoneSchema.safeParse(value);
    if (!result.success) {
      return { message: result.error.issues[0].message, isValid: false };
    }
    return { message: "", isValid: true };
  };

  const validateName = (value: string): FieldError | null => {
    if (!value.trim()) return null;
    const result = nameSchema.safeParse(value);
    if (!result.success) {
      return { message: result.error.issues[0].message, isValid: false };
    }
    return { message: "", isValid: true };
  };

  const handleStaffEmailChange = (value: string) => {
    setStaffEmail(value);
    setStaffEmailError(validateEmail(value));
  };

  const handleStaffPasswordChange = (value: string) => {
    setStaffPassword(value);
    setStaffPasswordError(validatePassword(value));
  };

  const handlePatientPhoneChange = (value: string) => {
    setPatientPhone(value);
    setPatientPhoneError(validatePhone(value));
  };

  const handlePatientPasswordChange = (value: string) => {
    setPatientPassword(value);
    setPatientPasswordError(validatePassword(value));
  };

  const handleSignupNameChange = (value: string) => {
    setSignupName(value);
    setSignupNameError(validateName(value));
  };

  const handleStaffAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const emailValidation = validateEmail(staffEmail);
    const passwordValidation = validatePassword(staffPassword);
    const nameValidation = isSignup ? validateName(signupName) : null;

    setStaffEmailError(emailValidation);
    setStaffPasswordError(passwordValidation);
    if (isSignup) setSignupNameError(nameValidation);

    // Check for validation errors
    if (!emailValidation?.isValid || !passwordValidation?.isValid || (isSignup && !nameValidation?.isValid)) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Final validation with zod
      emailSchema.parse(staffEmail);
      passwordSchema.parse(staffPassword);
      if (isSignup) {
        nameSchema.parse(signupName);
      }

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
          const { error: insertError } = await supabase.from("users").insert({
            user_id: data.user.id,
            email: staffEmail,
            full_name: signupName,
            role: "COORDINATOR",
          });

          if (insertError) {
            console.error("Error creating user record:", insertError);
          }

          toast({
            title: "Account created!",
            description: "Please check your email to verify your account.",
          });
          
          // Clear form
          setStaffEmail("");
          setStaffPassword("");
          setSignupName("");
          setIsSignup(false);
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
      console.error("Auth error:", error);
      toast({
        title: "Error",
        description: error.message || "Authentication failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePatientAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const phoneValidation = validatePhone(patientPhone);
    const passwordValidation = validatePassword(patientPassword);
    const nameValidation = isSignup ? validateName(signupName) : null;

    setPatientPhoneError(phoneValidation);
    setPatientPasswordError(passwordValidation);
    if (isSignup) setSignupNameError(nameValidation);

    // Check for validation errors
    if (!phoneValidation?.isValid || !passwordValidation?.isValid || (isSignup && !nameValidation?.isValid)) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Final validation with zod
      phoneSchema.parse(patientPhone);
      passwordSchema.parse(patientPassword);
      if (isSignup) {
        nameSchema.parse(signupName);
      }

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
            
            // Clear form
            setPatientPhone("");
            setPatientPassword("");
            setSignupName("");
            setIsSignup(false);
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
      console.error("Patient auth error:", error);
      toast({
        title: "Error",
        description: error.message || "Authentication failed. Please try again.",
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
                    <div className="relative">
                      <Input
                        id="staff-name"
                        placeholder="John Doe"
                        value={signupName}
                        onChange={(e) => handleSignupNameChange(e.target.value)}
                        onBlur={(e) => setSignupNameError(validateName(e.target.value) || { message: "Name is required", isValid: false })}
                        className={
                          signupNameError
                            ? signupNameError.isValid
                              ? "border-green-500 pr-10"
                              : "border-destructive pr-10"
                            : ""
                        }
                        required
                        maxLength={100}
                      />
                      {signupNameError?.isValid && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                    </div>
                    {signupNameError && !signupNameError.isValid && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {signupNameError.message}
                      </p>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="staff-email">Email</Label>
                  <div className="relative">
                    <Input
                      id="staff-email"
                      type="email"
                      placeholder="staff@hospital.com"
                      value={staffEmail}
                      onChange={(e) => handleStaffEmailChange(e.target.value)}
                      onBlur={(e) => setStaffEmailError(validateEmail(e.target.value) || { message: "Email is required", isValid: false })}
                      className={
                        staffEmailError
                          ? staffEmailError.isValid
                            ? "border-green-500 pr-10"
                            : "border-destructive pr-10"
                          : ""
                      }
                      required
                      maxLength={255}
                    />
                    {staffEmailError?.isValid && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  {staffEmailError && !staffEmailError.isValid && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {staffEmailError.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="staff-password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={staffPassword}
                      onChange={(e) => handleStaffPasswordChange(e.target.value)}
                      onBlur={(e) => setStaffPasswordError(validatePassword(e.target.value) || { message: "Password is required", isValid: false })}
                      className={
                        staffPasswordError
                          ? staffPasswordError.isValid
                            ? "border-green-500 pr-10"
                            : "border-destructive pr-10"
                          : ""
                      }
                      required
                      minLength={6}
                      maxLength={100}
                    />
                    {staffPasswordError?.isValid && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  {staffPasswordError && !staffPasswordError.isValid && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {staffPasswordError.message}
                    </p>
                  )}
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
                    <div className="relative">
                      <Input
                        id="patient-name"
                        placeholder="Jane Smith"
                        value={signupName}
                        onChange={(e) => handleSignupNameChange(e.target.value)}
                        onBlur={(e) => setSignupNameError(validateName(e.target.value) || { message: "Name is required", isValid: false })}
                        className={
                          signupNameError
                            ? signupNameError.isValid
                              ? "border-green-500 pr-10"
                              : "border-destructive pr-10"
                            : ""
                        }
                        required
                        maxLength={100}
                      />
                      {signupNameError?.isValid && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                    </div>
                    {signupNameError && !signupNameError.isValid && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {signupNameError.message}
                      </p>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="patient-phone">Phone Number</Label>
                  <div className="relative">
                    <Input
                      id="patient-phone"
                      type="tel"
                      placeholder="+1234567890"
                      value={patientPhone}
                      onChange={(e) => handlePatientPhoneChange(e.target.value)}
                      onBlur={(e) => setPatientPhoneError(validatePhone(e.target.value) || { message: "Phone number is required", isValid: false })}
                      className={
                        patientPhoneError
                          ? patientPhoneError.isValid
                            ? "border-green-500 pr-10"
                            : "border-destructive pr-10"
                          : ""
                      }
                      required
                      maxLength={20}
                    />
                    {patientPhoneError?.isValid && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  {patientPhoneError && !patientPhoneError.isValid && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {patientPhoneError.message}
                    </p>
                  )}
                  {!patientPhoneError && (
                    <p className="text-xs text-muted-foreground">
                      Include country code (e.g., +1 for US)
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patient-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="patient-password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={patientPassword}
                      onChange={(e) => handlePatientPasswordChange(e.target.value)}
                      onBlur={(e) => setPatientPasswordError(validatePassword(e.target.value) || { message: "Password is required", isValid: false })}
                      className={
                        patientPasswordError
                          ? patientPasswordError.isValid
                            ? "border-green-500 pr-10"
                            : "border-destructive pr-10"
                          : ""
                      }
                      required
                      minLength={6}
                      maxLength={100}
                    />
                    {patientPasswordError?.isValid && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  {patientPasswordError && !patientPasswordError.isValid && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {patientPasswordError.message}
                    </p>
                  )}
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
