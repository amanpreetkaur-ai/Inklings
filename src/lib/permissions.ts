
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: {
      supabaseUserId: user.id,
    },
    select: {
      id: true,
      role: true,
      username: true,
      displayName: true,
    },
  });

  if (!dbUser || dbUser.role !== "ADMIN") {
    redirect("/");
  }

  return dbUser;
}
