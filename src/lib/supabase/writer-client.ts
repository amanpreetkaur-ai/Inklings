
import { createBrowserClient } from "@supabase/ssr";

export function createWriterClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_WRITER_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_WRITER_SUPABASE_PUBLISHABLE_KEY!
  );
}
