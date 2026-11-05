
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/writer/login?error=confirmation", origin)
    );
  }

  const response = NextResponse.redirect(
    new URL("/writer/dashboard", origin)
  );

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

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/writer/login?error=confirmation", origin)
    );
  }

  return response;
}
