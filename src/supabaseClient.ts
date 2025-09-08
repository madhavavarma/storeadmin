import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = "https://zpcxosoceehgxajftdou.supabase.co";
export const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwY3hvc29jZWVoZ3hhamZ0ZG91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5ODg2NDAsImV4cCI6MjA3MjU2NDY0MH0.vi1Hu3ha8pgTDOAxaXszys_uuaXyRTOSr1wCkBUfrgw"

export const supabase = createClient(supabaseUrl, supabaseAnonKey);