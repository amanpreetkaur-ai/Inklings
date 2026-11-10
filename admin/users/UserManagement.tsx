
"use client";

import { useState } from "react";
import { updateUserProfile, updateUserRole } from "./actions";

type UserData = {
  id: string;
  displayName: string;
  username: string;
  bio: string | null;
  role: "READER" | "WRITER" | "ADMIN";
  isActive: boolean;
  isPrimaryAdmin: boolean;
};

type Props = {
  user: UserData;
  canAssignAdmin: boolean;
  currentAdminId: string;
};

export default function UserManagement({
  user,
  canAssignAdmin,
  currentAdminId,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio ?? "");
  const [role, setRole] = useState(user.role);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isSelf = user.id === currentAdminId;
  const protectedUser = user.isPrimaryAdmin;

  async function saveProfile() {
    setLoading(true);
    setMessage("");

    const result = await updateUserProfile(user.id, {
      displayName,
      username,
      bio,
    });

    setMessage(result.message);
    setLoading(false);

    if (result.success) setEditing(false);
  }

  async function saveRole(newRole: "READER" | "WRITER" | "ADMIN") {
    setLoading(true);
    setMessage("");

    const result = await updateUserRole(user.id, newRole);

    setMessage(result.message);
    setLoading(false);

    if (result.success) setRole(newRole);
  }

  return (
    <div className="admin-user-actions">
      {editing ? (
        <div className="admin-user-edit">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display name"
          />

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />

          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Bio"
          />

          <button onClick={saveProfile} disabled={loading}>
            {loading ? "Saving..." : "Save Profile"}
          </button>

          <button onClick={() => setEditing(false)} disabled={loading}>
            Cancel
          </button>
        </div>
      ) : (
        <button onClick={() => setEditing(true)}>
          Edit Profile
        </button>
      )}

      <select
        value={role}
        disabled={
          loading ||
          protectedUser ||
          isSelf ||
          (!canAssignAdmin && (role === "ADMIN"))
        }
        onChange={(e) =>
          saveRole(e.target.value as "READER" | "WRITER" | "ADMIN")
        }
      >
        <option value="READER">Reader</option>
        <option value="WRITER">Writer</option>
        {canAssignAdmin && <option value="ADMIN">Admin</option>}
        {!canAssignAdmin && role === "ADMIN" && (
          <option value="ADMIN">Admin</option>
        )}
      </select>

      {protectedUser && (
        <small>Primary administrator — protected</small>
      )}

      {message && <p role="status">{message}</p>}
    </div>
  );
}
