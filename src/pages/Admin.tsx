import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Shield, UserCog, Trash2, Edit, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { format } from "date-fns";

const emailSchema = z.string().trim().min(1, "Email is required").email("Invalid email address").max(255, "Email is too long");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(100, "Password is too long");
const nameSchema = z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long");

interface FieldError {
  message: string;
  isValid: boolean;
}

interface StaffAccount {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

const Admin = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  
  const [emailError, setEmailError] = useState<FieldError | null>(null);
  const [passwordError, setPasswordError] = useState<FieldError | null>(null);
  const [nameError, setNameError] = useState<FieldError | null>(null);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffAccount | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editNameError, setEditNameError] = useState<FieldError | null>(null);
  const [editEmailError, setEditEmailError] = useState<FieldError | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState<StaffAccount | null>(null);

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

  const fetchStaffAccounts = async () => {
    setLoadingStaff(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "COORDINATOR")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStaffAccounts(data || []);
    } catch (error: any) {
      console.error("Error fetching staff accounts:", error);
      toast({
        title: "Error",
        description: "Failed to load staff accounts",
        variant: "destructive",
      });
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    fetchStaffAccounts();
  }, []);

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

        // Role is automatically assigned by database trigger, no need to insert manually

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
        
        // Close dialog and refresh staff list
        setCreateDialogOpen(false);
        fetchStaffAccounts();
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

  const handleEditStaff = (staff: StaffAccount) => {
    setEditingStaff(staff);
    setEditFullName(staff.full_name || "");
    setEditEmail(staff.email);
    setEditNameError(null);
    setEditEmailError(null);
    setEditDialogOpen(true);
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff) return;

    const nameValidation = validateName(editFullName);
    const emailValidation = validateEmail(editEmail);

    setEditNameError(nameValidation);
    setEditEmailError(emailValidation);

    if (!nameValidation?.isValid || !emailValidation?.isValid) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          full_name: editFullName,
          email: editEmail,
        })
        .eq("id", editingStaff.id);

      if (error) throw error;

      toast({
        title: "Staff Updated",
        description: "Staff account has been updated successfully",
      });

      setEditDialogOpen(false);
      fetchStaffAccounts();
    } catch (error: any) {
      console.error("Update staff error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update staff account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = (staff: StaffAccount) => {
    setDeletingStaff(staff);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteStaff = async () => {
    if (!deletingStaff) return;

    setLoading(true);
    try {
      // Delete from user_roles first
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", deletingStaff.user_id);

      if (roleError) throw roleError;

      // Delete from users table
      const { error: userError } = await supabase
        .from("users")
        .delete()
        .eq("id", deletingStaff.id);

      if (userError) throw userError;

      toast({
        title: "Staff Deleted",
        description: `${deletingStaff.full_name || deletingStaff.email} has been removed`,
      });

      setDeleteDialogOpen(false);
      fetchStaffAccounts();
    } catch (error: any) {
      console.error("Delete staff error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete staff account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-primary/10">
              <Shield className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Create and manage staff accounts. Staff members can log in separately to access patient data and manage appointments.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="medical-card hover:shadow-strong transition-all cursor-pointer group" onClick={() => setCreateDialogOpen(true)}>
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-3">
                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <UserCog className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-xl">Create Staff Account</CardTitle>
              <CardDescription>
                Add a new staff member with login credentials
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="medical-card hover:shadow-strong transition-all cursor-pointer group" onClick={() => setSheetOpen(true)}>
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-3">
                <div className="p-3 rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <Users className="h-8 w-8 text-accent" />
                </div>
              </div>
              <CardTitle className="text-xl">Manage Staff Accounts</CardTitle>
              <CardDescription>
                View, edit, or remove existing staff members ({staffAccounts.length})
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Create Staff Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Create Staff Account
            </DialogTitle>
            <DialogDescription>
              Add a new staff member with email and password credentials
            </DialogDescription>
          </DialogHeader>
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="medical-gradient"
                disabled={loading || !emailError?.isValid || !passwordError?.isValid || !nameError?.isValid}
              >
                {loading ? "Creating..." : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Staff Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Manage Staff Accounts
              </SheetTitle>
              <SheetDescription>
                View, edit, or remove existing staff accounts
              </SheetDescription>
            </SheetHeader>
            
            <div className="mt-6">
              {loadingStaff ? (
                <div className="text-center py-8 text-muted-foreground">Loading staff accounts...</div>
              ) : staffAccounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No staff accounts found</div>
              ) : (
                <div className="space-y-4">
                  {staffAccounts.map((staff) => (
                    <Card key={staff.id} className="p-4">
                      <div className="space-y-3">
                        <div>
                          <div className="font-semibold text-lg">{staff.full_name || "—"}</div>
                          <div className="text-sm text-muted-foreground">{staff.email}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Created: {format(new Date(staff.created_at), "MMM d, yyyy")}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditStaff(staff)}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteStaff(staff)}
                            className="flex-1 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

      {/* Edit Staff Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Account</DialogTitle>
            <DialogDescription>Update staff member information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editFullName}
                onChange={(e) => {
                  setEditFullName(e.target.value);
                  setEditNameError(validateName(e.target.value));
                }}
                className={editNameError && !editNameError.isValid ? "border-destructive" : ""}
              />
              {editNameError && !editNameError.isValid && (
                <div className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{editNameError.message}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => {
                  setEditEmail(e.target.value);
                  setEditEmailError(validateEmail(e.target.value));
                }}
                className={editEmailError && !editEmailError.isValid ? "border-destructive" : ""}
              />
              {editEmailError && !editEmailError.isValid && (
                <div className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{editEmailError.message}</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStaff}
              disabled={loading || !editNameError?.isValid || !editEmailError?.isValid}
            >
              {loading ? "Updating..." : "Update Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Staff Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingStaff?.full_name || deletingStaff?.email}? 
              This action cannot be undone and will remove their access to the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteStaff}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Deleting..." : "Delete Staff"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
