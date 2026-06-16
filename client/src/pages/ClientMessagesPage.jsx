import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/ui/page-header.jsx';
import {
  useGetPortalThreadsQuery,
  useGetPortalMessagesQuery,
  useSendPortalMessageMutation,
} from '../services/portalApi.js';
import { MessagesSquare, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ClientMessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: threadData, isLoading } = useGetPortalThreadsQuery();
  const threads = useMemo(() => threadData?.data || [], [threadData]);

  const [activeId, setActiveId] = useState(searchParams.get('projectId') || '');

  useEffect(() => {
    if (!activeId && threads.length) setActiveId(threads[0].project._id);
  }, [threads, activeId]);

  const { data: msgData, isFetching } = useGetPortalMessagesQuery(activeId, { skip: !activeId });
  const messages = useMemo(() => msgData?.data || [], [msgData]);
  const [sendMessage, { isLoading: isSending }] = useSendPortalMessageMutation();
  const [body, setBody] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeThread = threads.find((t) => t.project._id === activeId);

  const selectThread = (pid) => {
    setActiveId(pid);
    setSearchParams({ projectId: pid });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = body.trim();
    if (!text || !activeId) return;
    try {
      await sendMessage({ projectId: activeId, body: text }).unwrap();
      setBody('');
    } catch (err) {
      toast.error(err.data?.message || 'Failed to send reply');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Messages"
        subtitle="Replies to clients about the projects you manage"
      />

      {isLoading ? (
        <p className="py-12 text-center text-slate-400">Loading conversations…</p>
      ) : threads.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900/50">
          <MessagesSquare className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h4 className="font-bold text-slate-700 dark:text-slate-300">No client messages yet</h4>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">
            When a client messages you about a project, the conversation appears here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
          {/* Thread list */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <ul className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
              {threads.map((t) => {
                const isActive = t.project._id === activeId;
                return (
                  <li key={t.project._id}>
                    <button
                      onClick={() => selectThread(t.project._id)}
                      className={`flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-950/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                          {t.client?.companyName || 'Client'}
                        </span>
                        {t.unread > 0 && (
                          <span className="shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                            {t.unread}
                          </span>
                        )}
                      </div>
                      <span className="truncate text-[11px] text-slate-400">{t.project.name}</span>
                      <span className="truncate text-[11px] text-slate-400">
                        {t.lastMessage.fromClient ? '' : 'You: '}
                        {t.lastMessage.body}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Thread */}
          <div className="flex h-[60vh] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-800">
              <p className="font-bold text-slate-800 dark:text-slate-100">
                {activeThread?.client?.companyName || 'Client'}
              </p>
              <p className="text-[11px] text-slate-400">{activeThread?.project?.name}</p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {isFetching && messages.length === 0 ? (
                <p className="text-center text-sm text-slate-400">Loading…</p>
              ) : (
                messages.map((m) => {
                  const fromClient = m.fromClient;
                  return (
                    <div key={m._id} className={`flex ${fromClient ? 'justify-start' : 'justify-end'}`}>
                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${
                          fromClient
                            ? 'rounded-bl-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                            : 'rounded-br-sm bg-blue-600 text-white'
                        }`}
                      >
                        <p className="mb-0.5 text-[11px] font-bold opacity-70">
                          {m.sender?.firstName} {m.sender?.lastName}
                        </p>
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        <p className={`mt-1 text-[10px] ${fromClient ? 'text-slate-400' : 'text-blue-100/80'}`}>
                          {new Date(m.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 border-t border-slate-100 p-3 dark:border-slate-800"
            >
              <input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write a reply…"
                className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={isSending || !body.trim()}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
