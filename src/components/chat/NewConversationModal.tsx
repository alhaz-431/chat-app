"use client";

import { useEffect, useState } from "react";
import { X, Search, Users } from "lucide-react";
import clsx from "clsx";
import toast from "react-hot-toast";
import { searchUsers, startConversation, createGroup } from "@/lib/api";
import { User, Conversation } from "@/types";

interface NewConversationModalProps {
  onClose: () => void;
  onCreated: (conversation: Conversation) => void;
}

export default function NewConversationModal({
  onClose,
  onCreated,
}: NewConversationModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [selected, setSelected] = useState<User[]>([]);
  const [groupName, setGroupName] = useState("");
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  const isGroup = selected.length > 1;

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchUsers(trimmed);
        // TODO: confirm the real response shape (assuming User[] for now).
        setResults(Array.isArray(data) ? data : data.users ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 300); // debounce

    return () => clearTimeout(handle);
  }, [query]);

  function toggleSelect(user: User) {
    setSelected((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    );
  }

  async function handleCreate() {
    if (selected.length === 0 || creating) return;
    if (isGroup && !groupName.trim()) {
      toast.error("Give the group a name first.");
      return;
    }

    setCreating(true);
    try {
      const conversation = isGroup
        ? await createGroup(
            groupName.trim(),
            selected.map((u) => u.id)
          )
        : await startConversation(selected[0].id);
      onCreated(conversation);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Couldn't start the conversation. Try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[80vh] w-full max-w-md flex-col rounded-xl bg-[var(--surface)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h3 className="font-[family-name:var(--font-display)] font-semibold text-[var(--foreground)]">
            New conversation
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-[var(--border)] p-4">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or phone"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
            />
          </div>

          {selected.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selected.map((u) => (
                <button
                  key={u.id}
                  onClick={() => toggleSelect(u)}
                  className="flex items-center gap-1 rounded-full bg-[var(--accent)]/15 px-3 py-1 text-xs text-[var(--accent)]"
                >
                  {u.name} <X size={12} />
                </button>
              ))}
            </div>
          )}

          {isGroup && (
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              className="mt-3 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
            />
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {searching && (
            <p className="p-3 text-sm text-[var(--muted)]">Searching…</p>
          )}
          {!searching && query.trim() && results.length === 0 && (
            <p className="p-3 text-sm text-[var(--muted)]">No users found.</p>
          )}
          {results.map((user) => {
            const isSelected = selected.some((u) => u.id === user.id);
            return (
              <button
                key={user.id}
                onClick={() => toggleSelect(user)}
                className={clsx(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition",
                  isSelected ? "bg-[var(--accent)]/10" : "hover:bg-[var(--background)]"
                )}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)]/15 text-sm font-semibold text-[var(--accent)]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-[var(--muted)]">
                    {user.phone}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="border-t border-[var(--border)] p-4">
          <button
            onClick={handleCreate}
            disabled={selected.length === 0 || creating}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isGroup && <Users size={16} />}
            {creating
              ? "Starting…"
              : isGroup
              ? "Create group"
              : "Start conversation"}
          </button>
        </div>
      </div>
    </div>
  );
}