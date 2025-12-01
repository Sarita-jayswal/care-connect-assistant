import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

const ActivateAccount = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [valid, setValid] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setValid(false);
      setLoading(false);
      return;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const url = new URL(`${supabaseUrl}/functions/v1/patient-invitation`);
      url.searchParams.set('action', 'validate');
      url.searchParams.set('token', token);

      const response = await fetch(url.toString());

      const result = await response.json();

      if (result.valid && result.patient) {
        setValid(true);
        setPatientName(`${result.patient.first_name} ${result.patient.last_name}`);
      } else {
        setValid(false);
        toast({
          title: "Invalid Invitation",
          description: result.error || "This invitation link is invalid or has expired.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error validating token:', error);
      setValid(false);
      toast({
        title: "Error",
        description: "Failed to validate invitation link",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    setValidating(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const url = new URL(`${supabaseUrl}/functions/v1/patient-invitation`);
      url.searchParams.set('action', 'activate');

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to activate account');
      }

      toast({
        title: "Account Activated!",
        description: "Your account has been created. You can now log in.",
      });

      // Redirect to auth page after a short delay
      setTimeout(() => {
        navigate('/auth');
      }, 2000);

    } catch (error: any) {
      console.error('Error activating account:', error);
      toast({
        title: "Activation Failed",
        description: error.message || "Failed to activate your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Validating invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid or has expired. Please contact your healthcare provider for a new invitation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => navigate('/auth')}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Activate Your Account</CardTitle>
          <CardDescription>
            Welcome, {patientName}! Set a password to activate your patient portal account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleActivate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                minLength={8}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={validating}
            >
              {validating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Activating...
                </>
              ) : (
                "Activate Account"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivateAccount;
