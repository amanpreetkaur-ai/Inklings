
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: logoutError } = await supabase.auth.signOut();

      if (logoutError) {
        throw logoutError;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setError("Could not log out. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={handleLogout}
        disabled={loading}
      >
        {loading ? "Logging out..." : "Log out"}
      </button>

      {error && <p role="alert">{error}</p>}
    </div>
  );
}
