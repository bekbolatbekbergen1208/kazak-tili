import "server-only";
import { createClient } from "@supabase/supabase-js";
// Never import this helper from a Client Component. Authorization remains in the API.
export function createProgressWriter() {
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
