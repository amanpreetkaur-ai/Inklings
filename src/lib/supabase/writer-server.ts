
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createWriterServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_WRITER_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_WRITER_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Cookie updates may be unavailable in Server Components.
          }
        },
      },
    }
  );
}
