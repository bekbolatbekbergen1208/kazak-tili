import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createProgressWriter() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const createAdminClient = createProgressWriter;

export function isDosshaTeacher(user: {
  email?: string | null;
  app_metadata?: Record<string, unknown>;
}) {
  if (
    user.app_metadata?.role === "teacher" ||
    user.app_metadata?.role === "admin"
  )
    return true;
  const allowed = (process.env.QAZAQDOS_TEACHER_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return !!user.email && allowed.includes(user.email.toLowerCase());
}
