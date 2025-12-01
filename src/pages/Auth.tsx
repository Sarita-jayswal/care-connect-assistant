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
const phoneSchema = z.string().trim().min(1, "Phone number is required").regex(/^\+61[2-478]\d{8}$/, "Invalid Australian phone number (e.g., +61412345678)").max(20, "Phone number is too long");
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
  
  // OTP verification states
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [pendingPhone, setPendingPhone] = useState<string>("");
  const [pendingPassword, setPendingPassword] = useState<string>("");

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
        // Step 1: Send OTP to phone number
        const { error: otpError } = await supabase.auth.signInWithOtp({
          phone: patientPhone,
          options: {
            channel: 'sms',
          },
        });

        if (otpError) {
          console.error("OTP error:", otpError);
          throw new Error("Failed to send verification code. Please check your phone number.");
        }

        // Store pending data for after OTP verification
        setPendingPhone(patientPhone);
        setPendingPassword(patientPassword);
        setShowOtpInput(true);
        
        toast({
          title: "Verification Code Sent",
          description: `We've sent a 6-digit code to ${patientPhone}. Please enter it below.`,
        });
      } else {
        // Login flow
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

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    if (otpCode.length !== 6) {
      setOtpError("Please enter a 6-digit code");
      return;
    }

    setLoading(true);

    try {
      // Step 2: Verify OTP
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        phone: pendingPhone,
        token: otpCode,
        type: 'sms',
      });

      if (verifyError) {
        console.error("OTP verification error:", verifyError);
        throw new Error("Invalid verification code. Please try again.");
      }

      if (!verifyData.user) {
        throw new Error("Verification failed. Please try again.");
      }

      // Step 3: Set password for the verified account
      const { error: updateError } = await supabase.auth.updateUser({
        password: pendingPassword,
        data: {
          role: "patient",
          full_name: signupName,
        },
      });

      if (updateError) {
        console.error("Password update error:", updateError);
        throw new Error("Failed to set password. Please try again.");
      }

      // Step 4: Find and link patient record
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("id")
        .eq("phone", pendingPhone)
        .maybeSingle();

      if (patientError) {
        console.error("Error finding patient:", patientError);
      }

      if (patientData) {
        // Link patient to auth user
        const { error: linkError } = await supabase
          .from("patients")
          .update({ user_id: verifyData.user.id })
          .eq("id", patientData.id);

        if (linkError) {
          console.error("Error linking patient:", linkError);
          toast({
            title: "Account Created",
            description: "Your account is verified, but couldn't link to patient records. Please contact support.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success!",
            description: "Your account is verified and ready to use. You can now log in.",
          });
        }
      } else {
        toast({
          title: "Account Verified",
          description: "Your phone is verified, but not registered in our system. Please contact the clinic.",
          variant: "destructive",
        });
      }

      // Reset form and show login
      setShowOtpInput(false);
      setOtpCode("");
      setPendingPhone("");
      setPendingPassword("");
      setPatientPhone("");
      setPatientPassword("");
      setSignupName("");
      setIsSignup(false);

    } catch (error: any) {
      console.error("OTP verification error:", error);
      setOtpError(error.message || "Verification failed. Please try again.");
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: pendingPhone,
        options: {
          channel: 'sms',
        },
      });

      if (error) throw error;

      toast({
        title: "Code Resent",
        description: "A new verification code has been sent to your phone.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to resend code. Please try again.",
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
              {showOtpInput ? (
                // OTP Verification Form
                <form onSubmit={handleOtpVerification} className="space-y-4">
                  <div className="text-center space-y-2 mb-4">
                    <h3 className="font-semibold">Verify Your Phone</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter the 6-digit code sent to {pendingPhone}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="otp-code">Verification Code</Label>
                    <Input
                      id="otp-code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtpCode(value);
                        setOtpError(null);
                      }}
                      className={otpError ? "border-destructive" : ""}
                      maxLength={6}
                      required
                      autoFocus
                    />
                    {otpError && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {otpError}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={loading || otpCode.length !== 6}>
                      {loading ? "Verifying..." : "Verify & Create Account"}
                    </Button>
                  </div>

                  <div className="text-center space-y-2">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-sm text-primary hover:underline"
                    >
                      Resend code
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOtpInput(false);
                        setOtpCode("");
                        setPendingPhone("");
                        setPendingPassword("");
                      }}
                      className="block w-full text-sm text-muted-foreground hover:underline"
                    >
                      Change phone number
                    </button>
                  </div>
                </form>
              ) : (
                // Regular Patient Auth Form
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
                        placeholder="+61412345678"
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
                        {isSignup 
                          ? "You'll receive a verification code via SMS"
                          : "Australian mobile: +61 followed by 9 digits (e.g., +61412345678)"
                        }
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
                    {loading ? "Please wait..." : isSignup ? "Send Verification Code" : "Sign In"}
                  </Button>
                </form>
              )}
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
