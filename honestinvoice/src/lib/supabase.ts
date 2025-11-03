import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://hqlefdadfjdxxzzbtjqk.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxbGVmZGFkZmpkeHh6emJ0anFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4Nzc3NjcsImV4cCI6MjA3NzQ1Mzc2N30.9Z44pQcCyHUbMQLgZCFgVon4r1hv1FKoy_yNAdAMEfk";

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
