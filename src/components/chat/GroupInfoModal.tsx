"use client";

import { useState } from "react";
import { X, Crown, UserMinus, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import {
  renameGroup,
  addParticipants,
  removeParticipant,
  promoteAdmin,
  searchUsers,
} from "@/lib/api";
import { Conversation, User } from "@/types";

interface GroupInfoModalProps {
  conversation: Conversation;
  currentUserId: string;
  onClose: () => void;
  onUpdated: (conversation: Conversation) => void;
}

export default function GroupInfoModal({
  conversation,
  currentUserId,
  onClose,
  onUpdated,
}: GroupInfoModalProps) {
  const [name, setName] = useState(conversation.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [addQuery, setAddQuery] = useState("");
  const [addResults, setAddResults] = useState<User[]>([]);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const isAdmin = conversation.adminIds?.includes(currentUserId) ?? false;

  async function handleRename() {
    if (!name.trim() || name === conversation.name) return;
    setSavingName(true);
    try {
      const updated = await renameGroup(conversation.id, name.trim());
      onUpdated(updated);
      toast.success("Group renamed.");
    } catch {
      toast.error("Couldn't rename the group.");
    } finally {
      setSavingName(false);
    }
  }

  async function handleAddSearch(q: string) {
    setAddQuery(q);
    if (!q.trim()) {
      setAddResults([]);
      return;
    }
    try {
      const data = await searchUsers(q.trim());
      const users: User[] = Array.isArray(data) ? data : data.users ?? [];
      const existingIds = new Set(conversation.participants.map((p) => p.id));
      setAddResults(users.filter((u) => !existingIds.has(u.id)));
    } catch {
      // silent — search box just shows nothing
    }
  }

  async function handleAdd(userId: string) {
    setBusyUserId(userId);
    try {
      const updated = await addParticipants(conversation.id, [userId]);
      onUpdated(updated);
      setAddQuery("");
      setAddResults([]);
      toast.success("Member added.");
    } catch {
      toast.error("Couldn't add member.");
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleRemove(userId: string) {
    setBusyUserId(userId);
    try {
      const updated = await removeParticipant(conversation.id, userId);
      onUpdated(updated);
      toast.success("Member removed.");
    } catch {
      toast.error("Couldn't remove member.");
    } finally {
      setBusyUserId(null);
    }
  }

  async function handlePromote(userId: string) {
    setBusyUserId(userId);
    try {
      const updated = await promoteAdmin(conversation.id, userId);
      onUpdated(updated);
      toast.success("Promoted to admin.");
    } catch {
      toast.error("Couldn't promote member.");
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[80vh] w-full max-w-md flex-col rounded-xl bg-[var(--surface)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h3 className="font-[family-name:var(--font-display)] font-semibold text-[var(--foreground)]">
            Group info
          </h3>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)]">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
              Group name
            </label>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isAdmin}
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] disabled:opacity-60"
              />
              {isAdmin && (
                <button
                  onClick={handleRename}
                  disabled={savingName}
                  className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm text-[var(--accent-foreground)] disabled:opacity-50"
                >
                  Save
                </button>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-[var(--muted)]">
              Members ({conversation.participants.length})
            </p>
            <ul className="space-y-1">
              {conversation.participants.map((p) => {
                const isParticipantAdmin = conversation.adminIds?.includes(p.id);
                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-[var(--background)]"
                  >
                    <span className="flex items-center gap-1.5 text-sm text-[var(--foreground)]">
                      {p.name}
                      {isParticipantAdmin && (
                        <Crown size={13} className="text-[var(--accent)]" />
                      )}
                      {p.id === currentUserId && (
                        <span className="text-xs text-[var(--muted)]">(you)</span>
                      )}
                    </span>
                    {isAdmin && p.id !== currentUserId && (
                      <div className="flex items-center gap-2">
                        {!isParticipantAdmin && (
                          <button
                            onClick={() => handlePromote(p.id)}
                            disabled={busyUserId === p.id}
                            title="Promote to admin"
                            className="text-[var(--muted)] hover:text-[var(--accent)]"
                          >
                            <Crown size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemove(p.id)}
                          disabled={busyUserId === p.id}
                          title="Remove member"
                          className="text-[var(--muted)] hover:text-[var(--danger)]"
                        >
                          <UserMinus size={14} />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {isAdmin && (
            <div>
              <p className="mb-2 text-xs font-medium text-[var(--muted)]">
                Add member
              </p>
              <input
                value={addQuery}
                onChange={(e) => handleAddSearch(e.target.value)}
                placeholder="Search by name or phone"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
              />
              {addResults.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {addResults.map((u) => (
                    <li key={u.id}>
                      <button
                        onClick={() => handleAdd(u.id)}
                        disabled={busyUserId === u.id}
                        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-[var(--background)]"
                      >
                        <span>{u.name}</span>
                        <UserPlus size={14} className="text-[var(--accent)]" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}