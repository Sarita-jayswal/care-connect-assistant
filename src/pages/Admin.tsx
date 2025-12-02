import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Shield } from "lucide-react";

const emailSchema = z.string().trim().min(1, "Email is required").email("Invalid email address").max(255, "Email is too long");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(100, "Password is too long");
const nameSchema = z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long");

interface FieldError {
  message: string;
  isValid: boolean;
}

const Admin = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  
  const [emailError, setEmailError] = useState<FieldError | null>(null);
  const [passwordError, setPasswordError] = useState<FieldError | null>(null);
  const [nameError, setNameError] = useState<FieldError | null>(null);

  const validateEmail = (value: string): FieldError | null => {
    if (!value.trim()) return null;
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

  const validateName = (value: string): FieldError | null => {
    if (!value.trim()) return null;
    const result = nameSchema.safeParse(value);
    if (!result.success) {
      return { message: result.error.issues[0].message, isValid: false };
    }
    return { message: "", isValid: true };
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordError(validatePassword(value));
  };

  const handleNameChange = (value: string) => {
    setFullName(value);
    setNameError(validateName(value));
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    const nameValidation = validateName(fullName);

    setEmailError(emailValidation);
    setPasswordError(passwordValidation);
    setNameError(nameValidation);

    if (!emailValidation?.isValid || !passwordValidation?.isValid || !nameValidation?.isValid) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create the auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            role: "staff",
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create entry in users table
        const { error: insertError } = await supabase.from("users").insert({
          user_id: data.user.id,
          email: email,
          full_name: fullName,
          role: "COORDINATOR",
        });

        if (insertError) {
          console.error("Error creating user record:", insertError);
          throw new Error("Failed to create user record");
        }

        // Create staff role entry
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: data.user.id,
          role: "staff",
        });

        if (roleError) {
          console.error("Error creating user role:", roleError);
          throw new Error("Failed to assign role");
        }

        toast({
          title: "Staff Account Created",
          description: `${fullName} can now log in with email: ${email}`,
        });

        // Clear form
        setEmail("");
        setPassword("");
        setFullName("");
        setEmailError(null);
        setPasswordError(null);
        setNameError(null);
      }
    } catch (error: any) {
      console.error("Create staff error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create staff account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Admin Panel
        </h1>
      </div>

      <Card className="medical-card max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Create Staff Account
          </CardTitle>
          <CardDescription>
            Create a new staff account with login credentials. Staff can access all patient data and manage appointments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateStaff} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input
                id="full-name"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => handleNameChange(e.target.value)}
                onBlur={() => setNameError(validateName(fullName))}
                disabled={loading}
                className={nameError && !nameError.isValid ? "border-destructive" : ""}
              />
              {nameError && !nameError.isValid && (
                <div className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{nameError.message}</span>
                </div>
              )}
              {nameError && nameError.isValid && (
                <div className="flex items-center gap-1 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-green-500">Valid name</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="staff@carefollow.com"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={() => setEmailError(validateEmail(email))}
                disabled={loading}
                className={emailError && !emailError.isValid ? "border-destructive" : ""}
              />
              {emailError && !emailError.isValid && (
                <div className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{emailError.message}</span>
                </div>
              )}
              {emailError && emailError.isValid && (
                <div className="flex items-center gap-1 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-green-500">Valid email</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  onBlur={() => setPasswordError(validatePassword(password))}
                  disabled={loading}
                  className={passwordError && !passwordError.isValid ? "border-destructive pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && !passwordError.isValid && (
                <div className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{passwordError.message}</span>
                </div>
              )}
              {passwordError && passwordError.isValid && (
                <div className="flex items-center gap-1 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-green-500">Strong password</span>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full medical-gradient"
              disabled={loading || !emailError?.isValid || !passwordError?.isValid || !nameError?.isValid}
            >
              {loading ? "Creating Account..." : "Create Staff Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
