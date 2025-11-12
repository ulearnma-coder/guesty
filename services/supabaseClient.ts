import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cmphnonglckzohptmdvv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtcGhub25nbGNrem9ocHRtZHZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTA1NDAsImV4cCI6MjA3ODUyNjU0MH0.wyLK9Zka13DXPsQJK2rRfgClfm6ZM9DFuACZWNEk48k';

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and anon key are required.");
}

/**
 * Initializes and exports the Supabase client instance.
 * This client is used across the application to interact with the Supabase backend.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
