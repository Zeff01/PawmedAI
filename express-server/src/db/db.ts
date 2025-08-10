import dotenv from "dotenv";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Supabase URL is missing in the environment variables.");
}

if (!supabaseKey) {
  throw new Error("Supabase KEY is missing in the environment variables.");
}

if (!supabaseServiceRoleKey) {
  throw new Error(
    "Supabase SERVICE ROLE KEY is missing in the environment variables."
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey); //Public access
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceRoleKey
); //Admin access that bypass securities of public access
