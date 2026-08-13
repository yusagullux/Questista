import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Browser client — used in client components for auth + data mutations. */
export function createClient() {
  return createBrowserClient(url, anon);
}