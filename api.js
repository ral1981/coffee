import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

export const supabaseUrl = 'https://vrasvqmlpdqogghtkqfu.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyYXN2cW1scGRxb2dnaHRrcWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNTQ5ODgsImV4cCI6MjA2NTkzMDk4OH0.K5wuITvCrQdCvfsRRpWZnFtZ3cvHLAdXhudBxiP9hAc'; // Keep secret keys safe in prod

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// If needed, export API_BASE only if you're still using custom endpoints
//export const API_BASE = 'https://your-supabase-url.supabase.co/rest/v1/coffee_beans';
export const API_BASE = 'http://localhost:3000/api/coffee-beans';