
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const next = searchParams.get("next");

  // Allow only local paths to prevent external redirect attacks.
  const redirectTo =
    next?.startsWith("/") && !next.startsWith("//")
      ? next
      : "/dashboard";

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=confirmation", origin)
    );
  }

  try {
    const supabase = await createClient();

    const { error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        new URL("/login?error=confirmation", origin)
      );
    }

    return NextResponse.redirect(new URL(redirectTo, origin));
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=confirmation", origin)
    );
  }
}
