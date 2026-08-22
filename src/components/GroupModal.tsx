import { useState } from 'react';
import { api } from '@/lib/api';

export const GroupModal = ({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}) => {
  const [name, setName] = useState('');
  const [participantIds, setParticipantIds] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const ids = participantIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

      await api.post('/conversations/group', {
        name,
        participantIds: ids,
      });

      // Reset Form State
      setName('');
      setParticipantIds('');

      onCreated();
      onClose();
    } catch (err: any) {
      console.error('Group Creation Error:', err);
      setError(
        err?.response?.data?.message ||
          'Failed to create group. Please check the User IDs and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <form onSubmit={handleSubmit} className="bg-[#121829] border border-[#1E2436] rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-slate-100">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Create New Group</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Group Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#1E2436] border border-[#2A324B] rounded-2xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all"
            placeholder="e.g. Project Team"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Participant User IDs (Comma separated)
          </label>
          <input
            type="text"
            required
            value={participantIds}
            onChange={(e) => setParticipantIds(e.target.value)}
            className="w-full bg-[#1E2436] border border-[#2A324B] rounded-2xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all"
            placeholder="id1, id2, id3"
          />
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-2xl bg-[#1E2436] hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all border border-[#2A324B]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl text-xs font-semibold transition-all shadow-lg shadow-violet-600/30 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </form>
    </div>
  );
};