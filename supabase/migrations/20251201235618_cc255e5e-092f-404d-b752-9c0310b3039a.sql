-- Schedule notification check to run every 10 minutes
SELECT cron.schedule(
  'check-for-notifications',
  '*/10 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://drehzkgdmgumfpeowiyd.supabase.co/functions/v1/create-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyZWh6a2dkbWd1bWZwZW93aXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMzMzNzcsImV4cCI6MjA3ODYwOTM3N30.WiHxpTFlnKNTM2M9M92AhmuNVnLdxoJjfpPb7jtArmE"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);