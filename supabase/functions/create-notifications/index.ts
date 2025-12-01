import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationData {
  user_id: string;
  title: string;
  message: string;
  type: 'urgent_task' | 'missed_appointment' | 'patient_message';
  related_id: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Checking for notification triggers...');

    const notifications: NotificationData[] = [];

    // Get all staff users
    const { data: staffUsers, error: staffError } = await supabaseClient
      .from('user_roles')
      .select('user_id')
      .eq('role', 'staff');

    if (staffError) {
      console.error('Error fetching staff users:', staffError);
      throw staffError;
    }

    if (!staffUsers || staffUsers.length === 0) {
      console.log('No staff users found');
      return new Response(
        JSON.stringify({ message: 'No staff users found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for urgent tasks (HIGH priority, OPEN status)
    const { data: urgentTasks, error: tasksError } = await supabaseClient
      .from('follow_up_tasks')
      .select(`
        id,
        type,
        priority,
        status,
        patient_id,
        patients!inner (
          first_name,
          last_name
        )
      `)
      .eq('priority', 'HIGH')
      .eq('status', 'OPEN')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString()); // Last hour

    if (tasksError) {
      console.error('Error fetching urgent tasks:', tasksError);
    } else if (urgentTasks && urgentTasks.length > 0) {
      console.log(`Found ${urgentTasks.length} urgent tasks`);
      
      for (const task of urgentTasks) {
        // Check if notification already exists
        const { data: existingNotif } = await supabaseClient
          .from('notifications')
          .select('id')
          .eq('related_id', task.id)
          .eq('type', 'urgent_task')
          .single();

        if (!existingNotif) {
          const patients = task.patients as unknown as { first_name: string; last_name: string }[];
          const patient = patients[0];
          
          for (const staff of staffUsers) {
            notifications.push({
              user_id: staff.user_id,
              title: '🚨 Urgent Task',
              message: `High priority ${task.type.replace('_', ' ')} for ${patient.first_name} ${patient.last_name}`,
              type: 'urgent_task',
              related_id: task.id,
            });
          }
        }
      }
    }

    // Check for missed appointments
    const { data: missedAppointments, error: appointmentsError } = await supabaseClient
      .from('appointments')
      .select(`
        id,
        scheduled_start,
        patient_id,
        patients!inner (
          first_name,
          last_name
        )
      `)
      .eq('status', 'MISSED')
      .gte('updated_at', new Date(Date.now() - 3600000).toISOString()); // Last hour

    if (appointmentsError) {
      console.error('Error fetching missed appointments:', appointmentsError);
    } else if (missedAppointments && missedAppointments.length > 0) {
      console.log(`Found ${missedAppointments.length} missed appointments`);
      
      for (const appointment of missedAppointments) {
        // Check if notification already exists
        const { data: existingNotif } = await supabaseClient
          .from('notifications')
          .select('id')
          .eq('related_id', appointment.id)
          .eq('type', 'missed_appointment')
          .single();

        if (!existingNotif) {
          const patients = appointment.patients as unknown as { first_name: string; last_name: string }[];
          const patient = patients[0];
          
          for (const staff of staffUsers) {
            notifications.push({
              user_id: staff.user_id,
              title: '📅 Missed Appointment',
              message: `${patient.first_name} ${patient.last_name} missed appointment`,
              type: 'missed_appointment',
              related_id: appointment.id,
            });
          }
        }
      }
    }

    // Check for new inbound patient messages
    const { data: newMessages, error: messagesError } = await supabaseClient
      .from('messages')
      .select(`
        id,
        body,
        created_at,
        patient_id,
        patients!inner (
          first_name,
          last_name
        )
      `)
      .eq('direction', 'INBOUND')
      .gte('created_at', new Date(Date.now() - 600000).toISOString()); // Last 10 minutes

    if (messagesError) {
      console.error('Error fetching new messages:', messagesError);
    } else if (newMessages && newMessages.length > 0) {
      console.log(`Found ${newMessages.length} new inbound messages`);
      
      for (const message of newMessages) {
        // Check if notification already exists
        const { data: existingNotif } = await supabaseClient
          .from('notifications')
          .select('id')
          .eq('related_id', message.id)
          .eq('type', 'patient_message')
          .single();

        if (!existingNotif) {
          const patients = message.patients as unknown as { first_name: string; last_name: string }[];
          const patient = patients[0];
          const preview = message.body.length > 50 
            ? message.body.substring(0, 50) + '...' 
            : message.body;
          
          for (const staff of staffUsers) {
            notifications.push({
              user_id: staff.user_id,
              title: '💬 New Patient Message',
              message: `${patient.first_name} ${patient.last_name}: ${preview}`,
              type: 'patient_message',
              related_id: message.id,
            });
          }
        }
      }
    }

    // Insert all notifications
    if (notifications.length > 0) {
      console.log(`Creating ${notifications.length} notifications`);
      
      const { error: insertError } = await supabaseClient
        .from('notifications')
        .insert(notifications);

      if (insertError) {
        console.error('Error inserting notifications:', insertError);
        throw insertError;
      }

      console.log('Notifications created successfully');
    } else {
      console.log('No new notifications to create');
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationsCreated: notifications.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-notifications function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
