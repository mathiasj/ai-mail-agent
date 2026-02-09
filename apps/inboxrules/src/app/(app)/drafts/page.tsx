'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadDrafts() {
    const { drafts: data } = await api.getDrafts();
    setDrafts(data);
    setLoading(false);
  }

  useEffect(() => {
    loadDrafts();
  }, []);

  async function handleSend(draftId: string) {
    await api.sendDraft(draftId);
    loadDrafts();
  }

  async function handleDelete(draftId: string) {
    await api.deleteDraft(draftId);
    loadDrafts();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Drafts</h1>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : drafts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No pending drafts</p>
          <p className="text-sm mt-1">
            AI-generated drafts will appear here for your approval.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map((draft) => (
            <div key={draft.id} className="border rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium">
                    Re: {draft.email?.subject || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-400">
                    To: {draft.email?.from || 'Unknown'}
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(draft.createdAt).toLocaleString()}
                </span>
              </div>

              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 bg-gray-50 rounded-lg p-4">
                {draft.content}
              </pre>

              <div className="flex gap-2 mt-4 justify-end">
                <button
                  onClick={() => handleDelete(draft.id)}
                  className="px-3 py-1.5 text-sm border rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Discard
                </button>
                <button
                  onClick={() => handleSend(draft.id)}
                  className="px-4 py-1.5 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700"
                >
                  Approve & Send
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
