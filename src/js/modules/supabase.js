// src/js/modules/supabase.js
const SUPABASE_URL = 'https://ezmvckvhqthlpwmsrhcm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6bXZja3ZocXRobHB3bXNyaGNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTUxNTksImV4cCI6MjA2NjQzMTE1OX0.Ht2-uVVRoe-ccCtlVr5iKqhcdVy7EJev0uUlcxiddrY';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Error: Las variables de Supabase no están configuradas.");
}

const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;