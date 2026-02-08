'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useSSE } from '@/lib/hooks/useSSE';

interface Email {
  id: string;
  accountId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  category: string | null;
  priority: number | null;
  summary: string | null;
  read: boolean;
  archived: boolean;
  receivedAt: string;
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  'action-required': { bg: 'bg-red-100', text: 'text-red-800' },
  fyi: { bg: 'bg-blue-100', text: 'text-blue-800' },
  meeting: { bg: 'bg-purple-100', text: 'text-purple-800' },
  newsletter: { bg: 'bg-gray-100', text: 'text-gray-800' },
  automated: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  spam: { bg: 'bg-orange-100', text: 'text-orange-800' },
};

const CATEGORIES = ['all', 'action-required', 'fyi', 'meeting', 'newsletter', 'automated', 'spam'];

export default function InboxPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<{ unread: number; categories: any[] }>({
    unread: 0,
    categories: [],
  });

  const loadEmails = useCallback(async () => {
    const params: Record<string, string> = { archived: 'false' };
    if (category !== 'all') params.category = category;
    if (search) params.search = search;
    const { emails: data } = await api.getEmails(params);
    setEmails(data);
    setLoading(false);
  }, [category, search]);

  const loadStats = useCallback(async () => {
    const data = await api.getEmailStats();
    setStats(data);
  }, []);

  useEffect(() => {
    loadEmails();
    loadStats();
  }, [loadEmails, loadStats]);

  // Real-time updates
  const handleSSEEvent = useCallback(
    (event: { type: string; data: any }) => {
      if (event.type === 'new_email' || event.type === 'email_classified') {
        loadEmails();
        loadStats();
      }
    },
    [loadEmails, loadStats]
  );
  useSSE(handleSSEEvent);

  async function selectEmail(email: Email) {
    const { email: full } = await api.getEmail(email.id);
    setSelectedEmail(full);
    // Update local read state
    setEmails((prev) => prev.map((e) => (e.id === email.id ? { ...e, read: true } : e)));
    loadStats();
  }

  async function archiveEmail(id: string) {
    await api.archiveEmail(id);
    setEmails((prev) => prev.filter((e) => e.id !== id));
    if (selectedEmail?.id === id) setSelectedEmail(null);
    loadStats();
  }

  async function generateDraft(emailId: string) {
    await api.generateDraft(emailId);
  }

  return (
    <div className="flex h-full">
      {/* Email list */}
      <div className="w-[420px] border-r flex flex-col">
        {/* Search + filters */}
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Inbox</h1>
            {stats.unread > 0 && (
              <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
                {stats.unread} unread
              </span>
            )}
          </div>
          <input
            type="text"
            placeholder="Search emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <div className="flex gap-1 overflow-x-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
                  category === cat
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Email list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : emails.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No emails found</div>
          ) : (
            emails.map((email) => (
              <button
                key={email.id}
                onClick={() => selectEmail(email)}
                className={`w-full text-left p-4 border-b hover:bg-gray-50 transition ${
                  selectedEmail?.id === email.id ? 'bg-brand-50' : ''
                } ${!email.read ? 'bg-white' : 'bg-gray-50/50'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm truncate ${!email.read ? 'font-semibold' : 'font-medium text-gray-700'}`}>
                      {email.from}
                    </p>
                    <p className="text-sm truncate mt-0.5">{email.subject}</p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                      {email.summary || email.snippet}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-gray-400">
                      {new Date(email.receivedAt).toLocaleDateString()}
                    </span>
                    {email.category && (
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          CATEGORY_STYLES[email.category]?.bg || 'bg-gray-100'
                        } ${CATEGORY_STYLES[email.category]?.text || 'text-gray-800'}`}
                      >
                        {email.category}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Email viewer */}
      <div className="flex-1 overflow-y-auto">
        {selectedEmail ? (
          <div className="p-6 max-w-3xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">{selectedEmail.subject}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  From: <span className="font-medium">{selectedEmail.from}</span>
                </p>
                <p className="text-sm text-gray-400">
                  {new Date(selectedEmail.receivedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => generateDraft(selectedEmail.id)}
                  className="px-3 py-1.5 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 transition"
                >
                  Draft Reply
                </button>
                <button
                  onClick={() => archiveEmail(selectedEmail.id)}
                  className="px-3 py-1.5 border text-sm rounded-lg hover:bg-gray-50 transition"
                >
                  Archive
                </button>
              </div>
            </div>

            {/* AI Summary */}
            {selectedEmail.summary && (
              <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 mb-6">
                <p className="text-xs font-medium text-brand-700 mb-1">AI Summary</p>
                <p className="text-sm text-brand-900">{selectedEmail.summary}</p>
                {selectedEmail.entities && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedEmail.entities.people?.map((p: string) => (
                      <span key={p} className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded">
                        {p}
                      </span>
                    ))}
                    {selectedEmail.entities.dates?.map((d: string) => (
                      <span key={d} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        {d}
                      </span>
                    ))}
                    {selectedEmail.entities.amounts?.map((a: string) => (
                      <span key={a} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Email body */}
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
                {selectedEmail.body}
              </pre>
            </div>

            {/* Drafts */}
            {selectedEmail.drafts?.length > 0 && (
              <div className="mt-8 border-t pt-6">
                <h3 className="text-sm font-semibold mb-4">AI Drafts</h3>
                {selectedEmail.drafts.map((draft: any) => (
                  <DraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            Select an email to view
          </div>
        )}
      </div>
    </div>
  );
}

function DraftCard({ draft }: { draft: any }) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(draft.content);
  const [sending, setSending] = useState(false);

  async function handleSend() {
    setSending(true);
    try {
      if (content !== draft.content) {
        await api.updateDraft(draft.id, content);
      }
      await api.sendDraft(draft.id);
    } catch (err) {
      console.error('Failed to send draft:', err);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border rounded-lg p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">
          {draft.sent ? 'Sent' : draft.approved ? 'Approved' : 'Pending approval'}
        </span>
        <div className="flex gap-2">
          {!draft.sent && (
            <>
              <button
                onClick={() => setEditing(!editing)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {editing ? 'Preview' : 'Edit'}
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="text-xs bg-brand-600 text-white px-3 py-1 rounded hover:bg-brand-700 disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Approve & Send'}
              </button>
            </>
          )}
        </div>
      </div>
      {editing ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full border rounded p-3 text-sm min-h-[150px] focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      ) : (
        <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">{content}</pre>
      )}
    </div>
  );
}
