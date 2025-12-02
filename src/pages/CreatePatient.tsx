import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PatientForm {
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
  external_id: string;
}

const CreatePatient = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<PatientForm>({
    first_name: "",
    last_name: "",
    phone: "+61",
    date_of_birth: "",
    external_id: "",
  });

  const handleInputChange = (field: keyof PatientForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!form.first_name || !form.last_name || !form.phone || !form.date_of_birth || !form.external_id) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Validate phone format
      const phoneRegex = /^\+61[2-478]\d{8}$/;
      if (!phoneRegex.test(form.phone)) {
        toast({
          title: "Invalid Phone Number",
          description: "Phone must be in Australian format: +61[2-478]XXXXXXXX",
          variant: "destructive",
        });
        return;
      }

      // Create patient directly in Supabase
      const { data, error } = await supabase
        .from("patients")
        .insert([
          {
            first_name: form.first_name,
            last_name: form.last_name,
            phone: form.phone,
            date_of_birth: form.date_of_birth,
            external_id: form.external_id,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating patient:', error);
        throw error;
      }

      toast({
        title: "Patient Created",
        description: `${form.first_name} ${form.last_name} has been registered successfully.`,
      });

      // Navigate back to patients list
      setTimeout(() => {
        navigate('/patients');
      }, 1000);

    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create patient",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Patient</h1>
        <p className="text-muted-foreground">Add a new patient to the system</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Patient Information
          </CardTitle>
          <CardDescription>
            Enter the patient's details. They will receive appointment reminders via SMS.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreatePatient} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={form.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={form.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  placeholder="Smith"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+61412345678"
                required
              />
              <p className="text-xs text-muted-foreground">
                Australian format: +61[2-478]XXXXXXXX
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth *</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={form.date_of_birth}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="external_id">External ID *</Label>
              <Input
                id="external_id"
                value={form.external_id}
                onChange={(e) => handleInputChange('external_id', e.target.value)}
                placeholder="e.g., Medical record number"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Patient
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/patients')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePatient;
