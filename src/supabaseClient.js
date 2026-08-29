import { createClient } from "@supabase/supabase-js";

// Estas credenciales son seguras de tener en el código del frontend:
// la "anon key" está diseñada para ser pública, y lo que realmente
// protege los datos son las políticas de seguridad (RLS) que ya
// configuramos en Supabase.
const SUPABASE_URL = "https://kzpsyghgcctxznfzadpj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cHN5Z2hnY2N0eHpuZnphZHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3OTY0MzAsImV4cCI6MjEwMzM3MjQzMH0.eX3Uz_Errrwlc_JvHrtfianzI8phwWFJnRF2rcGwghU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
