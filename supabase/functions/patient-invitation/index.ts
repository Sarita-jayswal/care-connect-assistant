import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreatePatientRequest {
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth?: string;
  external_id?: string;
}

interface ActivateAccountRequest {
  token: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Create patient and generate invitation
    if (action === 'create') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const body: CreatePatientRequest = await req.json();
      
      // Validate required fields
      if (!body.first_name || !body.last_name || !body.phone) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Validate Australian phone format
      const phoneRegex = /^\+61[2-478]\d{8}$/;
      if (!phoneRegex.test(body.phone)) {
        return new Response(JSON.stringify({ 
          error: 'Invalid phone format. Must be Australian format: +61[2-478]XXXXXXXX' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if patient with this phone already exists
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('phone', body.phone)
        .maybeSingle();

      if (existingPatient) {
        return new Response(JSON.stringify({ 
          error: 'Patient with this phone number already exists' 
        }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create patient record
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert({
          first_name: body.first_name,
          last_name: body.last_name,
          phone: body.phone,
          date_of_birth: body.date_of_birth,
          external_id: body.external_id,
        })
        .select()
        .single();

      if (patientError || !patient) {
        console.error('Error creating patient:', patientError);
        return new Response(JSON.stringify({ error: 'Failed to create patient' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Generate secure invitation token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      // Store invitation token
      const { error: invitationError } = await supabase
        .from('patient_invitations')
        .insert({
          patient_id: patient.id,
          token,
          expires_at: expiresAt.toISOString(),
        });

      if (invitationError) {
        console.error('Error creating invitation:', invitationError);
        return new Response(JSON.stringify({ error: 'Failed to create invitation' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Generate activation link
      const activationUrl = `${url.origin}/activate?token=${token}`;

      // Trigger n8n workflow to send SMS invitation (background task)
      const n8nWebhookUrl = Deno.env.get('N8N_PATIENT_INVITATION_WEBHOOK_URL');
      if (n8nWebhookUrl) {
        fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: patient.phone,
            first_name: patient.first_name,
            last_name: patient.last_name,
            activation_url: activationUrl,
          }),
        }).catch(err => {
          console.error('Failed to trigger n8n SMS workflow:', err);
        });
      } else {
        console.warn('N8N_PATIENT_INVITATION_WEBHOOK_URL not configured');
      }

      console.log('Patient created successfully:', {
        patientId: patient.id,
        phone: patient.phone,
        activationUrl,
      });

      return new Response(JSON.stringify({
        success: true,
        patient,
        invitation: {
          token,
          expires_at: expiresAt.toISOString(),
          activation_url: activationUrl,
        },
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate invitation token
    if (action === 'validate') {
      const token = url.searchParams.get('token');
      if (!token) {
        return new Response(JSON.stringify({ error: 'Token required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: invitation, error: invError } = await supabase
        .from('patient_invitations')
        .select('*, patients(*)')
        .eq('token', token)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (invError || !invitation) {
        return new Response(JSON.stringify({ 
          valid: false, 
          error: 'Invalid or expired token' 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        valid: true,
        patient: invitation.patients,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Activate account with password
    if (action === 'activate') {
      const body: ActivateAccountRequest = await req.json();
      
      if (!body.token || !body.password) {
        return new Response(JSON.stringify({ error: 'Token and password required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Validate password strength
      if (body.password.length < 8) {
        return new Response(JSON.stringify({ 
          error: 'Password must be at least 8 characters' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get invitation
      const { data: invitation, error: invError } = await supabase
        .from('patient_invitations')
        .select('*, patients(*)')
        .eq('token', body.token)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (invError || !invitation) {
        return new Response(JSON.stringify({ 
          error: 'Invalid or expired invitation' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const patient = invitation.patients;

      // Create auth user with phone
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        phone: patient.phone,
        password: body.password,
        phone_confirm: true,
        user_metadata: {
          role: 'patient',
        },
      });

      if (authError || !authData.user) {
        console.error('Error creating auth user:', authError);
        return new Response(JSON.stringify({ 
          error: 'Failed to create account. Phone may already be in use.' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'patient',
        });

      if (roleError) {
        console.error('Error creating user role:', roleError);
      }

      // Link patient to auth user
      const { error: linkError } = await supabase
        .from('patients')
        .update({ user_id: authData.user.id })
        .eq('id', patient.id);

      if (linkError) {
        console.error('Error linking patient:', linkError);
      }

      // Mark invitation as used
      await supabase
        .from('patient_invitations')
        .update({ used_at: new Date().toISOString() })
        .eq('token', body.token);

      console.log('Account activated successfully:', {
        userId: authData.user.id,
        patientId: patient.id,
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Account activated successfully',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in patient-invitation function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
