
"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

const allowedRoles = ["READER", "WRITER", "ADMIN"] as const;
type AllowedRole = (typeof allowedRoles)[number];

export async function updateUserProfile(
  userId: string,
  formData: {
    displayName: string;
    username: string;
    bio: string;
  }
) {
  const admin = await requireAdmin();

  try {
    const displayName = formData.displayName.trim();
    const username = formData.username.trim();
    const bio = formData.bio.trim();

    if (!userId || !displayName || !username) {
      return { success: false, message: "Required fields are missing." };
    }

    if (username.length < 3 || username.length > 30) {
      return { success: false, message: "Username must be 3–30 characters." };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return {
        success: false,
        message: "Username can only contain letters, numbers and underscores.",
      };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isPrimaryAdmin: true },
    });

    if (!targetUser) {
      return { success: false, message: "User not found." };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { displayName, username, bio },
    });

    revalidatePath("/admin/users");
    return { success: true, message: "User profile updated successfully." };
  } catch (error) {
    console.error("Profile update failed:", error);
    return {
      success: false,
      message: "Could not update profile. The username may already exist.",
    };
  }
}

export async function updateUserRole(userId: string, role: string) {
  const admin = await requireAdmin();

  try {
    if (!userId || !allowedRoles.includes(role as AllowedRole)) {
      return { success: false, message: "Invalid user or role." };
    }

    if (userId === admin.id) {
      return {
        success: false,
        message: "You cannot change your own role.",
      };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isPrimaryAdmin: true },
    });

    if (!targetUser) {
      return { success: false, message: "User not found." };
    }

    if (targetUser.isPrimaryAdmin) {
      return {
        success: false,
        message: "The primary administrator's role is protected.",
      };
    }

    if (role === "ADMIN" && !admin.isPrimaryAdmin) {
      return {
        success: false,
        message: "Only the primary administrator can assign Admin roles.",
      };
    }

    if (targetUser.role === "ADMIN" && !admin.isPrimaryAdmin) {
      return {
        success: false,
        message: "Only the primary administrator can change an Admin role.",
      };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: role as AllowedRole },
    });

    revalidatePath("/admin/users");
    return { success: true, message: "User role updated successfully." };
  } catch (error) {
    console.error("Role update failed:", error);
    return {
      success: false,
      message: "Could not update the user's role.",
    };
  }
}
