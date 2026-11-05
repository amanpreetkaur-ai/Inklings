
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const response = NextResponse.redirect(
    new URL("/writer/login?error=confirmation", origin)
  );

  if (!tokenHash || type !== "email") {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_WRITER_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_WRITER_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as EmailOtpType,
  });

  if (error) {
    return response;
  }

  return NextResponse.redirect(
    new URL("/writer/dashboard", origin),
    { headers: response.headers }
  );
}
