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
      // Display error message in the modal instead of crashing the UI
      setError(
        err?.response?.data?.message ||
          'Failed to create group. Please check the User IDs and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
        <h3 className="text-xl font-bold text-gray-800">Create New Group</h3>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Group Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg p-2 text-black mt-1 text-sm"
            placeholder="e.g. Project Team"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Participant User IDs (Comma separated)
          </label>
          <input
            type="text"
            required
            value={participantIds}
            onChange={(e) => setParticipantIds(e.target.value)}
            className="w-full border rounded-lg p-2 text-black mt-1 text-sm"
            placeholder="id1, id2, id3"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border rounded-lg text-sm text-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
};