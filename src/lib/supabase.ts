import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://drehzkgdmgumfpeowiyd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyZWh6a2dkbWd1bWZwZW93aXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMzMzNzcsImV4cCI6MjA3ODYwOTM3N30.WiHxpTFlnKNTM2M9M92AhmuNVnLdxoJjfpPb7jtArmE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
