import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "./env";

/**
 * Cliente Supabase com a service_role key — IGNORA RLS.
 * Use APENAS no servidor (server actions / route handlers).
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não definida. Adicione no .env e nas variáveis da Vercel."
    );
  }
  return createClient(getSupabaseUrl(), serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
